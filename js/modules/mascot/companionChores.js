/**
 * companionChores.js — Interactive Companion Field Expeditions
 * Lets users assist each of the 5 outpost companions with their signature field duties.
 * Completing all 5 earns the prestigious Chrono Sovereign Sigil!
 * Zero emojis — 100% SVG icons & Web Audio synthesized feedback.
 * Zero modal flickering: persistent shell with surgical in-place DOM updates.
 */

"use strict";

import { renderMascotSvg } from "./mascotSprites.js";
import { getIcon } from "../../utils/icons.js";
import { gainGold, gainXp, equipItem, getHero, saveHero } from "../gamification/hero.js";
import { unlockAchievement } from "../achievements.js";
import { showSuccess, showInfo } from "../toast.js";

const CHORES_STORAGE_KEY = "pomidor.companionChores.solved";
const GRAND_REWARD_CLAIMED_KEY = "pomidor.companionChores.grandRewardClaimed";

function playChoreTone(freq = 600, type = "sine", duration = 0.1) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function getSolvedChores() {
  try {
    return JSON.parse(localStorage.getItem(CHORES_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function isChoreSolved(id) {
  return getSolvedChores().includes(id);
}

export function markChoreSolved(id) {
  const solved = getSolvedChores();
  if (!solved.includes(id)) {
    solved.push(id);
    localStorage.setItem(CHORES_STORAGE_KEY, JSON.stringify(solved));
    gainGold(15);
    gainXp(25);
    window.dispatchEvent(new CustomEvent("companion-chores-updated", { detail: { count: solved.length, total: 5 } }));
  }
}

export function isGrandRewardClaimed() {
  try {
    return localStorage.getItem(GRAND_REWARD_CLAIMED_KEY) === "true";
  } catch {
    return false;
  }
}

export function setGrandRewardClaimed(val = true) {
  try {
    localStorage.setItem(GRAND_REWARD_CLAIMED_KEY, val ? "true" : "false");
  } catch {}
}

export function resetChores() {
  localStorage.removeItem(CHORES_STORAGE_KEY);
  localStorage.removeItem(GRAND_REWARD_CLAIMED_KEY);
  window.dispatchEvent(new CustomEvent("companion-chores-updated", { detail: { count: 0, total: 5 } }));
}

export const CHORE_DATA = [
  {
    id: "pomi",
    name: "Pomi the Tomato",
    title: "Chrono Forge Guardian",
    accent: "#ef4444",
    taskName: "Prune Tangled Vines & Wind Spring",
    desc: "Distraction-vines are entangling the Chrono Forge bellows. Snip the 3 vine nodes, then wind the clockwork focus spring.",
    dialogue: "The vines of procrastination are tangling the forge rhythm! Help me sever them so the focus engine can tick smoothly!",
    solvedQuote: "Magnificent! The Chrono Forge bellows are pumping in perfect 25-minute harmonic cadence! +15g, +25 XP awarded!",
  },
  {
    id: "kip",
    name: "Kip the Cyber-Cat",
    title: "Agile Holo-Grid Hacker",
    accent: "#06b6d4",
    taskName: "Zap Glitch-Bugs & Splice Fiber",
    desc: "A swarm of holographic glitch-bugs is disrupting Kip's sprint telemetry. Zap all 3 bugs, then splice the fiber-optic uplink.",
    dialogue: "Hiss! Swarm detected across the task pipeline! These glitch-bugs are chewing through our velocity logs. Zap them before packet loss spikes!",
    solvedQuote: "Purr-fect precision! Data pipelines flowing with zero packet loss. Velocity telemetry is crystal clear!",
  },
  {
    id: "bolt",
    name: "Bolt the Clockwork Bot",
    title: "Precision Automaton & Data Auditor",
    accent: "#eab308",
    taskName: "Align Brass Cogs & Vent Pressure",
    desc: "Internal clockwork gears are out of phase and boiler pressure is rising. Lock all 3 spinning cogs, then release the steam valve.",
    dialogue: "Torque discrepancy alert! Cog misalignment at 47 degrees. Thermal friction increasing. Lock gears into synchronous phase immediately.",
    solvedQuote: "CLANK! Gears locked at 100.0% mechanical efficiency. Steam safely vented. System telemetry restored!",
  },
  {
    id: "pip",
    name: "Pip the Penguin",
    title: "Zen Arboretum Cultivator",
    accent: "#3b82f6",
    taskName: "Stack Frost Scrolls & Brew Elixir",
    desc: "A winter gust scattered encrypted knowledge scrolls across the snow. Catch all 3 drifting scrolls, then pour a fresh cold brew elixir.",
    dialogue: "A frost breeze blew through the archive gardens! Help me gather these drifting scrolls before they get buried under snow drifts.",
    solvedQuote: "Serene order restored to the arboretum. Take a soothing sip of cold brew. Inhale stillness... exhale distraction.",
  },
  {
    id: "chronos",
    name: "Chronos the Time Owl",
    title: "Keeper of the Astral Vault",
    accent: "#8b5cf6",
    taskName: "Harmonize Sun & Moon Astrolabe",
    desc: "The celestial calendar astrolabe is drifting from the stellar continuum. Rotate the dial until the sun and moon meet at the zenith.",
    dialogue: "Mortal traveler! The celestial continuum wavers. The solar and lunar dials have drifted. Guide them back into cosmic harmony!",
    solvedQuote: "By the ancient temporal archive! The astrolabe resonates with celestial starlight. Continuum balance is restored.",
  },
];

let modalEl = null;
let activeCompanionId = "pomi";
let shellBuilt = false;

export function initCompanionChores() {
  window.addEventListener("open-companion-chores", () => {
    openCompanionChoresModal();
  });
}

export function openCompanionChoresModal(companionId) {
  if (companionId && CHORE_DATA.some((c) => c.id === companionId)) {
    activeCompanionId = companionId;
  }
  ensureModal();
  renderWorkshop();
  modalEl.classList.add("open");
  playChoreTone(523, "triangle", 0.15); // C5
}

export function closeCompanionChoresModal() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
}

function ensureModal() {
  if (modalEl) return;
  modalEl = document.createElement("div");
  modalEl.id = "companion-chores-modal";
  modalEl.className = "companion-chores-modal";
  modalEl.setAttribute("role", "dialog");
  modalEl.setAttribute("aria-modal", "true");
  modalEl.setAttribute("aria-label", "Companion Field Expeditions");
  document.body.appendChild(modalEl);

  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl || e.target.classList.contains("chores-backdrop")) {
      closeCompanionChoresModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl?.classList.contains("open")) {
      closeCompanionChoresModal();
    }
  });
}

