import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { collections } from "@/infrastructure/db/schema";

const fields: AdminEntityField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "slug", label: "Slug", required: true },
  { name: "description", label: "Descripción", type: "textarea" },
  { name: "type", label: "Tipo", type: "select", required: true, options: [{ value: "manual", label: "Manual" }, { value: "dynamic", label: "Dinámica" }] },
  { name: "featured", label: "Destacada", type: "checkbox" },
  { name: "startsAt", label: "Inicio", type: "datetime-local" },
  { name: "endsAt", label: "Fin", type: "datetime-local" },
];

export default async function Page() {
  await requirePermission("catalog", "read");
  const rows = await (await getRuntimeDb()).select().from(collections);
  return (
    <>
      <AdminPageHeader title="Colecciones" description="Agrupaciones manuales y dinámicas con programación verificable." />
      <AdminEntitySection entity="collection" title="Colecciones" description="Al archivar se retira de destacados y se cierra su vigencia." fields={fields} records={rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, description: row.description, type: row.type, featured: row.featured, startsAt: row.startsAt, endsAt: row.endsAt }))} recordTitle={(record) => `${record.name} · ${record.type}`} />
    </>
  );
}
