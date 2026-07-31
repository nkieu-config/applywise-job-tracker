import { test as setup } from "@playwright/test";
import { signInAsDemo, STORAGE_STATE } from "./helpers";

// The first request to a dashboard route pays for a cold Prisma connection and
// a first render on a contended CI core, and twice it has taken longer than the
// 15s an assertion waits — the board and the desk, the two heaviest. Paying it
// here means the suite measures a warm route rather than a cold one, which is
// what every run after the first would see anyway.
const WARM = [
  "/dashboard",
  "/dashboard/applications",
  "/dashboard/applications?view=list",
  "/dashboard/applications/demo_app_1",
  "/dashboard/resumes",
];

setup("authenticate as the demo account", async ({ page }) => {
  await signInAsDemo(page);
  await page.context().storageState({ path: STORAGE_STATE });

  for (const path of WARM) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
});
