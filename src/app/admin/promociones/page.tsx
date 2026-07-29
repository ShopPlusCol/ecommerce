import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { promotions } from "@/infrastructure/db/schema";

const fields: AdminEntityField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "description", label: "Descripción", type: "textarea" },
  { name: "bannerImageUrl", label: "Imagen de campaña", type: "url" },
  { name: "relatedCouponIds", label: "IDs de cupones (separados por coma)" },
  { name: "relatedRewardRuleIds", label: "IDs de recompensas (separados por coma)" },
  { name: "startsAt", label: "Inicio", type: "datetime-local" },
  { name: "endsAt", label: "Fin", type: "datetime-local" },
  { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "draft", label: "Borrador" }, { value: "scheduled", label: "Programada" }, { value: "active", label: "Activa" }, { value: "ended", label: "Finalizada" }] },
];

export default async function Page() {
  await requirePermission("promotions", "read");
  const rows = await (await getRuntimeDb()).select().from(promotions);
  return (
    <>
      <AdminPageHeader title="Promociones" description="Campañas agrupadas con vigencia, recursos y beneficios relacionados." />
      <AdminEntitySection entity="promotion" title="Promociones" description="Duplicar siempre crea un borrador sin fechas activas." fields={fields} records={rows.map((row) => ({ id: row.id, name: row.name, description: row.description, bannerImageUrl: row.bannerImageUrl, relatedCouponIds: row.relatedCouponIds?.join(", ") ?? "", relatedRewardRuleIds: row.relatedRewardRuleIds?.join(", ") ?? "", startsAt: row.startsAt, endsAt: row.endsAt, status: row.status }))} recordTitle={(record) => `${record.name} · ${record.status}`} />
    </>
  );
}
