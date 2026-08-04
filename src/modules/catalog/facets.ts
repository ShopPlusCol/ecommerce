import type { Product } from "@/domain/entities/catalog";

export type FacetOption = {
  slug: string;
  name: string;
  count: number;
  /** Muestra de color de la familia, cuando aplica. */
  hexSwatch?: string | null;
};

export type CatalogFacets = {
  colorFamilies: FacetOption[];
  categories: FacetOption[];
  collections: FacetOption[];
  inStock: number;
  onPromotion: number;
  newest: number;
  bestSelling: number;
};

/**
 * Cuenta cuántos productos hay realmente detrás de cada filtro.
 *
 * Existe para poder cumplir una regla del encargo que el catálogo no
 * cumplía: **no mostrar filtros que no tengan datos**. Antes se listaban
 * todas las familias y categorías existieran o no productos en ellas, así
 * que era posible filtrar y caer en un catálogo vacío desde un filtro que
 * la propia tienda ofrecía.
 *
 * Un descuento solo cuenta como promoción si el precio anterior es
 * realmente mayor que el actual: un `compareAtPrice` igual o menor sería un
 * descuento inventado y no debe habilitar el filtro.
 */
export function computeCatalogFacets(
  products: Product[],
  taxonomy: {
    colorFamilies: Array<{ slug: string; name: string; hexSwatch: string | null }>;
    categories: Array<{ id: string; slug: string; name: string }>;
    collections: Array<{ slug: string; name: string }>;
    collectionMembership?: Map<string, string[]>;
  },
): CatalogFacets {
  const active = products.filter((product) => product.status === "active");

  const byFamily = new Map<string, number>();
  const byCategory = new Map<string, number>();
  let inStock = 0;
  let onPromotion = 0;
  let bestSelling = 0;
  let newest = 0;

  for (const product of active) {
    const familySlug = product.colorFamily?.slug;
    if (familySlug) byFamily.set(familySlug, (byFamily.get(familySlug) ?? 0) + 1);

    for (const categoryId of product.categoryIds) {
      byCategory.set(categoryId, (byCategory.get(categoryId) ?? 0) + 1);
    }

    if (product.stock > 0 || product.allowBackorder) inStock += 1;
    if (product.compareAtPrice && product.compareAtPrice.amount > product.price.amount) onPromotion += 1;
    if (product.badges.includes("mas-vendido")) bestSelling += 1;
    if (product.badges.includes("nuevo")) newest += 1;
  }

  const collectionCounts = new Map<string, number>();
  if (taxonomy.collectionMembership) {
    for (const [slug, productIds] of taxonomy.collectionMembership) {
      const count = productIds.filter((id) => active.some((product) => product.id === id)).length;
      if (count > 0) collectionCounts.set(slug, count);
    }
  }

  return {
    colorFamilies: taxonomy.colorFamilies
      .map((family) => ({
        slug: family.slug,
        name: family.name,
        hexSwatch: family.hexSwatch,
        count: byFamily.get(family.slug) ?? 0,
      }))
      .filter((option) => option.count > 0),
    categories: taxonomy.categories
      .map((category) => ({ slug: category.slug, name: category.name, count: byCategory.get(category.id) ?? 0 }))
      .filter((option) => option.count > 0),
    collections: taxonomy.collections
      .map((collection) => ({
        slug: collection.slug,
        name: collection.name,
        count: collectionCounts.get(collection.slug) ?? 0,
      }))
      .filter((option) => option.count > 0),
    inStock,
    onPromotion,
    newest,
    bestSelling,
  };
}
