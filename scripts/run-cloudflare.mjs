import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { applyLocalPatches } from "./apply-local-patches.mjs";

const command = process.argv[2];
const forwardedArguments = process.argv.slice(3);
const allowed = new Set(["build", "preview", "deploy"]);
if (!allowed.has(command)) {
  console.error("Uso: node scripts/run-cloudflare.mjs <build|preview|deploy>");
  process.exit(2);
}

/**
 * El adaptador de OpenNext para Cloudflare vuelca todo `process.env` visto
 * durante `next build` como valores de respaldo (`??=`) en
 * `.open-next/cloudflare/next-env.mjs`, para que sirvan de fallback cuando
 * un binding de Cloudflare no está configurado. El problema: si `.env`
 * tiene secretos reales (como pasa aquí con Mercado Pago) durante un
 * `cf:build`, esos secretos quedan en texto plano DENTRO del bundle del
 * Worker que `wrangler deploy` sube — sin importar que luego los
 * bindings reales de Cloudflare (`wrangler secret put`) los sobrescriban en
 * runtime, el valor ya viaja embebido en el script desplegado. Por eso se
 * limpian aquí después del build, dejando el resto de valores (públicos,
 * no sensibles) intactos como fallback legítimo.
 */
const SENSITIVE_ENV_KEYS = new Set([
  "BETTER_AUTH_SECRET",
  "SESSION_SECRET",
  "ADMIN_OWNER_PASSWORD",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "META_CONVERSIONS_ACCESS_TOKEN",
  "SMTP_USER",
  "SMTP_PASSWORD",
]);
const SENSITIVE_KEY_PATTERN = /(SECRET|TOKEN|PASSWORD|_KEY$|API_KEY)/i;

function isSensitiveEnvKey(key) {
  if (key.startsWith("NEXT_PUBLIC_")) return false;
  return SENSITIVE_ENV_KEYS.has(key) || SENSITIVE_KEY_PATTERN.test(key);
}

function sanitizeBakedNextEnv() {
  const target = fileURLToPath(new URL("../.open-next/cloudflare/next-env.mjs", import.meta.url));
  if (!existsSync(target)) return;
  const source = readFileSync(target, "utf8");
  let redacted = 0;
  const sanitized = source.replace(/^export const (\w+) = (\{.*\});$/gm, (line, modeName, jsonLiteral) => {
    let values;
    try {
      values = JSON.parse(jsonLiteral);
    } catch {
      return line;
    }
    for (const key of Object.keys(values)) {
      if (isSensitiveEnvKey(key) && values[key]) {
        values[key] = "";
        redacted++;
      }
    }
    return `export const ${modeName} = ${JSON.stringify(values)};`;
  });
  if (redacted > 0) {
    writeFileSync(target, sanitized);
    console.log(`Limpiados ${redacted} valor(es) sensible(s) horneados en next-env.mjs (usa "wrangler secret put" para esos en producción).`);
  }
}

/**
 * El "file tracing" de Next.js (usado por OpenNext para armar el output
 * standalone) detecta que `next build` lee `.env` del disco y copia el
 * archivo TAL CUAL al output — con los secretos reales adentro — aunque en
 * runtime de Cloudflare nunca se lee del filesystem. Se borra por completo
 * después del build; no cumple ninguna función ahí.
 */
function removeStrayEnvCopies() {
  const openNextDir = fileURLToPath(new URL("../.open-next", import.meta.url));
  if (!existsSync(openNextDir)) return;
  const entries = readdirSync(openNextDir, { recursive: true, withFileTypes: true });
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !/^\.env(\..+)?$/.test(entry.name)) continue;
    rmSync(join(entry.parentPath ?? entry.path, entry.name), { force: true });
    removed++;
  }
  if (removed > 0) console.log(`Eliminadas ${removed} copia(s) de .env que el trazado de Next.js dejó en .open-next.`);
}

applyLocalPatches();
const cli = fileURLToPath(
  new URL("../node_modules/@opennextjs/cloudflare/dist/cli/index.js", import.meta.url),
);
const result = spawnSync(process.execPath, [cli, command, ...forwardedArguments], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});
if (result.error) throw result.error;
if (result.status === 0) {
  sanitizeBakedNextEnv();
  removeStrayEnvCopies();
}
process.exit(result.status ?? 1);
