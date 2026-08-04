import { formatMoney, money } from "@/domain/value-objects/money";
import { adminStatusLabel } from "@/modules/admin/status-labels";

export type OrderCopyLine = {
  name: string;
  quantity: number;
  /** Precio unitario en pesos (entero). */
  unitPrice: number;
};

export type OrderCopyData = {
  fullName: string;
  phone: string;
  addressLine: string | null;
  addressComplement: string | null;
  neighborhood: string | null;
  city: string | null;
  department: string | null;
  deliveryInstructions: string | null;
  lines: OrderCopyLine[];
  productsSubtotal: number;
  shippingFee: number;
  discountTotal: number;
  total: number;
  paymentMethod: string;
  amountDueNow: number;
  amountDueOnDelivery: number;
};

const EMPTY_COMPLEMENT = "No aplica";
const EMPTY_INSTRUCTIONS = "Sin indicaciones adicionales";
const MISSING = "—";

function value(raw: string | null | undefined, fallback = MISSING): string {
  const trimmed = raw?.trim();
  return trimmed ? trimmed : fallback;
}

function cop(amount: number): string {
  return formatMoney(money(Math.max(0, Math.round(amount))));
}

/**
 * Texto plano del pedido, listo para pegar en WhatsApp, en una
 * transportadora o en una aplicación de domicilios.
 *
 * Se genera con una función pura y probada, no armando la cadena dentro del
 * componente: el orden de los campos y el formato de las cifras son lo que
 * hace que quien recibe el mensaje pueda actuar sin volver a preguntar, así
 * que conviene poder fijarlos con pruebas.
 *
 * Nunca incluye identificadores internos, slugs, JSON ni códigos técnicos:
 * el destinatario es una persona, no un sistema.
 */
export function buildOrderCopyText(order: OrderCopyData): string {
  const lines: string[] = [];

  lines.push(`Nombre completo: ${value(order.fullName)}`);
  lines.push(`Teléfono: ${value(order.phone)}`);
  lines.push(`Dirección: ${value(order.addressLine)}`);
  lines.push(`Apartamento, torre, bloque: ${value(order.addressComplement, EMPTY_COMPLEMENT)}`);
  lines.push(`Barrio o sector: ${value(order.neighborhood)}`);

  const city = order.city?.trim();
  const department = order.department?.trim();
  const place = [city, department].filter(Boolean).join(", ");
  lines.push(`Ciudad o municipio, Departamento: ${place || MISSING}`);

  lines.push("");
  lines.push("Indicaciones de entrega:");
  lines.push(value(order.deliveryInstructions, EMPTY_INSTRUCTIONS));

  lines.push("");
  lines.push("Resumen del pedido:");
  for (const line of order.lines) {
    lines.push(`- ${line.quantity} x ${line.name} — ${cop(line.unitPrice * line.quantity)}`);
  }

  lines.push("");
  lines.push(`Subtotal de productos: ${cop(order.productsSubtotal)}`);
  lines.push(`Domicilio: ${cop(order.shippingFee)}`);
  // Siempre se muestra, aunque sea $0: omitirla en unos pedidos y no en
  // otros hace dudar de si hubo descuento o si se olvidó anotarlo.
  lines.push(`Descuento: ${cop(order.discountTotal)}`);
  lines.push(`Total a pagar: ${cop(order.total)}`);

  lines.push("");
  lines.push(`Forma de pago: ${adminStatusLabel(order.paymentMethod)}`);
  lines.push(`Pago ahora: ${cop(order.amountDueNow)}`);
  lines.push(`Pago al recibir: ${cop(order.amountDueOnDelivery)}`);

  return lines.join("\n");
}
