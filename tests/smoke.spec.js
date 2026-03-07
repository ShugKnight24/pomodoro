import { test, expect } from "@playwright/test";
import { seedProfile } from "./helpers.js";

test.describe("Smoke Tests — App Loads and Core Views Work", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page, "committed");
  });

  test("app loads without uncaught exceptions", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test("timer displays and controls are visible", async ({ page }) => {
    await page.goto("/");
    // Either classic or modern timer should be visible
    const classic = page.locator("#timer-classic");
    const modern = page.locator("#timer-modern");
    const classicVisible = await classic.isVisible().catch(() => false);
    const modernVisible = await modern.isVisible().catch(() => false);
    expect(classicVisible || modernVisible).toBeTruthy();
  });

  test("todo view shows tasks from seed data", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='list']").click();
    await expect(page.locator(".todo-container")).toBeVisible();
    // Should have tasks from the committed profile
    const tasks = page.locator(
      ".todo-container .task, .todo-container [data-task-id]",
    );
    await expect(tasks.first()).toBeVisible({ timeout: 3000 });
  });

  test("stats view renders with data", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='stats']").click();
    await expect(page.locator("#stats-container")).toBeVisible();
  });

  test("calendar view renders", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='calendar']").click();
    await expect(page.locator("#calendar-container")).toBeVisible();
  });

  test("kanban view shows board from seed data", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='kanban']").click();
    await expect(page.locator("#kanban-container")).toBeVisible();
  });

  test("vault view shows notes from seed data", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='vault']").click();
    await expect(page.locator("#vault-container")).toBeVisible();
  });

  test("settings panel opens and closes", async ({ page }) => {
    await page.goto("/");
    await page.locator(".open-settings").click();
    await expect(page.locator(".side-settings")).toBeVisible();
    await page.locator(".close-settings").click();
    await expect(page.locator(".side-settings")).not.toBeVisible();
  });

  test("theme toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");
    await page.locator("#theme-toggle").click();
    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toEqual(initialTheme);
  });

  test("fresh profile loads empty state correctly", async ({ page }) => {
    await seedProfile(page, "fresh");
    await page.goto("/");
    await page.locator("[data-view='stats']").click();
    await expect(page.locator("#stats-container")).toBeVisible();
  });
});
