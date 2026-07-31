"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { validateBulkProductUpdates, type BulkProductUpdate } from "@/modules/catalog/bulk-editor";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, productCategories, productMedia, products } from "@/infrastructure/db/schema";

export async function bulkUpdateProductsAction(input: BulkProductUpdate[]): Promise<AdminActionState> {
  try {
    const session = await requirePermission("catalog", "update");
    const rows = validateBulkProductUpdates(input);
    const db = await getRuntimeDb();
    let updatedCount = 0;
    const conflicts: string[] = [];

    for (const row of rows) {
      const [before] = await db.select().from(products).where(eq(products.id, row.id)).limit(1);
      if (!before) {
        conflicts.push(row.name);
        continue;
      }
      const existingMedia = await db
        .select()
        .from(productMedia)
        .where(eq(productMedia.productId, row.id))
        .orderBy(productMedia.order);
      if (
        row.status === "active" &&
        (!row.shortDescription || !before.description || (!row.imageUrl && existingMedia.length === 0))
      ) {
        conflicts.push(`${row.name} (faltan descripción o imagen para activarlo)`);
        continue;
      }

      let updated: typeof before | undefined;
      try {
        [updated] = await db
          .update(products)
          .set({
            name: row.name,
            slug: row.slug,
            sku: row.sku,
            status: row.status,
            price: row.price,
            compareAtPrice: row.compareAtPrice,
            shortDescription: row.shortDescription || null,
            colorFamilyId: row.colorFamilyId,
            limitCategoryId: row.limitCategoryId && row.maxUnitsPerCategoryUnit ? row.limitCategoryId : null,
            maxUnitsPerCategoryUnit: row.limitCategoryId && row.maxUnitsPerCategoryUnit ? row.maxUnitsPerCategoryUnit : null,
            lowStockThreshold: row.lowStockThreshold,
            featured: row.featured,
            allowBackorder: row.allowBackorder,
            publishedAt: row.status === "active" ? before.publishedAt ?? new Date() : before.publishedAt,
            updatedAt: new Date(),
          })
          .where(and(eq(products.id, row.id), eq(products.updatedAt, new Date(row.updatedAt))))
          .returning();
      } catch {
        conflicts.push(`${row.name} (el slug o SKU ya pertenece a otro producto)`);
        continue;
      }
      if (!updated) {
        conflicts.push(`${row.name} (cambió en otra sesión)`);
        continue;
      }

      await db.delete(productCategories).where(eq(productCategories.productId, row.id));
      if (row.categoryIds.length) {
        await db.insert(productCategories).values(
          row.categoryIds.map((categoryId) => ({ productId: row.id, categoryId })),
        );
      }
      const primaryMedia = existingMedia[0];
      if (row.imageUrl) {
        if (primaryMedia) {
          await db
            .update(productMedia)
            .set({ url: row.imageUrl, altText: row.imageAlt || row.name, updatedAt: new Date() })
            .where(eq(productMedia.id, primaryMedia.id));
        } else {
          await db.insert(productMedia).values({
            productId: row.id,
            url: row.imageUrl,
            altText: row.imageAlt || row.name,
            order: 0,
          });
        }
      }
      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: "product.bulk_update",
        entityType: "product",
        entityId: row.id,
        before: { name: before.name, sku: before.sku, status: before.status, price: before.price },
        after: {
          name: updated.name,
          sku: updated.sku,
          status: updated.status,
          price: updated.price,
          categoryCount: row.categoryIds.length,
          primaryImageChanged: Boolean(row.imageUrl && row.imageUrl !== primaryMedia?.url),
        },
      });
      updatedCount += 1;
    }

    revalidatePath("/admin/productos");
    revalidatePath("/admin/productos/edicion-masiva");
    revalidatePath("/catalogo");
    revalidatePath("/", "layout");
    if (conflicts.length) {
      return {
        status: "error",
        message: `${updatedCount} producto(s) guardado(s). Revisa: ${conflicts.join(", ")}.`,
      };
    }
    return { status: "success", message: `${updatedCount} producto(s) actualizados correctamente.` };
  } catch (error) {
    return actionError(error);
  }
}
