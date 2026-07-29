"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Centro básico de consentimiento de cookies (secciones 21.3 y 32). Hasta que
 * la persona decida, no se registran eventos de analítica ni marketing. La
 * decisión se guarda localmente.
 */
export function ConsentBanner() {
  const { consentDecided, setConsent } = useAnalytics();
  if (consentDecided) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-(--content-max-width) flex-col gap-3 px-[var(--content-padding-x)] py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-muted">
          Usamos cookies necesarias para el funcionamiento y, con tu permiso, cookies de analítica y
          marketing para mejorar la tienda. Consulta nuestra{" "}
          <Link href="/privacidad" className="font-medium text-brand hover:text-brand-hover">
            política de privacidad
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConsent({ analytics: false, marketing: false })}>
            Solo necesarias
          </Button>
          <Button size="sm" onClick={() => setConsent({ analytics: true, marketing: true })}>
            Aceptar todas
          </Button>
        </div>
      </div>
    </div>
  );
}
