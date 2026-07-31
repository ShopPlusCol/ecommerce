import { eq } from "drizzle-orm";
import { requirePermission } from "@/modules/auth/session";
import { csvCell } from "@/modules/csv/products";
import { inventoryAvailable } from "@/modules/inventory/admin-inventory";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, inventoryItems, products } from "@/infrastructure/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requirePermission("inventory", "export");
  const db = await getRuntimeDb();
  const rows = await db
    .select({ item: inventoryItems, product: products })
    .from(inventoryItems)
    .innerJoin(products, eq(products.id, inventoryItems.productId));
  const csv = [
    "sku,producto,estado,fisico,reservado,disponible,vendido,umbral_bajo",
    ...rows.map(({ item, product }) =>
      [
        product.sku,
        product.name,
        product.status,
        item.quantityOnHand,
        item.quantityReserved,
        inventoryAvailable(item),
        item.quantitySold,
        product.lowStockThreshold,
      ]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "inventory.csv.export",
    entityType: "export",
    entityId: crypto.randomUUID(),
    after: { rows: rows.length },
  });
  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="inventario.csv"',
      "cache-control": "no-store",
    },
  });
}
