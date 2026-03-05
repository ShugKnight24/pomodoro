/**
 * Focus Mode Module
 * Provides a distraction-free fullscreen timer experience
 */

"use strict";

import { formatTime } from "./utils.js";
import { getStatsForDate, getAllStats } from "./stats.js";

// DOM Elements
let focusModeOverlay;
let focusModeEnter;
let focusModeExit;
let focusTimer;
let focusStatus;
let focusTask;
let focusPlay;
let focusPause;
let focusReset;
let focusProgressRing;
let focusRingProgress;
let focusModeToggle;
let focusToggleBtns;
let focusPlus;
let focusMinus;
let focusPomodoroCount;
let focusGoalText;

// State
let isActive = false;
let isRunning = false;
let isBreak = false;
let totalSeconds = 25 * 60;
let currentSeconds = 25 * 60;
let sessionMinutes = 25;
let breakMinutes = 5;

export function initFocusMode() {
  // Get DOM elements
  focusModeOverlay = document.getElementById("focus-mode");
  focusModeEnter = document.getElementById("focus-mode-enter");
  focusModeExit = document.getElementById("focus-mode-exit");
  focusTimer = document.getElementById("focus-timer");
  focusStatus = document.getElementById("focus-status");
  focusTask = document.getElementById("focus-task");
  focusPlay = document.getElementById("focus-play");
  focusPause = document.getElementById("focus-pause");
  focusReset = document.getElementById("focus-reset");
  focusProgressRing = document.getElementById("focus-progress-ring");
  focusRingProgress = document.getElementById("focus-ring-progress");
  focusModeToggle = document.getElementById("focus-mode-toggle");
  focusToggleBtns = focusModeToggle?.querySelectorAll(".focus-toggle-btn");
  focusPlus = document.getElementById("focus-plus");
  focusMinus = document.getElementById("focus-minus");
  focusPomodoroCount = document.getElementById("focus-pomodoro-count");
  focusGoalText = document.getElementById("focus-goal-text");

  if (!focusModeOverlay) return;

  // Event listeners - enter button now toggles
  focusModeEnter?.addEventListener("click", toggleFocusMode);
  focusModeExit?.addEventListener("click", exitFocusMode);
  focusPlay?.addEventListener("click", handlePlay);
  focusPause?.addEventListener("click", handlePause);
  focusReset?.addEventListener("click", handleReset);

  // Time adjust listeners
  focusPlus?.addEventListener("click", () => adjustTime(5));
  focusMinus?.addEventListener("click", () => adjustTime(-5));

  // Mode toggle listeners
  focusToggleBtns?.forEach((btn) => {
    btn.addEventListener("click", () => handleModeToggle(btn.dataset.mode));
  });

  // Listen for timer updates
  document.addEventListener("timer-tick", handleTimerTick);
  document.addEventListener("timer-state-change", handleTimerStateChange);
  document.addEventListener("timer-complete", handleTimerComplete);
  document.addEventListener("timer-preset-change", handlePresetChange);

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isActive) {
      exitFocusMode();
    }
  });

  // Load saved times
  sessionMinutes = parseInt(localStorage.getItem("customSessionTime")) || 25;
  breakMinutes = parseInt(localStorage.getItem("customBreakTime")) || 5;
}

/**
 * Enter focus mode
 */
export function enterFocusMode() {
  isActive = true;
  focusModeOverlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Sync with main timer state
  syncWithMainTimer();

  // Get current task if any
  updateFocusTask();

  // Update session info
  updateSessionInfo();
}

/**
 * Exit focus mode
 */