/**
 * Builds or updates the modal with ZERO full-tree teardowns to eliminate flickering.
 */
function renderWorkshop() {
  const solved = getSolvedChores();
  const allSolved = solved.length === 5;
  const grandClaimed = isGrandRewardClaimed();
  const currentChore = CHORE_DATA.find((c) => c.id === activeCompanionId) || CHORE_DATA[0];
  const isCurrentSolved = isChoreSolved(currentChore.id);

  // If shell hasn't been built or structure needs overhaul
  if (!shellBuilt || !modalEl.querySelector(".chores-dialog-card")) {
    buildModalShell();
    shellBuilt = true;
  }

  // Update progress banner in-place
  updateProgressBanner(solved, allSolved);

  const mainArea = modalEl.querySelector("#chores-main-interactive-area");
  if (!mainArea) return;

  if (allSolved && !grandClaimed) {
    mainArea.innerHTML = renderGrandRewardClaimStage();
    bindGrandRewardEvents();
  } else {
    // Render the squad tabs + stage card if not already structured
    if (!mainArea.querySelector(".chores-workspace-grid")) {
      mainArea.innerHTML = `
        <div class="chores-workspace-grid">
          <div class="chores-squad-tabs" id="chores-squad-tabs" role="tablist"></div>
          <div class="chore-stage-card" id="chore-stage-card"></div>
        </div>
      `;
    }

    renderSquadTabsInPlace(solved);
    renderStageCardInPlace(currentChore, isCurrentSolved);
  }

  // Update footer text in-place
  updateFooterInPlace(allSolved);
}

