"use server";

import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { money } from "@/domain/value-objects/money";
import type { Cart, CartLine } from "@/domain/entities/cart";
import { validateCoupon } from "@/domain/services/coupons";
import { evaluateRewards } from "@/domain/services/rewards";
import { computeSubtotal, computeOrderSummary, maxAllowedByPurchaseLimit, totalUnits } from "@/domain/services/cart-pricing";
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
  couponRedemptions,
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
import { getShippingMessagesSettings } from "@/modules/settings/shipping-messages";
import { enforceRateLimit, RateLimitError } from "@/modules/security/rate-limit";
import { resolveDestinationLabel, resolveRejectionMessage } from "@/domain/services/shipping";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";
import { getBrandSettings } from "@/modules/settings/brand";
import { emitPurchaseEventOnce } from "@/modules/analytics/purchase-event";
import { ConfiguredNotificationProvider } from "@/infrastructure/notifications/configured-notification-provider";
import { buildOrderConfirmationEmail } from "@/modules/notifications/order-confirmation-email";
import { getCheckoutFieldsSettings } from "@/modules/settings/checkout-fields";
import { LOCKED_CHECKOUT_FIELDS, NO_REQUIRED_TOGGLE_FIELDS, type CheckoutFieldId } from "@/modules/checkout/checkout-fields";
import { claimCouponRedemption } from "@/modules/promotions/coupon-redemptions";

/** Se lanza cuando un cupón, validado momentos antes de escribir el pedido,
 * pierde su cupo por una redención concurrente entre esa validación y el
 * reclamo atómico — la única forma de perder la carrera de verdad tarde en
 * el proceso. Señala al llamador que debe deshacer todo y decirle al
 * cliente que el cupón dejó de ser válido, nunca cobrar de más en silencio. */
class CouponRaceLostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CouponRaceLostError";
  }
}

const destinationSchema = z.object({
  country: z.string().min(1).default("CO"),
  department: z.string().min(1),
  // Vacío cuando el departamento no tiene ciudades configuradas (sección
  // 17.3): el checkout no fuerza a elegir una ciudad que no existe.
  city: z.string(),
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
  // marketing: null = la casilla no se mostró (campo desactivado en
  // configuración). El servidor igual re-deriva el valor autoritativo de
  // la configuración vigente más abajo — esto es solo la forma de entrada.
  consent: z.object({ terms: z.boolean(), marketing: z.boolean().nullable(), analytics: z.boolean() }),
});

/** Valida un cupón en servidor (autoritativo, sección 13). */
export async function validateCouponAction(input: unknown): Promise<ValidateCouponResult> {
  try {
    await enforceRateLimit("coupon_validate", 20, 60);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    throw error;
  }
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos de cupón inválidos." };

  const coupon = await promotionsRepository.findCouponByCode(parsed.data.code);
  // Límite total de usos: se puede comprobar aquí sin conocer todavía al
  // cliente. El límite por cliente y "solo primera compra" solo se conocen
  // con certeza en createDemoOrderAction (ahí sí es autoritativo); esta
  // previsualización nunca es la última palabra.
  let totalRedemptions: number | undefined;
  if (coupon) {
    const db = await getRuntimeDb();
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(couponRedemptions).where(eq(couponRedemptions.couponId, coupon.id));
    totalRedemptions = Number(row?.count ?? 0);
  }
  const result = validateCoupon(coupon, {
    subtotal: money(parsed.data.subtotal),
    totalUnits: parsed.data.totalUnits,
    now: new Date(),
    totalRedemptions,
  });
  if (!result.valid) return { ok: false, error: result.reason };
  return { ok: true, coupon: result.coupon };
}

