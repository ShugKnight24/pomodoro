"use strict";

import { formatTime, hideElements, showElements } from "./utils.js";

// TODO: Implement custom time setting

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
    adjustTime("break", -5)
  );
  elements.breakPlusButton.addEventListener("click", () =>
    adjustTime("break", 5)
  );
  elements.resetButton.addEventListener("click", resetTimer);
  elements.sessionMinusButton.addEventListener("click", () =>
    adjustTime("session", -5)
  );
  elements.sessionPlusButton.addEventListener("click", () =>
    adjustTime("session", 5)
  );
  elements.startButton.addEventListener("click", startTimer);
  elements.stopButton.addEventListener("click", pauseTimer);
}

function initializeProgressRings() {
  if (!elements.sessionProgress || !elements.breakProgress) return;

  const radius = elements.sessionProgress.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;

  [elements.sessionProgress, elements.breakProgress].forEach((ring) => {
    ring.style.strokeDasharray = `${circumference} ${circumference}`;
    ring.style.strokeDashoffset = 0; // Start filled
  });
}

function setProgress(percent, element) {
  const radius = element.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  element.style.strokeDashoffset = offset;

  // Update Hourglass
  updateHourglass(percent);
}

function updateHourglass(percent) {
  const isBreak = state.isBreak;
  const svg = isBreak ? elements.breakHourglass : elements.sessionHourglass;
  if (!svg) return;

  const topSand = svg.querySelector(".sand-top");
  const bottomSand = svg.querySelector(".sand-bottom");

  const sandHeight = 45; // Max height of sand in bulb
  const topHeight = (percent / 100) * sandHeight;
  const bottomHeight = sandHeight - topHeight;

  topSand.setAttribute("height", Math.max(0, topHeight));
  topSand.setAttribute("y", 50 - topHeight); // Bottom of top bulb

  bottomSand.setAttribute("height", Math.max(0, bottomHeight));
  bottomSand.setAttribute("y", 95 - bottomHeight); // Bottom of bottom bulb
}

// TODO: utilize this better
function toggleSandStream(show) {
  const streams = document.querySelectorAll(".sand-stream");
  streams.forEach((stream) => {
    if (show) stream.classList.remove("hidden");
    else stream.classList.add("hidden");
  });
}

/* Start button click */
function startTimer() {
  if (state.isRunning) return;

  state.isRunning = true;
  toggleSandStream(true);

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
}

/* Stop & Reset button click */
function resetTimer() {
  clearTimers();
  toggleSandStream(false);
  resetToDefaults();
  elements.startButton.textContent = "Start";
}

/**
 * Timer tick function
 * Decrement time, format time, update display, and check if complete based on current state
 */
function timerTick() {
  state.currentSeconds--;

  const total = state.totalSeconds || 1;
  const remainingPercent = (state.currentSeconds / total) * 100;

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

/* Handle session completion */
function sessionComplete() {
  playBuzzer();
  toggleSandStream(true);
  clearInterval(state.sessionTimerId);
  state.sessionTimerId = null;
  state.isBreak = true;

  // Start break
  state.currentSeconds = state.breakTime * 60;
  state.totalSeconds = state.currentSeconds;

  elements.sessionDiv.classList.add("hidden");
  elements.breakDiv.classList.remove("hidden");

  state.breakTimerId = setInterval(timerTick, 1000);
  timerTick();
}

/* Handle break completion */
function breakComplete() {
  playBuzzer();
  clearInterval(state.breakTimerId);
  toggleSandStream(false);
  state.breakTimerId = null;
  state.isRunning = false;
  state.isBreak = false;
  state.currentSeconds = 0;
  state.totalSeconds = 0;

  setProgress(0, elements.breakProgress);

  // Show reset button
  elements.resetButton.classList.remove("hidden");
  hideElements([elements.breakDiv, elements.stopButton, elements.resetButton]);

  elements.startButton.textContent = "Start";
  showElements([elements.startButton]);

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
  // Reset to default values
  // TODO: Set to initial values that user sets?
  state.sessionTime = 25;
  state.breakTime = 5;
  state.currentSeconds = 0;
  state.totalSeconds = 0;

  // Update displays
  elements.sessionTime.textContent = state.sessionTime;
  elements.breakTime.textContent = state.breakTime;

  // Reset rings to full
  setProgress(100, elements.sessionProgress);
  setProgress(100, elements.breakProgress);

  // Show all controls, hide stop/reset
  showAllControls();
  hideElements([elements.resetButton, elements.stopButton]);
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
