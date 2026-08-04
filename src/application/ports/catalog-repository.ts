import type { Category, ColorFamily, Product } from "@/domain/entities/catalog";

export type ProductSort = "relevance" | "best_selling" | "newest" | "price_asc" | "price_desc" | "promotion";

export type ProductFilters = {
  categorySlug?: string;
  colorFamilySlug?: string;
  collectionSlug?: string;
  availability?: "in_stock" | "all";
  onPromotion?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type ProductQuery = {
  filters?: ProductFilters;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

export type ProductListResult = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

/**
 * Puerto de lectura del catálogo (sección 29). El store depende solo de esta
 * interfaz; en la Fase 2 la implementa un adaptador de datos de desarrollo,
 * en la Fase 3 un adaptador Drizzle sobre D1/SQLite. Ningún componente de la
 * tienda consulta la base de datos directamente (sección 28.1).
 */
export interface CatalogRepository {
  listProducts(query: ProductQuery): Promise<ProductListResult>;
  getProductBySlug(slug: string): Promise<Product | null>;
  getProductsByIds(ids: string[]): Promise<Product[]>;
  listCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | null>;
  listColorFamilies(): Promise<ColorFamily[]>;
  getColorFamilyBySlug(slug: string): Promise<ColorFamily | null>;
  listCollections(): Promise<Collection[]>;
  /** Ids de producto por slug de colección, en una sola consulta. */
  listCollectionMembership(): Promise<Map<string, string[]>>;
  getCollectionBySlug(slug: string): Promise<Collection | null>;
  getRelatedProducts(productId: string, limit: number): Promise<Product[]>;
  getUpsellProducts(productId: string, limit: number): Promise<Product[]>;
  getAllProductSlugs(): Promise<string[]>;
}
