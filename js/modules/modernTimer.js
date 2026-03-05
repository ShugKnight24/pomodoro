/**
 * Modern Timer Module
 * Handles the focus-style timer UI in the main view
 */

"use strict";

import { formatTime } from "./utils.js";

// DOM Elements
let modernTimer;
let modernDisplay;
let modernStatus;
let modernProgressRing;
let modernRingProgress;
let modernPlay;
let modernPause;
let modernReset;
let modernSkip;
let modernPlus;
let modernMinus;
let modeToggle;
let modeBtns;

// State
let isRunning = false;
let isBreak = false;
let totalSeconds = 25 * 60;
let currentSeconds = 25 * 60;
let sessionMinutes = 25;
let breakMinutes = 5;

export function initModernTimer() {
  // Get DOM elements
  modernTimer = document.getElementById("timer-modern");
  modernDisplay = document.getElementById("modern-timer-display");
  modernStatus = document.getElementById("modern-timer-status");
  modernProgressRing = document.getElementById("modern-progress-ring");
  modernRingProgress = document.getElementById("modern-ring-progress");
  modernPlay = document.getElementById("modern-play");
  modernPause = document.getElementById("modern-pause");
  modernReset = document.getElementById("modern-reset");
  modernSkip = document.getElementById("modern-skip");
  modernPlus = document.getElementById("modern-plus");
  modernMinus = document.getElementById("modern-minus");
  modeToggle = document.getElementById("modern-mode-toggle");
  modeBtns = modeToggle?.querySelectorAll(".mode-btn");

  if (!modernTimer) return;

  // Set up event listeners
  modernPlay?.addEventListener("click", handlePlay);
  modernPause?.addEventListener("click", handlePause);
  modernReset?.addEventListener("click", handleReset);
  modernSkip?.addEventListener("click", handleSkip);
  modernPlus?.addEventListener("click", () => adjustTime(5));
  modernMinus?.addEventListener("click", () => adjustTime(-5));

  // Mode toggle listeners
  modeBtns?.forEach((btn) => {
    btn.addEventListener("click", () => handleModeToggle(btn.dataset.mode));
  });

  // Listen for timer events from main timer
  document.addEventListener("timer-tick", handleTimerTick);
  document.addEventListener("timer-state-change", handleTimerStateChange);
  document.addEventListener("timer-complete", handleTimerComplete);
  document.addEventListener("timer-preset-change", handlePresetChange);
  document.addEventListener("timer-style-change", handleStyleChange);

  // Listen for classic timer time adjustments (observe the DOM)
  observeClassicTimerChanges();

  // Initialize display
  initializeDisplay();
}

/**
 * Observe changes to the classic timer display for real-time sync
 */
function observeClassicTimerChanges() {
  const sessionTimeEl = document.getElementById("session-time");
  const breakTimeEl = document.getElementById("break-time");

  // Use MutationObserver to watch for text changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" || mutation.type === "characterData") {
        syncWithClassicTimer();
      }
    });
  });

  const config = { childList: true, characterData: true, subtree: true };

  if (sessionTimeEl) {
    observer.observe(sessionTimeEl, config);
  }
  if (breakTimeEl) {
    observer.observe(breakTimeEl, config);
  }
}

/**
 * Initialize the display with saved settings
 */
function initializeDisplay() {
  sessionMinutes = parseInt(localStorage.getItem("customSessionTime")) || 25;
  breakMinutes = parseInt(localStorage.getItem("customBreakTime")) || 5;

  totalSeconds = sessionMinutes * 60;
  currentSeconds = totalSeconds;

  updateDisplay(currentSeconds);
  updateProgressRing(currentSeconds, totalSeconds);
  updateModeToggle();
}

/**
 * Update the timer display
 */
function updateDisplay(seconds) {
  if (!modernDisplay) return;
  modernDisplay.textContent = formatTime(seconds);
}

/**
 * Update the circular progress ring
 */
