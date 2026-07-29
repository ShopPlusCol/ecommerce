"use server";

import { inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/modules/auth/session";
import { parseProductCsv, type CsvRejection } from "@/modules/csv/products";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, inventoryItems, products } from "@/infrastructure/db/schema";

export type ImportState = { accepted: number; rejected: CsvRejection[]; error?: string };
export async function importProductsCsvAction(_state: ImportState, formData: FormData): Promise<ImportState> {
  const session = await requirePermission("catalog", "create");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size > 2 * 1024 * 1024) return { accepted: 0, rejected: [], error: "Selecciona un CSV de máximo 2 MB." };
  const report = parseProductCsv(await file.text());
  if (!report.accepted.length) return { accepted: 0, rejected: report.rejected };
  const db = await getRuntimeDb();
  const existing = await db.select({ sku: products.sku, slug: products.slug }).from(products).where(or(
    inArray(products.sku, report.accepted.map((row) => row.sku)),
    inArray(products.slug, report.accepted.map((row) => row.slug)),
  ));
  const blocked = new Set(existing.flatMap((row) => [row.sku, row.slug]));
  const accepted = report.accepted.filter((row, index) => {
    if (!blocked.has(row.sku) && !blocked.has(row.slug)) return true;
    report.rejected.push({ row: index + 2, reason: "SKU o slug ya existe en la base de datos." });
    return false;
  });
  if (accepted.length) {
    const inserted = await db.insert(products).values(accepted.map((row) => ({
      ...row,
      publishedAt: row.status === "active" ? new Date() : null,
    }))).returning({ id: products.id });
    await db.insert(inventoryItems).values(inserted.map((row) => ({ productId: row.id })));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "products.csv.import",
      entityType: "product_batch",
      entityId: crypto.randomUUID(),
      after: { accepted: accepted.length, rejected: report.rejected.length },
    });
  }
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  return { accepted: accepted.length, rejected: report.rejected };
}
