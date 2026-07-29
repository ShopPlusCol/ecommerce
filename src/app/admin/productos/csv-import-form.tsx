"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importProductsCsvAction, type ImportState } from "./csv-actions";
const INITIAL: ImportState = { accepted: 0, rejected: [] };
export function CsvImportForm() {
  const [state, action, pending] = useActionState(importProductsCsvAction, INITIAL);
  return <form action={action} className="mb-6 rounded-lg border border-border bg-surface-raised p-4">
    <div className="flex flex-wrap items-center gap-3"><input type="file" name="file" accept=".csv,text/csv" required /><button disabled={pending} className="rounded border px-3 py-2">{pending ? "Validando…" : "Validar e importar CSV"}</button><Link href="/api/admin/exports/products" className="rounded border px-3 py-2">Exportar CSV</Link></div>
    {state.error ? <p className="mt-2 text-sm text-error">{state.error}</p> : null}
    {state.accepted || state.rejected.length ? <p className="mt-2 text-sm">Aceptadas: {state.accepted}. Rechazadas: {state.rejected.length}.</p> : null}
    {state.rejected.length ? <ul className="mt-2 text-xs text-error">{state.rejected.slice(0, 20).map((row) => <li key={`${row.row}-${row.reason}`}>Fila {row.row}: {row.reason}</li>)}</ul> : null}
  </form>;
}
