import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, auditLogs } from "@/infrastructure/db/schema";
import { auditActionLabel, auditDescription, sanitizeAuditValue } from "@/modules/audit/admin-audit";
import { requirePermission } from "@/modules/auth/session";

const PAGE_SIZE = 30;

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; action?: string; entity?: string; from?: string; to?: string; page?: string }> }) {
  await requirePermission("audit", "read");
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const from = query.from ? new Date(`${query.from}T00:00:00-05:00`) : null;
  const to = query.to ? new Date(`${query.to}T23:59:59.999-05:00`) : null;
  const filters = and(
    query.q ? or(like(auditLogs.action, `%${query.q}%`), like(auditLogs.entityId, `%${query.q}%`), like(auditLogs.reason, `%${query.q}%`), like(adminUsers.fullName, `%${query.q}%`)) : undefined,
    query.action ? eq(auditLogs.action, query.action) : undefined,
    query.entity ? eq(auditLogs.entityType, query.entity) : undefined,
    from && !Number.isNaN(from.valueOf()) ? gte(auditLogs.createdAt, from) : undefined,
    to && !Number.isNaN(to.valueOf()) ? lte(auditLogs.createdAt, to) : undefined,
  );
  const db = await getRuntimeDb();
  const [rows, countRows, actionRows, entityRows] = await Promise.all([
    db.select({ log: auditLogs, actorName: adminUsers.fullName, actorEmail: adminUsers.email }).from(auditLogs).leftJoin(adminUsers, eq(adminUsers.id, auditLogs.userId)).where(filters).orderBy(desc(auditLogs.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).leftJoin(adminUsers, eq(adminUsers.id, auditLogs.userId)).where(filters),
    db.selectDistinct({ value: auditLogs.action }).from(auditLogs).orderBy(auditLogs.action),
    db.selectDistinct({ value: auditLogs.entityType }).from(auditLogs).orderBy(auditLogs.entityType),
  ]);
  const total = Number(countRows[0]?.count ?? 0);
  const params = new URLSearchParams(Object.entries(query).filter(([key, value]) => key !== "page" && value).map(([key, value]) => [key, value!]));
  return <><AdminPageHeader title="Auditoría" description="Registro comprensible de acciones humanas y del sistema. Los valores sensibles siempre se ocultan." actions={<a href={`/api/admin/exports/audit?${params}`} className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold">Exportar CSV</a>} /><form className="grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-5"><label className="grid gap-1 text-sm font-semibold">Buscar<input className="h-10 rounded-md border border-border px-3" name="q" defaultValue={query.q} placeholder="Acción, entidad o persona" /></label><label className="grid gap-1 text-sm font-semibold">Acción<select className="h-10 rounded-md border border-border px-2" name="action" defaultValue={query.action ?? ""}><option value="">Todas</option>{actionRows.map((row) => <option key={row.value} value={row.value}>{auditActionLabel(row.value)}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Entidad<select className="h-10 rounded-md border border-border px-2" name="entity" defaultValue={query.entity ?? ""}><option value="">Todas</option>{entityRows.map((row) => <option key={row.value} value={row.value}>{row.value}</option>)}</select></label><label className="grid gap-1 text-sm font-semibold">Desde<input className="h-10 rounded-md border border-border px-2" type="date" name="from" defaultValue={query.from} /></label><label className="grid gap-1 text-sm font-semibold">Hasta<input className="h-10 rounded-md border border-border px-2" type="date" name="to" defaultValue={query.to} /></label><button className="h-10 rounded-md bg-brand px-4 text-sm font-semibold text-white md:w-fit">Aplicar filtros</button></form>
    <section className="mt-5 grid gap-3">{rows.length ? rows.map(({ log, actorName, actorEmail }) => <article key={log.id} className="rounded-xl border border-border bg-surface-raised p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">{auditActionLabel(log.action)}</h2><p className="mt-1 text-sm text-text-muted">{auditDescription(log.action, log.entityType, log.entityId)}</p></div><time className="text-xs text-text-muted">{log.createdAt.toLocaleString("es-CO")}</time></div><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><div><dt className="text-text-muted">Responsable</dt><dd>{actorName ? `${actorName} · ${actorEmail}` : log.userId ? "Usuario no disponible" : "Sistema"}</dd></div><div><dt className="text-text-muted">Entidad</dt><dd>{log.entityType} · {log.entityId}</dd></div><div><dt className="text-text-muted">Motivo</dt><dd>{log.reason || "Sin motivo adicional"}</dd></div></dl>{log.before || log.after ? <details className="mt-3 rounded-lg bg-surface-sunken p-3"><summary className="cursor-pointer text-sm font-semibold">Ver cambios seguros</summary><div className="mt-3 grid gap-3 lg:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase text-text-muted">Antes</h3><pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(sanitizeAuditValue(log.before), null, 2) || "—"}</pre></div><div><h3 className="text-xs font-semibold uppercase text-text-muted">Después</h3><pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(sanitizeAuditValue(log.after), null, 2) || "—"}</pre></div></div></details> : null}</article>) : <div className="rounded-xl border border-dashed border-border-strong p-10 text-center"><h2 className="font-semibold">No hay acciones que coincidan</h2><p className="mt-1 text-sm text-text-muted">Ajusta los filtros o amplía el intervalo de fechas.</p></div>}</section>
    <nav className="mt-5 flex items-center justify-between text-sm" aria-label="Paginación de auditoría"><span>{total} registros · página {page} de {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><div className="flex gap-2">{page > 1 ? <a className="rounded-md border border-border px-3 py-2" href={`?${params}&page=${page - 1}`}>Anterior</a> : null}{page * PAGE_SIZE < total ? <a className="rounded-md border border-border px-3 py-2" href={`?${params}&page=${page + 1}`}>Siguiente</a> : null}</div></nav></>;
}
