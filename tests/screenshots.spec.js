import { test } from "@playwright/test";
import { seedProfile } from "./helpers.js";

const SCREENSHOT_DIR = "screenshots/pr";

/**
 * Automated screenshot capture for every major view and state.
 * Run with: npm run screenshots
 *
 * These are used for PR descriptions, documentation, and visual regression.
 */

test.describe("Screenshot Capture — All Views", () => {
  test.describe("Dark Mode (committed user)", () => {
    test.beforeEach(async ({ page }) => {
      await seedProfile(page, "committed");
    });

    test("timer — classic view", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/01-timer-classic-dark.png`,
        fullPage: false,
      });
    });

    test("todo — list view with tasks", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='list']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02-todo-list-dark.png`,
        fullPage: true,
      });
    });

    test("stats — dashboard", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='stats']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-stats-dashboard-dark.png`,
        fullPage: true,
      });
    });

    test("calendar — month view", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='calendar']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-calendar-month-dark.png`,
        fullPage: true,
      });
    });

    test("kanban — board view", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='kanban']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-kanban-board-dark.png`,
        fullPage: true,
      });
    });

    test("vault — notes view", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='vault']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-vault-notes-dark.png`,
        fullPage: true,
      });
    });

    test("settings — panel open", async ({ page }) => {
      await page.goto("/");
      await page.locator(".open-settings").click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/07-settings-panel-dark.png`,
        fullPage: false,
      });
    });
  });

  test.describe("Light Mode (committed user)", () => {
    test.beforeEach(async ({ page }) => {
      await seedProfile(page, "committed");
      // Switch to light mode
      await page.evaluate(() =>
        localStorage.setItem("pomodoro-theme", "light"),
      );
      await page.reload({ waitUntil: "domcontentloaded" });
    });

    test("timer — classic view light", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-timer-classic-light.png`,
        fullPage: false,
      });
    });

    test("todo — list view light", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='list']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09-todo-list-light.png`,
        fullPage: true,
      });
    });

    test("stats — dashboard light", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='stats']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/10-stats-dashboard-light.png`,
        fullPage: true,
      });
    });
  });

  test.describe("Mobile Viewport", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test.beforeEach(async ({ page }) => {
      await seedProfile(page, "committed");
    });

    test("timer — mobile", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/11-timer-mobile.png`,
        fullPage: false,
      });
    });

    test("todo — mobile", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='list']").dispatchEvent("click");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/12-todo-mobile.png`,
        fullPage: true,
      });
    });

    test("stats — mobile", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='stats']").dispatchEvent("click");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/13-stats-mobile.png`,
        fullPage: true,
      });
    });

    test("kanban — mobile", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='kanban']").dispatchEvent("click");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/14-kanban-mobile.png`,
        fullPage: true,
      });
    });
  });

  test.describe("Empty State (fresh user)", () => {
    test.beforeEach(async ({ page }) => {
      await seedProfile(page, "fresh");
    });

    test("timer — fresh state", async ({ page }) => {
      await page.goto("/");
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/15-timer-fresh.png`,
        fullPage: false,
      });
    });

    test("todo — empty state", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='list']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/16-todo-empty.png`,
        fullPage: true,
      });
    });

    test("stats — empty state", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-view='stats']").click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/17-stats-empty.png`,
        fullPage: true,
      });
    });
  });
});
