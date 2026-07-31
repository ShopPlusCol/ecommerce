import { desc } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { analyticsEvents, auditLogs, orderItems, orders } from "@/infrastructure/db/schema";
import { buildAdminAnalytics } from "@/modules/analytics/admin-analytics";
import { requirePermission } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

function safeDate(value: string | null, fallback: Date, end = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const parsed = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}-05:00`);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed;
}

function csvCell(value: string | number) {
  return `"${String(value).replaceAll("\"", "\"\"")}"`;
}

export async function GET(request: Request) {
  const session = await requirePermission("dashboard", "export");
  const url = new URL(request.url);
  const now = new Date();
  const fallback = new Date(now.getTime() - 29 * 86_400_000);
  const range = { from: safeDate(url.searchParams.get("from"), fallback), to: safeDate(url.searchParams.get("to"), now, true) };
  const db = await getRuntimeDb();
  const [orderRows, itemRows, eventRows] = await Promise.all([db.select().from(orders).orderBy(desc(orders.createdAt)), db.select().from(orderItems), db.select().from(analyticsEvents)]);
  const data = buildAdminAnalytics(orderRows, itemRows, eventRows, range);
  const rows: Array<[string, string, number]> = [
    ["resumen", "pedidos", data.summary.orders],
    ["resumen", "valor_vendido", data.summary.grossSales],
    ["resumen", "ingresos_cobrados", data.summary.income],
    ["resumen", "ticket_promedio", data.summary.averageTicket],
    ...data.products.map((row) => ["producto_unidades", row.label, row.total] as [string, string, number]),
    ...data.productRevenue.map((row) => ["producto_ingresos", row.label, row.total] as [string, string, number]),
    ...data.cities.map((row) => ["ciudad", row.label, row.total] as [string, string, number]),
    ...data.paymentMethods.map((row) => ["metodo_pago", row.label, row.total] as [string, string, number]),
    ...data.coupons.map((row) => ["cupon", row.label, row.total] as [string, string, number]),
    ...data.utmSources.map((row) => ["utm_fuente", row.label, row.total] as [string, string, number]),
    ...data.utmCampaigns.map((row) => ["utm_campana", row.label, row.total] as [string, string, number]),
    ...data.funnel.map((row) => ["embudo", row.eventName, row.total] as [string, string, number]),
  ];
  const csv = [["grupo", "dimension", "valor"], ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const exportId = crypto.randomUUID();
  await db.insert(auditLogs).values({ userId: session.user.id, action: "analytics.csv.export", entityType: "export", entityId: exportId, after: { from: range.from.toISOString(), to: range.to.toISOString(), rows: rows.length } });
  return new Response(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="analitica-${range.from.toISOString().slice(0, 10)}-${range.to.toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store", "x-content-type-options": "nosniff" } });
}
