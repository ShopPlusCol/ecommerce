import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingRules, shippingZones } from "@/infrastructure/db/schema";

export default async function Page() {
  await requirePermission("shipping", "read");
  const db = await getRuntimeDb();
  const [zones, rules] = await Promise.all([db.select().from(shippingZones), db.select().from(shippingRules)]);
  const zoneFields: AdminEntityField[] = [
    { name: "name", label: "Nombre", required: true },
    { name: "level", label: "Nivel", type: "select", required: true, options: [{ value: "country", label: "País" }, { value: "department", label: "Departamento" }, { value: "city", label: "Ciudad" }, { value: "neighborhood", label: "Barrio" }] },
    { name: "country", label: "País", placeholder: "CO" },
    { name: "department", label: "Departamento" },
    { name: "city", label: "Ciudad" },
    { name: "neighborhood", label: "Barrio" },
    { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "active", label: "Activa" }, { value: "inactive", label: "Inactiva" }] },
  ];
  const ruleFields: AdminEntityField[] = [
    { name: "zoneId", label: "Zona", type: "select", required: true, options: zones.map((zone) => ({ value: zone.id, label: zone.name })) },
    { name: "name", label: "Nombre", required: true },
    { name: "fee", label: "Tarifa COP", type: "number", required: true, min: 0 },
    { name: "surcharge", label: "Recargo COP", type: "number", min: 0 },
    { name: "freeShippingThreshold", label: "Envío gratis desde COP", type: "number", min: 0 },
    { name: "minOrderAmount", label: "Pedido mínimo COP", type: "number", min: 0 },
    { name: "maxOrderAmount", label: "Pedido máximo COP", type: "number", min: 0 },
    { name: "cashOnDeliveryAllowed", label: "Permite contraentrega", type: "checkbox" },
    { name: "requiresAdvancePayment", label: "Exige anticipo", type: "checkbox" },
    { name: "advancePercentage", label: "Porcentaje de anticipo", type: "number", min: 0, max: 100 },
    { name: "sameDayAvailable", label: "Entrega el mismo día", type: "checkbox" },
    { name: "sameDayCutoffHour", label: "Hora límite", type: "number", min: 0, max: 23 },
    { name: "estimatedBusinessDaysMin", label: "Días hábiles mínimos", type: "number", min: 0 },
    { name: "estimatedBusinessDaysMax", label: "Días hábiles máximos", type: "number", min: 0 },
    { name: "customerMessage", label: "Mensaje al cliente", type: "textarea" },
    { name: "internalInstructions", label: "Instrucciones internas", type: "textarea" },
    { name: "priority", label: "Prioridad", type: "number" },
    { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "draft", label: "Borrador" }, { value: "active", label: "Activa" }, { value: "inactive", label: "Inactiva" }] },
    { name: "startsAt", label: "Inicio", type: "datetime-local" },
    { name: "endsAt", label: "Fin", type: "datetime-local" },
  ];
  return (
    <>
      <AdminPageHeader title="Envíos y zonas" description="La regla activa más específica gana; los cambios se reflejan en checkout." />
      <AdminEntitySection entity="shippingZone" title="Zonas" description="Jerarquía geográfica portable y explícita." fields={zoneFields} records={zones.map((row) => ({ ...row }))} recordTitle={(record) => `${record.name} · ${record.level} · ${record.status}`} canDuplicate={false} />
      <AdminEntitySection entity="shippingRule" title="Reglas de envío" description="Tarifa, anticipos, contraentrega, tiempos y mensajes." fields={ruleFields} records={rules.map((row) => ({ id: row.id, zoneId: row.zoneId, name: row.name, fee: row.fee, surcharge: row.surcharge, freeShippingThreshold: row.freeShippingThreshold, minOrderAmount: row.minOrderAmount, maxOrderAmount: row.maxOrderAmount, cashOnDeliveryAllowed: row.cashOnDeliveryAllowed, requiresAdvancePayment: row.requiresAdvancePayment, advancePercentage: row.advancePercentage, sameDayAvailable: row.sameDayAvailable, sameDayCutoffHour: row.sameDayCutoffHour, estimatedBusinessDaysMin: row.estimatedBusinessDaysMin, estimatedBusinessDaysMax: row.estimatedBusinessDaysMax, customerMessage: row.customerMessage, internalInstructions: row.internalInstructions, priority: row.priority, status: row.status, startsAt: row.startsAt, endsAt: row.endsAt }))} recordTitle={(record) => `${record.name} · $${Number(record.fee).toLocaleString("es-CO")} · ${record.status}`} />
    </>
  );
}
