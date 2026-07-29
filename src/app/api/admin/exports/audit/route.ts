import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, auditLogs } from "@/infrastructure/db/schema";
import { auditActionLabel } from "@/modules/audit/admin-audit";
import { requirePermission } from "@/modules/auth/session";

function cell(value: unknown) { return `"${String(value ?? "").replaceAll("\"", "\"\"")}"`; }

export async function GET(request: Request) {
  const session = await requirePermission("audit", "export");
  const query = new URL(request.url).searchParams;
  const from = query.get("from") ? new Date(`${query.get("from")}T00:00:00-05:00`) : null;
  const to = query.get("to") ? new Date(`${query.get("to")}T23:59:59.999-05:00`) : null;
  const q = query.get("q");
  const filters = and(
    q ? or(like(auditLogs.action, `%${q}%`), like(auditLogs.entityId, `%${q}%`), like(auditLogs.reason, `%${q}%`), like(adminUsers.fullName, `%${q}%`)) : undefined,
    query.get("action") ? eq(auditLogs.action, query.get("action")!) : undefined,
    query.get("entity") ? eq(auditLogs.entityType, query.get("entity")!) : undefined,
    from && !Number.isNaN(from.valueOf()) ? gte(auditLogs.createdAt, from) : undefined,
    to && !Number.isNaN(to.valueOf()) ? lte(auditLogs.createdAt, to) : undefined,
  );
  const db = await getRuntimeDb();
  const rows = await db.select({ log: auditLogs, actor: adminUsers.fullName }).from(auditLogs).leftJoin(adminUsers, eq(adminUsers.id, auditLogs.userId)).where(filters).orderBy(desc(auditLogs.createdAt)).limit(10_000);
  const csv = [["fecha", "responsable", "accion", "entidad", "identificador", "motivo"], ...rows.map(({ log, actor }) => [log.createdAt.toISOString(), actor || (log.userId ? "Usuario no disponible" : "Sistema"), auditActionLabel(log.action), log.entityType, log.entityId, log.reason ?? ""])].map((row) => row.map(cell).join(",")).join("\r\n");
  await db.insert(auditLogs).values({ userId: session.user.id, action: "audit.csv.export", entityType: "export", entityId: crypto.randomUUID(), after: { rows: rows.length } });
  return new Response(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="auditoria-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
}