function buildModalShell() {
  modalEl.innerHTML = `
    <div class="chores-backdrop"></div>
    <div class="chores-dialog-card">
      <!-- Top Bar -->
      <div class="chores-card-header">
        <div class="chores-header-title-wrap">
          <span class="chores-pill-badge">
            ${getIcon("sparkles", { size: 13 })} <span>Companion Expeditions</span>
          </span>
          <h3 class="chores-main-title">Outpost Field Duties</h3>
        </div>
        <button class="chores-close-btn" id="close-chores-modal-btn" aria-label="Close Expeditions">
          ${getIcon("close", { size: 14 })}
        </button>
      </div>

      <!-- Squad Progress Header -->
      <div class="chores-progress-banner" id="chores-progress-banner">
        <div class="chores-progress-meta">
          <span class="chores-progress-label">Duties Completed:</span>
          <strong class="chores-progress-counter" id="chores-progress-counter">0 / 5</strong>
        </div>
        <div class="chores-tokens-row" id="chores-tokens-row"></div>
      </div>

      <!-- Main Interactive Stage Container -->
      <div id="chores-main-interactive-area"></div>

      <!-- Footer Bar -->
      <div class="chores-card-footer" id="chores-card-footer">
        <button class="chores-reset-btn" id="reset-chores-btn" title="Replay all companion expeditions">
          ${getIcon("refresh", { size: 13 })} Replay Expeditions
        </button>
        <div id="chores-footer-status-wrap"></div>
      </div>
    </div>
  `;

  modalEl.querySelector("#close-chores-modal-btn")?.addEventListener("click", closeCompanionChoresModal);
  modalEl.querySelector("#reset-chores-btn")?.addEventListener("click", () => {
    if (confirm("Reset expedition records so you can play through each duty again?")) {
      resetChores();
      renderWorkshop();
    }
  });
}

function updateProgressBanner(solved, allSolved) {
  const banner = modalEl.querySelector("#chores-progress-banner");
  const counter = modalEl.querySelector("#chores-progress-counter");
  const tokensRow = modalEl.querySelector("#chores-tokens-row");

  if (banner) {
    banner.classList.toggle("all-complete", allSolved);
  }
  if (counter) {
    counter.textContent = `${solved.length} / 5`;
  }
  if (tokensRow) {
    tokensRow.innerHTML = CHORE_DATA.map((c) => {
      const isDone = solved.includes(c.id);
      return `
        <div class="chore-token-slot ${isDone ? "solved" : ""}" title="${c.name}">
          <div class="token-mini-avatar" style="border-color: ${c.accent};">
            ${renderMascotSvg(c.id, "idle", 24)}
          </div>
          <span class="token-status-icon">
            ${isDone ? getIcon("check", { size: 12 }) : getIcon("play", { size: 10 })}
          </span>
        </div>
      `;
    }).join("");
  }
}

function renderSquadTabsInPlace(solved) {
  const tabsContainer = modalEl.querySelector("#chores-squad-tabs");
  if (!tabsContainer) return;

  tabsContainer.innerHTML = CHORE_DATA.map((c) => {
    const isDone = solved.includes(c.id);
    const isActive = c.id === activeCompanionId;
    return `
      <button
        class="chore-squad-tab ${isActive ? "active" : ""} ${isDone ? "done" : ""}"
        data-chore-companion="${c.id}"
        role="tab"
        aria-selected="${isActive ? "true" : "false"}"
      >
        <div class="tab-avatar-wrap">
          ${renderMascotSvg(c.id, "idle", 38)}
        </div>
        <div class="tab-meta">
          <strong class="tab-name">${c.name.split(" ")[0]}</strong>
          <span class="tab-status-text">${isDone ? "Duty Complete" : "Needs Assistance"}</span>
        </div>
        <span class="tab-check-mark">
          ${isDone ? getIcon("check", { size: 14 }) : ""}
        </span>
      </button>
    `;
  }).join("");

  tabsContainer.querySelectorAll(".chore-squad-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeCompanionId = tab.dataset.choreCompanion;
      playChoreTone(480, "sine", 0.08);
      // Update active class on tabs without re-rendering everything
      tabsContainer.querySelectorAll(".chore-squad-tab").forEach((t) => {
        const isCurrent = t.dataset.choreCompanion === activeCompanionId;
        t.classList.toggle("active", isCurrent);
        t.setAttribute("aria-selected", isCurrent ? "true" : "false");
      });
      const currentChore = CHORE_DATA.find((c) => c.id === activeCompanionId) || CHORE_DATA[0];
      const isCurrentSolved = isChoreSolved(currentChore.id);
      renderStageCardInPlace(currentChore, isCurrentSolved);
    });
  });
}

