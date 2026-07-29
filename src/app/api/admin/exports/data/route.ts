import {
  auditLogs,
  categories,
  collections,
  consentRecords,
  customerAddresses,
  customers,
  integrationSettings,
  inventoryItems,
  inventoryMovements,
  manualTransferProofs,
  mediaAssets,
  orderAdjustments,
  orderItems,
  orders,
  orderStatusHistory,
  pages,
  pageSections,
  pageVersions,
  payments,
  productCategories,
  productMedia,
  products,
  productVariants,
  settings,
  tryOnTextures,
} from "@/infrastructure/db/schema";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { requirePermission } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requirePermission("settings", "export");
  const db = await getRuntimeDb();

  const [
    productRows,
    variantRows,
    productMediaRows,
    categoryRows,
    productCategoryRows,
    collectionRows,
    inventoryRows,
    inventoryMovementRows,
    customerRows,
    addressRows,
    orderRows,
    orderItemRows,
    orderAdjustmentRows,
    orderStatusRows,
    paymentRows,
    proofRows,
    mediaRows,
    pageRows,
    pageVersionRows,
    pageSectionRows,
    settingRows,
    integrationRows,
    consentRows,
    textureRows,
  ] = await Promise.all([
    db.select().from(products),
    db.select().from(productVariants),
    db.select().from(productMedia),
    db.select().from(categories),
    db.select().from(productCategories),
    db.select().from(collections),
    db.select().from(inventoryItems),
    db.select().from(inventoryMovements),
    db.select().from(customers),
    db.select().from(customerAddresses),
    db.select().from(orders),
    db.select().from(orderItems),
    db.select().from(orderAdjustments),
    db.select().from(orderStatusHistory),
    db.select().from(payments),
    db.select().from(manualTransferProofs),
    db.select().from(mediaAssets),
    db.select().from(pages),
    db.select().from(pageVersions),
    db.select().from(pageSections),
    db.select().from(settings),
    db.select().from(integrationSettings),
    db.select().from(consentRecords),
    db.select().from(tryOnTextures),
  ]);

  const exportedAt = new Date().toISOString();
  const exportId = crypto.randomUUID();
  const payload = {
    format: "shoppluscol-business-export",
    version: 1,
    exportedAt,
    excludes: [
      "credenciales y variables de entorno",
      "usuarios, contraseñas, sesiones y tokens administrativos",
      "payloads de webhooks y eventos de proveedores",
      "archivos binarios; media solo incluye metadatos y URL",
    ],
    data: {
      products: productRows,
      productVariants: variantRows,
      productMedia: productMediaRows,
      categories: categoryRows,
      productCategories: productCategoryRows,
      collections: collectionRows,
      inventoryItems: inventoryRows,
      inventoryMovements: inventoryMovementRows,
      customers: customerRows,
      customerAddresses: addressRows,
      orders: orderRows,
      orderItems: orderItemRows,
      orderAdjustments: orderAdjustmentRows,
      orderStatusHistory: orderStatusRows,
      payments: paymentRows,
      manualTransferProofs: proofRows,
      mediaAssets: mediaRows,
      pages: pageRows,
      pageVersions: pageVersionRows,
      pageSections: pageSectionRows,
      settings: settingRows,
      integrationSettings: integrationRows,
      consentRecords: consentRows,
      tryOnTextures: textureRows,
    },
  };

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "business-data.json.export",
    entityType: "export",
    entityId: exportId,
    after: {
      exportedAt,
      orders: orderRows.length,
      customers: customerRows.length,
      products: productRows.length,
    },
  });

  const date = exportedAt.slice(0, 10);
  return Response.json(payload, {
    headers: {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="shoppluscol-export-${date}.json"`,
      "x-content-type-options": "nosniff",
    },
  });
}
