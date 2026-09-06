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

  test("stats view renders time accounting ledger and audit button", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='stats']").click();
    await expect(page.locator(".stats-accounting-section")).toBeVisible();
    await expect(page.locator("#accounting-estimated")).toBeVisible();
    await expect(page.locator("#accounting-actual")).toBeVisible();
    await expect(page.locator("#accounting-variance")).toBeVisible();
    await expect(page.locator("#export-time-audit-btn")).toBeVisible();
  });

  test("habits engine renders checklist and tracks completion", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#habits-section")).toBeVisible();
    const habitCard = page.locator(".habit-card").first();
    await expect(habitCard).toBeVisible();
    // Toggle habit to test completion and streak badge
    await habitCard.locator("[data-toggle-habit]").click();
    await expect(page.locator(".habit-streak-badge").first()).toBeVisible();
  });

  test("subtasks toggle and add form work on tasks", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-view='list']").click();
    const task = page.locator(".todo-container .task").first();
    await expect(task).toBeVisible();
    const subtaskToggle = task.locator("[data-toggle-subtasks]").first();
    await expect(subtaskToggle).toBeVisible();
    await subtaskToggle.click();
    const subtasksWrapper = task.locator(".task-subtasks-wrapper");
    await expect(subtasksWrapper).toBeVisible();
    await expect(subtasksWrapper.locator(".subtask-add-form")).toBeVisible();
  });

  test("zero FontAwesome i tags exist in DOM and SVG icons are used everywhere", async ({ page }) => {
    await page.goto("/");
    const faIconsCount = await page.locator("i.fas, i.fa, i.far, i.fab").count();
    expect(faIconsCount).toBe(0);
    const svgIconsCount = await page.locator("svg.svg-icon").count();
    expect(svgIconsCount).toBeGreaterThan(10);
  });

  test("hero view renders dashboard with live paper-doll stage and vital bars", async ({ page }) => {
    await page.goto("/");
    await page.locator(".view-btn[data-view='hero']").click();
    await expect(page.locator("#hero-container")).toBeVisible();
    await expect(page.locator(".hero-paperdoll-svg")).toBeVisible();
    await expect(page.locator(".hp-track")).toBeVisible();
    await expect(page.locator(".xp-track")).toBeVisible();
    await expect(page.locator(".treasury-amount")).toBeVisible();
  });

  test("character creator modal opens, allows picking class, and updates hero", async ({ page }) => {
    await page.goto("/");
    await page.locator(".view-btn[data-view='hero']").click();
    await page.locator("#open-character-creator-btn").click();
    await expect(page.locator("#character-creator-modal")).toBeVisible();

    // Pick Aether Mage
    await page.locator("[data-pick-class='mage']").click();
    await page.locator("#creator-random-name-btn").click();
    await page.locator("#confirm-create-hero-btn").click();

    await expect(page.locator("#character-creator-modal")).toBeHidden();
    await expect(page.locator(".hero-class-tag")).toHaveText("Aether Mage");
  });

  test("bazaar shop enables purchasing and equipping gear and mounts", async ({ page }) => {
    await page.goto("/");
    await page.locator(".view-btn[data-view='hero']").click();
    await page.locator("[data-hero-tab='shop']").click();
    await expect(page.locator(".shop-dashboard-view")).toBeVisible();

    // Filter to mounts and buy Solar Hare (80g, starting hero has 80g)
    await page.locator("[data-shop-cat='mount']").click();
    const buyBtn = page.locator("[data-buy-item='m_solar_hare']");
    await expect(buyBtn).toBeVisible();
    await buyBtn.click();

    // Verify mount badge appears on the stage
    await expect(page.locator(".equipped-mount-badge")).toHaveText("Solar Hare");
  });

  test("quests & boss arena renders active boss and story mode toggle silences dialogue", async ({ page }) => {
    await page.goto("/");
    await page.locator(".view-btn[data-view='hero']").click();
    await page.locator("[data-hero-tab='quests']").click();

    await expect(page.locator(".boss-arena-card")).toBeVisible();
    await expect(page.locator("#narrative-dialogue-card")).toBeVisible();

    // Toggle Story Mode off
    await page.locator("label.story-switch").click();
    await expect(page.locator("#narrative-dialogue-card")).toBeHidden();

    // Toggle Story Mode back on
    await page.locator("label.story-switch").click();
    await expect(page.locator("#narrative-dialogue-card")).toBeVisible();
  });

  test("completing a task awards loot and damages the active chapter boss", async ({ page }) => {
    await page.goto("/");
    // First complete a task in list view
    await page.locator(".view-btn[data-view='list']").click();
    const customCheckbox = page.locator(".task label .custom-checkbox").first();
    await expect(customCheckbox).toBeVisible();
    await customCheckbox.click();

    // Floating loot badge should appear
    await expect(page.locator(".floating-loot-item").first()).toBeVisible();

    // Go to hero view and verify boss HP is reduced from initial 150
    await page.locator(".view-btn[data-view='hero']").click();
    await page.locator("[data-hero-tab='quests']").click();
    const bossHpNum = await page.locator(".boss-hp-num").textContent();
    expect(bossHpNum).toContain("/ 150 HP");
    expect(bossHpNum).not.toContain("150 / 150 HP");
  });
});
