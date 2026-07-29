import type { CartLine } from "@/domain/entities/cart";
import type { CartTotals } from "@/domain/services/cart-pricing";
import { formatMoney } from "@/domain/value-objects/money";
import { siteConfig } from "@/lib/site-config";

export type WhatsAppCartContext = {
  lines: CartLine[];
  totals: CartTotals;
  destination?: { city: string; neighborhood: string | null } | null;
  couponCode?: string | null;
};

/**
 * Genera el texto del mensaje de WhatsApp a partir del carrito (sección 20.2).
 * Se identifica explícitamente como resumen de carrito, no como pedido
 * pagado, y no incluye secretos ni datos sensibles.
 */
export function buildWhatsAppCartMessage(ctx: WhatsAppCartContext): string {
  const lines: string[] = [];
  lines.push("Hola, quiero realizar este pedido:");
  lines.push("");

  for (const line of ctx.lines) {
    const label = line.isGift ? `${line.name} (regalo)` : line.name;
    lines.push(`• ${line.quantity} × ${label}`);
  }

  lines.push("");
  lines.push(`Subtotal: ${formatMoney(ctx.totals.subtotal)}`);
  if (ctx.totals.discountTotal.amount > 0) {
    lines.push(`Descuentos: -${formatMoney(ctx.totals.discountTotal)}`);
  }
  if (ctx.couponCode) {
    lines.push(`Cupón: ${ctx.couponCode}`);
  }
  if (ctx.totals.freeShipping) {
    lines.push("Envío: ¡gratis!");
  } else {
    lines.push("Envío: por calcular según mi dirección");
  }
  lines.push(`Total productos: ${formatMoney(ctx.totals.productsTotal)}`);

  if (ctx.destination) {
    lines.push("");
    lines.push(`Ciudad: ${ctx.destination.city}`);
    if (ctx.destination.neighborhood) lines.push(`Barrio: ${ctx.destination.neighborhood}`);
  }

  lines.push("");
  lines.push("(Este es un resumen de mi carrito, no un pedido pagado.)");

  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string, phoneOverride?: string): string {
  const phone = phoneOverride ?? siteConfig.contact.whatsappNumber;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Mensaje simple para el botón flotante (sin carrito). */
export function buildWhatsAppInquiryUrl(): string {
  const message = `Hola, tengo una pregunta sobre los lentes de ${siteConfig.brandName}.`;
  return buildWhatsAppUrl(message);
}
