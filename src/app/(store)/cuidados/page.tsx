import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Cuidados y guía de uso" };

const CARE_STEPS = [
  {
    title: "Antes de ponértelos",
    body: "Lávate las manos con jabón neutro y sécalas bien. Nunca uses agua del grifo directamente sobre el lente.",
  },
  {
    title: "Uso diario recomendado",
    body: "No excedas las horas de uso diario recomendadas en el empaque. Retíralos antes de dormir salvo que el producto indique lo contrario.",
  },
  {
    title: "Limpieza y almacenamiento",
    body: "Usa siempre solución multipropósito, nunca agua. Guarda cada lente en su estuche, cambiando la solución cada vez.",
  },
  {
    title: "Cuándo dejar de usarlos",
    body: "Si sientes ardor, enrojecimiento persistente o visión borrosa, retíralos y consulta a un profesional de la salud visual.",
  },
];

export default function CarePage() {
  return (
    <>
      <PageHeader
        title="Cuidados y guía de uso"
        description="Recomendaciones generales de higiene para tus lentes de contacto cosméticos."
      />
      <Section spacing="sm">
        <Container narrow className="flex flex-col gap-4">
          {CARE_STEPS.map((step) => (
            <Card key={step.title}>
              <CardContent>
                <p className="font-display text-md font-semibold text-text">{step.title}</p>
                <p className="mt-1 text-sm text-text-muted">{step.body}</p>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-text-subtle">
            Esta guía es informativa y no sustituye una valoración profesional. Ante cualquier
            molestia, suspende el uso y consulta a un especialista.
          </p>
        </Container>
      </Section>
    </>
  );
}
