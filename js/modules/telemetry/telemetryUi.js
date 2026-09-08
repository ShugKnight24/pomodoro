/**
 * telemetryUi.js — Interactive Heatmap Overlay HUD & Stats Telemetry Dashboard
 * Features full-canvas heat visualization and real-time bot vs human traffic auditing.
 * 100% SVG icons — zero unicode emojis.
 */

"use strict";

import { getIcon } from "../../utils/icons.js";
import {
  renderHeatmapOnCanvas,
  getHeatmapPoints,
  clearHeatmapPoints,
  getActiveView,
} from "./heatmapTracker.js";
import {
  getTelemetrySummary,
  getRecentActions,
  clearAllTelemetry,
  exportTelemetryJson,
  recordAction,
} from "./telemetryManager.js";
import { sendEvent } from "./gtagService.js";
import { showSuccess, showInfo } from "../toast.js";
import { getActiveTenant, getAllTenants } from "../social/profileManager.js";

let overlayContainer = null;
let overlayCanvas = null;
let isOverlayOpen = false;

let overlayFilterTraffic = "all"; // 'all' | 'human' | 'bot'
let overlayFilterView = "all";
let overlayFilterTenant = "all"; // 'all' | tenantId
let overlayRadius = 30;
let overlayIntensity = 0.75;

/**
 * Toggle the interactive Heatmap Overlay
 */
export function toggleHeatmapOverlay() {
  if (isOverlayOpen) {
    closeHeatmapOverlay();
  } else {
    openHeatmapOverlay();
  }
}

export function openHeatmapOverlay() {
  const tenant = typeof getActiveTenant === "function" ? getActiveTenant() : null;
  if (!tenant || tenant.role !== "admin") {
    showInfo("Heatmap HUD is restricted to Administrators.");
    return;
  }

  ensureOverlayDom();
  isOverlayOpen = true;
  overlayContainer.classList.add("active");
  syncOverlayCanvasSize();
  populateHudUserSelect();
  redrawOverlay();
  showInfo("Heatmap Overlay active. Click toolbar to change filters or exit.");
}

export function closeHeatmapOverlay() {
  if (!overlayContainer) return;
  isOverlayOpen = false;
  overlayContainer.classList.remove("active");
}

