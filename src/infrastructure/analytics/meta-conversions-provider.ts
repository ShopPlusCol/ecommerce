import { createHash } from "node:crypto";
import type { AnalyticsProvider, ConversionEvent } from "@/application/ports/analytics-provider";

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Normaliza a E.164 sin "+" (lo que espera Meta) antes de hashear. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Un número colombiano de 10 dígitos viene sin indicativo de país.
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

/**
 * Contexto de la petición del navegador. No son datos personales
 * almacenados sino señales de la propia visita, y Meta los espera en claro
 * (no hasheados) para poder emparejar la conversión.
 */
export type MetaRequestContext = {
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  /** Cookie `_fbc`: click id de Meta, la señal más fuerte de atribución. */
  fbc?: string | null;
  /** Cookie `_fbp`: identificador de navegador que fija el propio píxel. */
  fbp?: string | null;
};

export type MetaProviderConfig = {
  pixelId: string | null;
  accessToken: string | null;
  apiVersion: string;
  testEventCode: string | null;
};

/**
 * Única implementación que habla con la Conversions API de Meta. Todo envío
 * de servidor pasa por aquí (creación de pedido, webhook de pago y reenvío
 * de eventos del navegador) para que no existan dos formas distintas de
 * armar el mismo evento.
 */
export class MetaConversionsProvider implements AnalyticsProvider {
  readonly id = "meta_conversions_api";

  constructor(private readonly config: MetaProviderConfig) {}

  isEnabled() {
    return Boolean(this.config.pixelId && this.config.accessToken && this.config.apiVersion);
  }

  async trackServerEvent(event: ConversionEvent, context: MetaRequestContext = {}) {
    if (!this.isEnabled()) throw new Error("Meta Conversions API no está configurada.");

    const userData: Record<string, unknown> = {};
    if (event.userData?.email) userData.em = [hash(event.userData.email)];
    if (event.userData?.phone) userData.ph = [hash(normalizePhone(event.userData.phone))];
    if (context.clientIpAddress) userData.client_ip_address = context.clientIpAddress;
    if (context.clientUserAgent) userData.client_user_agent = context.clientUserAgent;
    if (context.fbc) userData.fbc = context.fbc;
    if (context.fbp) userData.fbp = context.fbp;

    const customData: Record<string, unknown> = {};
    if (event.value !== undefined) customData.value = event.value;
    if (event.currency) customData.currency = event.currency;
    if (event.contentIds?.length) customData.content_ids = event.contentIds;
    if (event.contentType) customData.content_type = event.contentType;
    if (event.orderId) customData.order_id = event.orderId;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          // Mismo id que ya usó el píxel en el navegador: es lo que hace
          // que Meta una ambos envíos en una sola conversión.
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: "website",
          user_data: userData,
          custom_data: customData,
        },
      ],
    };
    if (this.config.testEventCode) payload.test_event_code = this.config.testEventCode;

    // El token va en el cuerpo, no en la URL: así no queda registrado en
    // los logs de acceso de ningún intermediario.
    const response = await fetch(
      `https://graph.facebook.com/${this.config.apiVersion}/${this.config.pixelId}/events`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, access_token: this.config.accessToken }),
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error(`Meta CAPI rechazó el evento (${response.status}).`);
  }
}
