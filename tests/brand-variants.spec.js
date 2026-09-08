import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Brand Logo Variants, De-Corning Taglines & Dynamic Switcher", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("all 8 brand variant SVGs exist, are valid XML, have zero emojis, and no corny sanctum/svg notes", () => {
    const variantsDir = path.join(process.cwd(), "icons/brand/variants");
    const expectedFiles = [
      "pomidor_modern_en.svg",
      "pomidor_modern_ru.svg",
      "pomidor_soviet_en.svg",
      "pomidor_soviet_ru.svg",
      "pomidor_edgy_en.svg",
      "pomidor_edgy_ru.svg",
      "pomidor_lighthearted_en.svg",
      "pomidor_lighthearted_ru.svg",
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u;

    for (const filename of expectedFiles) {
      const filePath = path.join(variantsDir, filename);
      expect(fs.existsSync(filePath), `File exists: ${filename}`).toBe(true);

      const content = fs.readFileSync(filePath, "utf-8");
      expect(content.startsWith("<svg"), `Valid SVG tag in ${filename}`).toBe(true);
      expect(content.includes("</svg>"), `Closing SVG tag in ${filename}`).toBe(true);
      expect(emojiRegex.test(content), `Zero emojis in ${filename}`).toBe(false);
      expect(content).not.toContain("Precision Focus Sanctum");
      expect(content).not.toContain("100% SVG");
    }

    // Also verify root brand files have the fixes
    const enRoot = fs.readFileSync(path.join(process.cwd(), "icons/brand/pomidor_en.svg"), "utf-8");
    const ruRoot = fs.readFileSync(path.join(process.cwd(), "icons/brand/помидор_ru.svg"), "utf-8");

    expect(enRoot).not.toContain("Precision Focus Sanctum");
    expect(enRoot).not.toContain("100% SVG");
    expect(ruRoot).not.toContain("Precision Focus Sanctum");
    expect(ruRoot).not.toContain("100% SVG");
    expect(emojiRegex.test(enRoot)).toBe(false);
    expect(emojiRegex.test(ruRoot)).toBe(false);
  });

  test("hero banner renders brand logo and cycles through all 4 variants on click", async ({ page }) => {
    const bannerImg = page.locator("#marketing-brand-banner-img");
    await expect(bannerImg).toBeVisible();

    // Default style: Modern
    await expect(bannerImg).toHaveAttribute("src", /pomidor_modern_en\.svg/);

    const cycleBtn = page.locator("#marketing-brand-cycle-btn");
    await expect(cycleBtn).toBeVisible();

    // 1. Click cycle button -> Soviet Constructivist
    await cycleBtn.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_soviet_en\.svg/);
    await expect(page.locator("#marketing-brand-style-label")).toContainText("Soviet");

    // 2. Click cycle button -> Edgy & Dark
    await cycleBtn.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_edgy_en\.svg/);
    await expect(page.locator("#marketing-brand-style-label")).toContainText("Edgy");

    // 3. Click cycle button -> Lighthearted & Playful
    await cycleBtn.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_lighthearted_en\.svg/);
    await expect(page.locator("#marketing-brand-style-label")).toContainText("Lighthearted");

    // 4. Click cycle button -> Back to Modern
    await cycleBtn.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_modern_en\.svg/);
    await expect(page.locator("#marketing-brand-style-label")).toContainText("Modern");
  });

  test("switching language swaps brand variant between English and Russian versions", async ({ page }) => {
    const bannerImg = page.locator("#marketing-brand-banner-img");
    const cycleBtn = page.locator("#marketing-brand-cycle-btn");

    // Switch to Soviet
    await cycleBtn.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_soviet_en\.svg/);

    // Switch to Russian language via 1-click pill
    const ruPill = page.locator('.hero-lang-pill[data-lang-code="ru"]');
    await ruPill.click();

    // Soviet variant should now load Russian version
    await expect(bannerImg).toHaveAttribute("src", /pomidor_soviet_ru\.svg/);

    // Switch to Edgy while in Russian
    await cycleBtn.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_edgy_ru\.svg/);

    // Switch back to English
    const enPill = page.locator('.hero-lang-pill[data-lang-code="en"]');
    await enPill.click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_edgy_en\.svg/);
  });

  test("settings panel dropdown updates logo variant and syncs bidirectionally", async ({ page }) => {
    // Open Settings panel
    await page.locator(".open-settings").click();
    const brandSelect = page.locator("#brand-logo-select");
    await expect(brandSelect).toBeVisible();

    // Select "edgy" from settings dropdown
    await brandSelect.selectOption("edgy");

    const bannerImg = page.locator("#marketing-brand-banner-img");
    await expect(bannerImg).toHaveAttribute("src", /pomidor_edgy_en\.svg/);

    // Close settings
    await page.locator(".close-settings").click();

    // Cycle from hero button -> should advance to "lighthearted"
    await page.locator("#marketing-brand-cycle-btn").click();
    await expect(bannerImg).toHaveAttribute("src", /pomidor_lighthearted_en\.svg/);

    // Reopen settings and verify dropdown synced to "lighthearted"
    await page.locator(".open-settings").click();
    await expect(brandSelect).toHaveValue("lighthearted");
  });

  test("marketing text and hero showcase have no pretentious sanctum phrasing", async ({ page }) => {
    const heroText = await page.locator(".interactive-hero").innerText();
    expect(heroText).not.toContain("Precision Focus Sanctum");
    expect(heroText).not.toContain("Chrono Sanctum");
    expect(heroText).not.toContain("personal productivity sanctum");
    expect(heroText).toContain("Master Your Time & Focus");
  });
});
