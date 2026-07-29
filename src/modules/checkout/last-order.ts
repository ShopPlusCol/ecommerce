import type { DemoOrder } from "@/modules/checkout/order-types";

/** Clave de sessionStorage para la confirmación del pedido recién creado. */
export const LAST_ORDER_KEY = "shoppluscol.lastOrder.v1";
export const CHECKOUT_CONFIRMATION_PATH = "/checkout/confirmacion";

export function resolveCheckoutDestination(checkoutUrl: string | null): string {
  return checkoutUrl ?? CHECKOUT_CONFIRMATION_PATH;
}

export function readLastOrder(): DemoOrder | null {
  try {
    const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoOrder;
  } catch {
    return null;
  }
}
