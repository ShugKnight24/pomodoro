"use strict";

import "../components/progress-ring.js";
import "../components/hour-glass.js";

import { formatTime, hideElements, showElements } from "./utils.js";
import { recordPomodoro } from "./stats.js";
import { sendNotification } from "./settings.js";

// Store original page title
const originalTitle = document.title;

// State
const state = {
  breakTime: 5,
  breakTimerId: null,
  currentSeconds: 0,
  isBreak: false,
  isRunning: false,
  sessionTime: 25,
  sessionTimerId: null,
  totalSeconds: 0,
};

// DOM Elements
const elements = {
  breakDiv: null,
  breakHeader: null,
  breakHourglass: null,
  breakMinusButton: null,
  breakPlusButton: null,
  breakProgress: null,
  breakTime: null,
  buzzer: null,
  resetButton: null,
  sessionDiv: null,
  sessionHeader: null,
  sessionHourglass: null,
  sessionMinusButton: null,
  sessionPlusButton: null,
  sessionProgress: null,
  sessionTime: null,
  startButton: null,
  stopButton: null,
};

export function initTimer() {
  initializeElements();
  setupTimerEventListeners();
  initializeProgressRings();

  // Initialize visual state
  const savedVisual = localStorage.getItem("timerVisual") || "ring";
  updateVisualMode(savedVisual);

  // Listen for settings change
  document.addEventListener("timer-visual-change", (event) => {
    updateVisualMode(event.detail.visualType);
  });

  // Listen for timer preset changes
  document.addEventListener("timer-preset-change", (event) => {
    if (!state.isRunning) {
      state.sessionTime = event.detail.workMinutes;
      state.breakTime = event.detail.breakMinutes;
      elements.sessionTime.textContent = state.sessionTime;
      elements.breakTime.textContent = state.breakTime;
    }
  });
}

const initializeElements = () => {
  elements.breakDiv = document.querySelector(".break-div");
  elements.breakHeader = document.getElementById("break-header");
  elements.breakHourglass = document.getElementById("break-hourglass");
  elements.breakMinusButton = document.getElementById("minus-5-break");
  elements.breakPlusButton = document.getElementById("add-5-break");
  elements.breakProgress = document.getElementById("break-progress");
  elements.breakTime = document.getElementById("break-time");
  elements.buzzer = document.getElementById("buzzer");
  elements.resetButton = document.getElementById("reset");
  elements.sessionDiv = document.querySelector(".session-div");
  elements.sessionHeader = document.getElementById("session-header");
  elements.sessionHourglass = document.getElementById("session-hourglass");
  elements.sessionMinusButton = document.getElementById("minus-5-clock");
  elements.sessionPlusButton = document.getElementById("add-5-clock");
  elements.sessionProgress = document.getElementById("session-progress");
  elements.sessionTime = document.getElementById("session-time");
  elements.startButton = document.getElementById("start");
  elements.stopButton = document.getElementById("stop");
};

function setupTimerEventListeners() {
  elements.breakMinusButton.addEventListener("click", () =>
    adjustTime("break", -5),
  );
  elements.breakPlusButton.addEventListener("click", () =>
    adjustTime("break", 5),
  );
  elements.resetButton.addEventListener("click", resetTimer);
  elements.sessionMinusButton.addEventListener("click", () =>
    adjustTime("session", -5),
  );
  elements.sessionPlusButton.addEventListener("click", () =>
    adjustTime("session", 5),
  );
  elements.startButton.addEventListener("click", startTimer);
  elements.stopButton.addEventListener("click", pauseTimer);
}

function initializeProgressRings() {
  if (elements.sessionProgress) {
    elements.sessionProgress.setProgress(100);
  }
  if (elements.breakProgress) {
    elements.breakProgress.setProgress(100);
  }
  // Set hourglasses to initial state
  resetHourglasses();
}

function updateVisualMode(mode) {
  const rings = [elements.sessionProgress, elements.breakProgress];
  const hourglasses = [elements.sessionHourglass, elements.breakHourglass];
  const wrappers = document.querySelectorAll(".timer-display-wrapper");

  if (mode === "hourglass") {
    rings.forEach((element) => element?.classList.add("hidden"));
    hourglasses.forEach((element) => element?.classList.remove("hidden"));
    wrappers.forEach((wrapper) => wrapper.classList.add("hourglass-layout")); // stacked layout for hourglass
  } else {
    rings.forEach((element) => element?.classList.remove("hidden"));
    hourglasses.forEach((element) => element?.classList.add("hidden"));
    wrappers.forEach((wrapper) => wrapper.classList.remove("hourglass-layout"));
  }
}

function setProgress(percent, element) {
  if (element && element.setProgress) {
    element.setProgress(percent);
  }

  updateHourglass(percent);
}

