import { test, expect } from "@playwright/test";

test.describe("Multi-Tenant Accountability Lounge & Admin Telemetry Studio", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test("renders omnipresent impersonation bar with active tenant and switches persona", async ({
    page,
  }) => {
    const bar = page.locator("#admin-impersonation-bar");
    await expect(bar).toBeVisible();

    // Default tenant should be new user onboarding (You)
    await expect(bar.locator(".impersonation-name")).toHaveText("You");
    await expect(bar.locator(".impersonation-role-tag")).toHaveText("USER");

    // Switch to Elena Rostova via top bar select dropdown
    const select = bar.locator("#header-tenant-select");
    await select.selectOption("tenant_elena");

    // Bar should reflect Elena immediately
    await expect(bar.locator(".impersonation-name")).toHaveText("Elena Rostova");
    await expect(bar.locator(".impersonation-role-tag")).toHaveText("USER");

    // Verify localStorage active tenant
    const activeTenant = await page.evaluate(() => localStorage.getItem("pomidor.activeTenantId"));
    expect(activeTenant).toBe("tenant_elena");

    // Verify Elena's tasks are hydrated into active todo list
    const todoTasks = await page.evaluate(() => {
      const lists = JSON.parse(localStorage.getItem("pomodoro-lists") || "[]");
      return lists[0]?.tasks || [];
    });
    expect(todoTasks.some((t) => t.name.includes("Raft") || t.name.includes("benchmark"))).toBeTruthy();

    // Switch to Admin (Shug)
    await select.selectOption("tenant_admin");
    await expect(bar.locator(".impersonation-name")).toHaveText("Shug");
    await expect(bar.locator(".impersonation-role-tag")).toHaveText("ADMIN");
  });

  test("Accountability Lounge renders profile card, focus rooms, buddies, and activity stream", async ({
    page,
  }) => {
    // Navigate to Accountability lounge
    const socialBtn = page.locator('[data-view="social"]');
    await expect(socialBtn).toBeVisible();
    await socialBtn.click();

    const socialContainer = page.locator("#social-container");
    await expect(socialContainer).toBeVisible();
    await expect(socialContainer).not.toHaveClass(/hidden/);

    // Profile card checks
    await expect(socialContainer.locator(".social-user-name")).toHaveText("You");
    await expect(socialContainer.locator(".social-badge.lvl")).toContainText("Level 1");

    // Focus chambers check (4 rooms)
    const roomCards = socialContainer.locator(".focus-room-card");
    await expect(roomCards).toHaveCount(4);

    // Join Design Sprint Lab room
    const joinDesignLabBtn = socialContainer.locator('.room-join-btn[data-room-name="Design Sprint Lab"]');
    await expect(joinDesignLabBtn).toBeVisible();
    await joinDesignLabBtn.click();

    // Header badge should now say In: Design Sprint Lab
    await expect(socialContainer.locator(".social-badge.room")).toContainText("Design Sprint Lab");

    // Accountability squad buddy cards (5 other personas)
    const buddyCards = socialContainer.locator(".buddy-card");
    await expect(buddyCards).toHaveCount(5);

    // High-Five interaction with Elena Rostova
    const elenaHighFiveBtn = socialContainer.locator('.buddy-action-btn.highfive[data-highfive-id="tenant_elena"]');
    await expect(elenaHighFiveBtn).toBeVisible();
    await elenaHighFiveBtn.click();

    // Verify toast notification
    const toastContainer = page.locator("#toast-container");
    await expect(toastContainer).toContainText(/High-Five to Elena/i);

    // Verify activity stream logs the High-Five
    const activityFeed = socialContainer.locator(".activity-row");
    await expect(activityFeed.first()).toContainText(/High-Five/i);

    // Gentle Nudge interaction with Leo Morales
    const leoNudgeBtn = socialContainer.locator('.buddy-action-btn.nudge[data-nudge-id="tenant_leo"]');
    await expect(leoNudgeBtn).toBeVisible();
    await leoNudgeBtn.click();
    await expect(toastContainer).toContainText(/nudge to Leo Morales/i);

    // Privacy toggle interaction
    const streakToggle = socialContainer.locator('.social-privacy-toggle[data-privacy-key="shareStreak"]');
    await expect(streakToggle).toBeChecked();
    const slider = socialContainer.locator('.privacy-item:has([data-privacy-key="shareStreak"]) .slider');
    await slider.scrollIntoViewIfNeeded();
    await slider.click();
    await expect(streakToggle).not.toBeChecked();

    const storedPrivacy = await page.evaluate(() => {
      const snap = JSON.parse(localStorage.getItem("pomidor.tenant.tenant_novice") || "{}");
      return snap.profile?.privacySettings?.shareStreak;
    });
    expect(storedPrivacy).toBe(false);
  });

  test("Admin Studio displays multi-tenant partition directory & telemetry command center", async ({
    page,
  }) => {
    // Navigate to Admin Studio
    const adminBtn = page.locator('[data-view="admin"]');
    await expect(adminBtn).toBeVisible();
    await adminBtn.click();

    const adminContainer = page.locator("#admin-container");
    await expect(adminContainer).toBeVisible();
    await expect(adminContainer).not.toHaveClass(/hidden/);

    // Verify 6 partition cards in directory
    const tenantCards = adminContainer.locator(".tenant-card");
    await expect(tenantCards).toHaveCount(6);

    // Verify active context button on novice card
    await expect(adminContainer.locator(".tenant-btn.active-state")).toHaveText(/Active Context/);

    // Impersonate Darius Vance from Admin Directory
    const dariusImpersonateBtn = adminContainer.locator('.impersonate-btn[data-switch-id="tenant_darius"]');
    await expect(dariusImpersonateBtn).toBeVisible();
    await dariusImpersonateBtn.click();

    // Verify active tenant switched to Darius
    const activeTenant = await page.evaluate(() => localStorage.getItem("pomidor.activeTenantId"));
    expect(activeTenant).toBe("tenant_darius");

    // Impersonation header bar updates
    await expect(page.locator("#admin-impersonation-bar .impersonation-name")).toHaveText("Dr. Darius Vance");

    // Telemetry command center checks
    await expect(adminContainer.locator(".traffic-meter-track")).toBeVisible();
    await expect(adminContainer.locator(".bot-score-pill")).toBeVisible();
    await expect(adminContainer.locator("#admin-send-test-ga-btn")).toBeVisible();

    // Click test GA4 event button
    await adminContainer.locator("#admin-send-test-ga-btn").click();
    await expect(page.locator("#toast-container")).toContainText(/Google Analytics 4/i);
  });

  test("Zero emoji policy: Social and Admin containers contain no raw unicode emojis", async ({
    page,
  }) => {
    // Check Social view
    await page.locator('[data-view="social"]').click();
    const socialHtml = await page.locator("#social-container").innerHTML();

    // Precise emoji regex (surrogate pairs and pictographs, excluding typography)
    const emojiRegex = /\p{Extended_Pictographic}/gu;

    const socialMatches = socialHtml.match(emojiRegex) || [];
    expect(socialMatches.length).toBe(0);

    // Check Admin view
    await page.locator('[data-view="admin"]').click();
    const adminHtml = await page.locator("#admin-container").innerHTML();
    const adminMatches = adminHtml.match(emojiRegex) || [];
    expect(adminMatches.length).toBe(0);
  });
});
