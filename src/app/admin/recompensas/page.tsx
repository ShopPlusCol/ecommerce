import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { rewardRules } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("promotions", "read"); const rows = await (await getRuntimeDb()).select().from(rewardRules);
  return <AdminRecordList title="Recompensas" description="Metas y beneficios persistidos." columns={["Nombre", "Condición", "Meta", "Beneficio", "Estado"]} rows={rows.map((r) => ({ id: r.id, values: [r.name, r.conditionType, r.targetValue, r.rewardType, r.status] }))} />;
}
