"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Preferencias de privacidad, revocables. Hasta que la persona decida no se
 * carga ningún rastreador opcional (lo aplica `AnalyticsProvider`, no este
 * componente).
 *
 * Ocupa lo mínimo a propósito: la versión anterior era una barra a todo el
 * ancho que en móvil se comía varias líneas y podía quedar encima del botón
 * de confirmar del checkout. Aquí es una tarjeta acotada, y mientras está
 * visible reserva espacio al final de la página (`--consent-banner-space`)
 * para que ninguna barra fija de la tienda quede tapada.
 */
export function ConsentBanner() {
  const { consent, consentDecided, setConsent } = useAnalytics();
  const [editing, setEditing] = React.useState(false);
  const [detailed, setDetailed] = React.useState(false);
  const [draft, setDraft] = React.useState({ analytics: false, marketing: false });

  const visible = !consentDecided || editing;

  // El borrador se siembra al abrir el detalle, no desde un efecto: es una
  // consecuencia directa de la interacción, no de un cambio de estado.
  const openDetailed = () => {
    setDraft({ analytics: consent.analytics, marketing: consent.marketing });
    setDetailed(true);
  };

  // Reserva espacio real mientras el aviso está en pantalla, en vez de
  // dejarlo flotando encima del contenido.
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--consent-banner-space", visible ? "10rem" : "0px");
    return () => root.style.setProperty("--consent-banner-space", "0px");
  }, [visible]);

  const close = () => {
    setEditing(false);
    setDetailed(false);
  };

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="fixed bottom-3 left-3 z-30 rounded-full border border-border bg-surface-raised px-3 py-2 text-xs font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        Privacidad
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Preferencias de privacidad"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-lg rounded-xl border border-border bg-surface-raised/97 p-4 shadow-lg backdrop-blur sm:left-3 sm:right-auto"
    >
      <p className="text-sm text-text-muted">
        Usamos almacenamiento necesario para el carrito y, con tu permiso, analítica y marketing.{" "}
        <Link href="/privacidad" className="font-medium text-brand hover:text-brand-hover">
          Política de privacidad
        </Link>
        .
      </p>

      {detailed ? (
        <fieldset className="mt-3 flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <legend className="sr-only">Categorías de almacenamiento</legend>
          <label className="flex items-start gap-2 text-text-muted">
            <input type="checkbox" checked disabled className="mt-1" />
            <span>
              <span className="font-medium text-text">Necesario</span> — carrito y sesión. Siempre activo.
            </span>
          </label>
          <label className="flex items-start gap-2 text-text-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={draft.analytics}
              onChange={(event) => setDraft((prev) => ({ ...prev, analytics: event.target.checked }))}
            />
            <span>
              <span className="font-medium text-text">Analítica</span> — nos dice qué páginas se usan.
            </span>
          </label>
          <label className="flex items-start gap-2 text-text-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={draft.marketing}
              onChange={(event) => setDraft((prev) => ({ ...prev, marketing: event.target.checked }))}
            />
            <span>
              <span className="font-medium text-text">Marketing</span> — Meta Pixel, para medir los anuncios.
            </span>
          </label>
        </fieldset>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {detailed ? (
          <Button
            size="sm"
            onClick={() => {
              setConsent(draft);
              close();
            }}
          >
            Guardar preferencias
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => {
                setConsent({ analytics: true, marketing: true });
                close();
              }}
            >
              Aceptar todas
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setConsent({ analytics: false, marketing: false });
                close();
              }}
            >
              Rechazar opcionales
            </Button>
            <Button variant="ghost" size="sm" onClick={openDetailed}>
              Configurar
            </Button>
          </>
        )}
        {consentDecided ? (
          <Button variant="ghost" size="sm" onClick={close}>
            Cerrar
          </Button>
        ) : null}
      </div>
    </div>
  );
}
