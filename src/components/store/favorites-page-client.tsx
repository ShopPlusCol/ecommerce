"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import type { Product } from "@/domain/entities/catalog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/store/product-card";
import { useFavorites } from "@/modules/favorites/favorites-context";

export function FavoritesPageClient({ products }: { products: Product[] }) {
  const { favorites, isHydrated } = useFavorites();

  if (!isHydrated) {
    return <p className="text-sm text-text-muted">Cargando tus favoritos…</p>;
  }

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  if (favoriteProducts.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-8 w-8" />}
        title="Aún no tienes favoritos"
        description="Toca el corazón en cualquier producto para guardarlo aquí. Se guardan en este navegador."
        action={
          <Link href="/catalogo">
            <Button variant="secondary">Explorar catálogo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {favoriteProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
