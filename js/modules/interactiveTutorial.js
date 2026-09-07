/**
 * interactiveTutorial.js — Interactive Companion-Led Tutorial & Guided Walkthrough
 * Features 5 animated steps guided by your companion squad (Pomi, Kip, Bolt, Pip, Chronos)
 * in an instructive, educational, and delightfully snarky tone.
 * Zero emojis — 100% SVG icons & Web Audio synthesized feedback.
 */

"use strict";

import { renderMascotSvg } from "./mascot/mascotSprites.js";
import { getIcon } from "../utils/icons.js";
import { showSuccess } from "./toast.js";

const TUTORIAL_COMPLETED_KEY = "pomidor.interactiveTutorial.completed";

// Web Audio synthesizer for tactile haptic chimes (per cove skill)
function playTone(freq = 520, type = "sine", duration = 0.12) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

const STEPS = [
  {
    id: "focus",
    companionId: "pomi",
    companionName: "Pomi the Tomato",
    companionTitle: "Focus Master & Tough-Love General",
    tagline: "The Rhythm of Reality",
    badge: "Cadence & Combat",
    accentColor: "#ef4444",
    snarkyQuote: "Stop refreshing your tabs. Staring into the void won't ship your code, and doom-scrolling is not a 401(k) strategy. I'm a fruit with a leaf hat, and even I know: 25 minutes of unbroken focus, then you get a 5-minute break. Every sprint powers our Tactics party with AP. Press start before I turn into marinara.",
    lesson: "Work in dedicated 25-minute sprints separated by 5-minute recovery intervals. Rhythmic cycles keep dopamine high and mental fatigue low.",
    actionPrompt: "Charge Flow State Energy",
    actionLabel: "Tap to Charge Flow",
    actionSuccess: "Flow Energy charged to 100%! Ready for battle.",
    interactiveType: "charge-core",
  },
  {
    id: "tasks",
    companionId: "kip",
    companionName: "Kip the Cyber-Cat",
    companionTitle: "Agile Hacker & Bug Catcher",
    tagline: "Stop Hoarding Impossible Tasks",
    badge: "Tactical Slicing",
    accentColor: "#06b6d4",
    snarkyQuote: "Having a single to-do item labeled 'Fix My Entire Life' is peak human delusion. Cats know: you stalk one mouse at a time. Slice giant dread-inducing projects into bite-sized subtasks, set priorities, and cross them off cleanly. Plus, completing tasks deals direct combat damage to dungeon bosses. Claws out.",
    lesson: "Deconstruct intimidating goals into small, actionable subtasks. Each checkmark yields gold, hero experience, and combat strikes.",
    actionPrompt: "Slice Priority Objective",
    actionLabel: "Slice Demo Objective",
    actionSuccess: "+15 Gold & Critical Strike dealt to boss!",
    interactiveType: "slice-task",
  },
  {
    id: "kanban",
    companionId: "bolt",
    companionName: "Bolt the Clockwork Bot",
    companionTitle: "Precision Automaton & Data Auditor",
    tagline: "Feelings are Optional. Data is Forever.",
    badge: "WIP & Telemetry",
    accentColor: "#eab308",
    snarkyQuote: "BEEP-BOOP. Telemetry assessment: User claims to be 'working all day,' but sensor data reveals 43% cognitive leakage. Stop multitasking — humans lack parallel processing cores. Drag cards from Left to Right across the Kanban board, respect your WIP limits, and let the telemetry charts prove your worth.",
    lesson: "Limit Work In Progress (WIP) across Start Here, In Progress, and Done. Visual Kanban eliminates decision paralysis and tracks velocity.",
    actionPrompt: "Advance Kanban Card",
    actionLabel: "Move Card to Done",
    actionSuccess: "Card moved to Done! WIP limit cleared.",
    interactiveType: "advance-card",
  },
  {
    id: "vault",
    companionId: "pip",
    companionName: "Pip the Penguin",
    companionTitle: "Zen Navigator & Cold-Brew Realist",
    tagline: "Your Brain is Not an SSD",
    badge: "Offline Wisdom",
    accentColor: "#3b82f6",
    snarkyQuote: "Stop holding 87 chaotic ideas in your working memory like a browser with 200 tabs open. Write them down in our offline, private markdown Vault. Use [[wikilinks]] to connect thoughts. And when the break timer rings? Step away from the screen. Panicking doesn't make code compile faster. Breathe.",
    lesson: "Capture raw thoughts in a 100% offline, encrypted notes vault with bi-directional wikilinks. Rest is a performance weapon, not laziness.",
    actionPrompt: "Mindful Breath Sync",
    actionLabel: "Take Deep Breath",
    actionSuccess: "Mind centered. Heart rate normalized.",
    interactiveType: "mindful-breath",
  },
  {
    id: "calendar",
    companionId: "chronos",
    companionName: "Chronos the Time Owl",
    companionTitle: "Keeper of the Temporal Continuum",
    tagline: "Master Time or be Consumed by It",
    badge: "Temporal Sovereignty",
    accentColor: "#8b5cf6",
    snarkyQuote: "You weep that the hours slip through your fingers, yet you treat your calendar like a suggestion box. Sync your schedule with zero cloud surveillance. Audit your real focus minutes against your planned temporal blocks. Now go forth, mortal — you possess the tools, the party, and the rhythm. Become the version of yourself you keep talking about.",
    lesson: "Audit real focus output against planned schedule blocks. True mastery is the alignment of your intentions with your calendar.",
    actionPrompt: "Ascend & Graduate",
    actionLabel: "Ascend to Mastery",
    actionSuccess: "Congratulations! You have completed the Chrono Companion Walkthrough.",
    interactiveType: "graduate",
  },
];

