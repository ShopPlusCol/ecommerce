"use server";

import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { money } from "@/domain/value-objects/money";
import type { Cart, CartLine } from "@/domain/entities/cart";
import { validateCoupon } from "@/domain/services/coupons";
import { evaluateRewards } from "@/domain/services/rewards";
import { computeSubtotal, computeOrderSummary, totalUnits } from "@/domain/services/cart-pricing";
import { availablePaymentMethods } from "@/domain/services/payments";
import { productToCartLine } from "@/modules/cart/cart-line";
import { catalogRepository, promotionsRepository, shippingResolver } from "@/lib/container";
import type {
  CreateDemoOrderInput,
  CreateDemoOrderResult,
  QuoteShippingResult,
  ValidateCouponResult,
} from "@/modules/checkout/order-types";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  consentRecords,
  customers,
  idempotencyKeys,
  inventoryItems,
  inventoryMovements,
  inventoryReservations,
  orderItems,
  orders,
  orderStatusHistory,
  payments,
} from "@/infrastructure/db/schema";
import { MercadoPagoProvider } from "@/infrastructure/payments/mercado-pago-provider";
import { releaseExpiredReservations } from "@/modules/inventory/reservations";
import { getManualTransferSettings } from "@/modules/settings/manual-transfer";

const destinationSchema = z.object({
  country: z.string().min(1).default("CO"),
  department: z.string().min(1),
  city: z.string().min(1),
  neighborhood: z.string().nullable(),
});

const couponSchema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().int().nonnegative(),
  totalUnits: z.number().int().nonnegative(),
});

const quoteSchema = z.object({
  destination: destinationSchema,
  productsTotal: z.number().int().nonnegative(),
});

const paymentMethodSchema = z.enum([
  "mercado_pago",
  "cash_on_delivery",
  "shipping_advance_transfer",
  "transfer_full",
]);

const createOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  couponCode: z.string().nullable(),
  destination: destinationSchema,
  paymentMethod: paymentMethodSchema,
  contact: z.object({
    fullName: z.string().min(2),
    phone: z.string().min(7),
    email: z.string().email().or(z.literal("")),
    addressLine: z.string().min(3),
    addressComplement: z.string(),
    deliveryInstructions: z.string(),
  }),
  consent: z.object({ terms: z.boolean(), marketing: z.boolean(), analytics: z.boolean() }),
});

/** Valida un cupón en servidor (autoritativo, sección 13). */
export async function validateCouponAction(input: unknown): Promise<ValidateCouponResult> {
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de cupón inválidos." };

  const coupon = await promotionsRepository.findCouponByCode(parsed.data.code);
  const result = validateCoupon(coupon, {
    subtotal: money(parsed.data.subtotal),
    totalUnits: parsed.data.totalUnits,
    now: new Date(),
  });
  if (!result.valid) return { ok: false, error: result.reason };
  return { ok: true, coupon: result.coupon };
}

/** Cotiza el envío para un destino (jerarquía de zonas, sección 17). */
export async function quoteShippingAction(input: unknown): Promise<QuoteShippingResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "Datos de destino inválidos." };

  const quote = await shippingResolver.resolve(parsed.data.destination, money(parsed.data.productsTotal));
  if (!quote) {
    return { ok: false, reason: "Cotización requerida para esta dirección. Escríbenos por WhatsApp." };
  }
  const transferConfigured = Boolean((await getManualTransferSettings()).accountNumber);
  const methods = availablePaymentMethods(quote)
    .filter((method) => method !== "mercado_pago" || Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN))
    .filter((method) => !["transfer_full", "shipping_advance_transfer"].includes(method) || transferConfigured);
  return { ok: true, quote, methods };
}

/**
 * Crea un pedido de DEMOSTRACIÓN (Fase 2). Reconstruye el carrito desde el
 * catálogo en servidor (nunca confía en los precios del cliente, sección 29),
 * recalcula el resumen financiero de forma autoritativa y devuelve un número
 * de pedido. No persiste ni cobra: la persistencia y el pago real llegan en
 * la Fase 3.
 */
