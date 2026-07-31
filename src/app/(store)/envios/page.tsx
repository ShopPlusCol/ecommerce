import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Card, CardContent } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { getSiteTextsSettings } from "@/modules/settings/site-texts";

export const metadata: Metadata = { title: "Envíos y entregas" };

export default async function ShippingPage() {
  const texts = await getSiteTextsSettings();
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
              <p className="text-sm text-text-muted">{texts.shippingPageMedellinBody}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Chip variant="neutral">Resto de Colombia</Chip>
              </div>
              <p className="text-sm text-text-muted">{texts.shippingPageRestBody}</p>
            </CardContent>
          </Card>

          <p className="text-xs text-text-subtle">{texts.shippingPageNote}</p>
        </Container>
      </Section>
    </>
  );
}
