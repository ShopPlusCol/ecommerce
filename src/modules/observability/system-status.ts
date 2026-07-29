import { sql } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { integrationSettings, orders, products, settings, tryOnTextures } from "@/infrastructure/db/schema";

export async function getSystemStatus() {
  const startedAt = performance.now();
  const db = await getRuntimeDb();
  const [settingsCount, productCount, orderCount, textureCount, integrations] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(settings),
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(tryOnTextures),
    db.select().from(integrationSettings),
  ]);
  return {
    status: "ok" as const,
    checkedAt: new Date().toISOString(),
    database: {
      status: "ok" as const,
      latencyMs: Math.round(performance.now() - startedAt),
      settings: Number(settingsCount[0]?.count ?? 0),
      products: Number(productCount[0]?.count ?? 0),
      orders: Number(orderCount[0]?.count ?? 0),
      tryOnTextures: Number(textureCount[0]?.count ?? 0),
    },
    runtime: {
      target: process.env.CLOUDFLARE_WORKER ? "cloudflare" : "node",
      revision: process.env.APP_REVISION ?? "local",
      maintenance: process.env.MAINTENANCE_MODE === "true",
      storage: process.env.CLOUDFLARE_WORKER ? "r2" : "local",
    },
    external: {
      mercadoPago: {
        configured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
        testMode: process.env.MERCADO_PAGO_TEST_MODE !== "false",
      },
      meta: {
        configured: Boolean(process.env.META_CONVERSIONS_ACCESS_TOKEN),
        enabled: integrations.some((item) => item.provider === "meta_conversions_api" && item.isEnabled),
      },
      smtp: { configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER) },
    },
  };
}