function renderStageCardInPlace(currentChore, isCurrentSolved) {
  const stageCard = modalEl.querySelector("#chore-stage-card");
  if (!stageCard) return;

  stageCard.style.setProperty("--chore-accent", currentChore.accent);
  stageCard.innerHTML = `
    <div class="chore-stage-header">
      <div class="chore-hero-badge" style="color: ${currentChore.accent};">
        ${getIcon("sparkles", { size: 14 })} <span>${currentChore.taskName}</span>
      </div>
      ${
        isCurrentSolved
          ? `<span class="chore-solved-badge">${getIcon("check", { size: 13 })} Completed</span>`
          : `<span class="chore-reward-hint">+15 Gold &amp; +25 XP</span>`
      }
    </div>

    <!-- Speech Bubble -->
    <div class="chore-dialogue-box">
      <p class="chore-quote">
        "${isCurrentSolved ? currentChore.solvedQuote : currentChore.dialogue}"
      </p>
    </div>

    <!-- Minigame Interactive Area -->
    <div class="chore-minigame-arena" id="chore-minigame-arena">
      ${renderMinigame(currentChore, isCurrentSolved)}
    </div>
  `;

  bindMinigameSpecificEvents(currentChore);
}

function renderMinigame(chore, isSolved) {
  if (isSolved) {
    return `
      <div class="chore-solved-view">
        <div class="chore-victory-avatar animate-bounce">
          ${renderMascotSvg(chore.id, "idle", 100)}
        </div>
        <h4>Expedition Duty Complete!</h4>
        <p>You helped ${chore.name} achieve peak outpost focus. You can replay the duty anytime.</p>
        <button class="chore-replay-btn" id="chore-replay-btn">
          ${getIcon("play", { size: 14 })} Replay Mini-Game
        </button>
      </div>
    `;
  }

  if (chore.id === "pomi") {
    return `
      <div class="minigame-pomi-arena">
        <div class="pomi-chore-mascot">
          ${renderMascotSvg("pomi", "idle", 90)}
          <!-- 3 Vine nodes overlay -->
          <button class="vine-node vine-1" id="pomi-vine-1" title="Snip vine node 1">1</button>
          <button class="vine-node vine-2" id="pomi-vine-2" title="Snip vine node 2">2</button>
          <button class="vine-node vine-3" id="pomi-vine-3" title="Snip vine node 3">3</button>
        </div>
        <div class="pomi-spring-control">
          <p class="minigame-instruction">1. Click the 3 tangled vine nodes.<br>2. Wind the Chrono Forge spring!</p>
          <button class="pomi-wind-btn" id="pomi-wind-btn" disabled>
            ${getIcon("refresh", { size: 16 })} <span>Wind Focus Spring</span>
          </button>
        </div>
      </div>
    `;
  }

  if (chore.id === "kip") {
    return `
      <div class="minigame-kip-arena">
        <div class="kip-terminal-box">
          <div class="terminal-screen" id="kip-terminal-screen">
            <span class="terminal-prompt">&gt; KIP_NET: SPRINT_GLITCH_SWARM</span>
            <button class="glitch-bug bug-1" id="kip-bug-1" title="Zap Glitch Bug 1">${getIcon("close", { size: 14 })}</button>
            <button class="glitch-bug bug-2" id="kip-bug-2" title="Zap Glitch Bug 2">${getIcon("close", { size: 14 })}</button>
            <button class="glitch-bug bug-3" id="kip-bug-3" title="Zap Glitch Bug 3">${getIcon("close", { size: 14 })}</button>
          </div>
          <div class="kip-cable-slot">
            <span class="minigame-instruction">Zap all 3 cyber-bugs, then splice the telemetry cable!</span>
            <button class="kip-splice-btn" id="kip-splice-btn" disabled>
              ${getIcon("sparkles", { size: 14 })} <span>Splice Fiber Cable</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  if (chore.id === "bolt") {
    return `
      <div class="minigame-bolt-arena">
        <div class="bolt-cogs-stage">
          <div class="gear-slot gear-1" id="bolt-gear-1" role="button" tabindex="0" title="Click to synchronize Cog 1">
            <div class="gear-wheel">${getIcon("refresh", { size: 36 })}</div>
            <span class="gear-status">Offset</span>
          </div>
          <div class="gear-slot gear-2" id="bolt-gear-2" role="button" tabindex="0" title="Click to synchronize Cog 2">
            <div class="gear-wheel">${getIcon("refresh", { size: 36 })}</div>
            <span class="gear-status">Offset</span>
          </div>
          <div class="gear-slot gear-3" id="bolt-gear-3" role="button" tabindex="0" title="Click to synchronize Cog 3">
            <div class="gear-wheel">${getIcon("refresh", { size: 36 })}</div>
            <span class="gear-status">Offset</span>
          </div>
        </div>
        <div class="bolt-pressure-valve">
          <span class="minigame-instruction">Lock all 3 gears into alignment, then vent boiler pressure!</span>
          <button class="bolt-steam-btn" id="bolt-steam-btn" disabled>
            ${getIcon("shield", { size: 14 })} <span>Release Steam Valve</span>
          </button>
        </div>
      </div>
    `;
  }

  if (chore.id === "pip") {
    return `
      <div class="minigame-pip-arena">
        <div class="pip-scroll-catcher" id="pip-scroll-catcher">
          <div class="falling-scroll scroll-1" id="pip-scroll-1" role="button" tabindex="0" title="Catch Knowledge Scroll 1">
            ${getIcon("book", { size: 18 })} <span>Scroll [[1]]</span>
          </div>
          <div class="falling-scroll scroll-2" id="pip-scroll-2" role="button" tabindex="0" title="Catch Knowledge Scroll 2">
            ${getIcon("book", { size: 18 })} <span>Scroll [[2]]</span>
          </div>
          <div class="falling-scroll scroll-3" id="pip-scroll-3" role="button" tabindex="0" title="Catch Knowledge Scroll 3">
            ${getIcon("book", { size: 18 })} <span>Scroll [[3]]</span>
          </div>
        </div>
        <div class="pip-brew-slot">
          <span class="minigame-instruction">Catch all 3 falling scrolls onto the shelf, then pour the elixir!</span>
          <button class="pip-pour-btn" id="pip-pour-btn" disabled>
            ${getIcon("sparkles", { size: 14 })} <span>Pour Cold Brew Elixir</span>
          </button>
        </div>
      </div>
    `;
  }

  // Chronos Astrolabe
  return `
    <div class="minigame-chronos-arena">
      <div class="astrolabe-dial-box">
        <div class="astrolabe-ring" id="astrolabe-ring">
          <div class="marker marker-sun">${getIcon("sparkles", { size: 20 })}</div>
          <div class="marker marker-moon">${getIcon("clock", { size: 20 })}</div>
          <div class="astrolabe-core-eye">${getIcon("calendar", { size: 24 })}</div>
        </div>
      </div>
      <div class="chronos-align-controls">
        <span class="minigame-instruction">Rotate the celestial dial until the sun and moon meet at the zenith!</span>
        <button class="chronos-rotate-btn" id="chronos-rotate-btn">
          ${getIcon("refresh", { size: 14 })} <span>Rotate Dial Phase (0%)</span>
        </button>
      </div>
    </div>
  `;
}

function bindMinigameSpecificEvents(chore) {
  // Replay minigame button
  modalEl.querySelector("#chore-replay-btn")?.addEventListener("click", () => {
    const solved = getSolvedChores().filter((id) => id !== activeCompanionId);
    localStorage.setItem(CHORES_STORAGE_KEY, JSON.stringify(solved));
    const currentChore = CHORE_DATA.find((c) => c.id === activeCompanionId) || CHORE_DATA[0];
    updateProgressBanner(solved, false);
    renderSquadTabsInPlace(solved);
    renderStageCardInPlace(currentChore, false);
    updateFooterInPlace(false);
  });

  if (chore.id === "pomi") {
    let vinesSnipped = 0;
    const windBtn = modalEl.querySelector("#pomi-wind-btn");
    [1, 2, 3].forEach((num) => {
      const node = modalEl.querySelector(`#pomi-vine-${num}`);
      node?.addEventListener("click", () => {
        if (node.classList.contains("snipped")) return;
        node.classList.add("snipped");
        node.textContent = "✓";
        vinesSnipped++;
        playChoreTone(500 + vinesSnipped * 100, "triangle", 0.1);
        if (vinesSnipped >= 3 && windBtn) {
          windBtn.disabled = false;
        }
      });
    });

    windBtn?.addEventListener("click", () => {
      playChoreTone(880, "sine", 0.2);
      markChoreSolved("pomi");
      showSuccess("Pomi's vines pruned and spring wound! +15g, +25 XP");
      onChoreCompletedInPlace("pomi");
    });
  }

  if (chore.id === "kip") {
    let bugsZapped = 0;
    const spliceBtn = modalEl.querySelector("#kip-splice-btn");
    [1, 2, 3].forEach((num) => {
      const bug = modalEl.querySelector(`#kip-bug-${num}`);
      bug?.addEventListener("click", () => {
        if (bug.classList.contains("zapped")) return;
        bug.classList.add("zapped");
        bugsZapped++;
        playChoreTone(700 + bugsZapped * 80, "square", 0.08);
        if (bugsZapped >= 3 && spliceBtn) {
          spliceBtn.disabled = false;
        }
      });
    });

    spliceBtn?.addEventListener("click", () => {
      playChoreTone(900, "sine", 0.2);
      markChoreSolved("kip");
      showSuccess("Kip's glitch-bugs purged and cable spliced! +15g, +25 XP");
      onChoreCompletedInPlace("kip");
    });
  }

  if (chore.id === "bolt") {
    let cogsAligned = 0;
    const steamBtn = modalEl.querySelector("#bolt-steam-btn");
    [1, 2, 3].forEach((num) => {
      const gear = modalEl.querySelector(`#bolt-gear-${num}`);
      gear?.addEventListener("click", () => {
        if (gear.classList.contains("aligned")) return;
        gear.classList.add("aligned");
        gear.querySelector(".gear-status").textContent = "Aligned";
        cogsAligned++;
        playChoreTone(400 + cogsAligned * 120, "triangle", 0.12);
        if (cogsAligned >= 3 && steamBtn) {
          steamBtn.disabled = false;
        }
      });
    });

    steamBtn?.addEventListener("click", () => {
      playChoreTone(750, "sine", 0.2);
      markChoreSolved("bolt");
      showSuccess("Bolt's cogs calibrated and steam released! +15g, +25 XP");
      onChoreCompletedInPlace("bolt");
    });
  }

  if (chore.id === "pip") {
    let scrollsCaught = 0;
    const pourBtn = modalEl.querySelector("#pip-pour-btn");
    [1, 2, 3].forEach((num) => {
      const scroll = modalEl.querySelector(`#pip-scroll-${num}`);
      scroll?.addEventListener("click", () => {
        if (scroll.classList.contains("caught")) return;
        scroll.classList.add("caught");
        scrollsCaught++;
        playChoreTone(520 + scrollsCaught * 90, "sine", 0.1);
        if (scrollsCaught >= 3 && pourBtn) {
          pourBtn.disabled = false;
        }
      });
    });

    pourBtn?.addEventListener("click", () => {
      playChoreTone(800, "sine", 0.2);
      markChoreSolved("pip");
      showSuccess("Pip's knowledge scrolls stacked and elixir poured! +15g, +25 XP");
      onChoreCompletedInPlace("pip");
    });
  }

  if (chore.id === "chronos") {
    let rotationPhase = 0;
    const rotateBtn = modalEl.querySelector("#chronos-rotate-btn");
    const ring = modalEl.querySelector("#astrolabe-ring");

    rotateBtn?.addEventListener("click", () => {
      rotationPhase += 25;
      if (ring) ring.style.transform = `rotate(${rotationPhase * 3.6}deg)`;
      const label = rotateBtn.querySelector("span");
      if (label) label.textContent = `Rotate Dial Phase (${rotationPhase}%)`;
      playChoreTone(400 + rotationPhase * 4, "sine", 0.08);

      if (rotationPhase >= 100) {
        rotateBtn.disabled = true;
        markChoreSolved("chronos");
        showSuccess("Chronos's celestial astrolabe aligned to the zenith! +15g, +25 XP");
        onChoreCompletedInPlace("chronos");
      }
    });
  }
}

