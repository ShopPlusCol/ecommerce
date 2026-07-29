import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "Política de privacidad" };

const SECTIONS = [
  "Responsable del tratamiento de datos",
  "Qué datos recopilamos (contacto, envío, navegación)",
  "Finalidad del tratamiento",
  "Uso de cookies y categorías (necesarias, analítica, marketing)",
  "Analítica y publicidad (Meta Pixel y Conversions API)",
  "Fotografías del simulador de lentes: uso y eliminación",
  "Derechos del titular de los datos",
  "Cómo ejercer tus derechos",
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader title="Política de privacidad" />
      <Section spacing="sm">
        <Container narrow className="flex flex-col gap-6">
          <p className="rounded-lg bg-warning-soft p-4 text-sm text-warning">
            Este es el esqueleto estructural de la política de privacidad. El texto legal
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
