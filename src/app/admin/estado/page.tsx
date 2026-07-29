import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getSystemStatus } from "@/modules/observability/system-status";

export const metadata: Metadata = { title: "Estado del sistema" };

export default async function SystemStatusPage() {
  await requirePermission("settings", "read");
  const status = await getSystemStatus();
  const integrations = [
    ["Mercado Pago", status.external.mercadoPago.configured ? "Configurado" : "Pendiente", status.external.mercadoPago.testMode ? "Prueba" : "Producción"],
    ["Meta", status.external.meta.configured ? "Configurado" : "Pendiente", status.external.meta.enabled ? "Activa" : "Inactiva"],
    ["SMTP", status.external.smtp.configured ? "Configurado" : "Pendiente", "—"],
  ];
  return (
    <>
      <AdminPageHeader title="Estado del sistema" description={`Última comprobación: ${new Date(status.checkedAt).toLocaleString("es-CO")}`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Base de datos", `${status.database.latencyMs} ms`],
          ["Entorno", status.runtime.target],
          ["Almacenamiento", status.runtime.storage],
          ["Revisión", status.runtime.revision],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-surface-raised p-4">
            <p className="text-sm text-text-muted">{label}</p>
            <p className="mt-2 text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface-raised">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-3">Integración</th><th>Credencial</th><th>Modo</th></tr></thead>
          <tbody>{integrations.map(([name, configured, mode]) => (
            <tr key={name} className="border-b border-border"><td className="p-3 font-medium">{name}</td><td>{configured}</td><td>{mode}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}