function ensureOverlayDom() {
  if (overlayContainer) return;

  overlayContainer = document.createElement("div");
  overlayContainer.id = "heatmap-overlay-container";
  overlayContainer.className = "heatmap-overlay-container";
  overlayContainer.setAttribute("role", "dialog");
  overlayContainer.setAttribute("aria-label", "Interaction Heatmap Overlay");

  overlayContainer.innerHTML = `
    <canvas id="heatmap-overlay-canvas" class="heatmap-overlay-canvas"></canvas>
    
    <!-- Floating HUD Toolbar -->
    <div class="heatmap-hud-toolbar" id="heatmap-hud-toolbar">
      <div class="hud-header">
        <div class="hud-title-wrap">
          <span class="hud-pill-badge">${getIcon("sparkles", { size: 13 })} <span>Heatmap Inspector</span></span>
          <strong class="hud-title">Interaction Density HUD</strong>
        </div>
        <button class="hud-close-btn" id="hud-close-overlay-btn" aria-label="Close Heatmap Overlay">
          ${getIcon("close", { size: 14 })}
        </button>
      </div>

      <div class="hud-controls-grid">
        <!-- Traffic Filter -->
        <div class="hud-control-group">
          <label class="hud-control-label">Traffic Classification</label>
          <div class="hud-segmented-tabs" role="group" aria-label="Traffic Filter">
            <button class="hud-tab active" data-hud-traffic="all">All Traffic</button>
            <button class="hud-tab" data-hud-traffic="human">Human</button>
            <button class="hud-tab" data-hud-traffic="bot">Bot / Driver</button>
          </div>
        </div>

        <!-- View Filter -->
        <div class="hud-control-group">
          <label class="hud-control-label" for="hud-view-select">Target View</label>
          <select class="hud-select" id="hud-view-select">
            <option value="all">All Views Combined</option>
            <option value="current">Current Screen (${getActiveView()})</option>
            <option value="pomodoro">Pomodoro Timer</option>
            <option value="todo">Task Todo</option>
            <option value="kanban">Kanban Board</option>
            <option value="vault">Markdown Vault</option>
            <option value="stats">Analytics Stats</option>
            <option value="hero">RPG Hero</option>
          </select>
        </div>

        <!-- User Persona Filter -->
        <div class="hud-control-group">
          <label class="hud-control-label" for="hud-user-select">Filter by User</label>
          <select class="hud-select" id="hud-user-select">
            <option value="all">All Users Combined</option>
          </select>
        </div>

        <!-- Sliders -->
        <div class="hud-sliders-row">
          <div class="hud-slider-group">
            <label class="hud-slider-label">Radius: <span id="hud-radius-val">${overlayRadius}px</span></label>
            <input type="range" id="hud-radius-slider" min="15" max="55" value="${overlayRadius}" class="hud-range" />
          </div>
          <div class="hud-slider-group">
            <label class="hud-slider-label">Intensity: <span id="hud-intensity-val">${Math.round(overlayIntensity * 100)}%</span></label>
            <input type="range" id="hud-intensity-slider" min="20" max="100" value="${Math.round(overlayIntensity * 100)}" class="hud-range" />
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="hud-footer">
        <span class="hud-point-counter" id="hud-points-count">0 Heat Points Recorded</span>
        <div class="hud-actions-wrap">
          <button class="hud-action-btn" id="hud-export-btn" title="Export raw telemetry">
            ${getIcon("download", { size: 12 })} <span>Export</span>
          </button>
          <button class="hud-action-btn danger" id="hud-clear-btn" title="Clear heatmap points">
            ${getIcon("trash", { size: 12 })} <span>Clear</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlayContainer);
  overlayCanvas = overlayContainer.querySelector("#heatmap-overlay-canvas");

  bindOverlayEvents();
}

function bindOverlayEvents() {
  overlayContainer.querySelector("#hud-close-overlay-btn")?.addEventListener("click", closeHeatmapOverlay);

  // Segmented traffic buttons
  overlayContainer.querySelectorAll("[data-hud-traffic]").forEach((btn) => {
    btn.addEventListener("click", () => {
      overlayContainer.querySelectorAll("[data-hud-traffic]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      overlayFilterTraffic = btn.dataset.hudTraffic;
      redrawOverlay();
    });
  });

  // View select
  const viewSelect = overlayContainer.querySelector("#hud-view-select");
  viewSelect?.addEventListener("change", (e) => {
    const val = e.target.value;
    overlayFilterView = val === "current" ? getActiveView() : val;
    redrawOverlay();
  });

  // User Persona select
  const userSelect = overlayContainer.querySelector("#hud-user-select");
  userSelect?.addEventListener("change", (e) => {
    overlayFilterTenant = e.target.value;
    redrawOverlay();
  });

  // Sliders
  const radSlider = overlayContainer.querySelector("#hud-radius-slider");
  radSlider?.addEventListener("input", (e) => {
    overlayRadius = parseInt(e.target.value, 10);
    overlayContainer.querySelector("#hud-radius-val").textContent = `${overlayRadius}px`;
    redrawOverlay();
  });

  const intSlider = overlayContainer.querySelector("#hud-intensity-slider");
  intSlider?.addEventListener("input", (e) => {
    overlayIntensity = parseInt(e.target.value, 10) / 100;
    overlayContainer.querySelector("#hud-intensity-val").textContent = `${Math.round(overlayIntensity * 100)}%`;
    redrawOverlay();
  });

  // Export & Clear
  overlayContainer.querySelector("#hud-export-btn")?.addEventListener("click", () => {
    exportTelemetryJson();
    showSuccess("Telemetry JSON exported.");
  });

  overlayContainer.querySelector("#hud-clear-btn")?.addEventListener("click", () => {
    if (confirm("Clear all recorded click heatmap points?")) {
      clearHeatmapPoints();
      redrawOverlay();
      showInfo("Heatmap points cleared.");
    }
  });

  window.addEventListener("resize", () => {
    if (isOverlayOpen) {
      syncOverlayCanvasSize();
      redrawOverlay();
    }
  });
}

function populateHudUserSelect() {
  if (!overlayContainer) return;
  const userSelect = overlayContainer.querySelector("#hud-user-select");
  if (!userSelect) return;

  const currentVal = overlayFilterTenant || "all";
  const tenants = typeof getAllTenants === "function" ? getAllTenants() : [];

  userSelect.innerHTML = `
    <option value="all" ${currentVal === "all" ? "selected" : ""}>All Users Combined</option>
    ${tenants
      .map(
        (t) => `
      <option value="${t.id}" ${currentVal === t.id ? "selected" : ""}>
        ${t.name} (${(t.role || "user").toUpperCase()})
      </option>
    `
      )
      .join("")}
  `;
}

function syncOverlayCanvasSize() {
  if (!overlayCanvas) return;
  overlayCanvas.width = window.innerWidth;
  overlayCanvas.height = window.innerHeight;
}

function redrawOverlay() {
  if (!overlayCanvas) return;

  const filter = {
    trafficType: overlayFilterTraffic,
    view: overlayFilterView === "all" ? null : overlayFilterView,
    tenantId: overlayFilterTenant === "all" ? null : overlayFilterTenant,
  };

  const points = getHeatmapPoints(filter);
  renderHeatmapOnCanvas(overlayCanvas, points, {
    radius: overlayRadius,
    intensity: overlayIntensity,
    trafficType: overlayFilterTraffic,
  });

  const counter = overlayContainer?.querySelector("#hud-points-count");
  if (counter) {
    const tenants = typeof getAllTenants === "function" ? getAllTenants() : [];
    const activeTenantObj = tenants.find((t) => t.id === overlayFilterTenant);
    const userSuffix = activeTenantObj ? ` • ${activeTenantObj.name}` : " • All Users";
    counter.textContent = `${points.length} Heat Points (${overlayFilterTraffic.toUpperCase()})${userSuffix}`;
  }
}

/* ─── Stats View Telemetry & Traffic Audit Panel ───────────────── */

/**
 * Render the Telemetry & Traffic Audit card inside the Stats View
 */
export function renderTelemetryDashboard() {
  const statsContainer = document.getElementById("stats-container");
  if (!statsContainer) return;

  let card = document.getElementById("stats-telemetry-card");
  if (!card) {
    card = document.createElement("div");
    card.id = "stats-telemetry-card";
    card.className = "stats-telemetry-card";
    statsContainer.appendChild(card);
  }

  const summary = getTelemetrySummary();
  const recentActions = getRecentActions(12);

  card.innerHTML = `
    <div class="telemetry-card-header">
      <div class="telemetry-title-block">
        <span class="telemetry-pill-eyebrow">
          ${getIcon("sparkles", { size: 13 })} <span>Advanced Telemetry & Bot Differentiation</span>
        </span>
        <h3 class="telemetry-main-title">Client-Side Telemetry & Traffic Intelligence</h3>
      </div>
      <div class="telemetry-header-actions">
        <span class="telemetry-ga-badge" title="Google Analytics 4 Status">
          ${getIcon("shield", { size: 13 })} <span>GA4: ${summary.gaStatus.measurementId}</span>
        </span>
        <button class="telemetry-open-overlay-btn" id="stats-open-heatmap-btn" title="Launch Visual Heatmap Overlay">
          ${getIcon("eye", { size: 14 })} <span>Heatmap Overlay</span>
        </button>
      </div>
    </div>

    <div class="telemetry-card-body">
      <!-- 1. Real vs. Bot Traffic Meter -->
      <div class="telemetry-subcard">
        <div class="subcard-header">
          <h4>Traffic Origin & Differentiation</h4>
          <span class="subcard-subcopy">Multi-vector heuristic score based on WebDriver, cursor entropy & input rhythm</span>
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
            <span class="score-label">Current Session Bot Score:</span>
            <strong class="score-value">${summary.botScore} / 100 (${summary.trafficType.toUpperCase()})</strong>
          </div>
          <div class="bot-flags-wrap">
            ${
              summary.detectedFlags.length > 0
                ? summary.detectedFlags
                    .map((f) => `<span class="bot-flag-pill">${getIcon("alert", { size: 11 })} ${f}</span>`)
                    .join("")
                : `<span class="bot-flag-pill verified">${getIcon("check", { size: 11 })} Zero Automation Flags Detected</span>`
            }
          </div>
        </div>
      </div>

      <!-- 2. Top Click Hotspots & Telemetry Metrics -->
      <div class="telemetry-metrics-grid">
        <!-- Hotspots -->
        <div class="telemetry-subcard">
          <div class="subcard-header">
            <h4>Top Interaction Hotspots</h4>
            <span class="subcard-subcopy">Most engaged UI components</span>
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
                    <span class="hotspot-count">${h.count} hits</span>
                    <span class="hotspot-pct">${h.percent}%</span>
                  </div>
                </div>
              `
                    )
                    .join("")
                : `<p class="empty-hint">Interact with the app to generate click hotspot data.</p>`
            }
          </div>
        </div>

        <!-- GA4 & Diagnostics -->
        <div class="telemetry-subcard">
          <div class="subcard-header">
            <h4>Google Analytics 4 & Health</h4>
            <span class="subcard-subcopy">Telemetry pipeline diagnostics</span>
          </div>
          <div class="ga-diagnostics-list">
            <div class="diag-item">
              <span class="diag-label">Dispatched GA4 Events:</span>
              <strong class="diag-value" id="ga-dispatched-counter">${summary.gaStatus.dispatchedCount}</strong>
            </div>
            <div class="diag-item">
              <span class="diag-label">Offline Queue Backlog:</span>
              <strong class="diag-value">${summary.gaStatus.queuedCount} items</strong>
            </div>
            <div class="diag-item">
              <span class="diag-label">Total Heatmap Clicks:</span>
              <strong class="diag-value">${summary.totalClicks} points</strong>
            </div>
            <div class="diag-item">
              <span class="diag-label">Total Actions Recorded:</span>
              <strong class="diag-value">${summary.totalActions} events</strong>
            </div>
          </div>

          <div class="diag-actions-row">
            <button class="diag-btn primary" id="stats-send-test-ga-btn">
              ${getIcon("sparkles", { size: 13 })} <span>Send Test GA4 Event</span>
            </button>
            <button class="diag-btn" id="stats-export-telemetry-btn">
              ${getIcon("download", { size: 13 })} <span>Export JSON</span>
            </button>
            <button class="diag-btn danger" id="stats-clear-telemetry-btn">
              ${getIcon("trash", { size: 13 })} <span>Clear Data</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Live User Action Stream -->
      <div class="telemetry-subcard">
        <div class="subcard-header">
          <h4>Live Action & Breadcrumb Feed</h4>
          <span class="subcard-subcopy">Real-time stream of user navigation, timer interactions, and feature usage</span>
        </div>

        <div class="action-feed-table" id="action-feed-table">
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
  `;

  bindDashboardEvents(card);
}

