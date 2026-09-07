import { test, expect } from "@playwright/test";
import { seedProfile } from "./helpers.js";

test.describe("Settings Drawer Redesign & Sticky Controls", () => {
  test.beforeEach(async ({ page }) => {
    await seedProfile(page, "committed");
    await page.goto("/");
  });

  test("settings drawer opens and displays sticky header, nav tabs, cards, and sticky footer", async ({ page }) => {
    const settingsBtn = page.locator(".open-settings");
    const drawer = page.locator(".side-settings");
    const backdrop = page.locator("#settings-backdrop");
    const header = page.locator(".settings-header");
    const footer = page.locator(".settings-footer");
    const closeBtn = page.locator(".close-settings");
    const doneBtn = page.locator("#settings-done-btn");

    await expect(drawer).not.toBeVisible();
    await settingsBtn.click();
    await expect(drawer).toBeVisible();
    await expect(backdrop).toHaveClass(/open/);

    // Sticky header and footer should be visible
    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();
    await expect(closeBtn).toBeVisible();
    await expect(doneBtn).toBeVisible();

    // Close using close button
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
    await expect(backdrop).not.toHaveClass(/open/);
  });

  test("close button and done button remain visible and interactable when scrolled to the bottom", async ({ page }) => {
    const settingsBtn = page.locator(".open-settings");
    const drawer = page.locator(".side-settings");
    const closeBtn = page.locator(".close-settings");
    const doneBtn = page.locator("#settings-done-btn");
    const scrollBody = page.locator("#settings-scroll-body");

    await settingsBtn.click();
    await expect(drawer).toBeVisible();

    // Scroll the drawer body to the absolute bottom
    await scrollBody.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Verify close button is visible in the viewport and clickable without scrolling up
    await expect(closeBtn).toBeVisible();
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox.y).toBeGreaterThanOrEqual(0);
    expect(closeBox.y).toBeLessThan(100); // Stuck to the top header!

    // Verify done button is visible at bottom
    await expect(doneBtn).toBeVisible();
    const doneBox = await doneBtn.boundingBox();
    expect(doneBox).not.toBeNull();

    // Click close button directly while still scrolled to bottom
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();
  });

  test("category filter tabs properly toggle visibility of cards", async ({ page }) => {
    await page.locator(".open-settings").click();
    await expect(page.locator(".side-settings")).toBeVisible();

    const tabAppearance = page.locator(".settings-nav-tab[data-settings-tab='appearance']");
    const tabTimer = page.locator(".settings-nav-tab[data-settings-tab='timer']");
    const tabCompanions = page.locator(".settings-nav-tab[data-settings-tab='companions']");
    const tabData = page.locator(".settings-nav-tab[data-settings-tab='data']");
    const tabAll = page.locator(".settings-nav-tab[data-settings-tab='all']");

    // Appearance tab
    await tabAppearance.click();
    await expect(tabAppearance).toHaveClass(/active/);
    await expect(page.locator("#app-theme-select")).toBeVisible();
    await expect(page.locator("#brand-logo-select")).toBeVisible();
    await expect(page.locator("#timer-style-select")).not.toBeVisible();
    await expect(page.locator("#mascot-select")).not.toBeVisible();
    await expect(page.locator("#export-data")).not.toBeVisible();

    // Timer tab
    await tabTimer.click();
    await expect(tabTimer).toHaveClass(/active/);
    await expect(page.locator("#timer-style-select")).toBeVisible();
    await expect(page.locator(".preset-buttons")).toBeVisible();
    await expect(page.locator("#app-theme-select")).not.toBeVisible();
    await expect(page.locator("#export-data")).not.toBeVisible();

    // Companions tab
    await tabCompanions.click();
    await expect(tabCompanions).toHaveClass(/active/);
    await expect(page.locator("#mascot-select")).toBeVisible();
    await expect(page.locator("#restart-all-onboarding-btn")).toBeVisible();
    await expect(page.locator("#app-theme-select")).not.toBeVisible();

    // Data tab
    await tabData.click();
    await expect(tabData).toHaveClass(/active/);
    await expect(page.locator("#export-data")).toBeVisible();
    await expect(page.locator("#notification-status")).toBeVisible();
    await expect(page.locator("#mascot-select")).not.toBeVisible();

    // Back to All
    await tabAll.click();
    await expect(page.locator("#app-theme-select")).toBeVisible();
    await expect(page.locator("#timer-style-select")).toBeVisible();
    await expect(page.locator("#mascot-select")).toBeVisible();
    await expect(page.locator("#export-data")).toBeVisible();
  });

  test("closing via Done button, backdrop click, and Escape key", async ({ page }) => {
    const settingsBtn = page.locator(".open-settings");
    const drawer = page.locator(".side-settings");
    const doneBtn = page.locator("#settings-done-btn");
    const backdrop = page.locator("#settings-backdrop");

    // Test 1: Done button
    await settingsBtn.click();
    await expect(drawer).toBeVisible();
    await doneBtn.click();
    await expect(drawer).not.toBeVisible();

    // Test 2: Backdrop click
    await settingsBtn.click();
    await expect(drawer).toBeVisible();
    // Click outside drawer on backdrop (left side of screen)
    await page.mouse.click(50, 200);
    await expect(drawer).not.toBeVisible();

    // Test 3: Escape key
    await settingsBtn.click();
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
  });

  test("settings changes function and persist", async ({ page }) => {
    await page.locator(".open-settings").click();
    await expect(page.locator(".side-settings")).toBeVisible();

    // Switch theme to 'midnight'
    await page.locator("#app-theme-select").selectOption("midnight");
    await expect(page.locator("html")).toHaveAttribute("data-app-theme", "midnight");

    // Switch brand logo style to 'soviet'
    await page.locator("#brand-logo-select").selectOption("soviet");
    await expect(page.locator("html")).toHaveAttribute("data-brand-logo-style", "soviet");

    // Select preset 50/10
    const preset50 = page.locator(".preset-btn[data-session='50']");
    await preset50.click();
    await expect(preset50).toHaveClass(/active/);

    // Close drawer using Done button
    await page.locator("#settings-done-btn").click({ force: true });
    await expect(page.locator(".side-settings")).not.toBeVisible();

    // Reload and check persistence
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-app-theme", "midnight");
    await expect(page.locator("html")).toHaveAttribute("data-brand-logo-style", "soviet");
  });
});
