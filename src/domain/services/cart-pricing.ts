import type { Cart } from "@/domain/entities/cart";
import type { Coupon } from "@/domain/entities/promotions";
import type { RewardEvaluation } from "@/domain/services/rewards";
import type { ShippingQuote } from "@/application/ports/shipping-rate-resolver";
import {
  type Money,
  add,
  compare,
  money,
  multiply,
  subtract,
  ZERO_COP,
} from "@/domain/value-objects/money";
import { computeCouponEffect, validateCoupon } from "@/domain/services/coupons";
import { computePaymentSplit, type PaymentMethodId } from "@/domain/services/payments";

/** Suma de precios de líneas que no son regalo. */
export function computeSubtotal(cart: Cart): Money {
  return cart.lines
    .filter((line) => !line.isGift)
    .reduce((sum, line) => add(sum, multiply(line.unitPrice, line.quantity)), ZERO_COP);
}

export function totalUnits(cart: Cart): number {
  return cart.lines.filter((line) => !line.isGift).reduce((sum, line) => sum + line.quantity, 0);
}

export type CartTotals = {
  subtotal: Money;
  couponDiscount: Money;
  rewardDiscount: Money;
  discountTotal: Money;
  productsTotal: Money;
  freeShipping: boolean;
  couponError: string | null;
};

export type CartTotalsInput = {
  coupon?: Coupon | null;
  rewards?: RewardEvaluation | null;
  now?: Date;
};

/**
 * Totales de productos, independientes del envío. Se usa en el carrito y el
 * drawer, y es la base del resumen de checkout. Determinista: mismo resultado
 * en cliente (respuesta inmediata) y servidor (verificación autoritativa),
 * evitando duplicar lógica (sección 1.3).
 */
export function computeCartTotals(cart: Cart, input: CartTotalsInput = {}): CartTotals {
  const subtotal = computeSubtotal(cart);
  const now = input.now ?? new Date();

  let couponDiscount = ZERO_COP;
  let couponFreeShipping = false;
  let couponError: string | null = null;

  if (input.coupon) {
    const validation = validateCoupon(input.coupon, {
      subtotal,
      totalUnits: totalUnits(cart),
      now,
    });
    if (validation.valid) {
      const effect = computeCouponEffect(validation.coupon, subtotal);
      couponDiscount = effect.discount;
      couponFreeShipping = effect.freeShipping;
    } else {
      couponError = validation.reason;
    }
  }

  const rewardDiscount = input.rewards?.totalDiscount ?? ZERO_COP;
  const rewardFreeShipping = input.rewards?.freeShipping ?? false;

  // El descuento total nunca puede superar el subtotal (sin totales negativos).
  const rawDiscount = add(couponDiscount, rewardDiscount);
  const discountTotal = compare(rawDiscount, subtotal) > 0 ? subtotal : rawDiscount;
  const productsTotal = subtract(subtotal, discountTotal);

  return {
    subtotal,
    couponDiscount,
    rewardDiscount,
    discountTotal,
    productsTotal,
    freeShipping: couponFreeShipping || rewardFreeShipping,
    couponError,
  };
}

export type OrderSummary = CartTotals & {
  shippingFee: Money;
  total: Money;
  amountDueNow: Money;
  amountDueOnDelivery: Money;
  paymentReason: string;
  paymentMethod: PaymentMethodId;
};

/**
 * Resumen financiero completo del pedido (sección 16.4): productos, envío,
 * total, pagar ahora y pagar al recibir. Requiere una cotización de envío y
 * un método de pago; sin cotización, el checkout debe mostrar "cotización
 * requerida" y no llamar a esta función.
 */
export function computeOrderSummary(
  cart: Cart,
  params: {
    coupon?: Coupon | null;
    rewards?: RewardEvaluation | null;
    shippingQuote: ShippingQuote;
    paymentMethod: PaymentMethodId;
    now?: Date;
  },
): OrderSummary {
  const totals = computeCartTotals(cart, {
    coupon: params.coupon,
    rewards: params.rewards,
    now: params.now,
  });

  const shippingFee = totals.freeShipping ? ZERO_COP : params.shippingQuote.fee;
  const total = add(totals.productsTotal, shippingFee);

  const split = computePaymentSplit({
    total,
    productsTotal: totals.productsTotal,
    shippingFee,
    method: params.paymentMethod,
  });

  return {
    ...totals,
    shippingFee,
    total,
    amountDueNow: split.amountDueNow,
    amountDueOnDelivery: split.amountDueOnDelivery,
    paymentReason: split.reason,
    paymentMethod: params.paymentMethod,
  };
}

/** Guardas de inventario: cantidad válida para una línea según su stock. */
export function clampQuantity(requested: number, maxStock: number, allowBackorder: boolean): number {
  if (requested < 0) return 0;
  if (allowBackorder) return requested;
  return Math.min(requested, Math.max(0, maxStock));
}

export { money };
