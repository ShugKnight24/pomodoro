/**
 * botDetector.js — Multi-Vector Bot & Automated Script Classifier
 * Differentiates organic human interactions from bots, crawlers, and automated testing drivers.
 * Uses environment inspection, pointer trajectory entropy, inter-keystroke variance, and event trust flags.
 * Zero external libraries — pure client-side heuristics.
 */

"use strict";

const BOT_STORAGE_KEY = "pomidor.telemetry.botAnalysis";

let botScore = 0;
let trafficType = "human"; // 'human' | 'suspicious' | 'bot'
const detectedFlags = new Set();

// Pointer tracking ring buffer for entropy analysis
const pointerHistory = [];
const MAX_POINTER_HISTORY = 20;

// Keystroke timing tracking
const keyIntervals = [];
let lastKeyTime = 0;
const pageLoadTime = Date.now();

/**
 * Initialize bot detector listeners and run initial environment inspection
 */
export function initBotDetector() {
  inspectEnvironment();
  bindInteractionListeners();
  recalculateScore();
}

/**
 * Static inspection of browser environment and automation signatures
 */
function inspectEnvironment() {
  try {
    // 1. WebDriver flag (Playwright, Puppeteer, Selenium)
    if (navigator.webdriver) {
      detectedFlags.add("webdriver_flagged");
    }

    // 2. Automation window globals
    const automationGlobals = [
      "__playwright",
      "__puppeteer",
      "_phantom",
      "callPhantom",
      "__nightmare",
      "domAutomation",
      "domAutomationController",
    ];
    for (const key of automationGlobals) {
      if (key in window) {
        detectedFlags.add(`global_${key}`);
      }
    }

    // 3. User Agent pattern inspection
    const ua = (navigator.userAgent || "").toLowerCase();
    const botPattern = /bot|crawler|spider|headlesschrome|phantomjs|selenium|puppeteer|playwright/i;
    if (botPattern.test(ua)) {
      detectedFlags.add("bot_user_agent");
    }

    // 4. Headless Chrome anomalies
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    if (!isMobile && navigator.plugins && navigator.plugins.length === 0) {
      detectedFlags.add("zero_plugins_anomaly");
    }
    if (!navigator.languages || navigator.languages.length === 0) {
      detectedFlags.add("missing_languages_anomaly");
    }

    // 5. Zero dimension viewport anomaly
    if (window.outerWidth === 0 && window.outerHeight === 0) {
      detectedFlags.add("zero_dimensions_anomaly");
    }
  } catch (e) {
    // Defensive catch
  }
}

/**
 * Bind passive pointer and keyboard listeners to evaluate interaction dynamics
 */
function bindInteractionListeners() {
  // Track pointer movements
  window.addEventListener(
    "pointermove",
    (e) => {
      recordPointerMovement(e);
    },
    { passive: true }
  );

  // Track keystrokes
  window.addEventListener(
    "keydown",
    (e) => {
      recordKeystroke(e);
    },
    { passive: true }
  );
}

/**
 * Record pointer movement sample for entropy and curvature analysis
 */
function recordPointerMovement(e) {
  const now = performance.now();
  if (pointerHistory.length >= MAX_POINTER_HISTORY) {
    pointerHistory.shift();
  }
  pointerHistory.push({
    x: e.clientX,
    y: e.clientY,
    time: now,
    isTrusted: e.isTrusted !== false,
  });

  if (pointerHistory.length >= 6) {
    analyzePointerEntropy();
  }
}

/**
 * Analyze curvature and velocity variance in cursor trajectory
 */
function analyzePointerEntropy() {
  let totalCurvature = 0;
  let totalDistance = 0;

  for (let i = 2; i < pointerHistory.length; i++) {
    const p0 = pointerHistory[i - 2];
    const p1 = pointerHistory[i - 1];
    const p2 = pointerHistory[i];

    const dx1 = p1.x - p0.x;
    const dy1 = p1.y - p0.y;
    const dx2 = p2.x - p1.x;
    const dy2 = p2.y - p1.y;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    let dAngle = Math.abs(angle2 - angle1);
    if (dAngle > Math.PI) dAngle = 2 * Math.PI - dAngle;

    totalCurvature += dAngle;
    totalDistance += Math.hypot(dx2, dy2);
  }

  // Humans have non-zero curvature and micro-jitter over distance
  if (totalDistance > 80) {
    if (totalCurvature < 0.05) {
      // Mathematically straight line with zero jitter
      detectedFlags.add("linear_cursor_entropy");
    } else if (totalCurvature > 0.4) {
      // Natural human curved trajectory
      detectedFlags.delete("linear_cursor_entropy");
    }
  }
}

