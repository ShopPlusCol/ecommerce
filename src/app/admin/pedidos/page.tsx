import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { ClipboardList } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminDataResetForm } from "@/components/admin/admin-data-reset-form";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { requirePermission } from "@/modules/auth/session";
import { resetConfirmation } from "@/modules/admin/data-reset";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { orders } from "@/infrastructure/db/schema";
import { ORDER_STATUSES } from "@/infrastructure/db/schema/orders";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/domain/services/order-status";
import { changeOrderStatusAction } from "../actions";
import { clearOrdersAction } from "../data-reset-actions";

export const metadata: Metadata = { title: "Pedidos" };

const PAGE_SIZE = 30;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const session = await requirePermission("orders", "read");
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const statusFilter = params.status ?? "all";
  const page = Math.max(1, Number(params.page) || 1);
  const db = await getRuntimeDb();
  const filters = and(
    query
      ? or(
          like(orders.orderNumber, `%${query}%`),
          like(orders.customerFullName, `%${query}%`),
          like(orders.customerPhone, `%${query}%`),
          like(orders.shippingCity, `%${query}%`),
        )
      : undefined,
    statusFilter !== "all" ? eq(orders.status, statusFilter as OrderStatus) : undefined,
  );
  const [rows, countRows, [{ total: totalRows }]] = await Promise.all([
    db.select().from(orders).where(filters).orderBy(desc(orders.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)` }).from(orders).where(filters),
    db.select({ total: sql<number>`count(*)` }).from(orders),
  ]);
  const filteredTotal = Number(countRows[0]?.count ?? 0);
  const params_ = new URLSearchParams(Object.entries(params).filter(([key, value]) => key !== "page" && value).map(([key, value]) => [key, value!]));

  return (
    <>
      <AdminPageHeader title="Pedidos" description={`${totalRows} pedido${Number(totalRows) === 1 ? "" : "s"} reales.`} />
      <form className="mb-5 grid gap-3 rounded-xl border border-border bg-surface-raised p-4 md:grid-cols-[minmax(220px,1fr)_220px_auto]">
        <label className="grid gap-1 text-xs font-semibold">
          Buscar
          <input name="q" defaultValue={params.q} placeholder="Número, cliente, teléfono o ciudad" className="h-10 rounded-md border border-border px-3 text-sm font-normal" />
        </label>
        <label className="grid gap-1 text-xs font-semibold">
          Estado
          <select name="status" defaultValue={statusFilter} className="h-10 rounded-md border border-border px-3 text-sm font-normal">
            <option value="all">Todos</option>
            {ORDER_STATUSES.map((status) => <option key={status} value={status}>{adminStatusLabel(status)}</option>)}
          </select>
        </label>
        <button className="h-10 self-end rounded-md bg-text px-5 text-sm font-semibold text-text-inverted">Aplicar</button>
      </form>
      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised">
        <div className="border-b border-border p-4">
          <h2>Pedidos</h2>
          <p className="mt-1 text-sm text-text-muted">{filteredTotal} pedido(s) coinciden con los filtros.</p>
        </div>
        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-surface-sunken/70 text-left">
                <tr>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Ciudad</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3">Cambiar estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((order) => {
                  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus];
                  return (
                    <tr key={order.id} className="border-t border-border align-top hover:bg-surface-sunken/30">
                      <td className="p-3">
                        <Link href={`/admin/pedidos/${order.id}`} className="font-semibold text-brand hover:underline">{order.orderNumber}</Link>
                        <span className="mt-0.5 block"><AdminStatusBadge status={order.status} /></span>
                      </td>
                      <td className="p-3 font-medium">{order.customerFullName}<span className="block text-xs font-normal text-text-muted">{order.customerPhone}</span></td>
                      <td className="p-3">{order.shippingCity}</td>
                      <td className="p-3 text-right font-semibold tabular-nums">${order.total.toLocaleString("es-CO")}</td>
                      <td className="p-3"><AdminStatusBadge status={order.paymentStatus} /></td>
                      <td className="p-3">
                        {nextStatuses.length ? (
                          <form action={changeOrderStatusAction} className="flex min-w-64 flex-wrap items-center gap-2">
                            <input type="hidden" name="id" value={order.id} />
                            <select name="status" defaultValue={nextStatuses[0]} className="h-8 rounded-md border border-border px-2 text-xs">
                              {nextStatuses.map((status) => <option key={status} value={status}>{adminStatusLabel(status)}</option>)}
                            </select>
                            <input name="note" required placeholder="Nota obligatoria" className="h-8 w-28 rounded-md border border-border px-2 text-xs" />
                            <button className="h-8 rounded-md border border-border px-3 text-xs font-semibold">Guardar</button>
                          </form>
                        ) : (
                          <span className="text-xs text-text-muted">Estado final</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-text-subtle" />
            <h3 className="mt-3">{Number(totalRows) ? "No hay pedidos con estos filtros" : "Todavía no hay pedidos"}</h3>
            <p className="mt-1 text-sm text-text-muted">{Number(totalRows) ? "Cambia la búsqueda o el estado." : "Aparecerán aquí en cuanto se confirme el primer pedido en la tienda."}</p>
          </div>
        )}
        {filteredTotal > PAGE_SIZE ? (
          <nav className="flex items-center justify-between border-t border-border p-4 text-sm" aria-label="Paginación de pedidos">
            <span>Página {page} de {Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE))}</span>
            <div className="flex gap-2">
              {page > 1 ? <a className="rounded-md border border-border px-3 py-2" href={`?${params_}&page=${page - 1}`}>Anterior</a> : null}
              {page * PAGE_SIZE < filteredTotal ? <a className="rounded-md border border-border px-3 py-2" href={`?${params_}&page=${page + 1}`}>Siguiente</a> : null}
            </div>
          </nav>
        ) : null}
      </section>
      {session.roles.includes("owner") ? (
        <div className="mt-8">
          <AdminDataResetForm
            title="Limpiar todos los pedidos"
            description="Elimina pedidos, pagos, envíos e historial relacionado; también libera todas las reservas de inventario. No elimina productos ni clientes."
            confirmation={resetConfirmation("orders")}
            action={clearOrdersAction}
          />
        </div>
      ) : null}
    </>
  );
}
