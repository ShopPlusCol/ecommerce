import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function applyLocalPatches() {
  if (process.platform !== "win32") return;
  const target = fileURLToPath(
    new URL("../node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js", import.meta.url),
  );
  const source = readFileSync(target, "utf8");
  const original = `            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }
        else {`;
  const patched = `            catch (e) {
                if (e.code === "EPERM") {
                    cpSync(from, to, { recursive: true, force: true, dereference: true });
                }
                else if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }
        else {`;
  if (source.includes(patched)) return;
  if (!source.includes(original)) {
    throw new Error("No se reconoció la versión de copyTracedFiles de OpenNext; revisa el parche Windows.");
  }
  writeFileSync(target, source.replace(original, patched));
  console.log("Parche Windows de OpenNext aplicado.");
}

const invokedPath = process.argv[1]?.replaceAll("\\", "/");
if (invokedPath && import.meta.url === new URL(`file:///${invokedPath}`).href) {
  applyLocalPatches();
}
