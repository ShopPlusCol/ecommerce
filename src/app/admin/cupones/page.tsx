import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { coupons } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("promotions", "read"); const rows = await (await getRuntimeDb()).select().from(coupons);
  return <AdminRecordList title="Cupones" description="Reglas validadas nuevamente en servidor." columns={["Código", "Tipo", "Valor", "Prioridad", "Estado"]} rows={rows.map((r) => ({ id: r.id, values: [r.code, r.discountType, r.discountValue, r.priority, r.status] }))} />;
}
