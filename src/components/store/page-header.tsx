import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";

export type Breadcrumb = { href: string; label: string };

export function PageHeader({
  title,
  description,
  breadcrumbs,
}: {
  title?: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
}) {
  return (
    <div className="border-b border-border bg-surface-raised py-8">
      <Container>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Migas de pan" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-text-muted">
            <Link href="/" className="hover:text-text">
              Inicio
            </Link>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <Link href={crumb.href} className="hover:text-text">
                  {crumb.label}
                </Link>
              </span>
            ))}
          </nav>
        ) : null}
        {title ? <h1 className="text-2xl text-text">{title}</h1> : null}
        {description ? <p className="mt-2 max-w-prose text-text-muted">{description}</p> : null}
      </Container>
    </div>
  );
}
