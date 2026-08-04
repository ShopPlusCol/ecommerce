import type { ORDER_STATUSES } from "@/infrastructure/db/schema/orders";

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/**
 * Transiciones operativas válidas del pedido. "cancelled" y "refunded" son
 * mayormente terminales (evita que un pedido ya entregado/reembolsado
 * "retroceda" por error); "incident" actúa como pausa y puede resolverse
 * hacia cualquier punto posterior del flujo o hacia cancelación/reembolso.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["partial_payment_required", "payment_in_review", "confirmed", "cancelled"],
  partial_payment_required: ["payment_in_review", "confirmed", "cancelled"],
  payment_in_review: ["confirmed", "cancelled"],
  confirmed: ["in_preparation", "cancelled", "incident"],
  in_preparation: ["ready_for_dispatch", "cancelled", "incident"],
  ready_for_dispatch: ["dispatched", "incident"],
  dispatched: ["in_transit", "incident"],
  in_transit: ["delivered", "incident"],
  delivered: ["returned", "incident"],
  cancelled: ["refunded"],
  returned: ["refunded", "incident"],
  refunded: [],
  incident: [
    "confirmed",
    "in_preparation",
    "ready_for_dispatch",
    "dispatched",
    "in_transit",
    "delivered",
    "cancelled",
    "refunded",
  ],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}
