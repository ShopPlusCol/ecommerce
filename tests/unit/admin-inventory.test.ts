import { describe, expect, it } from "vitest";
import {
  inventoryAvailable,
  validateInventoryAdjustment,
} from "@/modules/inventory/admin-inventory";

describe("inventario administrativo", () => {
  it("calcula disponibilidad descontando reservas", () => {
    expect(inventoryAvailable({ quantityOnHand: 10, quantityReserved: 3 })).toBe(7);
  });

  it("impide existencias negativas", () => {
    expect(
      validateInventoryAdjustment({ quantityOnHand: 2, quantityReserved: 0 }, -3),
    ).toMatchObject({ ok: false });
  });

  it("impide reducir por debajo de reservas activas", () => {
    expect(
      validateInventoryAdjustment({ quantityOnHand: 8, quantityReserved: 6 }, -3),
    ).toMatchObject({ ok: false });
  });

  it("acepta entradas y salidas que preservan reservas", () => {
    expect(
      validateInventoryAdjustment({ quantityOnHand: 8, quantityReserved: 3 }, -4),
    ).toEqual({ ok: true, nextOnHand: 4 });
    expect(
      validateInventoryAdjustment({ quantityOnHand: 8, quantityReserved: 3 }, 5),
    ).toEqual({ ok: true, nextOnHand: 13 });
  });
});
