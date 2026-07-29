import { LogOut, Search, UserCircle } from "lucide-react";
import { logoutAction } from "@/app/acceso-admin/actions";

export function AdminTopbar({ name }: { name: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface-raised px-6">
      <div className="flex items-center gap-2 text-text-subtle">
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm">Buscar pedidos, productos, clientes… (Fase 3)</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <UserCircle className="h-6 w-6" aria-hidden="true" />
        <span>{name}</span>
        <form action={logoutAction}>
          <button type="submit" className="rounded-md p-2 hover:bg-surface-sunken" aria-label="Cerrar sesión">
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </header>
  );
}
