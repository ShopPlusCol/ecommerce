import { AdminPageHeader } from "./admin-page-header";

export function AdminRecordList({
  title,
  description,
  columns,
  rows,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: Array<{ id: string; values: Array<string | number | null | undefined> }>;
}) {
  return <>
    <AdminPageHeader title={title} description={description} />
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
      {rows.length ? <table className="w-full text-sm"><thead><tr className="border-b text-left">{columns.map((column) => <th key={column} className="p-3">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id} className="border-b border-border">{row.values.map((value, index) => <td key={`${row.id}-${columns[index]}`} className="p-3">{value ?? "—"}</td>)}</tr>)}</tbody>
      </table> : <p className="p-8 text-center text-sm text-text-muted">No hay registros todavía.</p>}
    </div>
  </>;
}
