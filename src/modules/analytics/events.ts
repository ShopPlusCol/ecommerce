import type { ConversionEventName } from "@/application/ports/analytics-provider";

export type ClientAnalyticsEvent = {
  name: ConversionEventName;
  eventId: string;
  value?: number;
  currency?: "COP";
  contentIds?: string[];
  contentType?: "product" | "product_group";
  extra?: Record<string, unknown>;
};

/**
 * Genera un event_id estable para deduplicación navegador/servidor
 * (sección 21.3). En la Fase 3 el mismo event_id se reenvía desde el
 * servidor a la Conversions API de Meta.
 */
export function generateEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
