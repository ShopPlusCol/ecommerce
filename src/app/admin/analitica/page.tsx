import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { analyticsEvents } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("dashboard", "read"); const rows = await (await getRuntimeDb()).select().from(analyticsEvents);
  return <AdminRecordList title="Analítica" description="Eventos consentidos; Purchase solo puede originarse en confirmación backend." columns={["Evento", "ID deduplicación", "Valor", "Servidor", "Navegador"]} rows={rows.map((r) => ({ id: r.id, values: [r.eventName, r.eventId, r.value, r.sentToServer ? "Sí" : "No", r.sentToBrowser ? "Sí" : "No"] }))} />;
}
