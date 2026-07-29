import { describe, expect, it } from "vitest";
import {
  add,
  compare,
  formatMoney,
  InvalidMoneyError,
  isZero,
  money,
  multiply,
  percentageOf,
  subtract,
  ZERO_COP,
} from "@/domain/value-objects/money";

describe("Money (COP entero)", () => {
  it("formatea con separador de miles y símbolo de peso", () => {
    expect(formatMoney(money(49_000))).toBe("$49.000");
    expect(formatMoney(ZERO_COP)).toBe("$0");
  });

  it("rechaza montos no enteros o negativos", () => {
    expect(() => money(49_000.5)).toThrow(InvalidMoneyError);
    expect(() => money(-1)).toThrow(InvalidMoneyError);
  });

  it("suma y resta sin bajar de cero", () => {
    expect(add(money(49_000), money(13_000))).toEqual(money(62_000));
    expect(subtract(money(10_000), money(15_000))).toEqual(ZERO_COP);
  });

  it("multiplica y calcula porcentaje redondeando al entero más cercano", () => {
    expect(multiply(money(49_000), 2)).toEqual(money(98_000));
    expect(percentageOf(money(49_000), 10)).toEqual(money(4_900));
  });

  it("compara montos", () => {
    expect(compare(money(1), money(2))).toBe(-1);
    expect(compare(money(2), money(1))).toBe(1);
    expect(compare(money(2), money(2))).toBe(0);
  });

  it("identifica montos en cero", () => {
    expect(isZero(ZERO_COP)).toBe(true);
    expect(isZero(money(1))).toBe(false);
  });
});
