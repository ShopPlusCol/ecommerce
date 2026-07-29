import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { AlertTriangle, BarChart3, ClipboardList, PackageSearch, Wallet } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, auditLogs, inventoryItems, manualTransferProofs, orderItems, orders, products } from "@/infrastructure/db/schema";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { auditActionLabel } from "@/modules/audit/admin-audit";
import { requirePermission } from "@/modules/auth/session";

export const metadata: Metadata = { title: "Resumen" };
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default async function AdminDashboardPage() {
  await requirePermission("dashboard", "read");
  const db = await getRuntimeDb();
  const [orderRows, itemRows, recent, inventory, proofs, activity] = await Promise.all([
    db.select().from(orders),
    db.select().from(orderItems),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.select({ item: inventoryItems, product: products }).from(inventoryItems).innerJoin(products, eq(products.id, inventoryItems.productId)),
    db.select().from(manualTransferProofs),
    db.select({ log: auditLogs, actor: adminUsers.fullName }).from(auditLogs).leftJoin(adminUsers, eq(adminUsers.id, auditLogs.userId)).orderBy(desc(auditLogs.createdAt)).limit(8),
  ]);
  const real = orderRows.filter((order) => !["draft", "cancelled", "returned", "refunded"].includes(order.status));
  const realIds = new Set(real.map((order) => order.id));
  const income = real.reduce((sum, order) => sum + order.amountPaid, 0);
  const sold = real.reduce((sum, order) => sum + order.total, 0);
  const pending = real.filter((order) => !["delivered"].includes(order.status)).length;
  const lowRows = inventory.filter(({ item, product }) => item.quantityOnHand - item.quantityReserved <= product.lowStockThreshold);
  const productTotals = new Map<string, number>();
  itemRows.filter((item) => realIds.has(item.orderId)).forEach((item) => productTotals.set(item.name, (productTotals.get(item.name) ?? 0) + item.quantity));
  const topProducts = [...productTotals].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const integrationsPending = [
    !process.env.MERCADO_PAGO_ACCESS_TOKEN,
    !(process.env.META_PIXEL_ID && process.env.META_CONVERSIONS_ACCESS_TOKEN),
    !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD),
  ].filter(Boolean).length;
  const cards = [
    { label: "Valor vendido", value: money.format(sold), help: `${real.length} ventas reales`, icon: Wallet },
    { label: "Ingresos cobrados", value: money.format(income), help: "Monto efectivamente pagado", icon: BarChart3 },
    { label: "Pedidos pendientes", value: String(pending), help: "Requieren seguimiento", icon: ClipboardList },
    { label: "Stock bajo", value: String(lowRows.length), help: "Referencias por atender", icon: PackageSearch },
  ];
  return <><AdminPageHeader title="Resumen operativo" description="Prioridades y métricas reales para decidir qué atender ahora." actions={<div className="flex flex-wrap gap-2"><Link href="/admin/pedidos" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Gestionar pedidos</Link><Link href="/admin/productos" className="rounded-md border border-border px-4 py-2 text-sm font-semibold">Crear producto</Link></div>} />
    {(proofs.some((proof) => proof.status === "pending") || lowRows.length || integrationsPending) ? <section className="mb-5 grid gap-2 rounded-xl border border-warning/30 bg-warning-soft p-4"><h2 className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" />Necesita atención</h2>{proofs.filter((proof) => proof.status === "pending").length ? <Link href="/admin/pagos" className="text-sm underline">{proofs.filter((proof) => proof.status === "pending").length} comprobantes por revisar</Link> : null}{lowRows.length ? <Link href="/admin/inventario?stock=low" className="text-sm underline">{lowRows.length} referencias con stock bajo</Link> : null}{integrationsPending ? <Link href="/admin/integraciones" className="text-sm underline">{integrationsPending} integraciones pendientes de configuración</Link> : null}</section> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <article key={card.label} className="rounded-xl border border-border bg-surface-raised p-5"><div className="flex justify-between text-sm text-text-muted"><span>{card.label}</span><card.icon className="h-4 w-4" /></div><p className="mt-3 text-2xl font-semibold tabular-nums">{card.value}</p><p className="mt-1 text-xs text-text-muted">{card.help}</p></article>)}</div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2"><section className="rounded-xl border border-border bg-surface-raised"><div className="flex items-center justify-between border-b border-border p-5"><h2 className="text-lg font-semibold">Pedidos recientes</h2><Link href="/admin/pedidos" className="text-sm font-semibold text-brand">Ver todos</Link></div>{recent.length ? <ul className="divide-y divide-border">{recent.map((order) => <li key={order.id}><Link href={`/admin/pedidos/${order.id}`} className="flex flex-col justify-between gap-2 p-4 transition hover:bg-surface-sunken sm:flex-row sm:items-center"><span><strong>{order.orderNumber}</strong><span className="ml-2 text-sm text-text-muted">{order.customerFullName}</span></span><span className="text-sm"><strong>{money.format(order.total)}</strong><span className="ml-2 rounded-full bg-surface-sunken px-2 py-1 text-xs">{adminStatusLabel(order.status)}</span></span></Link></li>)}</ul> : <div className="p-10 text-center"><h3 className="font-semibold">Todavía no hay pedidos</h3><p className="mt-1 text-sm text-text-muted">Los pedidos confirmados en la tienda aparecerán aquí.</p></div>}</section>
      <section className="rounded-xl border border-border bg-surface-raised p-5"><h2 className="text-lg font-semibold">Productos más vendidos</h2>{topProducts.length ? <ol className="mt-4 grid gap-3">{topProducts.map(([name, quantity], index) => <li key={name} className="flex justify-between rounded-lg bg-surface-sunken px-4 py-3 text-sm"><span>{index + 1}. {name}</span><strong>{quantity} unidades</strong></li>)}</ol> : <div className="mt-4 rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-text-muted">Aparecerán cuando existan ventas reales.</div>}</section>
      <section className="rounded-xl border border-border bg-surface-raised p-5 xl:col-span-2"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Actividad reciente</h2><Link href="/admin/auditoria" className="text-sm font-semibold text-brand">Abrir auditoría</Link></div>{activity.length ? <ol className="mt-4 grid gap-3 sm:grid-cols-2">{activity.map(({ log, actor }) => <li key={log.id} className="rounded-lg border border-border p-3"><p className="text-sm font-semibold">{auditActionLabel(log.action)}</p><p className="mt-1 text-xs text-text-muted">{actor || "Sistema"} · {log.createdAt.toLocaleString("es-CO")}</p></li>)}</ol> : <p className="mt-4 text-sm text-text-muted">Aún no hay actividad sensible registrada.</p>}</section></div>
  </>;
}
