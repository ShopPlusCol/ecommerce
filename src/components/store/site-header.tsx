"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BrandSettings } from "@/modules/settings/brand";
import { BrandMark } from "./brand-mark";
import { useCart } from "@/modules/cart/cart-context";
import { useFavorites } from "@/modules/favorites/favorites-context";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/categoria/halloween", label: "Halloween" },
  { href: "/cuidados", label: "Cuidados" },
  { href: "/preguntas-frecuentes", label: "Ayuda" },
];

const ICON_BUTTON =
  "flex h-control-md w-control-md items-center justify-center rounded-full text-text transition-colors duration-fast hover:bg-surface-sunken";

export function SiteHeader({ brand }: { brand: BrandSettings }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { totalUnits, openDrawer, isHydrated } = useCart();
  const { count: favoritesCount } = useFavorites();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-surface/85 backdrop-blur transition-shadow duration-base",
        scrolled ? "shadow-sm" : "",
      )}
    >
      {/* Barra de anuncio editorial */}
      <div className="bg-text text-text-inverted">
        <p className="mx-auto max-w-(--content-max-width) px-[var(--content-padding-x)] py-2 text-center text-[11px] font-medium uppercase tracking-[0.14em]">
          Envío el mismo día en Medellín · Lentes cosméticos sin fórmula
        </p>
      </div>

      <div
        className={cn(
          "mx-auto grid max-w-(--content-max-width) grid-cols-[1fr_auto_1fr] items-center px-[var(--content-padding-x)] transition-[height] duration-base",
          scrolled ? "h-16" : "h-[72px]",
        )}
      >
        {/* Izquierda: nav (desktop) / menú (móvil) */}
        <div className="flex items-center">
          <button
            type="button"
            className={cn(ICON_BUTTON, "-ml-2 lg:hidden")}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium text-text-muted transition-colors duration-fast hover:text-text",
                  "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand after:transition-transform after:duration-base hover:after:scale-x-100",
                  pathname === link.href && "text-text after:scale-x-100",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Centro: marca */}
        <Link
          href="/"
          className="justify-self-center font-display text-xl font-semibold tracking-[0.18em] text-text uppercase sm:text-2xl"
        >
          <BrandMark brand={brand} />
        </Link>

        {/* Derecha: acciones */}
        <div className="flex items-center justify-end gap-0.5">
          <Link href="/buscar" aria-label="Buscar" className={cn(ICON_BUTTON, "hidden sm:flex")}>
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/favoritos"
            aria-label={`Favoritos${isHydrated && favoritesCount > 0 ? ` (${favoritesCount})` : ""}`}
            className={cn(ICON_BUTTON, "relative hidden sm:flex")}
          >
            <Heart className="h-5 w-5" />
            {isHydrated && favoritesCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
            ) : null}
          </Link>
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Abrir carrito${isHydrated && totalUnits > 0 ? ` (${totalUnits})` : ""}`}
            className={cn(ICON_BUTTON, "relative -mr-2")}
          >
            <ShoppingBag className="h-5 w-5" />
            {isHydrated && totalUnits > 0 ? (
              <span
                key={totalUnits}
                className="animate-badge-pop absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-contrast tabular-nums shadow-brand"
              >
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
          className="animate-fade-in border-t border-border bg-surface px-[var(--content-padding-x)] py-3 lg:hidden"
        >
          <ul className="flex flex-col gap-0.5">
            {[...NAV_LINKS, { href: "/buscar", label: "Buscar" }, { href: "/favoritos", label: "Favoritos" }].map(
              (link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 text-base font-medium text-text transition-colors hover:bg-surface-sunken"
                  >
                    {link.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
