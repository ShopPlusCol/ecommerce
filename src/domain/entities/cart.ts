import type { Money } from "@/domain/value-objects/money";

/**
 * Línea de carrito. Guarda una instantánea del precio y de los límites de
 * inventario en el momento de agregar, para que el carrito pueda mostrar y
 * calcular sin volver a consultar el catálogo en cada render. La
 * revalidación autoritativa contra el catálogo se hace en servidor antes de
 * crear el pedido (sección 11.1).
 */
export type CartLine = {
  productId: string;
  variantId: string | null;
  sku: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  colorFamilyName: string | null;
  unitPrice: Money;
  compareAtPrice: Money | null;
  quantity: number;
  maxStock: number;
  allowBackorder: boolean;
  isGift: boolean;
};

export type Cart = {
  lines: CartLine[];
  couponCode: string | null;
};

export const EMPTY_CART: Cart = { lines: [], couponCode: null };

export function totalUnits(cart: Cart): number {
  return cart.lines.reduce((sum, line) => sum + line.quantity, 0);
}
