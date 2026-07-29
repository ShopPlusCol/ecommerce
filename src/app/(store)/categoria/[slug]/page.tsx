import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGrid } from "@/components/store/product-grid";
import { catalogRepository } from "@/lib/container";
import { breadcrumbJsonLd } from "@/lib/seo";

type Params = { params: Promise<{ slug: string }> };

async function resolveTaxonomy(slug: string) {
  const category = await catalogRepository.getCategoryBySlug(slug);
  if (category) {
    return { kind: "category" as const, name: category.name, description: category.description, filterKey: "categorySlug" as const };
  }
  const family = await catalogRepository.getColorFamilyBySlug(slug);
  if (family) {
    return { kind: "color" as const, name: family.name, description: null, filterKey: "colorFamilySlug" as const };
  }
  return null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const found = await resolveTaxonomy(slug);
  return { title: found?.name ?? "Categoría", alternates: { canonical: `/categoria/${slug}` } };
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const found = await resolveTaxonomy(slug);
  if (!found) notFound();

  const { products } = await catalogRepository.listProducts({
    filters: found.filterKey === "categorySlug" ? { categorySlug: slug } : { colorFamilySlug: slug },
    pageSize: 48,
  });

  const jsonLd = breadcrumbJsonLd([
    { name: "Catálogo", url: "/catalogo" },
    { name: found.name, url: `/categoria/${slug}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        title={found.name}
        description={found.description ?? undefined}
        breadcrumbs={[{ href: "/catalogo", label: "Catálogo" }]}
      />
      <Section spacing="sm">
        <Container>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState
              title="Aún no hay productos en esta categoría"
              description="Vuelve pronto o explora el catálogo completo."
            />
          )}
        </Container>
      </Section>
    </>
  );
}
