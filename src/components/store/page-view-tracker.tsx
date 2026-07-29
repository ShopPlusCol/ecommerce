"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Dispara PageView en cada cambio de ruta, respetando el consentimiento
 * (sección 21.2/21.3). No registra nada hasta que la persona acepte analítica.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { track, consent } = useAnalytics();

  React.useEffect(() => {
    track("PageView", { extra: { path: pathname } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, consent.analytics]);

  return null;
}
