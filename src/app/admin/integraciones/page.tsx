import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { integrationSettings } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("integrations", "read"); const rows = await (await getRuntimeDb()).select().from(integrationSettings);
  const configured = [
    { id: "runtime-mp", values: ["Mercado Pago (entorno)", process.env.MERCADO_PAGO_ACCESS_TOKEN ? "Credencial presente" : "Sin credenciales", process.env.MERCADO_PAGO_TEST_MODE !== "false" ? "Prueba" : "Producción", "—"] },
    { id: "runtime-meta", values: ["Meta CAPI (entorno)", process.env.META_CONVERSIONS_ACCESS_TOKEN ? "Credencial presente" : "Sin credenciales", "No envía sin autorización", "—"] },
    ...rows.map((r) => ({ id: r.id, values: [r.provider, r.isEnabled ? "Activa" : "Inactiva", r.isTestMode ? "Prueba" : "Producción", r.lastCheckedAt?.toLocaleString("es-CO")] })),
  ];
  return <AdminRecordList title="Integraciones" description="Diagnóstico sin revelar secretos." columns={["Proveedor", "Estado", "Modo", "Última revisión"]} rows={configured} />;
}
