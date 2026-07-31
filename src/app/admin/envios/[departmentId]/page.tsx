import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { requirePermission } from "@/modules/auth/session";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";
import { ZoneCard, ZoneEmptyState } from "../zone-cards";
import { ZoneConfigForm } from "../zone-config-form";
import { CreateZoneForm } from "../create-zone-form";
import { BulkZonesForm } from "../bulk-zones-form";
import { buildZoneConfigFormProps, deleteWarningFor, summarizeZone } from "../zone-view-model";

export default async function DepartmentPage({ params }: { params: Promise<{ departmentId: string }> }) {
  await requirePermission("shipping", "read");
  const { departmentId } = await params;
  const { zones, rules } = await loadShippingTree();
  const department = zones.find((zone) => zone.id === departmentId && zone.level === "department");
  if (!department) notFound();

  const cities = zones.filter((zone) => zone.parentZoneId === department.id && zone.level === "city").sort((a, b) => a.name.localeCompare(b.name, "es-CO"));

  return (
    <>
      <AdminBreadcrumb items={[{ label: "Envíos y zonas", href: "/admin/envios" }, { label: department.name }]} />
      <AdminPageHeader
        title={department.name}
        description="Ciudades o municipios de este departamento. Para editar la configuración propia del departamento, vuelve a la lista anterior y usa «Configurar»."
      />

      <section className="mb-6 grid gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Agregar ciudad o municipio</h2>
          <CreateZoneForm level="city" parentZoneId={department.id} label="Nombre de la ciudad/municipio" placeholder="Ej. Medellín" />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Pegar varias a la vez</h2>
          <BulkZonesForm level="city" parentZoneId={department.id} label="Ciudades/municipios (separados por coma o uno por línea)" placeholder="Medellín, Envigado, Itagüí" />
        </div>
      </section>

      <div className="grid gap-3">
        {cities.length ? (
          cities.map((city) => {
            const summary = summarizeZone(city.id, zones, rules);
            const barrioCount = zones.filter((zone) => zone.parentZoneId === city.id && zone.level === "neighborhood").length;
            return (
              <ZoneCard
                key={city.id}
                id={city.id}
                name={city.name}
                status={summary.status}
                effectivelyActive={summary.effectivelyActive}
                feeLabel={summary.feeLabel}
                feeOwn={summary.feeOwn}
                coverageBlocked={summary.coverageBlocked}
                coverageOwn={summary.coverageOwn}
                cashOnDeliveryAllowed={summary.cashOnDeliveryAllowed}
                cashOwn={summary.cashOwn}
                sameDayAvailable={summary.sameDayAvailable}
                sameDayOwn={summary.sameDayOwn}
                childCount={barrioCount}
                childLabel="barrios"
                drillHref={`/admin/envios/${department.id}/${city.id}`}
                deleteWarning={deleteWarningFor(city, zones)}
              >
                <ZoneConfigForm {...buildZoneConfigFormProps(city.id, zones, rules)} />
              </ZoneCard>
            );
          })
        ) : (
          <ZoneEmptyState
            title="Todavía no tienes ciudades configuradas en este departamento."
            hint='Usa "Agregar ciudad o municipio" arriba, o deja el departamento así si su configuración debe aplicar a todo su territorio.'
          />
        )}
      </div>
    </>
  );
}
