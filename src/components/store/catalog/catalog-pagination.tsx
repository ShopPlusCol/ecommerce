"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildCatalogQueryString } from "@/modules/catalog/catalog-params";

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  const hrefFor = (target: number) => `${pathname}${buildCatalogQueryString(searchParams, { pagina: String(target) })}`;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginación" className="mt-8 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} scroll className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong text-text hover:bg-surface-sunken" aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          scroll
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium",
            p === page ? "border-brand bg-brand text-brand-contrast" : "border-border-strong text-text hover:bg-surface-sunken",
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} scroll className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong text-text hover:bg-surface-sunken" aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
