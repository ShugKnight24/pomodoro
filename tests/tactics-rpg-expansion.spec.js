import { test, expect } from "@playwright/test";
import { seedProfile } from "./helpers.js";

test.describe("Final Fantasy Tactics RPG Expansion & Interactive Hero Showcase", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page, "committed");
  });

  test("interactive hero animated showcase renders, charges energy on core tap, and slices task", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify hero animated showcase is visible by default
    const showcase = page.locator("#hero-animated-showcase");
    await expect(showcase).toBeVisible();

    // Verify 3 pillars exist
    await expect(page.locator("#showcase-card-focus")).toBeVisible();
    await expect(page.locator("#showcase-card-tasks")).toBeVisible();
    await expect(page.locator("#showcase-card-tactics")).toBeVisible();

    // Tap interactive core to charge energy
    const core = page.locator("#interactive-core-diorama");
    const energyValue = page.locator("#core-energy-value");
    const initialText = await energyValue.innerText();
    const initialVal = parseInt(initialText, 10);

    await core.click();
    const updatedText = await energyValue.innerText();
    const updatedVal = parseInt(updatedText, 10);
    expect(updatedVal).toBeGreaterThan(initialVal);

    // Interactive task slicing
    const taskItem = page.locator("#demo-task-item");
    await taskItem.click();
    await expect(taskItem).toHaveClass(/sliced/);

    // Diorama Job tab switching
    const blackMageTab = page.locator('[data-diorama-job="black_mage"]');
    await blackMageTab.click();
    await expect(page.locator("#diorama-job-name")).toHaveText("Black Mage");
    await expect(page.locator("#diorama-job-skill")).toContainText("Fira");
  });

  test("hero showcase can be dismissed and restored via restore button", async ({
    page,
  }) => {
    await page.goto("/");

    const showcase = page.locator("#hero-animated-showcase");
    await expect(showcase).toBeVisible();

    // Click dismiss button
    const dismissBtn = page.locator("#dismiss-hero-showcase-btn");
    await dismissBtn.click();
    await expect(showcase).toBeHidden();

    // Restore button should now be visible in top controls
    const restoreBtn = page.locator("#restore-hero-showcase-btn");
    await expect(restoreBtn).toBeVisible();

    // Click restore button
    await restoreBtn.click();
    await expect(showcase).toBeVisible();
  });

  test("mascot companion speech header layout and interaction chip are tidy and uncrowded", async ({
    page,
  }) => {
    await page.goto("/");

    const widget = page.locator("#mascot-companion-widget");
    await expect(widget).toBeVisible();

    const speechHeader = widget.locator(".speech-header");
    await expect(speechHeader).toBeVisible();

    const left = speechHeader.locator(".speech-header-left");
    const right = speechHeader.locator(".speech-header-right");
    await expect(left).toBeVisible();
    await expect(right).toBeVisible();

    // Verify interaction trigger chip contains the XP badge cleanly
    const triggerChip = widget.locator("#companion-interact-btn");
    await expect(triggerChip).toBeVisible();
    const badge = triggerChip.locator(".companion-interaction-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("XP");
  });

  test("tactics guild tavern displays recruitable job candidates with SVG sprites and gold recruitment", async ({
    page,
  }) => {
    await page.goto("/");

    // Navigate to Tactics view
    const tacticsBtn = page.locator("[data-view='tactics']");
    await expect(tacticsBtn).toBeVisible();
    await tacticsBtn.click();

    // Switch to Guild & Party tab
    const squadTab = page.locator('#btn-tab-squad, [data-tactics-mode="squad"]').first();
    await squadTab.click();

    // Check active deployment squad card
    const squadCard = page.locator(".squad-roster-card");
    await expect(squadCard).toBeVisible();
    await expect(squadCard.locator(".hero-slot")).toBeVisible();
    await expect(squadCard.locator(".leader-badge")).toHaveText("LEADER");

    // Check Guild Tavern recruitment hall
    const tavernCard = page.locator(".guild-tavern-card");
    await expect(tavernCard).toBeVisible();
    const candidateCards = tavernCard.locator(".guild-candidate-card");
    const count = await candidateCards.count();
    expect(count).toBeGreaterThan(0);

    // Verify Job candidate card has vector SVG (no emojis)
    const firstCandidate = candidateCards.first();
    await expect(firstCandidate.locator(".candidate-avatar svg")).toBeVisible();
    await expect(firstCandidate.locator(".recruit-candidate-btn")).toBeVisible();
  });

  test("battle arena renders CT turn timeline, 7x7 grid coordinates, and FFT command HUD", async ({
    page,
  }) => {
    await page.goto("/");

    // Navigate to Tactics view
    const tacticsBtn = page.locator("[data-view='tactics']");
    await expect(tacticsBtn).toBeVisible();
    await tacticsBtn.click();

    const battleTab = page.locator('#btn-tab-battle, [data-tactics-mode="battle"]').first();
    await battleTab.click();

    // Launch Quick Skirmish
    const quickBtn = page.locator("#btn-quick-skirmish");
    await quickBtn.click();

    // Verify CT Timeline
    const timeline = page.locator(".arena-turn-timeline");
    await expect(timeline).toBeVisible();
    await expect(timeline.locator(".timeline-unit-pill")).not.toHaveCount(0);

    // Verify 7x7 Battlefield Grid
    const grid = page.locator(".battlefield-grid");
    await expect(grid).toBeVisible();
    const cells = grid.locator(".grid-cell");
    await expect(cells).toHaveCount(49);

    // Verify Grid Coordinate Labels
    await expect(page.locator(".grid-coordinate-labels-top")).toBeVisible();
    await expect(page.locator(".grid-coordinate-labels-left")).toBeVisible();

    // Verify Combat HUD
    const hud = page.locator(".combat-hud-panel");
    await expect(hud).toBeVisible();
    await expect(hud.locator(".active-unit-hud")).toBeVisible();

    // Verify Directional Compass
    const compass = hud.locator(".facing-compass-box");
    await expect(compass).toBeVisible();
    await expect(compass.locator('[data-face-dir="N"]')).toBeVisible();
    await expect(compass.locator('[data-face-dir="E"]')).toBeVisible();

    // Test clicking Compass direction button
    await compass.locator('[data-face-dir="N"]').click();
    await expect(compass.locator('.compass-dir-btn.active')).toHaveText(/N/);

    // Verify Limit Break Button exists
    const limitBtn = hud.locator("#btn-combat-limit");
    if (await limitBtn.count() > 0) {
      await expect(limitBtn).toBeVisible();
    }
  });

  test("zero emojis verification across interactive hero and tactics interface", async ({
    page,
  }) => {
    await page.goto("/");

    const heroEl = page.locator(".interactive-hero");
    await expect(heroEl).toBeVisible();
    const heroText = await heroEl.innerText();

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
    expect(emojiRegex.test(heroText)).toBe(false);

    // Check Tactics container
    const tacticsTab = page.locator('#btn-tab-squad, [data-tactics-mode="squad"]').first();
    if (await tacticsTab.isVisible()) {
      await tacticsTab.click();
      const tacticsEl = page.locator("#tactics-container");
      const tacticsText = await tacticsEl.innerText();
      expect(emojiRegex.test(tacticsText)).toBe(false);
    }
  });
});
