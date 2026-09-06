/**
 * companion.js — Interactive On-Brand Desktop Companion Widget
 * Manages companion state, reactive speech, lifecycle events, and companion modes.
 */

"use strict";

import { getMascot, TOOL_SPECIALISTS, getAllMascots } from "./mascotRegistry.js";
import { renderMascotSvg } from "./mascotSprites.js";
import { startTourForCurrentTool } from "./onboardingTour.js";
import { getIcon } from "../../utils/icons.js";

const STORAGE_KEY = "pomidor.companionSettings";

const state = {
  enabled: true,
  mode: "follow", // 'follow' (one mascot everywhere) | 'specialist' (different companion per tool)
  selectedMascotId: "pomi",
  currentTool: "pomodoro",
  animState: "idle", // 'idle' | 'cheer' | 'think' | 'sleep' | 'heart'
  minimized: false,
  speechTimeout: null,
};

export function initCompanion() {
  loadSettings();
  createCompanionDOM();
  setupEventListeners();
  updateCompanionView();
}

function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      state.enabled = parsed.enabled !== undefined ? parsed.enabled : true;
      state.mode = parsed.mode || "follow";
      state.selectedMascotId = parsed.selectedMascotId || "pomi";
      state.minimized = Boolean(parsed.minimized);
    }
  } catch (e) {
    console.warn("Error loading companion settings:", e);
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: state.enabled,
        mode: state.mode,
        selectedMascotId: state.selectedMascotId,
        minimized: state.minimized,
      }),
    );
  } catch (e) {
    console.warn("Error saving companion settings:", e);
  }
}

export function getCompanionSettings() {
  return { ...state };
}

export function setCompanionEnabled(enabled) {
  state.enabled = Boolean(enabled);
  saveSettings();
  updateCompanionView();
}

export function setCompanionMode(mode) {
  if (mode === "follow" || mode === "specialist") {
    state.mode = mode;
    saveSettings();
    updateCompanionView();
    speak("Companion mode updated!", 2500);
  }
}

export function setSelectedMascot(mascotId) {
  state.selectedMascotId = mascotId;
  saveSettings();
  updateCompanionView();
  const mascot = getMascot(mascotId);
  speak(`Hi! I am ${mascot.name}. Ready to accompany your journey!`, 4000);
}

export function getCurrentMascot() {
  if (state.mode === "specialist") {
    const specialistId = TOOL_SPECIALISTS[state.currentTool] || "pomi";
    return getMascot(specialistId);
  }
  return getMascot(state.selectedMascotId);
}

function createCompanionDOM() {
  let widget = document.getElementById("mascot-companion-widget");
  if (!widget) {
    widget = document.createElement("div");
    widget.id = "mascot-companion-widget";
    widget.className = "mascot-companion-widget";
    document.body.appendChild(widget);
  }
}

export function updateCompanionView() {
  const widget = document.getElementById("mascot-companion-widget");
  if (!widget) return;

  if (!state.enabled) {
    widget.style.display = "none";
    return;
  }

  widget.style.display = "flex";
  widget.classList.toggle("is-minimized", state.minimized);

  const mascot = getCurrentMascot();

  widget.innerHTML = `
    <!-- Speech Bubble -->
    <div class="companion-speech-bubble" id="companion-speech-bubble">
      <div class="speech-header">
        <span class="mascot-badge-tag">${escapeHtml(mascot.name)}</span>
        <button class="speech-close-btn" id="companion-minimize-btn" title="Minimize / Expand" aria-label="Minimize companion">
          ${state.minimized ? getIcon("chevron-up", { size: 14 }) : getIcon("chevron-down", { size: 14 })}
        </button>
      </div>
      <p class="speech-text" id="companion-speech-text">${getGreetingForTool(mascot, state.currentTool)}</p>
      <div class="speech-actions">
        <button class="companion-action-chip" id="companion-tour-btn">
          ${getIcon("sparkles", { size: 13, className: "chip-icon" })} Tour ${formatToolName(state.currentTool)}
        </button>
        <button class="companion-action-chip" id="companion-tip-btn">
          ${getIcon("lightbulb", { size: 13, className: "chip-icon" })} Tip
        </button>
        <button class="companion-action-chip" id="companion-swap-btn" title="Swap companion">
          ${getIcon("refresh", { size: 13, className: "chip-icon" })} Swap
        </button>
      </div>
    </div>

    <!-- Interactive Character Avatar -->
    <div class="companion-avatar-stage" id="companion-avatar-stage" role="button" tabindex="0" title="Click to interact / pet ${mascot.name}" aria-label="Pet ${mascot.name}">
      ${renderMascotSvg(mascot.id, state.animState, 110)}
      <div class="pet-heart-emitter" id="pet-heart-emitter"></div>
    </div>
  `;

  bindWidgetEvents(widget);
}

