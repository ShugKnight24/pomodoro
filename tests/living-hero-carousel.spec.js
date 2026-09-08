import { test, expect } from "@playwright/test";
import { seedProfile } from "./helpers.js";

test.describe("Living Character Outpost & Interactive Carousel", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page, "committed");
  });

  test("renders all 5 living animated character stations with zero emojis", async ({ page }) => {
    await page.goto("/");

    const showcase = page.locator("#hero-animated-showcase");
    await expect(showcase).toBeVisible();

    // Verify all 5 realm stations exist
    const forgeCard = page.locator("#showcase-card-focus");
    const gridCard = page.locator("#showcase-card-tasks");
    const astralCard = page.locator("#showcase-card-vault");
    const arboretumCard = page.locator("#showcase-card-habits");
    const rampartCard = page.locator("#showcase-card-tactics");

    await expect(forgeCard).toBeVisible();
    await expect(gridCard).toBeVisible();
    await expect(astralCard).toBeVisible();
    await expect(arboretumCard).toBeVisible();
    await expect(rampartCard).toBeVisible();

    // Check that living stages are rendered
    await expect(page.locator("#realm-stage-forge")).toBeVisible();
    await expect(page.locator("#realm-stage-grid")).toBeVisible();
    await expect(page.locator("#realm-stage-astral")).toBeVisible();
    await expect(page.locator("#realm-stage-arboretum")).toBeVisible();
    await expect(page.locator("#realm-stage-rampart")).toBeVisible();

    // Verify zero unicode emojis inside the showcase
    const showcaseText = await showcase.innerText();
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(showcaseText).not.toMatch(emojiRegex);
  });

  test("toggles smoothly between Panoramic Outpost and Realm Focus Carousel modes", async ({ page }) => {
    await page.goto("/");

    const stageWrapper = page.locator("#outpost-stage-wrapper");
    const panoramicBtn = page.locator("#outpost-mode-panoramic-btn");
    const carouselBtn = page.locator("#outpost-mode-carousel-btn");

    // Default mode is panoramic
    await expect(stageWrapper).toHaveClass(/mode-panoramic/);
    await expect(panoramicBtn).toHaveClass(/active/);

    // Switch to Carousel mode
    await carouselBtn.click();
    await expect(stageWrapper).toHaveClass(/mode-carousel/);
    await expect(carouselBtn).toHaveClass(/active/);
    await expect(panoramicBtn).not.toHaveClass(/active/);

    // Carousel controls become visible
    await expect(page.locator(".outpost-carousel-controls")).toBeVisible();

    // Switch back to Panoramic mode
    await panoramicBtn.click();
    await expect(stageWrapper).toHaveClass(/mode-panoramic/);
    await expect(panoramicBtn).toHaveClass(/active/);
  });

  test("navigates carousel via realm pills, next/prev arrows, and dots", async ({ page }) => {
    await page.goto("/");

    // Click Holo-Grid pill (index 1)
    const gridPill = page.locator('.outpost-realm-pill[data-realm-index="1"]');
    await gridPill.click({ force: true });

    const stageWrapper = page.locator("#outpost-stage-wrapper");
    await expect(stageWrapper).toHaveClass(/mode-carousel/);

    // Active dot should be dot 1
    const dot1 = page.locator('.carousel-dot[data-dot-index="1"]');
    await expect(dot1).toHaveClass(/active/);

    // Click Next button -> should advance to index 2 (Astral Archives)
    const nextBtn = page.locator("#outpost-carousel-next");
    await nextBtn.click({ force: true });

    const dot2 = page.locator('.carousel-dot[data-dot-index="2"]');
    await expect(dot2).toHaveClass(/active/);

    // Click Previous button -> should return to index 1
    const prevBtn = page.locator("#outpost-carousel-prev");
    await prevBtn.click({ force: true });
    await expect(dot1).toHaveClass(/active/);

    // Click "All Realms" pill -> should return to panoramic mode
    const allPill = page.locator('.outpost-realm-pill[data-realm-index="-1"]');
    await allPill.click({ force: true });
    await expect(stageWrapper).toHaveClass(/mode-panoramic/);
  });

  test("clicking stations triggers interactive feedback effects and floating loot toasts", async ({ page }) => {
    await page.goto("/");

    // Click Chrono Forge stage -> toast "+15% Flow Energy!"
    const forgeStage = page.locator("#realm-stage-forge");
    await forgeStage.click({ force: true });
    const forgeToast = page.locator("#realm-stage-forge .outpost-floating-toast");
    await expect(forgeToast).toContainText("Flow Energy");

    // Click Holo-Grid stage -> toast "+15 Gold!"
    const gridStage = page.locator("#realm-stage-grid");
    await gridStage.click({ force: true });
    const gridToast = page.locator("#realm-stage-grid .outpost-floating-toast");
    await expect(gridToast).toContainText("Gold");

    // Click Tactics Rampart stage -> sparring dummy shakes and toast "CRITICAL LIMIT BREAK!"
    const rampartStage = page.locator("#realm-stage-rampart");
    await rampartStage.click({ force: true });
    const rampartToast = page.locator("#realm-stage-rampart .outpost-floating-toast");
    await expect(rampartToast).toContainText("CRITICAL");
  });

  test("companion expeditions modal opens without flickering and updates in place", async ({ page }) => {
    await page.goto("/");

    // Open Companion Expeditions Modal
    const expBtn = page.locator("#showcase-open-chores-btn");
    await expBtn.click({ force: true });

    const modal = page.locator("#companion-chores-modal");
    await expect(modal).toBeVisible();
    await expect(page.locator(".chores-dialog-card")).toBeVisible();

    // Verify dignified in-world title (not overt easter egg)
    await expect(page.locator(".chores-main-title")).toHaveText("Outpost Field Duties");

    // Ensure backdrop exists once
    const backdropCount = await page.locator(".chores-backdrop").count();
    expect(backdropCount).toBe(1);

    // Click a tab (Kip)
    const kipTab = page.locator('.chore-squad-tab[data-chore-companion="kip"]');
    await kipTab.click({ force: true });
    await expect(kipTab).toHaveClass(/active/);

    // Backdrop should still be exactly 1, card should NOT have been re-created or destroyed
    expect(await page.locator(".chores-backdrop").count()).toBe(1);

    // Switch back to Pomi
    const pomiTab = page.locator('.chore-squad-tab[data-chore-companion="pomi"]');
    await pomiTab.click({ force: true });

    // Click 3 vine nodes with force: true since they have continuous keyframe pulse
    const node1 = page.locator("#pomi-vine-1");
    const node2 = page.locator("#pomi-vine-2");
    const node3 = page.locator("#pomi-vine-3");

    await node1.click({ force: true });
    await expect(node1).toHaveClass(/snipped/);

    await node2.click({ force: true });
    await expect(node2).toHaveClass(/snipped/);

    await node3.click({ force: true });
    await expect(node3).toHaveClass(/snipped/);

    // Wind button should now be enabled
    const windBtn = page.locator("#pomi-wind-btn");
    await expect(windBtn).toBeEnabled();

    // Click wind button
    await windBtn.click({ force: true });

    // Verify in-place update: tab should show completed checkmark
    await expect(pomiTab).toHaveClass(/done/);
    await expect(page.locator(".chore-solved-view")).toBeVisible();

    // Dialog card is still intact without any full-modal teardown
    await expect(page.locator(".chores-dialog-card")).toBeVisible();
  });
});
