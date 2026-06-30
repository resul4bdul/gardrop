// Playwright e2e konfiqi (C.1). Smoke spec API-ni `route` ilə mock-layır → backend LAZIM DEYİL.
// İşə sal:
//   1) npm run e2e:install   (chromium endirilir, birdəfəlik)
//   2) npm run e2e           (frontend dev serverini Playwright avtomatik qaldırır)
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Frontend dev serveri (backend ayrıca əl ilə qaldırılmalıdır — DB asılılığı var).
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