function formatToolName(tool) {
  const names = {
    pomodoro: "Timer",
    todo: "Tasks",
    list: "Tasks",
    kanban: "Kanban",
    vault: "Vault",
    calendar: "Calendar",
    stats: "Stats",
    hero: "Hero",
    tactics: "Tactics",
  };
  return names[tool] || tool;
}

function getGreetingForTool(mascot, tool) {
  const norm = tool === "list" ? "todo" : tool;
  return (
    mascot.greetings?.[norm] ||
    mascot.greetings?.[tool] ||
    `Welcome to ${formatToolName(norm)}! Let's get things done.`
  );
}

function bindWidgetEvents(widget) {
  const stage = widget.querySelector("#companion-avatar-stage");
  stage?.addEventListener("click", handlePetting);
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePetting();
    }
  });

  widget.querySelector("#companion-minimize-btn")?.addEventListener("click", () => {
    state.minimized = !state.minimized;
    saveSettings();
    updateCompanionView();
  });

  widget.querySelector("#companion-tour-btn")?.addEventListener("click", () => {
    startTourForCurrentTool(state.currentTool, getCurrentMascot());
  });

  widget.querySelector("#companion-tip-btn")?.addEventListener("click", () => {
    const mascot = getCurrentMascot();
    const randomTip =
      mascot.tips[Math.floor(Math.random() * mascot.tips.length)] ||
      "Focus on one small milestone at a time.";
    speak(randomTip, 5000);
  });

  widget.querySelector("#companion-swap-btn")?.addEventListener("click", openMascotPicker);
}

function handlePetting() {
  const mascot = getCurrentMascot();
  setAnimState("heart", 1800);
  spawnHearts();

  const petResponses = [
    "*purr* Thank you! Ready to power through!",
    "Aww, you're the best! Focus morale boosted!",
    "I believe in you! Let's crush this next session!",
    "*happy tomato bounce* You're making awesome progress!",
  ];
  const response = petResponses[Math.floor(Math.random() * petResponses.length)];
  speak(response, 3000);
}

function spawnHearts() {
  const emitter = document.getElementById("pet-heart-emitter");
  if (!emitter) return;

  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const heart = document.createElement("span");
      heart.className = "floating-pet-heart";
      heart.innerHTML = getIcon("heart", { size: 16, className: "pet-heart-svg" });
      heart.style.left = `${30 + Math.random() * 40}%`;
      emitter.appendChild(heart);
      setTimeout(() => heart.remove(), 1200);
    }, i * 150);
  }
}

export function setAnimState(newState, durationMs = 2000) {
  state.animState = newState;
  const stage = document.getElementById("companion-avatar-stage");
  if (stage) {
    const mascot = getCurrentMascot();
    stage.innerHTML = `
      ${renderMascotSvg(mascot.id, state.animState, 110)}
      <div class="pet-heart-emitter" id="pet-heart-emitter"></div>
    `;
  }

  if (durationMs > 0 && newState !== "idle") {
    setTimeout(() => {
      if (state.animState === newState) {
        setAnimState("idle", 0);
      }
    }, durationMs);
  }
}

