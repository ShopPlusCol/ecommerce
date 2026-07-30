import type { Money } from "@/domain/value-objects/money";

/**
 * Puerto para resolver la tarifa de envío aplicable. La implementación en
 * infraestructura camina el árbol Departamento › Ciudad/Municipio › Barrio
 * (sección 17.1) hasta la zona configurada más específica que coincida con
 * el destino, y arma la configuración efectiva heredando campo por campo
 * desde los ancestros que sí tengan un valor propio. Si ningún ancestro
 * tiene tarifa, NO se inventa una: retorna null y el checkout debe mostrar
 * "cotización requerida".
 */
export type ShippingDestination = {
  country: string;
  department: string;
  city: string;
  neighborhood: string | null;
};

export type ShippingQuote = {
  /** Regla (shipping_rules.id) que aportó la tarifa efectiva — para el snapshot del pedido. */
  ruleId: string;
  /** Nivel de la zona que aportó la tarifa efectiva (propia o heredada). */
  ruleLevel: "country" | "department" | "city" | "neighborhood";
  /** IDs de la zona resuelta y todos sus ancestros, para restringir recompensas por zona (sección 12). */
  matchingZoneIds: string[];
  fee: Money;
  /** Si la tarifa es heredada de un ancestro (no propia de la zona más específica que coincidió), de dónde viene. */
  feeSource: { zoneId: string; zoneName: string } | null;
  freeShippingThreshold: Money | null;
  cashOnDeliveryAllowed: boolean;
  requiresAdvancePayment: boolean;
  advancePercentage: number | null;
  estimatedBusinessDaysMin: number;
  estimatedBusinessDaysMax: number;
  /** Si, a la hora actual, todavía aplica "mismo día" (ya considera la hora límite, sección 17.6). */
  sameDayEligible: boolean;
  sameDayCutoffHour: number | null;
  customerMessage: string;
  allowedPaymentMethods?: Array<
    "mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full"
  >;
};

export interface ShippingRateResolver {
  resolve(destination: ShippingDestination, cartTotal: Money): Promise<ShippingQuote | null>;
}
