import type { Coupon } from "@/domain/entities/promotions";
import { type Money, money, percentageOf, compare } from "@/domain/value-objects/money";

export type CouponValidationContext = {
  subtotal: Money;
  totalUnits: number;
  now: Date;
};

export type CouponValidationResult =
  | { valid: true; coupon: Coupon }
  | { valid: false; reason: string };

/**
 * Normaliza el código como lo hará el servidor: mayúsculas y sin espacios
 * (sección 13, seguridad). Se usa igual en cliente y servidor para no
 * duplicar reglas.
 */
export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateCoupon(coupon: Coupon | null, ctx: CouponValidationContext): CouponValidationResult {
  if (!coupon) return { valid: false, reason: "El cupón no existe." };
  if (coupon.status !== "active") return { valid: false, reason: "El cupón no está activo." };

  if (coupon.startsAt && ctx.now < new Date(coupon.startsAt)) {
    return { valid: false, reason: "El cupón aún no está vigente." };
  }
  if (coupon.endsAt && ctx.now > new Date(coupon.endsAt)) {
    return { valid: false, reason: "El cupón está vencido." };
  }
  if (coupon.minPurchaseAmount && compare(ctx.subtotal, coupon.minPurchaseAmount) < 0) {
    return { valid: false, reason: "No alcanzas la compra mínima para este cupón." };
  }
  if (coupon.minQuantity && ctx.totalUnits < coupon.minQuantity) {
    return { valid: false, reason: "No alcanzas la cantidad mínima para este cupón." };
  }
  return { valid: true, coupon };
}

export type CouponEffect = {
  /** Descuento monetario aplicado al subtotal (no incluye envío gratis). */
  discount: Money;
  /** True si el cupón otorga envío gratis. */
  freeShipping: boolean;
};

/** Calcula el efecto de un cupón ya validado. Nunca produce descuento mayor al subtotal. */
export function computeCouponEffect(coupon: Coupon, subtotal: Money): CouponEffect {
  switch (coupon.discountType) {
    case "fixed": {
      const raw = money(Math.max(0, Math.round(coupon.discountValue)));
      const discount = compare(raw, subtotal) > 0 ? subtotal : raw;
      return { discount, freeShipping: false };
    }
    case "percentage":
      return { discount: percentageOf(subtotal, coupon.discountValue), freeShipping: false };
    case "free_shipping":
      return { discount: money(0), freeShipping: true };
    case "gift":
      // El regalo se resuelve como línea de regalo en el motor de recompensas/pedido.
      return { discount: money(0), freeShipping: false };
  }
}
