/**
 * Levanta un entorno de PRUEBAS local, aislado de desarrollo y de
 * producción, para que el propietario pueda validar la tienda completa sin
 * riesgo.
 *
 *   npm run staging:seed    # crea/reinicia la base de pruebas
 *   npm run staging         # arranca la tienda de pruebas
 *
 * Qué separa:
 * - **Base de datos**: `.data/staging.db`, nunca `local.db` ni D1.
 * - **Almacenamiento**: `public/uploads-staging`.
 * - **Variables**: se cargan de `.env.staging` si existe. No se copia
 *   ningún secreto de producción automáticamente.
 * - **Identidad**: `APP_ENVIRONMENT=staging` hace que el panel muestre el
 *   aviso "Entorno de pruebas" y que los pedidos lleven prefijo `TEST-`.
 *
 * Lo que NO hace: desplegar nada, tocar Cloudflare, ni contactar con
 * proveedores externos por su cuenta.
 */
import { existsSync, mkdirSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { randomBytes } from "node:crypto";

const mode = process.argv[2] === "seed" ? "seed" : "start";
const workspace = process.cwd();
const port = process.env.STAGING_PORT ?? "3300";
const database = path.resolve(workspace, ".data/staging.db");
const uploads = path.resolve(workspace, "public/uploads-staging");

mkdirSync(path.dirname(database), { recursive: true });
mkdirSync(uploads, { recursive: true });

const baseUrl = process.env.STAGING_URL ?? `http://localhost:${port}`;

/**
 * `.env.staging` (si existe) manda sobre `.env`. Se carga explícitamente en
 * vez de dejar que Next.js mezcle: así queda claro de dónde sale cada
 * credencial y no se hereda por accidente un token de producción.
 */
const stagingEnvFile = path.resolve(workspace, ".env.staging");
const env = {
  ...process.env,
  APP_ENVIRONMENT: "staging",
  NODE_ENV: mode === "seed" ? "development" : process.env.NODE_ENV ?? "production",
  SQLITE_PATH: database,
  // Carpeta propia bajo `public/`, para no mezclar los archivos de una
  // validación con los medios reales de la tienda.
  MEDIA_DIRECTORY: "uploads-staging",
  MEDIA_PUBLIC_URL: `${baseUrl}/uploads-staging`,
  NEXT_PUBLIC_SITE_URL: baseUrl,
  BETTER_AUTH_URL: baseUrl,
  // Un secreto propio del entorno de pruebas: nunca el de producción.
  BETTER_AUTH_SECRET: process.env.STAGING_AUTH_SECRET ?? randomBytes(48).toString("base64url"),
  // Mercado Pago SIEMPRE en modo prueba aquí, pase lo que pase en .env.
  MERCADO_PAGO_TEST_MODE: "true",
  MAINTENANCE_MODE: "false",
};

if (existsSync(stagingEnvFile)) {
  console.log(`[staging] Cargando variables de ${path.relative(workspace, stagingEnvFile)}`);
  env.ENV_FILE = stagingEnvFile;
} else {
  console.log(
    "[staging] No hay .env.staging: se usan las variables actuales, salvo las que este script fuerza.\n" +
      "          Copia .env.staging.example a .env.staging para credenciales de prueba propias.",
  );
}

// Aviso explícito si Meta está configurado sin código de eventos de prueba:
// enviar eventos reales desde una validación ensucia el aprendizaje de las
// campañas.
if (env.META_PIXEL_ID && !env.META_TEST_EVENT_CODE) {
  console.warn(
    "[staging] AVISO: META_PIXEL_ID está definido pero META_TEST_EVENT_CODE no.\n" +
      "          Los eventos irían como REALES. Define META_TEST_EVENT_CODE en .env.staging\n" +
      "          o deja la integración desactivada en /admin/integraciones.",
  );
}

const tsx = path.resolve(workspace, "node_modules/tsx/dist/cli.mjs");

function run(command, args, label) {
  const result = spawnSync(command, args, { cwd: workspace, env, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`[staging] Falló: ${label}`);
    process.exit(result.status ?? 1);
  }
}

if (mode === "seed") {
  console.log(`[staging] Base de pruebas: ${path.relative(workspace, database)}`);
  run(process.execPath, [tsx, "src/infrastructure/db/migrate.ts"], "migraciones");
  run(process.execPath, [tsx, "src/infrastructure/db/seed.ts"], "datos de ejemplo");
  console.log(
    `\n[staging] Listo. Arranca con:  npm run staging\n` +
      `[staging] Tienda:  ${baseUrl}\n` +
      `[staging] Panel:   ${baseUrl}/acceso-admin\n`,
  );
  process.exit(0);
}

if (!existsSync(database)) {
  console.error("[staging] No existe la base de pruebas. Ejecuta primero:  npm run staging:seed");
  process.exit(1);
}

console.log(`[staging] ENTORNO DE PRUEBAS en ${baseUrl}`);
console.log(`[staging] Base: ${path.relative(workspace, database)} · Medios: ${path.relative(workspace, uploads)}`);
console.log("[staging] Mercado Pago forzado a modo de prueba. Los pedidos llevarán prefijo TEST-.\n");

const next = path.resolve(workspace, "node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [next, "start", "--port", port], {
  cwd: workspace,
  env,
  stdio: "inherit",
});
child.on("exit", (code) => process.exit(code ?? 0));
