import type { Money } from "@/domain/value-objects/money";
import type { ShippingDestination, ShippingQuote } from "@/application/ports/shipping-rate-resolver";

/** Nivel jerárquico de una zona (sección 17.1). Más específico gana. */
export type ShippingLevel = "country" | "department" | "city" | "neighborhood";

const LEVEL_SPECIFICITY: Record<ShippingLevel, number> = {
  country: 1,
  department: 2,
  city: 3,
  neighborhood: 4,
};

export type ShippingRuleWithZone = {
  ruleId: string;
  zoneId: string;
  zone: {
    level: ShippingLevel;
    country: string;
    department: string | null;
    city: string | null;
    neighborhood: string | null;
    /** Para zonas nivel "neighborhood": barrios que comparten esta fila (grupo). */
    neighborhoodNames?: string[] | null;
  };
  /** Si es verdadero, esta regla significa "sin cobertura" (sección 17.5): no se debe inventar una tarifa de un nivel más amplio. */
  blocksDelivery?: boolean;
  fee: Money;
  freeShippingThreshold: Money | null;
  cashOnDeliveryAllowed: boolean;
  requiresAdvancePayment: boolean;
  advancePercentage: number | null;
  estimatedBusinessDaysMin: number;
  estimatedBusinessDaysMax: number;
  sameDayCutoffHour: number | null;
  customerMessage: string;
  minOrderAmount?: Money | null;
  maxOrderAmount?: Money | null;
  allowedPaymentMethods?: Array<
    "mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full"
  >;
  priority: number;
  status: "draft" | "active" | "inactive";
};

/** Normaliza texto (minúsculas, sin tildes) para comparar destinos/nombres de barrio sin distinguir mayúsculas ni acentos. */
export function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Una regla aplica si cada nivel definido en su zona coincide con el destino. */
function ruleMatchesDestination(rule: ShippingRuleWithZone, dest: ShippingDestination): boolean {
  const { zone } = rule;
  if (normalize(zone.country) !== normalize(dest.country)) return false;
  if (zone.department && normalize(zone.department) !== normalize(dest.department)) return false;
  if (zone.city && normalize(zone.city) !== normalize(dest.city)) return false;
  if (zone.level === "neighborhood") {
    const names = zone.neighborhoodNames && zone.neighborhoodNames.length > 0 ? zone.neighborhoodNames : zone.neighborhood ? [zone.neighborhood] : [];
    if (names.length === 0) return false;
    const target = normalize(dest.neighborhood);
    if (!target) return false;
    if (!names.some((name) => normalize(name) === target)) return false;
  }
  return true;
}

/**
 * Selecciona la regla de envío más específica y válida para un destino
 * (sección 17.1). Empata por especificidad de nivel y luego por prioridad.
 * Devuelve null si ninguna regla aplica: el checkout NO debe inventar una
 * tarifa, debe mostrar "cotización requerida".
 */
export function resolveShippingQuote(
  rules: ShippingRuleWithZone[],
  destination: ShippingDestination,
  cartTotal: Money,
): ShippingQuote | null {
  const candidates = rules
    .filter((rule) => rule.status === "active")
    .filter((rule) => ruleMatchesDestination(rule, destination))
    .filter(
      (rule) =>
        (rule.minOrderAmount === undefined ||
          rule.minOrderAmount === null ||
          cartTotal.amount >= rule.minOrderAmount.amount) &&
        (rule.maxOrderAmount === undefined ||
          rule.maxOrderAmount === null ||
          cartTotal.amount <= rule.maxOrderAmount.amount),
    )
    .sort((a, b) => {
      const specificityDiff = LEVEL_SPECIFICITY[b.zone.level] - LEVEL_SPECIFICITY[a.zone.level];
      if (specificityDiff !== 0) return specificityDiff;
      return b.priority - a.priority;
    });

  const winner = candidates[0];
  if (!winner) return null;
  // "Sin cobertura" (sección 17.5): la zona más específica gana, pero en vez
  // de heredar la tarifa de un nivel más amplio, no hay envío disponible.
  if (winner.blocksDelivery) return null;

  const qualifiesForFreeShipping =
    winner.freeShippingThreshold !== null && cartTotal.amount >= winner.freeShippingThreshold.amount;

  return {
    ruleId: winner.ruleId,
    ruleLevel: winner.zone.level,
    matchingZoneIds: [...new Set(candidates.map((candidate) => candidate.zoneId))],
    fee: qualifiesForFreeShipping ? { amount: 0, currency: "COP" } : winner.fee,
    freeShippingThreshold: winner.freeShippingThreshold,
    cashOnDeliveryAllowed: winner.cashOnDeliveryAllowed,
    requiresAdvancePayment: winner.requiresAdvancePayment,
    advancePercentage: winner.advancePercentage,
    estimatedBusinessDaysMin: winner.estimatedBusinessDaysMin,
    estimatedBusinessDaysMax: winner.estimatedBusinessDaysMax,
    sameDayCutoffHour: winner.sameDayCutoffHour,
    customerMessage: winner.customerMessage,
    allowedPaymentMethods: winner.allowedPaymentMethods,
  };
}
