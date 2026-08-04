import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/store/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGrid } from "@/components/store/product-grid";
import { SearchTracker } from "@/components/store/search-tracker";
import { catalogRepository } from "@/lib/container";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

type SearchPageProps = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const result = query ? await catalogRepository.listProducts({ filters: { search: query }, pageSize: 48 }) : null;

  return (
    <>
      <PageHeader title="Buscar" description="Busca por nombre de tono, categoría o accesorio." />
      {query ? <SearchTracker query={query} resultCount={result?.total ?? 0} /> : null}
      <Section spacing="sm">
        <Container>
          <form action="/buscar" role="search" className="max-w-md">
            <label htmlFor="search-input" className="sr-only">
              Buscar productos
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
              <input
                id="search-input"
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Ej: Amazon Brown"
                className="h-control-md w-full rounded-md border border-border-strong bg-surface-raised pl-9 pr-3 text-base text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              />
            </div>
          </form>

          <div className="mt-6">
            {!query ? (
              <EmptyState
                icon={<Search className="h-8 w-8" />}
                title="Escribe algo para buscar"
                description="La búsqueda es tolerante a mayúsculas y tildes."
              />
            ) : result && result.products.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-text-muted">
                  {result.total} {result.total === 1 ? "resultado" : "resultados"} para “{query}”
                </p>
                <ProductGrid products={result.products} />
              </>
            ) : (
              <EmptyState
                title={`Sin resultados para “${query}”`}
                description="Prueba con otro nombre de tono o revisa el catálogo completo."
              />
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
