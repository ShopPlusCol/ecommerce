import { ShieldAlert } from "lucide-react";
import type { EnvironmentInfo } from "@/modules/settings/environment";

/**
 * Aviso de entorno en el panel. Solo aparece fuera de producción.
 *
 * Antes este componente avisaba de que el panel no tenía autenticación —
 * cierto en una fase antigua, falso desde hace tiempo, y además no estaba
 * montado en ningún sitio. Ahora cumple la función que sí hace falta: que
 * quien valida sepa, en cada pantalla, que lo que está haciendo no es real.
 */
export function AdminEnvironmentBanner({ info }: { info: EnvironmentInfo }) {
  if (!info.isTestEnvironment) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-warning/30 bg-warning-soft px-6 py-2 text-xs text-warning"
    >
      <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="font-semibold uppercase tracking-wide">{info.label}</span>
      <span className="text-warning/90">{info.description}</span>
    </div>
  );
}
