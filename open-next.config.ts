// Configuración del adaptador oficial de Next.js para Cloudflare Workers.
// La caché incremental usa R2 para que las páginas estáticas/ISR persistan
// entre despliegues (sección 40.1 del prompt maestro).
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
