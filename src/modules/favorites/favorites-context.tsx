"use client";

import * as React from "react";

const STORAGE_KEY = "shopluscol.favorites.v1";

export type FavoritesContextValue = {
  favorites: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  isHydrated: boolean;
  count: number;
};

const FavoritesContext = React.createContext<FavoritesContextValue | null>(null);

/**
 * Favoritos usables sin iniciar sesión, con persistencia local (sección 10).
 * Preparado para sincronizar con una cuenta de usuario en el futuro.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde almacenamiento del navegador
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch {
      // Ignorar datos corruptos.
    }
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Sin almacenamiento: se mantiene en memoria.
    }
  }, [favorites, isHydrated]);

  const isFavorite = React.useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const toggleFavorite = React.useCallback((productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }, []);

  const value: FavoritesContextValue = {
    favorites,
    isFavorite,
    toggleFavorite,
    isHydrated,
    count: favorites.length,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = React.useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de <FavoritesProvider>");
  return ctx;
}
