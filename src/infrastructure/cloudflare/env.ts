import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

/**
 * Bindings declarados en wrangler.jsonc. Se acceden en runtime de Workers
 * vía `getCloudflareContext().env` (paquete @opennextjs/cloudflare); en
 * Node/Docker no existen y el resto de la infraestructura usa los
 * adaptadores locales (better-sqlite3, disco) en su lugar.
 */
export type CloudflareEnv = {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  MAINTENANCE_MODE?: string;
};

export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  if (process.env.NEXT_RUNTIME !== "edge" && process.env.CF_PAGES !== "1" && !process.env.CLOUDFLARE_WORKER) {
    // Fuera de Cloudflare Workers (Node/Docker/dev): no hay bindings reales.
    return null;
  }
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const context = await getCloudflareContext({ async: true });
  return context.env as unknown as CloudflareEnv;
}
