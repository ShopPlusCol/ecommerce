"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckSquare, Save, Search, Square } from "lucide-react";
import { AdminMediaUrlField } from "@/components/admin/admin-media-url-field";
import type { BulkProductUpdate } from "@/modules/catalog/bulk-editor";
import { bulkUpdateProductsAction } from "./bulk-actions";

type Option = { id: string; name: string };
type EditableProduct = BulkProductUpdate;

const input = "h-10 min-w-0 rounded-md border border-border bg-surface px-3 text-sm";

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

  const patchRow = (id: string, patch: Partial<EditableProduct>) => {
    setRows((current) => current.map((row) => row.id === id ? { ...row, ...patch } : row));
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
    <div className="grid gap-4">
      <div className="sticky top-0 z-20 grid gap-3 rounded-xl border border-border bg-surface-raised/95 p-4 shadow-sm backdrop-blur md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
        <label className="relative">
          <span className="sr-only">Buscar productos para editar</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, SKU o slug" className={`${input} w-full pl-9`} />
        </label>
        <button
          type="button"
          onClick={() => {
            setSelected((current) => {
              const next = new Set(current);
              for (const row of visibleRows) {
                if (allVisibleSelected) next.delete(row.id);
                else next.add(row.id);
              }
              return next;
            });
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold"
        >
          {allVisibleSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          {allVisibleSelected ? "Quitar visibles" : "Seleccionar visibles"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || selected.size === 0}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : `Guardar ${selected.size || ""} seleccionado${selected.size === 1 ? "" : "s"}`}
        </button>
        {result.status !== "idle" ? (
          <p role={result.status === "error" ? "alert" : "status"} className={`text-sm md:col-span-3 ${result.status === "error" ? "text-danger" : "text-success"}`}>{result.message}</p>
        ) : null}
        {progress ? <p role="status" className="text-sm text-text-muted md:col-span-3">{progress}</p> : null}
      </div>

      <p className="text-sm text-text-muted">
        Se muestran los {rows.length} productos sin un límite artificial. Los cambios solo se guardan en las filas seleccionadas.
      </p>
      {visibleRows.length ? visibleRows.map((row) => (
        <article key={row.id} className={`grid gap-4 rounded-xl border p-4 transition-colors ${selected.has(row.id) ? "border-brand bg-brand-soft/30" : "border-border bg-surface-raised"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-3 font-semibold">
              <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="h-5 w-5 accent-brand" />
              {row.name}
            </label>
            <Link href={`/admin/productos/${row.id}`} className="text-sm font-semibold text-brand hover:underline">Abrir edición completa</Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1 text-sm font-semibold">Nombre<input className={input} value={row.name} onChange={(event) => patchRow(row.id, { name: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">Slug<input className={input} value={row.slug} onChange={(event) => patchRow(row.id, { slug: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">SKU<input className={input} value={row.sku} onChange={(event) => patchRow(row.id, { sku: event.target.value })} /></label>
            <label className="grid gap-1 text-sm font-semibold">Estado<select className={input} value={row.status} onChange={(event) => patchRow(row.id, { status: event.target.value as EditableProduct["status"] })}><option value="draft">Borrador</option><option value="active">Activo</option><option value="archived">Archivado</option></select></label>
            <label className="grid gap-1 text-sm font-semibold">Precio<input className={input} type="number" min="0" value={row.price} onChange={(event) => patchRow(row.id, { price: Number(event.target.value) })} /></label>
            <label className="grid gap-1 text-sm font-semibold">Precio comparativo<input className={input} type="number" min="0" value={row.compareAtPrice ?? ""} onChange={(event) => patchRow(row.id, { compareAtPrice: event.target.value ? Number(event.target.value) : null })} /></label>
            <label className="grid gap-1 text-sm font-semibold">Familia de color<select className={input} value={row.colorFamilyId ?? ""} onChange={(event) => patchRow(row.id, { colorFamilyId: event.target.value || null })}><option value="">Sin familia</option>{colorFamilies.map((family) => <option key={family.id} value={family.id}>{family.name}</option>)}</select></label>
            <label className="grid gap-1 text-sm font-semibold">Alerta de stock<input className={input} type="number" min="0" value={row.lowStockThreshold} onChange={(event) => patchRow(row.id, { lowStockThreshold: Number(event.target.value) })} /></label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">Categorías<select multiple className="min-h-28 rounded-md border border-border bg-surface p-2 font-normal" value={row.categoryIds} onChange={(event) => patchRow(row.id, { categoryIds: [...event.target.selectedOptions].map((option) => option.value) })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><span className="text-xs font-normal text-text-muted">Mantén Ctrl o Cmd para elegir varias.</span></label>
            <label className="grid gap-1 text-sm font-semibold md:col-span-2">Descripción corta<textarea className="min-h-28 rounded-md border border-border bg-surface p-3 font-normal" maxLength={240} value={row.shortDescription} onChange={(event) => patchRow(row.id, { shortDescription: event.target.value })} /></label>
            <div className="md:col-span-2 xl:col-span-4">
              <AdminMediaUrlField name={undefined} label="Imagen principal" value={row.imageUrl} assets={media} onChange={(imageUrl) => patchRow(row.id, { imageUrl, imageAlt: row.imageAlt || row.name })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={row.featured} onChange={(event) => patchRow(row.id, { featured: event.target.checked })} className="h-4 w-4 accent-brand" />Producto destacado</label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={row.allowBackorder} onChange={(event) => patchRow(row.id, { allowBackorder: event.target.checked })} className="h-4 w-4 accent-brand" />Permitir venta sin existencias</label>
          </div>
        </article>
      )) : (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <h2 className="font-semibold">No hay productos que coincidan</h2>
          <p className="mt-1 text-sm text-text-muted">Prueba otro nombre, SKU o slug.</p>
        </div>
      )}
    </div>
  );
}
