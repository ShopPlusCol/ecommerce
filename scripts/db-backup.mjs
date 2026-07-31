import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";

function databasePath() {
  return path.resolve(process.env.SQLITE_PATH ?? "./.data/local.db");
}

function timestamp() {
  return new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
}

async function checksum(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

const source = databasePath();
const backupDirectory = path.resolve(process.env.BACKUP_DIRECTORY ?? "./.data/backups");
await mkdir(backupDirectory, { recursive: true });

const destination = path.join(backupDirectory, `shoppluscol-${timestamp()}.sqlite`);
const db = new Database(source, { readonly: true, fileMustExist: true });
const integrity = db.pragma("integrity_check", { simple: true });
if (integrity !== "ok") {
  db.close();
  throw new Error(`La base de origen no supera integrity_check: ${integrity}`);
}
await db.backup(destination);
db.close();

const copied = new Database(destination, { readonly: true, fileMustExist: true });
const copiedIntegrity = copied.pragma("integrity_check", { simple: true });
copied.close();
if (copiedIntegrity !== "ok") {
  throw new Error(`La copia no supera integrity_check: ${copiedIntegrity}`);
}

const sha256 = await checksum(destination);
await writeFile(`${destination}.sha256`, `${sha256}  ${path.basename(destination)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, source, destination, sha256 }));
