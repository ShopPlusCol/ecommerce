import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { rewardRules } from "@/infrastructure/db/schema";

const fields: AdminEntityField[] = [
  { name: "name", label: "Nombre", required: true },
  { name: "progressMessage", label: "Mensaje de progreso", type: "textarea", required: true },
  { name: "unlockedMessage", label: "Mensaje desbloqueado", type: "textarea", required: true },
  { name: "conditionType", label: "Condición", type: "select", required: true, options: [{ value: "cart_amount", label: "Valor del carrito" }, { value: "item_count", label: "Cantidad de artículos" }, { value: "category", label: "Categoría" }, { value: "zone", label: "Zona" }, { value: "campaign", label: "Campaña" }] },
  { name: "targetValue", label: "Meta", type: "number", min: 0, required: true },
  { name: "rewardType", label: "Beneficio", type: "select", required: true, options: [{ value: "free_shipping", label: "Envío gratis" }, { value: "free_product", label: "Producto gratis" }, { value: "fixed_discount", label: "Descuento fijo" }, { value: "percentage_discount", label: "Descuento porcentual" }] },
  { name: "rewardValue", label: "Valor del beneficio", type: "number", min: 0 },
  { name: "rewardProductId", label: "ID de producto regalo" },
  { name: "priority", label: "Prioridad", type: "number" },
  { name: "combinable", label: "Combinable", type: "checkbox" },
  { name: "startsAt", label: "Inicio", type: "datetime-local" },
  { name: "endsAt", label: "Fin", type: "datetime-local" },
  { name: "usageLimitTotal", label: "Límite total", type: "number", min: 1 },
  { name: "usageLimitPerCustomer", label: "Límite por cliente", type: "number", min: 1 },
  { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "draft", label: "Borrador" }, { value: "active", label: "Activa" }, { value: "paused", label: "Pausada" }] },
];

export default async function Page() {
  await requirePermission("promotions", "read");
  const rows = await (await getRuntimeDb()).select().from(rewardRules);
  return (
    <>
      <AdminPageHeader title="Recompensas" description="Metas progresivas y beneficios calculados nuevamente en servidor." />
      <AdminEntitySection entity="rewardRule" title="Recompensas" description="Configura mensajes, meta, beneficio, límites y prioridad." fields={fields} records={rows.map((row) => ({ id: row.id, name: row.name, progressMessage: row.progressMessage, unlockedMessage: row.unlockedMessage, conditionType: row.conditionType, targetValue: row.targetValue, rewardType: row.rewardType, rewardValue: row.rewardValue, rewardProductId: row.rewardProductId, priority: row.priority, combinable: row.combinable, startsAt: row.startsAt, endsAt: row.endsAt, usageLimitTotal: row.usageLimitTotal, usageLimitPerCustomer: row.usageLimitPerCustomer, status: row.status }))} recordTitle={(record) => `${record.name} · ${adminStatusLabel(String(record.conditionType))} · ${adminStatusLabel(String(record.status))}`} />
    </>
  );
}