function updateHourglass(percent) {
  const hourglass = state.isBreak
    ? elements.breakHourglass
    : elements.sessionHourglass;
  if (hourglass && hourglass.updateSand) {
    hourglass.updateSand(percent);
  }
}

function toggleSandStream(show) {
  [elements.sessionHourglass, elements.breakHourglass].forEach((hourglass) => {
    if (hourglass && hourglass.showSandStream) {
      hourglass.showSandStream(show);
    }
  });
}

/* Start button click */
async function startTimer() {
  if (state.isRunning) return;

  state.isRunning = true;

  // Dispatch state change event
  dispatchTimerEvent("timer-state-change", {
    isRunning: true,
    isBreak: state.isBreak,
  });

  if (state.currentSeconds === 0 || state.totalSeconds === 0) {
    state.currentSeconds = state.sessionTime * 60;
    state.totalSeconds = state.currentSeconds;
  }

  if (state.isBreak) {
    hideElements([elements.sessionDiv]);
    showElements([elements.breakDiv]);
  } else {
    hideElements([elements.breakDiv]);
    showElements([elements.sessionDiv]);
  }

  hideElements([
    elements.breakMinusButton,
    elements.breakPlusButton,
    elements.sessionMinusButton,
    elements.sessionPlusButton,
    elements.startButton,
  ]);
  showElements([elements.stopButton, elements.resetButton]);

  if (state.currentSeconds === state.totalSeconds) {
    const activeHourglass = state.isBreak
      ? elements.breakHourglass
      : elements.sessionHourglass;

    // Flip the hourglass
    if (
      activeHourglass &&
      !activeHourglass.classList.contains("hidden") &&
      typeof activeHourglass.flip === "function"
    ) {
      await activeHourglass.flip();
    }
  }
  toggleSandStream(true);

  if (state.isBreak) {
    state.breakTimerId = setInterval(timerTick, 1000);
  } else {
    state.sessionTimerId = setInterval(timerTick, 1000);
  }

  timerTick();
  elements.startButton.textContent = "Start";
}

function pauseTimer() {
  state.isRunning = false;
  toggleSandStream(false);

  clearInterval(state.sessionTimerId);
  clearInterval(state.breakTimerId);
  state.sessionTimerId = null;
  state.breakTimerId = null;

  showElements([elements.startButton]);
  hideElements([elements.stopButton]);

  elements.startButton.textContent = "Resume";

  // Dispatch state change event
  dispatchTimerEvent("timer-state-change", {
    isRunning: false,
    isBreak: state.isBreak,
  });
}

/* Stop & Reset button click */
function resetTimer() {
  clearTimers();
  toggleSandStream(false);
  resetToDefaults();
  resetTabTitle();
  elements.startButton.textContent = "Start";

  // Dispatch state change event
  dispatchTimerEvent("timer-state-change", {
    isRunning: false,
    isBreak: false,
    isReset: true,
  });
}

/**
 * Timer tick function
 * Decrement time, format time, update display, and check if complete based on current state
 */
function timerTick() {
  state.currentSeconds--;
  if (state.currentSeconds < 0) state.currentSeconds = 0;

  const total = state.totalSeconds || 1;
  const remainingPercent = (state.currentSeconds / total) * 100;

  // Update tab title with remaining time
  updateTabTitle();

  // Dispatch timer tick event for focus mode and other listeners
  dispatchTimerEvent("timer-tick", {
    currentSeconds: state.currentSeconds,
    totalSeconds: state.totalSeconds,
    isBreak: state.isBreak,
    remainingPercent,
  });

  if (state.isBreak) {
    elements.breakTime.textContent = formatTime(state.currentSeconds);
    setProgress(remainingPercent, elements.breakProgress);
    if (state.currentSeconds <= 0) {
      breakComplete();
    }
  } else {
    elements.sessionTime.textContent = formatTime(state.currentSeconds);
    setProgress(remainingPercent, elements.sessionProgress);

    if (state.currentSeconds <= 0) {
      sessionComplete();
    }
  }
}

/**
 * Update browser tab title with current timer state
 */
function updateTabTitle() {
  if (state.currentSeconds >= 0) {
    const timeString = formatTime(state.currentSeconds);
    const mode = state.isBreak ? "☕ Break" : "🍅 Focus";
    document.title = `${timeString} - ${mode}`;
  } else {
    document.title = originalTitle;
  }
}

/**
 * Reset tab title to original
 */
function resetTabTitle() {
  document.title = originalTitle;
}

