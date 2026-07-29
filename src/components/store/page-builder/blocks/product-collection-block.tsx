import Link from "next/link";
import type { ProductCollectionBlock as ProductCollectionBlockType } from "@/modules/page-builder/blocks";
import type { Product } from "@/domain/entities/catalog";
import { Section } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { ProductGrid } from "@/components/store/product-grid";
import { catalogRepository } from "@/lib/container";
import type { ProductSort } from "@/application/ports/catalog-repository";

const FILTER_TO_SORT: Record<"featured" | "promotion" | "newest" | "best_selling", ProductSort> = {
  featured: "relevance",
  promotion: "promotion",
  newest: "newest",
  best_selling: "best_selling",
};

async function resolveProducts(config: ProductCollectionBlockType["config"]): Promise<Product[]> {
  if ("collectionSlug" in config.source) {
    const { products } = await catalogRepository.listProducts({
      filters: { collectionSlug: config.source.collectionSlug },
      pageSize: config.limit,
    });
    return products;
  }
  const filter = config.source.filter;
  const { products } = await catalogRepository.listProducts({
    filters: filter === "promotion" ? { onPromotion: true } : {},
    sort: FILTER_TO_SORT[filter],
    pageSize: config.limit,
  });
  return products;
}

export async function ProductCollectionBlock({ config }: { config: ProductCollectionBlockType["config"] }) {
  const products = await resolveProducts(config);
  if (products.length === 0) return null;

  return (
    <Section spacing="sm" tone={config.tone === "sunken" ? "sunken" : "default"}>
      <Container>
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl text-text">{config.title}</h2>
          {config.viewAllHref ? (
            <Link
              href={config.viewAllHref}
              className="shrink-0 text-sm font-medium text-brand underline-offset-4 hover:text-brand-hover hover:underline"
            >
              Ver todo
            </Link>
          ) : null}
        </div>
        <Reveal className="mt-6">
          <ProductGrid products={products} />
        </Reveal>
      </Container>
    </Section>
  );
}
