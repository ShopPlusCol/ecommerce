import { money } from "@/domain/value-objects/money";
import type { ShippingDestination, ShippingQuote, ShippingRateResolver } from "@/application/ports/shipping-rate-resolver";
import { resolveShippingQuote, type ShippingRuleConfig, type ShippingZoneNode } from "@/domain/services/shipping";

/**
 * Árbol de zonas de desarrollo (Fase 2): Antioquia (Medellín con
 * contraentrega y mismo día, Bello heredando de Antioquia) más un nivel
 * país de respaldo para el resto de Colombia, y El Poblado con tarifa
 * propia dentro de Medellín. Editable desde el panel en producción; esta
 * lista y las tarifas son solo de ejemplo.
 */
export const DEMO_SHIPPING_ZONES: ShippingZoneNode[] = [
  { id: "zone-nacional", name: "Resto de Colombia", level: "country", parentZoneId: null, status: "active" },
  { id: "zone-antioquia", name: "Antioquia", level: "department", parentZoneId: null, status: "active" },
  { id: "zone-medellin", name: "Medellín", level: "city", parentZoneId: "zone-antioquia", status: "active" },
  { id: "zone-bello", name: "Bello", level: "city", parentZoneId: "zone-antioquia", status: "active" },
  { id: "zone-poblado", name: "El Poblado", level: "neighborhood", parentZoneId: "zone-medellin", status: "active" },
];

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

export const DEMO_SHIPPING_RULES: ShippingRuleConfig[] = [
  rule({
    ruleId: "rule-nacional",
    zoneId: "zone-nacional",
    fee: money(16_000),
    requiresAdvancePayment: true,
    estimatedBusinessDaysMin: 2,
    estimatedBusinessDaysMax: 6,
    customerMessage: "El envío se paga por anticipado; el valor de los productos queda como saldo contra entrega.",
  }),
  rule({
    ruleId: "rule-antioquia",
    zoneId: "zone-antioquia",
    fee: money(13_000),
    cashOnDeliveryAllowed: true,
    estimatedBusinessDaysMin: 1,
    estimatedBusinessDaysMax: 3,
    customerMessage: "Entrega en 1 a 3 días hábiles.",
  }),
  rule({
    ruleId: "rule-medellin",
    zoneId: "zone-medellin",
    fee: money(8_000),
    freeShippingThreshold: money(150_000),
    cashOnDeliveryAllowed: true,
    sameDayAvailable: true,
    sameDayCutoffHour: 14,
    estimatedBusinessDaysMin: 0,
    estimatedBusinessDaysMax: 1,
    customerMessage: "Entrega el mismo día pidiendo antes de las 2:00 p.m.",
  }),
  // Bello no tiene fila propia: hereda todo de Antioquia (sección 17.2).
  rule({
    ruleId: "rule-poblado",
    zoneId: "zone-poblado",
    fee: money(6_000),
    freeShippingThreshold: money(120_000),
    sameDayCutoffHour: 15,
    customerMessage: "Entrega el mismo día en El Poblado pidiendo antes de las 3:00 p.m.",
  }),
];

export class DemoShippingResolver implements ShippingRateResolver {
  async resolve(destination: ShippingDestination, cartTotal: { amount: number; currency: "COP" }): Promise<ShippingQuote | null> {
    return resolveShippingQuote(DEMO_SHIPPING_ZONES, DEMO_SHIPPING_RULES, destination, money(cartTotal.amount));
  }
}
