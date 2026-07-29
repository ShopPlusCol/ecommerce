import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";

export const metadata: Metadata = { title: "Envíos y entregas" };

export default function ShippingPage() {
  return (
    <>
      <PageHeader
        title="Envíos y entregas"
        description="Cómo calculamos el costo y el tiempo de entrega según tu ciudad."
      />
      <Section spacing="sm">
        <Container narrow className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Chip variant="brand">Medellín y Área Metropolitana</Chip>
              </div>
              <p className="text-sm text-text-muted">
                Entrega el mismo día pidiendo antes de la hora límite. Puedes pagar contraentrega
                en efectivo o datáfono. La tarifa exacta depende de tu barrio y se calcula en el
                checkout.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Chip variant="neutral">Resto de Colombia</Chip>
              </div>
              <p className="text-sm text-text-muted">
                El costo de envío se paga por anticipado; el valor de los productos queda como
                saldo contraentrega, salvo que elijas pagar todo por adelantado. El tiempo estimado
                de entrega depende de la transportadora y la ciudad de destino.
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-text-subtle">
            Las tarifas, tiempos y coberturas exactos se administran desde el panel por zona y
            barrio (país › departamento › ciudad › barrio), y se muestran en tiempo real durante el
            checkout a partir de la Fase 2. Los valores de esta página son de ejemplo mientras el
            propietario del negocio confirma las tarifas definitivas.
          </p>
        </Container>
      </Section>
    </>
  );
}
