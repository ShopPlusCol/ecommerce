"use client";

import * as React from "react";
import { Check, ShoppingBag } from "lucide-react";
import type { Product } from "@/domain/entities/catalog";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/modules/cart/cart-context";
import { useAnalytics } from "@/modules/analytics/analytics-context";

/**
 * Botón "Agregar al carrito" reutilizable. Da confirmación visual breve,
 * respeta el inventario y dispara el evento AddToCart de analítica
 * (secciones 8.2 y 21.2). Evita dobles envíos por taps rápidos.
 */
export function AddToCartButton({
  product,
  quantity = 1,
  label = "Agregar al carrito",
  size = "md",
  variant = "primary",
  fullWidth,
}: {
  product: Product;
  quantity?: number;
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  fullWidth?: boolean;
}) {
  const { addItem } = useCart();
  const { track } = useAnalytics();
  const [justAdded, setJustAdded] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const outOfStock = product.stock <= 0 && !product.allowBackorder;

  React.useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const onClick = () => {
    if (outOfStock) return;
    addItem(product, quantity);
    track("AddToCart", {
      value: product.price.amount * quantity,
      currency: "COP",
      contentIds: [product.id],
      contentType: "product",
    });
    setJustAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setJustAdded(false), 1600);
  };

  if (outOfStock) {
    return (
      <Button size={size} variant="secondary" fullWidth={fullWidth} disabled>
        Agotado
      </Button>
    );
  }

  return (
    <Button size={size} variant={variant} fullWidth={fullWidth} onClick={onClick}>
      {justAdded ? (
        <>
          <Check className="h-4 w-4" aria-hidden="true" /> Agregado
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" aria-hidden="true" /> {label}
        </>
      )}
    </Button>
  );
}
