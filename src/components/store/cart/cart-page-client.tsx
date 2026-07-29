"use client";

import Link from "next/link";
import { ShoppingBag, RotateCcw } from "lucide-react";
import type { Product } from "@/domain/entities/catalog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/modules/cart/cart-context";
import { CartLineItem } from "@/components/store/cart/cart-line-item";
import { CartSummary } from "@/components/store/cart/cart-summary";
import { CouponField } from "@/components/store/cart/coupon-field";
import { RewardProgress } from "@/components/store/cart/reward-progress";
import { WhatsAppCartButton } from "@/components/store/cart/whatsapp-cart-button";
import { CartUpsells } from "@/components/store/cart/cart-upsells";

export function CartPageClient({ accessories }: { accessories: Product[] }) {
  const { lines, totals, rewards, canUndo, undoRemove, isHydrated } = useCart();

  if (!isHydrated) {
    return <p className="text-sm text-text-muted">Cargando tu carrito…</p>;
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title="Tu carrito está vacío"
        description="Explora el catálogo y agrega tus tonos favoritos."
        action={
          <Link href="/catalogo">
            <Button>Ir al catálogo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-4">
        <RewardProgress rewards={rewards} />
        {canUndo ? (
          <button
            type="button"
            onClick={undoRemove}
            className="flex w-fit items-center gap-2 rounded-md bg-surface-sunken px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Deshacer eliminación
          </button>
        ) : null}
        <Card>
          <CardContent className="divide-y divide-border py-0">
            {lines.map((line) => (
              <CartLineItem key={`${line.productId}:${line.variantId ?? ""}`} line={line} />
            ))}
          </CardContent>
        </Card>
        <CartUpsells products={accessories} />
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <CouponField />
            <CartSummary totals={totals} />
            <Link href="/checkout">
              <Button fullWidth size="lg">
                Continuar al pago
              </Button>
            </Link>
            <WhatsAppCartButton />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
