/**
 * mood.js — Daily Mood Assessment & Adaptive Day Planning Engine
 * Assesses emotional bandwidth & energy, generates adaptive focus prescriptions,
 * connects to Hero RPG (HP/XP/Gold) and Time Accounting stats.
 */

"use strict";

import { getIcon } from "../utils/icons.js";
import { showSuccess } from "./toast.js";
import { escapeHtml } from "../utils/sanitize.js";
import { safeGet, safeSet } from "../utils/storage.js";

const STORAGE_KEY = "pomidor.moods";

export const MOOD_PROFILES = {
  energized: {
    id: "energized",
    name: "Energized",
    subtitle: "Peak Energy & Drive",
    color: "#f59e0b",
    icon: "mood-energized",
    workMinutes: 45,
    breakMinutes: 10,
    badgeText: "High Bandwidth",
    tagline: "Surplus bandwidth detected. Perfect moment for deep focus on high-impact, complex milestones.",
    strategyTitle: "Sprint & Strike Strategy",
    strategyRules: [
      "Commit to 45-minute deep focus intervals.",
      "Attack the hardest, highest-leverage task on your board first.",
      "Eliminate context switching and defer communications.",
      "Take a restorative 10m walk or stretch between sprints."
    ],
    timerButtonText: "Set 45m Sprint Timer",
  },
  focused: {
    id: "focused",
    name: "Focused",
    subtitle: "Steady, Clear Flow",
    color: "#0ea5e9",
    icon: "mood-focused",
    workMinutes: 25,
    breakMinutes: 5,
    badgeText: "Standard Cadence",
    tagline: "In the groove with steady concentration. Classic intervals maintain stamina without burnout.",
    strategyTitle: "Classic Cadence Strategy",
    strategyRules: [
      "Work in standard 25-minute Pomodoro sessions.",
      "Tackle planned list sequentially with zero multi-tasking.",
      "Step away from the screen for 5 minutes each break.",
      "Target 4-6 steady, sustainable pomodoros today."
    ],
    timerButtonText: "Set 25m Classic Timer",
  },
  neutral: {
    id: "neutral",
    name: "Balanced",
    subtitle: "Calm & Level",
    color: "#10b981",
    icon: "mood-neutral",
    workMinutes: 20,
    breakMinutes: 5,
    badgeText: "Steady Baseline",
    tagline: "Balanced and receptive. Ideal for balancing routine administration with core focus tasks.",
    strategyTitle: "Balanced Rhythm Strategy",
    strategyRules: [
      "Alternate between 20m focus sessions and routine housekeeping.",
      "Clear 2 quick administrative tasks before tackling a deeper project.",
      "Maintain comfortable posture and steady hydration."
    ],
    timerButtonText: "Set 20m Balanced Timer",
  },
  fatigued: {
    id: "fatigued",
    name: "Fatigued",
    subtitle: "Low Energy / Depleted",
    color: "#8b5cf6",
    icon: "mood-fatigued",
    workMinutes: 15,
    breakMinutes: 7,
    badgeText: "Gentle Pacing",
    tagline: "Cognitive bandwidth is running low. Forcing heavy cognitive loads leads to burnout and friction.",
    strategyTitle: "Low-Friction Quick-Wins Strategy",
    strategyRules: [
      "Shorten focus blocks to 15-minute gentle micro-sessions.",
      "Pick low-effort quick wins or check off simple daily habits.",
      "Rest 7+ minutes between sessions completely guilt-free.",
      "Defer demanding architectural or creative decisions until tomorrow."
    ],
    timerButtonText: "Set 15m Gentle Timer",
  },
  overwhelmed: {
    id: "overwhelmed",
    name: "Overwhelmed",
    subtitle: "Cognitive Overload",
    color: "#ef4444",
    icon: "mood-overwhelmed",
    workMinutes: 10,
    breakMinutes: 5,
    badgeText: "Single-Task Triage",
    tagline: "Sensory or task overload detected. Radically narrow your scope down to a single point of focus.",
    strategyTitle: "Radical Single-Task Triage",
    strategyRules: [
      "Drop down to 10-minute micro-focus sprints.",
      "Pick exactly ONE micro-task. Collapse or hide everything else.",
      "Take 3 deep, mindful breaths before starting the countdown.",
      "Any forward progress today is a complete victory."
    ],
    timerButtonText: "Set 10m Micro Timer",
  },
};

