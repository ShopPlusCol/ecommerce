import type { PaymentIntentRequest, PaymentProvider } from "@/application/ports/payment-provider";

export class ManualTransferProvider implements PaymentProvider {
  readonly id = "manual_transfer";
  async createPaymentIntent(request: PaymentIntentRequest) {
    return { providerPaymentId: request.externalReference, status: "pending" as const, checkoutUrl: null };
  }
  verifyWebhookSignature() { return false; }
  parseWebhookPayload(): never { throw new Error("Transferencia manual no recibe webhooks."); }
}
