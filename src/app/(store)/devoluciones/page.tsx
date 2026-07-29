import type { Metadata } from "next";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = { title: "Cambios y devoluciones" };

export default function ReturnsPage() {
  return (
    <>
      <PageHeader title="Cambios y devoluciones" />
      <Section spacing="sm">
        <Container narrow className="prose-sm flex flex-col gap-4 text-text-muted">
          <p>
            Por ser un producto de uso personal en contacto directo con el ojo, los lentes de
            contacto cosméticos solo se cambian o devuelven cuando el producto llega defectuoso,
            mal etiquetado o distinto a lo solicitado, y siempre que el empaque esté sellado.
          </p>
          <p>
            Los accesorios (solución, pinza, aplicador) pueden cambiarse dentro de los primeros
            días posteriores a la entrega si no han sido abiertos.
          </p>
          <p className="text-sm text-text-subtle">
            Los plazos exactos, el proceso de contacto y las condiciones definitivas de esta
            política están pendientes de confirmación por parte del propietario del negocio antes
            del lanzamiento a producción. Este texto es una guía estructural, no asesoría legal.
          </p>
        </Container>
      </Section>
    </>
  );
}
