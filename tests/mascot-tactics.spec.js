import { test, expect } from "@playwright/test";
import { seedProfile } from "./helpers.js";

test.describe("Mascot Companion, App Onboarding Tours & Tactics RPG Engine", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page, "committed");
  });

  test("app loads cleanly without uncaught exceptions with companion and tactics initialized", async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test("mascot companion renders on screen with default Pomi the Tomato", async ({
    page,
  }) => {
    await page.goto("/");
    const widget = page.locator("#mascot-companion-widget");
    await expect(widget).toBeVisible();

    const mascotName = page.locator("#mascot-companion-widget .mascot-badge-tag");
    await expect(mascotName).toContainText("Pomi");

    // Avatar stage with SVG
    const stage = page.locator("#companion-avatar-stage");
    await expect(stage).toBeVisible();
    await expect(page.locator(".mascot-svg.mascot-pomi")).toBeVisible();
  });

  test("petting mascot triggers heart animation and joyful reaction", async ({
    page,
  }) => {
    await page.goto("/");
    const stage = page.locator("#companion-avatar-stage");
    await stage.click();

    // Heart emote in mascot or heart emitter
    const speech = page.locator("#companion-speech-text");
    await expect(speech).not.toBeEmpty();
  });

  test("mascot toggle in settings hides and shows companion", async ({
    page,
  }) => {
    await page.goto("/");
    // Open settings panel
    await page.locator(".open-settings").click();
    await expect(page.locator(".side-settings")).toHaveClass(/open/);

    const toggle = page.locator("#mascot-toggle");
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toBeChecked();

    // Toggle off
    await page.evaluate(() => {
      const el = document.getElementById("mascot-toggle");
      el.checked = false;
      el.dispatchEvent(new Event("change"));
    });
    const widget = page.locator("#mascot-companion-widget");
    await expect(widget).toBeHidden();

    // Toggle on
    await page.evaluate(() => {
      const el = document.getElementById("mascot-toggle");
      el.checked = true;
      el.dispatchEvent(new Event("change"));
    });
    await expect(widget).toBeVisible();
  });

  test("mascot character can be swapped in settings and updates companion", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".open-settings").click();

    const select = page.locator("#mascot-select");
    await select.selectOption("kip");

    // Badge and avatar should update to Kip the Cyber-Cat
    const mascotName = page.locator("#mascot-companion-widget .mascot-badge-tag");
    await expect(mascotName).toContainText("Kip");
    await expect(page.locator(".mascot-svg.mascot-kip")).toBeVisible();
  });

  test("onboarding tour launches spotlight overlay and advances through steps", async ({
    page,
  }) => {
    await page.goto("/");
    const tourBtn = page.locator("#companion-tour-btn");
    await tourBtn.click();

    const overlay = page.locator("#mascot-tour-overlay");
    await expect(overlay).toBeVisible();

    const cardTitle = page.locator(".tour-step-title");
    await expect(cardTitle).toBeVisible();

    // Click Next Step
    const nextBtn = page.locator("#tour-next-btn");
    await nextBtn.click();

    // Step counter should show step 2
    await expect(page.locator(".tour-step-counter")).toContainText("Step 2");

    // Close tour
    await page.locator("#tour-skip-btn").click();
    await expect(overlay).toBeHidden();
  });

  test("restart onboarding in settings resets tours", async ({ page }) => {
    await page.goto("/");
    await page.locator(".open-settings").click();

    const restartBtn = page.locator("#restart-all-onboarding-btn");
    await expect(restartBtn).toBeVisible();
    await restartBtn.click();

    // Toast confirmation
    const toast = page.locator(".toast");
    await expect(toast).toContainText("onboarding tours restarted");
  });

  test("companion mode switches between follow and specialist", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator(".open-settings").click();

    const modeSelect = page.locator("#companion-mode-select");
    await modeSelect.selectOption("specialist");

    // Switch to Calendar view: specialist should be Chronos the Time Owl
    await page.locator(".close-settings").click();
    await page.locator("[data-view='calendar']").click();

    const badge = page.locator("#mascot-companion-widget .mascot-badge-tag");
    await expect(badge).toContainText("Chronos");
  });

  test("tactics view button opens tactics arena and world exploration", async ({
    page,
  }) => {
    await page.goto("/");
    const tacticsBtn = page.locator("[data-view='tactics']");
    await expect(tacticsBtn).toBeVisible();
    await tacticsBtn.click();

    const tacticsContainer = page.locator("#tactics-container");
    await expect(tacticsContainer).toBeVisible();

    // Header title
    await expect(page.locator(".tactics-main-title")).toContainText("Tactics Arena");
    // World map is default mode
    await expect(page.locator(".tactics-world-container")).toBeVisible();
  });

  test("tactics world map allows opening treasure chest and looting rewards", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("[data-view='tactics']").click();

    // Look for treasure node in Whispering Meadow
    const chestNode = page.locator(".world-node-card.node-type-treasure");
    await expect(chestNode).toBeVisible();

    const openBtn = chestNode.locator(".launch-node-btn");
    await openBtn.click();

    // Node should show cleared
    await expect(chestNode.locator(".cleared-badge")).toBeVisible();
  });

  test("tactics squad and pets tab shows squad slots and roster", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("[data-view='tactics']").click();

    // Click Squad & Pets tab
    await page.locator("[data-tactics-mode='squad']").click();
    await expect(page.locator(".squad-roster-card")).toBeVisible();

    // Leader hero slot
    await expect(page.locator(".squad-unit-card.hero-slot")).toBeVisible();

    // Pet cards in roster
    const petCards = page.locator(".pet-card");
    await expect(petCards.first()).toBeVisible();

    // Feed treat button works
    const feedBtn = page.locator(".feed-pet-btn").first();
    await feedBtn.click();

    const toast = page.locator(".toast").filter({ hasText: "Bond increased" });
    await expect(toast).toBeVisible();
  });

  test("chrono tower and dungeons exploration views render correctly", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("[data-view='tactics']").click();

    // Chrono Tower tab
    await page.locator("[data-tactics-mode='tower']").click();
    await expect(page.locator(".tactics-tower-container")).toBeVisible();
    await expect(page.locator(".tower-floor-card").first()).toBeVisible();

    // Dungeons tab
    await page.locator("[data-tactics-mode='dungeon']").click();
    await expect(page.locator(".tactics-dungeon-container")).toBeVisible();
    await expect(page.locator(".dungeon-room-card").first()).toBeVisible();
  });

  test("tactics battle arena starts 7x7 grid combat with turn timeline and AP actions", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("[data-view='tactics']").click();

    // Go to Battle tab & click Quick Skirmish
    await page.locator("[data-tactics-mode='battle']").click();
    await page.locator("#btn-quick-skirmish").click();

    // 7x7 grid stage should be visible
    const grid = page.locator("#tactics-grid-stage");
    await expect(grid).toBeVisible();

    // 49 grid cells (7x7)
    const cells = page.locator(".grid-cell");
    await expect(cells).toHaveCount(49);

    // Turn timeline & Combat HUD
    await expect(page.locator(".arena-turn-timeline")).toBeVisible();
    await expect(page.locator(".combat-hud-panel")).toBeVisible();
    await expect(page.locator(".combat-log-container")).toBeVisible();
  });

  test("hero dashboard contains quick launcher for tactics arena", async ({
    page,
  }) => {
    await page.goto("/");
    await page.locator("[data-view='hero']").click();
    await expect(page.locator("#hero-container")).toBeVisible();

    const tacticsLauncher = page.locator("#hero-launch-tactics-btn");
    await expect(tacticsLauncher).toBeVisible();
    await tacticsLauncher.click();

    // Should navigate into tactics container
    await expect(page.locator("#tactics-container")).toBeVisible();
  });
});
