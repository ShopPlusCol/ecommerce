import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "./test-db";
import { claimCouponRedemption } from "@/modules/promotions/coupon-redemptions";
import * as schema from "@/infrastructure/db/schema";

let ctx: ReturnType<typeof createTestDb>;
beforeEach(() => { ctx = createTestDb(); });
afterEach(() => ctx.sqlite.close());

async function seedCoupon(overrides: Partial<typeof schema.coupons.$inferInsert> = {}) {
  const [coupon] = await ctx.db.insert(schema.coupons).values({
    code: "TEST10",
    discountType: "percentage",
    discountValue: 10,
    status: "active",
    ...overrides,
  }).returning();
  return coupon;
}

async function seedOrder(customerId: string, orderNumber: string) {
  const [order] = await ctx.db.insert(schema.orders).values({
    orderNumber,
    customerId,
    paymentMethod: "cash_on_delivery",
    lookupTokenHash: `hash-${orderNumber}`,
    deliveryMethod: "delivery",
    customerFullName: "Cliente",
    customerPhone: "3000000000",
    subtotal: 49000,
    total: 49000,
    amountDueNow: 0,
    amountDueOnDelivery: 49000,
  }).returning();
  return order;
}

async function seedCustomer(phone: string) {
  const [customer] = await ctx.db.insert(schema.customers).values({ fullName: "Cliente", phone }).returning();
  return customer;
}

