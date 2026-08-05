import { describe, expect, it } from "vitest";
import { ORDER_STATUSES } from "@/infrastructure/db/schema/orders";
import {
  availableDirectTransitions,
  canDirectlyTransitionOrderStatus,
  directTransitionBlockedReason,
  SENSITIVE_ORDER_STATUSES,
  type OrderStatus,
} from "@/domain/services/order-status";

describe("saltos directos entre estados del pedido", () => {
  it("permite los saltos que el propietario necesita a diario", () => {
    // La operación real no avanza en línea recta: un pedido puede pasar de
    // "pendiente" a "entregado" el mismo día.
    const cases: Array<[OrderStatus, OrderStatus]> = [
      ["pending_payment", "delivered"],
      ["confirmed", "delivered"],
      ["in_preparation", "delivered"],
      ["confirmed", "cancelled"],
      ["dispatched", "in_preparation"],
      ["delivered", "cancelled"],
    ];
    for (const [from, to] of cases) {
      expect(canDirectlyTransitionOrderStatus(from, to), `${from} → ${to}`).toBe(true);
    }
  });

  it("no permite quedarse en el mismo estado", () => {
    expect(canDirectlyTransitionOrderStatus("confirmed", "confirmed")).toBe(false);
  });

  it("bloquea reactivar un pedido que ya devolvió su inventario", () => {
    // Esas unidades pudieron venderse a otra persona entre medias.
    for (const from of ["cancelled", "returned", "refunded"] as OrderStatus[]) {
      const reason = directTransitionBlockedReason(from, "confirmed");
      expect(reason, `${from} → confirmed`).toBeTruthy();
      expect(reason).toMatch(/inventario/i);
    }
  });

  it("explica el bloqueo en lenguaje entendible, no con un código", () => {
    const reason = directTransitionBlockedReason("cancelled", "in_preparation")!;
    expect(reason).not.toMatch(/[_{}]|null|undefined/);
    expect(reason.length).toBeGreaterThan(30);
  });

  it("sí permite moverse entre estados ya devueltos", () => {
    // Cancelado → reembolsado, o devuelto → reembolsado, no reactivan nada.
    expect(canDirectlyTransitionOrderStatus("cancelled", "refunded")).toBe(true);
    expect(canDirectlyTransitionOrderStatus("returned", "refunded")).toBe(true);
    expect(canDirectlyTransitionOrderStatus("delivered", "returned")).toBe(true);
  });

  it("el selector ofrece todos los estados válidos, no solo el siguiente paso", () => {
    const options = availableDirectTransitions("confirmed", ORDER_STATUSES);
    expect(options).toContain("delivered");
    expect(options).toContain("cancelled");
    expect(options).toContain("in_transit");
    expect(options).not.toContain("confirmed");
    // Antes solo se ofrecían 3 destinos desde "confirmed".
    expect(options.length).toBeGreaterThan(5);
  });

  it("usa el catálogo de estados del proyecto, sin inventar ninguno", () => {
    const options = availableDirectTransitions("pending_payment", ORDER_STATUSES);
    for (const status of options) {
      expect(ORDER_STATUSES).toContain(status);
    }
  });

  it("marca como delicados los estados que mueven inventario o cierran el pedido", () => {
    expect(SENSITIVE_ORDER_STATUSES).toContain("cancelled");
    expect(SENSITIVE_ORDER_STATUSES).toContain("delivered");
    expect(SENSITIVE_ORDER_STATUSES).toContain("returned");
    expect(SENSITIVE_ORDER_STATUSES).toContain("refunded");
  });
});
