import { describe, expect, it } from "vitest";
import { money } from "@/domain/value-objects/money";
import type { Cart, CartLine } from "@/domain/entities/cart";
import type { Coupon } from "@/domain/entities/promotions";
import { computeCartTotals, computeOrderSummary, computeSubtotal, clampQuantity } from "@/domain/services/cart-pricing";
import { evaluateRewards } from "@/domain/services/rewards";
import type { ShippingQuote } from "@/application/ports/shipping-rate-resolver";

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: "p1",
    variantId: null,
    sku: "SKU-1",
    slug: "producto",
    name: "Producto",
    imageUrl: null,
    colorFamilyName: null,
    unitPrice: money(49_000),
    compareAtPrice: null,
    quantity: 1,
    maxStock: 10,
    allowBackorder: false,
    isGift: false,
    ...overrides,
  };
}

const cart: Cart = { lines: [line(), line({ productId: "p2", sku: "SKU-2", quantity: 2 })], couponCode: null };

const medellinQuote: ShippingQuote = {
  ruleId: "r-med",
  ruleLevel: "city",
  fee: money(8_000),
  freeShippingThreshold: null,
  cashOnDeliveryAllowed: true,
  requiresAdvancePayment: false,
  advancePercentage: null,
  estimatedBusinessDaysMin: 0,
  estimatedBusinessDaysMax: 1,
  sameDayCutoffHour: 14,
  customerMessage: "Entrega el mismo día",
};

const nationalQuote: ShippingQuote = {
  ruleId: "r-nac",
  ruleLevel: "country",
  fee: money(13_000),
  freeShippingThreshold: null,
  cashOnDeliveryAllowed: false,
  requiresAdvancePayment: true,
  advancePercentage: null,
  estimatedBusinessDaysMin: 2,
  estimatedBusinessDaysMax: 5,
  customerMessage: "Envío anticipado",
  sameDayCutoffHour: null,
};

describe("computeSubtotal", () => {
  it("suma precio × cantidad de líneas no regalo", () => {
    expect(computeSubtotal(cart)).toEqual(money(147_000)); // 49k + 49k*2
  });
  it("excluye líneas de regalo", () => {
    const withGift: Cart = { lines: [line(), line({ isGift: true })], couponCode: null };
    expect(computeSubtotal(withGift)).toEqual(money(49_000));
  });
});

describe("computeCartTotals con cupón", () => {
  const activeCoupon: Coupon = {
    code: "BIENVENIDA10",
    discountType: "percentage",
    discountValue: 10,
    startsAt: null,
    endsAt: null,
    minPurchaseAmount: null,
    minQuantity: null,
    status: "active",
  };

  it("aplica descuento porcentual válido", () => {
    const totals = computeCartTotals(cart, { coupon: activeCoupon });
    expect(totals.couponDiscount).toEqual(money(14_700)); // 10% de 147k
    expect(totals.productsTotal).toEqual(money(132_300));
    expect(totals.couponError).toBeNull();
  });

  it("reporta error y no descuenta si el cupón está inactivo", () => {
    const totals = computeCartTotals(cart, { coupon: { ...activeCoupon, status: "paused" } });
    expect(totals.couponDiscount).toEqual(money(0));
    expect(totals.couponError).not.toBeNull();
  });

  it("rechaza cupón si no alcanza la compra mínima", () => {
    const totals = computeCartTotals(cart, {
      coupon: { ...activeCoupon, minPurchaseAmount: money(200_000) },
    });
    expect(totals.couponError).not.toBeNull();
    expect(totals.couponDiscount).toEqual(money(0));
  });

  it("nunca deja el descuento por encima del subtotal", () => {
    const totals = computeCartTotals(cart, {
      coupon: { ...activeCoupon, discountType: "fixed", discountValue: 500_000 },
    });
    expect(totals.discountTotal).toEqual(computeSubtotal(cart));
    expect(totals.productsTotal).toEqual(money(0));
  });
});

describe("computeOrderSummary — pago parcial (sección 16.4)", () => {
  it("Medellín contra entrega: pagar ahora 0, al recibir el total", () => {
    const summary = computeOrderSummary(cart, {
      shippingQuote: medellinQuote,
      paymentMethod: "cash_on_delivery",
    });
    expect(summary.shippingFee).toEqual(money(8_000));
    expect(summary.total).toEqual(money(155_000));
    expect(summary.amountDueNow).toEqual(money(0));
    expect(summary.amountDueOnDelivery).toEqual(money(155_000));
  });

  it("fuera de zona: anticipo del envío ahora, productos como saldo", () => {
    const oneItem: Cart = { lines: [line()], couponCode: null };
    const summary = computeOrderSummary(oneItem, {
      shippingQuote: nationalQuote,
      paymentMethod: "shipping_advance_transfer",
    });
    // Ejemplo conceptual del prompt: productos 49.000, envío 13.000
    expect(summary.shippingFee).toEqual(money(13_000));
    expect(summary.total).toEqual(money(62_000));
    expect(summary.amountDueNow).toEqual(money(13_000));
    expect(summary.amountDueOnDelivery).toEqual(money(49_000));
  });

  it("Mercado Pago: pago total anticipado", () => {
    const summary = computeOrderSummary(cart, {
      shippingQuote: medellinQuote,
      paymentMethod: "mercado_pago",
    });
    expect(summary.amountDueNow).toEqual(summary.total);
    expect(summary.amountDueOnDelivery).toEqual(money(0));
  });

  it("la suma de pagar ahora + al recibir siempre es el total", () => {
    for (const method of ["mercado_pago", "cash_on_delivery", "transfer_full"] as const) {
      const summary = computeOrderSummary(cart, { shippingQuote: medellinQuote, paymentMethod: method });
      expect(summary.amountDueNow.amount + summary.amountDueOnDelivery.amount).toBe(summary.total.amount);
    }
  });
});

describe("recompensa de envío gratis integrada al resumen", () => {
  it("envío gratis desde recompensa deja shippingFee en cero", () => {
    const rewards = evaluateRewards(
      [
        {
          id: "rw1",
          name: "Envío gratis",
          progressMessage: "Te faltan {x} para envío gratis",
          unlockedMessage: "¡Tienes envío gratis!",
          conditionType: "cart_amount",
          targetValue: 120_000,
          rewardType: "free_shipping",
          rewardValue: null,
          rewardProductId: null,
          priority: 1,
          status: "active",
        },
      ],
      { subtotal: computeSubtotal(cart), totalUnits: 3 },
    );
    const summary = computeOrderSummary(cart, {
      rewards,
      shippingQuote: medellinQuote,
      paymentMethod: "cash_on_delivery",
    });
    expect(summary.freeShipping).toBe(true);
    expect(summary.shippingFee).toEqual(money(0));
    expect(summary.total).toEqual(summary.productsTotal);
  });
});

describe("clampQuantity — guardas de inventario", () => {
  it("limita al stock disponible sin backorder", () => {
    expect(clampQuantity(15, 10, false)).toBe(10);
  });
  it("permite exceder stock con backorder", () => {
    expect(clampQuantity(15, 10, true)).toBe(15);
  });
  it("nunca es negativo", () => {
    expect(clampQuantity(-3, 10, false)).toBe(0);
  });
});
