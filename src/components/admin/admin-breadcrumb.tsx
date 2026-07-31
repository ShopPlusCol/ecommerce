import Link from "next/link";

export type AdminBreadcrumbItem = {
  label: string;
  href?: string;
};

export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }) {
  return (
    <nav aria-label="Ruta de navegación" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden className="text-text-muted/50">
              ›
            </span>
          ) : null}
          {item.href ? (
            <Link href={item.href} className="text-text-muted transition hover:text-brand hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-text">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
