import type { Metadata } from "next";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { orders } from "@/infrastructure/db/schema";
import { ORDER_STATUSES } from "@/infrastructure/db/schema/orders";
import { changeOrderStatusAction } from "../actions";

export const metadata: Metadata = { title: "Pedidos" };
export default async function AdminOrdersPage() {
  await requirePermission("orders", "read");
  const db = await getRuntimeDb();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return <>
    <AdminPageHeader title="Pedidos" description={`${rows.length} pedidos reales.`} />
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised"><table className="w-full text-sm">
      <thead><tr className="border-b text-left"><th className="p-3">Pedido</th><th>Cliente</th><th>Ciudad</th><th>Total</th><th>Pago</th><th>Estado</th></tr></thead>
      <tbody>{rows.map((order) => <tr key={order.id} className="border-b align-top"><td className="p-3 font-medium"><Link href={`/admin/pedidos/${order.id}`} className="text-brand hover:underline">{order.orderNumber}</Link></td><td>{order.customerFullName}<br />{order.customerPhone}</td><td>{order.shippingCity}</td><td>${order.total.toLocaleString("es-CO")}</td><td>{order.paymentStatus}</td>
        <td><form action={changeOrderStatusAction} className="flex min-w-72 gap-2 p-2"><input type="hidden" name="id" value={order.id} /><select name="status" defaultValue={order.status} className="rounded border p-1">{ORDER_STATUSES.map((status) => <option key={status}>{status}</option>)}</select><input name="note" placeholder="Nota" className="w-28 rounded border p-1" /><button className="rounded border px-2">Guardar</button></form></td></tr>)}</tbody>
    </table></div>
  </>;
}
