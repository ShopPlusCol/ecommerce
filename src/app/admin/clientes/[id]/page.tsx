import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminRecordList } from "@/components/admin/admin-record-list";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { customerAddresses, customers, orders } from "@/infrastructure/db/schema";
import { CustomerEditor } from "../customer-editor";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("customers", "read");
  const { id } = await params;
  const db = await getRuntimeDb();
  const [[customer], addresses, orderRows] = await Promise.all([
    db.select().from(customers).where(eq(customers.id, id)).limit(1),
    db.select().from(customerAddresses).where(eq(customerAddresses.customerId, id)),
    db.select().from(orders).where(eq(orders.customerId, id)).orderBy(desc(orders.createdAt)),
  ]);
  if (!customer) notFound();
  const totalSpent = orderRows.filter((order) => order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0);
  return (
    <>
      <AdminPageHeader title={customer.fullName} description={`${orderRows.length} pedidos · $${totalSpent.toLocaleString("es-CO")} pagados · ${addresses.length} direcciones`} />
      <CustomerEditor customer={{ ...customer, blockedAt: customer.blockedAt?.toISOString() ?? null }} />
      <div className="mt-8"><AdminRecordList title="Historial de pedidos" description="Pedidos asociados a este perfil." columns={["Pedido", "Fecha", "Total", "Pago", "Estado"]} rows={orderRows.map((order) => ({ id: order.id, href: `/admin/pedidos/${order.id}`, values: [order.orderNumber, order.createdAt.toLocaleDateString("es-CO"), `$${order.total.toLocaleString("es-CO")}`, order.paymentStatus, order.status] }))} /></div>
    </>
  );
}
