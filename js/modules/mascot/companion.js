/**
 * companion.js — Floating Mascot Companion Widget & Experience Manager
 * Zero emojis, SVG only, customizable interactions, and per-experience assignee support.
 */

"use strict";

import {
  MASCOTS,
  getAllMascots,
  getMascot,
  getExperienceAssignments,
  setExperienceMascot,
} from "./mascotRegistry.js";
import { renderMascotSvg } from "./mascotSprites.js";
import { startTourForCurrentTool } from "./onboardingTour.js";
import { getIcon } from "../../utils/icons.js";
import { escapeHtml } from "../../utils/sanitize.js";
import { safeGet, safeSet } from "../../utils/storage.js";

const STORAGE_KEY = "pomidor.mascot.settings";

let state = {
  enabled: true,
  mode: "follow", // "follow" | "specialist"
  selectedMascotId: "pomi",
  minimized: false,
  animState: "idle",
  currentTool: "pomodoro",
  speechTimeout: null,
};

export function initCompanion() {
  loadSettings();
  createCompanionDOM();
  updateCompanionView();
  setupEventListeners();

  window.addEventListener("mascotassignmentchange", () => {
    updateCompanionView();
  });
  window.addEventListener("langchange", () => {
    updateCompanionView();
  });
}

function loadSettings() {
  const saved = safeGet(STORAGE_KEY, {});
  state = { ...state, ...saved };
}

