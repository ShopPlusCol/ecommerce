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
import { existsSync, mkdirSync, readFileSync } from "node:fs";
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
 * Parser mínimo de archivos .env: `CLAVE=valor`, ignorando comentarios y
 * líneas vacías, y quitando comillas envolventes. No se usa una dependencia
 * porque solo hace falta esto.
 */
function parseEnvFile(contents) {
  const values = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

/**
 * `.env.staging` (si existe) manda sobre `.env`. Se carga explícitamente en
 * vez de dejar que Next.js mezcle: así queda claro de dónde sale cada
 * credencial y no se hereda por accidente un token de producción.
 */
const stagingEnvFile = path.resolve(workspace, ".env.staging");
/**
 * Variables que este script impone siempre, por encima de `.env` y de
 * `.env.staging`. Son las que garantizan el aislamiento: si `.env.staging`
 * pudiera sobrescribirlas, un descuido bastaría para que la validación
 * escribiera en la base real o cobrara de verdad.
 */
const FORCED = {
  APP_ENVIRONMENT: "staging",
  SQLITE_PATH: database,
  // Carpeta propia bajo `public/`, para no mezclar los archivos de una
  // validación con los medios reales de la tienda.
  MEDIA_DIRECTORY: "uploads-staging",
  MEDIA_PUBLIC_URL: `${baseUrl}/uploads-staging`,
  NEXT_PUBLIC_SITE_URL: baseUrl,
  BETTER_AUTH_URL: baseUrl,
  MERCADO_PAGO_TEST_MODE: "true",
  MAINTENANCE_MODE: "false",
};

const env = {
  ...process.env,
  ...FORCED,
  NODE_ENV: mode === "seed" ? "development" : process.env.NODE_ENV ?? "production",
  // Un secreto propio del entorno de pruebas: nunca el de producción.
  BETTER_AUTH_SECRET: process.env.STAGING_AUTH_SECRET ?? randomBytes(48).toString("base64url"),
};

if (existsSync(stagingEnvFile)) {
  // Se parsea aquí a mano y se inyecta en el entorno del proceso hijo.
  // Next.js no lee `.env.staging` por su cuenta (solo `.env`, `.env.local`
  // y `.env.<NODE_ENV>`), así que sin esto el archivo quedaba en el disco
  // sin efecto alguno: las credenciales de prueba nunca llegaban.
  const parsed = parseEnvFile(readFileSync(stagingEnvFile, "utf8"));
  Object.assign(env, parsed);
  // Las variables que este script fuerza vuelven a aplicarse DESPUÉS, para
  // que `.env.staging` no pueda, por ejemplo, sacar a Mercado Pago del modo
  // de prueba.
  Object.assign(env, FORCED);
  // El secreto de sesión se resuelve después de cargar el archivo: si
  // `.env.staging` define STAGING_AUTH_SECRET, las sesiones sobreviven a un
  // reinicio en vez de cerrarse cada vez.
  if (env.STAGING_AUTH_SECRET) env.BETTER_AUTH_SECRET = env.STAGING_AUTH_SECRET;
  console.log(
    `[staging] Cargadas ${Object.keys(parsed).length} variables de ${path.relative(workspace, stagingEnvFile)}`,
  );
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
