import type { Metadata } from "next";
import { desc, eq, sql } from "drizzle-orm";
import { BarChart3, ClipboardList, PackageSearch, Wallet } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { inventoryItems, orders, products } from "@/infrastructure/db/schema";

export const metadata: Metadata = { title: "Resumen" };

export default async function AdminDashboardPage() {
  await requirePermission("dashboard", "read");
  const db = await getRuntimeDb();
  const [metrics, recent, inventory] = await Promise.all([
    db.select({
      count: sql<number>`count(*)`,
      sales: sql<number>`coalesce(sum(${orders.total}), 0)`,
      average: sql<number>`coalesce(avg(${orders.total}), 0)`,
    }).from(orders),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
    db.select({ item: inventoryItems, product: products }).from(inventoryItems).innerJoin(products, eq(products.id, inventoryItems.productId)),
  ]);
  const lowStock = inventory.filter(({ item, product }) => item.quantityOnHand - item.quantityReserved <= product.lowStockThreshold).length;
  const cards = [
    { label: "Ventas registradas", value: `$${Number(metrics[0]?.sales ?? 0).toLocaleString("es-CO")}`, icon: Wallet },
    { label: "Pedidos", value: String(metrics[0]?.count ?? 0), icon: ClipboardList },
    { label: "Ticket promedio", value: `$${Math.round(Number(metrics[0]?.average ?? 0)).toLocaleString("es-CO")}`, icon: BarChart3 },
    { label: "Stock bajo", value: String(lowStock), icon: PackageSearch },
  ];
  return <>
    <AdminPageHeader title="Resumen" description="Indicadores calculados desde la base de datos." />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card) => <Card key={card.label}><CardContent><div className="flex justify-between text-sm text-text-muted"><span>{card.label}</span><card.icon className="h-4 w-4" /></div><p className="mt-3 text-2xl font-semibold">{card.value}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardContent><h2 className="font-semibold">Pedidos recientes</h2>{recent.length ? <ul className="mt-4 divide-y">{recent.map((order) => <li key={order.id} className="flex justify-between py-3 text-sm"><span>{order.orderNumber} · {order.customerFullName}</span><span>${order.total.toLocaleString("es-CO")} · {order.status}</span></li>)}</ul> : <p className="mt-6 text-sm text-text-muted">Todavía no hay pedidos.</p>}</CardContent></Card>
  </>;
}
