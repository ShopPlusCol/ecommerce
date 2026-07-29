import { describe, expect, it } from "vitest";
import {
  CHECKOUT_CONFIRMATION_PATH,
  resolveCheckoutDestination,
} from "@/modules/checkout/last-order";

describe("destino posterior al checkout", () => {
  it("abre la confirmación local cuando el proveedor no entrega una URL", () => {
    expect(resolveCheckoutDestination(null)).toBe(CHECKOUT_CONFIRMATION_PATH);
  });

  it("respeta la URL externa entregada por el proveedor de pagos", () => {
    const checkoutUrl = "https://www.mercadopago.com.co/checkout/v1/redirect";

    expect(resolveCheckoutDestination(checkoutUrl)).toBe(checkoutUrl);
  });
});
