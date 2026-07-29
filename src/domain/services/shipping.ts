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
  zone: {
    level: ShippingLevel;
    country: string;
    department: string | null;
    city: string | null;
    neighborhood: string | null;
  };
  fee: Money;
  freeShippingThreshold: Money | null;
  cashOnDeliveryAllowed: boolean;
  requiresAdvancePayment: boolean;
  advancePercentage: number | null;
  estimatedBusinessDaysMin: number;
  estimatedBusinessDaysMax: number;
  sameDayCutoffHour: number | null;
  customerMessage: string;
  priority: number;
  status: "draft" | "active" | "inactive";
};

function normalize(value: string | null | undefined): string {
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
  if (zone.neighborhood && normalize(zone.neighborhood) !== normalize(dest.neighborhood)) return false;
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
    .sort((a, b) => {
      const specificityDiff = LEVEL_SPECIFICITY[b.zone.level] - LEVEL_SPECIFICITY[a.zone.level];
      if (specificityDiff !== 0) return specificityDiff;
      return b.priority - a.priority;
    });

  const winner = candidates[0];
  if (!winner) return null;

  const qualifiesForFreeShipping =
    winner.freeShippingThreshold !== null && cartTotal.amount >= winner.freeShippingThreshold.amount;

  return {
    ruleId: winner.ruleId,
    ruleLevel: winner.zone.level,
    fee: qualifiesForFreeShipping ? { amount: 0, currency: "COP" } : winner.fee,
    freeShippingThreshold: winner.freeShippingThreshold,
    cashOnDeliveryAllowed: winner.cashOnDeliveryAllowed,
    requiresAdvancePayment: winner.requiresAdvancePayment,
    advancePercentage: winner.advancePercentage,
    estimatedBusinessDaysMin: winner.estimatedBusinessDaysMin,
    estimatedBusinessDaysMax: winner.estimatedBusinessDaysMax,
    sameDayCutoffHour: winner.sameDayCutoffHour,
    customerMessage: winner.customerMessage,
  };
}
