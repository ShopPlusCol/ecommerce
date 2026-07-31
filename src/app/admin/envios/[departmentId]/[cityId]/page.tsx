import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { shippingNeighborhoodGroupSettings } from "@/infrastructure/db/schema";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";
import { CreateZoneForm } from "../../create-zone-form";
import { BulkZonesForm } from "../../bulk-zones-form";
import { BarrioPillsBoard, type BarrioGroupSettingsData } from "../../barrio-pills-board";
import { memberGroupFromRule } from "../../barrio-group-derivation";

export default async function CityPage({ params }: { params: Promise<{ departmentId: string; cityId: string }> }) {
  await requirePermission("shipping", "read");
  const { departmentId, cityId } = await params;
  const { zones, rules } = await loadShippingTree();
  const department = zones.find((zone) => zone.id === departmentId && zone.level === "department");
  const city = zones.find((zone) => zone.id === cityId && zone.level === "city" && zone.parentZoneId === departmentId);
  if (!department || !city) notFound();

  const barrios = zones.filter((zone) => zone.parentZoneId === city.id && zone.level === "neighborhood").sort((a, b) => a.name.localeCompare(b.name, "es-CO"));
  const barrioPillData = barrios.map((barrio) => {
    const rule = rules.find((r) => r.zoneId === barrio.id);
    const fee = rule?.fee?.amount ?? null;
    return {
      id: barrio.id,
      name: barrio.name,
      fee,
      group: memberGroupFromRule(rule ? { coverage: rule.coverage, fee } : undefined),
    };
  });

  const db = await getRuntimeDb();
  const groupSettingsRows = await db.select().from(shippingNeighborhoodGroupSettings).where(eq(shippingNeighborhoodGroupSettings.cityZoneId, city.id));
  const groupSettings: Record<"no_coverage" | "special_price", BarrioGroupSettingsData | null> = { no_coverage: null, special_price: null };
  for (const row of groupSettingsRows) {
    groupSettings[row.groupKind] = {
      fee: row.fee,
      freeShippingThreshold: row.freeShippingThreshold,
      cashOnDeliveryAllowed: row.cashOnDeliveryAllowed,
      requiresAdvancePayment: row.requiresAdvancePayment,
      advancePercentage: row.advancePercentage,
      sameDayAvailable: row.sameDayAvailable,
      sameDayCutoffHour: row.sameDayCutoffHour,
      estimatedBusinessDaysMin: row.estimatedBusinessDaysMin,
      estimatedBusinessDaysMax: row.estimatedBusinessDaysMax,
      allowedPaymentMethods: row.allowedPaymentMethods,
      customerMessage: row.customerMessage,
    };
  }

  return (
    <>
      <AdminBreadcrumb
        items={[
          { label: "Envíos y zonas", href: "/admin/envios" },
          { label: department.name, href: `/admin/envios/${department.id}` },
          { label: city.name },
        ]}
      />
      <AdminPageHeader
        title={city.name}
        description="Barrios de esta ciudad/municipio. Para editar la configuración propia de la ciudad, vuelve a la lista anterior y usa «Configurar»."
      />

      <section className="mb-6 grid gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Agregar un barrio</h2>
          <CreateZoneForm level="neighborhood" parentZoneId={city.id} label="Nombre del barrio" placeholder="Ej. El Poblado" />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Pegar varios a la vez</h2>
          <BulkZonesForm level="neighborhood" parentZoneId={city.id} label="Barrios (separados por coma o uno por línea)" placeholder="El Poblado, Laureles, Belén" />
        </div>
      </section>

      <BarrioPillsBoard cityId={city.id} barrios={barrioPillData} groupSettings={groupSettings} />
    </>
  );
}
