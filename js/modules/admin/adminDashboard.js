/**
 * adminDashboard.js — Admin Console, Multi-Tenant Studio & Telemetry Command Center
 * Clean Apple/Linear double-bezel aesthetic. 100% SVG vector icons (zero emojis).
 */

"use strict";

import { getIcon } from "../../utils/icons.js";
import { renderMascotSvg } from "../mascot/mascotSprites.js";
import {
  getActiveTenant,
  getAllTenants,
  switchTenant,
  resetTenantState,
} from "../social/profileManager.js";
import {
  getTelemetrySummary,
  getRecentActions,
  clearAllTelemetry,
  exportTelemetryJson,
  recordAction,
} from "../telemetry/telemetryManager.js";
import { openHeatmapOverlay } from "../telemetry/telemetryUi.js";
import { sendEvent } from "../telemetry/gtagService.js";
import { showSuccess, showInfo } from "../toast.js";
import { escapeHtml } from "../../utils/sanitize.js";
import { safeGet } from "../../utils/storage.js";

const TENANT_STORAGE_PREFIX = "pomidor.tenant.";

export function initAdminDashboard() {
  renderImpersonationBar();

  window.addEventListener("tenant-switched", () => {
    renderImpersonationBar();
    const container = document.getElementById("admin-container");
    if (container && !container.classList.contains("hidden")) {
      renderAdminDashboard();
    }
  });

  window.addEventListener("telemetry-action-recorded", () => {
    const container = document.getElementById("admin-container");
    if (container && !container.classList.contains("hidden")) {
      renderAdminDashboard();
    }
  });
}

/**
 * Omnipresent Impersonation Bar in header / top bar
 */
export function renderImpersonationBar() {
  let bar = document.getElementById("admin-impersonation-bar");
  const settingsControls = document.querySelector(".settings-controls");
  if (!settingsControls) return;

  if (!bar) {
    bar = document.createElement("div");
    bar.id = "admin-impersonation-bar";
    bar.className = "admin-impersonation-bar";
    settingsControls.insertBefore(bar, settingsControls.firstChild);
  }

  const current = getActiveTenant();
  const all = getAllTenants();

  bar.innerHTML = `
    <div class="impersonation-inner" title="Active Tenant Persona">
      <div class="impersonation-mascot">
        ${renderMascotSvg(current.avatarMascot, "idle", 22)}
      </div>
      <div class="impersonation-label">
        <span class="impersonation-prefix">Tenant:</span>
        <strong class="impersonation-name">${current.name}</strong>
      </div>
      <span class="impersonation-role-tag ${current.role}">${current.role.toUpperCase()}</span>
      <div class="impersonation-select-wrap">
        <select id="header-tenant-select" class="impersonation-select" aria-label="Switch active tenant persona">
          ${all
            .map(
              (t) => `
            <option value="${t.id}" ${t.id === current.id ? "selected" : ""}>
              ${t.name} (${t.title})
            </option>
          `
            )
            .join("")}
        </select>
      </div>
    </div>
  `;

  const select = bar.querySelector("#header-tenant-select");
  if (select) {
    select.addEventListener("change", (e) => {
      const targetId = e.target.value;
      if (targetId && targetId !== current.id) {
        switchTenant(targetId);
      }
    });
  }
}

/**
 * Render the dedicated Admin Console View (#admin-container)
 */
