import type { Coupon } from "@/domain/entities/promotions";
import type { OrderSummary } from "@/domain/services/cart-pricing";
import type { PaymentMethodId } from "@/domain/services/payments";
import type { ShippingDestination, ShippingQuote } from "@/application/ports/shipping-rate-resolver";

export type CartItemInput = { productId: string; quantity: number };

export type CheckoutContact = {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  addressComplement: string;
  deliveryInstructions: string;
};

export type CreateDemoOrderInput = {
  idempotencyKey: string;
  items: CartItemInput[];
  couponCode: string | null;
  destination: ShippingDestination;
  paymentMethod: PaymentMethodId;
  contact: CheckoutContact;
  // marketing: null = la casilla no se mostró (campo desactivado en
  // configuración) — nunca se interpreta como "el cliente dijo que no".
  consent: { terms: boolean; marketing: boolean | null; analytics: boolean };
};

export type DemoOrderItem = {
  productId: string;
  sku: string;
  name: string;
  colorFamilyName: string | null;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
};

export type DemoOrder = {
  orderNumber: string;
  createdAt: string;
  isDemo: false;
  lookupToken: string;
  checkoutUrl: string | null;
  manualTransfer: {
    bankName: string;
    accountType: string;
    accountNumber: string;
    accountHolder: string;
    instructions: string;
    qrUrl: string | null;
  } | null;
  contact: CheckoutContact;
  destination: ShippingDestination;
  paymentMethod: PaymentMethodId;
  quote: ShippingQuote;
  items: DemoOrderItem[];
  summary: OrderSummary;
};

export type QuoteShippingResult =
  | { ok: true; quote: ShippingQuote; methods: PaymentMethodId[] }
  | { ok: false; reason: string };

export type ValidateCouponResult = { ok: true; coupon: Coupon } | { ok: false; error: string };

export type CreateDemoOrderResult =
  | { ok: true; order: DemoOrder }
  // couponInvalidated: el cupón que el cliente vio aplicado en el resumen
  // dejó de ser válido justo al confirmar (límite alcanzado por otro pedido
  // concurrente, expiró, etc.) — el cliente debe ver el nuevo total y
  // confirmar de nuevo antes de reintentar, nunca se crea el pedido a un
  // precio mayor sin que lo sepa.
  | { ok: false; error: string; couponInvalidated?: boolean };
