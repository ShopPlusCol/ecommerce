"use client";

import Image from "next/image";
import type { Product } from "@/domain/entities/catalog";
import { formatMoney } from "@/domain/value-objects/money";
import { AddToCartButton } from "@/components/store/add-to-cart-button";

/** Accesorios sugeridos / frecuentemente comprados juntos (sección 11.2). */
export function CartUpsells({ products, title = "Agrega el cuidado de tus lentes" }: { products: Product[]; title?: string }) {
  if (products.length === 0) return null;
  return (
    <section aria-label="Accesorios sugeridos" className="flex flex-col gap-3">
      <h3 className="font-display text-md font-semibold text-text">{title}</h3>
      <ul className="flex flex-col gap-2">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-2"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface-sunken">
              {product.media[0] ? (
                <Image src={product.media[0].url} alt={product.name} fill sizes="56px" className="object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{product.name}</p>
              <p className="text-sm text-text-muted">{formatMoney(product.price)}</p>
            </div>
            <AddToCartButton product={product} size="sm" variant="secondary" label="Agregar" />
          </li>
        ))}
      </ul>
    </section>
  );
}
