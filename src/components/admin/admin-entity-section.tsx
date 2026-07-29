import { AdminEntityForm, type AdminEntityField } from "./admin-entity-form";

type FieldValue = string | number | boolean | Date | null | undefined;

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
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface-raised p-4 sm:p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-text-muted">{description}</p>
      </div>
      <details className="mb-5 rounded-lg border border-brand/20 bg-brand-soft p-4">
        <summary className="cursor-pointer font-semibold text-brand">Crear registro</summary>
        <div className="mt-4">
          <AdminEntityForm entity={entity} operation="create" fields={fields} submitLabel={`Crear ${title.toLocaleLowerCase("es-CO")}`} />
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
        <p className="rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-text-muted">No hay registros todavía.</p>
      )}
    </section>
  );
}
