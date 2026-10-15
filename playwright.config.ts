import { defineConfig, devices } from "@playwright/test";

// Pick up the same .env.local the app uses (test account credentials, Supabase keys).
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: fine for CI, where the variables come from the environment.
}

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`;
// "msedge" or "chrome" reuses a browser you already have instead of downloading Playwright's.
const channel = process.env.E2E_CHANNEL || undefined;

export default defineConfig({
  testDir: "./e2e",
  // The signed-in specs share one real test account, so they run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
