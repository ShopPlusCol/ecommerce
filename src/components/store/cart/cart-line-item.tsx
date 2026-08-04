"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { CartLine } from "@/domain/entities/cart";
import { formatMoney, multiply } from "@/domain/value-objects/money";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useCart } from "@/modules/cart/cart-context";
import { isVideoUrl } from "@/lib/media-type";

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { setLineQuantity, removeLine } = useCart();
  const lineTotal = multiply(line.unitPrice, line.quantity);

  return (
    <div className="flex gap-3 py-3">
      <Link
        href={`/productos/${line.slug}`}
        onClick={onNavigate}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-surface-sunken"
      >
        {/* El contenedor tiene tamaño fijo (h-20 w-20), así que la imagen no
            puede desplazar el layout mientras carga. */}
        {line.imageUrl && isVideoUrl(line.imageUrl) ? (
          <video src={line.imageUrl} muted playsInline preload="metadata" aria-label={line.name} className="h-full w-full object-cover" />
        ) : line.imageUrl ? (
          <Image src={line.imageUrl} alt={line.name} fill sizes="80px" className="object-cover" />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/productos/${line.slug}`}
              onClick={onNavigate}
              className="block truncate text-sm font-medium text-text hover:text-brand"
            >
              {line.name}
            </Link>
            {/* Familia y qué incluye: la misma aclaración que la ficha, para
                que el carrito no sea el sitio donde reaparece la duda de si
                el estuche viene o no. Un lente tiene familia de color; un
                accesorio no. */}
            {line.colorFamilyName ? (
              <p className="text-xs text-text-subtle">
                {line.colorFamilyName} · Lentes + estuche
              </p>
            ) : null}
            {line.isGift ? <p className="text-xs font-medium text-success">Regalo</p> : null}
          </div>
          {!line.isGift ? (
            <button
              type="button"
              onClick={() => removeLine(line.productId, line.variantId)}
              aria-label={`Quitar ${line.name}`}
              className="shrink-0 rounded-md p-1 text-text-subtle hover:bg-surface-sunken hover:text-danger"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          {line.isGift ? (
            <span className="text-sm text-text-muted">Incluido</span>
          ) : (
            <QuantityStepper
              size="sm"
              quantity={line.quantity}
              min={0}
              max={line.allowBackorder ? 99 : line.maxStock}
              onChange={(next) => setLineQuantity(line.productId, line.variantId, next)}
            />
          )}
          <span className="text-sm font-semibold text-text tabular-nums">
            {line.isGift ? "Gratis" : formatMoney(lineTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
