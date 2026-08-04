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
 * **Este componente no dispara ningún PageView.** Solo inicializa el píxel.
 * La vista de página la emite `PageViewTracker`, que es la única fuente:
 * antes ambos lo hacían, así que cada carga contaba dos veces, y el de aquí
 * salía además sin `event_id`, de modo que Meta tampoco podía deduplicarlo
 * contra el envío de la Conversions API.
 *
 * `fbq("init")` por sí solo no emite PageView — lo emite la línea explícita
 * del fragmento estándar de Meta, que aquí se omite a propósito.
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
  }, [consent.marketing, pixelId]);

  return null;
}
