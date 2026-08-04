"use server";

import { cookies, headers } from "next/headers";
import type { ConversionEvent } from "@/application/ports/analytics-provider";
import { catalogRepository } from "@/lib/container";
import { sendMetaServerEvent } from "@/modules/analytics/meta-server-events";
import { forwardEventSchema, isAllowedEventSourceUrl } from "@/modules/analytics/forward-event-policy";
import { enforceRateLimit, RateLimitError } from "@/modules/security/rate-limit";

/** Eventos cuyo importe tiene sentido y se resuelve desde el catálogo. */
const VALUED_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "Contact"]);

/**
 * Calcula el importe en servidor a partir del catálogo real. El navegador
 * nunca manda el valor: de él dependen el ROAS y el aprendizaje de las
 * campañas, así que un número inventable no puede ser la fuente.
 */
async function resolveValue(
  eventName: string,
  contentIds: string[] | undefined,
  quantities: number[] | undefined,
): Promise<number | undefined> {
  if (!VALUED_EVENTS.has(eventName) || !contentIds?.length) return undefined;
  const products = await catalogRepository.getProductsByIds(contentIds);
  if (!products.length) return undefined;
  let total = 0;
  contentIds.forEach((id, index) => {
    const product = products.find((candidate) => candidate.id === id);
    if (!product) return;
    const quantity = quantities?.[index] ?? 1;
    total += product.price.amount * quantity;
  });
  return total > 0 ? total : undefined;
}

/**
 * Reenvía por servidor un evento que el navegador ya envió por el píxel,
 * con el mismo `event_id` para que Meta lo deduplique.
 *
 * Es un **endpoint público**: una server action se puede invocar desde
 * fuera de la tienda, así que aquí no se confía en nada del cliente. Se
 * exige consentimiento por cookie, se acota el origen, se limita la tasa,
 * se impide reutilizar el mismo `event_id` y se valida el contenido según
 * el tipo de evento. Nunca lanza hacia el navegador: la analítica no puede
 * romper la navegación.
 */
export async function forwardConversionEventAction(input: unknown): Promise<{ ok: boolean }> {
  const parsed = forwardEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { eventName, eventId, eventSourceUrl, payload } = parsed.data;

  const cookieStore = await cookies();
  const headerList = await headers();

  // 1. Consentimiento de marketing, comprobado en servidor: el cliente ya lo
  //    verifica, pero no puede ser la única barrera.
  let marketingConsent = false;
  try {
    const raw = cookieStore.get("shoppluscol_consent")?.value;
    marketingConsent = raw ? Boolean(JSON.parse(decodeURIComponent(raw)).marketing) : false;
  } catch {
    marketingConsent = false;
  }
  if (!marketingConsent) return { ok: false };

  // 2. Origen: solo el dominio configurado o el de la propia petición.
  const requestOrigin = headerList.get("origin");
  const host = headerList.get("host");
  const forwardedProto = headerList.get("x-forwarded-proto") ?? "http";
  if (
    !isAllowedEventSourceUrl(eventSourceUrl, [
      process.env.NEXT_PUBLIC_SITE_URL,
      requestOrigin,
      host ? `${forwardedProto}://${host}` : null,
    ])
  ) {
    return { ok: false };
  }

  try {
    // 3. Tasa por IP (la IP se hashea, no se almacena en claro).
    await enforceRateLimit("analytics-forward", 120, 60);
    // 4. Un mismo event_id no se puede reenviar repetidamente para inflar
    //    una conversión. El límite es 1 por hora y por origen.
    await enforceRateLimit(`analytics-event:${eventId}`, 1, 3600);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false };
    return { ok: false };
  }

  const contentIds = payload.contentIds as string[] | undefined;
  const quantities = payload.quantities as number[] | undefined;
  const value = await resolveValue(eventName, contentIds, quantities);

  const event: ConversionEvent = {
    eventName,
    eventId,
    eventSourceUrl,
    value,
    currency: value === undefined ? undefined : "COP",
    contentIds,
    contentType: contentIds?.length ? "product" : undefined,
  };

  const result = await sendMetaServerEvent(event, {
    // Señales de la petición que Meta necesita para emparejar. No se
    // guardan en base de datos ni se registran.
    clientIpAddress:
      headerList.get("cf-connecting-ip") ?? headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    clientUserAgent: headerList.get("user-agent"),
    fbc: cookieStore.get("_fbc")?.value ?? null,
    fbp: cookieStore.get("_fbp")?.value ?? null,
  });

  if (!result.ok) {
    // Solo nombre del evento y motivo saneado: nunca el payload, la URL
    // completa, la IP ni el cuerpo de la respuesta de Meta.
    console.warn(JSON.stringify({ level: "warn", scope: "analytics.forward", eventName, reason: result.error }));
  }

  return { ok: result.ok };
}