export function speak(text, duration = 4000) {
  const speechBubble = document.getElementById("companion-speech-bubble");
  const speechText = document.getElementById("companion-speech-text");
  if (!speechBubble || !speechText) return;

  speechText.textContent = text;
  speechBubble.classList.add("highlight-speech");

  if (state.speechTimeout) clearTimeout(state.speechTimeout);
  state.speechTimeout = setTimeout(() => {
    speechBubble.classList.remove("highlight-speech");
  }, duration);
}

export function notifyToolChange(toolName) {
  state.currentTool = toolName;
  updateCompanionView();
}

function openMascotPicker() {
  const allMascots = getAllMascots();
  let modal = document.getElementById("mascot-picker-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mascot-picker-modal";
    modal.className = "mascot-picker-modal-backdrop";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="mascot-picker-dialog">
      <div class="dialog-header">
        <h3>Choose Your Companion</h3>
        <button class="dialog-close-btn" id="close-mascot-picker" aria-label="Close dialog">${getIcon("close", { size: 16 })}</button>
      </div>
      <p class="dialog-sub">Select your primary sidekick or brand mascot:</p>
      <div class="mascot-grid">
        ${allMascots
          .map(
            (m) => `
          <div class="mascot-card ${state.selectedMascotId === m.id ? "active" : ""}" data-mascot-id="${m.id}">
            <div class="mascot-card-svg">${renderMascotSvg(m.id, "idle", 70)}</div>
            <div class="mascot-card-info">
              <h4>${escapeHtml(m.name)}</h4>
              <span class="mascot-brand-badge">${escapeHtml(m.brand)}</span>
              <p>${escapeHtml(m.title)}</p>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <div class="mascot-mode-toggle-box">
        <label class="toggle-mode-label">
          <strong>Specialist Mode:</strong>
          <span>Assign different companions automatically to each tool (Pomi on Timer, Kip on Tasks, Chronos on Calendar, Bolt on Stats)</span>
        </label>
        <button class="companion-action-chip ${state.mode === "specialist" ? "active" : ""}" id="toggle-specialist-mode">
          ${state.mode === "specialist" ? `${getIcon("check", { size: 13 })} Specialist Active` : "Enable Specialists"}
        </button>
      </div>
    </div>
  `;

  modal.style.display = "flex";

  modal.querySelector("#close-mascot-picker")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.querySelectorAll(".mascot-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.mascotId;
      setSelectedMascot(id);
      modal.style.display = "none";
    });
  });

  modal.querySelector("#toggle-specialist-mode")?.addEventListener("click", () => {
    setCompanionMode(state.mode === "specialist" ? "follow" : "specialist");
    modal.style.display = "none";
  });
}

function setupEventListeners() {
  // 1. Pomodoro Started
  document.addEventListener("pomodoro-started", () => {
    setAnimState("think", 3000);
    speak("Focus sprint initiated! Let's eliminate all distractions!", 3500);
  });

  // 2. Pomodoro Completed
  document.addEventListener("pomodoro-complete", () => {
    setAnimState("cheer", 5000);
    speak("Incredible job! Another focus session successfully banked!", 5000);
  });

  // 3. Break Started
  document.addEventListener("break-started", () => {
    setAnimState("sleep", 6000);
    speak("Time to recharge! Rest your eyes, take a sip of water.", 4500);
  });

  // 4. Task Checked
  document.addEventListener("task-complete", (e) => {
    setAnimState("cheer", 2000);
    speak("Task checked off! Keep this unstoppable momentum going!", 3000);
  });

  // 5. Habit Completed
  document.addEventListener("habit-completed", (e) => {
    setAnimState("cheer", 2000);
    const streak = e.detail?.streak || 1;
    speak(`Habit verified! You are on a ${streak}-day streak!`, 3500);
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
