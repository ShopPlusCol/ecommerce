"use client";

import { type ReactNode, useMemo, useState } from "react";
import { normalize } from "@/domain/services/shipping";

export function FilterableZoneList({
  items,
  placeholder,
  emptyLabel,
}: {
  items: Array<{ id: string; name: string; node: ReactNode }>;
  placeholder: string;
  emptyLabel: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter((item) => normalize(item.name).includes(q));
  }, [items, query]);

  return (
    <div className="grid gap-3">
      {items.length > 8 ? (
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm"
        />
      ) : null}
      {filtered.length > 0 ? (
        <div className="grid gap-3">{filtered.map((item) => <div key={item.id}>{item.node}</div>)}</div>
      ) : (
        <p className="text-sm text-text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}
