import { describe, expect, it } from "vitest";
import { resetConfirmation, validateResetConfirmation } from "@/modules/admin/data-reset";

describe("confirmaciones de limpieza administrativa", () => {
  it("exige la frase exacta y el reconocimiento del backup", () => {
    expect(() => validateResetConfirmation("orders", "borrar", "on")).toThrow(/exactamente/);
    expect(() => validateResetConfirmation("orders", resetConfirmation("orders"), null)).toThrow(/backup/);
    expect(() => validateResetConfirmation("orders", resetConfirmation("orders"), "on")).not.toThrow();
  });

  it("usa frases diferentes para pedidos y clientes", () => {
    expect(resetConfirmation("orders")).not.toBe(resetConfirmation("customers"));
  });
});