export function renderAdminDashboard() {
  const container = document.getElementById("admin-container");
  if (!container) return;

  const current = getActiveTenant();
  const tenants = getAllTenants();
  const summary = getTelemetrySummary();
  const recentActions = getRecentActions(15);

  container.innerHTML = `
    <div class="admin-wrapper">
      <!-- 1. Header Banner -->
      <div class="admin-header-card double-bezel-card">
        <div class="admin-header-title-block">
          <span class="admin-pill-eyebrow">
            ${getIcon("shield", { size: 13 })} <span>Super-Admin Command Console</span>
          </span>
          <h2 class="admin-main-title">Tenant State Directory &amp; Telemetry Studio</h2>
          <p class="admin-subcopy">
            Hot-swap tenant context to verify isolated state snapshots, inspect partition payloads, and monitor client-side telemetry in real time.
          </p>
        </div>

        <div class="admin-header-actions">
          <button class="admin-action-btn primary" id="admin-open-heatmap-btn">
            ${getIcon("eye", { size: 14 })} <span>Launch Heatmap Overlay</span>
          </button>
          <button class="admin-action-btn" id="admin-export-telemetry-btn">
            ${getIcon("download", { size: 14 })} <span>Export Telemetry JSON</span>
          </button>
        </div>
      </div>

      <!-- 2. Multi-Tenant Directory & Impersonation Hub -->
      <div class="admin-card double-bezel-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            ${getIcon("database", { size: 16 })}
            <h3>Multi-Tenant Data Partition Directory</h3>
          </div>
          <span class="admin-counter-pill">${tenants.length} Partition Slots</span>
        </div>
        <p class="card-subcopy">Each tenant has fully isolated localStorage storage. Switch between them to test app behavior.</p>

        <div class="tenant-directory-grid">
          ${tenants
            .map((t) => {
              const isActive = t.id === current.id;
              const storageBreakdown = getTenantStorageStats(t.id);

              return `
                <div class="tenant-card ${isActive ? "active-tenant-card" : ""}">
                  <div class="tenant-card-top">
                    <div class="tenant-mascot-frame" style="--accent: ${t.accent}">
                      ${renderMascotSvg(t.avatarMascot, "idle", 46)}
                    </div>
                    <div class="tenant-card-meta">
                      <div class="tenant-name-row">
                        <strong class="tenant-name">${t.name}</strong>
                        <span class="tenant-role-badge ${t.role}">${t.role.toUpperCase()}</span>
                      </div>
                      <span class="tenant-handle">${t.handle} / ${t.title}</span>
                      <span class="tenant-rpg-badge">
                        ${getIcon("sword", { size: 11 })} Lvl ${t.level} ${t.className}
                      </span>
                    </div>
                  </div>

                  <!-- Storage Footprint -->
                  <div class="tenant-storage-breakdown">
                    <div class="storage-item" title="Stored Tasks">
                      <span class="storage-label">Tasks</span>
                      <strong class="storage-val">${storageBreakdown.tasks}</strong>
                    </div>
                    <div class="storage-item" title="Habits">
                      <span class="storage-label">Habits</span>
                      <strong class="storage-val">${storageBreakdown.habits}</strong>
                    </div>
                    <div class="storage-item" title="Vault Notes">
                      <span class="storage-label">Notes</span>
                      <strong class="storage-val">${storageBreakdown.notes}</strong>
                    </div>
                    <div class="storage-item" title="Total Focus Hours">
                      <span class="storage-label">Focus</span>
                      <strong class="storage-val">${t.focusHours}h</strong>
                    </div>
                  </div>

                  <!-- Status & Room -->
                  <div class="tenant-status-pill-row">
                    <span class="tenant-status-pill">
                      ${getIcon("clock", { size: 11 })} <em>${escapeHtml(t.status)}</em>
                    </span>
                    <span class="tenant-room-pill">
                      ${getIcon("castle", { size: 11 })} ${t.room}
                    </span>
                  </div>

                  <!-- Card Action Buttons -->
                  <div class="tenant-card-actions">
                    ${
                      isActive
                        ? `<button class="tenant-btn active-state" disabled>${getIcon("check", { size: 13 })} Active Context</button>`
                        : `<button class="tenant-btn impersonate-btn" data-switch-id="${t.id}">${getIcon("user", { size: 13 })} Impersonate</button>`
                    }
                    <button class="tenant-btn reset-btn" data-reset-id="${t.id}" title="Reset ${t.name}'s data to default template">
                      ${getIcon("refresh", { size: 13 })} <span>Reset</span>
                    </button>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>

      <!-- 3. Telemetry Studio & Traffic Intelligence -->
      <div class="admin-card double-bezel-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            ${getIcon("chart", { size: 16 })}
            <h3>Telemetry Intelligence &amp; Traffic Differentiation</h3>
          </div>
          <span class="telemetry-ga-badge" title="Google Analytics 4 Measurement">
            ${getIcon("shield", { size: 12 })} GA4: ${summary.gaStatus.measurementId}
          </span>
        </div>
        <p class="card-subcopy">Real-time WebDriver detection, cursor velocity variance, and engagement heatmaps</p>

        <!-- Traffic Origin Meter -->
        <div class="admin-telemetry-subcard">
          <div class="traffic-meter-header">
            <h4>Real Human vs. Automated Bot Traffic</h4>
            <span class="traffic-meter-sub">Calculated via multi-parameter behavioral fingerprinting</span>
          </div>

          <div class="traffic-meter-wrapper">
            <div class="traffic-meter-track">
              <div class="traffic-meter-bar bar-human" style="width: ${summary.humanPercent}%;" title="Human: ${summary.humanPercent}%"></div>
              <div class="traffic-meter-bar bar-suspicious" style="width: ${summary.suspiciousPercent}%;" title="Suspicious: ${summary.suspiciousPercent}%"></div>
              <div class="traffic-meter-bar bar-bot" style="width: ${summary.botPercent}%;" title="Bot/Driver: ${summary.botPercent}%"></div>
            </div>
            <div class="traffic-meter-legend">
              <span class="legend-item human">
                <span class="legend-dot"></span> Human: <strong>${summary.humanPercent}%</strong>
              </span>
              <span class="legend-item suspicious">
                <span class="legend-dot"></span> Suspicious: <strong>${summary.suspiciousPercent}%</strong>
              </span>
              <span class="legend-item bot">
                <span class="legend-dot"></span> Automated / Bot: <strong>${summary.botPercent}%</strong>
              </span>
            </div>
          </div>

          <!-- Bot Score & Flags -->
          <div class="bot-heuristics-row">
            <div class="bot-score-pill ${summary.botScore >= 61 ? "bot" : summary.botScore >= 26 ? "suspicious" : "human"}">
              <span class="score-label">Active Session Bot Score:</span>
              <strong class="score-value">${summary.botScore} / 100 (${summary.trafficType.toUpperCase()})</strong>
            </div>
            <div class="bot-flags-wrap">
              ${
                summary.detectedFlags.length > 0
                  ? summary.detectedFlags
                      .map((f) => `<span class="bot-flag-pill">${getIcon("toast-warning", { size: 11 })} ${f}</span>`)
                      .join("")
                  : `<span class="bot-flag-pill verified">${getIcon("check", { size: 11 })} Pure Human Velocity &amp; Timing</span>`
              }
            </div>
          </div>
        </div>

        <!-- Metrics & GA4 Row -->
        <div class="admin-metrics-grid">
          <div class="admin-metric-card">
            <div class="metric-card-header">
              <h4>Top Click Hotspots</h4>
              <span class="metric-card-sub">Highest engagement density</span>
            </div>
            <div class="hotspots-table">
              ${
                summary.hotspots.length > 0
                  ? summary.hotspots
                      .map(
                        (h) => `
                  <div class="hotspot-row">
                    <div class="hotspot-meta">
                      <strong class="hotspot-label">${h.label}</strong>
                      <code class="hotspot-selector">${h.selector}</code>
                    </div>
                    <div class="hotspot-stat">
                      <span class="hotspot-count">${h.count} clicks</span>
                      <span class="hotspot-pct">${h.percent}%</span>
                    </div>
                  </div>
                `
                      )
                      .join("")
                  : `<p class="empty-hint">No click hotspots recorded yet in this session.</p>`
              }
            </div>
          </div>

          <div class="admin-metric-card">
            <div class="metric-card-header">
              <h4>Google Analytics 4 &amp; Diagnostics</h4>
              <span class="metric-card-sub">Event pipeline health</span>
            </div>
            <div class="ga-diagnostics-list">
              <div class="diag-item">
                <span class="diag-label">Dispatched GA4 Events:</span>
                <strong class="diag-value">${summary.gaStatus.dispatchedCount}</strong>
              </div>
              <div class="diag-item">
                <span class="diag-label">Queued Events:</span>
                <strong class="diag-value">${summary.gaStatus.queuedCount}</strong>
              </div>
              <div class="diag-item">
                <span class="diag-label">Total Heatmap Clicks:</span>
                <strong class="diag-value">${summary.totalClicks}</strong>
              </div>
              <div class="diag-item">
                <span class="diag-label">Total Actions Recorded:</span>
                <strong class="diag-value">${summary.totalActions}</strong>
              </div>
            </div>

            <div class="diag-actions-row">
              <button class="diag-btn primary" id="admin-send-test-ga-btn">
                ${getIcon("sparkles", { size: 13 })} <span>Send Test GA4 Event</span>
              </button>
              <button class="diag-btn danger" id="admin-clear-telemetry-btn">
                ${getIcon("trash", { size: 13 })} <span>Reset Telemetry</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Live Action Stream -->
        <div class="admin-action-stream-card">
          <div class="metric-card-header">
            <h4>Live Action &amp; Breadcrumb Stream</h4>
            <span class="metric-card-sub">Real-time interaction audit trail</span>
          </div>

          <div class="action-feed-table">
            ${
              recentActions.length > 0
                ? recentActions
                    .map((act) => {
                      const timeAgo = formatTimeAgo(act.timestamp);
                      return `
                  <div class="action-stream-row">
                    <div class="action-stream-left">
                      <span class="action-type-pill ${act.category}">${act.category}</span>
                      <strong class="action-name">${act.name}</strong>
                    </div>
                    <div class="action-stream-right">
                      <span class="action-view-badge">${act.view}</span>
                      <span class="action-traffic-pill ${act.trafficType}">${act.trafficType}</span>
                      <span class="action-time">${timeAgo}</span>
                    </div>
                  </div>
                `;
                    })
                    .join("")
                : `<p class="empty-hint">No actions logged yet in this session.</p>`
            }
          </div>
        </div>
      </div>
    </div>
  `;

  bindAdminEvents(container);
}

function bindAdminEvents(container) {
  // Impersonate buttons
  container.querySelectorAll("[data-switch-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.switchId;
      if (id) switchTenant(id);
    });
  });

  // Reset tenant buttons
  container.querySelectorAll("[data-reset-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.resetId;
      if (id && confirm(`Reset data partition for this tenant to seed template?`)) {
        resetTenantState(id);
      }
    });
  });

  // Heatmap Overlay button
  container.querySelector("#admin-open-heatmap-btn")?.addEventListener("click", () => {
    openHeatmapOverlay();
  });

  // Export JSON
  container.querySelector("#admin-export-telemetry-btn")?.addEventListener("click", () => {
    exportTelemetryJson();
    showSuccess("Telemetry JSON exported successfully.");
  });

  // Send Test GA4
  container.querySelector("#admin-send-test-ga-btn")?.addEventListener("click", () => {
    sendEvent("admin_diagnostic_ping", { origin: "admin_studio" });
    recordAction("Admin GA4 Test Ping Dispatched", { admin: true }, "diagnostic");
    showSuccess("Test event dispatched to Google Analytics 4!");
    renderAdminDashboard();
  });

  // Clear Telemetry
  container.querySelector("#admin-clear-telemetry-btn")?.addEventListener("click", () => {
    if (confirm("Clear all recorded telemetry points and action logs?")) {
      clearAllTelemetry();
      renderAdminDashboard();
      showInfo("Telemetry logs reset.");
    }
  });
}

function getTenantStorageStats(tenantId) {
  const key = `${TENANT_STORAGE_PREFIX}${tenantId}`;
  const snap = safeGet(key, null);
  if (!snap) return { tasks: 0, habits: 0, notes: 0 };
  const tasksCount = (snap.lists || []).reduce((acc, l) => acc + (l.tasks?.length || 0), 0);
  const habitsCount = (snap.habits || []).length;
  const notesCount = (snap.vaultNotes || []).length;
  return { tasks: tasksCount, habits: habitsCount, notes: notesCount };
}

function formatTimeAgo(timestamp) {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}
