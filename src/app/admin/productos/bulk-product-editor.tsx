"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, PackageX, Save, Search, SquarePen, Star } from "lucide-react";
import { AdminMediaUrlField } from "@/components/admin/admin-media-url-field";
import { chipVariants } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import type { BulkProductUpdate } from "@/modules/catalog/bulk-editor";
import { bulkUpdateProductsAction } from "./bulk-actions";

type Option = { id: string; name: string };
type EditableProduct = BulkProductUpdate;

const cellInput = "h-8 w-full min-w-0 rounded-md border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";
const th = "sticky top-0 z-10 whitespace-nowrap border-b border-border bg-surface-sunken px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle";

export function BulkProductEditor({
  initialRows,
  categories,
  colorFamilies,
  media,
}: {
  initialRows: EditableProduct[];
  categories: Option[];
  colorFamilies: Option[];
  media: Array<{ url: string; label: string }>;
}) {
  const [rows, setRows] = useState(initialRows);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({
    status: "idle",
    message: "",
  });

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-CO");
    return rows.filter((row) =>
      !normalized || [row.name, row.sku, row.slug].some((value) => value.toLocaleLowerCase("es-CO").includes(normalized)),
    );
  }, [query, rows]);
  const expandedRow = rows.find((row) => row.id === expanded) ?? null;

  const patchRow = (id: string, patch: Partial<EditableProduct>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
    setSelected((current) => new Set(current).add(id));
  };

  const toggleRow = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.id));
  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      for (const row of visibleRows) {
        if (allVisibleSelected) next.delete(row.id);
        else next.add(row.id);
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setProgress("");
    setResult({ status: "idle", message: "" });
    const selectedRows = rows.filter((row) => selected.has(row.id));
    const errors: string[] = [];
    let saved = 0;
    for (let offset = 0; offset < selectedRows.length; offset += 100) {
      const batch = selectedRows.slice(offset, offset + 100);
      setProgress(`Guardando ${Math.min(offset + batch.length, selectedRows.length)} de ${selectedRows.length}…`);
      const response = await bulkUpdateProductsAction(batch);
      if (response.status === "success") saved += batch.length;
      else errors.push(response.message);
    }
    setSaving(false);
    setProgress("");
    if (errors.length) {
      setResult({
        status: "error",
        message: `${saved} producto(s) guardado(s). Revisa los bloques con conflicto: ${errors.join(" ")}`,
      });
    } else {
      setResult({ status: "success", message: `${saved} producto(s) actualizados correctamente.` });
      setSelected(new Set());
      window.location.reload();
    }
  };

  return (
    <div className="grid gap-3">
      <div className="sticky top-0 z-30 flex flex-col gap-3 rounded-xl border border-border bg-surface-raised/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar productos para editar</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, SKU o slug"
            className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm"
          />
        </label>
        <p className="whitespace-nowrap text-sm text-text-muted">
          {visibleRows.length} de {rows.length} productos · {selected.size} seleccionado{selected.size === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={save}
          disabled={saving || selected.size === 0}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : `Guardar ${selected.size || ""} seleccionado${selected.size === 1 ? "" : "s"}`}
        </button>
      </div>
      {result.status !== "idle" ? (
        <p role={result.status === "error" ? "alert" : "status"} className={`text-sm ${result.status === "error" ? "text-danger" : "text-success"}`}>{result.message}</p>
      ) : null}
      {progress ? <p role="status" className="text-sm text-text-muted">{progress}</p> : null}

      {visibleRows.length ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-raised">
          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[1240px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className={cn(th, "sticky left-0 z-20 w-10")}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAllVisible}
                      aria-label="Seleccionar todos los productos visibles"
                      className="h-4 w-4 accent-brand"
                    />
                  </th>
                  <th className={cn(th, "w-14")}>Imagen</th>
                  <th className={cn(th, "min-w-[220px]")}>Producto</th>
                  <th className={cn(th, "min-w-[140px]")}>SKU</th>
                  <th className={cn(th, "min-w-[120px]")}>Estado</th>
                  <th className={cn(th, "min-w-[120px]")}>Precio</th>
                  <th className={cn(th, "min-w-[130px]")}>Comparativo</th>
                  <th className={cn(th, "min-w-[150px]")}>Familia de color</th>
                  <th className={cn(th, "min-w-[110px]")} title="Cantidad disponible mínima antes de avisar stock bajo">Alerta stock</th>
                  <th className={cn(th, "w-12 text-center")} title="Producto destacado en la tienda">
                    <Star className="mx-auto h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Destacado</span>
                  </th>
                  <th className={cn(th, "w-12 text-center")} title="Permitir venta sin existencias disponibles">
                    <PackageX className="mx-auto h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">Permitir venta sin stock</span>
                  </th>
                  <th className={cn(th, "w-24 text-right")}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isSelected = selected.has(row.id);
                  const isExpanded = expanded === row.id;
                  return (
                    <tr key={row.id} className={cn("border-b border-border align-middle", isSelected ? "bg-brand-soft/25" : "hover:bg-surface-sunken/40")}>
                        <td className={cn("sticky left-0 z-[5] border-b border-border px-3 py-1.5", isSelected ? "bg-brand-soft/25" : "bg-surface-raised")}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleRow(row.id)} aria-label={`Seleccionar ${row.name}`} className="h-4 w-4 accent-brand" />
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setExpanded(isExpanded ? null : row.id)}
                            className="block h-10 w-10 overflow-hidden rounded-md border border-border bg-surface-sunken"
                            aria-label={`Ver imagen y más campos de ${row.name}`}
                            title="Ver imagen, descripción y categorías"
                          >
                            {row.imageUrl ? (
                              <Image src={row.imageUrl} alt="" width={40} height={40} unoptimized className="h-10 w-10 object-cover" />
                            ) : (
                              <span className="grid h-full w-full place-items-center text-[10px] text-text-subtle">Sin foto</span>
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-1.5"><input className={cellInput} value={row.name} onChange={(event) => patchRow(row.id, { name: event.target.value })} aria-label={`Nombre de ${row.name}`} /></td>
                        <td className="px-2 py-1.5"><input className={cellInput} value={row.sku} onChange={(event) => patchRow(row.id, { sku: event.target.value })} aria-label={`SKU de ${row.name}`} /></td>
                        <td className="px-2 py-1.5">
                          <select className={cellInput} value={row.status} onChange={(event) => patchRow(row.id, { status: event.target.value as EditableProduct["status"] })} aria-label={`Estado de ${row.name}`}>
                            <option value="draft">Borrador</option>
                            <option value="active">Activo</option>
                            <option value="archived">Archivado</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5"><input className={cellInput} type="number" min="0" value={row.price} onChange={(event) => patchRow(row.id, { price: Number(event.target.value) })} aria-label={`Precio de ${row.name}`} /></td>
                        <td className="px-2 py-1.5"><input className={cellInput} type="number" min="0" value={row.compareAtPrice ?? ""} onChange={(event) => patchRow(row.id, { compareAtPrice: event.target.value ? Number(event.target.value) : null })} aria-label={`Precio comparativo de ${row.name}`} /></td>
                        <td className="px-2 py-1.5">
                          <select className={cellInput} value={row.colorFamilyId ?? ""} onChange={(event) => patchRow(row.id, { colorFamilyId: event.target.value || null })} aria-label={`Familia de color de ${row.name}`}>
                            <option value="">Sin familia</option>
                            {colorFamilies.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5"><input className={cellInput} type="number" min="0" value={row.lowStockThreshold} onChange={(event) => patchRow(row.id, { lowStockThreshold: Number(event.target.value) })} aria-label={`Alerta de stock de ${row.name}`} /></td>
                        <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={row.featured} onChange={(event) => patchRow(row.id, { featured: event.target.checked })} aria-label={`Marcar ${row.name} como destacado`} className="h-4 w-4 accent-brand" /></td>
                        <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={row.allowBackorder} onChange={(event) => patchRow(row.id, { allowBackorder: event.target.checked })} aria-label={`Permitir venta sin stock de ${row.name}`} className="h-4 w-4 accent-brand" /></td>
                        <td className="px-2 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setExpanded(isExpanded ? null : row.id)} className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold" aria-expanded={isExpanded}>
                              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                              Más
                            </button>
                            <Link href={`/admin/productos/${row.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-text-muted" aria-label={`Abrir edición completa de ${row.name}`} title="Edición completa">
                              <SquarePen className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {expandedRow ? (
            <div className="border-t border-border bg-surface-sunken/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Más detalles de {expandedRow.name}</p>
                <button type="button" onClick={() => setExpanded(null)} className="text-xs font-semibold text-text-muted hover:text-text">Cerrar</button>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_320px]">
                <label className="grid gap-1 text-xs font-semibold text-text-muted">
                  Slug
                  <input className={cellInput} value={expandedRow.slug} onChange={(event) => patchRow(expandedRow.id, { slug: event.target.value })} />
                </label>
                <label className="grid gap-1 text-xs font-semibold text-text-muted lg:col-span-1">
                  Descripción corta
                  <textarea
                    className="min-h-20 rounded-md border border-border bg-surface p-2 text-sm font-normal"
                    maxLength={240}
                    value={expandedRow.shortDescription}
                    onChange={(event) => patchRow(expandedRow.id, { shortDescription: event.target.value })}
                  />
                </label>
                <div className="lg:row-span-2">
                  <AdminMediaUrlField name={undefined} label="Imagen principal" value={expandedRow.imageUrl} assets={media} onChange={(imageUrl) => patchRow(expandedRow.id, { imageUrl, imageAlt: expandedRow.imageAlt || expandedRow.name })} />
                </div>
                <div className="grid gap-1.5 text-xs font-semibold text-text-muted lg:col-span-2">
                  Categorías
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((category) => {
                      const checked = expandedRow.categoryIds.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            patchRow(expandedRow.id, {
                              categoryIds: checked
                                ? expandedRow.categoryIds.filter((id) => id !== category.id)
                                : [...expandedRow.categoryIds, category.id],
                            })
                          }
                          aria-pressed={checked}
                          className={cn(chipVariants({ variant: checked ? "brand" : "neutral" }), "cursor-pointer font-normal transition-colors")}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h2 className="font-semibold">No hay productos que coincidan</h2>
          <p className="mt-1 text-sm text-text-muted">Prueba otro nombre, SKU o slug.</p>
        </div>
      )}
    </div>
  );
}
