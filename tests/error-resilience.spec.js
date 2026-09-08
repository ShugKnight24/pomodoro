import { test, expect } from "@playwright/test";

test.describe("Error Resilience, Sanitization & Access Control", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("corrupted JSON in localStorage falls back gracefully without page crash", async ({
    page,
  }) => {
    // Inject corrupt JSON into critical localStorage keys
    await page.evaluate(() => {
      localStorage.setItem("pomodoro-lists", "{{{malformed json: true, [");
      localStorage.setItem("pomidor.hero", "UNDEFINED_RAW_VALUE");
      localStorage.setItem("pomidor.companion.settings", "null:null::invalid");
      localStorage.setItem("pomidor.vault.folders", "{bad_brackets]");
      localStorage.setItem("pomidor.telemetry.heatmaps", "<<<corrupt>>>");
    });

    // Reload page with corrupt storage
    await page.reload();

    // Verify main app UI elements render cleanly
    await expect(page.locator("#timer-classic, #timer-modern").first()).toBeVisible();
    await expect(page.locator("#admin-impersonation-bar")).toBeVisible();

    // Verify list view is still usable and defaults were initialized safely
    const listBtn = page.locator('[data-view="list"]');
    await listBtn.click();
    const taskContainer = page.locator(".todo-container, #tasks-container, [data-list-display-container]");
    await expect(taskContainer.first()).toBeVisible();
  });

  test("safe storage gracefully handles QuotaExceededError during saves", async ({
    page,
  }) => {
    // Verify safeSet behavior when localStorage throws QuotaExceededError
    const result = await page.evaluate(async () => {
      const origSet = Storage.prototype.setItem;
      let errorThrown = false;
      Storage.prototype.setItem = function () {
        const err = new DOMException("Quota exceeded", "QuotaExceededError");
        throw err;
      };

      let success = true;
      try {
        const { safeSet } = await import("./js/utils/storage.js");
        success = safeSet("test_quota_key", { data: "test" });
      } catch (e) {
        errorThrown = true;
      } finally {
        Storage.prototype.setItem = origSet;
      }

      return { success, errorThrown };
    });

    // safeSet should catch QuotaExceededError, return false, and not throw uncaught error
    expect(result.errorThrown).toBe(false);
    expect(result.success).toBe(false);
  });

  test("XSS payloads in task names and vault notes are neutralized by escapeHtml", async ({
    page,
  }) => {
    const xssPayload = `<img src="x" onerror="window.__xss_executed=true">`;
    const scriptPayload = `<script>window.__xss_script_executed=true</script>`;

    // Navigate to Todo list view
    await page.locator('[data-view="list"]').click();

    // Add a task with XSS payload
    const taskInput = page.locator("[data-new-task-input]").first();
    await expect(taskInput).toBeVisible();
    await taskInput.fill(`${xssPayload} ${scriptPayload}`);
    await taskInput.press("Enter");

    // Wait slightly to ensure any malicious script would have executed if not escaped
    await page.waitForTimeout(300);

    // Check that XSS was not executed
    const wasXssExecuted = await page.evaluate(() => {
      return Boolean(window.__xss_executed || window.__xss_script_executed);
    });
    expect(wasXssExecuted).toBe(false);

    // Verify the task name is escaped in the DOM
    const taskItem = page.locator(".task-name-text").last();
    await expect(taskItem).toBeVisible();
    const innerHtml = await taskItem.innerHTML();
    expect(innerHtml).not.toContain("<img src=");
    expect(innerHtml).toContain("&lt;img");
  });

  test("companion chat bubble restores when clicking companion avatar after being closed", async ({
    page,
  }) => {
    // Ensure companion avatar exists
    const companionAvatar = page.locator("#companion-avatar-stage");
    await expect(companionAvatar).toBeVisible();

    const chatBubble = page.locator("#companion-speech-bubble");

    // Click companion avatar to ensure bubble is visible
    await companionAvatar.click();
    await expect(chatBubble).toBeVisible();
    await expect(chatBubble).not.toHaveClass(/hidden/);

    // Minimize/close the chat bubble
    const closeBtn = page.locator("#companion-minimize-btn");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(chatBubble).toHaveClass(/hidden/);

    // Clicking companion avatar should restore speech bubble
    await companionAvatar.click();
    await expect(chatBubble).toBeVisible();
    await expect(chatBubble).not.toHaveClass(/hidden/);
  });

  test("Heatmap HUD access is restricted to admin, and multi-user filter works for admin", async ({
    page,
  }) => {
    // 1. As default user (tenant_novice, role: 'user'), heatmap badge button is NOT rendered in hero
    const noviceHudBtn = page.locator("#hero-heatmap-badge-btn");
    await expect(noviceHudBtn).toHaveCount(0);

    // Attempting direct invocation as non-admin triggers warning toast and refuses to open overlay
    await page.evaluate(async () => {
      const { openHeatmapOverlay } = await import("./js/modules/telemetry/telemetryUi.js");
      openHeatmapOverlay();
    });

    const overlay = page.locator("#heatmap-overlay-container");
    await expect(overlay).toHaveCount(0);

    // 2. Switch to Admin tenant (tenant_admin - Shug)
    const impersonationSelect = page.locator("#header-tenant-select");
    await expect(impersonationSelect).toBeVisible();
    await impersonationSelect.selectOption("tenant_admin");

    // Heatmap HUD button should now be visible in Hero banner
    const adminHudBtn = page.locator("#hero-heatmap-badge-btn");
    await expect(adminHudBtn).toBeVisible();

    // Click heatmap HUD button to open overlay
    await adminHudBtn.click();
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveClass(/active/);

    // 3. Verify user selector dropdown exists and contains seeded tenants
    const userSelect = overlay.locator("#hud-user-select");
    await expect(userSelect).toBeVisible();

    // Verify tenant options
    const options = await userSelect.locator("option").allInnerTexts();
    expect(options.some((opt) => opt.includes("All Users"))).toBeTruthy();
    expect(options.some((opt) => opt.includes("Elena Rostova"))).toBeTruthy();
    expect(options.some((opt) => opt.includes("Darius"))).toBeTruthy();

    // Switch filter to Elena Rostova
    await userSelect.selectOption("tenant_elena");
    await expect(userSelect).toHaveValue("tenant_elena");

    // Close HUD overlay
    const closeBtn = overlay.locator("#hud-close-overlay-btn");
    await closeBtn.click();
    await expect(overlay).not.toHaveClass(/active/);
  });
});
