import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { faqs } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("content", "read"); const rows = await (await getRuntimeDb()).select().from(faqs);
  return <AdminRecordList title="Contenido" description="FAQ, testimonios y contenido legal persistente." columns={["Pregunta", "Categoría", "Orden", "Estado"]} rows={rows.map((r) => ({ id: r.id, values: [r.question, r.category, r.order, r.status] }))} />;
}
