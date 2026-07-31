"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { searchZonesAction, type ZoneSearchResult } from "./zone-actions";

export function ZoneSearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ZoneSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mb-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            setResults(await searchZonesAction(query));
            setSearched(true);
          });
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar zona por nombre (departamento, ciudad o barrio)…"
          className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm"
        />
        <button disabled={pending} className="h-10 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60">
          {pending ? "Buscando…" : "Buscar"}
        </button>
      </form>
      {searched ? (
        results.length > 0 ? (
          <ul className="mt-2 grid gap-1 rounded-lg border border-border bg-surface-raised p-2">
            {results.map((result) => (
              <li key={result.id}>
                <Link href={result.href} className="block rounded px-2 py-1.5 text-sm transition hover:bg-surface-sunken">
                  <span className="font-medium">{result.name}</span>
                  <span className="ml-2 text-xs text-text-muted">{result.path}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-text-muted">Sin resultados para “{query}”.</p>
        )
      ) : null}
    </div>
  );
}
