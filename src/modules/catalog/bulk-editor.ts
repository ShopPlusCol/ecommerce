import { z } from "zod";

const nullableMoney = z.union([z.number().int().nonnegative(), z.null()]);

export const bulkProductUpdateSchema = z.object({
  id: z.string().min(1),
  updatedAt: z.string().datetime(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El slug solo admite minúsculas, números y guiones."),
  sku: z.string().trim().min(2).max(50),
  status: z.enum(["draft", "active", "archived"]),
  price: z.number().int().nonnegative(),
  compareAtPrice: nullableMoney,
  shortDescription: z.string().trim().max(240),
  colorFamilyId: z.string().nullable(),
  categoryIds: z.array(z.string().min(1)),
  limitCategoryId: z.string().nullable(),
  maxUnitsPerCategoryUnit: z.number().int().positive().nullable(),
  imageUrl: z.string().trim(),
  imageAlt: z.string().trim().max(180),
  lowStockThreshold: z.number().int().nonnegative(),
  featured: z.boolean(),
  allowBackorder: z.boolean(),
});

export const bulkProductUpdatesSchema = z.array(bulkProductUpdateSchema).min(1, "Selecciona al menos un producto.");

export type BulkProductUpdate = z.infer<typeof bulkProductUpdateSchema>;

export function validateBulkProductUpdates(input: unknown) {
  const rows = bulkProductUpdatesSchema.parse(input);
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const skus = new Set<string>();
  for (const row of rows) {
    if (ids.has(row.id)) throw new Error("Un producto aparece duplicado en la edición.");
    if (slugs.has(row.slug)) throw new Error(`El slug “${row.slug}” está repetido en la selección.`);
    if (skus.has(row.sku)) throw new Error(`El SKU “${row.sku}” está repetido en la selección.`);
    if (row.compareAtPrice !== null && row.compareAtPrice <= row.price) {
      throw new Error(`El precio comparativo de “${row.name}” debe ser mayor al precio de venta.`);
    }
    ids.add(row.id);
    slugs.add(row.slug);
    skus.add(row.sku);
  }
  return rows;
}