const ENERGY_LEVELS = [
  { level: 1, label: "Critical", desc: "Running on empty" },
  { level: 2, label: "Low", desc: "Subdued energy" },
  { level: 3, label: "Moderate", desc: "Even keel" },
  { level: 4, label: "High", desc: "Sharp & alert" },
  { level: 5, label: "Peak", desc: "Surging drive" },
];

let isEditing = false;
let selectedMood = null;
let selectedEnergy = 3;

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMoodHistory() {
  return safeGet(STORAGE_KEY, []);
}

export function saveMoodHistory(history) {
  safeSet(STORAGE_KEY, history);
}

export function getTodayMood() {
  const today = getTodayKey();
  const history = getMoodHistory();
  return history.find((entry) => entry.date === today) || null;
}

export function logMood({ mood, energy, note = "" }) {
  const today = getTodayKey();
  let history = getMoodHistory();
  const existingIdx = history.findIndex((h) => h.date === today);

  const entry = {
    date: today,
    mood,
    energy: Number(energy) || 3,
    note: String(note || "").trim(),
    timestamp: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    history[existingIdx] = entry;
  } else {
    history.push(entry);
  }

  saveMoodHistory(history);
  isEditing = false;
  selectedMood = mood;
  selectedEnergy = entry.energy;

  // Dispatch mood check-in event for gamification & stats
  document.dispatchEvent(
    new CustomEvent("mood-checked-in", {
      detail: entry,
    })
  );

  renderMoodSection();
  showSuccess(`Bandwidth logged! Adaptive plan generated.`);
  return entry;
}

export function applyMoodTimer(workMinutes, breakMinutes) {
  // Update classic timer text elements if present
  const sessionTimeEl = document.getElementById("session-time");
  const breakTimeEl = document.getElementById("break-time");
  if (sessionTimeEl) sessionTimeEl.textContent = workMinutes;
  if (breakTimeEl) breakTimeEl.textContent = breakMinutes;

  // Dispatch timer-preset-change for modernTimer and timer.js
  document.dispatchEvent(
    new CustomEvent("timer-preset-change", {
      detail: { workMinutes, breakMinutes },
    })
  );

  showSuccess(`Timer calibrated: ${workMinutes}m focus / ${breakMinutes}m break`);
}

export function initMood() {
  setupMoodUI();
}

function setupMoodUI() {
  const todoContainer = document.querySelector(".todo-container");
  if (!todoContainer) return;

  let section = document.getElementById("mood-tracker-section");
  if (!section) {
    section = document.createElement("div");
    section.id = "mood-tracker-section";
    section.className = "mood-tracker-section";

    const habitsSection = document.getElementById("habits-section");
    if (habitsSection) {
      habitsSection.parentNode.insertBefore(section, habitsSection);
    } else {
      todoContainer.prepend(section);
    }
  }

  const todayEntry = getTodayMood();
  if (todayEntry && !selectedMood) {
    selectedMood = todayEntry.mood;
    selectedEnergy = todayEntry.energy;
  }

  renderMoodSection();
}

export function renderMoodSection() {
  const container = document.getElementById("mood-tracker-section");
  if (!container) return;

  const todayEntry = getTodayMood();

  // If already logged and not explicitly in edit mode, show the Adaptive Day Plan
  if (todayEntry && !isEditing) {
    renderAdaptivePlan(container, todayEntry);
  } else {
    renderAssessmentForm(container, todayEntry);
  }
}