let currentStep = 0;
let modalEl = null;

export function initInteractiveTutorial() {
  // Listen for custom trigger events from hero or buttons
  window.addEventListener("open-interactive-tutorial", (e) => {
    const step = e.detail?.step || 0;
    openInteractiveTutorial(step);
  });
}

export function openInteractiveTutorial(stepIndex = 0) {
  currentStep = Math.max(0, Math.min(stepIndex, STEPS.length - 1));
  ensureModal();
  renderStep();
  modalEl.classList.add("open");
  playTone(587, "triangle", 0.15); // D5 chime
  document.addEventListener("keydown", handleKeyNav);
}

export function closeInteractiveTutorial() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
  document.removeEventListener("keydown", handleKeyNav);
  try {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true");
  } catch {}
}

function handleKeyNav(e) {
  if (e.key === "Escape") {
    closeInteractiveTutorial();
  } else if (e.key === "ArrowRight") {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderStep();
      playTone(659, "sine", 0.08); // E5
    }
  } else if (e.key === "ArrowLeft") {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
      playTone(523, "sine", 0.08); // C5
    }
  }
}

function ensureModal() {
  if (modalEl) return;
  modalEl = document.createElement("div");
  modalEl.id = "chrono-interactive-tutorial-modal";
  modalEl.className = "chrono-tutorial-modal";
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  modalEl.setAttribute("aria-label", "Interactive Companion Tutorial");
  document.body.appendChild(modalEl);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl || e.target.classList.contains("tutorial-backdrop")) {
      closeInteractiveTutorial();
    }
  });
}

