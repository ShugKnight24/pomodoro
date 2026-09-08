/**
 * telemetryManager.js — Unified Telemetry Coordinator & Action Feed Manager
 * Combines bot detection, coordinate heatmaps, and Google Analytics 4 tracking.
 * Maintains local circular action log for live auditing and export.
 */

"use strict";

import {
  initBotDetector,
  analyzeInteractionEvent,
  getBotScore,
  getTrafficType,
  getDetectedFlags,
} from "./botDetector.js";
import {
  initHeatmapTracker,
  recordClick,
  setActiveView,
  getActiveView,
  getHeatmapPoints,
  clearHeatmapPoints,
  getTopHotspots,
} from "./heatmapTracker.js";
import {
  initGtagService,
  sendEvent,
  trackTimerAction,
  trackViewChange,
  trackFeatureEngagement,
  trackCompanionInteraction,
  trackEasterEggProgress,
  trackRpgAction,
  trackBotSignal,
  getGaStatus,
} from "./gtagService.js";

const ACTIONS_STORAGE_KEY = "pomidor.telemetry.actions";
const MAX_ACTIONS = 300;

let actionFeed = [];

/**
 * Initialize all telemetry components and hook into core app events
 */
export function initTelemetry() {
  loadActions();
  initBotDetector();
  initHeatmapTracker();
  initGtagService();
  bindGlobalInterceptors();
  bindAppLifecycleEvents();
}

function loadActions() {
  try {
    const raw = localStorage.getItem(ACTIONS_STORAGE_KEY);
    if (raw) actionFeed = JSON.parse(raw);
  } catch {
    actionFeed = [];
  }
}

function saveActions() {
  try {
    if (actionFeed.length > MAX_ACTIONS) {
      actionFeed = actionFeed.slice(-MAX_ACTIONS);
    }
    localStorage.setItem(ACTIONS_STORAGE_KEY, JSON.stringify(actionFeed));
  } catch {}
}

/**
 * Record a user action in the local audit log and mirror to GA4
 * @param {string} actionName
 * @param {Object} details
 * @param {string} category
 */
export function recordAction(actionName, details = {}, category = "interaction") {
  const trafficType = getTrafficType();
  const botScore = getBotScore();
  const activeView = getActiveView();

  const entry = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: actionName,
    category,
    view: activeView,
    trafficType,
    botScore,
    details,
    timestamp: Date.now(),
  };

  actionFeed.unshift(entry);
  saveActions();

  window.dispatchEvent(new CustomEvent("telemetry-action-recorded", { detail: entry }));

  return entry;
}

/**
 * Delegate document clicks to capture coordinates, analyze bot patterns, and track actions
 */
function bindGlobalInterceptors() {
  document.addEventListener(
    "click",
    (e) => {
      // 1. Bot heuristic check on click
      const botAnalysis = analyzeInteractionEvent(e);

      // 2. Record heatmap point
      const point = recordClick(e, botAnalysis.trafficType, botAnalysis.botScore);

      // 3. Meaningful action extraction
      const target = e.target;
      if (target && target instanceof Element) {
        const btn = target.closest("button, a, [role='button'], .nav-item, input, select");
        if (btn) {
          const actionText =
            btn.getAttribute("aria-label") ||
            btn.title ||
            btn.innerText?.trim().slice(0, 30) ||
            btn.id ||
            btn.className;

          recordAction(
            `Click: ${actionText || btn.tagName}`,
            {
              selector: point?.selector || "",
              tag: btn.tagName.toLowerCase(),
            },
            "ui_click"
          );
        }
      }
    },
    { capture: true, passive: true }
  );

  // Intercept navigation tab switches
  document.addEventListener("click", (e) => {
    const navBtn = e.target.closest("[data-view]");
    if (navBtn) {
      const targetView = navBtn.getAttribute("data-view");
      const currentView = getActiveView();
      if (targetView && targetView !== currentView) {
        const dwellMs = setActiveView(targetView);
        trackViewChange(currentView, targetView, dwellMs);
        recordAction(
          `Navigated to ${targetView}`,
          { from: currentView, to: targetView, dwellSec: Math.round(dwellMs / 1000) },
          "navigation"
        );
      }
    }
  });
}

