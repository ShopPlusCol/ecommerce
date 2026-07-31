"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Preferencias revocables: hasta que la persona decida no se registran
 * eventos opcionales. La decisión permanece únicamente en el navegador.
 */
export function ConsentBanner() {
  const { consent, consentDecided, setConsent } = useAnalytics();
  const [editing, setEditing] = React.useState(false);
  const visible = !consentDecided || editing;

  return (
    <>
      {visible ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Preferencias de cookies"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised/95 backdrop-blur"
        >
          <div className="mx-auto flex max-w-(--content-max-width) flex-col gap-3 px-[var(--content-padding-x)] py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-muted">
              Usamos almacenamiento necesario y, con tu permiso, analítica y marketing. Estado
              actual: analítica {consent.analytics ? "activa" : "inactiva"} y marketing{" "}
              {consent.marketing ? "activo" : "inactivo"}. Consulta nuestra{" "}
              <Link href="/privacidad" className="font-medium text-brand hover:text-brand-hover">
                política de privacidad
              </Link>
              .
            </p>
            <div className="flex shrink-0 flex-wrap gap-2">
              {consentDecided ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cerrar
                </Button>
              ) : null}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setConsent({ analytics: false, marketing: false });
                  setEditing(false);
                }}
              >
                Rechazar opcionales
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setConsent({ analytics: true, marketing: true });
                  setEditing(false);
                }}
              >
                Aceptar todas
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="fixed bottom-3 left-3 z-30 rounded-full border border-border bg-surface-raised px-3 py-2 text-xs font-medium shadow-sm"
        >
          Privacidad
        </button>
      )}
    </>
  );
}
