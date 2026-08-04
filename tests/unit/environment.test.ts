import { describe, expect, it } from "vitest";
import {
  applyTestOrderPrefix,
  isTestOrderNumber,
  resolveEnvironment,
  TEST_ORDER_PREFIX,
} from "@/modules/settings/environment";

describe("identidad del entorno", () => {
  it("reconoce staging por APP_ENVIRONMENT", () => {
    const info = resolveEnvironment({ APP_ENVIRONMENT: "staging", NODE_ENV: "production" });
    expect(info.environment).toBe("staging");
    expect(info.isTestEnvironment).toBe(true);
    expect(info.label).toBe("Entorno de pruebas");
  });

  it("APP_ENVIRONMENT manda sobre NODE_ENV", () => {
    // Staging corre con NODE_ENV=production (es un build de producción),
    // así que deducirlo solo de NODE_ENV lo daría por producción real.
    expect(resolveEnvironment({ APP_ENVIRONMENT: "staging", NODE_ENV: "production" }).isTestEnvironment).toBe(true);
  });

  it("producción no muestra aviso de entorno", () => {
    const info = resolveEnvironment({ NODE_ENV: "production" });
    expect(info.environment).toBe("production");
    expect(info.isTestEnvironment).toBe(false);
  });

  it("sin variables se asume desarrollo, no producción", () => {
    const info = resolveEnvironment({});
    expect(info.environment).toBe("development");
    expect(info.isTestEnvironment).toBe(true);
  });

  it("ignora un valor no reconocido en vez de confiar en él", () => {
    // Un valor mal escrito no debe colar como producción por accidente.
    expect(resolveEnvironment({ APP_ENVIRONMENT: "stagng", NODE_ENV: "production" }).environment).toBe("production");
    expect(resolveEnvironment({ APP_ENVIRONMENT: "cualquier-cosa" }).environment).toBe("development");
  });

  it("cada entorno explica sus consecuencias", () => {
    expect(resolveEnvironment({ APP_ENVIRONMENT: "staging" }).description).toMatch(/no son reales/i);
    expect(resolveEnvironment({ NODE_ENV: "production" }).description).toMatch(/reales/i);
  });
});

describe("marcado de pedidos de prueba", () => {
  const staging = resolveEnvironment({ APP_ENVIRONMENT: "staging" });
  const production = resolveEnvironment({ NODE_ENV: "production" });

  it("marca los pedidos creados fuera de producción", () => {
    expect(applyTestOrderPrefix("SPC-ABC-12", staging)).toBe(`${TEST_ORDER_PREFIX}SPC-ABC-12`);
  });

  it("no toca los pedidos de producción", () => {
    expect(applyTestOrderPrefix("SPC-ABC-12", production)).toBe("SPC-ABC-12");
  });

  it("no duplica el prefijo si ya está", () => {
    const once = applyTestOrderPrefix("SPC-ABC-12", staging);
    expect(applyTestOrderPrefix(once, staging)).toBe(once);
  });

  it("permite distinguir un pedido de prueba después, sin saber dónde se creó", () => {
    expect(isTestOrderNumber(applyTestOrderPrefix("SPC-ABC-12", staging))).toBe(true);
    expect(isTestOrderNumber("SPC-ABC-12")).toBe(false);
  });
});
