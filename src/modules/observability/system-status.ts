import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { getRuntimeDb, type Db } from "@/infrastructure/db/client";
import { getCloudflareEnv } from "@/infrastructure/cloudflare/env";
import { adminUsers, integrationSettings, orders, products, sessions, settings, tryOnTextures } from "@/infrastructure/db/schema";
import migrationJournal from "../../../drizzle/meta/_journal.json";

type StatusCheck = { status: "ok" | "warning" | "error" | "pending"; detail: string };

async function checkMigrations(db: Db): Promise<StatusCheck> {
  const expected = migrationJournal.entries.length;
  const latestTag = migrationJournal.entries.at(-1)?.tag ?? "desconocida";
  try {
    const row = await db.get<{ count: number }>(sql`select count(*) as count from __drizzle_migrations`);
    const applied = Number(row?.count ?? 0);
    if (applied >= expected) return { status: "ok", detail: `${applied}/${expected} migraciones aplicadas · última: ${latestTag}` };
    return { status: "error", detail: `${applied}/${expected} migraciones aplicadas · falta aplicar ${latestTag}` };
  } catch {
    return { status: "error", detail: "No se pudo leer el historial de migraciones (__drizzle_migrations)." };
  }
}

async function checkStorage(): Promise<StatusCheck> {
  const cloudflare = await getCloudflareEnv();
  if (cloudflare) {
    try {
      await cloudflare.MEDIA_BUCKET.head("__healthcheck__");
      return { status: "ok", detail: "Binding R2 responde a operaciones de lectura." };
    } catch {
      return { status: "error", detail: "El binding R2 no respondió; revisa la configuración del Worker." };
    }
  }
  const probePath = join(process.cwd(), "public", "uploads", ".healthcheck");
  try {
    await mkdir(join(process.cwd(), "public", "uploads"), { recursive: true });
    await writeFile(probePath, "ok");
    await access(probePath);
    await rm(probePath, { force: true });
    return { status: "ok", detail: "Adaptador local activo; carpeta de subidas escribible." };
  } catch {
    return { status: "error", detail: "No se pudo escribir en public/uploads; revisa permisos del disco." };
  }
}

export async function getSystemStatus() {
  const startedAt = performance.now();
  const db = await getRuntimeDb();
  const [settingsCount, productCount, orderCount, textureCount, userCount, sessionCount, integrations, migrations, storageCheck] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(settings),
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db.select({ count: sql<number>`count(*)` }).from(tryOnTextures),
    db.select({ count: sql<number>`count(*)` }).from(adminUsers),
    db.select({ count: sql<number>`count(*)` }).from(sessions),
    db.select().from(integrationSettings),
    checkMigrations(db),
    checkStorage(),
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
      migrations,
      storage: storageCheck,
      authentication: { status: Number(userCount[0]?.count ?? 0) > 0 ? "ok" as const : "warning" as const, detail: `${Number(userCount[0]?.count ?? 0)} usuarios · ${Number(sessionCount[0]?.count ?? 0)} sesiones` },
      backups: { status: backupAt ? "ok" as const : "warning" as const, detail: backupAt ? `Último: ${backupAt}` : "Sin ejecución externa registrada" },
      cloudflare: { status: target === "cloudflare" ? "ok" as const : "pending" as const, detail: target === "cloudflare" ? "Runtime Worker activo" : "Build preparado; recurso no creado" },
    },
    external: {
      mercadoPago: {
        configured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_WEBHOOK_SECRET),
        testMode: process.env.MERCADO_PAGO_TEST_MODE !== "false",
      },
      meta: {
        configured: Boolean(process.env.META_CONVERSIONS_ACCESS_TOKEN),
        enabled: integrations.some((item) => item.provider === "meta_conversions_api" && item.isEnabled),
      },
      smtp: { configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) },
      // R2 se vincula por binding (wrangler.jsonc), no por variables de entorno estilo S3: `storageCheck` ya prueba el binding con una operación real (checkStorage arriba).
      r2: { configured: target === "cloudflare" && storageCheck.status === "ok" },
      d1: { configured: target === "cloudflare" },
      worker: { configured: target === "cloudflare" },
    },
  };
}
