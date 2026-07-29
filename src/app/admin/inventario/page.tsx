import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { inventoryItems, products } from "@/infrastructure/db/schema";
import { adjustInventoryAction } from "../actions";

export const metadata: Metadata = { title: "Inventario" };
export default async function AdminInventoryPage() {
  await requirePermission("inventory", "read");
  const db = await getRuntimeDb();
  const rows = await db.select({ item: inventoryItems, product: products }).from(inventoryItems).innerJoin(products, eq(products.id, inventoryItems.productId));
  return <>
    <AdminPageHeader title="Inventario" description="Disponible, reservado y vendido con ajuste auditable." />
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised"><table className="w-full text-sm">
      <thead><tr className="border-b text-left"><th className="p-3">Producto</th><th>Disponible</th><th>Reservado</th><th>Vendido</th><th>Ajuste</th></tr></thead>
      <tbody>{rows.map(({ item, product }) => <tr key={item.id} className="border-b"><td className="p-3">{product.name}</td><td>{item.quantityOnHand - item.quantityReserved}</td><td>{item.quantityReserved}</td><td>{item.quantitySold}</td>
        <td><form action={adjustInventoryAction} className="flex gap-2 p-2"><input type="hidden" name="itemId" value={item.id} /><input name="delta" type="number" required placeholder="+/-" className="w-20 rounded border p-1" /><input name="reason" required placeholder="Motivo" className="rounded border p-1" /><button className="rounded border px-2">Aplicar</button></form></td></tr>)}</tbody>
    </table></div>
  </>;
}
