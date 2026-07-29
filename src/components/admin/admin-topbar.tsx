import { Search, UserCircle } from "lucide-react";

export function AdminTopbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface-raised px-6">
      <div className="flex items-center gap-2 text-text-subtle">
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm">Buscar pedidos, productos, clientes… (Fase 3)</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <UserCircle className="h-6 w-6" aria-hidden="true" />
        <span>Propietario</span>
      </div>
    </header>
  );
}
