"use client";

import * as React from "react";
import { Check, Heart, MessageCircle, X } from "lucide-react";
import type { Product } from "@/domain/entities/catalog";
import { Chip } from "@/components/ui/chip";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { useFavorites } from "@/modules/favorites/favorites-context";
import { useAnalytics } from "@/modules/analytics/analytics-context";
import { buildWhatsAppUrl } from "@/modules/whatsapp/cart-message";
import { getStoreContentAction } from "@/app/(store)/site-content-actions";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/domain/value-objects/money";

/**
 * Panel de compra de la página de producto: cantidad, agregar al carrito,
 * favorito y consulta por WhatsApp (sección 9). Registra ViewContent al
 * montar y sincroniza la cantidad elegida con el carrito.
 */
export function ProductPurchasePanel({
  product,
  texts,
}: {
  product: Product;
  /** Textos comerciales editables desde Configuración → Textos del sitio. */
  texts: {
    productIncludes: string;
    productExcludes: string;
    productVariationNote: string;
    whatsappProductTemplate: string;
  };
}) {
  const [quantity, setQuantity] = React.useState(1);
  const [whatsappNumber, setWhatsappNumber] = React.useState<string | undefined>(undefined);
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

  React.useEffect(() => {
    let cancelled = false;
    getStoreContentAction().then(({ brand }) => {
      if (!cancelled) setWhatsappNumber(brand.whatsapp);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mensaje con intención de compra, no una consulta abierta: incluye
  // producto, cantidad, precio y qué incluye, y deja el hueco de la
  // ubicación. Cuanto más resuelto llega el mensaje, menos ida y vuelta
  // hace falta por WhatsApp para cerrar (o descartar) la venta.
  const productUrl = typeof window === "undefined" ? "" : window.location.href;
  const whatsappMessage = texts.whatsappProductTemplate
    .replace("{producto}", product.name)
    .replace("{precio}", formatMoney(product.price))
    .replace("{cantidad}", String(quantity))
    .replace("{incluye}", texts.productIncludes.replace(/\.$/, ""))
    .replace("{url}", productUrl);
  const whatsappUrl = buildWhatsAppUrl(whatsappMessage, whatsappNumber);

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
        onClick={() =>
          track("Contact", {
            value: product.price.amount * quantity,
            currency: "COP",
            contentIds: [product.id],
            quantities: [quantity],
            contentType: "product",
            extra: { source: "product" },
          })
        }
        className="inline-flex h-control-md items-center justify-center gap-2 rounded-md border border-[#25D366] text-sm font-medium text-[#0F7F43] transition-colors duration-fast hover:bg-[#25D366]/10"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Comprar este tono por WhatsApp
      </a>

      {/* Qué incluye, qué no y la variación real del resultado: las tres
          dudas que hoy se resuelven una por una por WhatsApp. */}
      <div className="rounded-lg border border-border bg-surface-sunken/60 p-4 text-sm">
        <ul className="flex flex-col gap-2">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
            <span>
              <span className="font-medium text-text">Incluye:</span>{" "}
              <span className="text-text-muted">{texts.productIncludes}</span>
            </span>
          </li>
          <li className="flex items-start gap-2">
            <X className="mt-0.5 h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
            <span>
              <span className="font-medium text-text">No incluye:</span>{" "}
              <span className="text-text-muted">{texts.productExcludes}</span>
            </span>
          </li>
        </ul>
        <p className="mt-3 border-t border-border pt-3 text-xs text-text-subtle">{texts.productVariationNote}</p>
      </div>
    </div>
  );
}
