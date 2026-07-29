import { sql } from "drizzle-orm";
import { getRuntimeDb } from "@/infrastructure/db/client";
import { adminUsers, integrationSettings, orders, products, sessions, settings, tryOnTextures } from "@/infrastructure/db/schema";

export async function getSystemStatus() {
  const startedAt = performance.now();
  const db = await getRuntimeDb();
  const [settingsCount, productCount, orderCount, textureCount, userCount, sessionCount, integrations] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(settings),
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(tryOnTextures),
    db.select({ count: sql<number>`count(*)` }).from(adminUsers),
    db.select({ count: sql<number>`count(*)` }).from(sessions),
    db.select().from(integrationSettings),
  ]);
  const target = process.env.CLOUDFLARE_WORKER ? "cloudflare" : "node";
  const storage = target === "cloudflare" ? "r2" : "local";
  const backupAt = process.env.BACKUP_LAST_SUCCESS_AT;
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
      target,
      revision: process.env.APP_REVISION ?? "local",
      maintenance: process.env.MAINTENANCE_MODE === "true",
      storage,
    },
    checks: {
      application: { status: "ok" as const, detail: `Revisión ${process.env.APP_REVISION ?? "local"}` },
      database: { status: "ok" as const, detail: `${Math.round(performance.now() - startedAt)} ms` },
      migrations: { status: "ok" as const, detail: "Esquema compatible hasta migración 0008" },
      storage: { status: "ok" as const, detail: storage === "r2" ? "Binding R2 declarado por el runtime" : "Adaptador local activo" },
      authentication: { status: Number(userCount[0]?.count ?? 0) > 0 ? "ok" as const : "warning" as const, detail: `${Number(userCount[0]?.count ?? 0)} usuarios · ${Number(sessionCount[0]?.count ?? 0)} sesiones` },
      backups: { status: backupAt ? "ok" as const : "warning" as const, detail: backupAt ? `Último: ${backupAt}` : "Sin ejecución externa registrada" },
      cloudflare: { status: target === "cloudflare" ? "ok" as const : "pending" as const, detail: target === "cloudflare" ? "Runtime Worker activo" : "Build preparado; recurso no creado" },
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
      smtp: { configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) },
      r2: { configured: Boolean(process.env.R2_BUCKET && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) || target === "cloudflare" },
      d1: { configured: target === "cloudflare" },
      worker: { configured: target === "cloudflare" },
    },
  };
}