function renderAssessmentForm(container, existingEntry) {
  const currentMood = selectedMood || existingEntry?.mood || null;
  const currentEnergy = selectedEnergy || existingEntry?.energy || 3;
  const currentNote = existingEntry?.note || "";

  const moodKeys = ["energized", "focused", "neutral", "fatigued", "overwhelmed"];

  container.innerHTML = `
    <div class="mood-card assessment-card">
      <div class="mood-header">
        <div class="mood-title-wrap">
          <div class="mood-icon-badge">
            ${getIcon("flame", { size: 18 })}
          </div>
          <div>
            <h3 class="mood-title">Daily Mood & Bandwidth Assessment</h3>
            <p class="mood-subtitle">Check in to assess your cognitive bandwidth and unlock an adaptive focus plan.</p>
          </div>
        </div>
        ${
          existingEntry
            ? `<button class="mood-btn-text" id="cancel-mood-edit-btn">Cancel</button>`
            : ""
        }
      </div>

      <div class="mood-step-label">1. How are you feeling today?</div>
      <div class="mood-tiles-grid" role="radiogroup" aria-label="Select your mood">
        ${moodKeys
          .map((key) => {
            const prof = MOOD_PROFILES[key];
            const isSelected = currentMood === key;
            return `
              <button 
                type="button"
                role="radio"
                aria-checked="${isSelected}"
                class="mood-tile ${isSelected ? "selected" : ""}" 
                data-mood-choice="${prof.id}"
                style="--mood-accent: ${prof.color};"
              >
                <div class="mood-tile-icon">${getIcon(prof.icon, { size: 28 })}</div>
                <span class="mood-tile-title">${prof.name}</span>
                <span class="mood-tile-subtitle">${prof.subtitle}</span>
                <span class="mood-tile-cadence">${prof.workMinutes}m focus</span>
              </button>
            `;
          })
          .join("")}
      </div>

      <div class="mood-step-label">2. Energy Level: <span id="energy-desc-text" class="energy-highlight">Moderate (Even keel)</span></div>
      <div class="energy-selector-wrap">
        <div class="energy-levels-bar" role="radiogroup" aria-label="Energy level">
          ${ENERGY_LEVELS.map((el) => {
            const isChecked = currentEnergy === el.level;
            return `
              <button 
                type="button" 
                role="radio"
                aria-checked="${isChecked}"
                class="energy-dot-btn ${isChecked ? "active" : ""}" 
                data-energy-val="${el.level}"
                title="${el.label}: ${el.desc}"
              >
                <span class="energy-dot-number">${el.level}</span>
                <span class="energy-dot-label">${el.label}</span>
              </button>
            `;
          }).join("")}
        </div>
      </div>

      <div class="mood-step-label">3. Reflection / Mindset (Optional)</div>
      <div class="mood-note-wrap">
        <input 
          type="text" 
          id="mood-note-input" 
          class="mood-note-input" 
          placeholder="e.g. Slept 8 hours, ready to build or feeling slightly foggy..." 
          value="${escapeHtml(currentNote)}"
          maxlength="140"
        />
      </div>

      <div class="mood-form-footer">
        <button 
          id="submit-mood-btn" 
          class="mood-submit-btn ${!currentMood ? "disabled" : ""}" 
          ${!currentMood ? "disabled" : ""}
        >
          ${getIcon("sparkles", { size: 16 })}
          <span>Generate Adaptive Day Plan</span>
        </button>
        <span class="mood-xp-reward-hint">${getIcon("trophy", { size: 13 })} +30 XP • +10 Gold • +15 HP Heal</span>
      </div>
    </div>
  `;

  // Energy descriptor update helper
  const updateEnergyLabel = (val) => {
    const item = ENERGY_LEVELS.find((l) => l.level === Number(val)) || ENERGY_LEVELS[2];
    const textEl = container.querySelector("#energy-desc-text");
    if (textEl) {
      textEl.textContent = `${item.label} (${item.desc})`;
    }
  };
  updateEnergyLabel(currentEnergy);

  // Mood selection event listeners
  container.querySelectorAll("[data-mood-choice]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-mood-choice");
      selectedMood = choice;
      container.querySelectorAll(".mood-tile").forEach((t) => {
        t.classList.remove("selected");
        t.setAttribute("aria-checked", "false");
      });
      btn.classList.add("selected");
      btn.setAttribute("aria-checked", "true");

      const submitBtn = container.querySelector("#submit-mood-btn");
      if (submitBtn) {
        submitBtn.classList.remove("disabled");
        submitBtn.disabled = false;
      }
    });
  });

  // Energy selection event listeners
  container.querySelectorAll("[data-energy-val]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const val = Number(btn.getAttribute("data-energy-val"));
      selectedEnergy = val;
      container.querySelectorAll(".energy-dot-btn").forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");
      updateEnergyLabel(val);
    });
  });

  // Cancel button
  const cancelBtn = container.querySelector("#cancel-mood-edit-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      isEditing = false;
      renderMoodSection();
    });
  }

  // Submit button
  const submitBtn = container.querySelector("#submit-mood-btn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      if (!selectedMood) return;
      const noteInput = container.querySelector("#mood-note-input");
      const note = noteInput ? noteInput.value : "";
      logMood({ mood: selectedMood, energy: selectedEnergy, note });
    });
  }
}

