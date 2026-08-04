import { randomBytes } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "playwright";

/**
 * Ejecutable de Chrome para Lighthouse.
 *
 * El Chrome completo que instala Playwright no arranca en todas las
 * máquinas Windows: si falta el runtime de Visual C++ correspondiente,
 * `chrome.exe` falla con "la configuración en paralelo no es correcta" y
 * `spawn` devuelve un `UNKNOWN` que no dice nada útil. El "headless shell"
 * que Playwright instala junto a él no depende de eso y le sirve igual a
 * Lighthouse, que solo necesita un Chrome con puerto de depuración.
 *
 * Orden: variable de entorno explícita › Chrome completo si arranca ›
 * headless shell.
 */
function resolveChromeExecutable() {
  if (process.env.LIGHTHOUSE_CHROME_PATH) return process.env.LIGHTHOUSE_CHROME_PATH;

  const fullChrome = chromium.executablePath();
  const canRun = spawnSync(fullChrome, ["--version"], { timeout: 20_000 });
  if (canRun.status === 0) return fullChrome;

  // .../chromium-1234/chrome-win64/chrome.exe
  //   → .../chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe
  const shell = fullChrome
    .replace(/chromium-(\d+)/, "chromium_headless_shell-$1")
    .replace(/chrome-win64[\\/]chrome\.exe$/, "chrome-headless-shell-win64\\chrome-headless-shell.exe")
    .replace(/chrome-linux[\\/]chrome$/, "chrome-headless-shell-linux64/chrome-headless-shell")
    .replace(/chrome-mac[\\/]Chromium\.app.*$/, "chrome-headless-shell-mac/chrome-headless-shell");

  if (existsSync(shell)) {
    console.warn(
      `[lighthouse] El Chrome completo no arranca en esta máquina; se usa el headless shell (${shell}). ` +
        "Instálalo con `npx playwright install --only-shell chromium` si falta.",
    );
    return shell;
  }

  throw new Error(
    `No hay un Chrome ejecutable para Lighthouse. Probado: ${fullChrome} (no arranca) y ${shell} (no existe). ` +
      "Instala el shell con `npx playwright install --only-shell chromium` o define LIGHTHOUSE_CHROME_PATH.",
  );
}

const workspace = process.cwd();
const port = process.env.LIGHTHOUSE_PORT ?? "3200";
const debuggingPort = process.env.LIGHTHOUSE_DEBUG_PORT ?? String(9200 + (process.pid % 500));
const baseUrl = `http://127.0.0.1:${port}`;
const nextCli = path.resolve(workspace, "node_modules/next/dist/bin/next");
const lighthouseCli = path.resolve(workspace, "node_modules/lighthouse/cli/index.js");
const outputDirectory = path.resolve(workspace, "test-results");
const browserProfile = path.resolve(workspace, ".data", `lighthouse-profile-${process.pid}`);
await mkdir(outputDirectory, { recursive: true });
await mkdir(browserProfile, { recursive: true });

const env = {
  ...process.env,
  BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
  BETTER_AUTH_URL: baseUrl,
  NEXT_PUBLIC_SITE_URL: baseUrl,
};
const server = spawn(
  process.execPath,
  [nextCli, "start", "--hostname", "127.0.0.1", "--port", port],
  { cwd: workspace, env, stdio: ["ignore", "ignore", "pipe"] },
);
let serverErrors = "";
server.stderr.on("data", (chunk) => {
  serverErrors += chunk.toString();
});

async function waitUntilReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // El proceso todavía está iniciando.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Servidor Lighthouse no disponible. ${serverErrors}`);
}

function runReport(name, route) {
  const destination = path.join(outputDirectory, `lighthouse-${name}.json`);
  const result = spawnSync(
    process.execPath,
    [
      lighthouseCli,
      `${baseUrl}${route}`,
      "--output=json",
      `--output-path=${destination}`,
      "--only-categories=performance,accessibility,best-practices,seo",
      `--port=${debuggingPort}`,
      "--quiet",
    ],
    { cwd: workspace, env, encoding: "utf8", timeout: 90_000 },
  );
  if (result.status !== 0) {
    throw new Error(`${result.stdout}\n${result.stderr}`.trim());
  }
  return destination;
}

const browser = spawn(
  resolveChromeExecutable(),
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${browserProfile}`,
    "about:blank",
  ],
  { cwd: workspace, stdio: "ignore" },
);

try {
  await waitUntilReady();
  const reports = [
    ["home", runReport("home", "/")],
    ["product", runReport("product", "/productos/amazon-brown")],
  ];
  for (const [name, file] of reports) {
    const report = JSON.parse(await readFile(file, "utf8"));
    const scores = Object.fromEntries(
      Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
    );
    const metrics = {
      FCP: report.audits["first-contentful-paint"].displayValue,
      LCP: report.audits["largest-contentful-paint"].displayValue,
      TBT: report.audits["total-blocking-time"].displayValue,
      CLS: report.audits["cumulative-layout-shift"].displayValue,
      SI: report.audits["speed-index"].displayValue,
    };
    console.log(`${name}: ${JSON.stringify(scores)} ${JSON.stringify(metrics)}`);
  }
} finally {
  browser.kill("SIGTERM");
  server.kill("SIGTERM");
}