function saveSettings() {
  safeSet(STORAGE_KEY, {
    enabled: state.enabled,
    mode: state.mode,
    selectedMascotId: state.selectedMascotId,
    minimized: state.minimized,
  });
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
    const assignments = getExperienceAssignments();
    const normalizedTool = state.currentTool === "list" ? "todo" : state.currentTool;
    const specialistId = assignments[normalizedTool] || assignments[state.currentTool] || "pomi";
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

  const mascot = getCurrentMascot();
  const interaction = mascot.customInteraction || {
    name: "Focus Cheer",
    description: "Boosts morale",
    speech: "Let's conquer time together!",
    badge: "+5 Focus XP",
    fxType: "tomato-sparkle",
  };

  widget.innerHTML = `
    <div class="companion-speech-bubble ${state.minimized ? "hidden" : ""}" id="companion-speech-bubble" role="status" aria-live="polite">
      <div class="speech-header">
        <div class="speech-header-left">
          <span class="companion-badge-pill mascot-badge-tag" style="border-color: ${mascot.palette.primary}; color: ${mascot.palette.primary};">
            ${escapeHtml(mascot.name)}
          </span>
        </div>
        <div class="speech-header-right">
          <button class="speech-close-btn" id="companion-minimize-btn" title="Minimize" aria-label="Minimize companion">
            ${getIcon("close", { size: 14 })}
          </button>
        </div>
      </div>
      <p class="speech-text" id="companion-speech-text">${escapeHtml(getGreetingForTool(mascot, state.currentTool))}</p>
      <div class="speech-actions">
        <button class="companion-action-chip interaction-trigger-chip" id="companion-interact-btn" title="${escapeHtml(interaction.description)}">
          ${getIcon("sparkles", { size: 13 })} <span>${escapeHtml(interaction.name)}</span>
          <span class="companion-interaction-badge">${escapeHtml(interaction.badge)}</span>
        </button>
        <button class="companion-action-chip" id="companion-tour-btn" title="Take a guided tour of ${formatToolName(state.currentTool)}">
          ${getIcon("compass", { size: 13 })} Tour
        </button>
        <button class="companion-action-chip" id="companion-tip-btn" title="Get a tip">
          ${getIcon("lightbulb", { size: 13 })} Tip
        </button>
        <button class="companion-action-chip" id="companion-swap-btn" title="Change companion or assignments">
          ${getIcon("refresh", { size: 13 })} Swap
        </button>
      </div>
    </div>

    <div class="companion-body">
      <div class="companion-avatar-stage" id="companion-avatar-stage" role="button" tabindex="0" title="Click for signature interaction" aria-label="${escapeHtml(mascot.name)} - Click to interact">
        ${renderMascotSvg(mascot.id, state.animState, 110)}
        <div class="pet-heart-emitter" id="pet-heart-emitter"></div>
      </div>
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
  stage?.addEventListener("click", () => triggerCustomInteraction());
  stage?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerCustomInteraction();
    }
  });

  widget.querySelector("#companion-interact-btn")?.addEventListener("click", () => {
    triggerCustomInteraction();
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

export function triggerCustomInteraction(targetMascot = null) {
  const mascot = targetMascot || getCurrentMascot();
  const interaction = mascot.customInteraction || {
    name: "Focus Cheer",
    speech: "Let's conquer time together!",
    fxType: "tomato-sparkle",
  };

  // Restoring chat bubble if closed or minimized
  if (state.minimized) {
    state.minimized = false;
    saveSettings();
    updateCompanionView();
  }

  setAnimState("cheer", 2200);
  spawnCustomParticles(interaction.fxType);
  speak(interaction.speech, 4500);

  window.dispatchEvent(
    new CustomEvent("mascot-interaction", { detail: { mascot, interaction } }),
  );
}

function spawnCustomParticles(fxType) {
  const emitter = document.getElementById("pet-heart-emitter");
  if (!emitter) return;

  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const particle = document.createElement("span");
      particle.className = `floating-fx-particle fx-${fxType}`;

      if (fxType === "cyber-rings") {
        particle.innerHTML = getIcon("zap", { size: 16, className: "fx-cyber-svg" });
      } else if (fxType === "time-dial") {
        particle.innerHTML = getIcon("clock", { size: 16, className: "fx-dial-svg" });
      } else if (fxType === "frost-snow") {
        particle.innerHTML = getIcon("sparkles", { size: 16, className: "fx-frost-svg" });
      } else if (fxType === "cogs-spark") {
        particle.innerHTML = getIcon("settings", { size: 16, className: "fx-cogs-svg" });
      } else {
        particle.innerHTML = getIcon("tomato", { size: 16, className: "fx-tomato-svg" });
      }

      particle.style.left = `${25 + Math.random() * 50}%`;
      emitter.appendChild(particle);
      setTimeout(() => particle.remove(), 1400);
    }, i * 140);
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
  let speechBubble = document.getElementById("companion-speech-bubble");
  let speechText = document.getElementById("companion-speech-text");

  if (state.minimized || (speechBubble && speechBubble.classList.contains("hidden"))) {
    state.minimized = false;
    saveSettings();
    updateCompanionView();
    speechBubble = document.getElementById("companion-speech-bubble");
    speechText = document.getElementById("companion-speech-text");
  }

  if (!speechBubble || !speechText) return;

  speechBubble.classList.remove("hidden");
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

export function openMascotPicker() {
  const allMascots = getAllMascots();
  const assignments = getExperienceAssignments();
  let modal = document.getElementById("mascot-picker-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "mascot-picker-modal";
    modal.className = "mascot-picker-modal-backdrop";
    document.body.appendChild(modal);
  }

  const experiences = [
    { id: "pomodoro", name: "Focus Timer" },
    { id: "todo", name: "To-Do Lists" },
    { id: "kanban", name: "Kanban Board" },
    { id: "vault", name: "Notes Vault" },
    { id: "calendar", name: "Calendar" },
    { id: "stats", name: "Productivity Stats" },
    { id: "hero", name: "Hero RPG" },
    { id: "tactics", name: "Tactics & Arena" },
  ];

  modal.innerHTML = `
    <div class="mascot-picker-dialog">
      <div class="dialog-header">
        <h3>Companion Manager & Experience Assignee</h3>
        <button class="dialog-close-btn" id="close-mascot-picker" aria-label="Close dialog">${getIcon("close", { size: 16 })}</button>
      </div>

      <div class="picker-tabs-nav">
        <button class="picker-tab-btn active" id="tab-btn-primary">Primary Companion</button>
        <button class="picker-tab-btn" id="tab-btn-experiences">Assign to Experiences</button>
      </div>

      <!-- Tab 1: Primary Companion Selection -->
      <div class="picker-tab-pane active" id="pane-primary">
        <p class="dialog-sub">Select your active companion and tap to preview their signature interaction:</p>
        <div class="mascot-grid">
          ${allMascots
            .map(
              (m) => `
            <div class="mascot-card ${state.selectedMascotId === m.id ? "active" : ""}" data-mascot-id="${m.id}">
              <div class="mascot-card-svg">${renderMascotSvg(m.id, "idle", 70)}</div>
              <div class="mascot-card-info">
                <h4>${escapeHtml(m.name)}</h4>
                <span class="mascot-brand-badge">${escapeHtml(m.brand)}</span>
                <p class="mascot-card-title">${escapeHtml(m.title)}</p>
                <span class="mascot-interaction-tag">
                  ${getIcon("sparkles", { size: 12 })} ${escapeHtml(m.customInteraction?.name || "Focus Morale")}
                </span>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <!-- Tab 2: Per-Experience Assignee -->
      <div class="picker-tab-pane" id="pane-experiences" style="display: none;">
        <p class="dialog-sub">Customize which mascot specialist guards each tool:</p>
        <div class="experience-assign-grid">
          ${experiences
            .map((exp) => {
              const assignedMascotId = assignments[exp.id] || "pomi";
              return `
              <div class="experience-assign-row">
                <div class="exp-info">
                  <strong>${escapeHtml(exp.name)}</strong>
                </div>
                <div class="exp-select-wrap">
                  <select class="exp-mascot-select" data-exp-id="${exp.id}">
                    ${allMascots
                      .map(
                        (m) => `
                      <option value="${m.id}" ${assignedMascotId === m.id ? "selected" : ""}>
                        ${escapeHtml(m.name)} (${escapeHtml(m.brand)})
                      </option>
                    `,
                      )
                      .join("")}
                  </select>
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      <div class="mascot-mode-toggle-box">
        <label class="toggle-mode-label">
          <strong>Behavior Mode:</strong>
          <span>${state.mode === "specialist" ? "Specialist Active: tools show their assigned mascot" : "Follow Me Active: your chosen companion stays with you everywhere"}</span>
        </label>
        <button class="companion-action-chip ${state.mode === "specialist" ? "active" : ""}" id="toggle-specialist-mode">
          ${state.mode === "specialist" ? `${getIcon("check", { size: 13 })} Specialist Mode` : "Switch to Specialist Mode"}
        </button>
      </div>
    </div>
  `;

  modal.style.display = "flex";

  const tabBtnPrimary = modal.querySelector("#tab-btn-primary");
  const tabBtnExp = modal.querySelector("#tab-btn-experiences");
  const panePrimary = modal.querySelector("#pane-primary");
  const paneExp = modal.querySelector("#pane-experiences");

  tabBtnPrimary?.addEventListener("click", () => {
    tabBtnPrimary.classList.add("active");
    tabBtnExp.classList.remove("active");
    panePrimary.style.display = "block";
    paneExp.style.display = "none";
  });

  tabBtnExp?.addEventListener("click", () => {
    tabBtnExp.classList.add("active");
    tabBtnPrimary.classList.remove("active");
    panePrimary.style.display = "none";
    paneExp.style.display = "block";
  });

  modal.querySelector("#close-mascot-picker")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  modal.querySelectorAll(".mascot-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = card.dataset.mascotId;
      setSelectedMascot(id);
      triggerCustomInteraction(getMascot(id));
      modal.style.display = "none";
    });
  });

  modal.querySelectorAll(".exp-mascot-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const expId = select.dataset.expId;
      const mascotId = e.target.value;
      setExperienceMascot(expId, mascotId);
      updateCompanionView();
    });
  });

  modal.querySelector("#toggle-specialist-mode")?.addEventListener("click", () => {
    setCompanionMode(state.mode === "specialist" ? "follow" : "specialist");
    modal.style.display = "none";
  });
}

function setupEventListeners() {
  document.addEventListener("pomodoro-started", () => {
    setAnimState("think", 3000);
    speak("Focus sprint initiated! Let's eliminate all distractions!", 3500);
  });

  document.addEventListener("pomodoro-complete", () => {
    setAnimState("cheer", 5000);
    speak("Incredible job! Another focus session successfully banked!", 5000);
  });

  document.addEventListener("break-started", () => {
    setAnimState("sleep", 6000);
    speak("Time to recharge! Rest your eyes, take a sip of water.", 4500);
  });

  document.addEventListener("task-complete", () => {
    setAnimState("cheer", 2000);
    speak("Task checked off! Keep this unstoppable momentum going!", 3000);
  });

  document.addEventListener("habit-completed", (e) => {
    setAnimState("cheer", 2000);
    const streak = e.detail?.streak || 1;
    speak(`Habit verified! You are on a ${streak}-day streak!`, 3500);
  });
}