/** Mensaje a mostrar cuando no hay tarifa/cobertura para un destino: el mensaje propio de su zona más específica si tiene uno, o el mensaje global personalizable con el nombre del destino. */
async function resolveNoCoverageMessage(destination: z.infer<typeof destinationSchema>): Promise<string> {
  const { zones, rules } = await loadShippingTree();
  const ownMessage = resolveRejectionMessage(zones, rules, destination);
  if (ownMessage) return ownMessage;
  const template = (await getShippingMessagesSettings()).noCoverageTemplate;
  return template.replace("{lugar}", resolveDestinationLabel(zones, destination));
}

/** Cotiza el envío para un destino (jerarquía de zonas, sección 17). */
export async function quoteShippingAction(input: unknown): Promise<QuoteShippingResult> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "Datos de destino inválidos." };

  // Se llama en cada cambio de dirección durante el checkout (mucho más
  // frecuente que pedidos completados), así que libera reservas vencidas
  // aquí también: reduce la ventana en la que stock reservado por un
  // carrito abandonado queda bloqueado sin que nadie más complete un pedido.
  await releaseExpiredReservations();
  const quote = await shippingResolver.resolve(parsed.data.destination, money(parsed.data.productsTotal));
  if (!quote) {
    return { ok: false, reason: await resolveNoCoverageMessage(parsed.data.destination) };
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
  try {
    await enforceRateLimit("checkout", 8, 10 * 60);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    throw error;
  }
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Revisa los datos del formulario." };
  const data = parsed.data;
  const db = await getRuntimeDb();
  await releaseExpiredReservations();

  if (!data.consent.terms) {
    return { ok: false, error: "Debes aceptar los términos y la política de privacidad." };
  }

  // Formulario de checkout autoritativo (sección de configuración de
  // campos): el navegador ya usa esta misma configuración para mostrar,
  // ocultar y marcar campos obligatorios, pero eso es solo UX — el
  // servidor la vuelve a cargar y decide qué exige y qué descarta,
  // aunque la petición haya sido manipulada a mano.
  const fieldConfig = await getCheckoutFieldsSettings();
  const fieldsById = new Map(fieldConfig.map((field) => [field.id, field]));
  const isFieldEnabled = (id: CheckoutFieldId) =>
    LOCKED_CHECKOUT_FIELDS.includes(id) ? true : (fieldsById.get(id)?.enabled ?? true);
  const isFieldRequired = (id: CheckoutFieldId) =>
    LOCKED_CHECKOUT_FIELDS.includes(id)
      ? true
      : NO_REQUIRED_TOGGLE_FIELDS.includes(id)
        ? false
        : (fieldsById.get(id)?.required ?? false);

  if (isFieldEnabled("email") && isFieldRequired("email") && !data.contact.email.trim()) {
    return { ok: false, error: "El correo es obligatorio." };
  }
  if (isFieldEnabled("addressComplement") && isFieldRequired("addressComplement") && !data.contact.addressComplement.trim()) {
    return { ok: false, error: "Completa el campo de apartamento, torre o bloque." };
  }
  if (isFieldEnabled("deliveryInstructions") && isFieldRequired("deliveryInstructions") && !data.contact.deliveryInstructions.trim()) {
    return { ok: false, error: "Completa las indicaciones de entrega." };
  }

  // Normaliza: un campo desactivado nunca guarda lo que haya enviado el
  // cliente (manipulado o no) — se descarta a cadena vacía, el valor
  // apropiado para estas columnas de texto opcional.
  const normalizedContact = {
    ...data.contact,
    email: isFieldEnabled("email") ? data.contact.email.trim() : "",
    addressComplement: isFieldEnabled("addressComplement") ? data.contact.addressComplement.trim() : "",
    deliveryInstructions: isFieldEnabled("deliveryInstructions") ? data.contact.deliveryInstructions.trim() : "",
  };

  // Consentimiento de marketing con tres estados (sección de
  // consentimientos): si la casilla está desactivada en configuración, la
  // opción nunca se presentó — el servidor ignora lo que haya mandado el
  // cliente para este campo y lo trata como "no presentado" (null), nunca
  // como una revocación real.
  const marketingConsentPresented = isFieldEnabled("marketingConsent");
  const marketingConsentValue: boolean | null = marketingConsentPresented ? (data.consent.marketing ?? false) : null;

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

  // Límite de venta cruzada (sección 11.2): revalida contra el carrito
  // reconstruido, nunca contra lo que envió el navegador.
  for (const targetLine of lines) {
    const maxAllowed = maxAllowedByPurchaseLimit(targetLine, lines);
    if (maxAllowed !== null && targetLine.quantity > maxAllowed) {
      targetLine.quantity = maxAllowed;
    }
  }
  const nonZeroLines = lines.filter((line) => line.quantity > 0);
  if (nonZeroLines.length === 0) {
    return { ok: false, error: "Los productos del carrito superan el límite permitido para tu combinación actual." };
  }

  const cart: Cart = { lines: nonZeroLines, couponCode: data.couponCode };
  const subtotal = computeSubtotal(cart);

  // Cupón (autoritativo): límites de uso total/por cliente y "solo primera
  // compra" se comprueban aquí, contra coupon_redemptions y orders reales
  // — nunca solo en la previsualización del cliente (validateCouponAction).
  let coupon = null;
  if (data.couponCode) {
    const found = await promotionsRepository.findCouponByCode(data.couponCode);
    if (found) {
      const [existingCustomerForCoupon] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, data.contact.phone)).limit(1);
      const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(couponRedemptions).where(eq(couponRedemptions.couponId, found.id));
      let customerRedemptions = 0;
      let isFirstOrder = true;
      if (existingCustomerForCoupon) {
        const [customerRow] = await db.select({ count: sql<number>`count(*)` }).from(couponRedemptions)
          .where(and(eq(couponRedemptions.couponId, found.id), eq(couponRedemptions.customerId, existingCustomerForCoupon.id)));
        customerRedemptions = Number(customerRow?.count ?? 0);
        const [orderCountRow] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.customerId, existingCustomerForCoupon.id));
        isFirstOrder = Number(orderCountRow?.count ?? 0) === 0;
      }
      const validation = validateCoupon(found, {
        subtotal,
        totalUnits: totalUnits(cart),
        now: new Date(),
        totalRedemptions: Number(totalRow?.count ?? 0),
        customerRedemptions,
        isFirstOrder,
      });
      if (validation.valid) coupon = validation.coupon;
    }
  }

  // Envío (se resuelve antes que las recompensas: el envío gratis puede
  // estar restringido a zonas específicas, sección 12).
  const quote = await shippingResolver.resolve(data.destination, subtotal);
  if (!quote) {
    return { ok: false, error: await resolveNoCoverageMessage(data.destination) };
  }

  // Recompensas (autoritativas).
  const rewardRules = await promotionsRepository.listActiveRewardRules();
  const rewards = evaluateRewards(rewardRules, {
    subtotal,
    totalUnits: totalUnits(cart),
    zoneIds: quote.matchingZoneIds,
  });

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
    attribution = JSON.parse(decodeURIComponent(cookieStore.get("shoppluscol_utm_last")?.value ?? "%7B%7D")) as Record<string, string>;
    firstAttribution = JSON.parse(decodeURIComponent(cookieStore.get("shoppluscol_utm_first")?.value ?? "%7B%7D")) as Record<string, string>;
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
  // Sin transacción real (D1 no soporta transacciones interactivas): si algo
  // falla después de crear el pedido (p. ej. Mercado Pago rechaza la
  // preferencia), hay que borrar a mano lo que ya se insertó. `orders` borra
  // en cascada order_items/order_status_history/order_adjustments/payments,
  // así que basta con guardar estos dos ids.
  let createdOrderId: string | null = null;
  let createdConsentRecordId: string | null = null;

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
        // El cliente no admite "no presentado": si la casilla no se mostró,
        // el cliente nuevo arranca sin consentimiento de marketing.
        marketingConsent: marketingConsentValue ?? false,
        firstOrderAt: new Date(),
        lastOrderAt: new Date(),
      }).returning();
    } else {
      await db.update(customers).set({
        fullName: data.contact.fullName,
        email: data.contact.email || customer.email,
        // Si la casilla no se presentó en este pedido, se conserva la
        // preferencia previa del cliente en vez de revocarla en silencio.
        ...(marketingConsentValue === null ? {} : { marketingConsent: marketingConsentValue }),
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
      marketingConsent: marketingConsentValue,
      utmSource: attribution.source,
      utmMedium: attribution.medium,
      utmCampaign: attribution.campaign,
      utmContent: attribution.content,
      utmTerm: attribution.term,
      utmFirstAttribution: firstAttribution,
      utmLastAttribution: attribution,
    }).returning();
    createdOrderId = order.id;

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
    const [consentRecord] = await db.insert(consentRecords).values({
      subjectId: customer.id,
      analytics: data.consent.analytics,
      marketing: data.consent.marketing,
      policyVersion: "2026-07-29",
    }).returning();
    createdConsentRecordId = consentRecord.id;

    // Registra el uso del cupón (cascada con el pedido si algo falla después
    // de esto y hay que deshacerlo) — es lo que hace cumplibles sus límites
    // de uso total/por cliente en el próximo pedido.
    if (coupon) {
      await db.insert(couponRedemptions).values({
        couponId: coupon.id,
        orderId: order.id,
        customerId: customer.id,
        discountAmount: summary.couponDiscount.amount,
      });
    }

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

    // Correo de confirmación (sección 38, evento "order_created"): solo si
    // el cliente dejó su correo, y nunca a costa del pedido — si falla o
    // SMTP no está configurado, el pedido ya se confirmó igual.
    if (data.contact.email) {
      try {
        const brand = await getBrandSettings();
        const email = buildOrderConfirmationEmail(result.order, brand.name, process.env.NEXT_PUBLIC_SITE_URL ?? "");
        await new ConfiguredNotificationProvider().send({
          event: "order_created",
          to: data.contact.email,
          subject: email.subject,
          data: { html: email.html, text: email.text },
        });
      } catch {
        // Nunca rompe el pedido ya confirmado.
      }
    }

    // Purchase solo cuando el pedido ya quedó confirmado sin pago pendiente
    // (p. ej. contra entrega). Si queda esperando pago, la compra la reporta
    // el webhook al aprobarse — nunca las dos. `emitPurchaseEventOnce`
    // garantiza además que solo se envíe una vez por pedido.
    if (order.status === "confirmed") {
      try {
        await emitPurchaseEventOnce({
          orderId: order.id,
          value: summary.total.amount,
          eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout/confirmacion`,
          email: data.contact.email || null,
          phone: data.contact.phone,
          utmSource: attribution.source ?? null,
          utmCampaign: attribution.campaign ?? null,
          marketingConsent: marketingConsentValue === true,
        });
      } catch {
        // La analítica nunca rompe un pedido ya confirmado.
      }
    }

    return result;
  } catch (error) {
    for (const reservation of reserved) {
      await db.update(inventoryItems).set({
        quantityReserved: sql`max(0, ${inventoryItems.quantityReserved} - ${reservation.quantity})`,
        updatedAt: new Date(),
      }).where(eq(inventoryItems.id, reservation.id));
    }
    // Deshace lo que ya se insertó antes del fallo (p. ej. Mercado Pago
    // rechazó la preferencia después de crear el pedido): si no se borra el
    // pedido aquí, un reintento con la misma idempotencyKey del cliente
    // choca con la fila `payments` ya creada (UNIQUE en idempotency_key).
    if (createdOrderId) await db.delete(orders).where(eq(orders.id, createdOrderId));
    if (createdConsentRecordId) await db.delete(consentRecords).where(eq(consentRecords.id, createdConsentRecordId));
    await db.delete(idempotencyKeys).where(eq(idempotencyKeys.key, data.idempotencyKey));
    return { ok: false, error: error instanceof Error ? error.message : "No fue posible crear el pedido." };
  }
}
