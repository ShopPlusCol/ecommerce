import type { DemoOrder } from "@/modules/checkout/order-types";

/** Clave de sessionStorage donde el checkout deja el pedido de demostración recién creado. */
export const LAST_ORDER_KEY = "shoppluscol.lastOrder.v1";

export function readLastOrder(): DemoOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoOrder;
  } catch {
    return null;
  }
}
