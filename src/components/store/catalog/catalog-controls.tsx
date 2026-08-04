"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { CatalogFacets } from "@/modules/catalog/facets";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SORT_LABELS, buildCatalogQueryString } from "@/modules/catalog/catalog-params";
import type { ProductSort } from "@/application/ports/catalog-repository";

type ActiveFilter = { key: string; label: string };

/**
 * Controles del catálogo.
 *
 * Dos cambios de fondo respecto a la versión anterior:
 *
 * - **Solo se ofrecen filtros con resultados.** Las opciones vienen de
 *   `CatalogFacets`, que ya trae el conteo real; antes se listaban todas las
 *   familias y categorías existieran o no productos en ellas, así que la
 *   propia tienda ofrecía filtros que llevaban a un catálogo vacío.
 * - **En móvil los filtros son un panel inferior a pantalla casi completa**,
 *   no un bloque que empuja el contenido, y cada opción es un objetivo
 *   táctil de 44px (antes ~26px).
 */
export function CatalogControls({
  facets,
  total,
  sort,
}: {
  facets: CatalogFacets;
  total: number;
  sort: ProductSort;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [panelOpen, setPanelOpen] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const update = React.useCallback(
    (changes: Record<string, string | null>) => {
      const qs = buildCatalogQueryString(searchParams, changes);
      router.push(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const currentCategory = searchParams.get("categoria");
  const currentColor = searchParams.get("color");
  const currentCollection = searchParams.get("coleccion");
  const currentAvailability = searchParams.get("disponibilidad");
  const currentPromo = searchParams.get("promocion");
  const currentSearch = searchParams.get("q");

  const activeFilters: ActiveFilter[] = [];
  if (currentSearch) activeFilters.push({ key: "q", label: `“${currentSearch}”` });
  const category = facets.categories.find((c) => c.slug === currentCategory);
  if (category) activeFilters.push({ key: "categoria", label: category.name });
  const family = facets.colorFamilies.find((f) => f.slug === currentColor);
  if (family) activeFilters.push({ key: "color", label: family.name });
  const collection = facets.collections.find((c) => c.slug === currentCollection);
  if (collection) activeFilters.push({ key: "coleccion", label: collection.name });
  if (currentAvailability === "in_stock") activeFilters.push({ key: "disponibilidad", label: "Disponibles" });
  if (currentPromo === "1") activeFilters.push({ key: "promocion", label: "En promoción" });

  const clearAll = () => {
    router.push(pathname, { scroll: false });
    setPanelOpen(false);
  };

  // El panel móvil se comporta como diálogo: cierra con Escape y recibe el
  // foco al abrirse.
  React.useEffect(() => {
    if (!panelOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  const hasAnyFilter =
    facets.colorFamilies.length > 0 ||
    facets.categories.length > 0 ||
    facets.collections.length > 0 ||
    facets.inStock > 0 ||
    facets.onPromotion > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {hasAnyFilter ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPanelOpen((open) => !open)}
              aria-expanded={panelOpen}
              aria-controls="catalog-filters"
              className="min-h-11"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtros
              {activeFilters.length > 0 ? (
                <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-semibold text-text-inverted">
                  {activeFilters.length}
                </span>
              ) : null}
            </Button>
          ) : null}
          <span className="text-sm text-text-muted" aria-live="polite">
            {total} {total === 1 ? "producto" : "productos"}
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <span className="hidden sm:inline">Ordenar por</span>
          <select
            value={sort}
            onChange={(event) => update({ order: event.target.value })}
            aria-label="Ordenar productos"
            className="min-h-11 rounded-md border border-border-strong bg-surface-raised px-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            {(Object.keys(SORT_LABELS) as ProductSort[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => update({ [filter.key]: null })}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-medium text-brand hover:bg-accent-rose-soft"
            >
              {filter.label}
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only">Quitar filtro</span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="min-h-9 px-1 text-sm font-medium text-text-muted underline hover:text-text"
          >
            Limpiar todo
          </button>
        </div>
      ) : null}

      {panelOpen ? (
        <>
          {/* Fondo solo en móvil: en escritorio el panel es un bloque normal
              y oscurecer la página no aportaría nada. */}
          <div
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={() => setPanelOpen(false)}
            aria-hidden="true"
          />
          <div
            id="catalog-filters"
            ref={panelRef}
            tabIndex={-1}
            role="group"
            aria-label="Filtros del catálogo"
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-surface-raised p-5 shadow-lg",
              "sm:relative sm:inset-auto sm:z-auto sm:max-h-none sm:rounded-lg sm:border sm:p-4 sm:shadow-none",
            )}
          >
            <div className="mb-4 flex items-center justify-between sm:hidden">
              <h2 className="text-base font-semibold text-text">Filtros</h2>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Cerrar filtros"
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-sunken"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {facets.colorFamilies.length > 0 ? (
                <FilterGroup legend="Familia de color">
                  {facets.colorFamilies.map((option) => (
                    <FilterToggle
                      key={option.slug}
                      active={currentColor === option.slug}
                      onClick={() => update({ color: currentColor === option.slug ? null : option.slug })}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border"
                        style={{ backgroundColor: option.hexSwatch ?? undefined }}
                        aria-hidden="true"
                      />
                      {option.name}
                      <Count value={option.count} />
                    </FilterToggle>
                  ))}
                </FilterGroup>
              ) : null}

              {facets.categories.length > 0 ? (
                <FilterGroup legend="Categoría">
                  {facets.categories.map((option) => (
                    <FilterToggle
                      key={option.slug}
                      active={currentCategory === option.slug}
                      onClick={() => update({ categoria: currentCategory === option.slug ? null : option.slug })}
                    >
                      {option.name}
                      <Count value={option.count} />
                    </FilterToggle>
                  ))}
                </FilterGroup>
              ) : null}

              {facets.collections.length > 0 ? (
                <FilterGroup legend="Colección">
                  {facets.collections.map((option) => (
                    <FilterToggle
                      key={option.slug}
                      active={currentCollection === option.slug}
                      onClick={() => update({ coleccion: currentCollection === option.slug ? null : option.slug })}
                    >
                      {option.name}
                      <Count value={option.count} />
                    </FilterToggle>
                  ))}
                </FilterGroup>
              ) : null}

              {facets.inStock > 0 || facets.onPromotion > 0 ? (
                <FilterGroup legend="Otros">
                  {facets.inStock > 0 ? (
                    <FilterToggle
                      active={currentAvailability === "in_stock"}
                      onClick={() =>
                        update({ disponibilidad: currentAvailability === "in_stock" ? null : "in_stock" })
                      }
                    >
                      Solo disponibles
                      <Count value={facets.inStock} />
                    </FilterToggle>
                  ) : null}
                  {/* Solo si existe al menos una promoción real (precio
                      anterior mayor que el actual). */}
                  {facets.onPromotion > 0 ? (
                    <FilterToggle
                      active={currentPromo === "1"}
                      onClick={() => update({ promocion: currentPromo === "1" ? null : "1" })}
                    >
                      En promoción
                      <Count value={facets.onPromotion} />
                    </FilterToggle>
                  ) : null}
                </FilterGroup>
              ) : null}
            </div>

            <div className="mt-5 flex gap-2 sm:hidden">
              <Button className="flex-1" onClick={() => setPanelOpen(false)}>
                Ver {total} {total === 1 ? "producto" : "productos"}
              </Button>
              {activeFilters.length > 0 ? (
                <Button variant="secondary" onClick={clearAll}>
                  Limpiar
                </Button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FilterGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">{legend}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Count({ value }: { value: number }) {
  return <span className="text-xs text-text-subtle">({value})</span>;
}

function FilterToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      // min-h-11 = 44px, el objetivo táctil mínimo. Antes eran pastillas de
      // ~26px, difíciles de acertar con el pulgar.
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
        active ? "border-brand bg-brand-soft text-brand" : "border-border-strong text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
