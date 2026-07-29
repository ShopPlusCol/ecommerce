import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { PhaseNotice } from "@/components/store/phase-notice";

export const metadata: Metadata = { title: "Confirmación de pedido" };

export default function OrderConfirmationPage() {
  return (
    <Section spacing="lg">
      <Container narrow className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden="true" />
        <h1 className="text-2xl text-text">Confirmación de pedido</h1>
        <p className="max-w-prose text-text-muted">
          Aquí verás el número de pedido, el estado del pago y la fecha estimada de entrega en
          cuanto el checkout real esté conectado en la Fase 2.
        </p>
        <PhaseNotice phase={2} />
        <Link href="/">
          <Button variant="secondary">Volver al inicio</Button>
        </Link>
      </Container>
    </Section>
  );
}