function renderAdaptivePlan(container, entry) {
  const prof = MOOD_PROFILES[entry.mood] || MOOD_PROFILES.focused;
  const energyInfo = ENERGY_LEVELS.find((l) => l.level === entry.energy) || ENERGY_LEVELS[2];

  container.innerHTML = `
    <div class="mood-card adaptive-plan-card" style="--plan-accent: ${prof.color};">
      <div class="plan-header">
        <div class="plan-title-group">
          <div class="plan-mood-badge" style="background: ${prof.color}18; color: ${prof.color}; border: 1px solid ${prof.color}40;">
            ${getIcon(prof.icon, { size: 22 })}
            <span class="plan-mood-name">${prof.name}</span>
          </div>
          <div class="plan-energy-badge">
            <span class="plan-energy-dots">
              ${[1, 2, 3, 4, 5]
                .map((i) => `<span class="energy-pip ${i <= entry.energy ? "active" : ""}"></span>`)
                .join("")}
            </span>
            <span class="plan-energy-label">${energyInfo.label} (${entry.energy}/5)</span>
          </div>
        </div>

        <div class="plan-header-actions">
          <button class="plan-reassess-btn" id="reassess-mood-btn" title="Update or re-assess your daily bandwidth">
            ${getIcon("settings", { size: 14 })} Re-assess
          </button>
        </div>
      </div>

      <div class="plan-summary-box">
        <div class="plan-tagline">${prof.tagline}</div>
        ${
          entry.note
            ? `<div class="plan-user-note">"${escapeHtml(entry.note)}"</div>`
            : ""
        }
      </div>

      <div class="plan-strategy-section">
        <div class="plan-strategy-title">
          ${getIcon("target", { size: 15 })}
          <span>${prof.strategyTitle}</span>
          <span class="plan-cadence-pill">${prof.workMinutes}m focus / ${prof.breakMinutes}m break</span>
        </div>
        <ul class="plan-rules-list">
          ${prof.strategyRules.map((rule) => `<li>${rule}</li>`).join("")}
        </ul>
      </div>

      <div class="plan-actions-bar">
        <button 
          class="plan-action-btn primary" 
          id="apply-plan-timer-btn"
          data-work="${prof.workMinutes}"
          data-break="${prof.breakMinutes}"
        >
          ${getIcon("play", { size: 14 })}
          <span>${prof.timerButtonText}</span>
        </button>

        <span class="plan-reward-tag">
          ${getIcon("trophy", { size: 13 })} Daily Bandwidth Assessed (+30 XP)
        </span>
      </div>
    </div>
  `;

  // Attach button events
  const reassessBtn = container.querySelector("#reassess-mood-btn");
  if (reassessBtn) {
    reassessBtn.addEventListener("click", () => {
      isEditing = true;
      selectedMood = entry.mood;
      selectedEnergy = entry.energy;
      renderMoodSection();
    });
  }

  const applyTimerBtn = container.querySelector("#apply-plan-timer-btn");
  if (applyTimerBtn) {
    applyTimerBtn.addEventListener("click", () => {
      const work = Number(applyTimerBtn.getAttribute("data-work")) || prof.workMinutes;
      const brk = Number(applyTimerBtn.getAttribute("data-break")) || prof.breakMinutes;
      applyMoodTimer(work, brk);
    });
  }
}