/* Handle session completion */
async function sessionComplete() {
  playBuzzer();

  // Record the completed pomodoro in stats
  recordPomodoro(state.sessionTime);

  // Send browser notification
  sendNotification("Pomodoro Complete! 🍅", "Great work! Time for a break.");

  // Dispatch pomodoro complete event for achievements
  dispatchTimerEvent("pomodoro-complete", {
    duration: state.sessionTime,
    type: "session",
  });

  clearInterval(state.sessionTimerId);
  state.sessionTimerId = null;
  state.isBreak = true;

  // Start break
  state.currentSeconds = state.breakTime * 60;
  state.totalSeconds = state.currentSeconds;

  elements.sessionDiv.classList.add("hidden");
  elements.breakDiv.classList.remove("hidden");

  const breakHourglass = elements.breakHourglass;
  if (
    breakHourglass &&
    !breakHourglass.classList.contains("hidden") &&
    typeof breakHourglass.flip === "function"
  ) {
    breakHourglass.progress = 0; // Ensure sand is at bottom before flipping
    await breakHourglass.flip();
  }

  state.breakTimerId = setInterval(timerTick, 1000);
  timerTick();
}

/* Handle break completion */
function breakComplete() {
  playBuzzer();

  // Send browser notification
  sendNotification("Break Over! ☕", "Ready for another pomodoro?");

  clearInterval(state.breakTimerId);
  toggleSandStream(false);
  state.breakTimerId = null;
  state.isRunning = false;
  state.isBreak = false;
  state.currentSeconds = 0;
  state.totalSeconds = 0;

  setProgress(0, elements.breakProgress);

  hideElements([elements.breakDiv, elements.stopButton, elements.resetButton]);

  elements.startButton.textContent = "Start";
  showElements([elements.startButton]);

  // Reset tab title
  resetTabTitle();

  // Notify other modules that break is complete
  dispatchTimerEvent("timer-state-change", {
    isRunning: false,
    isBreak: false,
    isReset: true,
  });

  // Reset to defaults
  resetToDefaults();
}

/**
 * Adjust session or break time
 * @param {string} type - 'session' or 'break'
 * @param {number} amount - Amount to adjust (positive or negative)
 */
function adjustTime(type, amount) {
  if (state.isRunning) return;

  const MIN_TIME = 5;

  if (type === "session") {
    const newTime = state.sessionTime + amount;
    if (newTime >= MIN_TIME) {
      state.sessionTime = newTime;
      elements.sessionTime.textContent = state.sessionTime;
    }
  } else if (type === "break") {
    const newTime = state.breakTime + amount;
    if (newTime >= MIN_TIME) {
      state.breakTime = newTime;
      elements.breakTime.textContent = state.breakTime;
    }
  }
}

/* Clear any active intervals */
function clearTimers() {
  if (state.sessionTimerId) {
    clearInterval(state.sessionTimerId);
    state.sessionTimerId = null;
  }
  if (state.breakTimerId) {
    clearInterval(state.breakTimerId);
    state.breakTimerId = null;
  }
  state.isRunning = false;
  state.isBreak = false;
}

/* Reset timer to default state */
function resetToDefaults() {
  // Load preset from storage, default to 25/5
  const savedSession =
    parseInt(localStorage.getItem("customSessionTime")) || 25;
  const savedBreak = parseInt(localStorage.getItem("customBreakTime")) || 5;

  state.sessionTime = savedSession;
  state.breakTime = savedBreak;
  state.currentSeconds = 0;
  state.totalSeconds = 0;

  // Update displays
  elements.sessionTime.textContent = state.sessionTime;
  elements.breakTime.textContent = state.breakTime;

  // Reset rings to full
  setProgress(100, elements.sessionProgress);
  setProgress(100, elements.breakProgress);

  resetHourglasses();

  // Show all controls, hide stop/reset
  showAllControls();
  hideElements([elements.resetButton, elements.stopButton]);
}

function resetHourglasses() {
  if (elements.sessionHourglass) elements.sessionHourglass.progress = 0;
  if (elements.breakHourglass) elements.breakHourglass.progress = 0;
}

/* Show all controls (reset state) */
function showAllControls() {
  const controlsToShow = [
    elements.breakDiv,
    elements.breakHeader,
    elements.breakTime,
    elements.breakMinusButton,
    elements.breakPlusButton,
    elements.sessionDiv,
    elements.sessionMinusButton,
    elements.sessionPlusButton,
    elements.sessionTime,
    elements.sessionHeader,
    elements.startButton,
  ];
  showElements(controlsToShow);
}

/* Play buzzer */
function playBuzzer() {
  elements.buzzer?.play().catch((error) => {
    console.warn("Could not play buzzer:", error);
  });
}

/**
 * Dispatch custom timer events for other modules to listen to
 * @param {string} eventName - Name of the event
 * @param {Object} detail - Event details
 */
function dispatchTimerEvent(eventName, detail) {
  document.dispatchEvent(new CustomEvent(eventName, { detail }));
}

/**
 * Get current timer state (for external modules)
 */
export function getTimerState() {
  return {
    isRunning: state.isRunning,
    isBreak: state.isBreak,
    currentSeconds: state.currentSeconds,
    totalSeconds: state.totalSeconds,
    sessionTime: state.sessionTime,
    breakTime: state.breakTime,
  };
}
