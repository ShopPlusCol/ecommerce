import { describe, expect, it } from "vitest";
import { money } from "@/domain/value-objects/money";
import { resolveEffectiveZoneConfig, resolveShippingQuote, type ShippingRuleConfig, type ShippingZoneNode } from "@/domain/services/shipping";

function zone(overrides: Partial<ShippingZoneNode> & { id: string; name: string; level: ShippingZoneNode["level"] }): ShippingZoneNode {
  return {
    parentZoneId: null,
    status: "active",
    ...overrides,
  };
}

function rule(overrides: Partial<ShippingRuleConfig> & { ruleId: string; zoneId: string }): ShippingRuleConfig {
  return {
    fee: null,
    freeShippingThreshold: null,
    coverage: null,
    cashOnDeliveryAllowed: null,
    requiresAdvancePayment: null,
    advancePercentage: null,
    sameDayAvailable: null,
    sameDayCutoffHour: null,
    estimatedBusinessDaysMin: null,
    estimatedBusinessDaysMax: null,
    allowedPaymentMethods: null,
    customerMessage: null,
    ...overrides,
  };
}

const country = zone({ id: "z-co", name: "Resto de Colombia", level: "country" });
const antioquia = zone({ id: "z-antioquia", name: "Antioquia", level: "department" });
const medellin = zone({ id: "z-medellin", name: "Medellín", level: "city", parentZoneId: "z-antioquia" });
const bello = zone({ id: "z-bello", name: "Bello", level: "city", parentZoneId: "z-antioquia" });
const poblado = zone({ id: "z-poblado", name: "El Poblado", level: "neighborhood", parentZoneId: "z-medellin" });
const cundinamarca = zone({ id: "z-cundinamarca", name: "Cundinamarca", level: "department" });

const baseZones: ShippingZoneNode[] = [country, antioquia, medellin, bello, poblado, cundinamarca];

const ruleCountry = rule({ ruleId: "r-co", zoneId: "z-co", fee: money(20_000), requiresAdvancePayment: true });
const ruleAntioquia = rule({ ruleId: "r-antioquia", zoneId: "z-antioquia", fee: money(15_000) });
const ruleMedellin = rule({
  ruleId: "r-medellin",
  zoneId: "z-medellin",
  fee: money(8_000),
  cashOnDeliveryAllowed: true,
  requiresAdvancePayment: false,
  sameDayAvailable: true,
  sameDayCutoffHour: 14,
});
const rulePoblado = rule({ ruleId: "r-poblado", zoneId: "z-poblado", fee: money(6_000) });

const baseRules: ShippingRuleConfig[] = [ruleCountry, ruleAntioquia, ruleMedellin, rulePoblado];

const NOON_BOGOTA = new Date("2026-07-30T17:00:00Z"); // 12:00 en America/Bogota

function destination(overrides: Partial<{ country: string; department: string; city: string; neighborhood: string | null }>) {
  return { country: "CO", department: "", city: "", neighborhood: null, ...overrides };
}

describe("resolveShippingQuote — resolución del árbol Departamento › Ciudad › Barrio", () => {
  it("usa el barrio cuando coincide exactamente (nivel más específico)", () => {
    const quote = resolveShippingQuote(
      baseZones,
      baseRules,
      destination({ department: "Antioquia", city: "Medellín", neighborhood: "El Poblado" }),
      money(50_000),
      NOON_BOGOTA,
    );
    expect(quote?.ruleId).toBe("r-poblado");
    expect(quote?.fee).toEqual(money(6_000));
    expect(quote?.matchingZoneIds).toEqual(["z-poblado", "z-medellin", "z-antioquia"]);
  });

  it("cae a la ciudad si el barrio no tiene zona propia configurada", () => {
    const quote = resolveShippingQuote(
      baseZones,
      baseRules,
      destination({ department: "Antioquia", city: "Medellín", neighborhood: "Laureles" }),
      money(50_000),
      NOON_BOGOTA,
    );
    expect(quote?.ruleId).toBe("r-medellin");
    expect(quote?.feeSource).toBeNull();
  });

  it("un departamento sin ciudades configuradas usa directamente su propia tarifa", () => {
    const ruleCundinamarca = rule({ ruleId: "r-cundinamarca", zoneId: "z-cundinamarca", fee: money(18_000) });
    const quote = resolveShippingQuote(
      baseZones,
      [...baseRules, ruleCundinamarca],
      destination({ department: "Cundinamarca", city: "Bogotá", neighborhood: null }),
      money(50_000),
      NOON_BOGOTA,
    );
    expect(quote?.ruleId).toBe("r-cundinamarca");
  });

  it("cae al país de respaldo si el departamento del destino no está configurado", () => {
    const quote = resolveShippingQuote(
      baseZones,
      baseRules,
      destination({ department: "Chocó", city: "Quibdó", neighborhood: null }),
      money(50_000),
      NOON_BOGOTA,
    );
    expect(quote?.ruleId).toBe("r-co");
  });

  it("tolera tildes y mayúsculas en el destino", () => {
    const quote = resolveShippingQuote(
      baseZones,
      baseRules,
      destination({ department: "ANTIOQUIA", city: "medellin", neighborhood: "el poblado" }),
      money(50_000),
      NOON_BOGOTA,
    );
    expect(quote?.ruleId).toBe("r-poblado");
  });

  it("devuelve null si ninguna zona ni ancestro tiene tarifa (no inventa tarifa)", () => {
    const zonesWithoutCountry = baseZones.filter((z) => z.level !== "country");
    const quote = resolveShippingQuote(
      zonesWithoutCountry,
      [ruleAntioquia, ruleMedellin, rulePoblado],
      destination({ department: "Chocó", city: "Quibdó", neighborhood: null }),
      money(50_000),
      NOON_BOGOTA,
    );
    expect(quote).toBeNull();
  });
});

