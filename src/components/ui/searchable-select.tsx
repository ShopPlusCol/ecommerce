"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
  error,
  emptyLabel = "Sin resultados.",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  emptyLabel?: string;
}) {
  const id = React.useId();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState(value);
  const [highlighted, setHighlighted] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza el texto visible con `value` cuando cambia desde fuera (p. ej. al resetear el formulario)
    setQuery(value);
  }, [value]);

  React.useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es-CO");
    if (!q || q === value.toLocaleLowerCase("es-CO")) return options;
    return options.filter((option) => option.toLocaleLowerCase("es-CO").includes(q));
  }, [options, query, value]);

  function select(option: string) {
    onChange(option);
    setQuery(option);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label htmlFor={id} className="text-sm font-medium text-text">
        {label}
        {required ? <span className="text-brand"> *</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={Boolean(error) || undefined}
          value={query}
          placeholder={placeholder ?? "Escribe para buscar…"}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setHighlighted(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlighted((h) => Math.max(h - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (filtered[highlighted]) select(filtered[highlighted]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          onBlur={() => {
            if (!options.includes(query)) setQuery(value);
          }}
          className={cn(
            "h-control-md w-full rounded-md border border-border-strong bg-surface-raised px-3 text-base text-text placeholder:text-text-subtle",
            "transition-colors duration-fast ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:opacity-50",
            error && "border-danger",
          )}
        />
        {open && !disabled ? (
          <ul
            id={`${id}-listbox`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface-raised shadow-lg"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-text-muted">{emptyLabel}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option}
                  role="option"
                  aria-selected={option === value}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(option);
                  }}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm",
                    index === highlighted ? "bg-brand-soft text-brand" : "text-text hover:bg-surface-sunken",
                  )}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