function updateProgressRing(current, total) {
  if (!modernRingProgress) return;

  const circumference = 2 * Math.PI * 180; // radius = 180
  const progress = current / total;
  const offset = circumference * (1 - progress);

  modernRingProgress.style.strokeDashoffset = offset;
}

/**
 * Handle play button click
 */
function handlePlay() {
  const startButton = document.getElementById("start");
  startButton?.click();
}

/**
 * Handle pause button click
 */
function handlePause() {
  const stopButton = document.getElementById("stop");
  stopButton?.click();
}

/**
 * Handle reset button click
 */
function handleReset() {
  const resetButton = document.getElementById("reset");
  resetButton?.click();
}

/**
 * Handle skip button click (skip to break or back to session)
 */
function handleSkip() {
  // Trigger a reset which will handle the state
  handleReset();

  // Toggle mode
  handleModeToggle(isBreak ? "session" : "break");
}

/**
 * Handle mode toggle (session/break)
 */
function handleModeToggle(mode) {
  if (isRunning) return; // Don't allow switching while running

  const newIsBreak = mode === "break";
  if (newIsBreak === isBreak) return; // No change

  isBreak = newIsBreak;

  // Update the classic timer visibility
  const sessionDiv = document.querySelector(".session-div");
  const breakDiv = document.querySelector(".break-div");

  if (isBreak) {
    sessionDiv?.classList.add("hidden");
    breakDiv?.classList.remove("hidden");
    totalSeconds = breakMinutes * 60;
  } else {
    breakDiv?.classList.add("hidden");
    sessionDiv?.classList.remove("hidden");
    totalSeconds = sessionMinutes * 60;
  }

  currentSeconds = totalSeconds;

  updateDisplay(currentSeconds);
  updateProgressRing(currentSeconds, totalSeconds);
  updateStatus(isBreak);
  updateModeToggle();
}

/**
 * Update mode toggle buttons active state
 */
function updateModeToggle() {
  modeBtns?.forEach((btn) => {
    const isActive =
      (btn.dataset.mode === "break" && isBreak) ||
      (btn.dataset.mode === "session" && !isBreak);
    btn.classList.toggle("active", isActive);
  });
}

/**
 * Adjust time by minutes
 */
function adjustTime(minutes) {
  if (isRunning) return; // Don't adjust while running

  // Use the classic timer buttons
  if (minutes > 0) {
    const addButton = isBreak
      ? document.getElementById("add-5-break")
      : document.getElementById("add-5-clock");
    addButton?.click();
  } else {
    const minusButton = isBreak
      ? document.getElementById("minus-5-break")
      : document.getElementById("minus-5-clock");
    minusButton?.click();
  }

  // The MutationObserver will handle the display update
}

/**
 * Update status text and colors
 */
function updateStatus(breakMode) {
  isBreak = breakMode;

  if (modernStatus) {
    modernStatus.textContent = breakMode ? "Break Time" : "Session Time";
    modernStatus.classList.toggle("break", breakMode);
  }

  if (modernProgressRing) {
    modernProgressRing.classList.toggle("break", breakMode);
  }

  if (modernDisplay) {
    modernDisplay.classList.toggle("break", breakMode);
  }
}

/**
 * Handle timer tick event from main timer
 */
function handleTimerTick(event) {
  const {
    currentSeconds: seconds,
    isBreak: breakMode,
    totalSeconds: total,
  } = event.detail;

  currentSeconds = seconds;
  if (total) {
    totalSeconds = total;
  }

  updateDisplay(seconds);
  updateProgressRing(seconds, totalSeconds);
  updateStatus(breakMode);
  updateModeToggle();
}

/**
 * Handle timer state change
 */
