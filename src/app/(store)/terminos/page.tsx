import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "Términos y condiciones" };

const SECTIONS = [
  "Aceptación de los términos",
  "Naturaleza del producto (lentes cosméticos sin fórmula ni aumento)",
  "Proceso de compra y confirmación de pedido",
  "Precios, promociones y disponibilidad",
  "Métodos de pago y pago parcial (anticipo de envío + saldo contraentrega)",
  "Envíos, tiempos de entrega y zonas de cobertura",
  "Cambios y devoluciones",
  "Propiedad intelectual",
  "Limitación de responsabilidad",
  "Ley aplicable y jurisdicción",
];

export default function TermsPage() {
  return (
    <>
      <PageHeader title="Términos y condiciones" />
      <Section spacing="sm">
        <Container narrow className="flex flex-col gap-6">
          <p className="rounded-lg bg-warning-soft p-4 text-sm text-warning">
            Este es el esqueleto estructural de los términos y condiciones. El texto legal
            definitivo debe ser redactado o validado por el propietario del negocio antes de salir
            a producción; no se presenta aquí asesoría legal.
          </p>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-text-muted">
            {SECTIONS.map((section) => (
              <li key={section}>{section}</li>
            ))}
          </ol>
        </Container>
      </Section>
    </>
  );
}
