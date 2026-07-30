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
function resolveTargetZone(zones: ShippingZoneNode[], destination: ShippingDestination): ShippingZoneNode | null {
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
