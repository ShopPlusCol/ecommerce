import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRecordList } from "@/components/admin/admin-record-list";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { orderAdjustments, orderItems, orders, orderStatusHistory, payments, shipments } from "@/infrastructure/db/schema";
import { ORDER_STATUS_TRANSITIONS, type OrderStatus } from "@/domain/services/order-status";
import { adminStatusLabel } from "@/modules/admin/status-labels";
import { changeOrderStatusAction } from "../../actions";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("orders", "read");
  const { id } = await params;
  const db = await getRuntimeDb();
  const [[order], items, adjustments, paymentRows, shipmentRows, history] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, id)).limit(1),
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderAdjustments).where(eq(orderAdjustments.orderId, id)),
    db.select().from(payments).where(eq(payments.orderId, id)),
    db.select().from(shipments).where(eq(shipments.orderId, id)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, id)).orderBy(desc(orderStatusHistory.createdAt)),
  ]);
  if (!order) notFound();
  return (
    <>
      <AdminPageHeader title={order.orderNumber} description={`Creado ${order.createdAt.toLocaleString("es-CO")} · ${order.customerFullName}`} actions={<Link href={`/admin/clientes/${order.customerId}`} className="rounded-md border border-border px-4 py-2 text-sm font-semibold">Ver cliente</Link>} />
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2>Resumen</h2>
          <dl className="mt-4 grid gap-2 text-sm"><div className="flex justify-between"><dt>Estado</dt><dd><AdminStatusBadge status={order.status} /></dd></div><div className="flex justify-between"><dt>Pago</dt><dd>{adminStatusLabel(order.paymentStatus)}</dd></div><div className="flex justify-between"><dt>Total</dt><dd className="font-semibold">${order.total.toLocaleString("es-CO")}</dd></div><div className="flex justify-between"><dt>Pagado</dt><dd>${order.amountPaid.toLocaleString("es-CO")}</dd></div><div className="flex justify-between"><dt>Contraentrega</dt><dd>${order.amountDueOnDelivery.toLocaleString("es-CO")}</dd></div></dl>
        </section>
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2>Entrega</h2>
          <p className="mt-4 text-sm">{order.shippingAddressLine}<br />{order.shippingAddressComplement}<br />{order.shippingNeighborhood}, {order.shippingCity}<br />{order.shippingDepartment}</p>
          {order.deliveryInstructions ? <p className="mt-3 rounded-md bg-surface-sunken p-3 text-sm">{order.deliveryInstructions}</p> : null}
        </section>
        <section className="rounded-xl border border-border bg-surface-raised p-5">
          <h2>Cambiar estado</h2>
          {(() => {
            const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status as OrderStatus];
            if (nextStatuses.length === 0) {
              return <p className="mt-4 text-sm text-text-muted">Este pedido está en un estado final; no admite más cambios.</p>;
            }
            return (
              <form action={changeOrderStatusAction} className="mt-4 grid gap-3">
                <input type="hidden" name="id" value={order.id} />
                <select name="status" defaultValue={nextStatuses[0]} className="h-10 rounded-md border px-3">
                  {nextStatuses.map((status) => <option key={status} value={status}>{adminStatusLabel(status)}</option>)}
                </select>
                <textarea name="note" required maxLength={500} placeholder="Motivo o nota operativa" className="min-h-20 rounded-md border p-3 text-sm" />
                <button className="h-10 rounded-md bg-brand font-semibold text-white">Guardar estado</button>
              </form>
            );
          })()}
        </section>
      </div>
      <AdminRecordList title="Productos" description={`${items.length} líneas del pedido; son instantáneas y no cambian con el catálogo.`} columns={["Producto", "SKU", "Cantidad", "Precio", "Descuento"]} rows={items.map((item) => ({ id: item.id, values: [item.name, item.sku, item.quantity, `$${item.unitPrice.toLocaleString("es-CO")}`, `$${item.discount.toLocaleString("es-CO")}`] }))} />
      <div className="mt-8"><AdminRecordList title="Pagos y envíos" description={`${paymentRows.length} pagos · ${shipmentRows.length} envíos · ${adjustments.length} ajustes.`} columns={["Referencia", "Proveedor", "Monto", "Propósito", "Estado"]} rows={paymentRows.map((payment) => ({ id: payment.id, values: [payment.externalReference, payment.provider, `$${payment.amount.toLocaleString("es-CO")}`, payment.purpose, adminStatusLabel(payment.status)] }))} /></div>
      <div className="mt-8"><AdminRecordList title="Historial de estados" description="Trazabilidad inmutable de cambios operativos." columns={["Fecha", "Desde", "Hacia", "Nota", "Usuario"]} rows={history.map((entry) => ({ id: entry.id, values: [entry.createdAt.toLocaleString("es-CO"), entry.fromStatus ? adminStatusLabel(entry.fromStatus) : "Inicio", adminStatusLabel(entry.toStatus), entry.note, entry.changedByUserId] }))} /></div>
    </>
  );
}
