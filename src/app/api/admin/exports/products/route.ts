import { requirePermission } from "@/modules/auth/session";
import { csvCell } from "@/modules/csv/products";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, products } from "@/infrastructure/db/schema";

export async function GET() {
  const session = await requirePermission("catalog", "export");
  const db = await getRuntimeDb();
  const rows = await db.select().from(products);
  const csv = [
    "sku,name,slug,price,compareAtPrice,status",
    ...rows.map((row) => [row.sku, row.name, row.slug, row.price, row.compareAtPrice, row.status].map(csvCell).join(",")),
  ].join("\r\n");
  await db.insert(auditLogs).values({ userId: session.user.id, action: "products.csv.export", entityType: "export", entityId: crypto.randomUUID(), after: { rows: rows.length } });
  return new Response(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="productos.csv"', "cache-control": "no-store" } });
}
