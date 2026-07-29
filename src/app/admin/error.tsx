"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h1 className="font-display text-xl font-semibold text-text">Error en el panel</h1>
      <p className="max-w-prose text-sm text-text-muted">
        Ocurrió un error inesperado. Intenta de nuevo o revisa la consola del servidor para más
        detalle.
      </p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
