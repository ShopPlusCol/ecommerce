import { createHash } from "node:crypto";
import type { AnalyticsProvider, ConversionEvent } from "@/application/ports/analytics-provider";

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export class MetaConversionsProvider implements AnalyticsProvider {
  readonly id = "meta_conversions_api";
  constructor(
    private readonly pixelId = process.env.META_PIXEL_ID ?? "",
    private readonly accessToken = process.env.META_CONVERSIONS_ACCESS_TOKEN ?? "",
    private readonly apiVersion = process.env.META_GRAPH_API_VERSION ?? "",
  ) {}
  isEnabled() {
    return Boolean(this.pixelId && this.accessToken && this.apiVersion);
  }
  async trackServerEvent(event: ConversionEvent) {
    if (!this.isEnabled()) throw new Error("Meta Conversions API no está configurada.");
    const userData: Record<string, string[]> = {};
    if (event.userData?.email) userData.em = [hash(event.userData.email)];
    if (event.userData?.phone) userData.ph = [hash(event.userData.phone.replace(/\D/g, ""))];
    const response = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        access_token: this.accessToken,
        data: [{
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.eventSourceUrl,
          action_source: "website",
          user_data: userData,
          custom_data: {
            value: event.value,
            currency: event.currency,
            content_ids: event.contentIds,
            content_type: event.contentType,
            order_id: event.orderId,
          },
        }],
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Meta CAPI rechazó el evento (${response.status}).`);
  }
}
