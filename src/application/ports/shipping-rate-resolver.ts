import type { Money } from "@/domain/value-objects/money";

/**
 * Puerto para resolver la tarifa de envío aplicable. La implementación en
 * infraestructura consulta la jerarquía país > departamento > ciudad >
 * barrio > excepción (sección 17.1); la regla más específica gana.
 * Si ninguna regla aplica, NO debe inventar una tarifa: retorna null y
 * el checkout debe mostrar "cotización requerida".
 */
export type ShippingDestination = {
  country: string;
  department: string;
  city: string;
  neighborhood: string | null;
};

export type ShippingQuote = {
  ruleId: string;
  ruleLevel: "country" | "department" | "city" | "neighborhood" | "exception";
  fee: Money;
  freeShippingThreshold: Money | null;
  cashOnDeliveryAllowed: boolean;
  requiresAdvancePayment: boolean;
  advancePercentage: number | null;
  estimatedBusinessDaysMin: number;
  estimatedBusinessDaysMax: number;
  sameDayCutoffHour: number | null;
  customerMessage: string;
  allowedPaymentMethods?: Array<
    "mercado_pago" | "cash_on_delivery" | "shipping_advance_transfer" | "transfer_full"
  >;
};

export interface ShippingRateResolver {
  resolve(destination: ShippingDestination, cartTotal: Money): Promise<ShippingQuote | null>;
}
