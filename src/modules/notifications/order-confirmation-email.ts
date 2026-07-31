import { formatMoney } from "@/domain/value-objects/money";
import type { DemoOrder } from "@/modules/checkout/order-types";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

/** Contenido del correo de confirmación de pedido (sección 38, evento "order_created"). Misma información que ya ve el cliente en /checkout/confirmacion. */
export function buildOrderConfirmationEmail(order: DemoOrder, brandName: string, siteUrl: string) {
  const subject = `Confirmación de tu pedido ${order.orderNumber} — ${brandName}`;
  const lookupUrl = `${siteUrl}/pedidos/consultar`;

  const itemLines = order.items.map(
    (item) => `${item.quantity} × ${item.name} — ${formatMoney({ amount: item.unitPrice * item.quantity, currency: "COP" })}`,
  );
  const itemRowsHtml = order.items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0;">${item.quantity} × ${escapeHtml(item.name)}</td><td style="padding:4px 0;text-align:right;">${formatMoney({ amount: item.unitPrice * item.quantity, currency: "COP" })}</td></tr>`,
    )
    .join("");

  const destinationLine = [order.destination.neighborhood, order.destination.city, order.destination.department]
    .filter(Boolean)
    .join(", ");

  const text = [
    `¡Gracias por tu pedido, ${order.contact.fullName}!`,
    "",
    `Número de pedido: ${order.orderNumber}`,
    `Código privado de consulta: ${order.lookupToken}`,
    "",
    "Productos:",
    ...itemLines,
    "",
    `Total del pedido: ${formatMoney(order.summary.total)}`,
    `Pagar ahora: ${formatMoney(order.summary.amountDueNow)}`,
    `Pagar al recibir: ${formatMoney(order.summary.amountDueOnDelivery)}`,
    "",
    `Entrega: ${order.contact.addressLine}, ${destinationLine}`,
    "",
    `Consulta el estado de tu pedido en ${lookupUrl} con tu número de pedido y código privado.`,
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:520px;margin:0 auto;">
      <h1 style="font-size:20px;">¡Gracias por tu pedido, ${escapeHtml(order.contact.fullName)}!</h1>
      <p>Número de pedido: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <p>Código privado de consulta: <strong>${escapeHtml(order.lookupToken)}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tbody>${itemRowsHtml}</tbody>
      </table>
      <p style="margin:4px 0;"><strong>Total del pedido:</strong> ${formatMoney(order.summary.total)}</p>
      <p style="margin:4px 0;">Pagar ahora: ${formatMoney(order.summary.amountDueNow)}</p>
      <p style="margin:4px 0;">Pagar al recibir: ${formatMoney(order.summary.amountDueOnDelivery)}</p>
      <p style="margin-top:16px;"><strong>Entrega:</strong><br />${escapeHtml(order.contact.addressLine)}<br />${escapeHtml(destinationLine)}</p>
      <p style="margin-top:24px;font-size:13px;color:#555;">
        Consulta el estado de tu pedido en <a href="${lookupUrl}">${lookupUrl}</a> con tu número de pedido y tu código privado.
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}
