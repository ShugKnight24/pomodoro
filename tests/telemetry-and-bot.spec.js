import { test, expect } from "@playwright/test";

test.describe("Advanced Telemetry, Visual Heatmaps & Bot Differentiation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("bot detector identifies automation driver environment and computes bot score", async ({
    page,
  }) => {
    // In standard Playwright execution, navigator.webdriver is true
    const botAnalysis = await page.evaluate(() => {
      const stored = sessionStorage.getItem("pomidor.telemetry.botAnalysis");
      return stored ? JSON.parse(stored) : null;
    });

    expect(botAnalysis).not.toBeNull();
    expect(botAnalysis.flags).toContain("webdriver_flagged");
    expect(botAnalysis.botScore).toBeGreaterThanOrEqual(60);
    expect(botAnalysis.trafficType).toBe("bot");
  });

  test("heatmap tracker records normalized click coordinates and element metadata", async ({
    page,
  }) => {
    // Click on Pomodoro timer start button
    const startBtn = page.locator("#start, #modern-play").first();
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Click on a nav item
    const listNav = page.locator('[data-view="list"]');
    await listNav.click();

    // Verify points stored in localStorage
    const points = await page.evaluate(() => {
      const raw = localStorage.getItem("pomidor.telemetry.heatmaps");
      return raw ? JSON.parse(raw) : [];
    });

    expect(points.length).toBeGreaterThanOrEqual(2);

    const firstPoint = points[0];
    expect(firstPoint.relX).toBeGreaterThanOrEqual(0);
    expect(firstPoint.relX).toBeLessThanOrEqual(1);
    expect(firstPoint.relY).toBeGreaterThanOrEqual(0);
    expect(firstPoint.relY).toBeLessThanOrEqual(1);
    expect(firstPoint.trafficType).toBeDefined();
    expect(firstPoint.timestamp).toBeGreaterThan(0);
  });

  test("heatmap visual overlay HUD toggles, renders canvas, and allows changing traffic filters", async ({
    page,
  }) => {
    // Switch to admin persona to access heatmap HUD
    const select = page.locator("#header-tenant-select");
    await select.selectOption("tenant_admin");

    // Click heatmap HUD badge button in hero controls
    const hudBtn = page.locator("#hero-heatmap-badge-btn");
    await expect(hudBtn).toBeVisible();
    await hudBtn.click();

    const overlay = page.locator("#heatmap-overlay-container");
    await expect(overlay).toHaveClass(/active/);

    // Canvas exists and has valid dimensions
    const canvas = overlay.locator("#heatmap-overlay-canvas");
    await expect(canvas).toBeVisible();

    // Segmented traffic filter buttons work
    const botTab = overlay.locator('[data-hud-traffic="bot"]');
    await botTab.click();
    await expect(botTab).toHaveClass(/active/);

    const humanTab = overlay.locator('[data-hud-traffic="human"]');
    await humanTab.click();
    await expect(humanTab).toHaveClass(/active/);

    // Close HUD overlay
    const closeBtn = overlay.locator("#hud-close-overlay-btn");
    await closeBtn.click();
    await expect(overlay).not.toHaveClass(/active/);
  });

  test("GA4 service dispatches custom events with enriched dimensions and catches uncaught exceptions", async ({
    page,
  }) => {
    // Intercept gtag to capture dispatched GA4 events
    await page.evaluate(() => {
      window.capturedGaEvents = [];
      const origGtag = window.gtag;
      window.gtag = function (...args) {
        if (args[0] === "event") {
          window.capturedGaEvents.push({ event: args[1], ...args[2] });
        }
        if (typeof origGtag === "function") origGtag.apply(this, args);
      };
    });

    // Start timer to trigger timer_action GA event
    await page.locator("#start, #modern-play").first().click();

    // Switch view to trigger view_change GA event
    await page.locator('[data-view="vault"]').click();

    // Trigger simulated runtime exception
    await page.evaluate(() => {
      window.dispatchEvent(
        new ErrorEvent("error", {
          message: "Telemetry Test Error: Simulating boundary catch",
          filename: "testRunner.js",
          lineno: 42,
        })
      );
    });

    const captured = await page.evaluate(() => window.capturedGaEvents || []);
    expect(captured.length).toBeGreaterThanOrEqual(1);

    // Check timer_action or view_change payload has custom dimensions
    const viewEvent = captured.find((e) => e.event === "view_change" || e.event === "timer_action");
    expect(viewEvent).toBeDefined();
    expect(viewEvent.session_id).toBeDefined();
    expect(viewEvent.traffic_type).toBeDefined();
    expect(viewEvent.bot_score).toBeDefined();

    // Check app_exception was dispatched
    const exceptionEvent = captured.find((e) => e.event === "app_exception");
    expect(exceptionEvent).toBeDefined();
    expect(exceptionEvent.description).toContain("Telemetry Test Error");
  });

  test("stats view renders advanced telemetry card, traffic distribution meter, and live action feed with zero emojis", async ({
    page,
  }) => {
    // Generate some user actions
    await page.locator("#start, #modern-play").first().click();
    await page.locator('[data-view="stats"]').click();

    const telemetryCard = page.locator("#stats-telemetry-card");
    await expect(telemetryCard).toBeVisible();

    // Check traffic distribution meter
    const trafficTrack = telemetryCard.locator(".traffic-meter-track");
    await expect(trafficTrack).toBeVisible();

    // Check bot heuristics pill
    const botPill = telemetryCard.locator(".bot-score-pill");
    await expect(botPill).toBeVisible();

    // Check live action feed stream has entries
    const actionRows = telemetryCard.locator(".action-stream-row");
    const count = await actionRows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Check Send Test GA4 Event button
    const testGaBtn = telemetryCard.locator("#stats-send-test-ga-btn");
    await expect(testGaBtn).toBeVisible();
    await testGaBtn.click();

    // Verify toast appeared
    await expect(page.locator(".toast-success").last()).toBeVisible();

    // Check zero emojis in telemetry card
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]/u;
    const cardText = await telemetryCard.innerText();
    expect(emojiRegex.test(cardText)).toBe(false);
  });
});
