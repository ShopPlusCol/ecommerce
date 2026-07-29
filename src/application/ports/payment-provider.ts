import type { Money } from "@/domain/value-objects/money";

/**
 * Puerto que encapsula cualquier proveedor de pago (Mercado Pago,
 * transferencia manual, futuros adaptadores). Ningún componente de negocio
 * debe importar un SDK de pago directamente: siempre a través de esta
 * interfaz (sección 18.2 y 28.1 del prompt maestro).
 */
export type PaymentIntentRequest = {
  orderId: string;
  externalReference: string;
  amount: Money;
  idempotencyKey: string;
  description: string;
};

export type PaymentIntentResult = {
  providerPaymentId: string;
  status: "pending" | "approved" | "rejected" | "in_process";
  checkoutUrl: string | null;
};

export type PaymentWebhookPayload = {
  providerPaymentId: string;
  externalReference: string;
  status: "pending" | "approved" | "rejected" | "in_process" | "cancelled" | "refunded" | "charged_back";
  rawEventId: string;
};

export interface PaymentProvider {
  readonly id: string;
  createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult>;
  verifyWebhookSignature(params: {
    signatureHeader: string | null;
    requestId: string | null;
    dataId: string | null;
  }): boolean;
  parseWebhookPayload(rawBody: string): PaymentWebhookPayload;
}
