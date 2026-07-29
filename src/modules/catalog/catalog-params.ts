import type { ProductQuery, ProductSort } from "@/application/ports/catalog-repository";

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

const VALID_SORTS: ProductSort[] = ["relevance", "best_selling", "newest", "price_asc", "price_desc", "promotion"];

export const SORT_LABELS: Record<ProductSort, string> = {
  relevance: "Relevancia",
  best_selling: "Más vendidos",
  newest: "Novedades",
  price_asc: "Precio: menor a mayor",
  price_desc: "Precio: mayor a menor",
  promotion: "En promoción",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export const PAGE_SIZE = 12;

/** Traduce los search params de la URL a una ProductQuery tipada. */
export function parseCatalogParams(searchParams: CatalogSearchParams): ProductQuery {
  const sortRaw = first(searchParams.order) as ProductSort | undefined;
  const sort = sortRaw && VALID_SORTS.includes(sortRaw) ? sortRaw : "relevance";

  return {
    filters: {
      categorySlug: first(searchParams.categoria),
      colorFamilySlug: first(searchParams.color),
      collectionSlug: first(searchParams.coleccion),
      availability: first(searchParams.disponibilidad) === "in_stock" ? "in_stock" : undefined,
      onPromotion: first(searchParams.promocion) === "1" ? true : undefined,
      minPrice: toInt(first(searchParams.min)),
      maxPrice: toInt(first(searchParams.max)),
      search: first(searchParams.q),
    },
    sort,
    page: Math.max(1, toInt(first(searchParams.pagina)) ?? 1),
    pageSize: PAGE_SIZE,
  };
}

/** Construye un query string a partir de valores de filtro (para URLs compartibles). */
export function buildCatalogQueryString(current: URLSearchParams, changes: Record<string, string | null>): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(changes)) {
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
  }
  // Al cambiar cualquier filtro, volver a la primera página.
  if (!("pagina" in changes)) next.delete("pagina");
  const str = next.toString();
  return str ? `?${str}` : "";
}
