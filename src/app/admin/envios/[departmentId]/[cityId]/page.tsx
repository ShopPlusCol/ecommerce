import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { requirePermission } from "@/modules/auth/session";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";
import { ZoneCard } from "../../zone-cards";
import { ZoneConfigForm } from "../../zone-config-form";
import { CreateZoneForm } from "../../create-zone-form";
import { BulkNeighborhoodsForm } from "../../bulk-neighborhoods-form";
import { FilterableZoneList } from "../../filterable-zone-list";
import { buildZoneConfigFormProps, deleteWarningFor, summarizeZone } from "../../zone-view-model";

export default async function CityPage({ params }: { params: Promise<{ departmentId: string; cityId: string }> }) {
  await requirePermission("shipping", "read");
  const { departmentId, cityId } = await params;
  const { zones, rules } = await loadShippingTree();
  const department = zones.find((zone) => zone.id === departmentId && zone.level === "department");
  const city = zones.find((zone) => zone.id === cityId && zone.level === "city" && zone.parentZoneId === departmentId);
  if (!department || !city) notFound();

  const barrios = zones.filter((zone) => zone.parentZoneId === city.id && zone.level === "neighborhood").sort((a, b) => a.name.localeCompare(b.name, "es-CO"));

  return (
    <>
      <AdminBreadcrumb
        items={[
          { label: "Envíos y zonas", href: "/admin/envios" },
          { label: department.name, href: `/admin/envios/${department.id}` },
          { label: city.name },
        ]}
      />
      <AdminPageHeader title={city.name} description="Configuración de la ciudad/municipio y sus barrios." />

      <section className="mb-6">
        <ZoneConfigForm {...buildZoneConfigFormProps(city.id, zones, rules)} />
      </section>

      <section className="mb-6 grid gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Agregar un barrio</h2>
          <CreateZoneForm level="neighborhood" parentZoneId={city.id} label="Nombre del barrio" placeholder="Ej. El Poblado" />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Pegar varios a la vez</h2>
          <BulkNeighborhoodsForm cityId={city.id} />
        </div>
      </section>

      <FilterableZoneList
        placeholder={`Buscar entre ${barrios.length} barrios de ${city.name}…`}
        emptyLabel={barrios.length ? "Ningún barrio coincide con la búsqueda." : "Todavía no tienes barrios configurados en esta ciudad; mientras tanto, todos sus pedidos usan la configuración de la ciudad."}
        items={barrios.map((barrio) => {
          const summary = summarizeZone(barrio.id, zones, rules);
          return {
            id: barrio.id,
            name: barrio.name,
            node: (
              <ZoneCard
                id={barrio.id}
                name={barrio.name}
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
                childCount={0}
                childLabel=""
                deleteWarning={deleteWarningFor(barrio, zones)}
              >
                <ZoneConfigForm {...buildZoneConfigFormProps(barrio.id, zones, rules)} />
              </ZoneCard>
            ),
          };
        })}
      />
    </>
  );
}
