import type { Money } from "@/domain/value-objects/money";
import { money } from "@/domain/value-objects/money";
import type { ShippingDestination, ShippingQuote } from "@/application/ports/shipping-rate-resolver";
import { resolveSameDayEligibility } from "@/domain/services/business-time";

export type ShippingLevel = "country" | "department" | "city" | "neighborhood";

export type ShippingZoneNode = {
  id: string;
  name: string;
  level: ShippingLevel;
  parentZoneId: string | null;
  status: "active" | "inactive";
};

/** Configuración propia de una zona (a lo sumo una por zona). Cada campo nulo significa "hereda del ancestro más cercano que tenga un valor" (sección 17.2). */
export type ShippingRuleConfig = {
  ruleId: string;
  zoneId: string;
  fee: Money | null;
  freeShippingThreshold: Money | null;
  coverage: "available" | "unavailable" | null;
  cashOnDeliveryAllowed: boolean | null;
  requiresAdvancePayment: boolean | null;
  advancePercentage: number | null;
  sameDayAvailable: boolean | null;
  sameDayCutoffHour: number | null;
  estimatedBusinessDaysMin: number | null;
  estimatedBusinessDaysMax: number | null;
  allowedPaymentMethods:
    | Array<"mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full">
    | null;
  customerMessage: string | null;
};

/** Normaliza texto (minúsculas, sin tildes) para comparar destinos/nombres de zona sin distinguir mayúsculas ni acentos. */
export function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function findChild(zones: ShippingZoneNode[], parentId: string, level: ShippingLevel, name: string): ShippingZoneNode | undefined {
  const target = normalize(name);
  return zones.find((z) => z.level === level && z.parentZoneId === parentId && normalize(z.name) === target);
}

/**
 * Camina Departamento › Ciudad/Municipio › Barrio hasta la zona configurada
 * más específica que coincide con el destino, profundizando solo mientras
 * haya una zona hija que coincida (sección 17.3): si un nivel no tiene
 * zonas configuradas, o ninguna coincide con el destino, se queda en el
 * nivel más específico que sí encontró.
 */
export function resolveTargetZone(zones: ShippingZoneNode[], destination: ShippingDestination): ShippingZoneNode | null {
  const department = zones.find((z) => z.level === "department" && normalize(z.name) === normalize(destination.department));
  if (!department) {
    return zones.find((z) => z.level === "country") ?? null;
  }
  const city = findChild(zones, department.id, "city", destination.city);
  if (!city) return department;
  if (!destination.neighborhood) return city;
  const neighborhood = findChild(zones, city.id, "neighborhood", destination.neighborhood);
  return neighborhood ?? city;
}

/** Zona objetivo seguida de todos sus ancestros, hasta la raíz (protegido contra ciclos). */
function ancestorChain(zones: ShippingZoneNode[], target: ShippingZoneNode): ShippingZoneNode[] {
  const byId = new Map(zones.map((z) => [z.id, z]));
  const chain: ShippingZoneNode[] = [];
  const seen = new Set<string>();
  let cursor: ShippingZoneNode | null = target;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    chain.push(cursor);
    cursor = cursor.parentZoneId ? byId.get(cursor.parentZoneId) ?? null : null;
  }
  return chain;
}

function firstOwn<K extends keyof ShippingRuleConfig>(
  chain: ShippingZoneNode[],
  rulesByZoneId: Map<string, ShippingRuleConfig>,
  key: K,
): { value: NonNullable<ShippingRuleConfig[K]>; source: ShippingZoneNode } | null {
  for (const zone of chain) {
    const value = rulesByZoneId.get(zone.id)?.[key];
    if (value !== null && value !== undefined) {
      return { value: value as NonNullable<ShippingRuleConfig[K]>, source: zone };
    }
  }
  return null;
}

