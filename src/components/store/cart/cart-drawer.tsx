"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/modules/cart/cart-context";
import { CartLineItem } from "@/components/store/cart/cart-line-item";
import { CartSummary } from "@/components/store/cart/cart-summary";
import { CouponField } from "@/components/store/cart/coupon-field";
import { RewardProgress } from "@/components/store/cart/reward-progress";
import { WhatsAppCartButton } from "@/components/store/cart/whatsapp-cart-button";

/**
 * Drawer de carrito. Se desliza desde la derecha en escritorio y ocupa el
 * ancho completo en móvil. Accesible: cierra con Escape, bloquea el scroll de
 * fondo y enfoca el botón de cierre al abrir (secciones 11.1 y 34).
 */
export function CartDrawer() {
  const { drawerOpen, closeDrawer, lines, totals, rewards, canUndo, undoRemove } = useCart();
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen, closeDrawer]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-base ease-standard",
        drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!drawerOpen}
      inert={!drawerOpen}
    >
      <div
        className="absolute inset-0 bg-[rgba(19,17,16,0.45)]"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-lg transition-transform duration-base ease-emphasized",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <h2 className="flex items-center gap-2 font-display text-md font-semibold text-text">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            Tu carrito
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeDrawer}
            aria-label="Cerrar carrito"
            className="flex h-control-md w-control-md items-center justify-center rounded-md text-text hover:bg-surface-sunken"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-10 w-10 text-text-subtle" aria-hidden="true" />
            <p className="font-display text-md font-semibold text-text">Tu carrito está vacío</p>
            <p className="text-sm text-text-muted">Agrega tus tonos favoritos para empezar.</p>
            <Link href="/catalogo" onClick={closeDrawer}>
              <Button variant="secondary">Ir al catálogo</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="py-3">
                <RewardProgress rewards={rewards} />
              </div>
              {canUndo ? (
                <button
                  type="button"
                  onClick={undoRemove}
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-md bg-surface-sunken py-2 text-xs font-medium text-text-muted hover:text-text"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Deshacer el último producto eliminado
                </button>
              ) : null}
              <div className="divide-y divide-border">
                {lines.map((line) => (
                  <CartLineItem
                    key={`${line.productId}:${line.variantId ?? ""}`}
                    line={line}
                    onNavigate={closeDrawer}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border p-4">
              <CouponField />
              <CartSummary totals={totals} />
              <Link href="/checkout" onClick={closeDrawer}>
                <Button fullWidth size="lg">
                  Continuar al pago
                </Button>
              </Link>
              <WhatsAppCartButton onClick={closeDrawer} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
