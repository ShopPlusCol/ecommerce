"use server";

import { getPaymentMethodsSettings, type PaymentMethodsSettings } from "@/modules/settings/payment-methods";

/** Nombre y descripción editables de cada método de pago, para el checkout y la confirmación de pedido. */
export async function getPaymentMethodsCopyAction(): Promise<PaymentMethodsSettings> {
  return getPaymentMethodsSettings();
}