describe("claimCouponRedemption: concurrencia real sobre persistencia (no mocks)", () => {
  it("dos reclamos concurrentes contra un cupón con usageLimitTotal=1: solo uno gana", async () => {
    const coupon = await seedCoupon({ usageLimitTotal: 1 });
    const customerA = await seedCustomer("3000000001");
    const customerB = await seedCustomer("3000000002");
    const orderA = await seedOrder(customerA.id, "SPC-A");
    const orderB = await seedOrder(customerB.id, "SPC-B");

    const [resultA, resultB] = await Promise.all([
      claimCouponRedemption(ctx.db, {
        couponId: coupon.id, orderId: orderA.id, customerId: customerA.id, discountAmount: 4900,
        usageLimitTotal: 1, usageLimitPerCustomer: null, firstOrderOnly: false,
      }),
      claimCouponRedemption(ctx.db, {
        couponId: coupon.id, orderId: orderB.id, customerId: customerB.id, discountAmount: 4900,
        usageLimitTotal: 1, usageLimitPerCustomer: null, firstOrderOnly: false,
      }),
    ]);

    const succeeded = [resultA, resultB].filter((r) => r !== null);
    expect(succeeded).toHaveLength(1);
    const redemptions = await ctx.db.select().from(schema.couponRedemptions);
    expect(redemptions).toHaveLength(1);
  });

  it("no permite un tercer canje cuando usageLimitTotal=2 y ya hay dos", async () => {
    const coupon = await seedCoupon({ usageLimitTotal: 2 });
    const customers = await Promise.all([seedCustomer("3000000003"), seedCustomer("3000000004"), seedCustomer("3000000005")]);
    const orders = await Promise.all(customers.map((c, i) => seedOrder(c.id, `SPC-N${i}`)));

    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(await claimCouponRedemption(ctx.db, {
        couponId: coupon.id, orderId: orders[i].id, customerId: customers[i].id, discountAmount: 1000,
        usageLimitTotal: 2, usageLimitPerCustomer: null, firstOrderOnly: false,
      }));
    }
    expect(results.filter((r) => r !== null)).toHaveLength(2);
    expect(results[2]).toBeNull();
  });

  it("respeta usageLimitPerCustomer aunque el límite total sea mayor", async () => {
    const coupon = await seedCoupon({ usageLimitTotal: 10, usageLimitPerCustomer: 1 });
    const customer = await seedCustomer("3000000006");
    const orderOne = await seedOrder(customer.id, "SPC-P1");
    const orderTwo = await seedOrder(customer.id, "SPC-P2");

    const first = await claimCouponRedemption(ctx.db, {
      couponId: coupon.id, orderId: orderOne.id, customerId: customer.id, discountAmount: 1000,
      usageLimitTotal: 10, usageLimitPerCustomer: 1, firstOrderOnly: false,
    });
    const second = await claimCouponRedemption(ctx.db, {
      couponId: coupon.id, orderId: orderTwo.id, customerId: customer.id, discountAmount: 1000,
      usageLimitTotal: 10, usageLimitPerCustomer: 1, firstOrderOnly: false,
    });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it("firstOrderOnly rechaza un cliente con otro pedido previo", async () => {
    const coupon = await seedCoupon({ firstOrderOnly: true });
    const customer = await seedCustomer("3000000007");
    const priorOrder = await seedOrder(customer.id, "SPC-PRIOR");
    const newOrder = await seedOrder(customer.id, "SPC-NEW");
    void priorOrder;

    const result = await claimCouponRedemption(ctx.db, {
      couponId: coupon.id, orderId: newOrder.id, customerId: customer.id, discountAmount: 1000,
      usageLimitTotal: null, usageLimitPerCustomer: null, firstOrderOnly: true,
    });
    expect(result).toBeNull();
  });

  it("firstOrderOnly acepta al cliente cuando el pedido actual es el único que tiene", async () => {
    const coupon = await seedCoupon({ firstOrderOnly: true });
    const customer = await seedCustomer("3000000008");
    const onlyOrder = await seedOrder(customer.id, "SPC-ONLY");

    const result = await claimCouponRedemption(ctx.db, {
      couponId: coupon.id, orderId: onlyOrder.id, customerId: customer.id, discountAmount: 1000,
      usageLimitTotal: null, usageLimitPerCustomer: null, firstOrderOnly: true,
    });
    expect(result).not.toBeNull();
  });

  it("un reintento con el mismo pedido no duplica el canje (order_id único)", async () => {
    const coupon = await seedCoupon({ usageLimitTotal: 5 });
    const customer = await seedCustomer("3000000009");
    const order = await seedOrder(customer.id, "SPC-RETRY");

    const input = {
      couponId: coupon.id, orderId: order.id, customerId: customer.id, discountAmount: 1000,
      usageLimitTotal: 5, usageLimitPerCustomer: null, firstOrderOnly: false,
    } as const;
    const first = await claimCouponRedemption(ctx.db, input);
    const retry = await claimCouponRedemption(ctx.db, input);
    expect(first).not.toBeNull();
    expect(retry).toBeNull();
    const redemptions = await ctx.db.select().from(schema.couponRedemptions);
    expect(redemptions).toHaveLength(1);
  });

  it("sin límites configurados (null), siempre permite el canje", async () => {
    const coupon = await seedCoupon();
    const customer = await seedCustomer("3000000010");
    const order = await seedOrder(customer.id, "SPC-UNLIMITED");
    const result = await claimCouponRedemption(ctx.db, {
      couponId: coupon.id, orderId: order.id, customerId: customer.id, discountAmount: 1000,
      usageLimitTotal: null, usageLimitPerCustomer: null, firstOrderOnly: false,
    });
    expect(result).not.toBeNull();
  });

  it("diez reclamos concurrentes contra un límite de 3: exactamente 3 ganan, nunca más", async () => {
    const coupon = await seedCoupon({ usageLimitTotal: 3 });
    const customers = await Promise.all(Array.from({ length: 10 }, (_, i) => seedCustomer(`300000010${i}`)));
    const orders = await Promise.all(customers.map((c, i) => seedOrder(c.id, `SPC-STRESS${i}`)));

    const results = await Promise.all(orders.map((order, i) => claimCouponRedemption(ctx.db, {
      couponId: coupon.id, orderId: order.id, customerId: customers[i].id, discountAmount: 500,
      usageLimitTotal: 3, usageLimitPerCustomer: null, firstOrderOnly: false,
    })));
    expect(results.filter((r) => r !== null)).toHaveLength(3);
    const redemptions = await ctx.db.select().from(schema.couponRedemptions);
    expect(redemptions).toHaveLength(3);
  });
});
