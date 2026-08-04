import { z } from "zod";
import type { ConversionEventName } from "@/application/ports/analytics-provider";

/**
 * Eventos que el navegador puede pedir reenviar por Conversions API.
 *
 * `Purchase` **no** está y no debe estarlo: una compra solo se reporta desde
 * el servidor cuando el pedido existe y alcanza el estado configurado. Si se
 * aceptara aquí, cualquiera podría inflar las conversiones (y con ellas el
 * aprendizaje de las campañas) llamando a este endpoint.
 */
export const CLIENT_FORWARDABLE_EVENTS = [
  "PageView",
  "ViewContent",
  "Search",
  "AddToWishlist",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Contact",
] as const satisfies readonly ConversionEventName[];

export type ForwardableEvent = (typeof CLIENT_FORWARDABLE_EVENTS)[number];

const contentId = z.string().trim().min(1).max(120);

/**
 * Esquema por tipo de evento en vez de uno genérico permisivo.
 *
 * Dos decisiones importantes:
 *
 * 1. **El cliente nunca manda `value`.** El importe se resuelve en servidor
 *    desde el catálogo a partir de los `contentIds`. Un valor enviado por el
 *    navegador es un número inventable, y de él dependen el ROAS y el
 *    aprendizaje de las campañas.
 * 2. **Cada evento acepta solo los campos que le corresponden.** Un
 *    `PageView` con lista de productos, o un `Search` con importe, es una
 *    señal manipulada, no un evento válido.
 */
// `strictObject`: una clave no declarada **rechaza** el evento en vez de
// descartarse en silencio. En un límite de seguridad importa la diferencia:
// un payload con campos de más es un intento de manipulación, no un evento
// válido al que sobra información.
const eventSchemas = {
  PageView: z.strictObject({}),
  Search: z.strictObject({}),
  AddPaymentInfo: z.strictObject({}),
  ViewContent: z.strictObject({ contentIds: z.tuple([contentId]) }),
  AddToWishlist: z.strictObject({ contentIds: z.tuple([contentId]) }),
  AddToCart: z.strictObject({
    contentIds: z.array(contentId).min(1).max(50),
    quantities: z.array(z.number().int().min(1).max(99)).min(1).max(50).optional(),
  }),
  InitiateCheckout: z.strictObject({
    contentIds: z.array(contentId).min(1).max(50),
    quantities: z.array(z.number().int().min(1).max(99)).min(1).max(50).optional(),
  }),
  Contact: z.strictObject({
    contentIds: z.array(contentId).max(50).optional(),
    quantities: z.array(z.number().int().min(1).max(99)).max(50).optional(),
    source: z.enum(["float_button", "product", "cart"]).optional(),
  }),
} satisfies Record<ForwardableEvent, z.ZodType>;

export const forwardEventSchema = z
  .object({
    eventName: z.enum(CLIENT_FORWARDABLE_EVENTS),
    // El mismo id que ya usó el píxel: es lo que permite a Meta unir ambos
    // envíos en una sola conversión.
    eventId: z.string().trim().regex(/^[A-Za-z0-9_:-]{8,120}$/, "Identificador de evento no válido."),
    eventSourceUrl: z.string().trim().url().max(500),
    payload: z.unknown().optional(),
  })
  .transform((value, ctx) => {
    const schema = eventSchemas[value.eventName];
    const parsed = schema.safeParse(value.payload ?? {});
    if (!parsed.success) {
      ctx.addIssue({ code: "custom", message: `Datos no válidos para ${value.eventName}.` });
      return z.NEVER;
    }
    return { ...value, payload: parsed.data as Record<string, unknown> };
  });

export type ForwardEventInput = z.infer<typeof forwardEventSchema>;

/**
 * Acepta la URL solo si su origen coincide con el del sitio configurado o
 * con el de la propia petición. Sin esto, cualquiera podría atribuir
 * eventos a dominios ajenos desde este endpoint público.
 */
export function isAllowedEventSourceUrl(rawUrl: string, allowedOrigins: readonly (string | null | undefined)[]): boolean {
  let origin: string;
  try {
    origin = new URL(rawUrl).origin;
  } catch {
    return false;
  }
  return allowedOrigins.some((candidate) => {
    if (!candidate) return false;
    try {
      return new URL(candidate).origin === origin;
    } catch {
      return false;
    }
  });
}
