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
  consent: { terms: boolean; marketing: boolean; analytics: boolean };
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

export type CreateDemoOrderResult = { ok: true; order: DemoOrder } | { ok: false; error: string };
