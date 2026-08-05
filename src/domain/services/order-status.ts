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

/**
 * Estados en los que el inventario del pedido ya fue devuelto al stock
 * (`restockOrderInventory` corre al entrar en ellos).
 */
const INVENTORY_RETURNED_STATUSES: readonly OrderStatus[] = ["cancelled", "returned", "refunded"];

/** Estados en los que el pedido sigue vivo y su inventario sigue comprometido. */
const ACTIVE_STATUSES: readonly OrderStatus[] = [
  "draft",
  "pending_payment",
  "partial_payment_required",
  "payment_in_review",
  "confirmed",
  "in_preparation",
  "ready_for_dispatch",
  "dispatched",
  "in_transit",
  "delivered",
  "incident",
];

/**
 * Cambios de estado que conviene confirmar con un clic antes de aplicarlos,
 * porque mueven inventario o cierran el pedido. **Nunca piden escribir una
 * nota**: solo confirmar.
 */
export const SENSITIVE_ORDER_STATUSES: readonly OrderStatus[] = ["cancelled", "returned", "refunded", "delivered"];

/**
 * Motivo por el que un salto directo entre estados no se permite, o `null`
 * si sí se permite.
 *
 * El panel permite ir de cualquier estado a cualquier otro — la operación
 * real no avanza en línea recta y obligar a pasar por cada paso solo
 * generaba historial falso. La única excepción es resucitar un pedido cuyo
 * inventario **ya se devolvió al stock**: ese inventario pudo venderse a
 * otra persona entre medias, así que reactivarlo sin volver a reservar
 * llevaría a vender lo que no hay. Se bloquea explicando el motivo, en vez
 * de bloquear todos los saltos.
 */
export function directTransitionBlockedReason(from: OrderStatus, to: OrderStatus): string | null {
  if (from === to) return "El pedido ya está en ese estado.";
  if (INVENTORY_RETURNED_STATUSES.includes(from) && ACTIVE_STATUSES.includes(to)) {
    return "Este pedido ya devolvió su inventario al stock, así que no puede reactivarse: las unidades pueden haberse vendido a otra persona. Crea un pedido nuevo.";
  }
  return null;
}

export function canDirectlyTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return directTransitionBlockedReason(from, to) === null;
}

/** Estados a los que se puede mover un pedido desde `from`, para el selector. */
export function availableDirectTransitions(from: OrderStatus, all: readonly OrderStatus[]): OrderStatus[] {
  return all.filter((status) => canDirectlyTransitionOrderStatus(from, status));
}
