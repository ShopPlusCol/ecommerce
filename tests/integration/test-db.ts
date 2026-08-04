import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/infrastructure/db/schema";

/**
 * Base SQLite en memoria con TODAS las migraciones aplicadas en orden, para
 * pruebas de integración/concurrencia sobre persistencia real (no mocks) —
 * mismo patrón que tests/integration/phase3-persistence.test.ts, pero
 * cubriendo el esquema completo en vez de un subconjunto fijo, para que
 * pruebas nuevas no tengan que mantener su propia lista de migraciones.
 */
export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");
  const files = readdirSync(resolve("drizzle")).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const source = readFileSync(resolve("drizzle", file), "utf8");
    for (const statement of source.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) {
      sqlite.exec(statement);
    }
  }
  const db = drizzle(sqlite, { schema });
  return { sqlite, db };
}
