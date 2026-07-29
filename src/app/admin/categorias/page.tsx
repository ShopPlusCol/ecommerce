import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { categories } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("catalog", "read"); const rows = await (await getRuntimeDb()).select().from(categories);
  return <AdminRecordList title="Categorías" description="Categorías persistidas y ordenadas." columns={["Nombre", "Slug", "Orden", "Menú"]} rows={rows.map((r) => ({ id: r.id, values: [r.name, r.slug, r.order, r.visibleInMenu ? "Visible" : "Oculta"] }))} />;
}