/**
 * Hook into cross-module events across Pomodoro, Tasks, Gamification, and Chores
 */
function bindAppLifecycleEvents() {
  // Timer events
  window.addEventListener("pomodoro-start", (e) => {
    trackTimerAction("start", e.detail);
    recordAction("Timer Started", e.detail || {}, "timer");
  });

  window.addEventListener("pomodoro-pause", (e) => {
    trackTimerAction("pause", e.detail);
    recordAction("Timer Paused", e.detail || {}, "timer");
  });

  window.addEventListener("pomodoro-reset", (e) => {
    trackTimerAction("reset", e.detail);
    recordAction("Timer Reset", e.detail || {}, "timer");
  });

  window.addEventListener("pomodoro-complete", (e) => {
    trackTimerAction("complete", e.detail);
    recordAction("Timer Completed (Session Finished)", e.detail || {}, "timer");
  });

  // Task events
  window.addEventListener("task-complete", (e) => {
    trackFeatureEngagement("tasks", "complete", e.detail);
    recordAction("Task Completed", e.detail || {}, "task");
  });

  // Companion Chores Easter Egg events
  window.addEventListener("companion-chores-updated", (e) => {
    const count = e.detail?.count || 0;
    trackEasterEggProgress(`chore_stage_${count}`, "progress", count === 5);
    recordAction(`Companion Chore Progress (${count}/5)`, e.detail || {}, "easter_egg");
  });

  // Hero RPG events
  document.addEventListener("hero-updated", (e) => {
    recordAction("RPG Hero Updated", { level: e.detail?.hero?.level }, "rpg");
  });

  document.addEventListener("hero-level-up", (e) => {
    trackRpgAction("level_up", { level: e.detail?.level });
    recordAction(`RPG Hero Level Up (${e.detail?.level})`, e.detail || {}, "rpg");
  });

  // Bot analysis alert
  window.addEventListener("bot-analysis-updated", (e) => {
    const { botScore, trafficType, flags } = e.detail;
    if (trafficType === "bot") {
      trackBotSignal(botScore, flags);
    }
  });
}

export function getRecentActions(limit = 20) {
  return actionFeed.slice(0, limit);
}

export function clearAllTelemetry() {
  actionFeed = [];
  localStorage.removeItem(ACTIONS_STORAGE_KEY);
  clearHeatmapPoints();
  window.dispatchEvent(new CustomEvent("telemetry-cleared"));
}

export function exportTelemetryJson() {
  const payload = {
    exportDate: new Date().toISOString(),
    gaStatus: getGaStatus(),
    botAnalysis: {
      score: getBotScore(),
      trafficType: getTrafficType(),
      flags: getDetectedFlags(),
    },
    hotspots: getTopHotspots(10),
    heatmapPointsCount: getHeatmapPoints().length,
    actionsCount: actionFeed.length,
    actions: actionFeed,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pomidor-telemetry-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getTelemetrySummary() {
  const points = getHeatmapPoints();
  const humanCount = actionFeed.filter((a) => a.trafficType === "human").length;
  const botCount = actionFeed.filter((a) => a.trafficType === "bot").length;
  const suspiciousCount = actionFeed.filter((a) => a.trafficType === "suspicious").length;
  const total = actionFeed.length || 1;

  return {
    totalActions: actionFeed.length,
    totalClicks: points.length,
    humanPercent: Math.round((humanCount / total) * 100),
    botPercent: Math.round((botCount / total) * 100),
    suspiciousPercent: Math.round((suspiciousCount / total) * 100),
    botScore: getBotScore(),
    trafficType: getTrafficType(),
    detectedFlags: getDetectedFlags(),
    hotspots: getTopHotspots(6),
    gaStatus: getGaStatus(),
  };
}
