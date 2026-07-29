import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { collections } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("catalog", "read"); const rows = await (await getRuntimeDb()).select().from(collections);
  return <AdminRecordList title="Colecciones" description="Colecciones manuales y dinámicas reales." columns={["Nombre", "Slug", "Tipo", "Destacada"]} rows={rows.map((r) => ({ id: r.id, values: [r.name, r.slug, r.type, r.featured ? "Sí" : "No"] }))} />;
}
