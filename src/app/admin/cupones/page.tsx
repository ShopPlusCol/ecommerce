import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { coupons } from "@/infrastructure/db/schema";

const fields: AdminEntityField[] = [
  { name: "code", label: "Código", required: true, placeholder: "BIENVENIDA10" },
  { name: "discountType", label: "Tipo", type: "select", required: true, options: [{ value: "fixed", label: "Valor fijo" }, { value: "percentage", label: "Porcentaje" }, { value: "free_shipping", label: "Envío gratis" }, { value: "gift", label: "Regalo" }] },
  { name: "discountValue", label: "Valor", type: "number", min: 0, required: true },
  { name: "startsAt", label: "Inicio", type: "datetime-local" },
  { name: "endsAt", label: "Fin", type: "datetime-local" },
  { name: "usageLimitTotal", label: "Límite total", type: "number", min: 1 },
  { name: "usageLimitPerCustomer", label: "Límite por cliente", type: "number", min: 1 },
  { name: "minPurchaseAmount", label: "Compra mínima COP", type: "number", min: 0 },
  { name: "minQuantity", label: "Cantidad mínima", type: "number", min: 1 },
  { name: "firstOrderOnly", label: "Solo primera compra", type: "checkbox" },
  { name: "combinable", label: "Combinable", type: "checkbox" },
  { name: "priority", label: "Prioridad", type: "number" },
  { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "draft", label: "Borrador" }, { value: "scheduled", label: "Programado" }, { value: "active", label: "Activo" }, { value: "paused", label: "Pausado" }, { value: "expired", label: "Vencido" }] },
  { name: "attributedTo", label: "Atribuido a" },
  { name: "internalTags", label: "Etiquetas (separadas por coma)" },
  { name: "internalNotes", label: "Notas internas", type: "textarea" },
];

export default async function Page() {
  await requirePermission("promotions", "read");
  const rows = await (await getRuntimeDb()).select().from(coupons);
  return (
    <>
      <AdminPageHeader title="Cupones" description="Reglas de descuento revalidadas en servidor durante cada checkout." />
      <AdminEntitySection entity="coupon" title="Cupones" description="Códigos únicos, límites, atribución, vigencia y combinabilidad." fields={fields} records={rows.map((row) => ({ id: row.id, code: row.code, discountType: row.discountType, discountValue: row.discountValue, startsAt: row.startsAt, endsAt: row.endsAt, usageLimitTotal: row.usageLimitTotal, usageLimitPerCustomer: row.usageLimitPerCustomer, minPurchaseAmount: row.minPurchaseAmount, minQuantity: row.minQuantity, firstOrderOnly: row.firstOrderOnly, combinable: row.combinable, priority: row.priority, status: row.status, attributedTo: row.attributedTo, internalTags: row.internalTags?.join(", ") ?? "", internalNotes: row.internalNotes }))} recordTitle={(record) => `${record.code} · ${record.discountValue} · ${adminStatusLabel(String(record.status))}`} />
    </>
  );
}
