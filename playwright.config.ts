import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { BASE_URL, CONTEXT_OPTIONS, STORAGE_STATE } from "./e2e/helpers";

loadEnv({ path: ".env", quiet: true });

// No `webServer`: the app shares port 3000 with other local work, so the suite
// runs against an already-running instance (like the screenshots script) rather
// than starting — and possibly colliding with — its own. Start the app first
// (npm run dev, or build && start), then `npm run test:e2e`. Point BASE_URL at a
// deployed URL to smoke-test production.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Two workers in CI, on a two-core runner shared with Postgres and the app.
  // It was one for a long time, because a second worker used to tip the suite
  // over: Prisma sized its pool from the core count and opened five
  // connections, one board render fans out into dozens of `<Link>` prefetches
  // that each want one, and whichever request lost never rendered at all. The
  // e2e job now asks for a pool of 20 rather than inheriting one sized for a
  // machine, which is what made the second worker affordable. Going wider is
  // not: past the core count the workers only take turns more expensively.
  workers: process.env.CI ? 2 : undefined,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    viewport: { ...CONTEXT_OPTIONS.viewport },
    colorScheme: "light",
    trace: "on-first-retry",
  },
  // The suite runs against one server instance sharing a CI runner with
  // Postgres and the browser, so the first hit on a route pays for cold Prisma
  // connections and a cold render on a contended core. That is a latency
  // budget, not a bug — but at Playwright's 5s default it read as one, and
  // retries quietly turned it green. Give assertions room in CI instead, and
  // let `--fail-on-flaky-tests` treat a retry as the failure it is.
  expect: { timeout: process.env.CI ? 15_000 : 5_000 },
  // The app rate-limits /sign-in/email to 10 attempts per 5 minutes, so the
  // suite signs in exactly once (the setup project) and every test reuses the
  // saved session instead of burning a sign-in each.
  projects: [
    { name: "setup", testMatch: "auth.setup.ts" },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { storageState: STORAGE_STATE },
    },
  ],
});
