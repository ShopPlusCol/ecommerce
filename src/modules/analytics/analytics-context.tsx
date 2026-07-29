"use client";

import * as React from "react";
import type { ConversionEventName } from "@/application/ports/analytics-provider";
import { generateEventId, type ClientAnalyticsEvent } from "@/modules/analytics/events";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const CONSENT_KEY = "shopluscol.consent.v1";

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
 * Capa de analítica desacoplada (sección 21). En la Fase 2 registra los
 * eventos en un buffer en memoria y en consola (modo desarrollo), respetando
 * el consentimiento. En la Fase 3 este mismo contrato despacha a Meta Pixel +
 * Conversions API sin cambiar los puntos de llamada.
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
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación del consentimiento desde almacenamiento del navegador
        setConsentState({ necessary: true, analytics: !!parsed.analytics, marketing: !!parsed.marketing });
        setConsentDecided(true);
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
  }, []);

  const track = React.useCallback<AnalyticsContextValue["track"]>(
    (name, payload = {}) => {
      // Sin consentimiento de analítica no se registran eventos (sección 21.3 / 32).
      if (!consent.analytics) return;
      const event: ClientAnalyticsEvent = {
        name,
        eventId: payload.eventId ?? generateEventId(),
        value: payload.value,
        currency: payload.currency,
        contentIds: payload.contentIds,
        contentType: payload.contentType,
        extra: payload.extra,
      };
      setRecentEvents((prev) => [event, ...prev].slice(0, 25));
      if (process.env.NODE_ENV !== "production") {
        console.debug("[analytics]", event.name, event);
      }
    },
    [consent.analytics],
  );

  const value: AnalyticsContextValue = { consent, consentDecided, setConsent, track, recentEvents };
  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = React.useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics debe usarse dentro de <AnalyticsProvider>");
  return ctx;
}
