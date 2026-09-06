/**
 * onboardingTour.js — Interactive Spotlight Guided Tours
 * Fixed scroll coordinate tracking and tutorial sample data clearing. Zero emojis.
 */

"use strict";

import { renderMascotSvg } from "./mascotSprites.js";
import { getIcon } from "../../utils/icons.js";
import { showSuccess } from "../toast.js";

const TOURS = {
  pomodoro: {
    tool: "pomodoro",
    title: "Focus Timer Tour",
    mascot: { id: "pomi", name: "Pomi the Tomato" },
    steps: [
      {
        target: "#session-progress, #timer-classic",
        title: "The Heart of Focus: Pomodoro Timer",
        body: "Work in dedicated 25-minute sprints separated by 5-minute restorative breaks. This rhythmic pacing preserves mental clarity.",
      },
      {
        target: "#pomodoro-actions, .timer-btn-primary, #start",
        title: "One-Click Controls",
        body: "Start, pause, skip, or reset your sessions with instant keyboard shortcuts or these quick buttons.",
      },
      {
        target: "#theme-toggle, .settings-controls",
        title: "Ambient Focus & Focus Mode",
        body: "Toggle dark mode, ambient soundscapes, or press 'F' to enter an immersive fullscreen focus experience.",
      },
    ],
  },
  todo: {
    tool: "todo",
    title: "Tasks & To-Do Tour",
    mascot: { id: "kip", name: "Kip the Cyber-Cat" },
    steps: [
      {
        target: "#todo-controls, .todo-header",
        title: "Task Slicing & Priorities",
        body: "Add tasks, assign High/Medium/Low priority, set due dates, and estimate your Pomodoro tomatoes.",
      },
      {
        target: "#task-list-container, .task-list",
        title: "Subtasks & Checklists",
        body: "Break down complex objectives into manageable subtasks. Complete them to earn Hero XP and damage bosses!",
      },
    ],
  },
  kanban: {
    tool: "kanban",
    title: "Visual Kanban Tour",
    mascot: { id: "bolt", name: "Bolt the Clockwork Bot" },
    steps: [
      {
        target: "#kanban-container, .kanban-board",
        title: "Visual Workflow & WIP Limits",
        body: "Drag cards between Start Here, In Progress, and Done to keep tasks moving swiftly without bottlenecks.",
      },
    ],
  },
  vault: {
    tool: "vault",
    title: "Notes Vault Tour",
    mascot: { id: "pip", name: "Pip the Penguin" },
    steps: [
      {
        target: "#vault-container, .vault-wrapper",
        title: "Markdown & Connected Knowledge",
        body: "Create private offline notes, organize with tags, and link concepts together using [[wikilinks]].",
      },
    ],
  },
  calendar: {
    tool: "calendar",
    title: "Calendar & Time Audit Tour",
    mascot: { id: "chronos", name: "Chronos the Time Owl" },
    steps: [
      {
        target: "#calendar-container, .calendar-section",
        title: "Temporal Auditing & Schedules",
        body: "Visualize deadlines and sync Google Calendar read-only. Audit your focus minutes against planned blocks.",
      },
    ],
  },
  stats: {
    tool: "stats",
    title: "Productivity Stats Tour",
    mascot: { id: "bolt", name: "Bolt the Clockwork Bot" },
    steps: [
      {
        target: "#stats-container, .stats-overview",
        title: "Productivity Telemetry",
        body: "Review completed tomatoes, daily streaks, activity heatmaps, and bandwidth accounting.",
      },
    ],
  },
  tactics: {
    tool: "tactics",
    title: "Tactics & Pets Tour",
    mascot: { id: "pomi", name: "Pomi the Tomato" },
    steps: [
      {
        target: "#tactics-container, .tactics-arena",
        title: "Turn-Based 7x7 Grid Combat",
        body: "Lead your Hero and Pet Companions across tactical terrain, spend Action Points, and conquer dungeons!",
      },
    ],
  },
};

const COMPLETED_TOURS_KEY = "pomidor.onboarding.completed";

let currentTour = null;
let currentStepIndex = 0;
let scrollTrackingInterval = null;

function isTourCompleted(tool) {
  try {
    const list = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || "[]");
    return list.includes(tool);
  } catch {
    return false;
  }
}

