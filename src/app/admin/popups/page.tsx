import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { popups } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("promotions", "read"); const rows = await (await getRuntimeDb()).select().from(popups);
  return <AdminRecordList title="Pop-ups" description="Segmentación, frecuencia y publicación reales." columns={["Nombre", "Frecuencia", "Prioridad", "Estado"]} rows={rows.map((r) => ({ id: r.id, values: [r.name, r.frequency, r.priority, r.status] }))} />;
}
