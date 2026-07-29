"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";

export default function StoreError({
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
    <Section spacing="lg">
      <Container narrow className="flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-danger" aria-hidden="true" />
        <h1 className="text-2xl text-text">Algo salió mal</h1>
        <p className="max-w-prose text-text-muted">
          Ocurrió un error inesperado al cargar esta página. Puedes intentarlo de nuevo; si el
          problema continúa, escríbenos por WhatsApp.
        </p>
        <Button onClick={reset}>Intentar de nuevo</Button>
      </Container>
    </Section>
  );
}
