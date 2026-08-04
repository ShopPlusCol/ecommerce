"use client";

import * as React from "react";
import type { ConversionEventName } from "@/application/ports/analytics-provider";
import { generateEventId, type ClientAnalyticsEvent } from "@/modules/analytics/events";
import { forwardConversionEventAction } from "@/app/(store)/analytics-actions";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = "shoppluscol.consent.v1";
/**
 * La decisión también se guarda en cookie porque el servidor tiene que
 * poder comprobarla: las server actions de analítica y la creación de
 * pedido no ven `localStorage`, y sin esto tendrían que fiarse de lo que
 * diga el cliente.
 */
const CONSENT_COOKIE = "shoppluscol_consent";

/** Eventos de Meta que se envían también por servidor (Conversions API). */
const FORWARDABLE: ReadonlySet<ConversionEventName> = new Set([
  "PageView",
  "ViewContent",
  "Search",
  "AddToWishlist",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "Contact",
]);

export type AnalyticsContextValue = {
  consent: ConsentState;
  consentDecided: boolean;
  setConsent: (next: { analytics: boolean; marketing: boolean }) => void;
  track: (
    name: ConversionEventName,
    payload?: Omit<ClientAnalyticsEvent, "name" | "eventId"> & { eventId?: string },
  ) => void;
  recentEvents: ClientAnalyticsEvent[];
};

const AnalyticsContext = React.createContext<AnalyticsContextValue | null>(null);

/**
 * Arma el payload mínimo que acepta el servidor para cada tipo de evento.
 * Deliberadamente no incluye texto libre (p. ej. el término buscado) ni el
 * importe: lo primero es dato personal innecesario y lo segundo se calcula
 * en servidor.
 */
function buildForwardPayload(
  name: ConversionEventName,
  event: ClientAnalyticsEvent,
  extra: Record<string, unknown> | undefined,
): Record<string, unknown> {
  switch (name) {
    case "ViewContent":
    case "AddToWishlist":
      return event.contentIds?.length ? { contentIds: [event.contentIds[0]] } : {};
    case "AddToCart":
    case "InitiateCheckout":
      return event.contentIds?.length
        ? { contentIds: event.contentIds, ...(event.quantities ? { quantities: event.quantities } : {}) }
        : {};
    case "Contact":
      return {
        ...(event.contentIds?.length ? { contentIds: event.contentIds } : {}),
        ...(event.quantities ? { quantities: event.quantities } : {}),
        ...(typeof extra?.source === "string" ? { source: extra.source } : {}),
      };
    default:
      return {};
  }
}

function writeConsentCookie(value: { analytics: boolean; marketing: boolean }) {
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=${
      60 * 60 * 24 * 180
    }; SameSite=Lax${secure}`;
  } catch {
    // Ignorar.
  }
}

/**
 * Capa de analítica desacoplada. Ningún componente llama a `fbq` ni a la
 * Conversions API directamente: todo pasa por `track`, que aplica el
 * consentimiento en un solo lugar.
 *
 * Reparto de consentimientos:
 * - `analytics` → registro interno de eventos (buffer/diagnóstico).
 * - `marketing` → Meta Pixel y Conversions API. Sin él no se carga el
 *   script de Meta ni se reenvía nada por servidor.
 *
 * Deduplicación: el mismo `eventId` se manda al píxel y a la Conversions
 * API, así Meta cuenta una sola conversión por acción.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = React.useState<ConsentState>({
    necessary: true,
    analytics: false,
    marketing: false,
  });
  const [consentDecided, setConsentDecided] = React.useState(false);
  const [recentEvents, setRecentEvents] = React.useState<ClientAnalyticsEvent[]>([]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONSENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { analytics: boolean; marketing: boolean };
        const value = { analytics: !!parsed.analytics, marketing: !!parsed.marketing };
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación del consentimiento desde almacenamiento del navegador
        setConsentState({ necessary: true, ...value });
        setConsentDecided(true);
        // Repone la cookie si se perdió (expiración, otro dispositivo del
        // mismo navegador, limpieza parcial) sin volver a preguntar.
        writeConsentCookie(value);
      }
    } catch {
      // Ignorar.
    }
  }, []);

  const setConsent = React.useCallback((next: { analytics: boolean; marketing: boolean }) => {
    const value: ConsentState = { necessary: true, analytics: next.analytics, marketing: next.marketing };
    setConsentState(value);
    setConsentDecided(true);
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    } catch {
      // Ignorar.
    }
    writeConsentCookie(next);
  }, []);

  const track = React.useCallback<AnalyticsContextValue["track"]>(
    (name, payload = {}) => {
      const eventId = payload.eventId ?? generateEventId();
      const event: ClientAnalyticsEvent = {
        name,
        eventId,
        value: payload.value,
        currency: payload.currency,
        contentIds: payload.contentIds,
        quantities: payload.quantities,
        contentType: payload.contentType,
        extra: payload.extra,
      };

      if (consent.analytics) {
        setRecentEvents((prev) => [event, ...prev].slice(0, 25));
        if (process.env.NODE_ENV !== "production") {
          console.debug("[analytics]", event.name, event);
        }
      }

      // Meta solo con consentimiento de marketing.
      if (!consent.marketing) return;

      // Purchase nunca se dispara desde el navegador: lo emite el servidor
      // cuando el pedido alcanza el estado configurado, para que recargar
      // la confirmación no cuente una compra extra.
      if (name === "Purchase") return;

      if (typeof window !== "undefined" && window.fbq) {
        const custom: Record<string, unknown> = {};
        if (event.value !== undefined) custom.value = event.value;
        if (event.currency) custom.currency = event.currency;
        if (event.contentIds?.length) custom.content_ids = event.contentIds;
        if (event.contentType) custom.content_type = event.contentType;
        window.fbq("track", name, custom, { eventID: eventId });
      }

      if (FORWARDABLE.has(name)) {
        // No se manda `value`: el importe lo resuelve el servidor desde el
        // catálogo. Lo que el navegador envía son solo identificadores y
        // cantidades, que el servidor vuelve a validar y valorar.
        void forwardConversionEventAction({
          eventName: name,
          eventId,
          eventSourceUrl: window.location.href,
          payload: buildForwardPayload(name, event, payload.extra),
        }).catch(() => {
          // La analítica nunca interrumpe la navegación.
        });
      }
    },
    [consent.analytics, consent.marketing],
  );

  const value: AnalyticsContextValue = { consent, consentDecided, setConsent, track, recentEvents };
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = React.useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics debe usarse dentro de <AnalyticsProvider>");
  return ctx;
}
