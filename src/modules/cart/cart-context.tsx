"use client";

import * as React from "react";
import type { Product } from "@/domain/entities/catalog";
import type { Cart, CartLine } from "@/domain/entities/cart";
import type { Coupon, RewardRule } from "@/domain/entities/promotions";
import {
  computeCartTotals,
  clampQuantity,
  totalUnits as sumUnits,
  type CartTotals,
} from "@/domain/services/cart-pricing";
import { evaluateRewards, type RewardEvaluation } from "@/domain/services/rewards";
import { computeSubtotal } from "@/domain/services/cart-pricing";
import { lineKey, productToCartLine } from "@/modules/cart/cart-line";

const STORAGE_KEY = "shopluscol.cart.v1";

type PersistedCart = { lines: CartLine[]; coupon: Coupon | null };

type RemovedSnapshot = { line: CartLine; index: number } | null;

export type CartContextValue = {
  cart: Cart;
  lines: CartLine[];
  coupon: Coupon | null;
  totals: CartTotals;
  rewards: RewardEvaluation;
  totalUnits: number;
  isHydrated: boolean;
  drawerOpen: boolean;
  lastAddedKey: string | null;
  addItem: (product: Product, quantity?: number) => void;
  setLineQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  getQuantity: (productId: string, variantId?: string | null) => number;
  removeLine: (productId: string, variantId: string | null) => void;
  undoRemove: () => void;
  canUndo: boolean;
  clearCart: () => void;
  applyCoupon: (coupon: Coupon | null) => void;
  removeCoupon: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({
  rewardRules,
  children,
}: {
  rewardRules: RewardRule[];
  children: React.ReactNode;
}) {
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [coupon, setCoupon] = React.useState<Coupon | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [lastAddedKey, setLastAddedKey] = React.useState<string | null>(null);
  const removedRef = React.useRef<RemovedSnapshot>(null);
  const [canUndo, setCanUndo] = React.useState(false);

  // Hidratación desde localStorage tras el montaje (persistencia entre
  // sesiones, sección 11.1). Debe correr en un efecto —no en el render— para
  // que el HTML del servidor y el primer render del cliente coincidan; recién
  // después se aplica el estado guardado.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedCart;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde almacenamiento del navegador
        if (Array.isArray(parsed.lines)) setLines(parsed.lines);
        if (parsed.coupon) setCoupon(parsed.coupon);
      }
    } catch {
      // Carrito corrupto: se ignora y arranca vacío.
    }
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    const payload: PersistedCart = { lines, coupon };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Sin almacenamiento disponible: el carrito sigue en memoria.
    }
  }, [lines, coupon, isHydrated]);

  const cart: Cart = React.useMemo(() => ({ lines, couponCode: coupon?.code ?? null }), [lines, coupon]);

  const rewards = React.useMemo(
    () => evaluateRewards(rewardRules, { subtotal: computeSubtotal(cart), totalUnits: sumUnits(cart) }),
    [cart, rewardRules],
  );

  const totals = React.useMemo(
    () => computeCartTotals(cart, { coupon, rewards }),
    [cart, coupon, rewards],
  );

  const totalUnits = React.useMemo(() => sumUnits(cart), [cart]);

  const addItem = React.useCallback((product: Product, quantity = 1) => {
    const key = lineKey(product.id, null);
    setLines((prev) => {
      const existing = prev.find((l) => lineKey(l.productId, l.variantId) === key);
      if (existing) {
        const nextQty = clampQuantity(existing.quantity + quantity, product.stock, product.allowBackorder);
        return prev.map((l) =>
          lineKey(l.productId, l.variantId) === key ? { ...l, quantity: nextQty, maxStock: product.stock } : l,
        );
      }
      const clamped = clampQuantity(quantity, product.stock, product.allowBackorder);
      if (clamped <= 0) return prev;
      return [...prev, productToCartLine(product, clamped)];
    });
    setLastAddedKey(key);
    setDrawerOpen(true);
  }, []);

  const setLineQuantity = React.useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      const key = lineKey(productId, variantId);
      setLines((prev) => {
        const target = prev.find((l) => lineKey(l.productId, l.variantId) === key);
        if (!target) return prev;
        const clamped = clampQuantity(quantity, target.maxStock, target.allowBackorder);
        if (clamped <= 0) {
          removedRef.current = { line: target, index: prev.findIndex((l) => lineKey(l.productId, l.variantId) === key) };
          setCanUndo(true);
          return prev.filter((l) => lineKey(l.productId, l.variantId) !== key);
        }
        return prev.map((l) => (lineKey(l.productId, l.variantId) === key ? { ...l, quantity: clamped } : l));
      });
    },
    [],
  );

  const getQuantity = React.useCallback(
    (productId: string, variantId: string | null = null) => {
      const key = lineKey(productId, variantId);
      return lines.find((l) => lineKey(l.productId, l.variantId) === key)?.quantity ?? 0;
    },
    [lines],
  );

  const removeLine = React.useCallback((productId: string, variantId: string | null) => {
    const key = lineKey(productId, variantId);
    setLines((prev) => {
      const index = prev.findIndex((l) => lineKey(l.productId, l.variantId) === key);
      if (index === -1) return prev;
      removedRef.current = { line: prev[index], index };
      setCanUndo(true);
      return prev.filter((l) => lineKey(l.productId, l.variantId) !== key);
    });
  }, []);

  const undoRemove = React.useCallback(() => {
    const snapshot = removedRef.current;
    if (!snapshot) return;
    setLines((prev) => {
      const next = [...prev];
      next.splice(Math.min(snapshot.index, next.length), 0, snapshot.line);
      return next;
    });
    removedRef.current = null;
    setCanUndo(false);
  }, []);

  const clearCart = React.useCallback(() => {
    setLines([]);
    setCoupon(null);
    removedRef.current = null;
    setCanUndo(false);
  }, []);

  const applyCoupon = React.useCallback((next: Coupon | null) => setCoupon(next), []);
  const removeCoupon = React.useCallback(() => setCoupon(null), []);
  const openDrawer = React.useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = React.useCallback(() => setDrawerOpen(false), []);

  const value: CartContextValue = {
    cart,
    lines,
    coupon,
    totals,
    rewards,
    totalUnits,
    isHydrated,
    drawerOpen,
    lastAddedKey,
    addItem,
    setLineQuantity,
    getQuantity,
    removeLine,
    undoRemove,
    canUndo,
    clearCart,
    applyCoupon,
    removeCoupon,
    openDrawer,
    closeDrawer,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
