import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  PaymentIntentRequest,
  PaymentIntentResult,
  PaymentProvider,
  PaymentWebhookPayload,
} from "@/application/ports/payment-provider";

type MercadoPagoPreference = { id: string; init_point?: string; sandbox_init_point?: string };
type MercadoPagoPayment = { id: number; status: string; external_reference: string };

export class MercadoPagoProvider implements PaymentProvider {
  readonly id = "mercado_pago";
  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret: string,
    private readonly testMode: boolean,
  ) {}

  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_SITE_URL es obligatorio para Mercado Pago.");
    // Mercado Pago rechaza la preferencia entera (400 "auto_return invalid")
    // si back_url.success no es una URL https públicamente resoluble — pasa
    // siempre en desarrollo local (http://localhost). Solo se pide el
    // regreso automático cuando el sitio ya tiene una URL https real.
    const canAutoReturn = baseUrl.startsWith("https://");
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": request.idempotencyKey,
      },
      body: JSON.stringify({
        items: [{ id: request.orderId, title: request.description, quantity: 1, currency_id: "COP", unit_price: request.amount.amount }],
        external_reference: request.externalReference,
        back_urls: {
          success: `${baseUrl}/checkout/confirmacion`,
          pending: `${baseUrl}/checkout/confirmacion`,
          failure: `${baseUrl}/checkout`,
        },
        ...(canAutoReturn ? { auto_return: "approved" } : {}),
        notification_url: `${baseUrl}/api/webhooks/mercado-pago`,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Mercado Pago rechazó la preferencia (${response.status}).${detail ? ` ${detail}` : ""}`);
    }
    const data = await response.json() as MercadoPagoPreference;
    return {
      providerPaymentId: data.id,
      status: "pending",
      checkoutUrl: this.testMode ? data.sandbox_init_point ?? data.init_point ?? null : data.init_point ?? null,
    };
  }

  verifyWebhookSignature({ signatureHeader, requestId, dataId }: { signatureHeader: string | null; requestId: string | null; dataId: string | null }) {
    if (!signatureHeader || !requestId || !dataId || !this.webhookSecret) return false;
    const parts = Object.fromEntries(signatureHeader.split(",").map((part) => part.trim().split("=", 2)));
    if (!parts.ts || !parts.v1) return false;
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
    const expected = createHmac("sha256", this.webhookSecret).update(manifest).digest("hex");
    const actualBuffer = Buffer.from(parts.v1);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  }

  parseWebhookPayload(rawBody: string): PaymentWebhookPayload {
    const data = JSON.parse(rawBody) as { id?: string; data?: { id?: string } };
    const id = String(data.data?.id ?? "");
    if (!id) throw new Error("Webhook de Mercado Pago sin data.id.");
    return { providerPaymentId: id, externalReference: "", status: "pending", rawEventId: String(data.id ?? id) };
  }

  async getPayment(id: string): Promise<MercadoPagoPayment> {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`No fue posible conciliar el pago (${response.status}).`);
    return response.json() as Promise<MercadoPagoPayment>;
  }
}