function handleTimerStateChange(event) {
  const { isRunning: running, isReset } = event.detail;
  isRunning = running;

  // Update running class on timer for mode toggle visibility
  modernTimer?.classList.toggle("running", running);

  if (modernPlay && modernPause) {
    if (running) {
      modernPlay.classList.add("hidden");
      modernPause.classList.remove("hidden");
      modernDisplay?.classList.add("running");
    } else {
      modernPlay.classList.remove("hidden");
      modernPause.classList.add("hidden");
      modernDisplay?.classList.remove("running");
    }
  }

  // If reset, sync with classic timer
  if (isReset) {
    setTimeout(() => {
      isBreak = false;
      syncWithClassicTimer();
      updateModeToggle();
    }, 50);
  }
}

/**
 * Handle timer complete
 */
function handleTimerComplete(event) {
  const { type } = event.detail;

  if (type === "session") {
    updateStatus(true);
  } else {
    updateStatus(false);
  }
  updateModeToggle();
}

/**
 * Handle preset change
 */
function handlePresetChange(event) {
  const { workMinutes, breakMinutes: breakMins } = event.detail;

  sessionMinutes = workMinutes;
  breakMinutes = breakMins;

  if (!isBreak) {
    totalSeconds = sessionMinutes * 60;
    currentSeconds = totalSeconds;
  } else {
    totalSeconds = breakMinutes * 60;
    currentSeconds = totalSeconds;
  }

  updateDisplay(currentSeconds);
  updateProgressRing(currentSeconds, totalSeconds);
}

/**
 * Handle timer style change
 */
function handleStyleChange(event) {
  const { style } = event.detail;

  if (style === "modern") {
    // Sync state when switching to modern
    syncWithClassicTimer();
  } else if (style === "classic") {
    // Reset modern timer state so both session/break divs are restored
    isBreak = false;
    isRunning = false;
    const sessionDiv = document.querySelector(".session-div");
    const breakDiv = document.querySelector(".break-div");
    if (sessionDiv) sessionDiv.classList.remove("hidden");
    if (breakDiv) breakDiv.classList.remove("hidden");
  }
}

/**
 * Sync modern timer with classic timer state
 */
function syncWithClassicTimer() {
  // Get current time from classic display
  const sessionTimeEl = document.getElementById("session-time");
  const breakTimeEl = document.getElementById("break-time");
  const sessionDiv = document.querySelector(".session-div");
  const breakDiv = document.querySelector(".break-div");

  // Check which div is visible (not hidden)
  const sessionVisible = sessionDiv && !sessionDiv.classList.contains("hidden");
  const breakVisible = breakDiv && !breakDiv.classList.contains("hidden");

  // Determine current mode based on visibility
  if (breakVisible && !sessionVisible) {
    isBreak = true;
  } else {
    isBreak = false;
  }

  const timeElement = isBreak ? breakTimeEl : sessionTimeEl;
  if (timeElement) {
    const timeText = timeElement.textContent.trim();

    // Parse MM:SS or just minutes
    if (timeText.includes(":")) {
      const [mins, secs] = timeText.split(":").map(Number);
      currentSeconds = mins * 60 + (secs || 0);
    } else {
      const mins = parseInt(timeText) || (isBreak ? 5 : 25);
      currentSeconds = mins * 60;
      totalSeconds = currentSeconds;

      // Update stored minutes
      if (isBreak) {
        breakMinutes = mins;
      } else {
        sessionMinutes = mins;
      }
    }

    updateDisplay(currentSeconds);
    updateProgressRing(currentSeconds, totalSeconds);
  }

  updateStatus(isBreak);
  updateModeToggle();

  // Check if running
  const stopButton = document.getElementById("stop");
  const running = stopButton && !stopButton.classList.contains("hidden");
  isRunning = running;

  modernTimer?.classList.toggle("running", running);

  if (running) {
    modernPlay?.classList.add("hidden");
    modernPause?.classList.remove("hidden");
    modernDisplay?.classList.add("running");
  } else {
    modernPlay?.classList.remove("hidden");
    modernPause?.classList.add("hidden");
    modernDisplay?.classList.remove("running");
  }
}
