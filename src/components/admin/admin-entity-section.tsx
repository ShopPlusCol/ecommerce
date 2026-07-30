import { AdminEntityForm, type AdminEntityField } from "./admin-entity-form";

type FieldValue = string | number | boolean | Date | null | undefined;

const entityCopy: Record<string, { add: string; create: string; empty: string }> = {
  category: { add: "Añadir una nueva categoría", create: "Crear categoría", empty: "Todavía no tienes categorías." },
  colorFamily: { add: "Añadir una nueva familia de color", create: "Crear familia de color", empty: "Todavía no tienes familias de color." },
  collection: { add: "Añadir una nueva colección", create: "Crear colección", empty: "Todavía no tienes colecciones." },
  coupon: { add: "Añadir un nuevo cupón", create: "Crear cupón", empty: "Todavía no tienes cupones." },
  faq: { add: "Añadir una nueva pregunta frecuente", create: "Crear pregunta frecuente", empty: "Todavía no tienes preguntas frecuentes." },
  testimonial: { add: "Añadir un nuevo testimonio", create: "Crear testimonio", empty: "Todavía no tienes testimonios." },
  rewardRule: { add: "Añadir una nueva recompensa", create: "Crear recompensa", empty: "Todavía no tienes recompensas." },
  popup: { add: "Añadir un nuevo pop-up", create: "Crear pop-up", empty: "Todavía no tienes pop-ups." },
  promotion: { add: "Añadir una nueva promoción", create: "Crear promoción", empty: "Todavía no tienes promociones." },
};

export function AdminEntitySection({
  entity,
  title,
  description,
  fields,
  records,
  recordTitle,
  canArchive = true,
  canDuplicate = true,
}: {
  entity: string;
  title: string;
  description: string;
  fields: AdminEntityField[];
  records: Array<Record<string, FieldValue> & { id: string }>;
  recordTitle: (record: Record<string, FieldValue> & { id: string }) => string;
  canArchive?: boolean;
  canDuplicate?: boolean;
}) {
  const copy = entityCopy[entity] ?? {
    add: `Añadir ${title.toLocaleLowerCase("es-CO")}`,
    create: `Crear ${title.toLocaleLowerCase("es-CO")}`,
    empty: `Todavía no tienes ${title.toLocaleLowerCase("es-CO")}.`,
  };
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface-raised p-4 sm:p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <details className="mb-5 rounded-lg border border-brand/20 bg-brand-soft p-4">
        <summary className="cursor-pointer font-semibold text-brand">{copy.add}</summary>
        <div className="mt-4">
          <AdminEntityForm entity={entity} operation="create" fields={fields} submitLabel={copy.create} />
        </div>
      </details>
      {records.length ? (
        <div className="grid gap-3">
          {records.map((record) => (
            <details key={record.id} className="rounded-lg border border-border p-4">
              <summary className="cursor-pointer font-semibold">{recordTitle(record)}</summary>
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
                <AdminEntityForm entity={entity} operation="update" fields={fields} values={record} submitLabel="Guardar cambios" />
                <div className="grid content-start gap-3">
                  {canDuplicate ? <AdminEntityForm entity={entity} operation="duplicate" fields={[]} values={{ id: record.id }} submitLabel="Duplicar" /> : null}
                  {canArchive ? <AdminEntityForm entity={entity} operation="archive" fields={[]} values={{ id: record.id }} submitLabel="Archivar" /> : null}
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border-strong p-8 text-center">
          <p className="font-semibold">{copy.empty}</p>
          <p className="mt-1 text-sm text-text-muted">Usa “{copy.add}” para crear el primer elemento.</p>
        </div>
      )}
    </section>
  );
}