function renderStep() {
  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  modalEl.innerHTML = `
    <div class="tutorial-backdrop"></div>
    <div class="tutorial-dialog-card" style="--companion-accent: ${step.accentColor};">
      <!-- Top Stepper Bar -->
      <div class="tutorial-card-header">
        <div class="tutorial-step-badge">
          ${getIcon("sparkles", { size: 14 })}
          <span>Step ${currentStep + 1} of ${STEPS.length}: ${step.badge}</span>
        </div>
        <div class="tutorial-header-actions">
          <button class="tutorial-close-btn" id="tutorial-close-btn" title="Close tutorial" aria-label="Close tutorial">
            ${getIcon("close", { size: 14 })}
          </button>
        </div>
      </div>

      <!-- Step Progress Bar -->
      <div class="tutorial-progress-track">
        <div class="tutorial-progress-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <!-- Main Stage: Animated Companion Stage + Snarky Dialogue -->
      <div class="tutorial-stage-grid">
        <div class="tutorial-companion-column">
          <div class="tutorial-avatar-ring">
            <div class="tutorial-avatar-svg">
              ${renderMascotSvg(step.companionId, "idle", 110)}
            </div>
            <div class="tutorial-aura-glow"></div>
          </div>
          <div class="tutorial-companion-meta">
            <h4 class="companion-display-name">${step.companionName}</h4>
            <span class="companion-display-title">${step.companionTitle}</span>
          </div>
        </div>

        <div class="tutorial-dialogue-column">
          <div class="tutorial-dialogue-bubble">
            <div class="bubble-tagline">${step.tagline}</div>
            <p class="bubble-snarky-quote">"${step.snarkyQuote}"</p>
          </div>

          <div class="tutorial-educational-callout">
            <div class="callout-icon">${getIcon("book", { size: 16 })}</div>
            <div class="callout-text">
              <strong>Core Discipline:</strong> ${step.lesson}
            </div>
          </div>

          <!-- Interactive Action Widget -->
          <div class="tutorial-interactive-widget" id="tutorial-interactive-widget">
            ${renderInteractiveWidget(step)}
          </div>
        </div>
      </div>

      <!-- Card Footer Navigation -->
      <div class="tutorial-card-footer">
        <button class="tutorial-nav-btn secondary" id="tutorial-prev-btn" ${isFirst ? "disabled" : ""}>
          ${getIcon("chevron-left", { size: 14 })} Previous
        </button>

        <div class="tutorial-step-dots" role="tablist" aria-label="Tutorial Steps">
          ${STEPS.map((s, idx) => `
            <button
              class="tutorial-dot ${idx === currentStep ? "active" : ""} ${idx < currentStep ? "done" : ""}"
              data-step-idx="${idx}"
              title="${s.companionName} - ${s.tagline}"
              aria-label="Go to Step ${idx + 1}"
            ></button>
          `).join("")}
        </div>

        <button class="tutorial-nav-btn primary" id="tutorial-next-btn">
          ${isLast ? `Complete & Ascend ${getIcon("check", { size: 14 })}` : `Next Step ${getIcon("chevron-right", { size: 14 })}`}
        </button>
      </div>
    </div>
  `;

  bindStepEvents(step);
}

function renderInteractiveWidget(step) {
  if (step.interactiveType === "charge-core") {
    return `
      <div class="widget-action-box widget-charge-box">
        <div class="mini-core-dial" id="mini-core-dial">
          ${getIcon("tomato", { size: 28, className: "mini-tomato-spin" })}
        </div>
        <div class="widget-meta">
          <span class="widget-title">${step.actionPrompt}</span>
          <span class="widget-sub">Click to trigger flow resonance & sound feedback</span>
        </div>
        <button class="widget-interact-btn" id="widget-interact-btn">
          ${getIcon("play", { size: 14 })} ${step.actionLabel}
        </button>
      </div>
    `;
  }

  if (step.interactiveType === "slice-task") {
    return `
      <div class="widget-action-box widget-slice-box">
        <div class="demo-interactive-task" id="demo-interactive-task">
          <span class="task-demo-check">${getIcon("check", { size: 14 })}</span>
          <span class="task-demo-label">Refactor Dread-Inducing Monolith</span>
          <span class="task-demo-badge">+15g</span>
        </div>
        <button class="widget-interact-btn" id="widget-interact-btn">
          ${getIcon("check", { size: 14 })} ${step.actionLabel}
        </button>
      </div>
    `;
  }

  if (step.interactiveType === "advance-card") {
    return `
      <div class="widget-action-box widget-kanban-box">
        <div class="demo-kanban-lane">
          <span class="demo-lane-label">In Progress &rarr; Done</span>
          <div class="demo-mini-card" id="demo-mini-card">
            <span class="mini-card-text">WIP: Ship Polish</span>
            <span class="mini-card-status" id="mini-card-status">Active</span>
          </div>
        </div>
        <button class="widget-interact-btn" id="widget-interact-btn">
          ${getIcon("arrow-right", { size: 14 })} ${step.actionLabel}
        </button>
      </div>
    `;
  }

  if (step.interactiveType === "mindful-breath") {
    return `
      <div class="widget-action-box widget-breath-box">
        <div class="breath-pacer-circle" id="breath-pacer-circle">
          <span>Inhale</span>
        </div>
        <div class="widget-meta">
          <span class="widget-title">${step.actionPrompt}</span>
          <span class="widget-sub">Deep breath in... hold... and release</span>
        </div>
        <button class="widget-interact-btn" id="widget-interact-btn">
          ${getIcon("sparkles", { size: 14 })} ${step.actionLabel}
        </button>
      </div>
    `;
  }

  // Final step: Graduate
  return `
    <div class="widget-action-box widget-ascend-box">
      <div class="ascend-symbol">
        ${getIcon("shield", { size: 32 })}
      </div>
      <div class="widget-meta">
        <span class="widget-title">${step.actionPrompt}</span>
        <span class="widget-sub">Claim the Time Sovereign honorary title & join the squad</span>
      </div>
      <button class="widget-interact-btn ascend-btn" id="widget-interact-btn">
        ${getIcon("sparkles", { size: 14 })} ${step.actionLabel}
      </button>
    </div>
  `;
}

