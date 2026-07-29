import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGrid } from "@/components/store/product-grid";
import { catalogRepository } from "@/lib/container";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = await catalogRepository.getCollectionBySlug(slug);
  return { title: collection?.name ?? "Colección", alternates: { canonical: `/coleccion/${slug}` } };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = await catalogRepository.getCollectionBySlug(slug);
  if (!collection) notFound();

  const { products } = await catalogRepository.listProducts({
    filters: { collectionSlug: slug },
    pageSize: 48,
  });

  return (
    <>
      <PageHeader
        title={collection.name}
        description={collection.description ?? undefined}
        breadcrumbs={[{ href: "/catalogo", label: "Catálogo" }]}
      />
      <Section spacing="sm">
        <Container>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <EmptyState title="Esta colección aún no tiene productos" description="Vuelve pronto." />
          )}
        </Container>
      </Section>
    </>
  );
}
