import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PhaseNotice } from "@/components/store/phase-notice";

export const metadata: Metadata = { title: "Consultar mi pedido" };

export default function TrackOrderPage() {
  return (
    <>
      <PageHeader
        title="Consultar mi pedido"
        description="Ingresa tu número de pedido y el teléfono o correo usado en la compra."
      />
      <Section spacing="sm">
        <Container narrow>
          <form className="flex flex-col gap-4">
            <Input label="Número de pedido" placeholder="Ej: SPC-10045" required />
            <Input label="Teléfono o correo" placeholder="Como lo escribiste en tu compra" required />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled className="opacity-60">
                Consultar estado
              </Button>
              <PhaseNotice phase={3} />
            </div>
          </form>
        </Container>
      </Section>
    </>
  );
}
