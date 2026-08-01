import { describe, expect, it } from "vitest";
import { canTransitionOrderStatus, ORDER_STATUS_TRANSITIONS } from "@/domain/services/order-status";

describe("canTransitionOrderStatus", () => {
  it("permite el avance normal del flujo", () => {
    expect(canTransitionOrderStatus("confirmed", "in_preparation")).toBe(true);
    expect(canTransitionOrderStatus("dispatched", "in_transit")).toBe(true);
  });

  it("rechaza retroceder un pedido ya entregado", () => {
    expect(canTransitionOrderStatus("delivered", "draft")).toBe(false);
    expect(canTransitionOrderStatus("delivered", "confirmed")).toBe(false);
  });

  it("rechaza mover un pedido reembolsado a cualquier otro estado", () => {
    for (const status of Object.keys(ORDER_STATUS_TRANSITIONS)) {
      if (status === "refunded") continue;
      expect(canTransitionOrderStatus("refunded", status as never)).toBe(false);
    }
  });

  it("rechaza quedarse en el mismo estado", () => {
    expect(canTransitionOrderStatus("confirmed", "confirmed")).toBe(false);
  });

  it("permite cancelar desde la mayoría de estados activos", () => {
    expect(canTransitionOrderStatus("pending_payment", "cancelled")).toBe(true);
    expect(canTransitionOrderStatus("confirmed", "cancelled")).toBe(true);
  });

  it("permite que un incidente se resuelva hacia adelante o hacia cancelación/reembolso", () => {
    expect(canTransitionOrderStatus("incident", "in_transit")).toBe(true);
    expect(canTransitionOrderStatus("incident", "refunded")).toBe(true);
  });
});