/**
 * Record keystroke interval to assess inter-key delay variance
 */
function recordKeystroke(e) {
  if (e.isTrusted === false) {
    detectedFlags.add("synthetic_keystroke");
  }

  const now = performance.now();
  if (lastKeyTime > 0) {
    const delta = now - lastKeyTime;
    keyIntervals.push(delta);
    if (keyIntervals.length > 8) keyIntervals.shift();

    // Check variance if we have at least 5 keystrokes
    if (keyIntervals.length >= 5) {
      const avg = keyIntervals.reduce((a, b) => a + b, 0) / keyIntervals.length;
      const variance = keyIntervals.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / keyIntervals.length;

      // Uniform timing: script sleeping constant delay
      if (variance < 4.0 && avg < 80) {
        detectedFlags.add("uniform_keystroke_cadence");
      } else if (variance > 40) {
        detectedFlags.delete("uniform_keystroke_cadence");
      }
    }
  }
  lastKeyTime = now;
}

/**
 * Analyze an incoming click/tap event for bot heuristics
 * @param {MouseEvent|PointerEvent} e
 */
export function analyzeInteractionEvent(e) {
  // 1. Synthetic event flag
  if (e && e.isTrusted === false) {
    detectedFlags.add("synthetic_interaction_event");
  }

  // 2. Instant click after page load (<80ms is physically impossible for human perception & click)
  const timeSinceLoad = Date.now() - pageLoadTime;
  if (timeSinceLoad < 80) {
    detectedFlags.add("instant_click_anomaly");
  }

  // 3. Click with zero prior pointer movements
  if (e && e.pointerType !== "touch" && pointerHistory.length === 0) {
    detectedFlags.add("click_without_pointer_trajectory");
  }

  recalculateScore();

  return {
    botScore,
    trafficType,
    flags: Array.from(detectedFlags),
  };
}

/**
 * Re-calculate continuous bot confidence score and classification
 */
export function recalculateScore() {
  let score = 0;

  // Heavy flags
  if (detectedFlags.has("webdriver_flagged")) score += 75;
  if (detectedFlags.has("synthetic_interaction_event")) score += 85;
  if (detectedFlags.has("synthetic_keystroke")) score += 60;
  if (detectedFlags.has("bot_user_agent")) score += 70;

  // Moderate flags
  if (detectedFlags.has("zero_plugins_anomaly")) score += 25;
  if (detectedFlags.has("missing_languages_anomaly")) score += 20;
  if (detectedFlags.has("zero_dimensions_anomaly")) score += 30;
  if (detectedFlags.has("linear_cursor_entropy")) score += 25;
  if (detectedFlags.has("uniform_keystroke_cadence")) score += 25;
  if (detectedFlags.has("instant_click_anomaly")) score += 20;
  if (detectedFlags.has("click_without_pointer_trajectory")) score += 15;

  // Any detected global automation properties
  for (const flag of detectedFlags) {
    if (flag.startsWith("global_")) score += 60;
  }

  // Natural human movement reward
  if (pointerHistory.length >= 8 && !detectedFlags.has("linear_cursor_entropy")) {
    score = Math.max(0, score - 15);
  }

  // Clamp 0 - 100
  botScore = Math.min(100, Math.max(0, score));

  // Classification
  if (botScore >= 61) {
    trafficType = "bot";
  } else if (botScore >= 26) {
    trafficType = "suspicious";
  } else {
    trafficType = "human";
  }

  saveAnalysis();

  window.dispatchEvent(
    new CustomEvent("bot-analysis-updated", {
      detail: { botScore, trafficType, flags: Array.from(detectedFlags) },
    })
  );
}

/**
 * Persist bot analysis state in session
 */
function saveAnalysis() {
  try {
    sessionStorage.setItem(
      BOT_STORAGE_KEY,
      JSON.stringify({
        botScore,
        trafficType,
        flags: Array.from(detectedFlags),
        timestamp: Date.now(),
      })
    );
  } catch {}
}

export function getBotScore() {
  return botScore;
}

export function getTrafficType() {
  return trafficType;
}

export function getDetectedFlags() {
  return Array.from(detectedFlags);
}

/**
 * Manually override traffic classification for testing or simulation
 */
export function setSimulatedTrafficType(type = "human", score = 0) {
  trafficType = type;
  botScore = score;
  saveAnalysis();
  window.dispatchEvent(
    new CustomEvent("bot-analysis-updated", {
      detail: { botScore, trafficType, flags: Array.from(detectedFlags) },
    })
  );
}
