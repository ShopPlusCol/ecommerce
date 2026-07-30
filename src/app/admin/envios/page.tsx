import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEntitySection } from "@/components/admin/admin-entity-section";
import type { AdminEntityField } from "@/components/admin/admin-entity-form";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingRules, shippingZones } from "@/infrastructure/db/schema";
import { ShippingQuoteSimulator } from "./shipping-quote-simulator";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { normalize } from "@/domain/services/shipping";
import { NeighborhoodGroupsBoard, type NeighborhoodGroup } from "./neighborhood-groups-board";
import { RESERVED_GROUP_LABELS } from "./neighborhood-groups-constants";

export default async function Page() {
  await requirePermission("shipping", "read");
  const db = await getRuntimeDb();
  const [zones, rules] = await Promise.all([db.select().from(shippingZones), db.select().from(shippingRules)]);
  const zoneFields: AdminEntityField[] = [
    { name: "name", label: "Nombre", required: true },
    { name: "level", label: "Nivel", type: "select", required: true, options: [{ value: "country", label: "País" }, { value: "department", label: "Departamento" }, { value: "city", label: "Ciudad" }] },
    { name: "country", label: "País", placeholder: "CO" },
    { name: "department", label: "Departamento" },
    { name: "city", label: "Ciudad" },
    { name: "status", label: "Estado", type: "select", required: true, options: [{ value: "active", label: "Activa" }, { value: "inactive", label: "Inactiva" }] },
  ];
  const geoZonesForRules = zones.filter((zone) => zone.level !== "neighborhood");
  const ruleFields: AdminEntityField[] = [
    { name: "zoneId", label: "Zona", type: "select", required: true, options: geoZonesForRules.map((zone) => ({ value: zone.id, label: zone.name })) },
    { name: "name", label: "Nombre", required: true },
    { name: "fee", label: "Tarifa COP", type: "number", required: true, min: 0 },
    { name: "surcharge", label: "Recargo COP", type: "number", min: 0 },
    { name: "freeShippingThreshold", label: "Envío gratis desde COP", type: "number", min: 0 },
    { name: "minOrderAmount", label: "Pedido mínimo COP", type: "number", min: 0 },
    { name: "maxOrderAmount", label: "Pedido máximo COP", type: "number", min: 0 },
    { name: "allowedPaymentMethods", label: "Métodos de pago permitidos", type: "multiselect", required: true, options: [{ value: "mercado_pago", label: "Mercado Pago" }, { value: "cash_on_delivery", label: "Pago contraentrega" }, { value: "shipping_advance_transfer", label: "Transferencia del envío + saldo al recibir" }, { value: "transfer_full", label: "Transferencia total anticipada" }] },
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
  const geoZones = zones.filter((zone) => zone.level !== "neighborhood");
  const neighborhoodZones = zones.filter((zone) => zone.level === "neighborhood");
  const geoZoneIds = new Set(geoZonesForRules.map((zone) => zone.id));
  const geoRules = rules.filter((rule) => geoZoneIds.has(rule.zoneId));

  const cityNames = [...new Map(geoZones.filter((zone) => zone.level === "city" && zone.city).map((zone) => [normalize(zone.city), zone.city as string])).values()].sort((a, b) =>
    a.localeCompare(b, "es-CO"),
  );

  function ruleForZone(zoneId: string | undefined) {
    if (!zoneId) return null;
    const rule = rules.find((row) => row.zoneId === zoneId);
    if (!rule) return null;
    return {
      fee: rule.fee,
      freeShippingThreshold: rule.freeShippingThreshold,
      cashOnDeliveryAllowed: rule.cashOnDeliveryAllowed,
      requiresAdvancePayment: rule.requiresAdvancePayment,
      advancePercentage: rule.advancePercentage,
      sameDayAvailable: rule.sameDayAvailable,
      sameDayCutoffHour: rule.sameDayCutoffHour,
      estimatedBusinessDaysMin: rule.estimatedBusinessDaysMin,
      estimatedBusinessDaysMax: rule.estimatedBusinessDaysMax,
      customerMessage: rule.customerMessage,
      status: rule.status,
    };
  }

  function groupsForCity(city: string): NeighborhoodGroup[] {
    const cityZones = neighborhoodZones.filter((zone) => normalize(zone.city) === normalize(city));
    const reservedUnassigned = cityZones.find((zone) => zone.groupKind === "unassigned");
    const reservedNoCoverage = cityZones.find((zone) => zone.groupKind === "no_coverage");
    const customGroups = cityZones.filter((zone) => zone.groupKind === "custom");
    return [
      { key: "unassigned", name: RESERVED_GROUP_LABELS.unassigned, groupKind: "unassigned", neighborhoodNames: reservedUnassigned?.neighborhoodNames ?? [], rule: null },
      { key: "no_coverage", name: RESERVED_GROUP_LABELS.no_coverage, groupKind: "no_coverage", neighborhoodNames: reservedNoCoverage?.neighborhoodNames ?? [], rule: ruleForZone(reservedNoCoverage?.id) },
      ...customGroups.map((zone) => ({
        key: zone.id,
        name: zone.name,
        groupKind: "custom" as const,
        neighborhoodNames: zone.neighborhoodNames ?? [],
        rule: ruleForZone(zone.id),
      })),
    ];
  }

  return (
    <>
      <AdminPageHeader title="Envíos y zonas" description="La regla activa más específica gana; los cambios se reflejan en checkout." />
      <ShippingQuoteSimulator />
      <AdminEntitySection entity="shippingZone" title="Zonas geográficas" description="País, departamento o ciudad. La regla más específica siempre gana." fields={zoneFields} records={geoZones.map((row) => ({ id: row.id, name: row.name, level: row.level, country: row.country, department: row.department, city: row.city, status: row.status }))} recordTitle={(record) => `${record.name} · ${adminStatusLabel(String(record.level))} · ${adminStatusLabel(String(record.status))}`} canDuplicate={false} />

      <div className="mb-8">
        <h2 className="mb-1 text-lg font-semibold">Barrios por ciudad</h2>
        <p className="mb-4 max-w-3xl text-sm text-text-muted">
          Crea grupos de barrios con su propia tarifa, pega varios a la vez separados por coma y arrastra pastillas
          entre grupos. “Sin grupo” usa la tarifa general de la ciudad; “Sin cobertura” bloquea el envío a esos
          barrios en vez de heredar una tarifa. Los barrios de un grupo aparecen automáticamente en el checkout de
          esa ciudad.
        </p>
        {cityNames.length ? (
          <div className="grid gap-4">
            {cityNames.map((city) => (
              <NeighborhoodGroupsBoard key={city} city={city} groups={groupsForCity(city)} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-strong p-8 text-center">
            <p className="font-semibold">Todavía no tienes ciudades configuradas.</p>
            <p className="mt-1 text-sm text-text-muted">Crea primero una zona de Nivel “Ciudad” arriba en “Zonas geográficas”.</p>
          </div>
        )}
      </div>

      <AdminEntitySection entity="shippingRule" title="Reglas de envío" description="Tarifa, anticipos, contraentrega, tiempos y mensajes de país/departamento/ciudad. Los barrios se administran arriba." fields={ruleFields} records={geoRules.map((row) => ({ id: row.id, zoneId: row.zoneId, name: row.name, fee: row.fee, surcharge: row.surcharge, freeShippingThreshold: row.freeShippingThreshold, minOrderAmount: row.minOrderAmount, maxOrderAmount: row.maxOrderAmount, allowedPaymentMethods: row.allowedPaymentMethods.join(","), cashOnDeliveryAllowed: row.cashOnDeliveryAllowed, requiresAdvancePayment: row.requiresAdvancePayment, advancePercentage: row.advancePercentage, sameDayAvailable: row.sameDayAvailable, sameDayCutoffHour: row.sameDayCutoffHour, estimatedBusinessDaysMin: row.estimatedBusinessDaysMin, estimatedBusinessDaysMax: row.estimatedBusinessDaysMax, customerMessage: row.customerMessage, internalInstructions: row.internalInstructions, priority: row.priority, status: row.status, startsAt: row.startsAt, endsAt: row.endsAt }))} recordTitle={(record) => `${record.name} · $${Number(record.fee).toLocaleString("es-CO")} · ${adminStatusLabel(String(record.status))}`} />
    </>
  );
}
