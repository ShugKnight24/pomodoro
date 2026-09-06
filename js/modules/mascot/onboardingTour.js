/**
 * onboardingTour.js — Interactive Mascot-Led Onboarding Tours
 * Guided spotlights for all apps & tools with customizable brand mascots.
 */

"use strict";

import { renderMascotSvg } from "./mascotSprites.js";
import { TOOL_SPECIALISTS, getMascot } from "./mascotRegistry.js";
import { getIcon } from "../../utils/icons.js";

const TOURS_STORAGE_KEY = "pomidor.completedTours";

export const TOUR_STEPS = {
  pomodoro: [
    {
      target: "#timer-classic, #timer-modern",
      title: "The Focus Engine",
      body: "Welcome to the heart of Pomidor! Here you focus in dedicated intervals (typically 25 minutes) punctuated by restorative breaks.",
    },
    {
      target: ".preset-buttons, [data-session='25']",
      title: "Sprint Presets",
      body: "Switch effortlessly between standard 25/5 intervals, 50/10 deep work blocks, or extended 90/20 ultradian rhythms.",
    },
    {
      target: "#timer-controls, #start-btn, #start-modern",
      title: "Take Command",
      body: "Hit Start to ignite your session. All distractions fade away and temporal momentum begins!",
    },
  ],
  todo: [
    {
      target: "[data-new-list-form], #new-list-input",
      title: "Organized Workspaces",
      body: "Create focused project lists to keep work, learning, and personal milestones clearly segregated.",
    },
    {
      target: "[data-new-task-form], #new-task-input",
      title: "Capture & Estimate",
      body: "Add tasks with priority flags and estimated tomato intervals so your day stays realistic and achievable.",
    },
    {
      target: "[data-tasks]",
      title: "Subtasks & Checklists",
      body: "Break giant intimidating projects into digestible subtasks. Every checkmark heals your focus!",
    },
  ],
  kanban: [
    {
      target: "#kanban-container, .kanban-board",
      title: "Visual Agile Workflow",
      body: "Transform your tasks into an agile board. Drag cards smoothly between To Do, In Progress, and Completed columns.",
    },
    {
      target: ".kanban-column:first-child",
      title: "WIP Protection",
      body: "Limit Work In Progress to maintain smooth cognitive flow without multitasking burnout.",
    },
  ],
  vault: [
    {
      target: "#vault-container, .vault-container",
      title: "Private Knowledge Vault",
      body: "A markdown-powered offline notebook. Capture meeting notes, code snippets, and journal entries with 100% privacy.",
    },
    {
      target: "#vault-search, .vault-search",
      title: "Lightning Search",
      body: "Find anything instantly. Your data never leaves your browser — own your time, own your data!",
    },
  ],
  calendar: [
    {
      target: "#calendar-container, .calendar-container",
      title: "Time-Blocking Calendar",
      body: "See your planned tasks plotted across days and weeks. Perfect for realistic capacity planning.",
    },
    {
      target: "#gcal-connect-btn, .calendar-header",
      title: "Google Calendar Sync (Read-Only)",
      body: "Connect your Google Calendar with complete peace of mind: read-only architecture means we never touch or alter your calendar.",
    },
  ],
  stats: [
    {
      target: ".stats-grid, #stats-container",
      title: "Productivity Telemetry",
      body: "Track focused minutes, completed tasks, and streak continuity across days, weeks, and all time.",
    },
    {
      target: ".stats-period-toggle",
      title: "Deep Analytics & Heatmaps",
      body: "Analyze your peak hours and mood correlations to discover your natural productivity rhythm.",
    },
  ],
  hero: [
    {
      target: ".hero-header-banner, .hero-level-ring",
      title: "The Hero's Journey",
      body: "Every pomodoro and task completed grants Focus XP and Chrono-Coins to level up your character!",
    },
    {
      target: "#paperdoll-stage, .hero-paperdoll-wrapper",
      title: "Equipment & Style",
      body: "Equip weapons, tunics, headgear, and legendary mounts unlocked through discipline and the Bazaar shop.",
    },
    {
      target: "#tab-quests, .hero-tabs-nav",
      title: "Story Quests & Bosses",
      body: "Defeat procrastination bosses like the Shade of Delay and the Sloth Drake by finishing your real-life tasks!",
    },
  ],
  tactics: [
    {
      target: "#tactics-squad-panel, .tactics-squad-section",
      title: "Tactical Squad Building",
      body: "Assemble your battle team! Combine your Hero with trained Pet Companions (Chrono Pup, Ember Drake, Moss Golem, Voidling).",
    },
    {
      target: "#tactics-grid-stage, .tactics-battlefield",
      title: "Grid Combat & Action Points",
      body: "Move across the 7x7 grid, manage Action Points (AP), exploit elemental strengths, and strike down temporal aberrations.",
    },
    {
      target: "#tactics-modes-tabs, .tactics-navigation",
      title: "Dungeons, Towers & World Map",
      body: "Choose your path: explore mysterious Dungeons, conquer the ascending Chrono Tower, or venture into the vast Overworld!",
    },
  ],
};

