import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requirePermission } from "@/modules/auth/session";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { categories, collectionProducts, collections, colorFamilies, mediaAssets, productCategories, productMedia, products } from "@/infrastructure/db/schema";
import { ProductEditor } from "../product-editor";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("catalog", "read");
  const { id } = await params;
  const db = await getRuntimeDb();
  const [[product], categoryRows, collectionRows, familyRows, assignedCategories, assignedCollections, media, availableMedia] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    db.select({ id: categories.id, name: categories.name }).from(categories),
    db.select({ id: collections.id, name: collections.name }).from(collections),
    db.select({ id: colorFamilies.id, name: colorFamilies.name }).from(colorFamilies),
    db.select({ id: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, id)),
    db.select({ id: collectionProducts.collectionId }).from(collectionProducts).where(eq(collectionProducts.productId, id)),
    db.select().from(productMedia).where(eq(productMedia.productId, id)),
    db.select({ url: mediaAssets.url, altText: mediaAssets.altText }).from(mediaAssets),
  ]);
  if (!product) notFound();
  return (
    <>
      <AdminPageHeader title={product.name} description={`Edición completa · ${product.sku}`} />
      <ProductEditor product={{ ...product, updatedAt: product.updatedAt.toISOString(), publishedAt: product.publishedAt?.toISOString() ?? null, promoStartsAt: product.promoStartsAt?.toISOString() ?? null, promoEndsAt: product.promoEndsAt?.toISOString() ?? null, createdAt: product.createdAt.toISOString() }} categories={categoryRows} collections={collectionRows} colorFamilies={familyRows} selectedCategoryIds={assignedCategories.map((row) => row.id)} selectedCollectionIds={assignedCollections.map((row) => row.id)} media={media} availableMedia={availableMedia.map((asset) => ({ ...asset, altText: asset.altText ?? "" }))} />
    </>
  );
}
