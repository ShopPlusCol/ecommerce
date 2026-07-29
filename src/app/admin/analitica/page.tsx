import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { analyticsEvents, orderItems, orders } from "@/infrastructure/db/schema";
import { buildAdminAnalytics, percentChange } from "@/modules/analytics/admin-analytics";
import { requirePermission } from "@/modules/auth/session";
import { adminStatusLabel } from "@/modules/admin/status-labels";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function dateValue(value: string | undefined, fallback: Date, end = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}-05:00`);
  return Number.isNaN(date.valueOf()) ? fallback : date;
}

function Metric({ label, value, comparison }: { label: string; value: string; comparison?: number | null }) {
  return <article className="rounded-xl border border-border bg-surface-raised p-5"><p className="text-sm font-medium text-text-muted">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>{comparison === null ? <p className="mt-1 text-xs text-text-muted">Sin base previa comparable</p> : comparison !== undefined ? <p className={`mt-1 text-xs font-semibold ${comparison >= 0 ? "text-success" : "text-danger"}`}>{comparison >= 0 ? "+" : ""}{comparison}% frente al periodo anterior</p> : null}</article>;
}

function Ranking({ title, rows, moneyValues = false, empty }: { title: string; rows: Array<{ label: string; total: number }>; moneyValues?: boolean; empty: string }) {
  const max = rows[0]?.total || 1;
  return <section className="rounded-xl border border-border bg-surface-raised p-5"><h2 className="text-lg font-semibold">{title}</h2>{rows.length ? <ol className="mt-4 grid gap-3">{rows.slice(0, 8).map((row) => <li key={row.label}><div className="flex justify-between gap-4 text-sm"><span className="truncate">{adminStatusLabel(row.label)}</span><strong className="tabular-nums">{moneyValues ? money.format(row.total) : row.total.toLocaleString("es-CO")}</strong></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (row.total / max) * 100)}%` }} /></div></li>)}</ol> : <div className="mt-4 rounded-lg border border-dashed border-border-strong p-6 text-center text-sm text-text-muted">{empty}</div>}</section>;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; tab?: string }> }) {
  await requirePermission("dashboard", "read");
  const query = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  defaultFrom.setHours(0, 0, 0, 0);
  const range = { from: dateValue(query.from, defaultFrom), to: dateValue(query.to, now, true) };
  const db = await getRuntimeDb();
  const [orderRows, itemRows, eventRows] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(orderItems),
    db.select().from(analyticsEvents).orderBy(desc(analyticsEvents.createdAt)),
  ]);
  const analytics = buildAdminAnalytics(orderRows, itemRows, eventRows, range);
  const from = range.from.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const to = range.to.toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
  const technical = query.tab === "events";
  return (
    <>
      <AdminPageHeader title="Analítica" description="Resultados comerciales calculados desde pedidos reales. Los eventos técnicos se mantienen separados." actions={<a href={`/api/admin/exports/analytics?from=${from}&to=${to}`} className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold">Exportar CSV</a>} />
      <div className="mb-5 flex gap-2 border-b border-border" role="tablist" aria-label="Vistas de analítica"><Link role="tab" aria-selected={!technical} href={`/admin/analitica?from=${from}&to=${to}`} className={`border-b-2 px-4 py-3 text-sm font-semibold ${!technical ? "border-brand text-brand" : "border-transparent text-text-muted"}`}>Negocio</Link><Link role="tab" aria-selected={technical} href={`/admin/analitica?tab=events&from=${from}&to=${to}`} className={`border-b-2 px-4 py-3 text-sm font-semibold ${technical ? "border-brand text-brand" : "border-transparent text-text-muted"}`}>Eventos técnicos</Link></div>
      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><input type="hidden" name="tab" value={technical ? "events" : ""} /><label className="grid gap-1 text-sm font-semibold">Desde<input className="h-11 rounded-lg border border-border px-3" type="date" name="from" defaultValue={from} /></label><label className="grid gap-1 text-sm font-semibold">Hasta<input className="h-11 rounded-lg border border-border px-3" type="date" name="to" defaultValue={to} /></label><button className="h-11 rounded-lg bg-brand px-5 text-sm font-semibold text-white">Comparar periodo</button></form>
      {technical ? <section className="rounded-xl border border-border bg-surface-raised"><div className="border-b border-border p-5"><h2 className="text-lg font-semibold">Registro técnico de eventos</h2><p className="mt-1 text-sm text-text-muted">Diagnóstico de deduplicación y entrega. No reemplaza las ventas confirmadas del servidor.</p></div>{eventRows.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="p-3">Evento</th><th className="p-3">Identificador</th><th className="p-3 text-right">Valor</th><th className="p-3">Servidor</th><th className="p-3">Navegador</th><th className="p-3">Fecha</th></tr></thead><tbody>{eventRows.map((event) => <tr key={event.id} className="border-b border-border/70"><td className="p-3 font-semibold">{event.eventName}</td><td className="p-3 font-mono text-xs">{event.eventId}</td><td className="p-3 text-right tabular-nums">{event.value ? money.format(event.value) : "—"}</td><td className="p-3">{event.sentToServer ? "Enviado" : "Pendiente"}</td><td className="p-3">{event.sentToBrowser ? "Enviado" : "Pendiente"}</td><td className="p-3">{event.createdAt.toLocaleString("es-CO")}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><h3 className="font-semibold">Todavía no hay eventos consentidos</h3><p className="mt-1 text-sm text-text-muted">Los eventos aparecerán aquí cuando exista actividad y consentimiento aplicable.</p></div>}</section> : <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Ventas" value={analytics.summary.orders.toLocaleString("es-CO")} comparison={percentChange(analytics.summary.orders, analytics.summary.previousOrders)} /><Metric label="Valor vendido" value={money.format(analytics.summary.grossSales)} /><Metric label="Ingresos cobrados" value={money.format(analytics.summary.income)} comparison={percentChange(analytics.summary.income, analytics.summary.previousIncome)} /><Metric label="Ticket promedio" value={money.format(analytics.summary.averageTicket)} /></div>
        <p className="my-4 text-xs text-text-muted">Se excluyen borradores, cancelados, devueltos y reembolsados. Ingresos corresponde exclusivamente al monto efectivamente pagado.</p>
        <div className="grid gap-5 xl:grid-cols-2"><Ranking title="Productos por unidades" rows={analytics.products} empty="Todavía no hay productos vendidos en este periodo." /><Ranking title="Ingresos por producto" rows={analytics.productRevenue} moneyValues empty="Todavía no hay ingresos atribuibles a productos." /><Ranking title="Ciudades" rows={analytics.cities} empty="Todavía no hay ciudades con pedidos reales." /><Ranking title="Métodos de pago" rows={analytics.paymentMethods} empty="Todavía no hay métodos de pago utilizados." /><Ranking title="Cupones" rows={analytics.coupons} empty="No se usaron cupones en este periodo." /><Ranking title="Fuentes UTM" rows={analytics.utmSources} empty="No hay pedidos atribuidos a una fuente UTM." /><Ranking title="Campañas UTM" rows={analytics.utmCampaigns} empty="No hay pedidos atribuidos a campañas UTM." />
          <section className="rounded-xl border border-border bg-surface-raised p-5"><h2 className="text-lg font-semibold">Embudo consentido</h2><p className="mt-1 text-sm text-text-muted">Conteos técnicos del periodo; Purchase solo se origina tras confirmación backend.</p><ol className="mt-4 grid gap-3">{analytics.funnel.map((stage, index) => <li key={stage.eventName} className="flex items-center justify-between rounded-lg bg-surface-sunken px-4 py-3"><span className="text-sm font-semibold">{index + 1}. {adminStatusLabel(stage.eventName)}</span><strong className="tabular-nums">{stage.total}</strong></li>)}</ol></section>
        </div>
      </>}
    </>
  );
}
