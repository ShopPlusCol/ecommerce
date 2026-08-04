import type { Category, ColorFamily, Product } from "@/domain/entities/catalog";
import type {
  CatalogRepository,
  Collection,
  ProductListResult,
  ProductQuery,
  ProductSort,
} from "@/application/ports/catalog-repository";
import { normalizeText } from "@/lib/text";
import {
  accessoryProductIds,
  categories,
  collectionMembership,
  collections,
  colorFamilies,
  products,
} from "@/infrastructure/demo/demo-dataset";

function isAvailable(product: Product): boolean {
  return product.stock > 0 || product.allowBackorder;
}

function isOnPromotion(product: Product): boolean {
  return product.compareAtPrice !== null && product.compareAtPrice.amount > product.price.amount;
}

function matchesSearch(product: Product, search: string): boolean {
  const needle = normalizeText(search);
  if (!needle) return true;
  const haystack = normalizeText(
    [product.name, product.shortDescription, product.colorFamily?.name ?? "", product.sku].join(" "),
  );
  return needle.split(/\s+/).every((token) => haystack.includes(token));
}

function sortProducts(list: Product[], sort: ProductSort): Product[] {
  const copy = [...list];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price.amount - b.price.amount);
    case "price_desc":
      return copy.sort((a, b) => b.price.amount - a.price.amount);
    case "newest":
      return copy.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
    case "promotion":
      return copy.sort((a, b) => Number(isOnPromotion(b)) - Number(isOnPromotion(a)));
    case "best_selling":
      return copy.sort((a, b) => Number(b.badges.includes("mas-vendido")) - Number(a.badges.includes("mas-vendido")));
    case "relevance":
    default:
      return copy.sort((a, b) => Number(b.featured) - Number(a.featured));
  }
}

/**
 * Adaptador de catálogo sobre los datos de desarrollo (Fase 2). Implementa el
 * puerto CatalogRepository; en la Fase 3 se sustituye por un adaptador Drizzle
 * sin cambiar la tienda.
 */
export class DemoCatalogRepository implements CatalogRepository {
  private simulateLatency(): Promise<void> {
    return Promise.resolve();
  }

  async listProducts(query: ProductQuery): Promise<ProductListResult> {
    await this.simulateLatency();
    const filters = query.filters ?? {};
    let list = products.filter((p) => p.status === "active");

    if (filters.categorySlug) {
      const category = categories.find((c) => c.slug === filters.categorySlug);
      if (category) list = list.filter((p) => p.categoryIds.includes(category.id));
    }
    if (filters.colorFamilySlug) {
      list = list.filter((p) => p.colorFamily?.slug === filters.colorFamilySlug);
    }
    if (filters.collectionSlug) {
      const members = collectionMembership[filters.collectionSlug] ?? [];
      list = list.filter((p) => members.includes(p.id));
    }
    if (filters.availability === "in_stock") {
      list = list.filter(isAvailable);
    }
    if (filters.onPromotion) {
      list = list.filter(isOnPromotion);
    }
    if (typeof filters.minPrice === "number") {
      list = list.filter((p) => p.price.amount >= filters.minPrice!);
    }
    if (typeof filters.maxPrice === "number") {
      list = list.filter((p) => p.price.amount <= filters.maxPrice!);
    }
    if (filters.search) {
      list = list.filter((p) => matchesSearch(p, filters.search!));
    }

    list = sortProducts(list, query.sort ?? "relevance");

    const total = list.length;
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, query.pageSize ?? 12);
    const start = (page - 1) * pageSize;
    const paged = list.slice(start, start + pageSize);

    return { products: paged, total, page, pageSize };
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    await this.simulateLatency();
    return products.find((p) => p.slug === slug && p.status === "active") ?? null;
  }

  async getProductsByIds(ids: string[]): Promise<Product[]> {
    const set = new Set(ids);
    return products.filter((p) => set.has(p.id) && p.status === "active");
  }

  async listCategories(): Promise<Category[]> {
    return categories.filter((c) => c.archivedAt === null);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return categories.find((c) => c.slug === slug) ?? null;
  }

  async listColorFamilies(): Promise<ColorFamily[]> {
    return colorFamilies;
  }

  async getColorFamilyBySlug(slug: string): Promise<ColorFamily | null> {
    return colorFamilies.find((c) => c.slug === slug) ?? null;
  }

  async listCollections(): Promise<Collection[]> {
    return collections;
  }

  async getCollectionBySlug(slug: string): Promise<Collection | null> {
    return collections.find((c) => c.slug === slug) ?? null;
  }

  async listCollectionMembership(): Promise<Map<string, string[]>> {
    return new Map(Object.entries(collectionMembership));
  }

  async getRelatedProducts(productId: string, limit: number): Promise<Product[]> {
    const product = products.find((p) => p.id === productId);
    if (!product) return [];
    return products
      .filter((p) => p.id !== productId && p.status === "active")
      .filter((p) => p.colorFamily?.id === product.colorFamily?.id || p.categoryIds.some((c) => product.categoryIds.includes(c)))
      .slice(0, limit);
  }

  async getUpsellProducts(productId: string, limit: number): Promise<Product[]> {
    return products
      .filter((p) => accessoryProductIds.includes(p.id) && p.id !== productId)
      .slice(0, limit);
  }

  async getAllProductSlugs(): Promise<string[]> {
    return products.filter((p) => p.status === "active").map((p) => p.slug);
  }
}
