"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site-config";
import { useCart } from "@/modules/cart/cart-context";
import { useFavorites } from "@/modules/favorites/favorites-context";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/categoria/halloween", label: "Halloween" },
  { href: "/cuidados", label: "Cuidados" },
  { href: "/preguntas-frecuentes", label: "Ayuda" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { totalUnits, openDrawer, isHydrated } = useCart();
  const { count: favoritesCount } = useFavorites();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="border-b border-border bg-surface-sunken">
        <p className="mx-auto max-w-(--content-max-width) px-[var(--content-padding-x)] py-2 text-center text-xs text-text-muted">
          Envíos a Medellín, Área Metropolitana y toda Colombia · Lentes cosméticos sin fórmula
        </p>
      </div>

      <div className="mx-auto flex h-16 max-w-(--content-max-width) items-center justify-between px-[var(--content-padding-x)]">
        <button
          type="button"
          className="flex h-control-md w-control-md items-center justify-center rounded-md text-text md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="font-display text-lg font-semibold tracking-tight text-text">
          {siteConfig.brandName}
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-text-muted transition-colors duration-fast hover:text-text",
                pathname === link.href && "text-text",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/buscar"
            aria-label="Buscar"
            className="flex h-control-md w-control-md items-center justify-center rounded-md text-text hover:bg-surface-sunken"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/favoritos"
            aria-label={`Favoritos${isHydrated && favoritesCount > 0 ? ` (${favoritesCount})` : ""}`}
            className="relative flex h-control-md w-control-md items-center justify-center rounded-md text-text hover:bg-surface-sunken"
          >
            <Heart className="h-5 w-5" />
            {isHydrated && favoritesCount > 0 ? (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            ) : null}
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Abrir carrito${isHydrated && totalUnits > 0 ? ` (${totalUnits})` : ""}`}
            className="relative flex h-control-md w-control-md items-center justify-center rounded-md text-text hover:bg-surface-sunken"
          >
            <ShoppingBag className="h-5 w-5" />
            {isHydrated && totalUnits > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-contrast tabular-nums">
                {totalUnits}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Navegación móvil"
          className="border-t border-border bg-surface px-[var(--content-padding-x)] py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-md px-2 py-2.5 text-sm font-medium text-text hover:bg-surface-sunken"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
