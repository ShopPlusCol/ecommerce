import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { loadShippingTree } from "@/infrastructure/shipping/zone-tree-repository";
import { ShippingQuoteSimulator } from "./shipping-quote-simulator";
import { ZoneCard, ZoneEmptyState } from "./zone-cards";
import { ZoneConfigForm } from "./zone-config-form";
import { CreateZoneForm } from "./create-zone-form";
import { BulkZonesForm } from "./bulk-zones-form";
import { BulkZoneQuickEdit } from "./bulk-zone-quick-edit";
import { ZoneSearchBox } from "./zone-search-box";
import { buildZoneConfigFormProps, deleteWarningFor, summarizeZone } from "./zone-view-model";

export default async function Page() {
  await requirePermission("shipping", "read");
  const { zones, rules } = await loadShippingTree();

  const departments = zones.filter((zone) => zone.level === "department").sort((a, b) => a.name.localeCompare(b.name, "es-CO"));
  const countryZone = zones.find((zone) => zone.level === "country") ?? null;

  return (
    <>
      <AdminPageHeader title="Envíos y zonas" description="Departamento → Ciudad/Municipio → Barrio. Cada zona hereda de su padre lo que no personalice." />
      <ShippingQuoteSimulator />
      <ZoneSearchBox />

      <section className="mb-6 grid gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Agregar departamento</h2>
          <CreateZoneForm level="department" label="Nombre del departamento" placeholder="Ej. Antioquia" />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text-muted">Pegar varios a la vez</h2>
          <BulkZonesForm level="department" label="Departamentos (separados por coma o uno por línea)" placeholder="Antioquia, Valle del Cauca, Santander" />
        </div>
      </section>

      {departments.length ? <BulkZoneQuickEdit items={departments.map((d) => buildZoneConfigFormProps(d.id, zones, rules))} zoneLabel="departamentos" /> : null}

      <div className="mb-8 grid gap-3">
        {departments.length ? (
          departments.map((department) => {
            const summary = summarizeZone(department.id, zones, rules);
            const cityCount = zones.filter((zone) => zone.parentZoneId === department.id && zone.level === "city").length;
            return (
              <ZoneCard
                key={department.id}
                id={department.id}
                name={department.name}
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
                childCount={cityCount}
                childLabel="ciudades"
                drillHref={`/admin/envios/${department.id}`}
                deleteWarning={deleteWarningFor(department, zones)}
              >
                <ZoneConfigForm {...buildZoneConfigFormProps(department.id, zones, rules)} />
              </ZoneCard>
            );
          })
        ) : (
          <ZoneEmptyState title="Todavía no tienes departamentos configurados." hint='Usa "Agregar departamento" arriba para crear el primero.' />
        )}
      </div>

      {countryZone
        ? (() => {
            const summary = summarizeZone(countryZone.id, zones, rules);
            return (
              <section>
                <h2 className="mb-1 text-lg font-semibold">Respaldo nacional</h2>
                <p className="mb-3 max-w-2xl text-sm text-text-muted">Se usa solo para pedidos de un departamento que todavía no configuraste arriba.</p>
                <ZoneCard
                  id={countryZone.id}
                  name={countryZone.name}
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
                  deleteWarning=""
                  deletable={false}
                >
                  <ZoneConfigForm {...buildZoneConfigFormProps(countryZone.id, zones, rules)} />
                </ZoneCard>
              </section>
            );
          })()
        : null}
    </>
  );
}
