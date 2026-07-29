import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getSystemStatus } from "@/modules/observability/system-status";

export const metadata: Metadata = { title: "Estado del sistema" };

export default async function SystemStatusPage() {
  await requirePermission("settings", "read");
  const status = await getSystemStatus();
  const checks = [
    ["Aplicación", status.checks.application],
    ["Base de datos", status.checks.database],
    ["Migraciones", status.checks.migrations],
    ["Almacenamiento", status.checks.storage],
    ["Autenticación", status.checks.authentication],
    ["Backups", status.checks.backups],
    ["Cloudflare", status.checks.cloudflare],
  ] as const;
  const integrations: Array<[string, boolean, string]> = [
    ["Mercado Pago", status.external.mercadoPago.configured, status.external.mercadoPago.testMode ? "Prueba" : "Producción"],
    ["Meta", status.external.meta.configured, status.external.meta.enabled ? "Activa" : "Inactiva"],
    ["SMTP", status.external.smtp.configured, "Configuración local"],
    ["R2", status.external.r2.configured, status.runtime.storage],
    ["D1", status.external.d1.configured, status.runtime.target],
    ["Worker", status.external.worker.configured, status.runtime.target],
  ];
  return <><AdminPageHeader title="Estado del sistema" description={`Diagnóstico seguro · última comprobación ${new Date(status.checkedAt).toLocaleString("es-CO")}`} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{checks.map(([name, check]) => <article key={name} className="rounded-xl border border-border bg-surface-raised p-5"><div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{name}</h2><span className={`rounded-full px-2 py-1 text-xs font-semibold ${check.status === "ok" ? "bg-success/10 text-success" : check.status === "warning" ? "bg-warning/10 text-warning" : "bg-info-soft text-info"}`}>{check.status === "ok" ? "Correcto" : check.status === "warning" ? "Atención" : "Pendiente"}</span></div><p className="mt-3 text-sm text-text-muted">{check.detail}</p></article>)}</div><section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface-raised"><div className="border-b border-border p-5"><h2 className="text-lg font-semibold">Servicios externos</h2><p className="mt-1 text-sm text-text-muted">“Configurado” significa que existen variables o bindings; no implica una prueba externa exitosa.</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3">Servicio</th><th className="p-3">Configuración</th><th className="p-3">Modo</th><th className="p-3">Diagnóstico</th></tr></thead><tbody>{integrations.map(([name, configured, mode]) => <tr key={name} className="border-b border-border/70"><td className="p-3 font-semibold">{name}</td><td className="p-3">{configured ? "Variables presentes" : "Pendiente"}</td><td className="p-3">{mode}</td><td className="p-3">{configured ? "Sin prueba externa en esta sesión" : "Requiere configuración autorizada"}</td></tr>)}</tbody></table></div></section><section className="mt-6 rounded-xl border border-info/30 bg-info-soft p-4 text-sm"><strong>Entorno:</strong> {status.runtime.target} · <strong>revisión:</strong> {status.runtime.revision} · <strong>mantenimiento:</strong> {status.runtime.maintenance ? "activo" : "inactivo"}. No se muestran valores de credenciales.</section></>;
}
