import { test, expect } from "@playwright/test";
import { BASE_URL, signUpThrowaway, deleteUser } from "./helpers";

// The mutating counterpart to the read-only smoke suite. It exercises exactly
// the paths smoke.spec.ts avoids — create, edit (including a status change) and
// delete — but never against the shared demo account: it signs up a throwaway
// user, works only inside that account, and deletes the whole account (its rows
// cascade) in afterAll. No AI actions, so it spends no model budget.
//
// It runs signed-out (its own fresh storage state), so the demo session the
// other project injects must not leak in. The steps share one page and session,
// so they run as a single ordered flow rather than independent tests.

test.describe("mutating flows on a throwaway account", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Teardown deletes through whatever DATABASE_URL `.env` points at, which is
  // not necessarily the database behind BASE_URL. Pointed at a deployment, this
  // suite would create an account it cannot clean up — so it refuses to run
  // anywhere but a local app.
  test.skip(
    !/^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(BASE_URL),
    "mutating suite only runs against a local app — teardown targets the local .env database",
  );

  let email: string | undefined;

  test.afterAll(async () => {
    if (email) deleteUser(email);
  });

  test("signs up, then creates, re-stages and deletes an application", async ({
    page,
  }) => {
    email = await signUpThrowaway(page);

    await test.step("create an application from the form", async () => {
      await page.goto("/dashboard/applications/new");
      await page.getByLabel("Company").fill("Northwind Labs");
      await page.getByLabel("Role").fill("Platform Engineer");
      await page.getByRole("button", { name: "Create" }).click();

      await page.waitForURL(/\/dashboard\/applications\/[^/]+$/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Platform Engineer" }),
      ).toBeVisible();
    });

    const detailUrl = page.url();

    await test.step("it appears on the board", async () => {
      await page.goto("/dashboard/applications");
      await expect(
        page.getByRole("link", { name: /Platform Engineer/ }).first(),
      ).toBeVisible();
    });

    // Moving a card used to mean dragging it. On a phone the columns stack, so
    // the drop target sat screens away behind a slow auto-scroll, and by
    // keyboard dnd-kit moved the card 25px per arrow press. This does the same
    // job without a pointer at all.
    await test.step("move it on the board without a pointer", async () => {
      await page.goto("/dashboard/applications");

      await page
        .getByRole("button", { name: /^Move Platform Engineer at Northwind Labs/ })
        .focus();
      await page.keyboard.press("Enter");

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("button", { name: "Saved" })).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(dialog.getByRole("button", { name: "Applied" })).toBeFocused();
      await page.keyboard.press("Enter");

      await expect(dialog).toBeHidden();
      await expect(page.getByText("Moved to Applied.")).toBeVisible();

      await page.goto("/dashboard/applications?view=list&status=APPLIED");
      await expect(
        page.getByRole("link", { name: /Platform Engineer/ }),
      ).toBeVisible();
    });

    await test.step("edit the role and move it to Interview", async () => {
      await page.goto(detailUrl);
      await page.getByRole("link", { name: "Edit", exact: true }).click();
      await page.waitForURL(/\/edit$/);

      await page.getByLabel("Role").fill("Senior Platform Engineer");
      await page.getByLabel("Status").selectOption("INTERVIEW");
      await page.getByRole("button", { name: "Save changes" }).click();

      await page.waitForURL(/\/dashboard\/applications\/[^/]+$/);
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Senior Platform Engineer",
        }),
      ).toBeVisible();
    });

    await test.step("the status change persisted to the Interview filter", async () => {
      await page.goto("/dashboard/applications?view=list&status=INTERVIEW");
      await expect(
        page.getByRole("link", { name: /Senior Platform Engineer/ }),
      ).toBeVisible();

      await page.goto("/dashboard/applications?view=list&status=SAVED");
      await expect(
        page.getByRole("link", { name: /Senior Platform Engineer/ }),
      ).toHaveCount(0);
    });

    await test.step("delete the application", async () => {
      await page.goto(detailUrl);
      await page.getByRole("button", { name: "Delete", exact: true }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Delete", exact: true }).click();

      await page.waitForURL(/\/dashboard\/applications(\?.*)?$/);
      await expect(
        page.getByRole("link", { name: /Senior Platform Engineer/ }),
      ).toHaveCount(0);
    });
  });
});
