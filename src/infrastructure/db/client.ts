import Database from "better-sqlite3";
import { drizzle as drizzleBetterSqlite3 } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

/**
 * Puerto de acceso a datos con dos adaptadores sobre el mismo dialecto SQL
 * (SQLite): better-sqlite3 para Node/Docker/desarrollo, D1 para Cloudflare
 * Workers. El resto de la aplicación depende del tipo `Db`, nunca del
 * driver concreto (sección 28.1: portabilidad).
 */
export type Db = ReturnType<typeof drizzleBetterSqlite3<typeof schema>>;

let cachedLocalDb: Db | null = null;

export function getLocalDb(sqlitePath = process.env.SQLITE_PATH ?? "./.data/local.db"): Db {
  if (!cachedLocalDb) {
    const sqlite = new Database(sqlitePath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    cachedLocalDb = drizzleBetterSqlite3(sqlite, { schema });
  }
  return cachedLocalDb;
}

export function getD1Db(d1: D1Database) {
  return drizzleD1(d1, { schema });
}

export { schema };