export async function createDemoOrderAction(input: CreateDemoOrderInput): Promise<CreateDemoOrderResult> {
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del formulario." };
  const data = parsed.data;
  const db = await getRuntimeDb();
  await releaseExpiredReservations();

  if (!data.consent.terms) {
    return { ok: false, error: "Debes aceptar los términos y la política de privacidad." };
  }

  // Reconstrucción autoritativa del carrito desde el catálogo.
  const products = await catalogRepository.getProductsByIds(data.items.map((i) => i.productId));
  const lines: CartLine[] = [];
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const available = product.allowBackorder ? item.quantity : Math.min(item.quantity, product.stock);
    if (available <= 0) continue;
    lines.push(productToCartLine(product, available));
  }
  if (lines.length === 0) {
    return { ok: false, error: "Los productos del carrito ya no están disponibles." };
  }

  const cart: Cart = { lines, couponCode: data.couponCode };
  const subtotal = computeSubtotal(cart);

  // Cupón (autoritativo).
  let coupon = null;
  if (data.couponCode) {
    const found = await promotionsRepository.findCouponByCode(data.couponCode);
    const validation = validateCoupon(found, { subtotal, totalUnits: totalUnits(cart), now: new Date() });
    if (validation.valid) coupon = validation.coupon;
  }

  // Recompensas (autoritativas).
  const rewardRules = await promotionsRepository.listActiveRewardRules();
  const rewards = evaluateRewards(rewardRules, { subtotal, totalUnits: totalUnits(cart) });

  // Envío.
  const quote = await shippingResolver.resolve(data.destination, subtotal);
  if (!quote) {
    return { ok: false, error: "No hay tarifa de envío para esta dirección. Escríbenos por WhatsApp." };
  }

  // Método de pago válido para la zona.
  const transferConfigured = Boolean((await getManualTransferSettings()).accountNumber);
  const methods = availablePaymentMethods(quote)
    .filter((method) => method !== "mercado_pago" || Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN))
    .filter((method) => !["transfer_full", "shipping_advance_transfer"].includes(method) || transferConfigured);
  if (!methods.includes(data.paymentMethod)) {
    return { ok: false, error: "El método de pago no está disponible para tu zona." };
  }

  const summary = computeOrderSummary(cart, {
    coupon,
    rewards,
    shippingQuote: quote,
    paymentMethod: data.paymentMethod,
  });
  const cookieStore = await cookies();
  let attribution: Record<string, string> = {};
  let firstAttribution: Record<string, string> = {};
  try {
    attribution = JSON.parse(cookieStore.get("shoppluscol_utm_last")?.value ?? "{}") as Record<string, string>;
    firstAttribution = JSON.parse(cookieStore.get("shoppluscol_utm_first")?.value ?? "{}") as Record<string, string>;
  } catch {
    attribution = {};
    firstAttribution = {};
  }

  const [claimed] = await db
    .insert(idempotencyKeys)
    .values({ key: data.idempotencyKey, scope: "checkout" })
    .onConflictDoNothing()
    .returning();
  if (!claimed) {
    const [previous] = await db
      .select({ snapshot: idempotencyKeys.responseSnapshot })
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, data.idempotencyKey))
      .limit(1);
    return previous?.snapshot
      ? previous.snapshot as CreateDemoOrderResult
      : { ok: false, error: "El pedido ya se está procesando. Espera un momento." };
  }

  const orderNumber = `SPC-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
  const lookupToken = randomBytes(24).toString("base64url");
  const lookupTokenHash = createHash("sha256").update(lookupToken).digest("hex");
  const reserved: Array<{ id: string; quantity: number }> = [];

  try {
    for (const line of lines) {
      const [item] = await db
        .select()
        .from(inventoryItems)
        .where(and(eq(inventoryItems.productId, line.productId), sql`${inventoryItems.variantId} is null`))
        .limit(1);
      if (!item) throw new Error(`Sin inventario para ${line.name}.`);
      const [updated] = await db
        .update(inventoryItems)
        .set({
          quantityReserved: sql`${inventoryItems.quantityReserved} + ${line.quantity}`,
          updatedAt: new Date(),
        })
        .where(and(
          eq(inventoryItems.id, item.id),
          gte(sql`${inventoryItems.quantityOnHand} - ${inventoryItems.quantityReserved}`, line.quantity),
        ))
        .returning({ id: inventoryItems.id });
      if (!updated && !line.allowBackorder) throw new Error(`Stock insuficiente para ${line.name}.`);
      if (updated) reserved.push({ id: updated.id, quantity: line.quantity });
    }

    let [customer] = await db.select().from(customers).where(eq(customers.phone, data.contact.phone)).limit(1);
    if (!customer) {
      [customer] = await db.insert(customers).values({
        fullName: data.contact.fullName,
        phone: data.contact.phone,
        email: data.contact.email || null,
        marketingConsent: data.consent.marketing,
        firstOrderAt: new Date(),
        lastOrderAt: new Date(),
      }).returning();
    } else {
      await db.update(customers).set({
        fullName: data.contact.fullName,
        email: data.contact.email || customer.email,
        marketingConsent: data.consent.marketing,
        lastOrderAt: new Date(),
      }).where(eq(customers.id, customer.id));
    }

    const [order] = await db.insert(orders).values({
      orderNumber,
      customerId: customer.id,
      status: summary.amountDueNow.amount > 0
        ? (data.paymentMethod === "shipping_advance_transfer" ? "partial_payment_required" : "pending_payment")
        : "confirmed",
      paymentStatus: summary.amountDueNow.amount > 0 ? "full_payment_pending" : "unpaid",
      paymentMethod: data.paymentMethod,
      lookupTokenHash,
      deliveryMethod: "delivery",
      customerFullName: data.contact.fullName,
      customerPhone: data.contact.phone,
      customerEmail: data.contact.email || null,
      shippingDepartment: data.destination.department,
      shippingCity: data.destination.city,
      shippingNeighborhood: data.destination.neighborhood,
      shippingAddressLine: data.contact.addressLine,
      shippingAddressComplement: data.contact.addressComplement,
      deliveryInstructions: data.contact.deliveryInstructions,
      shippingRuleIdSnapshot: quote.ruleId,
      shippingRuleLevelSnapshot: quote.ruleLevel,
      subtotal: summary.subtotal.amount,
      discountTotal: summary.discountTotal.amount,
      shippingFee: summary.shippingFee.amount,
      total: summary.total.amount,
      amountDueNow: summary.amountDueNow.amount,
      amountDueOnDelivery: summary.amountDueOnDelivery.amount,
      couponCode: coupon?.code ?? null,
      appliedPromotions: rewards.unlocked.map((reward) => reward.rule.name),
      termsVersionAccepted: "2026-07-29",
      marketingConsent: data.consent.marketing,
      utmSource: attribution.source,
      utmMedium: attribution.medium,
      utmCampaign: attribution.campaign,
      utmContent: attribution.content,
      utmTerm: attribution.term,
      utmFirstAttribution: firstAttribution,
      utmLastAttribution: attribution,
    }).returning();

    await db.insert(orderItems).values(lines.map((line) => ({
      orderId: order.id,
      productId: line.productId,
      sku: line.sku,
      name: line.name,
      colorFamilyName: line.colorFamilyName,
      unitPrice: line.unitPrice.amount,
      quantity: line.quantity,
      isGift: line.isGift,
    })));
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      toStatus: order.status,
      note: "Pedido creado por checkout.",
    });
    for (const reservation of reserved) {
      await db.insert(inventoryReservations).values({
        inventoryItemId: reservation.id,
        orderId: order.id,
        quantity: reservation.quantity,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      await db.insert(inventoryMovements).values({
        inventoryItemId: reservation.id,
        type: "reservation",
        quantityDelta: reservation.quantity,
        referenceOrderId: order.id,
        reason: "Reserva de checkout",
      });
    }

    const provider = data.paymentMethod === "mercado_pago"
      ? "mercado_pago"
      : data.paymentMethod === "cash_on_delivery" ? "cash_on_delivery" : "manual_transfer";
    const [payment] = await db.insert(payments).values({
      orderId: order.id,
      provider,
      purpose: data.paymentMethod === "shipping_advance_transfer"
        ? "shipping_advance"
        : data.paymentMethod === "cash_on_delivery" ? "balance_on_delivery" : "full_payment",
      amount: summary.amountDueNow.amount || summary.amountDueOnDelivery.amount,
      status: "pending",
      externalReference: order.orderNumber,
      idempotencyKey: `payment:${data.idempotencyKey}`,
    }).returning();
    await db.insert(consentRecords).values({
      subjectId: customer.id,
      analytics: data.consent.analytics,
      marketing: data.consent.marketing,
      policyVersion: "2026-07-29",
    });

    let checkoutUrl: string | null = null;
    if (data.paymentMethod === "mercado_pago") {
      const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!token) throw new Error("Mercado Pago no está configurado.");
      const intent = await new MercadoPagoProvider(
        token,
        process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? "",
        process.env.MERCADO_PAGO_TEST_MODE !== "false",
      ).createPaymentIntent({
        orderId: order.id,
        externalReference: order.orderNumber,
        amount: summary.amountDueNow,
        idempotencyKey: payment.idempotencyKey,
        description: `Pedido ${order.orderNumber}`,
      });
      checkoutUrl = intent.checkoutUrl;
      await db.update(payments).set({ providerPaymentId: intent.providerPaymentId }).where(eq(payments.id, payment.id));
    }

    const manualTransfer = data.paymentMethod === "transfer_full" || data.paymentMethod === "shipping_advance_transfer"
      ? await getManualTransferSettings()
      : null;
    const result: CreateDemoOrderResult = {
      ok: true,
      order: {
        orderNumber,
        createdAt: new Date().toISOString(),
        isDemo: false,
        lookupToken,
        checkoutUrl,
        manualTransfer,
        contact: data.contact,
        destination: data.destination,
        paymentMethod: data.paymentMethod,
        quote,
        items: lines.map((line) => ({
          productId: line.productId,
          sku: line.sku,
          name: line.name,
          colorFamilyName: line.colorFamilyName,
          unitPrice: line.unitPrice.amount,
          quantity: line.quantity,
          imageUrl: line.imageUrl,
        })),
        summary,
      },
    };
    await db.update(idempotencyKeys).set({ responseSnapshot: result }).where(eq(idempotencyKeys.key, data.idempotencyKey));
    return result;
  } catch (error) {
    for (const reservation of reserved) {
      await db.update(inventoryItems).set({
        quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
        updatedAt: new Date(),
      }).where(eq(inventoryItems.id, reservation.id));
    }
    await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, data.idempotencyKey));
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible crear el pedido." };
  }
}
