import { test, expect } from "@playwright/test";
import { seedProfile } from "./helpers.js";
import fs from "fs";
import path from "path";

const DOWNLOADS_DIR = "/Users/shugmishumunov/Downloads";
const PR_SCREENSHOTS_DIR = path.join(DOWNLOADS_DIR, "pomodoro-pr-screenshots");

test.describe("PR Screenshots Generation", () => {
  test.beforeAll(() => {
    if (!fs.existsSync(PR_SCREENSHOTS_DIR)) {
      fs.mkdirSync(PR_SCREENSHOTS_DIR, { recursive: true });
    }
  });

  test.use({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  test("Capture PR screenshot 1: Dark Mode Hero & Timer View (WCAG AA Compliant)", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    await page.evaluate(() => {
      document.body.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.waitForTimeout(600);

    const dest = path.join(PR_SCREENSHOTS_DIR, "01-dark-mode-hero-timer.png");
    await page.screenshot({ path: dest, fullPage: false });

    // Also copy to Downloads top-level
    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-01-dark-mode-hero-timer.png"));
  });

  test("Capture PR screenshot 2: Dark Mode Todo List with High Contrast Badges", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    await page.evaluate(() => {
      document.body.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.locator('[data-view="list"]').click();
    await page.waitForTimeout(600);

    const dest = path.join(PR_SCREENSHOTS_DIR, "02-dark-mode-todo-list.png");
    await page.screenshot({ path: dest, fullPage: false });

    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-02-dark-mode-todo-list.png"));
  });

  test("Capture PR screenshot 3: Dark Mode Settings Drawer with Accessible Controls", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    await page.evaluate(() => {
      document.body.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.locator(".open-settings").first().click();
    await page.waitForTimeout(600);

    const dest = path.join(PR_SCREENSHOTS_DIR, "03-dark-mode-settings-drawer.png");
    await page.screenshot({ path: dest, fullPage: false });

    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-03-dark-mode-settings-drawer.png"));
  });

  test("Capture PR screenshot 4: Admin Heatmap HUD with Multi-User Filter Dropdown", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    // Switch to admin persona
    const select = page.locator("#header-tenant-select");
    await select.selectOption("tenant_admin");
    await page.waitForTimeout(500);

    // Open Heatmap HUD
    const hudBtn = page.locator("#hero-heatmap-badge-btn");
    await expect(hudBtn).toBeVisible();
    await hudBtn.click();
    await page.waitForTimeout(700);

    const dest = path.join(PR_SCREENSHOTS_DIR, "04-admin-heatmap-hud-multi-user.png");
    await page.screenshot({ path: dest, fullPage: false });

    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-04-admin-heatmap-hud-multi-user.png"));
  });

  test("Capture PR screenshot 5: Companion Chat Restored on Mascot Interaction", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    const avatar = page.locator("#companion-avatar-stage");
    await expect(avatar).toBeVisible();
    await avatar.click();
    await page.waitForTimeout(600);

    const dest = path.join(PR_SCREENSHOTS_DIR, "05-companion-chat-restored.png");
    await page.screenshot({ path: dest, fullPage: false });

    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-05-companion-chat-restored.png"));
  });

  test("Capture PR screenshot 6: Dark Mode Multi-Tenant Accountability Lounge", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    await page.evaluate(() => {
      document.body.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.locator('[data-view="social"]').click();
    await page.waitForTimeout(600);

    const dest = path.join(PR_SCREENSHOTS_DIR, "06-dark-mode-accountability-lounge.png");
    await page.screenshot({ path: dest, fullPage: false });

    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-06-dark-mode-accountability-lounge.png"));
  });

  test("Capture PR screenshot 7: Dark Mode Tactics RPG Battle Arena", async ({
    page,
  }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
    await page.evaluate(() => {
      document.body.classList.add("dark-theme");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.locator('[data-view="tactics"]').click();
    await page.waitForTimeout(600);

    const dest = path.join(PR_SCREENSHOTS_DIR, "07-dark-mode-tactics-rpg.png");
    await page.screenshot({ path: dest, fullPage: false });

    fs.copyFileSync(dest, path.join(DOWNLOADS_DIR, "pr-07-dark-mode-tactics-rpg.png"));
  });
});
