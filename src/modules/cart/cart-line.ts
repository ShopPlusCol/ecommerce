import type { Product } from "@/domain/entities/catalog";
import type { CartLine } from "@/domain/entities/cart";

export function lineKey(productId: string, variantId: string | null): string {
  return `${productId}:${variantId ?? ""}`;
}

/** Construye una línea de carrito a partir de un producto del catálogo. */
export function productToCartLine(product: Product, quantity: number): CartLine {
  return {
    productId: product.id,
    variantId: null,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    imageUrl: product.media[0]?.url ?? null,
    colorFamilyName: product.colorFamily?.name ?? null,
    unitPrice: product.price,
    compareAtPrice: product.compareAtPrice,
    quantity,
    maxStock: product.stock,
    allowBackorder: product.allowBackorder,
    isGift: false,
  };
}
