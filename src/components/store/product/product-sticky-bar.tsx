"use client";

import * as React from "react";
import type { Product } from "@/domain/entities/catalog";
import { formatMoney } from "@/domain/value-objects/money";
import { AddToCartButton } from "@/components/store/add-to-cart-button";

/**
 * CTA fijo inferior en móvil (sección 9). Oculto en escritorio. Mientras está
 * montado, marca el body para que el botón flotante de WhatsApp se oculte en
 * móvil y no se solapen (regla: "WhatsApp tapando elementos").
 */
export function ProductStickyBar({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0 && !product.allowBackorder;

  React.useEffect(() => {
    document.body.setAttribute("data-mobile-cta", "1");
    return () => document.body.removeAttribute("data-mobile-cta");
  }, []);

  if (outOfStock) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-raised/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-(--content-max-width) items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-text-muted">{product.name}</p>
          <p className="text-sm font-semibold text-text">{formatMoney(product.price)}</p>
        </div>
        <div className="ml-auto">
          <AddToCartButton product={product} label="Agregar" />
        </div>
      </div>
    </div>
  );
}
