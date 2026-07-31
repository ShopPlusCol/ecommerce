import { defineConfig, devices } from "@playwright/test";

const e2eBaseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    bypassCSP: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
