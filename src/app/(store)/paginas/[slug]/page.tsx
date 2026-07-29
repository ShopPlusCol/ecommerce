import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

/**
 * Páginas editoriales creadas desde el editor visual no-code (secciones 6 y
 * 15). En la Fase 1 solo existe un contenido de ejemplo embebido; desde la
 * Fase 3 este contenido vendrá de `pages` / `page_versions` en la base de
 * datos, renderizado por el motor de bloques del editor visual.
 */
const DEMO_PAGES: Record<string, { title: string; body: string }> = {
  "sobre-nosotros": {
    title: "Sobre ShopPlusCol",
    body: "Somos una tienda especializada en lentes de contacto cosméticos sin fórmula, pensada para quienes quieren un cambio de mirada seguro, rápido y con acompañamiento cercano.",
  },
};

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return { title: DEMO_PAGES[slug]?.title ?? "Página" };
}

export default async function EditorialPage({ params }: Params) {
  const { slug } = await params;
  const page = DEMO_PAGES[slug];
  if (!page) notFound();

  return (
    <>
      <PageHeader title={page.title} />
      <Section spacing="sm">
        <Container narrow>
          <p className="text-text-muted">{page.body}</p>
        </Container>
      </Section>
    </>
  );
}