/**
 * Updates stage in place upon minigame completion without wiping the DOM.
 */
function onChoreCompletedInPlace(choreId) {
  const solved = getSolvedChores();
  const allSolved = solved.length === 5;
  const currentChore = CHORE_DATA.find((c) => c.id === choreId) || CHORE_DATA[0];

  updateProgressBanner(solved, allSolved);
  renderSquadTabsInPlace(solved);

  if (allSolved && !isGrandRewardClaimed()) {
    setTimeout(() => {
      const mainArea = modalEl.querySelector("#chores-main-interactive-area");
      if (mainArea) {
        mainArea.innerHTML = renderGrandRewardClaimStage();
        bindGrandRewardEvents();
        updateFooterInPlace(allSolved);
      }
    }, 500);
  } else {
    renderStageCardInPlace(currentChore, true);
    updateFooterInPlace(allSolved);
  }
}

function updateFooterInPlace(allSolved) {
  const statusWrap = modalEl.querySelector("#chores-footer-status-wrap");
  if (!statusWrap) return;

  if (allSolved) {
    statusWrap.innerHTML = `
      <div class="chores-solved-all-badge">
        ${getIcon("shield", { size: 14 })} <span>All 5 Outpost Duties Fulfilled! Sovereign Sigil Unlocked</span>
      </div>
    `;
  } else {
    statusWrap.innerHTML = `
      <span class="chores-hint-text">
        ${getIcon("sparkles", { size: 12 })} Complete all 5 companion duties to forge the Sovereign Sigil!
      </span>
    `;
  }
}

