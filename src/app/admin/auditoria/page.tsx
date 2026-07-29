import { desc } from "drizzle-orm";
import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("audit", "read"); const rows = await (await getRuntimeDb()).select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  return <AdminRecordList title="Auditoría" description="Últimas 200 operaciones sensibles, sin secretos." columns={["Fecha", "Acción", "Entidad", "Usuario", "Motivo"]} rows={rows.map((r) => ({ id: r.id, values: [r.createdAt.toLocaleString("es-CO"), r.action, `${r.entityType}:${r.entityId}`, r.userId, r.reason] }))} />;
}
