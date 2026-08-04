import { and, eq, lte, ne, sql } from "drizzle-orm";
import { getRuntimeDb, type Db } from "@/infrastructure/db/client";
import { analyticsEvents } from "@/infrastructure/db/schema";
import { sendMetaServerEvent } from "@/modules/analytics/meta-server-events";

export type PurchaseEventInput = {
  orderId: string;
  value: number;
  eventSourceUrl: string;
  email?: string | null;
  phone?: string | null;
  utmSource?: string | null;
  utmCampaign?: string | null;
  /** Consentimiento de marketing registrado con el pedido. */
  marketingConsent: boolean;
};

export type PurchaseEventOutcome =
  | { status: "sent" }
  /** Ya se entregó a Meta anteriormente: no se reenvía. */
  | { status: "already_sent" }
  /** Otro proceso lo tiene reclamado, o todavía no vence el reintento. */
  | { status: "claimed_elsewhere" }
  | { status: "no_consent" }
  /** Falló el envío, pero queda registrado y se puede reintentar. */
  | { status: "failed"; error: string; nextRetryAt: Date };

/** Espera antes de que otro proceso pueda reclamar el reintento. */
const FIRST_RETRY_DELAY_MS = 60_000;
const MAX_RETRY_DELAY_MS = 3_600_000;
/** Tras estos intentos se deja de reintentar automáticamente. */
export const MAX_PURCHASE_ATTEMPTS = 8;

/** Espera exponencial: 1, 2, 4... minutos, con techo de una hora. */
function backoffMs(attempts: number): number {
  return Math.min(FIRST_RETRY_DELAY_MS * 2 ** Math.max(0, attempts - 1), MAX_RETRY_DELAY_MS);
}

export function purchaseEventId(orderId: string): string {
  // Anclado al pedido, no al pago: un pedido con dos pagos (reintento, pago
  // parcial) sigue siendo una sola compra.
  return `purchase:${orderId}`;
}

/**
 * Intenta quedarse con el derecho a enviar esta compra.
 *
 * Devuelve `"claimed"` solo a quien debe enviar. La exclusión no depende de
 * comprobar-y-luego-escribir (que dos webhooks simultáneos se saltarían),
 * sino de dos escrituras atómicas:
 *
 * - El INSERT choca con el índice único de `event_id`: solo uno entra, y ya
 *   nace con `next_retry_at` en el futuro, así que el webhook concurrente
 *   que pierde tampoco puede reclamarlo como reintento.
 * - El UPDATE de reclamo exige `delivery_status <> 'sent'` y que el
 *   reintento esté vencido, y desplaza `next_retry_at` en la misma
 *   sentencia. Quien obtiene fila es el único que envía.
 */
async function claimForSend(
  db: Db,
  eventId: string,
  input: PurchaseEventInput,
  now: Date,
): Promise<{ outcome: "claimed"; attempts: number } | { outcome: "already_sent" | "claimed_elsewhere" }> {
  const inserted = await db
    .insert(analyticsEvents)
    .values({
      eventName: "Purchase",
      eventId,
      orderId: input.orderId,
      value: input.value,
      currency: "COP",
      utmSource: input.utmSource ?? null,
      utmCampaign: input.utmCampaign ?? null,
      sentToServer: false,
      sentToBrowser: false,
      deliveryStatus: "pending",
      attempts: 1,
      lastAttemptAt: now,
      nextRetryAt: new Date(now.getTime() + FIRST_RETRY_DELAY_MS),
    })
    .onConflictDoNothing()
    .returning({ id: analyticsEvents.id });

  if (inserted.length > 0) return { outcome: "claimed", attempts: 1 };

  const [existing] = await db
    .select({ deliveryStatus: analyticsEvents.deliveryStatus, attempts: analyticsEvents.attempts })
    .from(analyticsEvents)
    .where(eq(analyticsEvents.eventId, eventId))
    .limit(1);
  if (existing?.deliveryStatus === "sent") return { outcome: "already_sent" };

  const nextAttempts = (existing?.attempts ?? 0) + 1;
  const reclaimed = await db
    .update(analyticsEvents)
    .set({
      deliveryStatus: "pending",
      attempts: sql`${analyticsEvents.attempts} + 1`,
      lastAttemptAt: now,
      nextRetryAt: new Date(now.getTime() + backoffMs(nextAttempts)),
    })
    .where(
      and(
        eq(analyticsEvents.eventId, eventId),
        ne(analyticsEvents.deliveryStatus, "sent"),
        lte(analyticsEvents.nextRetryAt, now),
      ),
    )
    .returning({ id: analyticsEvents.id });

  return reclaimed.length > 0 ? { outcome: "claimed", attempts: nextAttempts } : { outcome: "claimed_elsewhere" };
}

