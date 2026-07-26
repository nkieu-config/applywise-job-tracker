import { execFileSync } from "node:child_process";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants/demo";

export const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

export const STORAGE_STATE = "e2e/.auth/demo.json";

export const CONTEXT_OPTIONS = {
  baseURL: BASE_URL,
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: "light",
} as const;

export async function newDemoPage(
  browser: Browser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext(CONTEXT_OPTIONS);
  const page = await context.newPage();
  return { context, page };
}

// Signs up a fresh, disposable account and returns its email so the caller can
// tear it down. The address is unique per run; email verification isn't enforced
// when no mail provider is configured (the usual e2e/local setup), so sign-up
// lands straight on the dashboard.
export async function signUpThrowaway(page: Page): Promise<string> {
  const email = `e2e-mutations-${Date.now()}@example.com`;
  await page.goto("/sign-up");
  await page.getByLabel("Name").fill("E2E Mutations");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("e2e-throwaway-pw-2026");
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL("**/dashboard");
  return email;
}

// Deletes a throwaway account and everything it owns (rows cascade, blobs are
// removed) via the same script an operator would run by hand. Synchronous and
// allowed to throw: a failed cleanup must be loud, since it would otherwise leak
// a user into the shared database.
export function deleteUser(email: string): void {
  execFileSync("npm", ["run", "delete-user", "--", email], { stdio: "inherit" });
}

export async function signInAsDemo(page: Page): Promise<void> {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(DEMO_EMAIL);
  await page.getByLabel("Password", { exact: true }).fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");
}

export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.addStyleTag({
    content:
      "*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }",
  });
}

export function sectionByHeading(page: Page, name: string) {
  return page
    .locator("section")
    .filter({ has: page.getByRole("heading", { level: 2, name }) });
}