/**
 * Resuelve la tarifa y configuración de envío efectiva para un destino
 * (sección 17). Encuentra la zona configurada más específica, valida
 * disponibilidad efectiva (la zona y todos sus ancestros deben estar
 * activos y con cobertura), y arma la configuración final heredando cada
 * campo del ancestro más cercano que lo tenga definido. Sin tarifa en toda
 * la cadena → null (no se inventa una tarifa).
 */
export function resolveShippingQuote(
  zones: ShippingZoneNode[],
  rules: ShippingRuleConfig[],
  destination: ShippingDestination,
  cartTotal: Money,
  now: Date = new Date(),
): ShippingQuote | null {
  const target = resolveTargetZone(zones, destination);
  if (!target) return null;

  const chain = ancestorChain(zones, target);
  if (chain.some((z) => z.status !== "active")) return null;

  const rulesByZoneId = new Map(rules.map((r) => [r.zoneId, r]));

  const coverage = firstOwn(chain, rulesByZoneId, "coverage");
  if (coverage?.value === "unavailable") return null;

  const feeResult = firstOwn(chain, rulesByZoneId, "fee");
  if (!feeResult) return null;

  const winningRule = rulesByZoneId.get(feeResult.source.id);
  if (!winningRule) return null;

  const freeShippingThreshold = firstOwn(chain, rulesByZoneId, "freeShippingThreshold")?.value ?? null;
  const qualifiesForFreeShipping = freeShippingThreshold !== null && cartTotal.amount >= freeShippingThreshold.amount;
  const sameDayAvailable = firstOwn(chain, rulesByZoneId, "sameDayAvailable")?.value ?? false;
  const sameDayCutoffHour = firstOwn(chain, rulesByZoneId, "sameDayCutoffHour")?.value ?? null;

  return {
    ruleId: winningRule.ruleId,
    ruleLevel: feeResult.source.level,
    matchingZoneIds: chain.map((z) => z.id),
    fee: qualifiesForFreeShipping ? money(0) : feeResult.value,
    feeSource: feeResult.source.id === target.id ? null : { zoneId: feeResult.source.id, zoneName: feeResult.source.name },
    freeShippingThreshold,
    cashOnDeliveryAllowed: firstOwn(chain, rulesByZoneId, "cashOnDeliveryAllowed")?.value ?? false,
    requiresAdvancePayment: firstOwn(chain, rulesByZoneId, "requiresAdvancePayment")?.value ?? false,
    advancePercentage: firstOwn(chain, rulesByZoneId, "advancePercentage")?.value ?? null,
    estimatedBusinessDaysMin: firstOwn(chain, rulesByZoneId, "estimatedBusinessDaysMin")?.value ?? 1,
    estimatedBusinessDaysMax: firstOwn(chain, rulesByZoneId, "estimatedBusinessDaysMax")?.value ?? 3,
    sameDayEligible: resolveSameDayEligibility(sameDayAvailable, sameDayCutoffHour, now),
    sameDayCutoffHour,
    customerMessage: firstOwn(chain, rulesByZoneId, "customerMessage")?.value ?? "",
    allowedPaymentMethods: firstOwn(chain, rulesByZoneId, "allowedPaymentMethods")?.value,
  };
}

/**
 * Nombre de la zona configurada más específica que coincide con el destino
 * (para mostrárselo al cliente en el mensaje de "sin cobertura"). Si no hubo
 * ninguna coincidencia real (se cayó al respaldo nacional), arma el nombre
 * desde el destino tal como lo escribió el cliente.
 */
export function resolveDestinationLabel(zones: ShippingZoneNode[], destination: ShippingDestination): string {
  const target = resolveTargetZone(zones, destination);
  if (target && target.level !== "country") return target.name;
  const parts = [destination.neighborhood, destination.city].filter((part): part is string => Boolean(part && part.trim()));
  if (parts.length) return parts.join(", ");
  return destination.department.trim() || "tu ubicación";
}

/**
 * Mensaje propio (heredable) para el destino, si alguna zona en su cadena
 * de ancestros lo definió; `null` si ninguna — en ese caso el llamador debe
 * usar el mensaje global personalizable en su lugar.
 */
