import type { Money } from "@/domain/value-objects/money";
import { money, ZERO_COP } from "@/domain/value-objects/money";
import type { ShippingQuote } from "@/application/ports/shipping-rate-resolver";

/** Métodos de pago iniciales (sección 18.1), detrás de una interfaz común. */
export type PaymentMethodId =
  | "mercado_pago"
  | "cash_on_delivery"
  | "shipping_advance_transfer"
  | "transfer_full";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  mercado_pago: "Mercado Pago (pago total en línea)",
  cash_on_delivery: "Pago contra entrega",
  shipping_advance_transfer: "Transferencia del envío ahora + saldo contra entrega",
  transfer_full: "Transferencia del total por anticipado",
};

/**
 * Métodos disponibles según la regla de envío resuelta. Si la zona exige
 * anticipo (fuera de cobertura contra entrega), no se ofrece contra entrega
 * total; en su lugar, anticipo del envío (sección 17.4).
 */
export function availablePaymentMethods(quote: ShippingQuote): PaymentMethodId[] {
  const methods: PaymentMethodId[] = ["mercado_pago", "transfer_full"];
  if (quote.requiresAdvancePayment) {
    methods.push("shipping_advance_transfer");
  }
  if (quote.cashOnDeliveryAllowed && !quote.requiresAdvancePayment) {
    methods.push("cash_on_delivery");
  }
  return methods;
}

export type PaymentSplit = {
  amountDueNow: Money;
  amountDueOnDelivery: Money;
  reason: string;
};

/**
 * Divide el total entre "pagar ahora" y "pagar al recibir" según el método.
 * Nunca confunde el anticipo con un descuento (sección 16.4): la suma de
 * ambos siempre es el total.
 */
export function computePaymentSplit(params: {
  total: Money;
  productsTotal: Money;
  shippingFee: Money;
  method: PaymentMethodId;
}): PaymentSplit {
  const { total, productsTotal, shippingFee, method } = params;
  switch (method) {
    case "mercado_pago":
    case "transfer_full":
      return {
        amountDueNow: total,
        amountDueOnDelivery: ZERO_COP,
        reason: "Pago total por anticipado.",
      };
    case "cash_on_delivery":
      return {
        amountDueNow: ZERO_COP,
        amountDueOnDelivery: total,
        reason: "Pagas todo al recibir el pedido.",
      };
    case "shipping_advance_transfer":
      return {
        amountDueNow: shippingFee,
        amountDueOnDelivery: productsTotal,
        reason: "Pagas el envío ahora; el valor de los productos queda como saldo contra entrega.",
      };
    default:
      return { amountDueNow: money(0), amountDueOnDelivery: total, reason: "" };
  }
}
