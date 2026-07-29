"use client";

import * as React from "react";
import { Check, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/cart/cart-context";
import { computeSubtotal, totalUnits as sumUnits } from "@/domain/services/cart-pricing";
import { validateCouponAction } from "@/app/(store)/actions";

/**
 * Campo de cupón. La validación es autoritativa en servidor (Server Action);
 * el descuento se recalcula localmente al instante con la misma lógica de
 * dominio (secciones 12 y 13).
 */
export function CouponField() {
  const { cart, coupon, totals, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const onApply = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await validateCouponAction({
        code: trimmed,
        subtotal: computeSubtotal(cart).amount,
        totalUnits: sumUnits(cart),
      });
      if (result.ok) {
        applyCoupon(result.coupon);
        setCode("");
      } else {
        setError(result.error);
      }
    });
  };

  if (coupon && !totals.couponError) {
    return (
      <div className="flex items-center justify-between rounded-md bg-success-soft px-3 py-2 text-sm text-success">
        <span className="flex items-center gap-2">
          <Check className="h-4 w-4" aria-hidden="true" />
          Cupón <strong>{coupon.code}</strong> aplicado
        </span>
        <button
          type="button"
          onClick={removeCoupon}
          aria-label="Quitar cupón"
          className="rounded p-0.5 hover:bg-success/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onApply} className="flex flex-col gap-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código de cupón"
            aria-label="Código de cupón"
            className="h-control-md w-full rounded-md border border-border-strong bg-surface-raised pl-9 pr-3 text-sm text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          />
        </div>
        <Button type="submit" variant="secondary" size="md" isLoading={pending} disabled={!code.trim()}>
          Aplicar
        </Button>
      </div>
      {(error || totals.couponError) && (
        <p className="text-xs text-danger" role="alert">
          {error ?? totals.couponError}
        </p>
      )}
    </form>
  );
}
