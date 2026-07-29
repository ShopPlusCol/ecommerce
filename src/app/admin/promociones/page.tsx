import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { promotions } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("promotions", "read"); const rows = await (await getRuntimeDb()).select().from(promotions);
  return <AdminRecordList title="Promociones" description="Campañas y vigencias persistidas." columns={["Nombre", "Inicio", "Fin", "Estado"]} rows={rows.map((r) => ({ id: r.id, values: [r.name, r.startsAt?.toLocaleDateString("es-CO"), r.endsAt?.toLocaleDateString("es-CO"), r.status] }))} />;
}
