import { money } from "@/domain/value-objects/money";
import type {
  ShippingDestination,
  ShippingQuote,
  ShippingRateResolver,
} from "@/application/ports/shipping-rate-resolver";
import { resolveShippingQuote, type ShippingRuleWithZone } from "@/domain/services/shipping";

/**
 * Reglas de envío de desarrollo (Fase 2). Cubren Medellín y Área
 * Metropolitana (contra entrega, mismo día), Antioquia y el resto de
 * Colombia (envío anticipado + saldo contra entrega). Editables desde el
 * panel en la Fase 3. La lista y las tarifas son de ejemplo.
 */
function cityRule(
  id: string,
  city: string,
  fee: number,
  extras: Partial<ShippingRuleWithZone> = {},
): ShippingRuleWithZone {
  return {
    ruleId: id,
    zoneId: `zone-${id}`,
    zone: { level: "city", country: "CO", department: "Antioquia", city, neighborhood: null },
    fee: money(fee),
    freeShippingThreshold: money(150_000),
    cashOnDeliveryAllowed: true,
    requiresAdvancePayment: false,
    advancePercentage: null,
    estimatedBusinessDaysMin: 0,
    estimatedBusinessDaysMax: 1,
    sameDayCutoffHour: 14,
    customerMessage: "Entrega el mismo día pidiendo antes de las 2:00 p.m.",
    priority: 0,
    status: "active",
    ...extras,
  };
}

export const DEMO_SHIPPING_RULES: ShippingRuleWithZone[] = [
  cityRule("med", "Medellín", 8_000),
  cityRule("bello", "Bello", 9_000),
  cityRule("envigado", "Envigado", 9_000),
  cityRule("itagui", "Itagüí", 9_000),
  cityRule("sabaneta", "Sabaneta", 9_000),
  cityRule("la-estrella", "La Estrella", 10_000),
  // Excepción de barrio: El Poblado tiene tarifa reducida.
  {
    ruleId: "poblado",
    zoneId: "zone-poblado",
    zone: { level: "neighborhood", country: "CO", department: "Antioquia", city: "Medellín", neighborhood: "El Poblado" },
    fee: money(6_000),
    freeShippingThreshold: money(120_000),
    cashOnDeliveryAllowed: true,
    requiresAdvancePayment: false,
    advancePercentage: null,
    estimatedBusinessDaysMin: 0,
    estimatedBusinessDaysMax: 1,
    sameDayCutoffHour: 15,
    customerMessage: "Entrega el mismo día en El Poblado pidiendo antes de las 3:00 p.m.",
    priority: 0,
    status: "active",
  },
  // Resto de Antioquia.
  {
    ruleId: "antioquia",
    zoneId: "zone-antioquia",
    zone: { level: "department", country: "CO", department: "Antioquia", city: null, neighborhood: null },
    fee: money(13_000),
    freeShippingThreshold: null,
    cashOnDeliveryAllowed: true,
    requiresAdvancePayment: false,
    advancePercentage: null,
    estimatedBusinessDaysMin: 1,
    estimatedBusinessDaysMax: 3,
    sameDayCutoffHour: null,
    customerMessage: "Entrega en 1 a 3 días hábiles.",
    priority: 0,
    status: "active",
  },
  // Resto de Colombia: envío anticipado, productos como saldo contra entrega.
  {
    ruleId: "nacional",
    zoneId: "zone-nacional",
    zone: { level: "country", country: "CO", department: null, city: null, neighborhood: null },
    fee: money(16_000),
    freeShippingThreshold: null,
    cashOnDeliveryAllowed: false,
    requiresAdvancePayment: true,
    advancePercentage: null,
    estimatedBusinessDaysMin: 2,
    estimatedBusinessDaysMax: 6,
    sameDayCutoffHour: null,
    customerMessage: "El envío se paga por anticipado; el valor de los productos queda como saldo contra entrega.",
    priority: 0,
    status: "active",
  },
];

export class DemoShippingResolver implements ShippingRateResolver {
  async resolve(destination: ShippingDestination, cartTotal: { amount: number; currency: "COP" }): Promise<ShippingQuote | null> {
    return resolveShippingQuote(DEMO_SHIPPING_RULES, destination, cartTotal);
  }
}
