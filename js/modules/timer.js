"use strict";

import { formatTime, hideElements, showElements } from "./utils.js";

// TODO: Implement custom time setting
// TODO: Convert to stop into pause -> Display Pause & Reset while timers are running

// State
const state = {
  breakTime: 5,
  breakTimerId: null,
  currentSeconds: 0,
  isBreak: false,
  isRunning: false,
  sessionTime: 25,
  sessionTimerId: null,
};

// DOM Elements
const elements = {
  breakDiv: null,
  breakHeader: null,
  breakMinusButton: null,
  breakPlusButton: null,
  breakTime: null,
  buzzer: null,
  resetButton: null,
  sessionDiv: null,
  sessionHeader: null,
  sessionMinusButton: null,
  sessionPlusButton: null,
  sessionTime: null,
  startButton: null,
  stopButton: null,
};

export function initTimer() {
  initializeElements();
  setupTimerEventListeners();
}

const initializeElements = () => {
  elements.breakDiv = document.querySelector(".break-div");
  elements.breakHeader = document.getElementById("break-header");
  elements.breakMinusButton = document.getElementById("minus-5-break");
  elements.breakPlusButton = document.getElementById("add-5-break");
  elements.breakTime = document.getElementById("break-time");
  elements.buzzer = document.getElementById("buzzer");
  elements.resetButton = document.getElementById("reset");
  elements.sessionDiv = document.querySelector(".session-div");
  elements.sessionHeader = document.getElementById("session-header");
  elements.sessionMinusButton = document.getElementById("minus-5-clock");
  elements.sessionPlusButton = document.getElementById("add-5-clock");
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
  elements.stopButton.addEventListener("click", resetTimer);
}

/* Start button click */
function startTimer() {
  if (state.isRunning) return;

  state.isRunning = true;
  state.currentSeconds = state.sessionTime * 60;

  hideElements([
    elements.breakDiv,
    elements.breakMinusButton,
    elements.breakPlusButton,
    elements.sessionMinusButton,
    elements.sessionPlusButton,
    elements.startButton,
  ]);
  showElements([elements.stopButton]);

  state.sessionTimerId = setInterval(timerTick, 1000);
  timerTick();
}

/* Stop & Reset button click */
function resetTimer() {
  clearTimers();
  resetToDefaults();
}

/**
 * Timer tick function
 * Decrement time, format time, update display, and check if complete based on current state
 */
function timerTick() {
  state.currentSeconds--;
  if (state.isBreak) {
    elements.breakTime.textContent = formatTime(state.currentSeconds);
    if (state.currentSeconds <= 0) {
      breakComplete();
    }
  } else {
    elements.sessionTime.textContent = formatTime(state.currentSeconds);
    if (state.currentSeconds <= 0) {
      sessionComplete();
    }
  }
}

/* Handle session completion */
function sessionComplete() {
  playBuzzer();
  clearInterval(state.sessionTimerId);
  state.sessionTimerId = null;
  state.isBreak = true;

  // Start break
  state.currentSeconds = state.breakTime * 60;
  elements.sessionDiv.classList.add("hidden");
  elements.breakDiv.classList.remove("hidden");

  state.breakTimerId = setInterval(timerTick, 1000);
  timerTick();
}

/* Handle break completion */
function breakComplete() {
  playBuzzer();
  clearInterval(state.breakTimerId);
  state.breakTimerId = null;
  state.isRunning = false;
  state.isBreak = false;

  // Show reset button
  elements.resetButton.classList.remove("hidden");
  hideElements([elements.breakDiv, elements.stopButton]);
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

  // Update displays
  elements.sessionTime.textContent = state.sessionTime;
  elements.breakTime.textContent = state.breakTime;

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
