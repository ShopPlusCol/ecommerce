import { asc, eq } from "drizzle-orm";
import type {
  CatalogRepository,
  Collection,
  ProductListResult,
  ProductQuery,
  ProductSort,
} from "@/application/ports/catalog-repository";
import type { Category, ColorFamily, Product, ProductBadge } from "@/domain/entities/catalog";
import { money } from "@/domain/value-objects/money";
import { normalizeText } from "@/lib/text";
import { getRuntimeDb } from "@/infrastructure/db/client";
import {
  categories,
  collectionProducts,
  collections,
  colorFamilies,
  inventoryItems,
  productCategories,
  productMedia,
  products,
  recommendationRules,
} from "@/infrastructure/db/schema";

function sortProducts(list: Product[], sort: ProductSort) {
  const copy = [...list];
  if (sort === "price_asc") return copy.sort((a, b) => a.price.amount - b.price.amount);
  if (sort === "price_desc") return copy.sort((a, b) => b.price.amount - a.price.amount);
  if (sort === "newest") return copy.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  if (sort === "promotion") return copy.sort((a, b) => Number(Boolean(b.compareAtPrice)) - Number(Boolean(a.compareAtPrice)));
  return copy.sort((a, b) => Number(b.featured) - Number(a.featured));
}

export class DrizzleCatalogRepository implements CatalogRepository {
  private async hydrate(): Promise<Product[]> {
    const db = await getRuntimeDb();
    const [rows, colors, media, categoriesMap, inventory] = await Promise.all([
      db.select().from(products).where(eq(products.status, "active")).orderBy(asc(products.order)),
      db.select().from(colorFamilies),
      db.select().from(productMedia).orderBy(asc(productMedia.order)),
      db.select().from(productCategories),
      db.select().from(inventoryItems),
    ]);
    return rows.map((row) => {
      const compare = row.compareAtPrice && row.compareAtPrice > row.price ? row.compareAtPrice : null;
      const stockRows = inventory.filter((item) => item.productId === row.id);
      const stock = stockRows.reduce((sum, item) => sum + item.quantityOnHand - item.quantityReserved, 0);
      const badges: ProductBadge[] = [];
      if (compare) badges.push("promocion");
      if (stock <= 0) badges.push("agotado");
      return {
        id: row.id,
        slug: row.slug,
        sku: row.sku,
        status: row.status,
        name: row.name,
        shortDescription: row.shortDescription ?? "",
        description: row.description ?? "",
        price: money(row.price),
        compareAtPrice: compare ? money(compare) : null,
        colorFamily: colors.find((color) => color.id === row.colorFamilyId) ?? null,
        categoryIds: categoriesMap.filter((link) => link.productId === row.id).map((link) => link.categoryId),
        media: media.filter((asset) => asset.productId === row.id),
        badges,
        stock,
        allowBackorder: row.allowBackorder,
        featured: row.featured,
        publishedAt: row.publishedAt?.toISOString() ?? null,
      };
    });
  }

  async listProducts(query: ProductQuery): Promise<ProductListResult> {
    const db = await getRuntimeDb();
    const filters = query.filters ?? {};
    let list = await this.hydrate();
    if (filters.categorySlug) {
      const [category] = await db.select().from(categories).where(eq(categories.slug, filters.categorySlug)).limit(1);
      list = category ? list.filter((product) => product.categoryIds.includes(category.id)) : [];
    }
    if (filters.colorFamilySlug) {
      list = list.filter((product) => product.colorFamily?.slug === filters.colorFamilySlug);
    }
    if (filters.collectionSlug) {
      const [collection] = await db.select().from(collections).where(eq(collections.slug, filters.collectionSlug)).limit(1);
      const links = collection
        ? await db.select().from(collectionProducts).where(eq(collectionProducts.collectionId, collection.id))
        : [];
      const ids = new Set(links.map((link) => link.productId));
      list = list.filter((product) => ids.has(product.id));
    }
    if (filters.availability === "in_stock") list = list.filter((product) => product.stock > 0 || product.allowBackorder);
    if (filters.onPromotion) list = list.filter((product) => Boolean(product.compareAtPrice));
    if (filters.minPrice !== undefined) list = list.filter((product) => product.price.amount >= filters.minPrice!);
    if (filters.maxPrice !== undefined) list = list.filter((product) => product.price.amount <= filters.maxPrice!);
    if (filters.search) {
      const terms = normalizeText(filters.search).split(/\s+/);
      list = list.filter((product) => {
        const value = normalizeText(`${product.name} ${product.sku} ${product.shortDescription}`);
        return terms.every((term) => value.includes(term));
      });
    }
    list = sortProducts(list, query.sort ?? "relevance");
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, query.pageSize ?? 12);
    return { products: list.slice((page - 1) * pageSize, page * pageSize), total: list.length, page, pageSize };
  }

  async getProductBySlug(slug: string) {
    return (await this.hydrate()).find((product) => product.slug === slug) ?? null;
  }
  async getProductsByIds(ids: string[]) {
    const set = new Set(ids);
    return (await this.hydrate()).filter((product) => set.has(product.id));
  }
  async listCategories(): Promise<Category[]> {
    const db = await getRuntimeDb();
    return (await db.select().from(categories).orderBy(asc(categories.order))).map((row) => ({
      ...row,
      archivedAt: row.archivedAt?.toISOString() ?? null,
    }));
  }
  async getCategoryBySlug(slug: string) {
    return (await this.listCategories()).find((category) => category.slug === slug) ?? null;
  }
  async listColorFamilies(): Promise<ColorFamily[]> {
    const db = await getRuntimeDb();
    return db.select({ id: colorFamilies.id, slug: colorFamilies.slug, name: colorFamilies.name, hexSwatch: colorFamilies.hexSwatch }).from(colorFamilies).orderBy(asc(colorFamilies.order));
  }
  async getColorFamilyBySlug(slug: string) {
    return (await this.listColorFamilies()).find((family) => family.slug === slug) ?? null;
  }
  async listCollections(): Promise<Collection[]> {
    const db = await getRuntimeDb();
    return db.select({ id: collections.id, slug: collections.slug, name: collections.name, description: collections.description }).from(collections);
  }
  async getCollectionBySlug(slug: string) {
    return (await this.listCollections()).find((collection) => collection.slug === slug) ?? null;
  }
  async getRelatedProducts(productId: string, limit: number) {
    const all = await this.hydrate();
    const source = all.find((product) => product.id === productId);
    if (!source) return [];
    return all.filter((product) => product.id !== productId && (
      product.colorFamily?.id === source.colorFamily?.id ||
      product.categoryIds.some((id) => source.categoryIds.includes(id))
    )).slice(0, limit);
  }
  async getUpsellProducts(productId: string, limit: number) {
    const db = await getRuntimeDb();
    const rules = await db.select().from(recommendationRules).where(eq(recommendationRules.status, "active"));
    const ids = rules
      .filter((rule) => rule.scope === "global" || rule.scopeReferenceId === productId)
      .map((rule) => rule.recommendedProductId)
      .slice(0, limit);
    return ids.length ? this.getProductsByIds(ids) : [];
  }
  async getAllProductSlugs() {
    const db = await getRuntimeDb();
    return (await db.select({ slug: products.slug }).from(products).where(eq(products.status, "active"))).map((row) => row.slug);
  }
}
