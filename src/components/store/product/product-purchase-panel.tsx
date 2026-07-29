"use client";

import * as React from "react";
import { Heart, MessageCircle } from "lucide-react";
import type { Product } from "@/domain/entities/catalog";
import { Chip } from "@/components/ui/chip";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { useFavorites } from "@/modules/favorites/favorites-context";
import { useAnalytics } from "@/modules/analytics/analytics-context";
import { buildWhatsAppUrl } from "@/modules/whatsapp/cart-message";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/domain/value-objects/money";

/**
 * Panel de compra de la página de producto: cantidad, agregar al carrito,
 * favorito y consulta por WhatsApp (sección 9). Registra ViewContent al
 * montar y sincroniza la cantidad elegida con el carrito.
 */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const [quantity, setQuantity] = React.useState(1);
  const { isFavorite, toggleFavorite, isHydrated } = useFavorites();
  const { track } = useAnalytics();
  const outOfStock = product.stock <= 0 && !product.allowBackorder;
  const active = isHydrated && isFavorite(product.id);

  React.useEffect(() => {
    track("ViewContent", {
      value: product.price.amount,
      currency: "COP",
      contentIds: [product.id],
      contentType: "product",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const whatsappUrl = buildWhatsAppUrl(
    `Hola, quiero preguntar por el lente ${product.name} (${formatMoney(product.price)}).`,
  );

  return (
    <div className="flex flex-col gap-4">
      {outOfStock ? (
        <Chip variant="danger">Agotado</Chip>
      ) : product.stock <= 5 ? (
        <Chip variant="warning">Últimas unidades</Chip>
      ) : (
        <Chip variant="success">Disponible</Chip>
      )}

      {!outOfStock ? (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text">Cantidad</span>
          <QuantityStepper
            quantity={quantity}
            min={1}
            max={product.allowBackorder ? 99 : product.stock}
            onChange={setQuantity}
          />
        </div>
      ) : null}

      <div className="flex gap-2">
        <AddToCartButton product={product} quantity={quantity} size="lg" fullWidth />
        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-pressed={active}
          aria-label={active ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="flex h-control-lg w-control-lg shrink-0 items-center justify-center rounded-md border border-border-strong text-text hover:bg-surface-sunken"
        >
          <Heart className={cn("h-5 w-5", active && "fill-brand text-brand")} aria-hidden="true" />
        </button>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-control-md items-center justify-center gap-2 rounded-md border border-[#25D366] text-sm font-medium text-[#128C4B] transition-colors duration-fast hover:bg-[#25D366]/10"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Preguntar por WhatsApp
      </a>
    </div>
  );
}
