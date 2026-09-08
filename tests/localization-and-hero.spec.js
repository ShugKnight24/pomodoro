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
    // When heroes are dismissed, user regains screen real estate above the fold
    const dismissMkt = page.locator("#dismiss-marketing-hero-btn");
    if (await dismissMkt.isVisible()) {
      await dismissMkt.click();
    }
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

  test("premium marketing hero renders with high quality copy, trust pills, and CTAs", async ({
    page,
  }) => {
    const banner = page.locator("#marketing-hero-banner");
    await expect(banner).toBeVisible();

    const headline = banner.locator(".marketing-main-headline");
    await expect(headline).toContainText("Master Your Time. Command Your Focus.");

    const trustPills = banner.locator(".marketing-trust-pill");
    await expect(trustPills).toHaveCount(3);

    const tourBtn = banner.locator("#launch-companion-tour-btn");
    await expect(tourBtn).toBeVisible();

    const focusBtn = banner.locator("#enter-focus-chamber-btn");
    await expect(focusBtn).toBeVisible();

    // Verify zero unicode emojis in marketing hero
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u;
    const bannerText = await banner.innerText();
    expect(emojiRegex.test(bannerText)).toBe(false);
  });

  test("marketing hero is dismissible and restorable via top bar badge", async ({
    page,
  }) => {
    const banner = page.locator("#marketing-hero-banner");
    await expect(banner).toBeVisible();

    // Dismiss marketing hero
    const dismissBtn = banner.locator("#dismiss-marketing-hero-btn");
    await dismissBtn.click();

    // Banner should be hidden
    await expect(page.locator("#marketing-hero-banner")).toHaveCount(0);

    // Restore button appears in top controls
    const restoreBtn = page.locator("#restore-marketing-hero-btn");
    await expect(restoreBtn).toBeVisible();

    // Click restore
    await restoreBtn.click();
    await expect(page.locator("#marketing-hero-banner")).toBeVisible();
  });

  test("interactive companion tutorial modal steps through all 5 companions with snarky dialogue and micro-actions", async ({
    page,
  }) => {
    // Open tutorial from marketing hero
    const tourBtn = page.locator("#launch-companion-tour-btn");
    await tourBtn.click();

    const modal = page.locator("#chrono-interactive-tutorial-modal");
    await expect(modal).toHaveClass(/open/);

    // Step 1: Pomi
    await expect(modal.locator(".companion-display-name")).toHaveText("Pomi the Tomato");
    await expect(modal.locator(".bubble-snarky-quote")).toContainText("Stop refreshing your tabs");

    // Click interactive action for step 1
    const interactBtn = modal.locator("#widget-interact-btn");
    await expect(interactBtn).toBeVisible();
    await interactBtn.click();
    await expect(interactBtn).toBeDisabled();

    // Next step -> Kip
    await modal.locator("#tutorial-next-btn").click();
    await expect(modal.locator(".companion-display-name")).toHaveText("Kip the Cyber-Cat");
    await expect(modal.locator(".bubble-snarky-quote")).toContainText("Fix My Entire Life");

    // Next step -> Bolt
    await modal.locator("#tutorial-next-btn").click();
    await expect(modal.locator(".companion-display-name")).toHaveText("Bolt the Clockwork Bot");
    await expect(modal.locator(".bubble-snarky-quote")).toContainText("BEEP-BOOP");

    // Next step -> Pip
    await modal.locator("#tutorial-next-btn").click();
    await expect(modal.locator(".companion-display-name")).toHaveText("Pip the Penguin");
    await expect(modal.locator(".bubble-snarky-quote")).toContainText("Stop holding 87 chaotic ideas");
    await expect(modal.locator(".bubble-tagline")).toContainText("Your Brain is Not an SSD");

    // Next step -> Chronos
    await modal.locator("#tutorial-next-btn").click();
    await expect(modal.locator(".companion-display-name")).toHaveText("Chronos the Time Owl");
    await expect(modal.locator(".bubble-snarky-quote")).toContainText("suggestion box");

    // Click Ascend / Complete
    const completeBtn = modal.locator("#tutorial-next-btn");
    await completeBtn.click();

    // Modal closes
    await expect(modal).not.toHaveClass(/open/);
  });

  test("companion workshop easter egg puzzle allows solving all 5 chores and claiming the Chrono Sovereign Sigil", async ({
    page,
  }) => {
    // Open chores workshop modal from hero top controls
    const choresBadgeBtn = page.locator("#hero-chores-badge-btn");
    await expect(choresBadgeBtn).toBeVisible();
    await choresBadgeBtn.click();

    const modal = page.locator("#companion-chores-modal");
    await expect(modal).toHaveClass(/open/);

    // Initial counter is 0 / 5
    const counter = modal.locator(".chores-progress-counter");
    await expect(counter).toHaveText("0 / 5");

    // 1. Solve Pomi's chore (Prune 3 vines, wind spring)
    await modal.locator("#pomi-vine-1").click({ force: true });
    await modal.locator("#pomi-vine-2").click({ force: true });
    await modal.locator("#pomi-vine-3").click({ force: true });
    const pomiWindBtn = modal.locator("#pomi-wind-btn");
    await expect(pomiWindBtn).toBeEnabled();
    await pomiWindBtn.click();
    await expect(counter).toHaveText("1 / 5");

    // 2. Solve Kip's chore (Zap 3 glitch-bugs, splice cable)
    await modal.locator('.chore-squad-tab[data-chore-companion="kip"]').click();
    await modal.locator("#kip-bug-1").click({ force: true });
    await modal.locator("#kip-bug-2").click({ force: true });
    await modal.locator("#kip-bug-3").click({ force: true });
    const kipSpliceBtn = modal.locator("#kip-splice-btn");
    await expect(kipSpliceBtn).toBeEnabled();
    await kipSpliceBtn.click();
    await expect(counter).toHaveText("2 / 5");

    // 3. Solve Bolt's chore (Align 3 gears, release steam valve)
    await modal.locator('.chore-squad-tab[data-chore-companion="bolt"]').click();
    await modal.locator("#bolt-gear-1").click({ force: true });
    await modal.locator("#bolt-gear-2").click({ force: true });
    await modal.locator("#bolt-gear-3").click({ force: true });
    const boltSteamBtn = modal.locator("#bolt-steam-btn");
    await expect(boltSteamBtn).toBeEnabled();
    await boltSteamBtn.click();
    await expect(counter).toHaveText("3 / 5");

    // 4. Solve Pip's chore (Catch 3 falling scrolls, pour cold brew)
    await modal.locator('.chore-squad-tab[data-chore-companion="pip"]').click();
    await modal.locator("#pip-scroll-1").click({ force: true });
    await modal.locator("#pip-scroll-2").click({ force: true });
    await modal.locator("#pip-scroll-3").click({ force: true });
    const pipPourBtn = modal.locator("#pip-pour-btn");
    await expect(pipPourBtn).toBeEnabled();
    await pipPourBtn.click();
    await expect(counter).toHaveText("4 / 5");

    // 5. Solve Chronos's chore (Rotate astrolabe 4 times to reach 100%)
    await modal.locator('.chore-squad-tab[data-chore-companion="chronos"]').click();
    const rotateBtn = modal.locator("#chronos-rotate-btn");
    await rotateBtn.click(); // 25%
    await rotateBtn.click(); // 50%
    await rotateBtn.click(); // 75%
    await rotateBtn.click(); // 100% -> Solved!

    // Grand Celebration Stage unlocks
    const celebrationCard = modal.locator(".chores-grand-celebration-card");
    await expect(celebrationCard).toBeVisible();
    await expect(celebrationCard.locator("h2")).toContainText("The Chrono Sovereign Sigil");

    // Claim Grand Reward
    const claimBtn = modal.locator("#claim-grand-easter-egg-btn");
    await expect(claimBtn).toBeVisible();
    await claimBtn.click();

    // Verify Sigil is equipped in hero state
    const heroState = await page.evaluate(() => JSON.parse(localStorage.getItem("pomidor.hero") || "{}"));
    expect(heroState.equipped?.offhand?.id).toBe("o_chrono_sigil");
    expect(heroState.inventory).toContain("o_chrono_sigil");

    // Verify achievement unlocked
    const achievements = await page.evaluate(() => JSON.parse(localStorage.getItem("pomodoro-achievements") || "[]"));
    expect(achievements).toContain("choreMaster");

    // Close modal
    await modal.locator("#close-chores-modal-btn").click();
    await expect(modal).not.toHaveClass(/open/);

    // Hero badge in top controls now reflects all-solved state
    await expect(choresBadgeBtn).toHaveClass(/all-solved/);
  });
});