export function resolveRejectionMessage(zones: ShippingZoneNode[], rules: ShippingRuleConfig[], destination: ShippingDestination): string | null {
  const target = resolveTargetZone(zones, destination);
  if (!target) return null;
  const chain = ancestorChain(zones, target);
  const rulesByZoneId = new Map(rules.map((r) => [r.zoneId, r]));
  return firstOwn(chain, rulesByZoneId, "customerMessage")?.value ?? null;
}

type EffectiveField<K extends keyof ShippingRuleConfig> = {
  value: ShippingRuleConfig[K] | null;
  /** Ancestro del que se heredó el valor; null si es propio de la zona o si nadie en la cadena lo define. */
  inheritedFrom: ShippingZoneNode | null;
};

export type EffectiveZoneConfig = {
  zone: ShippingZoneNode;
  /** La zona y todos sus ancestros (ella incluida), del más específico al más general. */
  chain: ShippingZoneNode[];
  /** true si la zona misma y todos sus ancestros están activos (sección 17.4). */
  effectivelyActive: boolean;
  fee: EffectiveField<"fee">;
  freeShippingThreshold: EffectiveField<"freeShippingThreshold">;
  coverage: EffectiveField<"coverage">;
  cashOnDeliveryAllowed: EffectiveField<"cashOnDeliveryAllowed">;
  requiresAdvancePayment: EffectiveField<"requiresAdvancePayment">;
  advancePercentage: EffectiveField<"advancePercentage">;
  sameDayAvailable: EffectiveField<"sameDayAvailable">;
  sameDayCutoffHour: EffectiveField<"sameDayCutoffHour">;
  estimatedBusinessDaysMin: EffectiveField<"estimatedBusinessDaysMin">;
  estimatedBusinessDaysMax: EffectiveField<"estimatedBusinessDaysMax">;
  allowedPaymentMethods: EffectiveField<"allowedPaymentMethods">;
  customerMessage: EffectiveField<"customerMessage">;
};

/**
 * Arma, para una zona puntual del panel de administración, el valor
 * efectivo de cada campo heredable y de dónde viene (propio vs. heredado de
 * qué ancestro) — misma lógica de herencia que resolveShippingQuote, para
 * que el panel nunca muestre algo distinto de lo que calcula el checkout.
 */
export function resolveEffectiveZoneConfig(
  zones: ShippingZoneNode[],
  rules: ShippingRuleConfig[],
  zoneId: string,
): EffectiveZoneConfig | null {
  const byId = new Map(zones.map((z) => [z.id, z]));
  const target = byId.get(zoneId);
  if (!target) return null;

  const chain = ancestorChain(zones, target);
  const rulesByZoneId = new Map(rules.map((r) => [r.zoneId, r]));

  function field<K extends keyof ShippingRuleConfig>(key: K): EffectiveField<K> {
    const result = firstOwn(chain, rulesByZoneId, key);
    return {
      value: result?.value ?? null,
      inheritedFrom: result && result.source.id !== target!.id ? result.source : null,
    };
  }

  return {
    zone: target,
    chain,
    effectivelyActive: chain.every((z) => z.status === "active"),
    fee: field("fee"),
    freeShippingThreshold: field("freeShippingThreshold"),
    coverage: field("coverage"),
    cashOnDeliveryAllowed: field("cashOnDeliveryAllowed"),
    requiresAdvancePayment: field("requiresAdvancePayment"),
    advancePercentage: field("advancePercentage"),
    sameDayAvailable: field("sameDayAvailable"),
    sameDayCutoffHour: field("sameDayCutoffHour"),
    estimatedBusinessDaysMin: field("estimatedBusinessDaysMin"),
    estimatedBusinessDaysMax: field("estimatedBusinessDaysMax"),
    allowedPaymentMethods: field("allowedPaymentMethods"),
    customerMessage: field("customerMessage"),
  };
}
