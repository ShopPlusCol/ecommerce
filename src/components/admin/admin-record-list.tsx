"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Search } from "lucide-react";
import { AdminPageHeader } from "./admin-page-header";

type AdminRecordRow = {
  id: string;
  values: Array<string | number | null | undefined>;
  href?: string;
};

const PAGE_SIZE = 20;

export function AdminRecordList({
  title,
  description,
  columns,
  rows,
  actions,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: AdminRecordRow[];
  actions?: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [ascending, setAscending] = useState(true);
  const [page, setPage] = useState(1);
  const normalized = query.trim().toLocaleLowerCase("es-CO");
  const filtered = useMemo(
    () =>
      rows
        .filter((row) => !normalized || row.values.some((value) => String(value ?? "").toLocaleLowerCase("es-CO").includes(normalized)))
        .toSorted((left, right) => {
          const comparison = String(left.values[0] ?? "").localeCompare(String(right.values[0] ?? ""), "es-CO", {
            numeric: true,
          });
          return ascending ? comparison : -comparison;
        }),
    [ascending, normalized, rows],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      <AdminPageHeader title={title} description={description} actions={actions} />
      <div className="rounded-lg border border-border bg-surface-raised">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
            <label htmlFor={`filter-${title}`} className="sr-only">Filtrar {title}</label>
            <input
              id={`filter-${title}`}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder={`Filtrar ${title.toLocaleLowerCase("es-CO")}`}
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setAscending((value) => !value)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium"
          >
            {ascending ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
            Ordenar
          </button>
        </div>
        {visibleRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-sunken/60 text-left">
                  {columns.map((column) => <th key={column} scope="col" className="p-3 font-semibold">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-sunken/40">
                    {row.values.map((value, index) => (
                      <td key={`${row.id}-${columns[index]}`} className="p-3">
                        {index === 0 && row.href ? (
                          <Link href={row.href} className="font-semibold text-brand hover:underline">{value ?? "—"}</Link>
                        ) : value ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-10 text-center text-sm text-text-muted">
            {rows.length ? "No hay coincidencias con el filtro." : "No hay registros todavía."}
          </p>
        )}
        {filtered.length > PAGE_SIZE ? (
          <div className="flex items-center justify-between border-t border-border p-3 text-sm">
            <span className="text-text-muted">Página {safePage} de {pageCount}</span>
            <div className="flex gap-2">
              <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => value - 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Anterior</button>
              <button type="button" disabled={safePage === pageCount} onClick={() => setPage((value) => value + 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
