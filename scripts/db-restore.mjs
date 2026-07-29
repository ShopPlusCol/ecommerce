import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function sha256(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

const sourceArg = argument("--from");
if (!sourceArg || argument("--confirm") !== "RESTORE") {
  throw new Error("Uso: npm run db:restore -- --from <backup.sqlite> --confirm RESTORE [--to <destino>]");
}

const workspaceData = path.resolve("./.data");
const source = path.resolve(sourceArg);
const destination = path.resolve(argument("--to") ?? process.env.SQLITE_PATH ?? "./.data/local.db");
const relativeDestination = path.relative(workspaceData, destination);
if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
  throw new Error("Por seguridad, el destino de restauración debe estar dentro de .data.");
}
if (source === destination) {
  throw new Error("El origen y el destino no pueden ser el mismo archivo.");
}
await stat(source);

const sourceDb = new Database(source, { readonly: true, fileMustExist: true });
const integrity = sourceDb.pragma("integrity_check", { simple: true });
sourceDb.close();
if (integrity !== "ok") {
  throw new Error(`La copia seleccionada no supera integrity_check: ${integrity}`);
}

const checksumFile = `${source}.sha256`;
try {
  const expected = (await readFile(checksumFile, "utf8")).trim().split(/\s+/)[0];
  const actual = await sha256(source);
  if (expected !== actual) throw new Error("El checksum SHA-256 de la copia no coincide.");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  console.warn("Aviso: no existe archivo .sha256; se continuará porque integrity_check fue correcto.");
}

await mkdir(path.dirname(destination), { recursive: true });
const temporary = `${destination}.restore-${Date.now()}.tmp`;
const previous = `${destination}.before-restore-${Date.now()}.sqlite`;
await copyFile(source, temporary);

let hadPrevious = false;
try {
  await stat(destination);
  hadPrevious = true;
  await copyFile(destination, previous);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

await rename(temporary, destination);
const restored = new Database(destination, { readonly: true, fileMustExist: true });
const restoredIntegrity = restored.pragma("integrity_check", { simple: true });
restored.close();
if (restoredIntegrity !== "ok") {
  if (hadPrevious) await copyFile(previous, destination);
  throw new Error(`La base restaurada no supera integrity_check: ${restoredIntegrity}`);
}
try {
  await unlink(`${destination}-wal`);
  await unlink(`${destination}-shm`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

console.log(JSON.stringify({ ok: true, source, destination, previous: hadPrevious ? previous : null }));
