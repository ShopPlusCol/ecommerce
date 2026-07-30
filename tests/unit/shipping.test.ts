import { describe, expect, it } from "vitest";
import { money } from "@/domain/value-objects/money";
import { resolveShippingQuote, type ShippingRuleWithZone } from "@/domain/services/shipping";

function rule(overrides: Partial<ShippingRuleWithZone> & { ruleId: string }): ShippingRuleWithZone {
  return {
    zoneId: overrides.ruleId,
    zone: { level: "country", country: "CO", department: null, city: null, neighborhood: null },
    fee: money(20_000),
    freeShippingThreshold: null,
    cashOnDeliveryAllowed: false,
    requiresAdvancePayment: true,
    advancePercentage: null,
    estimatedBusinessDaysMin: 2,
    estimatedBusinessDaysMax: 5,
    sameDayCutoffHour: null,
    customerMessage: "",
    priority: 0,
    status: "active",
    ...overrides,
  };
}

const country = rule({ ruleId: "co", fee: money(20_000) });
const department = rule({
  ruleId: "antioquia",
  fee: money(15_000),
  zone: { level: "department", country: "CO", department: "Antioquia", city: null, neighborhood: null },
});
const city = rule({
  ruleId: "medellin",
  fee: money(8_000),
  cashOnDeliveryAllowed: true,
  requiresAdvancePayment: false,
  zone: { level: "city", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: null },
});
const neighborhood = rule({
  ruleId: "poblado",
  fee: money(6_000),
  cashOnDeliveryAllowed: true,
  requiresAdvancePayment: false,
  zone: { level: "neighborhood", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "El Poblado" },
});

const allRules = [country, department, city, neighborhood];

describe("resolveShippingQuote — jerarquía país › depto › ciudad › barrio (sección 17.1)", () => {
  it("la excepción de barrio gana sobre ciudad", () => {
    const quote = resolveShippingQuote(allRules, {
      country: "CO",
      department: "Antioquia",
      city: "Medellín",
      neighborhood: "El Poblado",
    }, money(50_000));
    expect(quote?.ruleId).toBe("poblado");
    expect(quote?.fee).toEqual(money(6_000));
  });

  it("usa ciudad cuando no hay excepción de barrio", () => {
    const quote = resolveShippingQuote(allRules, {
      country: "CO",
      department: "Antioquia",
      city: "Medellín",
      neighborhood: "Laureles",
    }, money(50_000));
    expect(quote?.ruleId).toBe("medellin");
  });

  it("usa departamento cuando no hay regla de ciudad", () => {
    const quote = resolveShippingQuote(allRules, {
      country: "CO",
      department: "Antioquia",
      city: "Rionegro",
      neighborhood: null,
    }, money(50_000));
    expect(quote?.ruleId).toBe("antioquia");
  });

  it("usa país cuando no hay regla de departamento", () => {
    const quote = resolveShippingQuote(allRules, {
      country: "CO",
      department: "Cundinamarca",
      city: "Bogotá",
      neighborhood: null,
    }, money(50_000));
    expect(quote?.ruleId).toBe("co");
  });

  it("tolera tildes y mayúsculas en el destino", () => {
    const quote = resolveShippingQuote(allRules, {
      country: "co",
      department: "ANTIOQUIA",
      city: "medellin",
      neighborhood: "el poblado",
    }, money(50_000));
    expect(quote?.ruleId).toBe("poblado");
  });

  it("devuelve null si ninguna regla aplica (no inventa tarifa)", () => {
    const quote = resolveShippingQuote(
      [department, city],
      { country: "PE", department: "Lima", city: "Lima", neighborhood: null },
      money(50_000),
    );
    expect(quote).toBeNull();
  });

  it("aplica envío gratis al superar el umbral", () => {
    const withThreshold = rule({
      ruleId: "med-free",
      fee: money(8_000),
      freeShippingThreshold: money(120_000),
      cashOnDeliveryAllowed: true,
      requiresAdvancePayment: false,
      zone: { level: "city", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: null },
    });
    const quote = resolveShippingQuote([withThreshold], {
      country: "CO",
      department: "Antioquia",
      city: "Medellín",
      neighborhood: null,
    }, money(150_000));
    expect(quote?.fee).toEqual(money(0));
  });

  it("ignora reglas inactivas", () => {
    const inactive = rule({ ruleId: "off", status: "inactive", fee: money(1) });
    const quote = resolveShippingQuote([inactive, country], {
      country: "CO",
      department: "X",
      city: "Y",
      neighborhood: null,
    }, money(50_000));
    expect(quote?.ruleId).toBe("co");
  });

  it("respeta los límites de valor configurados por regla", () => {
    const limited = rule({
      ruleId: "limited",
      minOrderAmount: money(50_000),
      maxOrderAmount: money(150_000),
    });
    const target = {
      country: "CO",
      department: "Antioquia",
      city: "Medellín",
      neighborhood: null,
    };
    expect(resolveShippingQuote([limited], target, money(49_999))).toBeNull();
    expect(resolveShippingQuote([limited], target, money(50_000))?.ruleId).toBe("limited");
    expect(resolveShippingQuote([limited], target, money(150_001))).toBeNull();
  });
});

describe("resolveShippingQuote — grupos de barrios y sin cobertura (sección 17.5)", () => {
  const groupRule = rule({
    ruleId: "oriente",
    fee: money(7_000),
    zone: { level: "neighborhood", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: null, neighborhoodNames: ["Guayabal", "Castropol"] },
  });

  it("coincide con cualquier barrio del grupo, sin importar tildes/mayúsculas", () => {
    const target = { country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "castropol" };
    expect(resolveShippingQuote([city, groupRule], target, money(50_000))?.ruleId).toBe("oriente");
  });

  it("un barrio fuera del grupo no coincide y cae a la ciudad", () => {
    const target = { country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "Laureles" };
    expect(resolveShippingQuote([city, groupRule], target, money(50_000))?.ruleId).toBe("medellin");
  });

  it("una zona de grupo sin barrios (recién creada) nunca coincide", () => {
    const empty = rule({
      ruleId: "vacio",
      fee: money(1),
      zone: { level: "neighborhood", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: null, neighborhoodNames: [] },
    });
    const target = { country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "Guayabal" };
    expect(resolveShippingQuote([city, empty], target, money(50_000))?.ruleId).toBe("medellin");
  });

  it("sin cobertura: gana por especificidad pero no hereda la tarifa de ciudad", () => {
    const noCoverage = rule({
      ruleId: "sin-cobertura",
      fee: money(0),
      blocksDelivery: true,
      zone: { level: "neighborhood", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: null, neighborhoodNames: ["Zona Rural"] },
    });
    const target = { country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "Zona Rural" };
    expect(resolveShippingQuote([city, noCoverage], target, money(50_000))).toBeNull();
  });

  it("sin cobertura no afecta a otros barrios de la misma ciudad", () => {
    const noCoverage = rule({
      ruleId: "sin-cobertura",
      fee: money(0),
      blocksDelivery: true,
      zone: { level: "neighborhood", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: null, neighborhoodNames: ["Zona Rural"] },
    });
    const target = { country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "Laureles" };
    expect(resolveShippingQuote([city, noCoverage], target, money(50_000))?.ruleId).toBe("medellin");
  });
});
