import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/store/product-grid";
import { CatalogControls } from "@/components/store/catalog/catalog-controls";
import { CatalogPagination } from "@/components/store/catalog/catalog-pagination";
import { catalogRepository } from "@/lib/container";
import { parseCatalogParams, type CatalogSearchParams } from "@/modules/catalog/catalog-params";
import { computeCatalogFacets } from "@/modules/catalog/facets";

export const metadata: Metadata = {
  title: "Catálogo completo",
  description: "Explora todos los lentes de contacto cosméticos y accesorios de ShopPlusCol.",
  alternates: { canonical: "/catalogo" },
};

export default async function CatalogPage({ searchParams }: { searchParams: Promise<CatalogSearchParams> }) {
  const params = await searchParams;
  const query = parseCatalogParams(params);

  const [result, categories, colorFamilies, collections, allProducts] = await Promise.all([
    catalogRepository.listProducts(query),
    catalogRepository.listCategories(),
    catalogRepository.listColorFamilies(),
    catalogRepository.listCollections(),
    // Catálogo completo sin filtrar: es lo que permite saber cuántos
    // productos hay realmente detrás de cada filtro y no ofrecer filtros
    // que llevarían a un resultado vacío.
    catalogRepository.listProducts({ pageSize: 200 }),
  ]);

  // Conteo real por colección: el puerto no expone la pertenencia, así que
  // se resuelve consultando cada colección una vez.
  const collectionMembership = new Map<string, string[]>(
    await Promise.all(
      collections.map(async (collection) => {
        const inCollection = await catalogRepository.listProducts({
          filters: { collectionSlug: collection.slug },
          pageSize: 200,
        });
        return [collection.slug, inCollection.products.map((product) => product.id)] as [string, string[]];
      }),
    ),
  );

  const facets = computeCatalogFacets(allProducts.products, {
    colorFamilies,
    categories,
    collections,
    collectionMembership,
  });

  const totalPages = Math.ceil(result.total / result.pageSize);

  return (
    <>
      <PageHeader title="Catálogo completo" description="Filtra por familia de color, categoría o disponibilidad." />
      <Section spacing="sm">
        <Container className="flex flex-col gap-6">
          <CatalogControls facets={facets} total={result.total} sort={query.sort ?? "relevance"} />

          {result.products.length > 0 ? (
            <>
              <ProductGrid
                key={JSON.stringify(query.filters) + query.sort + result.page}
                products={result.products}
                className="animate-fade-in"
              />
              <CatalogPagination page={result.page} totalPages={totalPages} />
            </>
          ) : (
            <EmptyState
              icon={<SearchX className="h-8 w-8" />}
              title="No encontramos productos con esos filtros"
              description="Prueba quitando algún filtro o revisa el catálogo completo."
              action={
                <Link href="/catalogo">
                  <Button variant="secondary">Ver todo el catálogo</Button>
                </Link>
              }
            />
          )}
        </Container>
      </Section>
    </>
  );
}