function bindStepEvents(step) {
  modalEl.querySelector("#tutorial-close-btn")?.addEventListener("click", closeInteractiveTutorial);

  // Prev / Next
  modalEl.querySelector("#tutorial-prev-btn")?.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
      playTone(440, "sine", 0.08);
    }
  });

  modalEl.querySelector("#tutorial-next-btn")?.addEventListener("click", () => {
    if (currentStep < STEPS.length - 1) {
      currentStep++;
      renderStep();
      playTone(587, "sine", 0.08);
    } else {
      triggerConfetti();
      showSuccess("Chrono Mastery achieved! Time is now your ally.");
      closeInteractiveTutorial();
    }
  });

  // Dots
  modalEl.querySelectorAll(".tutorial-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      currentStep = parseInt(dot.dataset.stepIdx, 10);
      renderStep();
      playTone(520, "sine", 0.08);
    });
  });

  // Interactive Action Button within Widget
  const actionBtn = modalEl.querySelector("#widget-interact-btn");
  actionBtn?.addEventListener("click", () => {
    playTone(784, "triangle", 0.15); // G5 chime

    if (step.interactiveType === "charge-core") {
      const dial = modalEl.querySelector("#mini-core-dial");
      dial?.classList.add("core-pulse");
      setTimeout(() => dial?.classList.remove("core-pulse"), 600);
      actionBtn.textContent = "Flow Maxed! +25%";
      actionBtn.disabled = true;
      showSuccess(step.actionSuccess);
    } else if (step.interactiveType === "slice-task") {
      const task = modalEl.querySelector("#demo-interactive-task");
      task?.classList.add("sliced");
      actionBtn.textContent = "Objective Cleared!";
      actionBtn.disabled = true;
      showSuccess(step.actionSuccess);
    } else if (step.interactiveType === "advance-card") {
      const card = modalEl.querySelector("#demo-mini-card");
      const status = modalEl.querySelector("#mini-card-status");
      card?.classList.add("moved-done");
      if (status) status.textContent = "Done!";
      actionBtn.textContent = "Moved to Done!";
      actionBtn.disabled = true;
      showSuccess(step.actionSuccess);
    } else if (step.interactiveType === "mindful-breath") {
      const circle = modalEl.querySelector("#breath-pacer-circle");
      circle?.classList.add("breath-expanded");
      actionBtn.textContent = "Tranquil Flow State";
      actionBtn.disabled = true;
      showSuccess(step.actionSuccess);
    } else if (step.interactiveType === "graduate") {
      triggerConfetti();
      actionBtn.textContent = "Sovereignty Unlocked!";
      actionBtn.disabled = true;
      showSuccess(step.actionSuccess);
    }
  });
}

function triggerConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 30; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}%`;
    el.style.backgroundColor = ["#ef4444", "#06b6d4", "#eab308", "#3b82f6", "#8b5cf6", "#10b981"][i % 6];
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    el.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
    container.appendChild(el);
  }
  setTimeout(() => {
    container.innerHTML = "";
  }, 2500);
}
