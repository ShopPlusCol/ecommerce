import { describe, expect, it } from "vitest";
import type { Coupon } from "@/domain/entities/promotions";
import { validateCoupon } from "@/domain/services/coupons";
import { money } from "@/domain/value-objects/money";

const baseCoupon: Coupon = {
  id: "demo-coupon-bienvenida10",
  code: "BIENVENIDA10",
  discountType: "percentage",
  discountValue: 10,
  startsAt: null,
  endsAt: null,
  minPurchaseAmount: null,
  minQuantity: null,
  usageLimitTotal: null,
  usageLimitPerCustomer: null,
  firstOrderOnly: false,
  status: "active",
};

const baseCtx = { subtotal: money(100_000), totalUnits: 1, now: new Date() };

describe("validateCoupon: límites de uso", () => {
  it("rechaza cuando se alcanzó el límite total de usos", () => {
    const coupon: Coupon = { ...baseCoupon, usageLimitTotal: 5 };
    const result = validateCoupon(coupon, { ...baseCtx, totalRedemptions: 5 });
    expect(result.valid).toBe(false);
  });

  it("acepta cuando aún no se alcanza el límite total de usos", () => {
    const coupon: Coupon = { ...baseCoupon, usageLimitTotal: 5 };
    const result = validateCoupon(coupon, { ...baseCtx, totalRedemptions: 4 });
    expect(result.valid).toBe(true);
  });

  it("no evalúa el límite total si totalRedemptions no se provee (previsualización)", () => {
    const coupon: Coupon = { ...baseCoupon, usageLimitTotal: 0 };
    const result = validateCoupon(coupon, baseCtx);
    expect(result.valid).toBe(true);
  });

  it("rechaza cuando el cliente alcanzó su límite de usos por cliente", () => {
    const coupon: Coupon = { ...baseCoupon, usageLimitPerCustomer: 1 };
    const result = validateCoupon(coupon, { ...baseCtx, customerRedemptions: 1 });
    expect(result.valid).toBe(false);
  });

  it("acepta cuando el cliente no ha alcanzado su límite por cliente", () => {
    const coupon: Coupon = { ...baseCoupon, usageLimitPerCustomer: 1 };
    const result = validateCoupon(coupon, { ...baseCtx, customerRedemptions: 0 });
    expect(result.valid).toBe(true);
  });

  it("rechaza un cupón de primera compra si no es la primera compra", () => {
    const coupon: Coupon = { ...baseCoupon, firstOrderOnly: true };
    const result = validateCoupon(coupon, { ...baseCtx, isFirstOrder: false });
    expect(result.valid).toBe(false);
  });

  it("acepta un cupón de primera compra si es la primera compra", () => {
    const coupon: Coupon = { ...baseCoupon, firstOrderOnly: true };
    const result = validateCoupon(coupon, { ...baseCtx, isFirstOrder: true });
    expect(result.valid).toBe(true);
  });
});