export function exitFocusMode() {
  isActive = false;
  focusModeOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

/**
 * Toggle focus mode
 */
export function toggleFocusMode() {
  if (isActive) {
    exitFocusMode();
  } else {
    enterFocusMode();
  }
}

/**
 * Check if focus mode is active
 */
export function isFocusModeActive() {
  return isActive;
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

  // Update display
  focusTimer.textContent = formatTime(currentSeconds);
  updateProgressRing(currentSeconds, totalSeconds);
  updateStatus(isBreak);
  updateModeToggle();
}

/**
 * Update mode toggle buttons active state
 */
function updateModeToggle() {
  focusToggleBtns?.forEach((btn) => {
    const active =
      (btn.dataset.mode === "break" && isBreak) ||
      (btn.dataset.mode === "session" && !isBreak);
    btn.classList.toggle("active", active);
  });
}

/**
 * Adjust time by minutes
 */
function adjustTime(minutes) {
  if (isRunning) return;

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

  // Sync display after a brief delay
  setTimeout(() => syncWithMainTimer(), 50);
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

  if (isActive) {
    focusTimer.textContent = formatTime(currentSeconds);
    updateProgressRing(currentSeconds, totalSeconds);
  }
}

/**
 * Sync focus mode with main timer
 */
function syncWithMainTimer() {
  // Get timer state from main timer display
  const sessionTimeEl = document.getElementById("session-time");
  const breakTimeEl = document.getElementById("break-time");
  const sessionDiv = document.querySelector(".session-div");
  const breakDiv = document.querySelector(".break-div");

  // Check which div is visible
  const sessionVisible = sessionDiv && !sessionDiv.classList.contains("hidden");
  const breakVisible = breakDiv && !breakDiv.classList.contains("hidden");

  if (breakVisible && !sessionVisible) {
    isBreak = true;
  } else {
    isBreak = false;
  }

  const timeElement = isBreak ? breakTimeEl : sessionTimeEl;

  if (timeElement) {
    const timeText = timeElement.textContent.trim();

    if (timeText.includes(":")) {
      const [mins, secs] = timeText.split(":").map(Number);
      currentSeconds = mins * 60 + (secs || 0);
      focusTimer.textContent = timeText;
    } else {
      const mins = parseInt(timeText) || (isBreak ? 5 : 25);
      currentSeconds = mins * 60;
      totalSeconds = currentSeconds;
      focusTimer.textContent = `${timeText}:00`;

      // Update stored minutes
      if (isBreak) {
        breakMinutes = mins;
      } else {
        sessionMinutes = mins;
      }
    }

    updateProgressRing(currentSeconds, totalSeconds);
  }

  updateStatus(isBreak);
  updateModeToggle();

  // Check if timer is running
  const stopButton = document.getElementById("stop");
  isRunning = stopButton && !stopButton.classList.contains("hidden");

  focusModeOverlay.classList.toggle("running", isRunning);

  if (isRunning) {
    focusPlay.classList.add("hidden");
    focusPause.classList.remove("hidden");
    focusTimer.classList.add("running");
  } else {
    focusPlay.classList.remove("hidden");
    focusPause.classList.add("hidden");
    focusTimer.classList.remove("running");
  }
}

/**
 * Update status text and classes
 */
function updateStatus(breakMode) {
  if (breakMode) {
    focusStatus.textContent = "Break Time";
    focusStatus.classList.add("break");
    focusTimer.classList.add("break");
    focusProgressRing?.classList.add("break");
  } else {
    focusStatus.textContent = "Focus Time";
    focusStatus.classList.remove("break");
    focusTimer.classList.remove("break");
    focusProgressRing?.classList.remove("break");
  }
}

/**
 * Handle timer tick event
 */
function handleTimerTick(event) {
  if (!isActive) return;

  const {
    currentSeconds: seconds,
    isBreak: breakMode,
    totalSeconds: total,
  } = event.detail;

  currentSeconds = seconds;
  if (total) {
    totalSeconds = total;
  }

  focusTimer.textContent = formatTime(seconds);
  updateProgressRing(seconds, totalSeconds);
  updateStatus(breakMode);
  updateModeToggle();
}

/**
 * Update the circular progress ring
 */
function updateProgressRing(current, total) {
  if (!focusRingProgress) return;

  const circumference = 2 * Math.PI * 190; // radius = 190
  const progress = current / total;
  const offset = circumference * (1 - progress);

  focusRingProgress.style.strokeDashoffset = offset;
}

/**
 * Handle timer state change
 */
function handleTimerStateChange(event) {
  const { isRunning: running, isReset } = event.detail;
  isRunning = running;

  focusModeOverlay.classList.toggle("running", running);

  if (running) {
    focusPlay.classList.add("hidden");
    focusPause.classList.remove("hidden");
    focusTimer.classList.add("running");
  } else {
    focusPlay.classList.remove("hidden");
    focusPause.classList.add("hidden");
    focusTimer.classList.remove("running");
  }

  // If reset, sync with classic timer
  if (isReset && isActive) {
    setTimeout(() => {
      isBreak = false;
      syncWithMainTimer();
    }, 50);
  }
}

/**
 * Handle timer complete
 */
function handleTimerComplete(event) {
  if (!isActive) return;

  const { type } = event.detail;

  if (type === "session") {
    updateStatus(true);
    isBreak = true;
  } else {
    updateStatus(false);
    isBreak = false;
  }
  updateModeToggle();

  // Refresh session info after completion
  setTimeout(updateSessionInfo, 200);
}

/**
 * Handle play button click
 */
function handlePlay() {
  const startButton = document.getElementById("start");
  startButton?.click();

  focusPlay.classList.add("hidden");
  focusPause.classList.remove("hidden");
  focusTimer.classList.add("running");
}

/**
 * Handle pause button click
 */
function handlePause() {
  const stopButton = document.getElementById("stop");
  stopButton?.click();

  focusPlay.classList.remove("hidden");
  focusPause.classList.add("hidden");
  focusTimer.classList.remove("running");
}

/**
 * Handle reset button click
 */
function handleReset() {
  const resetButton = document.getElementById("reset");
  resetButton?.click();

  // Reset state
  isBreak = false;
  isRunning = false;

  // Reset to session time
  totalSeconds = sessionMinutes * 60;
  currentSeconds = totalSeconds;

  // Update display
  focusTimer.textContent = `${sessionMinutes}:00`;
  focusStatus.textContent = "Focus Time";
  focusStatus.classList.remove("break");
  focusTimer.classList.remove("break", "running");
  focusProgressRing?.classList.remove("break");
  focusModeOverlay.classList.remove("running");

  // Reset progress ring
  updateProgressRing(totalSeconds, totalSeconds);
  updateModeToggle();

  focusPlay.classList.remove("hidden");
  focusPause.classList.add("hidden");
}

/**
 * Update focus task display
 */
function updateFocusTask() {
  // Try to get the active/selected task
  const activeTask = document.querySelector(".task-item.active .task-name");
  const selectedList = document.querySelector(
    ".list-name.active-list .list-name-text",
  );

  if (activeTask) {
    focusTask.textContent = `Working on: ${activeTask.textContent}`;
  } else if (selectedList) {
    focusTask.textContent = `List: ${selectedList.textContent}`;
  } else {
    focusTask.textContent = "";
  }
}

/**
 * Update session info (today's pomodoros and daily goal)
 */
function updateSessionInfo() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dayStats = getStatsForDate(today);
    const allStats = getAllStats();

    if (focusPomodoroCount) {
      focusPomodoroCount.textContent = dayStats.pomodoros;
    }
    if (focusGoalText) {
      focusGoalText.textContent = `${dayStats.pomodoros} / ${allStats.dailyGoal || 8}`;
    }
  } catch (e) {
    // Stats module may not be ready yet
  }
}
