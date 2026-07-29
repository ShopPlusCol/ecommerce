import type { OrderSummary } from "@/domain/services/cart-pricing";
import { formatMoney } from "@/domain/value-objects/money";
import { PAYMENT_METHOD_LABELS } from "@/domain/services/payments";

/**
 * Resumen financiero obligatorio (sección 16.4): productos, descuentos, envío,
 * total, pagar ahora y pagar al recibir. Nunca confunde el anticipo con un
 * descuento; siempre muestra ambos montos por separado.
 */
export function OrderFinancialSummary({ summary }: { summary: OrderSummary }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      <Row label="Productos" value={formatMoney(summary.subtotal)} />
      {summary.discountTotal.amount > 0 ? (
        <Row label="Descuentos" value={`- ${formatMoney(summary.discountTotal)}`} tone="success" />
      ) : null}
      <Row
        label="Envío"
        value={summary.freeShipping ? "Gratis" : formatMoney(summary.shippingFee)}
        tone={summary.freeShipping ? "success" : "default"}
      />
      <div className="my-1 border-t border-border" />
      <Row label="Total del pedido" value={formatMoney(summary.total)} emphasized />

      <div className="mt-3 rounded-md bg-surface-sunken p-3">
        <div className="flex items-center justify-between text-sm">
          <dt className="font-medium text-text">Pagar ahora</dt>
          <dd className="font-semibold text-text tabular-nums">{formatMoney(summary.amountDueNow)}</dd>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <dt className="font-medium text-text">Pagar al recibir</dt>
          <dd className="font-semibold text-text tabular-nums">{formatMoney(summary.amountDueOnDelivery)}</dd>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          {PAYMENT_METHOD_LABELS[summary.paymentMethod]}. {summary.paymentReason}
        </p>
      </div>
    </dl>
  );
}

function Row({
  label,
  value,
  emphasized,
  tone = "default",
}: {
  label: string;
  value: string;
  emphasized?: boolean;
  tone?: "default" | "success";
}) {
  const toneClass = tone === "success" ? "text-success" : "text-text";
  return (
    <div className="flex items-center justify-between">
      <dt className={emphasized ? "font-semibold text-text" : "text-text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${emphasized ? "text-base font-semibold text-text" : toneClass}`}>{value}</dd>
    </div>
  );
}
