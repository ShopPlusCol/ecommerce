import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";

const EXCLUDED_TABLES = new Set([
  "admin_users",
  "auth_accounts",
  "auth_login_attempts",
  "auth_rate_limits",
  "auth_verifications",
  "idempotency_keys",
  "permissions",
  "request_rate_limits",
  "role_permissions",
  "roles",
  "sessions",
  "sqlite_sequence",
  "user_roles",
  "webhook_events",
]);

const source = path.resolve(process.env.SQLITE_PATH ?? "./.data/local.db");
const outputDirectory = path.resolve(process.env.EXPORT_DIRECTORY ?? "./.data/exports");
await mkdir(outputDirectory, { recursive: true });

const db = new Database(source, { readonly: true, fileMustExist: true });
const integrity = db.pragma("integrity_check", { simple: true });
if (integrity !== "ok") {
  db.close();
  throw new Error(`La base no supera integrity_check: ${integrity}`);
}

const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
  .all()
  .map(({ name }) => name)
  .filter((name) => !EXCLUDED_TABLES.has(name));
const data = Object.fromEntries(
  tables.map((table) => [table, db.prepare(`SELECT * FROM "${table.replaceAll('"', '""')}"`).all()]),
);
db.close();

const exportedAt = new Date().toISOString();
const destination = path.join(
  outputDirectory,
  `shoppluscol-business-${exportedAt.replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z")}.json`,
);
await writeFile(
  destination,
  JSON.stringify(
    {
      format: "shoppluscol-business-export",
      version: 1,
      exportedAt,
      excludedTables: [...EXCLUDED_TABLES].sort(),
      data,
    },
    null,
    2,
  ),
  "utf8",
);
console.log(JSON.stringify({ ok: true, source, destination, tables: tables.length }));