function bindDashboardEvents(card) {
  card.querySelector("#stats-open-heatmap-btn")?.addEventListener("click", () => {
    openHeatmapOverlay();
  });

  card.querySelector("#stats-send-test-ga-btn")?.addEventListener("click", () => {
    sendEvent("manual_test_event", { trigger: "stats_dashboard" });
    recordAction("Manual Test GA4 Ping Dispatched", { test: true }, "diagnostic");
    showSuccess("Test event dispatched to Google Analytics 4 (gtag)!");
    renderTelemetryDashboard();
  });

  card.querySelector("#stats-export-telemetry-btn")?.addEventListener("click", () => {
    exportTelemetryJson();
    showSuccess("Full Telemetry JSON exported.");
  });

  card.querySelector("#stats-clear-telemetry-btn")?.addEventListener("click", () => {
    if (confirm("Reset all telemetry action logs and heatmap points?")) {
      clearAllTelemetry();
      renderTelemetryDashboard();
      showInfo("Telemetry buffer reset.");
    }
  });
}

function formatTimeAgo(timestamp) {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

// Automatically update dashboard if visible when new actions occur
window.addEventListener("telemetry-action-recorded", () => {
  const card = document.getElementById("stats-telemetry-card");
  const statsCont = document.getElementById("stats-container");
  if (card && statsCont && !statsCont.classList.contains("hidden")) {
    renderTelemetryDashboard();
  }
});
