/**
 * gtagService.js — Resilient Google Analytics 4 (GA4) Service & Exception Interceptor
 * Injects custom dimensions (traffic_type, bot_score, session_id, mascot, locale).
 * Features offline event queueing, retry logic, and global unhandled error telemetry.
 */

"use strict";

import { getBotScore, getTrafficType } from "./botDetector.js";

const DEFAULT_MEASUREMENT_ID = "G-ZPF3RH8PG0";
const GA_QUEUE_KEY = "pomidor.telemetry.gaQueue";
const SESSION_ID_KEY = "pomidor.telemetry.sessionId";

let dispatchedEventsCount = 0;
let sessionId = "";

/**
 * Initialize GA4 service, generate session ID, bind offline queue and error listeners
 */
export function initGtagService() {
  initSessionId();
  bindErrorCatchers();
  bindNetworkStatus();
  flushOfflineQueue();
}

function initSessionId() {
  try {
    sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
  } catch {
    sessionId = `sess_${Date.now()}`;
  }
}

export function getSessionId() {
  return sessionId;
}

/**
 * Catch unhandled runtime errors and promise rejections for automated issue logging
 */
function bindErrorCatchers() {
  window.addEventListener("error", (event) => {
    trackException(
      event.message || "Script Error",
      event.filename || "unknown",
      event.lineno || 0,
      event.colno || 0,
      event.error?.stack || "",
      false
    );
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message || (typeof reason === "string" ? reason : "Unhandled Promise Rejection");
    trackException(msg, "Promise", 0, 0, reason?.stack || "", false);
  });
}

/**
 * Listen for network reconnect to flush offline buffered events
 */
function bindNetworkStatus() {
  window.addEventListener("online", () => {
    flushOfflineQueue();
  });
}

/**
 * Read queued events from localStorage
 */
function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(GA_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(GA_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
  } catch {}
}

/**
 * Drain offline queue and dispatch to GA4
 */
function flushOfflineQueue() {
  if (!navigator.onLine) return;
  const queue = getOfflineQueue();
  if (!queue || queue.length === 0) return;

  localStorage.removeItem(GA_QUEUE_KEY);

  for (const item of queue) {
    sendEvent(item.eventName, item.params, false);
  }
}

/**
 * Dispatch an event to Google Analytics (gtag) with automated dimensions
 * @param {string} eventName
 * @param {Object} customParams
 * @param {boolean} allowQueue - whether to buffer offline if disconnected
 */
export function sendEvent(eventName, customParams = {}, allowQueue = true) {
  const traffic = getTrafficType();
  const score = getBotScore();
  const lang = localStorage.getItem("pomodoro-language") || "en";
  const theme = document.body.classList.contains("dark-theme") ? "dark" : "light";
  const mascot = localStorage.getItem("pomidor.activeMascot") || "pomi";

  const payload = {
    traffic_type: traffic,
    bot_score: score,
    session_id: sessionId,
    app_language: lang,
    app_theme: theme,
    active_mascot: mascot,
    timestamp: Date.now(),
    ...customParams,
  };

  // If offline or network unavailable, buffer locally
  if (!navigator.onLine && allowQueue) {
    const queue = getOfflineQueue();
    queue.push({ eventName, params: payload });
    saveOfflineQueue(queue);
    return false;
  }

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      dispatchedEventsCount++;
      notifyDispatched(eventName, payload);
      return true;
    } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...payload,
      });
      dispatchedEventsCount++;
      notifyDispatched(eventName, payload);
      return true;
    }
  } catch (err) {
    if (allowQueue) {
      const queue = getOfflineQueue();
      queue.push({ eventName, params: payload });
      saveOfflineQueue(queue);
    }
    return false;
  }

  return false;
}

function notifyDispatched(eventName, payload) {
  window.dispatchEvent(
    new CustomEvent("ga4-event-dispatched", {
      detail: { eventName, payload, totalDispatched: dispatchedEventsCount },
    })
  );
}

/* ─── Domain-Specific Event Telemetry Wrappers ────────────────── */

export function trackTimerAction(action, { mode = "pomodoro", duration = 25, elapsed = 0 } = {}) {
  sendEvent("timer_action", {
    timer_action_type: action, // 'start' | 'pause' | 'reset' | 'complete' | 'mode_switch'
    timer_mode: mode,
    timer_duration_mins: duration,
    timer_elapsed_secs: elapsed,
  });
}

export function trackViewChange(fromView, toView, dwellMs = 0) {
  sendEvent("view_change", {
    from_view: fromView,
    to_view: toView,
    dwell_duration_sec: Math.round(dwellMs / 1000),
  });
}

export function trackFeatureEngagement(feature, action, meta = {}) {
  sendEvent("feature_engagement", {
    feature_name: feature,
    engagement_action: action,
    ...meta,
  });
}

export function trackCompanionInteraction(mascotId, actionType, meta = {}) {
  sendEvent("companion_interaction", {
    companion_id: mascotId,
    companion_action: actionType,
    ...meta,
  });
}

export function trackEasterEggProgress(choreId, action, allCompleted = false) {
  sendEvent("easter_egg_progress", {
    chore_id: choreId,
    chore_action: action,
    squad_chores_completed: allCompleted,
  });
}

export function trackRpgAction(rpgEvent, details = {}) {
  sendEvent("rpg_progression", {
    rpg_event_type: rpgEvent,
    ...details,
  });
}

export function trackBotSignal(score, flags = []) {
  sendEvent("bot_detection_signal", {
    bot_confidence_score: score,
    detected_bot_flags: flags.join(","),
  });
}

export function trackException(description, source = "app", line = 0, col = 0, stack = "", isFatal = false) {
  sendEvent(
    "app_exception",
    {
      description: String(description).slice(0, 150),
      error_source: source,
      line_number: line,
      col_number: col,
      stack_trace: String(stack).slice(0, 300),
      fatal: isFatal,
    },
    true
  );
}

/**
 * Return current health and telemetry statistics for UI inspection
 */
export function getGaStatus() {
  return {
    measurementId: DEFAULT_MEASUREMENT_ID,
    dispatchedCount: dispatchedEventsCount,
    queuedCount: getOfflineQueue().length,
    isOnline: navigator.onLine,
    isGtagReady: typeof window.gtag === "function" || Boolean(window.dataLayer),
  };
}
