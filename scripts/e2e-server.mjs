import { randomBytes } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import Database from "better-sqlite3";

const workspace = process.cwd();
const dataDirectory = path.resolve(workspace, ".data");
const database = path.resolve(dataDirectory, "e2e.db");
const credentialsFile = path.resolve(dataDirectory, "e2e-credentials.json");
const port = process.env.E2E_PORT ?? "3100";
const baseUrl = `http://127.0.0.1:${port}`;
if (path.dirname(database) !== dataDirectory) throw new Error("Ruta E2E insegura.");

await mkdir(dataDirectory, { recursive: true });
await rm(database, { force: true });
await rm(`${database}-shm`, { force: true });
await rm(`${database}-wal`, { force: true });

const email = "e2e-owner@shoppluscol.local";
const password = `${randomBytes(24).toString("base64url")}!Aa1`;
const env = {
  ...process.env,
  NODE_ENV: "production",
  SQLITE_PATH: database,
  BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
  BETTER_AUTH_URL: baseUrl,
  NEXT_PUBLIC_SITE_URL: baseUrl,
  ADMIN_OWNER_EMAIL: email,
  ADMIN_OWNER_NAME: "Propietario E2E",
  ADMIN_OWNER_PASSWORD: password,
  STORAGE_DRIVER: "local",
  MEDIA_PUBLIC_URL: `${baseUrl}/uploads`,
  // Next.js carga `.env` directamente del disco dentro de cada proceso hijo
  // (build/start) para cualquier variable que no venga ya definida aquí —
  // sin este bloqueo explícito, credenciales reales del `.env` local del
  // desarrollador (Mercado Pago, Meta, SMTP) se filtrarían al entorno
  // aislado de e2e y harían pruebas no determinísticas contra proveedores
  // externos reales. Vacío = "no configurado" para el código de la app.
  MERCADO_PAGO_ACCESS_TOKEN: "",
  MERCADO_PAGO_WEBHOOK_SECRET: "",
  MERCADO_PAGO_TEST_MODE: "true",
  META_PIXEL_ID: "",
  META_CONVERSIONS_ACCESS_TOKEN: "",
  SMTP_HOST: "",
  SMTP_USER: "",
  SMTP_PASSWORD: "",
};

await writeFile(credentialsFile, JSON.stringify({ email, password }), {
  encoding: "utf8",
  mode: 0o600,
});

const node = process.execPath;
const tsxCli = path.resolve(workspace, "node_modules/tsx/dist/cli.mjs");
const nextCli = path.resolve(workspace, "node_modules/next/dist/bin/next");
for (const args of [
  [tsxCli, "src/infrastructure/db/migrate.ts"],
  [tsxCli, "src/infrastructure/db/seed.ts"],
]) {
  const result = spawnSync(node, args, { cwd: workspace, env, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    process.exit(result.status ?? 1);
  }
}

const db = new Database(database);
const now = Date.now();
db.prepare(
  `INSERT INTO settings (key, value, created_at, updated_at)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
).run(
  "manual_transfer",
  JSON.stringify({
    bankName: "Banco de pruebas",
    accountType: "Ahorros",
    accountNumber: "000000000",
    accountHolder: "ShopPlusCol E2E",
    instructions: "Configuración local exclusiva de pruebas.",
    qrUrl: null,
  }),
  now,
  now,
);
db.close();

const build = spawnSync(node, [nextCli, "build"], {
  cwd: workspace,
  env,
  encoding: "utf8",
});
if (build.status !== 0) {
  process.stderr.write(build.stdout ?? "");
  process.stderr.write(build.stderr ?? "");
  process.exit(build.status ?? 1);
}

const server = spawn(node, [nextCli, "start", "--hostname", "127.0.0.1", "--port", port], {
  cwd: workspace,
  env,
  stdio: "inherit",
});
const stop = () => server.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.on("exit", (code) => process.exit(code ?? 0));
