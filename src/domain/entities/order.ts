import type { Money } from "@/domain/value-objects/money";

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "partial_payment_required"
  | "payment_in_review"
  | "confirmed"
  | "in_preparation"
  | "ready_for_dispatch"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded"
  | "incident";

export type PaymentStatus =
  | "unpaid"
  | "advance_pending"
  | "advance_approved"
  | "full_payment_pending"
  | "paid"
  | "partially_paid"
  | "rejected"
  | "partially_refunded"
  | "refunded"
  | "disputed";

export type DeliveryMethod = "delivery" | "pickup";

export type OrderItemSnapshot = {
  productId: string;
  sku: string;
  name: string;
  unitPrice: Money;
  quantity: number;
  discount: Money;
};

/**
 * Instantánea financiera e informativa de un pedido en el momento de la
 * compra. Un cambio posterior en catálogo, zonas o promociones nunca debe
 * alterar estos valores (sección 19.2 del prompt maestro).
 */
export type OrderSnapshot = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  deliveryMethod: DeliveryMethod;
  items: OrderItemSnapshot[];
  subtotal: Money;
  discountTotal: Money;
  shippingFee: Money;
  total: Money;
  amountDueNow: Money;
  amountPaid: Money;
  amountDueOnDelivery: Money;
  couponCode: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  createdAt: string;
};
