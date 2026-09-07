import { test } from "@playwright/test";
import { seedProfile } from "./helpers.js";

const ARTIFACT_DIR = "/Users/shugmishumunov/.gemini/antigravity/brain/f072a90b-b99e-4473-83b0-11219ea7ac6e";

test.describe("Visual Proof Capture — Living Character Outpost & Carousel", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page, "committed");
  });

  test("captures living outpost, carousel view, and companion expeditions", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForTimeout(1000);

    // 1. Panoramic Living Outpost
    const showcase = page.locator("#hero-animated-showcase");
    await showcase.screenshot({
      path: `${ARTIFACT_DIR}/outpost_panoramic.png`,
    });

    // 2. Carousel Realm Focus Mode
    await page.locator("#outpost-mode-carousel-btn").click();
    await page.waitForTimeout(600);
    await showcase.screenshot({
      path: `${ARTIFACT_DIR}/outpost_carousel.png`,
    });

    // 3. Companion Expeditions Modal
    await page.locator("#showcase-open-chores-btn").click({ force: true });
    await page.waitForTimeout(600);
    const modal = page.locator(".chores-dialog-card");
    await modal.screenshot({
      path: `${ARTIFACT_DIR}/companion_expeditions_modal.png`,
    });
  });
});
