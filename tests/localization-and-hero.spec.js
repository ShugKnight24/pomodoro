import { test, expect } from "@playwright/test";

test.describe("Localization, Real Estate Optimization & Interactive Hero", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("interactive hero renders with dynamic branding and 1-click language switcher", async ({
    page,
  }) => {
    const hero = page.locator(".interactive-hero");
    await expect(hero).toBeVisible();

    // Default English app title
    const appTitle = hero.locator(".hero-app-title");
    await expect(appTitle).toHaveText("Pomidor");

    // Check language pills exist
    const pills = hero.locator(".hero-lang-pill");
    await expect(pills).toHaveCount(4);

    // Check 4 action launchpad cards exist and have SVG icons with zero emojis
    const actionCards = hero.locator(".hero-action-card");
    await expect(actionCards).toHaveCount(4);

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u;
    const heroText = await hero.innerText();
    expect(emojiRegex.test(heroText)).toBe(false);

    const svgIcons = hero.locator(".hero-card-icon svg");
    await expect(svgIcons).toHaveCount(4);
  });

  test("language switching updates app name to respective tomato word and handles Hebrew RTL", async ({
    page,
  }) => {
    const hero = page.locator(".interactive-hero");

    // 1. Switch to Russian
    await hero.locator('[data-lang-code="ru"]').click();
    await expect(hero.locator(".hero-app-title")).toHaveText("Помидор");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    let title = await page.title();
    expect(title).toContain("Помидор");

    // 2. Switch to Azerbaijani
    await hero.locator('[data-lang-code="az"]').click();
    await expect(hero.locator(".hero-app-title")).toHaveText("Pomidor");
    await expect(hero.locator(".hero-app-tagline")).toContainText("Vaxtına sahib ol");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "az");

    // 3. Switch to Hebrew
    await hero.locator('[data-lang-code="he"]').click();
    await expect(hero.locator(".hero-app-title")).toHaveText("עגבנייה");
    await expect(hero.locator(".hero-app-tagline")).toContainText("שלוט בזמנך");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    title = await page.title();
    expect(title).toContain("עגבנייה");

    // 4. Switch back to English
    await hero.locator('[data-lang-code="en"]').click();
    await expect(hero.locator(".hero-app-title")).toHaveText("Pomidor");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("screen real estate is optimized: timer is immediately visible without accordion blockage", async ({
    page,
  }) => {
    // When showcase is dismissed, user regains screen real estate above the fold
    const dismissBtn = page.locator("#dismiss-hero-showcase-btn");
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click();
    }

    // Check timer is immediately in view near top of viewport
    const timer = page.locator("#timer-classic");
    await expect(timer).toBeVisible();

    const box = await timer.boundingBox();
    expect(box).not.toBeNull();
    // Timer top should be within initial viewport (less than 600px from top)
    expect(box.y).toBeLessThan(600);

    // Check old static banner image and redundant dual heading are gone
    await expect(page.locator(".brand-banner")).toHaveCount(0);
    await expect(page.locator("h1:has-text('Pomidor Помидор')")).toHaveCount(0);
  });

  test("technique guide modal opens from hero card with full guide and video", async ({
    page,
  }) => {
    const guideCard = page.locator("#hero-action-guide");
    await guideCard.click();

    const modal = page.locator("#technique-guide-modal");
    await expect(modal).toBeVisible();

    // Check 8 steps and video iframe
    await expect(modal.locator(".guide-steps-list li")).toHaveCount(8);
    await expect(modal.locator("iframe")).toBeVisible();

    // Close modal
    await modal.locator("#close-technique-guide-btn").click();
    await expect(modal).not.toBeVisible();
  });

  test("interactive hero mascot click triggers custom signature interaction", async ({
    page,
  }) => {
    const avatarBox = page.locator("#hero-mascot-avatar-box");
    await expect(avatarBox).toBeVisible();

    // Click avatar stage
    await avatarBox.click();

    // Check speech bubble highlights with signature dialogue
    const speech = page.locator("#hero-mascot-speech");
    await expect(speech).toBeVisible();
    await expect(speech.locator(".hero-speech-sub")).toContainText("full of energy");
  });

  test("tour spotlight tracks target element accurately during page scroll", async ({
    page,
  }) => {
    // Open settings and launch timer tour
    await page.locator(".open-settings").click();
    await page.locator('[data-tour-tool="pomodoro"]').click();

    const overlay = page.locator("#mascot-tour-overlay");
    await expect(overlay).toBeVisible();

    const spotlight = overlay.locator(".tour-spotlight-box");
    await expect(spotlight).toBeVisible();

    // Wait for any initial placement transition to settle
    await page.waitForTimeout(400);

    const initialBox = await spotlight.boundingBox();
    expect(initialBox).not.toBeNull();

    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Scroll the window down 250px
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: "instant" }));
    await page.waitForTimeout(400);

    const afterScrollY = await page.evaluate(() => window.scrollY);
    const scrolledBox = await spotlight.boundingBox();
    expect(scrolledBox).not.toBeNull();

    if (afterScrollY > initialScrollY) {
      // The spotlight box top in viewport coordinates should shift upwards (lower y)
      expect(scrolledBox.y).toBeLessThan(initialBox.y);
    }

    // Close tour
    await overlay.locator("#tour-skip-btn").click();
    await expect(overlay).not.toBeVisible();
  });

  test("experience assignee allows configuring different mascots per tool", async ({
    page,
  }) => {
    // Open companion swap dialog
    const swapBtn = page.locator("#companion-swap-btn");
    await swapBtn.click();

    const dialog = page.locator(".mascot-picker-dialog");
    await expect(dialog).toBeVisible();

    // Switch to experiences tab
    await page.locator("#tab-btn-experiences").click();
    const expPane = page.locator("#pane-experiences");
    await expect(expPane).toBeVisible();

    // Assign Kip to timer
    const timerSelect = expPane.locator('.exp-mascot-select[data-exp-id="pomodoro"]');
    await timerSelect.selectOption("kip");

    // Enable specialist mode by clicking toggle button
    const modeBtn = dialog.locator("#toggle-specialist-mode");
    const modeText = await modeBtn.innerText();
    if (modeText.includes("Switch to Specialist Mode")) {
      await modeBtn.click();
    }

    // Close dialog if still open
    if (await dialog.isVisible()) {
      await page.locator("#close-mascot-picker").click();
    }

    // Companion should now show Kip on timer
    const badge = page.locator("#mascot-companion-widget .companion-badge-pill");
    await expect(badge).toContainText("Kip the Cyber-Cat");
  });

  test("tutorial sample data can be cleared from settings", async ({
    page,
  }) => {
    // Verify initial notes exist in vault
    await page.locator('[data-view="vault"]').click();
    const notesCount = await page.locator(".vault-note-card").count();
    expect(notesCount).toBeGreaterThanOrEqual(1);

    // Open settings and click Clear Tutorial Sample Data
    await page.locator(".open-settings").click();
    const clearBtn = page.locator("#clear-all-tutorial-data-btn");
    await clearBtn.click();

    // Toast appears confirming data cleared
    await expect(page.locator(".toast-success").last()).toBeVisible();
  });
});
