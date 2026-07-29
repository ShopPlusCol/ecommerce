"use server";

import { z } from "zod";
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
  consent: z.object({ terms: z.boolean(), marketing: z.boolean() }),
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
  return { ok: true, quote, methods: availablePaymentMethods(quote) };
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
  const methods = availablePaymentMethods(quote);
  if (!methods.includes(data.paymentMethod)) {
    return { ok: false, error: "El método de pago no está disponible para tu zona." };
  }

  const summary = computeOrderSummary(cart, {
    coupon,
    rewards,
    shippingQuote: quote,
    paymentMethod: data.paymentMethod,
  });

  const orderNumber = `SPC-${Date.now().toString().slice(-8)}`;

  return {
    ok: true,
    order: {
      orderNumber,
      createdAt: new Date().toISOString(),
      isDemo: true,
      contact: data.contact,
      destination: data.destination,
      paymentMethod: data.paymentMethod,
      quote,
      items: lines.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        name: l.name,
        colorFamilyName: l.colorFamilyName,
        unitPrice: l.unitPrice.amount,
        quantity: l.quantity,
        imageUrl: l.imageUrl,
      })),
      summary,
    },
  };
}