function renderGrandRewardClaimStage() {
  return `
    <div class="chores-grand-celebration-card">
      <div class="grand-podium-header">
        <span class="grand-pill-badge">${getIcon("shield", { size: 14 })} EXPEDITION MASTERY REACHED</span>
        <h2>The Chrono Sovereign Sigil</h2>
        <p class="grand-subcopy">
          Tremendous achievement! You have fulfilled every outpost expedition alongside your 5 companions.
          Together, the squad has forged the ultimate emblem of focused mastery!
        </p>
      </div>

      <!-- Squad Victory Podium -->
      <div class="grand-squad-podium">
        <div class="podium-companion pod-1">${renderMascotSvg("kip", "idle", 55)}<span>Kip</span></div>
        <div class="podium-companion pod-2">${renderMascotSvg("bolt", "idle", 60)}<span>Bolt</span></div>
        <div class="podium-companion pod-center">${renderMascotSvg("pomi", "idle", 80)}<span>Pomi</span></div>
        <div class="podium-companion pod-4">${renderMascotSvg("chronos", "idle", 65)}<span>Chronos</span></div>
        <div class="podium-companion pod-5">${renderMascotSvg("pip", "idle", 55)}<span>Pip</span></div>
      </div>

      <!-- Reward Card -->
      <div class="sigil-loot-display">
        <div class="sigil-icon-ring">
          ${getIcon("shield", { size: 40 })}
        </div>
        <div class="sigil-loot-meta">
          <strong class="sigil-name">Chrono Sovereign Sigil</strong>
          <span class="sigil-rarity">Legendary Offhand Relic</span>
          <span class="sigil-perk">+50 Max HP, +15% XP &amp; Gold Bonus</span>
        </div>
      </div>

      <div class="grand-claim-actions">
        <button class="grand-claim-btn" id="claim-grand-easter-egg-btn">
          ${getIcon("sparkles", { size: 16 })} <span>Claim Rewards &amp; Sigil (+100g, +250 XP)</span>
        </button>
      </div>
    </div>
  `;
}

function bindGrandRewardEvents() {
  modalEl.querySelector("#claim-grand-easter-egg-btn")?.addEventListener("click", () => {
    setGrandRewardClaimed(true);
    gainGold(100);
    gainXp(250);
    const hero = getHero();
    if (hero && !hero.inventory.includes("o_chrono_sigil")) {
      hero.inventory.push("o_chrono_sigil");
      saveHero();
    }
    equipItem("o_chrono_sigil");
    unlockAchievement("choreMaster");
    triggerConfettiBurst();
    showSuccess("Expedition Master! The Chrono Sovereign Sigil has been equipped!");
    renderWorkshop();
  });
}

function triggerConfettiBurst() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 45; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}%`;
    el.style.backgroundColor = ["#ef4444", "#06b6d4", "#eab308", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"][i % 7];
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    el.style.animationDuration = `${1.2 + Math.random() * 0.8}s`;
    container.appendChild(el);
  }
  setTimeout(() => {
    container.innerHTML = "";
  }, 2800);
}
