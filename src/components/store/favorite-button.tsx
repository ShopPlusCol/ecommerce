"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/modules/favorites/favorites-context";
import { useAnalytics } from "@/modules/analytics/analytics-context";

export function FavoriteButton({
  productId,
  productName,
  className,
}: {
  productId: string;
  productName: string;
  className?: string;
}) {
  const { isFavorite, toggleFavorite, isHydrated } = useFavorites();
  const { track } = useAnalytics();
  const active = isHydrated && isFavorite(productId);

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const wasActive = isFavorite(productId);
    toggleFavorite(productId);
    if (!wasActive) {
      track("AddToWishlist", { contentIds: [productId], contentType: "product" });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Quitar ${productName} de favoritos` : `Agregar ${productName} a favoritos`}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised/90 text-text shadow-xs backdrop-blur transition-colors duration-fast hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", active && "fill-brand text-brand")} aria-hidden="true" />
    </button>
  );
}
