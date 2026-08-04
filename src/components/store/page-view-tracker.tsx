"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAnalytics } from "@/modules/analytics/analytics-context";
import { shouldEmitPageView, type PageViewMark } from "@/modules/analytics/page-view-policy";

/**
 * **Única fuente de PageView** de la tienda. `MetaPixel` solo inicializa el
 * píxel y no emite ninguna vista; aquí se emite una sola vez por navegación,
 * con `event_id`, de modo que píxel y Conversions API se deduplican.
 *
 * La decisión vive en `shouldEmitPageView` (pura y con pruebas); este
 * componente solo la aplica y recuerda lo último emitido.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { track, consent, consentDecided } = useAnalytics();
  const lastRef = React.useRef<PageViewMark | null>(null);

  React.useEffect(() => {
    const decision = shouldEmitPageView({
      path: pathname,
      consentDecided,
      analytics: consent.analytics,
      marketing: consent.marketing,
      last: lastRef.current,
    });
    if (!decision) return;
    // Se marca antes de emitir: si el render se repite mientras `track`
    // sigue en curso, no se emite una segunda vista.
    lastRef.current = { path: pathname, marketing: consent.marketing };
    track("PageView", { extra: { path: pathname } });
  }, [pathname, consentDecided, consent.analytics, consent.marketing, track]);

  return null;
}
