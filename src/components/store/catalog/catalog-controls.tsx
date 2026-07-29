"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Category, ColorFamily } from "@/domain/entities/catalog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SORT_LABELS, buildCatalogQueryString } from "@/modules/catalog/catalog-params";
import type { ProductSort } from "@/application/ports/catalog-repository";

type ActiveFilter = { key: string; label: string };

export function CatalogControls({
  categories,
  colorFamilies,
  total,
  sort,
}: {
  categories: Category[];
  colorFamilies: ColorFamily[];
  total: number;
  sort: ProductSort;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [panelOpen, setPanelOpen] = React.useState(false);

  const update = React.useCallback(
    (changes: Record<string, string | null>) => {
      const qs = buildCatalogQueryString(searchParams, changes);
      router.push(`${pathname}${qs}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const activeFilters: ActiveFilter[] = [];
  const currentCategory = searchParams.get("categoria");
  const currentColor = searchParams.get("color");
  const currentAvailability = searchParams.get("disponibilidad");
  const currentPromo = searchParams.get("promocion");
  const currentSearch = searchParams.get("q");

  if (currentSearch) activeFilters.push({ key: "q", label: `“${currentSearch}”` });
  if (currentCategory) {
    const c = categories.find((cat) => cat.slug === currentCategory);
    if (c) activeFilters.push({ key: "categoria", label: c.name });
  }
  if (currentColor) {
    const f = colorFamilies.find((cf) => cf.slug === currentColor);
    if (f) activeFilters.push({ key: "color", label: f.name });
  }
  if (currentAvailability === "in_stock") activeFilters.push({ key: "disponibilidad", label: "Disponibles" });
  if (currentPromo === "1") activeFilters.push({ key: "promocion", label: "En promoción" });

  const clearAll = () => router.push(pathname, { scroll: false });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <span className="text-sm text-text-muted" aria-live="polite">
            {total} {total === 1 ? "producto" : "productos"}
          </span>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-muted">
          <span className="hidden sm:inline">Ordenar por</span>
          <select
            value={sort}
            onChange={(e) => update({ order: e.target.value })}
            className="h-control-sm rounded-md border border-border-strong bg-surface-raised px-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
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
              className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand hover:bg-accent-rose-soft"
            >
              {filter.label}
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="text-xs font-medium text-text-muted underline hover:text-text">
            Limpiar todo
          </button>
        </div>
      ) : null}

      {panelOpen ? (
        <div className="grid gap-5 rounded-lg border border-border bg-surface-raised p-4 sm:grid-cols-3">
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Categoría</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <FilterToggle
                  key={category.id}
                  active={currentCategory === category.slug}
                  onClick={() => update({ categoria: currentCategory === category.slug ? null : category.slug })}
                >
                  {category.name}
                </FilterToggle>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Familia de color</legend>
            <div className="flex flex-wrap gap-2">
              {colorFamilies.map((family) => (
                <button
                  key={family.id}
                  type="button"
                  onClick={() => update({ color: currentColor === family.slug ? null : family.slug })}
                  aria-pressed={currentColor === family.slug}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                    currentColor === family.slug
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border-strong text-text-muted hover:text-text",
                  )}
                >
                  <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: family.hexSwatch ?? undefined }} />
                  {family.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">Otros</legend>
            <div className="flex flex-wrap gap-2">
              <FilterToggle
                active={currentAvailability === "in_stock"}
                onClick={() => update({ disponibilidad: currentAvailability === "in_stock" ? null : "in_stock" })}
              >
                Solo disponibles
              </FilterToggle>
              <FilterToggle active={currentPromo === "1"} onClick={() => update({ promocion: currentPromo === "1" ? null : "1" })}>
                En promoción
              </FilterToggle>
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}

function FilterToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-brand bg-brand-soft text-brand" : "border-border-strong text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
