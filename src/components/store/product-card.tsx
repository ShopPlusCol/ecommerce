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
    <div className="group flex flex-col rounded-lg border border-border bg-surface-raised transition-shadow duration-base ease-standard hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-surface-sunken">
        <Link href={`/productos/${product.slug}`} aria-label={product.name}>
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.altText}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-slow ease-standard group-hover:scale-[1.03]"
            />
          ) : null}
        </Link>
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {product.badges.map((badge) => (
            <Chip key={badge} variant={badge === "promocion" ? "brand" : "neutral"}>
              {BADGE_LABEL[badge]}
            </Chip>
          ))}
          {discount ? <Chip variant="brand">-{discount}%</Chip> : null}
          {outOfStock ? <Chip variant="danger">Agotado</Chip> : null}
        </div>
        <FavoriteButton productId={product.id} productName={product.name} className="absolute right-2 top-2" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {product.colorFamily ? (
          <span className="text-xs font-medium uppercase tracking-wide text-text-subtle">
            {product.colorFamily.name}
          </span>
        ) : null}
        <Link href={`/productos/${product.slug}`} className="font-display text-base font-semibold text-text hover:text-brand">
          {product.name}
        </Link>
        <p className="line-clamp-2 text-sm text-text-muted">{product.shortDescription}</p>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-md font-semibold text-text">{formatMoney(product.price)}</span>
          {product.compareAtPrice ? (
            <span className="text-sm text-text-subtle line-through">{formatMoney(product.compareAtPrice)}</span>
          ) : null}
        </div>

        <div className="mt-3">
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
              className="w-full justify-between"
            />
          ) : (
            <Button size="sm" fullWidth onClick={onAdd}>
              Agregar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
