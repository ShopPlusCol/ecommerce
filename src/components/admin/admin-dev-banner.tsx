import { ShieldAlert } from "lucide-react";

/**
 * Aviso honesto: la autenticación y el control de roles del panel llegan en
 * la Fase 3 (sección 30). Mientras tanto, este scaffold es solo para
 * revisión interna y no debe desplegarse accesible públicamente.
 */
export function AdminDevBanner() {
  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning-soft px-6 py-2 text-xs text-warning">
      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        Vista de desarrollo sin autenticación todavía — el inicio de sesión y los roles se
        conectan en la Fase 3.
      </span>
    </div>
  );
}
