import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { pages } from "@/infrastructure/db/schema";
export default async function Page() {
  await requirePermission("content", "read"); const rows = await (await getRuntimeDb()).select().from(pages);
  return <AdminRecordList title="Editor visual" description="El storefront consume las versiones publicadas de este mismo contrato de bloques." columns={["Página", "Slug", "Inicio", "Estado", "Versión publicada"]} rows={rows.map((r) => ({ id: r.id, values: [r.title, r.slug, r.isHome ? "Sí" : "No", r.status, r.publishedVersionId] }))} />;
}
