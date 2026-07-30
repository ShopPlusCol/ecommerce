"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/domain/entities/catalog";
import { formatMoney } from "@/domain/value-objects/money";
import { Chip } from "@/components/ui/chip";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/store/favorite-button";
import { useCart } from "@/modules/cart/cart-context";
import { useAnalytics } from "@/modules/analytics/analytics-context";

const BADGE_LABEL: Record<Product["badges"][number], string> = {
  nuevo: "Nuevo",
  "mas-vendido": "Más vendido",
  promocion: "Promoción",
  halloween: "Halloween",
  agotado: "Agotado",
};

function savingsPercent(product: Product): number | null {
  if (!product.compareAtPrice || product.compareAtPrice.amount <= product.price.amount) return null;
  return Math.round(((product.compareAtPrice.amount - product.price.amount) / product.compareAtPrice.amount) * 100);
}

/**
 * Tarjeta de producto interactiva (sección 8.2): favorito, agregar con
 * confirmación y stepper directo en la tarjeta que sincroniza con el carrito.
 * Diseño editorial con imagen protagonista y contenedores mínimos.
 */
export function ProductCard({ product }: { product: Product }) {
  const { addItem, getQuantity, setLineQuantity } = useCart();
  const { track } = useAnalytics();
  const cover = product.media[0];
  const outOfStock = product.stock <= 0 && !product.allowBackorder;
  const quantity = getQuantity(product.id);
  const discount = savingsPercent(product);

  const onAdd = () => {
    addItem(product, 1);
    track("AddToCart", {
      value: product.price.amount,
      currency: "COP",
      contentIds: [product.id],
      contentType: "product",
    });
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface-sunken">
        <Link href={`/productos/${product.slug}`} aria-label={product.name} tabIndex={-1}>
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.altText}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-slow ease-standard group-hover:scale-[1.04]"
            />
          ) : null}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {discount ? <Chip variant="brand">−{discount}%</Chip> : null}
          {product.badges
            .filter((b) => b !== "promocion" || !discount)
            .map((badge) => (
              <Chip key={badge} variant={badge === "promocion" ? "brand" : "neutral"}>
                {BADGE_LABEL[badge]}
              </Chip>
            ))}
          {outOfStock ? <Chip variant="danger">Agotado</Chip> : null}
        </div>

        <FavoriteButton
          productId={product.id}
          productName={product.name}
          className="absolute right-3 top-3 opacity-0 transition-opacity duration-base focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
        />

        {/* Acción rápida sobre la imagen, aparece al interactuar (visible siempre en móvil). */}
        <div className="absolute inset-x-3 bottom-3 translate-y-1 opacity-0 transition-[opacity,transform] duration-base ease-standard group-hover:translate-y-0 group-hover:opacity-100 max-md:translate-y-0 max-md:opacity-100">
          {outOfStock ? (
            <Button variant="secondary" size="sm" fullWidth disabled>
              Agotado
            </Button>
          ) : quantity > 0 ? (
            <QuantityStepper
              size="sm"
              quantity={quantity}
              min={0}
              max={product.allowBackorder ? 99 : product.stock}
              onChange={(next) => setLineQuantity(product.id, null, next)}
              className="w-full justify-between bg-surface-raised shadow-sm"
            />
          ) : (
            <Button size="sm" fullWidth onClick={onAdd} className="shadow-sm">
              Agregar
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0.5 px-0.5 pt-3">
        {product.colorFamily ? (
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-subtle">
            {product.colorFamily.name}
          </span>
        ) : null}
        <Link
          href={`/productos/${product.slug}`}
          className="font-display text-base font-semibold text-text transition-colors hover:text-brand"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-medium text-text">{formatMoney(product.price)}</span>
          {product.compareAtPrice ? (
            <span className="text-sm text-text-subtle line-through">{formatMoney(product.compareAtPrice)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
