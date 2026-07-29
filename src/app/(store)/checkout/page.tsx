import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { PhaseNotice } from "@/components/store/phase-notice";

export const metadata: Metadata = { title: "Checkout" };

const STEPS = [
  { title: "Contacto", description: "Nombre, teléfono y correo." },
  { title: "Ubicación y entrega", description: "Ciudad, barrio, dirección y método de entrega." },
  { title: "Pago", description: "Mercado Pago, contraentrega o transferencia manual." },
  { title: "Revisión", description: "Resumen de productos, envío y total." },
  { title: "Confirmación", description: "Número de pedido y estado de pago." },
];

export default function CheckoutPage() {
  return (
    <>
      <PageHeader
        title="Checkout"
        description="Compra como invitada, sin crear una cuenta. El flujo completo se conecta en la Fase 2."
      />
      <Section spacing="sm">
        <Container narrow className="flex flex-col gap-4">
          {STEPS.map((step, index) => (
            <Card key={step.title}>
              <CardContent className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-text">{step.title}</p>
                  <p className="text-sm text-text-muted">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-center pt-2">
            <PhaseNotice phase={2} />
          </div>
        </Container>
      </Section>
    </>
  );
}
