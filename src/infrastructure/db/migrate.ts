import "dotenv/config";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getLocalDb } from "./client";

const sqlitePath = process.env.SQLITE_PATH ?? "./.data/local.db";
mkdirSync(dirname(sqlitePath), { recursive: true });

const db = getLocalDb(sqlitePath);
migrate(db, { migrationsFolder: "./drizzle" });

console.log(`Migraciones aplicadas sobre ${sqlitePath}`);
