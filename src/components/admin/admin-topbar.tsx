import { Menu, Search, UserCircle } from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

export function AdminTopbar({
  name,
  onOpenNavigation,
}: {
  name: string;
  onOpenNavigation: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-surface-raised/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-border lg:hidden"
        onClick={onOpenNavigation}
        aria-label="Abrir navegación"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      <form action="/admin/buscar" className="relative min-w-0 flex-1 lg:max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
        <label htmlFor="admin-global-search" className="sr-only">Buscar en el administrador</label>
        <input
          id="admin-global-search"
          name="q"
          type="search"
          minLength={2}
          placeholder="Buscar pedidos, productos o clientes"
          className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-subtle"
        />
      </form>
      <div className="ml-auto flex shrink-0 items-center gap-2 text-sm text-text-muted">
        <UserCircle className="h-6 w-6" aria-hidden="true" />
        <span className="hidden max-w-36 truncate sm:inline">{name}</span>
        <AdminLogoutButton />
      </div>
    </header>
  );
}
