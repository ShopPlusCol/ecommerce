import { eq } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
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
  | { status: "already_recorded" }
  | { status: "no_consent" }
  | { status: "failed"; error: string };

/**
 * Emite el evento Purchase una sola vez por pedido.
 *
 * La compra es el único evento que nunca se dispara desde el navegador: se
 * emite aquí, cuando el pedido ya existe y alcanzó el estado configurado.
 * Así recargar la página de confirmación —o que Meta reintente un webhook—
 * no infla las conversiones.
 *
 * La garantía de "una sola vez" no depende de comprobar-y-luego-escribir
 * (que dos entregas concurrentes del mismo webhook podrían saltarse), sino
 * del índice único de `analytics_events.event_id`: quien logra insertar la
 * fila es quien envía a Meta; el resto ve un conflicto y se retira.
 */
export async function emitPurchaseEventOnce(input: PurchaseEventInput): Promise<PurchaseEventOutcome> {
  if (!input.marketingConsent) return { status: "no_consent" };

  const db = await getRuntimeDb();
  // Estable por pedido: el mismo id lo reclamen quien lo reclame (creación
  // directa del pedido o webhook de pago).
  const eventId = `purchase:${input.orderId}`;

  const claimed = await db
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
    })
    .onConflictDoNothing()
    .returning({ id: analyticsEvents.id });

  if (claimed.length === 0) return { status: "already_recorded" };

  const result = await sendMetaServerEvent(
    {
      eventName: "Purchase",
      eventId,
      eventSourceUrl: input.eventSourceUrl,
      value: input.value,
      currency: "COP",
      orderId: input.orderId,
      userData: { email: input.email ?? undefined, phone: input.phone ?? undefined },
    },
    {},
  );

  if (!result.ok) {
    return { status: "failed", error: result.error };
  }

  await db
    .update(analyticsEvents)
    .set({ sentToServer: true })
    .where(eq(analyticsEvents.id, claimed[0].id));

  return { status: "sent" };
}
