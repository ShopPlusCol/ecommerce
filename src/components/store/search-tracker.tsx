"use client";

import * as React from "react";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Registra `Search` cuando la persona ejecuta una búsqueda con resultados
 * reales. Vive como componente aparte para que la página de búsqueda siga
 * siendo un componente de servidor.
 *
 * Se dispara una vez por término, no en cada render: `useRef` evita que
 * volver a la página con el mismo término vuelva a contar la búsqueda.
 */
export function SearchTracker({ query, resultCount }: { query: string; resultCount: number }) {
  const { track } = useAnalytics();
  const lastTrackedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const term = query.trim();
    if (!term || lastTrackedRef.current === term) return;
    lastTrackedRef.current = term;
    track("Search", { extra: { search_string: term, results: resultCount } });
  }, [query, resultCount, track]);

  return null;
}
