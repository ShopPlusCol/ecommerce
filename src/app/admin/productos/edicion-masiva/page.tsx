import { asc } from "drizzle-orm";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { categories, colorFamilies, mediaAssets, productCategories, productMedia, products } from "@/infrastructure/db/schema";
import { BulkProductEditor } from "../bulk-product-editor";

export default async function BulkProductEditPage() {
  await requirePermission("catalog", "update");
  const db = await getRuntimeDb();
  const [productRows, categoryRows, familyRows, relationRows, imageRows, mediaRows] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.name)),
    db.select({ id: colorFamilies.id, name: colorFamilies.name }).from(colorFamilies).orderBy(asc(colorFamilies.name)),
    db.select().from(productCategories),
    db.select().from(productMedia).orderBy(asc(productMedia.order)),
    db.select().from(mediaAssets).orderBy(asc(mediaAssets.createdAt)),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Edición masiva de productos"
        description="Cambia información comercial, organización e imagen principal de varios productos en una sola operación."
      />
      <BulkProductEditor
        categories={categoryRows}
        colorFamilies={familyRows}
        media={mediaRows.map((asset) => ({ url: asset.url, label: asset.altText || asset.storageKey }))}
        initialRows={productRows.map((product) => {
          const primaryImage = imageRows.find((image) => image.productId === product.id);
          return {
            id: product.id,
            updatedAt: product.updatedAt.toISOString(),
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            status: product.status,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            shortDescription: product.shortDescription ?? "",
            colorFamilyId: product.colorFamilyId,
            categoryIds: relationRows.filter((relation) => relation.productId === product.id).map((relation) => relation.categoryId),
            imageUrl: primaryImage?.url ?? "",
            imageAlt: primaryImage?.altText ?? product.name,
            lowStockThreshold: product.lowStockThreshold,
            featured: product.featured,
            allowBackorder: product.allowBackorder,
          };
        })}
      />
    </>
  );
}
