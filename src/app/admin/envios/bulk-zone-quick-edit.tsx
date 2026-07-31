"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { bulkUpdateZoneConfigAction, type BulkZoneConfigRow } from "./zone-actions";
import type { ZoneConfigFormProps } from "./zone-config-form";

type RowEdits = Partial<Omit<BulkZoneConfigRow, "zoneId">>;

const cellInput = "h-8 w-full min-w-0 rounded-md border border-border bg-surface px-2 text-sm";
const th = "border-b border-border bg-surface-sunken px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-subtle";

export function BulkZoneQuickEdit({ items, zoneLabel }: { items: ZoneConfigFormProps[]; zoneLabel: string }) {
  const [edits, setEdits] = useState<Record<string, RowEdits>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ status: "idle" | "success" | "error"; message: string }>({ status: "idle", message: "" });

  const dirtyIds = Object.keys(edits).filter((id) => Object.keys(edits[id]).length > 0);

  function patch<K extends keyof RowEdits>(zoneId: string, field: K, value: RowEdits[K]) {
    setEdits((prev) => {
      const rowEdits: RowEdits = { ...prev[zoneId] };
      if (value === undefined) delete rowEdits[field];
      else rowEdits[field] = value;
      const next = { ...prev, [zoneId]: rowEdits };
      if (Object.keys(rowEdits).length === 0) delete next[zoneId];
      return next;
    });
  }

  async function save() {
    const rows: BulkZoneConfigRow[] = dirtyIds.map((zoneId) => ({ zoneId, ...edits[zoneId] }));
    if (rows.length === 0) return;
    setSaving(true);
    setResult({ status: "idle", message: "" });
    const response = await bulkUpdateZoneConfigAction(rows);
    setSaving(false);
    setResult(response);
    if (response.status === "success") {
      setEdits({});
      window.location.reload();
    }
  }

  return (
    <details className="mb-6 rounded-xl border border-border bg-surface-raised">
      <summary className="cursor-pointer p-4 text-sm font-semibold text-brand">Edición rápida masiva ({zoneLabel})</summary>
      <div className="border-t border-border p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-muted">Deja una celda vacía para no tocar ese campo en esa fila.</p>
          <button
            type="button"
            onClick={save}
            disabled={saving || dirtyIds.length === 0}
            className="ml-auto h-9 rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Guardando…" : `Guardar ${dirtyIds.length || ""} cambio(s)`}
          </button>
        </div>
        {result.status !== "idle" ? (
          <p role={result.status === "error" ? "alert" : "status"} className={cn("mb-3 text-sm", result.status === "error" ? "text-danger" : "text-success")}>
            {result.message}
          </p>
        ) : null}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className={th}>Zona</th>
                <th className={th}>Tarifa (COP)</th>
                <th className={th}>Cobertura</th>
                <th className={th}>Días hábiles mín.</th>
                <th className={th}>Días hábiles máx.</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const rowEdits = edits[item.zoneId] ?? {};
                const isDirty = Object.keys(rowEdits).length > 0;
                return (
                  <tr key={item.zoneId} className={cn("border-b border-border align-middle", isDirty ? "bg-brand-soft/25" : "")}>
                    <td className="px-3 py-1.5 font-medium">{item.name}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        value={rowEdits.fee ?? ""}
                        onChange={(event) => patch(item.zoneId, "fee", event.target.value ? Number(event.target.value) : undefined)}
                        placeholder={item.fee.effective !== null ? String(item.fee.effective) : "—"}
                        aria-label={`Tarifa de ${item.name}`}
                        className={cn(cellInput, "w-28")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={rowEdits.coverage ?? ""}
                        onChange={(event) => patch(item.zoneId, "coverage", (event.target.value || undefined) as "available" | "unavailable" | undefined)}
                        aria-label={`Cobertura de ${item.name}`}
                        className={cellInput}
                      >
                        <option value="">Sin cambios ({item.coverage.effective === "unavailable" ? "sin cobertura" : "con cobertura"})</option>
                        <option value="available">Con cobertura</option>
                        <option value="unavailable">Sin cobertura</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        value={rowEdits.estimatedBusinessDaysMin ?? ""}
                        onChange={(event) => patch(item.zoneId, "estimatedBusinessDaysMin", event.target.value ? Number(event.target.value) : undefined)}
                        placeholder={item.estimatedBusinessDaysMin.effective !== null ? String(item.estimatedBusinessDaysMin.effective) : "—"}
                        aria-label={`Días hábiles mínimos de ${item.name}`}
                        className={cn(cellInput, "w-20")}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        min={0}
                        value={rowEdits.estimatedBusinessDaysMax ?? ""}
                        onChange={(event) => patch(item.zoneId, "estimatedBusinessDaysMax", event.target.value ? Number(event.target.value) : undefined)}
                        placeholder={item.estimatedBusinessDaysMax.effective !== null ? String(item.estimatedBusinessDaysMax.effective) : "—"}
                        aria-label={`Días hábiles máximos de ${item.name}`}
                        className={cn(cellInput, "w-20")}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}