export function markTourCompleted(tool) {
  try {
    const list = JSON.parse(localStorage.getItem(COMPLETED_TOURS_KEY) || "[]");
    if (!list.includes(tool)) {
      list.push(tool);
      localStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function resetAllTours() {
  localStorage.removeItem(COMPLETED_TOURS_KEY);
  localStorage.removeItem("pomodoro.tutorialListDone");
  localStorage.removeItem("pomidor.kanban.tutorialDone");
}

export const restartAllTours = resetAllTours;

export function clearExperienceTutorialData(tool) {
  try {
    if (tool === "todo" || tool === "list") {
      const savedLists = JSON.parse(localStorage.getItem("pomodoro-todo-lists") || "[]");
      const filtered = savedLists.filter(l => l.name !== "Getting Started");
      localStorage.setItem("pomodoro-todo-lists", JSON.stringify(filtered));
      localStorage.setItem("pomodoro.tutorialListDone", "done");
      window.dispatchEvent(new CustomEvent("todo-data-cleared"));
    } else if (tool === "kanban") {
      localStorage.removeItem("pomidor.kanban");
      localStorage.setItem("pomidor.kanban.tutorialDone", "done");
      window.dispatchEvent(new CustomEvent("kanban-data-cleared"));
    } else if (tool === "vault") {
      const vaultData = JSON.parse(localStorage.getItem("pomidor.vault") || "{}");
      if (vaultData.notes) {
        vaultData.notes = vaultData.notes.filter(n => !n.title.toLowerCase().includes("getting started") && !n.title.toLowerCase().includes("tutorial"));
        localStorage.setItem("pomidor.vault", JSON.stringify(vaultData));
        window.dispatchEvent(new CustomEvent("vault-data-cleared"));
      }
    }
    showSuccess("Tutorial sample data cleared! Fresh slate ready.");
  } catch (e) {
    console.warn("Could not clear tutorial data:", e);
  }
}

export function startTourForCurrentTool(tool, forcedMascot = null) {
  const norm = tool === "list" ? "todo" : tool;
  const tour = TOURS[norm];
  if (!tour) return;

  currentTour = { ...tour };
  if (forcedMascot) {
    currentTour.mascot = forcedMascot;
  }
  currentStepIndex = 0;

  renderTourStep();
}

function updateSpotlightPosition() {
  const overlay = document.getElementById("mascot-tour-overlay");
  if (!overlay || !currentTour) return;
  const step = currentTour.steps[currentStepIndex];
  if (!step) return;

  const targetEl = document.querySelector(step.target);
  const spotlightBox = overlay.querySelector(".tour-spotlight-box");
  if (!targetEl || !spotlightBox) return;

  // Crucial fix: Overlay is position: fixed (viewport coordinates).
  // Do NOT add window.scrollY / window.scrollX!
  const rect = targetEl.getBoundingClientRect();
  const padding = 8;
  spotlightBox.style.top = `${Math.max(0, rect.top - padding)}px`;
  spotlightBox.style.left = `${Math.max(0, rect.left - padding)}px`;
  spotlightBox.style.width = `${rect.width + padding * 2}px`;
  spotlightBox.style.height = `${rect.height + padding * 2}px`;
}

function renderTourStep() {
  const step = currentTour.steps[currentStepIndex];
  if (!step) return finishTour();

  let overlay = document.getElementById("mascot-tour-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "mascot-tour-overlay";
    overlay.className = "mascot-tour-overlay";
    document.body.appendChild(overlay);
  }

  overlay.style.display = "block";

  const targetEl = document.querySelector(step.target);
  let spotlightStyle = "";
  if (targetEl) {
    // Scroll element into view safely
    targetEl.scrollIntoView({ behavior: "auto", block: "center" });

    const rect = targetEl.getBoundingClientRect();
    const padding = 8;
    // Pure viewport coordinates for position:fixed container
    spotlightStyle = `
      top: ${Math.max(0, rect.top - padding)}px;
      left: ${Math.max(0, rect.left - padding)}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
    `;
  }

  const isLastStep = currentStepIndex === currentTour.steps.length - 1;

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
        <button class="tour-skip-btn" id="tour-skip-btn" title="End tour" aria-label="End tour">
          ${getIcon("close", { size: 14 })}
        </button>
      </div>

      <div class="tour-step-content">
        <h3 class="tour-step-title">${escapeHtml(step.title)}</h3>
        <p class="tour-step-body">${escapeHtml(step.body)}</p>
      </div>

      ${
        isLastStep
          ? `
        <div class="tour-demo-data-prompt">
          <div class="demo-prompt-text">
            ${getIcon("database", { size: 14 })}
            <span>Ready to start fresh? You can clear tutorial demo data now or anytime from Settings.</span>
          </div>
          <button class="tour-clear-sample-btn" id="tour-clear-sample-btn">
            ${getIcon("trash", { size: 13 })} Clear Tutorial Sample Data
          </button>
        </div>
      `
          : ""
      }

      <div class="tour-card-footer">
        <button class="tour-nav-btn secondary" id="tour-prev-btn" ${currentStepIndex === 0 ? "disabled" : ""}>
          ${getIcon("chevron-left", { size: 14 })} Previous
        </button>
        <button class="tour-nav-btn primary" id="tour-next-btn">
          ${isLastStep ? `Finish Tour ${getIcon("check", { size: 14 })}` : `Next Step ${getIcon("chevron-right", { size: 14 })}`}
        </button>
      </div>
    </div>
  `;

  // Attach live scroll and resize listeners for rock-solid tracking
  window.removeEventListener("scroll", updateSpotlightPosition, true);
  window.removeEventListener("resize", updateSpotlightPosition);
  window.addEventListener("scroll", updateSpotlightPosition, { passive: true, capture: true });
  window.addEventListener("resize", updateSpotlightPosition, { passive: true });

  // Continuously track for 600ms while smooth scroll completes
  if (scrollTrackingInterval) clearInterval(scrollTrackingInterval);
  let frames = 0;
  scrollTrackingInterval = setInterval(() => {
    updateSpotlightPosition();
    frames++;
    if (frames > 20) clearInterval(scrollTrackingInterval);
  }, 30);

  overlay.querySelector("#tour-skip-btn")?.addEventListener("click", finishTour);
  overlay.querySelector("#tour-clear-sample-btn")?.addEventListener("click", () => {
    clearExperienceTutorialData(currentTour.tool);
  });

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

  window.removeEventListener("scroll", updateSpotlightPosition, true);
  window.removeEventListener("scroll", updateSpotlightPosition);
  window.removeEventListener("resize", updateSpotlightPosition);
  if (scrollTrackingInterval) clearInterval(scrollTrackingInterval);

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
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