let currentTour = null;
let currentStepIndex = 0;

export function getCompletedTours() {
  try {
    const saved = localStorage.getItem(TOURS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

export function isTourCompleted(tool) {
  const completed = getCompletedTours();
  return Boolean(completed[tool]);
}

export function markTourCompleted(tool) {
  const completed = getCompletedTours();
  completed[tool] = true;
  localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(completed));
  document.dispatchEvent(new CustomEvent("tour-completed", { detail: { tool } }));
}

export function restartTour(tool) {
  const completed = getCompletedTours();
  delete completed[tool];
  localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(completed));
  startTourForCurrentTool(tool);
}

export function restartAllTours() {
  localStorage.removeItem(TOURS_STORAGE_KEY);
  document.dispatchEvent(new CustomEvent("tours-reset"));
}

export function startTourForCurrentTool(tool = "pomodoro", customMascot = null) {
  const norm = tool === "list" ? "todo" : tool;
  const steps = TOUR_STEPS[norm] || TOUR_STEPS[tool];
  if (!steps || steps.length === 0) return;

  const mascot = customMascot || getMascot(TOOL_SPECIALISTS[norm] || TOOL_SPECIALISTS[tool] || "pomi");

  currentTour = { tool: norm, steps, mascot };
  currentStepIndex = 0;

  renderTourStep();
}

function renderTourStep() {
  if (!currentTour) return;
  const step = currentTour.steps[currentStepIndex];
  if (!step) {
    finishTour();
    return;
  }

  let overlay = document.getElementById("mascot-tour-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "mascot-tour-overlay";
    overlay.className = "mascot-tour-overlay";
    document.body.appendChild(overlay);
  }

  overlay.style.display = "block";

  // Target element calculation
  const targetEl = document.querySelector(step.target);
  let spotlightStyle = "";
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    const padding = 8;
    spotlightStyle = `
      top: ${Math.max(0, rect.top + window.scrollY - padding)}px;
      left: ${Math.max(0, rect.left + window.scrollX - padding)}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
    `;
  }

  overlay.innerHTML = `
    <div class="tour-backdrop"></div>
    ${targetEl ? `<div class="tour-spotlight-box" style="${spotlightStyle}"></div>` : ""}
    <div class="tour-card" id="tour-card">
      <div class="tour-card-header">
        <div class="tour-mascot-avatar">
          ${renderMascotSvg(currentTour.mascot.id, "idle", 64)}
        </div>
        <div class="tour-mascot-meta">
          <span class="tour-mascot-name">${escapeHtml(currentTour.mascot.name)}</span>
          <span class="tour-step-counter">Step ${currentStepIndex + 1} of ${currentTour.steps.length}</span>
        </div>
        <button class="tour-close-btn" id="tour-skip-btn" title="Exit Tour" aria-label="Exit tour">${getIcon("close", { size: 16 })}</button>
      </div>
      <h3 class="tour-step-title">${escapeHtml(step.title)}</h3>
      <p class="tour-step-body">${escapeHtml(step.body)}</p>
      <div class="tour-card-footer">
        <button class="tour-nav-btn secondary" id="tour-prev-btn" ${currentStepIndex === 0 ? "disabled" : ""}>
          ${getIcon("chevron-left", { size: 14 })} Previous
        </button>
        <button class="tour-nav-btn primary" id="tour-next-btn">
          ${currentStepIndex === currentTour.steps.length - 1 ? `Finish Tour ${getIcon("check", { size: 14 })}` : `Next Step ${getIcon("chevron-right", { size: 14 })}`}
        </button>
      </div>
    </div>
  `;

  overlay.querySelector("#tour-skip-btn")?.addEventListener("click", finishTour);
  overlay.querySelector("#tour-prev-btn")?.addEventListener("click", () => {
    if (currentStepIndex > 0) {
      currentStepIndex--;
      renderTourStep();
    }
  });
  overlay.querySelector("#tour-next-btn")?.addEventListener("click", () => {
    currentStepIndex++;
    if (currentStepIndex < currentTour.steps.length) {
      renderTourStep();
    } else {
      finishTour();
    }
  });
}

function finishTour() {
  const overlay = document.getElementById("mascot-tour-overlay");
  if (overlay) overlay.remove();

  if (currentTour) {
    markTourCompleted(currentTour.tool);
    currentTour = null;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
