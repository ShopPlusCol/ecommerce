"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { actionError, type AdminActionState } from "@/modules/admin/action-state";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { auditLogs, collectionProducts, productCategories, productMedia, products } from "@/infrastructure/db/schema";

const schema = z.object({
  id: z.string().min(1),
  updatedAt: z.string().datetime(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(2).max(50),
  status: z.enum(["draft", "active", "archived"]),
  shortDescription: z.string().trim().max(240),
  description: z.string().trim().max(10_000),
  price: z.coerce.number().int().nonnegative(),
  compareAtPrice: z.union([z.literal(""), z.coerce.number().int().nonnegative()]).transform((value) => value === "" ? null : value),
  costPrice: z.union([z.literal(""), z.coerce.number().int().nonnegative()]).transform((value) => value === "" ? null : value),
  colorFamilyId: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().nonnegative(),
  weightGrams: z.union([z.literal(""), z.coerce.number().int().positive()]).transform((value) => value === "" ? null : value),
  seoTitle: z.string().trim().max(120),
  seoDescription: z.string().trim().max(240),
  order: z.coerce.number().int(),
  media: z.string(),
});

export async function updateProductDetailAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const session = await requirePermission("catalog", "update");
    const parsed = schema.parse(Object.fromEntries(formData));
    if (parsed.compareAtPrice !== null && parsed.compareAtPrice <= parsed.price) {
      return { status: "error", message: "El precio comparativo debe ser mayor que el precio de venta." };
    }
    const mediaRows = parsed.media.split("\n").map((line) => line.trim()).filter(Boolean).map((line, order) => {
      const [url, ...altParts] = line.split("|");
      if (!url?.startsWith("/")) {
        try { new URL(url); } catch { throw new Error(`La URL de imagen “${url}” no es válida.`); }
      }
      return { url, altText: altParts.join("|").trim() || parsed.name, order };
    });
    if (parsed.status === "active" && (!parsed.shortDescription || !parsed.description || mediaRows.length === 0)) {
      return { status: "error", message: "Para activar el producto completa ambas descripciones y al menos una imagen." };
    }
    const db = await getRuntimeDb();
    const [before] = await db.select().from(products).where(eq(products.id, parsed.id)).limit(1);
    if (!before) return { status: "error", message: "El producto ya no existe." };
    const [updated] = await db
      .update(products)
      .set({
        name: parsed.name,
        slug: parsed.slug,
        sku: parsed.sku,
        status: parsed.status,
        shortDescription: parsed.shortDescription || null,
        description: parsed.description || null,
        price: parsed.price,
        compareAtPrice: parsed.compareAtPrice,
        costPrice: parsed.costPrice,
        colorFamilyId: parsed.colorFamilyId || null,
        allowBackorder: formData.get("allowBackorder") === "on",
        lowStockThreshold: parsed.lowStockThreshold,
        featured: formData.get("featured") === "on",
        weightGrams: parsed.weightGrams,
        seoTitle: parsed.seoTitle || null,
        seoDescription: parsed.seoDescription || null,
        order: parsed.order,
        publishedAt: parsed.status === "active" ? before.publishedAt ?? new Date() : before.publishedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, parsed.id), eq(products.updatedAt, new Date(parsed.updatedAt))))
      .returning();
    if (!updated) return { status: "error", message: "Otra persona editó el producto. Recarga antes de guardar." };

    await db.delete(productCategories).where(eq(productCategories.productId, parsed.id));
    const categoryIds = formData.getAll("categoryIds").map(String);
    if (categoryIds.length) await db.insert(productCategories).values(categoryIds.map((categoryId) => ({ productId: parsed.id, categoryId })));
    await db.delete(collectionProducts).where(eq(collectionProducts.productId, parsed.id));
    const collectionIds = formData.getAll("collectionIds").map(String);
    if (collectionIds.length) await db.insert(collectionProducts).values(collectionIds.map((collectionId, order) => ({ productId: parsed.id, collectionId, order })));
    await db.delete(productMedia).where(eq(productMedia.productId, parsed.id));
    if (mediaRows.length) await db.insert(productMedia).values(mediaRows.map((media) => ({ ...media, productId: parsed.id })));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "product.update",
      entityType: "product",
      entityId: parsed.id,
      before: { sku: before.sku, status: before.status, price: before.price },
      after: { sku: updated.sku, status: updated.status, price: updated.price, categories: categoryIds, collections: collectionIds, mediaCount: mediaRows.length },
    });
    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${parsed.id}`);
    revalidatePath("/catalogo");
    revalidatePath(`/productos/${updated.slug}`);
    revalidatePath("/", "layout");
    return { status: "success", message: "Producto, relaciones e imágenes guardados." };
  } catch (error) {
    return actionError(error);
  }
}
