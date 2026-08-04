"use server";

import { headers } from "next/headers";
import { cookies } from "next/headers";
import { z } from "zod";
import type { ConversionEvent, ConversionEventName } from "@/application/ports/analytics-provider";
import { sendMetaServerEvent } from "@/modules/analytics/meta-server-events";

/**
 * Eventos que el navegador puede pedir reenviar por Conversions API.
 *
 * `Purchase` **no** está en la lista a propósito: una compra solo se
 * reporta desde el servidor cuando el pedido existe y alcanza el estado
 * configurado (ver `createDemoOrderAction` y el webhook de pagos). Aceptarlo
 * aquí permitiría inflar compras recargando la página de confirmación.
 */
const CLIENT_FORWARDABLE_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToWishlist",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Contact",
] as const satisfies readonly ConversionEventName[];

const schema = z.object({
  eventName: z.enum(CLIENT_FORWARDABLE_EVENTS),
  // Mismo id que ya usó el píxel en el navegador: es lo que permite a Meta
  // unir ambos envíos en un solo evento en vez de contarlo dos veces.
  eventId: z.string().trim().min(8).max(120),
  eventSourceUrl: z.string().trim().url().max(500),
  value: z.number().nonnegative().max(100_000_000).optional(),
  contentIds: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  contentType: z.enum(["product", "product_group"]).optional(),
});

/**
 * Reenvía por servidor un evento que el navegador ya envió por el píxel.
 *
 * Solo actúa si hay consentimiento de marketing: el cliente lo comprueba
 * antes de llamar, y aquí se vuelve a exigir con la cookie de
 * consentimiento, porque una server action es un endpoint público y no
 * puede confiar en que quien la invoca sea el propio front.
 */
export async function forwardConversionEventAction(input: unknown): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const cookieStore = await cookies();
  const consentRaw = cookieStore.get("shoppluscol_consent")?.value;
  let marketingConsent = false;
  try {
    marketingConsent = consentRaw ? Boolean(JSON.parse(decodeURIComponent(consentRaw)).marketing) : false;
  } catch {
    marketingConsent = false;
  }
  if (!marketingConsent) return { ok: false };

  const headerList = await headers();
  const event: ConversionEvent = {
    eventName: parsed.data.eventName,
    eventId: parsed.data.eventId,
    eventSourceUrl: parsed.data.eventSourceUrl,
    value: parsed.data.value,
    currency: parsed.data.value === undefined ? undefined : "COP",
    contentIds: parsed.data.contentIds,
    contentType: parsed.data.contentType,
  };

  const result = await sendMetaServerEvent(event, {
    clientIpAddress: headerList.get("cf-connecting-ip") ?? headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    clientUserAgent: headerList.get("user-agent"),
    fbc: cookieStore.get("_fbc")?.value ?? null,
    fbp: cookieStore.get("_fbp")?.value ?? null,
  });

  return { ok: result.ok };
}
