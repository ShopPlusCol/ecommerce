"use client";

import * as React from "react";
import { useAnalytics } from "@/modules/analytics/analytics-context";

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
};

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Carga el script de Meta Pixel **solo** cuando hay consentimiento de
 * marketing. No se precarga, no se inyecta "apagado" y no se usa
 * `fbq('consent','revoke')` como sustituto: si la persona no aceptó
 * marketing, el script de Meta sencillamente nunca entra a la página.
 *
 * El PageView inicial lo dispara este componente una sola vez tras
 * inicializar; los cambios de ruta posteriores los cubre `PageViewTracker`
 * a través del contexto, para no contar dos veces la misma vista.
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const { consent } = useAnalytics();
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (!consent.marketing || loadedRef.current || !pixelId) return;
    if (typeof window === "undefined" || document.getElementById("meta-pixel-script")) return;

    loadedRef.current = true;

    // Bootstrap oficial de Meta: deja lista la cola `fbq` antes de que el
    // script externo termine de cargar, para no perder los primeros eventos.
    if (!window.fbq) {
      const queue: unknown[] = [];
      const fbq = ((...args: unknown[]) => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else queue.push(args);
      }) as Fbq;
      fbq.queue = queue;
      window.fbq = fbq;
      window._fbq = fbq;
    }

    const script = document.createElement("script");
    script.id = "meta-pixel-script";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);

    window.fbq?.("init", pixelId);
    window.fbq?.("track", "PageView");
  }, [consent.marketing, pixelId]);

  return null;
}
