import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { applyLocalPatches } from "./apply-local-patches.mjs";

const command = process.argv[2];
const forwardedArguments = process.argv.slice(3);
const allowed = new Set(["build", "preview", "deploy"]);
if (!allowed.has(command)) {
  console.error("Uso: node scripts/run-cloudflare.mjs <build|preview|deploy>");
  process.exit(2);
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
process.exit(result.status ?? 1);
