"use client";

import { useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { bulkAdjustInventoryAction, type BulkInventoryAdjustment } from "./actions";

type Row = {
  itemId: string;
  productName: string;
  sku: string;
  quantityOnHand: number;
  available: number;
};

type DraftRow = { type: BulkInventoryAdjustment["type"]; delta: string; reason: string };

const cellInput = "h-8 w-full min-w-0 rounded-md border border-border bg-surface px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring";

/** Edición masiva de inventario (sección 19.4): ajusta varios productos en una sola operación, con la misma tabla compacta que la edición masiva de productos. */
export function BulkInventoryEditor({ rows }: { rows: Row[] }) {
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  const visibleRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es-CO");
    return rows.filter((row) => !normalized || `${row.productName} ${row.sku}`.toLocaleLowerCase("es-CO").includes(normalized));
  }, [query, rows]);

  const draftFor = (itemId: string): DraftRow => drafts[itemId] ?? { type: "manual_adjustment", delta: "", reason: "" };
  const patch = (itemId: string, patch: Partial<DraftRow>) => {
    setDrafts((current) => ({ ...current, [itemId]: { ...draftFor(itemId), ...patch } }));
  };

  const selectedRows = rows.filter((row) => {
    const draft = drafts[row.itemId];
    return draft && draft.delta.trim() !== "" && draft.reason.trim().length >= 5;
  });

  const save = async () => {
    setSaving(true);
    setProgress("");
    setResult({ status: "idle", message: "" });
    const payload: BulkInventoryAdjustment[] = selectedRows.map((row) => ({
      itemId: row.itemId,
      productName: row.productName,
      type: draftFor(row.itemId).type,
      delta: Number(draftFor(row.itemId).delta),
      reason: draftFor(row.itemId).reason.trim(),
    }));
    setProgress(`Guardando ${payload.length} ajuste(s)…`);
    const response = await bulkAdjustInventoryAction(payload);
    setSaving(false);
    setProgress("");
    setResult({ status: response.status === "error" ? "error" : "success", message: response.message });
    if (response.status !== "error") {
      setDrafts({});
      window.location.reload();
    }
  };

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-border bg-surface-raised">
      <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-border bg-surface-raised/95 p-4 backdrop-blur sm:flex-row sm:items-center">
        <div>
          <h2>Ajuste masivo de inventario</h2>
          <p className="mt-1 text-sm text-text-muted">Escribe el ajuste (+/−) y el motivo en cada fila; solo se guardan las filas con ambos campos.</p>
        </div>
        <label className="relative min-w-0 flex-1 sm:max-w-xs sm:ml-auto">
          <span className="sr-only">Buscar producto</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o SKU" className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm" />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving || selectedRows.length === 0}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando…" : `Guardar ${selectedRows.length || ""} ajuste${selectedRows.length === 1 ? "" : "s"}`}
        </button>
      </div>
      {progress ? <p role="status" className="px-4 pt-3 text-sm text-text-muted">{progress}</p> : null}
      {result.status !== "idle" ? (
        <p role={result.status === "error" ? "alert" : "status"} className={`px-4 pt-3 text-sm ${result.status === "error" ? "text-danger" : "text-success"}`}>{result.message}</p>
      ) : null}
      <div className="max-h-[55vh] overflow-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 border-b border-border bg-surface-sunken px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">Producto</th>
              <th className="sticky top-0 z-10 border-b border-border bg-surface-sunken px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-text-subtle">Disponible</th>
              <th className="sticky top-0 z-10 border-b border-border bg-surface-sunken px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">Tipo</th>
              <th className="sticky top-0 z-10 border-b border-border bg-surface-sunken px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">Ajuste</th>
              <th className="sticky top-0 z-10 border-b border-border bg-surface-sunken px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const draft = draftFor(row.itemId);
              const isDraft = draft.delta.trim() !== "" || draft.reason.trim() !== "";
              return (
                <tr key={row.itemId} className={isDraft ? "border-b border-border bg-brand-soft/20" : "border-b border-border hover:bg-surface-sunken/40"}>
                  <td className="px-3 py-1.5">
                    <p className="font-medium">{row.productName}</p>
                    <p className="text-xs text-text-muted">{row.sku}</p>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{row.available}</td>
                  <td className="px-2 py-1.5">
                    <select className={cellInput} value={draft.type} onChange={(event) => patch(row.itemId, { type: event.target.value as BulkInventoryAdjustment["type"] })} aria-label={`Tipo de movimiento para ${row.productName}`}>
                      <option value="restock">Entrada</option>
                      <option value="return">Devolución</option>
                      <option value="manual_adjustment">Ajuste manual</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input className={cellInput} type="number" placeholder="+ / −" value={draft.delta} onChange={(event) => patch(row.itemId, { delta: event.target.value })} aria-label={`Ajuste para ${row.productName}`} />
                  </td>
                  <td className="px-2 py-1.5">
                    <input className={cellInput} placeholder="Motivo verificable" value={draft.reason} onChange={(event) => patch(row.itemId, { reason: event.target.value })} aria-label={`Motivo para ${row.productName}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
