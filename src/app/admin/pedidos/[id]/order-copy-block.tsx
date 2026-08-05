"use client";

import * as React from "react";
import { ClipboardCheck, ClipboardCopy } from "lucide-react";

/**
 * Bloque "Información lista para copiar".
 *
 * El texto llega ya formateado desde el servidor (`buildOrderCopyText`), así
 * que lo que se ve en pantalla y lo que se copia son exactamente lo mismo:
 * no hay dos formatos que puedan divergir.
 */
export function OrderCopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const areaRef = React.useRef<HTMLTextAreaElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const flashCopied = () => {
    setCopied(true);
    setFailed(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2500);
  };

  const copy = async () => {
    // `navigator.clipboard` no existe en contextos no seguros (http:// en
    // una IP de la red local, que es justo como se prueba desde el celular)
    // ni en navegadores antiguos. El respaldo selecciona el texto y usa
    // `execCommand`, y si tampoco funciona se le dice a la persona qué
    // hacer en vez de fallar en silencio.
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        flashCopied();
        return;
      }
    } catch {
      // Cae al respaldo.
    }

    const area = areaRef.current;
    if (!area) {
      setFailed(true);
      return;
    }
    try {
      area.focus();
      area.select();
      const ok = document.execCommand("copy");
      if (ok) flashCopied();
      else setFailed(true);
    } catch {
      setFailed(true);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Información lista para copiar</h2>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white"
        >
          {copied ? (
            <>
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Información copiada
            </>
          ) : (
            <>
              <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
              Copiar información del pedido
            </>
          )}
        </button>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {copied ? "Información copiada al portapapeles." : ""}
      </p>

      {failed ? (
        <p role="alert" className="mt-3 rounded-md bg-warning-soft p-3 text-sm text-warning">
          Tu navegador no permitió copiar automáticamente. El texto ya está seleccionado abajo:
          usa Ctrl+C (o mantén pulsado y elige “Copiar” en el celular).
        </p>
      ) : null}

      {/* Es el mismo texto que se copia, visible y ordenado en la ficha.
          `readOnly` en vez de deshabilitado: así se puede seleccionar a mano
          si hiciera falta. */}
      <textarea
        ref={areaRef}
        readOnly
        value={text}
        rows={Math.min(24, text.split("\n").length + 1)}
        aria-label="Información del pedido lista para copiar"
        className="mt-4 w-full resize-y rounded-md border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-text"
      />
    </section>
  );
}
