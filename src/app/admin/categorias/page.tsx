import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { categories, colorFamilies } from "@/infrastructure/db/schema";

export default async function Page() {
  await requirePermission("catalog", "read");
  const db = await getRuntimeDb();
  const [categoryRows, familyRows] = await Promise.all([db.select().from(categories), db.select().from(colorFamilies)]);
  const categoryFields: AdminEntityField[] = [
    { name: "name", label: "Nombre", required: true },
    { name: "slug", label: "Slug", required: true, placeholder: "lentes-cosmeticos" },
    { name: "description", label: "Descripción", type: "textarea" },
    { name: "parentId", label: "Categoría superior", type: "select", options: categoryRows.map((row) => ({ value: row.id, label: row.name })) },
    { name: "imageUrl", label: "URL de imagen", type: "url" },
    { name: "seoTitle", label: "Título SEO" },
    { name: "seoDescription", label: "Descripción SEO", type: "textarea" },
    { name: "order", label: "Orden", type: "number", min: 0 },
    { name: "visibleInMenu", label: "Visible en el menú", type: "checkbox" },
    { name: "visibleInFilters", label: "Visible en filtros", type: "checkbox" },
  ];
  const familyFields: AdminEntityField[] = [
    { name: "name", label: "Nombre", required: true },
    { name: "slug", label: "Slug", required: true },
    { name: "hexSwatch", label: "Color hexadecimal", placeholder: "#87233d" },
    { name: "order", label: "Orden", type: "number", min: 0 },
  ];
  return (
    <>
      <AdminPageHeader title="Categorías y familias" description="Jerarquía, presentación, SEO y filtros del catálogo público." />
      <AdminEntitySection
        entity="category"
        title="Categorías"
        description="Archivar oculta la categoría sin romper productos relacionados."
        fields={categoryFields}
        records={categoryRows.map((row) => ({ ...row }))}
        recordTitle={(record) => `${record.name} · ${record.slug}`}
      />
      <AdminEntitySection
        entity="colorFamily"
        title="Familias de color"
        description="Se usan en filtros, fichas y simulador."
        fields={familyFields}
        records={familyRows.map((row) => ({ ...row }))}
        recordTitle={(record) => `${record.name} · ${record.hexSwatch ?? "sin muestra"}`}
        canArchive={false}
      />
    </>
  );
}
