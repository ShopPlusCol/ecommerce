/**
 * Puerto unificado de analítica de conversión (Meta Pixel + Conversions API
 * hoy; otros proveedores mañana). Ninguna pantalla debe disparar un pixel
 * de tercero directamente: todo evento pasa por este contrato (sección 21).
 */
export type ConversionEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToWishlist"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase";

export type ConversionEvent = {
  eventName: ConversionEventName;
  eventId: string;
  eventSourceUrl: string;
  value?: number;
  currency?: "COP";
  contentIds?: string[];
  contentType?: "product" | "product_group";
  orderId?: string;
  userData?: { email?: string; phone?: string };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
};

export interface AnalyticsProvider {
  readonly id: string;
  isEnabled(): boolean;
  trackServerEvent(event: ConversionEvent): Promise<void>;
}
