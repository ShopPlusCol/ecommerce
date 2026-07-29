"use client";

import type { CartTotals } from "@/domain/services/cart-pricing";
import { formatMoney } from "@/domain/value-objects/money";

/**
 * Resumen financiero del carrito antes del checkout. El envío se muestra como
 * "por calcular" porque depende de la dirección (se resuelve en el checkout,
 * sección 16.4). Nunca confunde anticipo con descuento.
 */
export function CartSummary({ totals }: { totals: CartTotals }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm">
      <Row label="Subtotal" value={formatMoney(totals.subtotal)} />
      {totals.discountTotal.amount > 0 ? (
        <Row label="Descuentos" value={`- ${formatMoney(totals.discountTotal)}`} tone="success" />
      ) : null}
      <Row
        label="Envío"
        value={totals.freeShipping ? "Gratis" : "Por calcular"}
        tone={totals.freeShipping ? "success" : "muted"}
      />
      <div className="my-1 border-t border-border" />
      <Row label="Total productos" value={formatMoney(totals.productsTotal)} emphasized />
      <p className="mt-1 text-xs text-text-subtle">
        El valor del envío y qué pagas ahora vs. al recibir se calculan en el siguiente paso, según tu
        dirección.
      </p>
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
  tone?: "default" | "muted" | "success";
}) {
  const toneClass = tone === "success" ? "text-success" : tone === "muted" ? "text-text-muted" : "text-text";
  return (
    <div className="flex items-center justify-between">
      <dt className={emphasized ? "font-semibold text-text" : "text-text-muted"}>{label}</dt>
      <dd className={`tabular-nums ${emphasized ? "text-base font-semibold text-text" : toneClass}`}>{value}</dd>
    </div>
  );
}