async function deliver(
  db: Db,
  eventId: string,
  input: PurchaseEventInput,
  attempts: number,
  now: Date,
): Promise<PurchaseEventOutcome> {
  const result = await sendMetaServerEvent({
    eventName: "Purchase",
    eventId,
    eventSourceUrl: input.eventSourceUrl,
    value: input.value,
    currency: "COP",
    orderId: input.orderId,
    userData: { email: input.email ?? undefined, phone: input.phone ?? undefined },
  });

  if (result.ok) {
    await db
      .update(analyticsEvents)
      .set({ deliveryStatus: "sent", sentToServer: true, nextRetryAt: null, lastErrorCode: null })
      .where(eq(analyticsEvents.eventId, eventId));
    return { status: "sent" };
  }

  const nextRetryAt = new Date(now.getTime() + backoffMs(attempts));
  await db
    .update(analyticsEvents)
    .set({
      deliveryStatus: "failed",
      // Solo el motivo saneado que devuelve el proveedor (código de estado),
      // nunca el cuerpo de la respuesta de Meta.
      lastErrorCode: result.error.slice(0, 120),
      nextRetryAt,
    })
    .where(eq(analyticsEvents.eventId, eventId));
  return { status: "failed", error: result.error, nextRetryAt };
}

/**
 * Emite el evento Purchase como máximo una vez por pedido, pero **sin
 * perderlo** si Meta falla.
 *
 * La compra es el único evento que nunca se dispara desde el navegador:
 * recargar la confirmación no puede inflar conversiones. Y una caída
 * temporal de Meta ya no descarta la compra: queda `failed` con su próximo
 * reintento, recuperable con `recoverPendingPurchaseEvents`.
 */
export async function emitPurchaseEventOnce(
  input: PurchaseEventInput,
  now = new Date(),
): Promise<PurchaseEventOutcome> {
  if (!input.marketingConsent) return { status: "no_consent" };

  const db = await getRuntimeDb();
  const eventId = purchaseEventId(input.orderId);

  const claim = await claimForSend(db, eventId, input, now);
  if (claim.outcome !== "claimed") return { status: claim.outcome };

  return deliver(db, eventId, input, claim.attempts, now);
}

export type RecoverySummary = { considered: number; sent: number; failed: number };

/**
 * Reintenta las compras que quedaron sin entregar y cuyo reintento ya
 * venció. Es segura de llamar en cualquier momento y desde cualquier
 * proceso: cada evento se vuelve a reclamar con la misma escritura atómica,
 * así que dos ejecuciones simultáneas no duplican envíos.
 *
 * Hoy no hay un planificador en la arquitectura, así que no se ejecuta
 * sola: se invoca a mano o desde el panel. Documentado en
 * `docs/ANALYTICS_EVENTS.md`.
 */
export async function recoverPendingPurchaseEvents(
  options: { limit?: number; now?: Date } = {},
): Promise<RecoverySummary> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 50;
  const db = await getRuntimeDb();

  const pending = await db
    .select({
      eventId: analyticsEvents.eventId,
      orderId: analyticsEvents.orderId,
      value: analyticsEvents.value,
      attempts: analyticsEvents.attempts,
      utmSource: analyticsEvents.utmSource,
      utmCampaign: analyticsEvents.utmCampaign,
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventName, "Purchase"),
        ne(analyticsEvents.deliveryStatus, "sent"),
        lte(analyticsEvents.nextRetryAt, now),
      ),
    )
    .limit(limit);

  const summary: RecoverySummary = { considered: pending.length, sent: 0, failed: 0 };

  for (const row of pending) {
    if (!row.orderId || row.attempts >= MAX_PURCHASE_ATTEMPTS) continue;
    // El consentimiento ya se comprobó cuando se creó la fila: si el evento
    // existe, es porque en su momento hubo consentimiento de marketing.
    const outcome = await emitPurchaseEventOnce(
      {
        orderId: row.orderId,
        value: row.value ?? 0,
        eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout/confirmacion`,
        utmSource: row.utmSource,
        utmCampaign: row.utmCampaign,
        marketingConsent: true,
      },
      now,
    );
    if (outcome.status === "sent") summary.sent += 1;
    else if (outcome.status === "failed") summary.failed += 1;
  }

  return summary;
}