describe("resolveShippingQuote — herencia por campo (sección 17.2)", () => {
  it("Bello (sin fila de regla propia) hereda todo de Antioquia", () => {
    const quote = resolveShippingQuote(baseZones, baseRules, destination({ department: "Antioquia", city: "Bello", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote?.ruleId).toBe("r-antioquia");
    expect(quote?.fee).toEqual(money(15_000));
    expect(quote?.feeSource).toEqual({ zoneId: "z-antioquia", zoneName: "Antioquia" });
  });

  it("mezcla campos propios y heredados: barrio con solo tarifa propia hereda contraentrega y mismo día de la ciudad", () => {
    const quote = resolveShippingQuote(baseZones, baseRules, destination({ department: "Antioquia", city: "Medellín", neighborhood: "El Poblado" }), money(50_000), NOON_BOGOTA);
    expect(quote?.fee).toEqual(money(6_000)); // propia del barrio
    expect(quote?.feeSource).toBeNull(); // fue propia, no heredada
    expect(quote?.cashOnDeliveryAllowed).toBe(true); // heredado de Medellín
    expect(quote?.sameDayEligible).toBe(true); // heredado de Medellín (mismo día antes de las 14h, ver NOON_BOGOTA)
  });

  it("un valor propio (no nulo) en un nivel intermedio detiene la herencia en ese punto", () => {
    const ruleMedellinFree = rule({ ruleId: "r-medellin-2", zoneId: "z-medellin", cashOnDeliveryAllowed: false });
    const quote = resolveShippingQuote(baseZones, [ruleAntioquia, ruleMedellinFree, rulePoblado], destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote?.cashOnDeliveryAllowed).toBe(false);
  });

  it("aplica envío gratis cuando el carrito supera el umbral heredado o propio", () => {
    const ruleMedellinFree = rule({ ruleId: "r-medellin-free", zoneId: "z-medellin", fee: money(8_000), freeShippingThreshold: money(120_000) });
    const quote = resolveShippingQuote(baseZones, [ruleMedellinFree], destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(150_000), NOON_BOGOTA);
    expect(quote?.fee).toEqual(money(0));
  });
});

describe("resolveShippingQuote — estado activo/inactivo en cascada (sección 17.4)", () => {
  it("una zona inactiva no es una opción válida", () => {
    const inactiveMedellin = { ...medellin, status: "inactive" as const };
    const zones = [country, antioquia, inactiveMedellin, bello, poblado];
    const quote = resolveShippingQuote(zones, baseRules, destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote).toBeNull();
  });

  it("un barrio no puede quedar activo si su ciudad está inactiva (cascada de ancestros)", () => {
    const inactiveMedellin = { ...medellin, status: "inactive" as const };
    const zones = [country, antioquia, inactiveMedellin, bello, poblado];
    const quote = resolveShippingQuote(zones, baseRules, destination({ department: "Antioquia", city: "Medellín", neighborhood: "El Poblado" }), money(50_000), NOON_BOGOTA);
    expect(quote).toBeNull();
  });

  it("un departamento inactivo bloquea también a sus ciudades activas", () => {
    const inactiveAntioquia = { ...antioquia, status: "inactive" as const };
    const zones = [country, inactiveAntioquia, medellin, bello, poblado];
    const quote = resolveShippingQuote(zones, baseRules, destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote).toBeNull();
  });
});

describe("resolveShippingQuote — cobertura (sección 17.4)", () => {
  it("coverage='unavailable' propio bloquea la zona aunque haya tarifa heredable", () => {
    const ruleMedellinNoCoverage = rule({ ruleId: "r-medellin-nc", zoneId: "z-medellin", coverage: "unavailable" });
    const quote = resolveShippingQuote(baseZones, [ruleAntioquia, ruleMedellinNoCoverage], destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote).toBeNull();
  });

  it("coverage='unavailable' heredado de un ancestro también bloquea", () => {
    const ruleAntioquiaNoCoverage = rule({ ruleId: "r-antioquia-nc", zoneId: "z-antioquia", fee: money(15_000), coverage: "unavailable" });
    const quote = resolveShippingQuote(baseZones, [ruleAntioquiaNoCoverage], destination({ department: "Antioquia", city: "Bello", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote).toBeNull();
  });

  it("coverage='unavailable' en un barrio no afecta a otros barrios de la misma ciudad", () => {
    const ruleMedellinNoCoverage = rule({ ruleId: "r-medellin-nc", zoneId: "z-medellin", fee: money(8_000), coverage: "unavailable" });
    const laureles = zone({ id: "z-laureles", name: "Laureles", level: "neighborhood", parentZoneId: "z-medellin" });
    const ruleLaureles = rule({ ruleId: "r-laureles", zoneId: "z-laureles", coverage: "available", fee: money(5_000) });
    const zones = [...baseZones, laureles];
    const quote = resolveShippingQuote(zones, [ruleAntioquia, ruleMedellinNoCoverage, ruleLaureles], destination({ department: "Antioquia", city: "Medellín", neighborhood: "Laureles" }), money(50_000), NOON_BOGOTA);
    expect(quote?.ruleId).toBe("r-laureles");
  });
});

describe("resolveShippingQuote — entrega el mismo día con hora límite (sección 17.6)", () => {
  it("antes de la hora límite: mismo día elegible", () => {
    const before = new Date("2026-07-30T18:00:00Z"); // 13:00 Bogotá, límite 14:00
    const quote = resolveShippingQuote(baseZones, baseRules, destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(50_000), before);
    expect(quote?.sameDayEligible).toBe(true);
  });

  it("después de la hora límite: mismo día ya no elegible, se mantienen los días hábiles configurados", () => {
    const after = new Date("2026-07-30T20:00:00Z"); // 15:00 Bogotá, después del límite de 14:00
    const ruleMedellinDays = rule({
      ruleId: "r-medellin-days",
      zoneId: "z-medellin",
      fee: money(8_000),
      sameDayAvailable: true,
      sameDayCutoffHour: 14,
      estimatedBusinessDaysMin: 1,
      estimatedBusinessDaysMax: 3,
    });
    const quote = resolveShippingQuote(baseZones, [ruleMedellinDays], destination({ department: "Antioquia", city: "Medellín", neighborhood: null }), money(50_000), after);
    expect(quote?.sameDayEligible).toBe(false);
    expect(quote?.estimatedBusinessDaysMin).toBe(1);
    expect(quote?.estimatedBusinessDaysMax).toBe(3);
  });

  it("sin mismo día habilitado, nunca es elegible sin importar la hora", () => {
    const quote = resolveShippingQuote(baseZones, baseRules, destination({ department: "Antioquia", city: "Bello", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote?.sameDayEligible).toBe(false);
  });
});

describe("resolveShippingQuote — valores por defecto cuando nada en la cadena define un campo", () => {
  it("usa contraentrega=false, sin anticipo=false y días hábiles 1-3 por defecto si nadie en la cadena los define", () => {
    const minimalRule = rule({ ruleId: "r-min", zoneId: "z-co", fee: money(10_000) });
    const quote = resolveShippingQuote(baseZones, [minimalRule], destination({ department: "Chocó", city: "Quibdó", neighborhood: null }), money(50_000), NOON_BOGOTA);
    expect(quote?.cashOnDeliveryAllowed).toBe(false);
    expect(quote?.requiresAdvancePayment).toBe(false);
    expect(quote?.estimatedBusinessDaysMin).toBe(1);
    expect(quote?.estimatedBusinessDaysMax).toBe(3);
    expect(quote?.sameDayEligible).toBe(false);
  });
});

describe("resolveEffectiveZoneConfig — para el panel de administración (propia vs. heredada)", () => {
  it("devuelve null si la zona no existe", () => {
    expect(resolveEffectiveZoneConfig(baseZones, baseRules, "no-existe")).toBeNull();
  });

  it("marca un campo propio sin inheritedFrom", () => {
    const config = resolveEffectiveZoneConfig(baseZones, baseRules, "z-medellin");
    expect(config?.fee.value).toEqual(money(8_000));
    expect(config?.fee.inheritedFrom).toBeNull();
  });

  it("marca un campo heredado con la zona ancestro de origen", () => {
    const config = resolveEffectiveZoneConfig(baseZones, baseRules, "z-bello");
    expect(config?.fee.value).toEqual(money(15_000));
    expect(config?.fee.inheritedFrom).toEqual(antioquia);
  });

  it("effectivelyActive es false si algún ancestro está inactivo, aunque la zona misma esté activa", () => {
    const inactiveAntioquia = { ...antioquia, status: "inactive" as const };
    const zones = [country, inactiveAntioquia, medellin, bello, poblado];
    const config = resolveEffectiveZoneConfig(zones, baseRules, "z-medellin");
    expect(config?.zone.status).toBe("active");
    expect(config?.effectivelyActive).toBe(false);
  });

  it("un campo sin valor propio ni heredado queda en null sin inheritedFrom", () => {
    const config = resolveEffectiveZoneConfig(baseZones, baseRules, "z-co");
    expect(config?.coverage.value).toBeNull();
    expect(config?.coverage.inheritedFrom).toBeNull();
  });
});
