/**
 * heroBanner.js — Interactive Hero Component
 * Displays localized brand title, interactive mascot stage with custom interactions,
 * quick action launchpad, and 1-click language switcher. Zero emojis.
 */

"use strict";

import { t, getLang, setLang, getAppName, SUPPORTED_LANGUAGES } from "./i18n.js";
import { getCurrentMascot, triggerCustomInteraction } from "./mascot/companion.js";
import { renderMascotSvg } from "./mascot/mascotSprites.js";
import { getIcon } from "../utils/icons.js";

export function initHeroBanner() {
  const container = document.getElementById("interactive-hero-container");
  if (!container) return;

  renderHeroBanner(container);

  window.addEventListener("langchange", () => {
    renderHeroBanner(container);
  });
  window.addEventListener("mascotassignmentchange", () => {
    renderHeroBanner(container);
  });
  window.addEventListener("mascot-registered", () => {
    renderHeroBanner(container);
  });
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t("heroGreetingMorning");
  if (hour < 18) return t("heroGreetingAfternoon");
  return t("heroGreetingEvening");
}

export function renderHeroBanner(container) {
  const currentLang = getLang();
  const appName = getAppName();
  const tagline = t("appTagline");
  const mascot = getCurrentMascot();
  const greeting = getTimeGreeting();
  const interaction = mascot.customInteraction || {
    name: "Focus Cheer",
    description: "Boosts focus",
    badge: "+5 Focus XP",
  };

  container.innerHTML = `
    <section class="interactive-hero" aria-label="Interactive Hero Stage">
      <!-- Top Bar: Brand Badge & 1-Click Language Switcher -->
      <div class="hero-top-bar">
        <div class="hero-brand-wrap">
          <div class="hero-tomato-badge" aria-hidden="true">
            ${getIcon("tomato", { size: 28, className: "hero-tomato-svg" })}
          </div>
          <div class="hero-brand-titles">
            <h1 class="hero-app-title">${escapeHtml(appName)}</h1>
            <p class="hero-app-tagline">${escapeHtml(tagline)}</p>
          </div>
        </div>

        <div class="hero-lang-pills" role="radiogroup" aria-label="Quick Language Switcher">
          ${SUPPORTED_LANGUAGES.map(
            (lang) => `
            <button
              class="hero-lang-pill ${currentLang === lang.code ? "active" : ""}"
              data-lang-code="${lang.code}"
              title="${escapeHtml(lang.label)} — ${escapeHtml(lang.appName)}"
              aria-label="Switch to ${escapeHtml(lang.label)}"
              role="radio"
              aria-checked="${currentLang === lang.code ? "true" : "false"}"
            >
              ${lang.code.toUpperCase()}
            </button>
          `,
          ).join("")}
        </div>
      </div>

      <!-- Center Stage: Interactive Mascot & Speech Bubble -->
      <div class="hero-mascot-stage-row">
        <div class="hero-mascot-speech" id="hero-mascot-speech">
          <div class="hero-speech-header">
            <span class="hero-mascot-name-badge" style="color: ${mascot.palette.primary}; border-color: ${mascot.palette.primary};">
              ${escapeHtml(mascot.name)}
            </span>
            <span class="hero-interaction-pill">
              ${getIcon("sparkles", { size: 12 })} ${escapeHtml(interaction.badge)}
            </span>
          </div>
          <p class="hero-speech-body">${escapeHtml(greeting)}</p>
          <div class="hero-speech-sub">${escapeHtml(interaction.speech)}</div>
        </div>

        <div
          class="hero-mascot-avatar-box"
          id="hero-mascot-avatar-box"
          role="button"
          tabindex="0"
          title="Click ${escapeHtml(mascot.name)} for signature ${escapeHtml(interaction.name)} boost!"
          aria-label="${escapeHtml(mascot.name)} - Click for interactive boost"
        >
          <div class="hero-avatar-svg-wrap">
            ${renderMascotSvg(mascot.id, "idle", 120)}
          </div>
          <div class="hero-pulse-ring"></div>
        </div>
      </div>

      <!-- Action Launchpad Cards (100% SVG, Zero Emojis) -->
      <div class="hero-action-grid">
        <button class="hero-action-card sprint-card" id="hero-action-sprint">
          <div class="hero-card-icon sprint-icon">
            ${getIcon("play", { size: 20 })}
          </div>
          <div class="hero-card-content">
            <strong class="hero-card-title">${escapeHtml(t("heroQuickSprint"))}</strong>
            <span class="hero-card-sub">${escapeHtml(t("heroQuickSprintSub"))}</span>
          </div>
        </button>

        <button class="hero-action-card tactics-card" id="hero-action-tactics">
          <div class="hero-card-icon tactics-icon">
            ${getIcon("shield", { size: 20 })}
          </div>
          <div class="hero-card-content">
            <strong class="hero-card-title">${escapeHtml(t("heroTacticsLaunch"))}</strong>
            <span class="hero-card-sub">${escapeHtml(t("heroTacticsLaunchSub"))}</span>
          </div>
        </button>

        <button class="hero-action-card quests-card" id="hero-action-quests">
          <div class="hero-card-icon quests-icon">
            ${getIcon("check", { size: 20 })}
          </div>
          <div class="hero-card-content">
            <strong class="hero-card-title">${escapeHtml(t("heroQuestsLaunch"))}</strong>
            <span class="hero-card-sub">${escapeHtml(t("heroQuestsLaunchSub"))}</span>
          </div>
        </button>

        <button class="hero-action-card guide-card" id="hero-action-guide">
          <div class="hero-card-icon guide-icon">
            ${getIcon("book", { size: 20 })}
          </div>
          <div class="hero-card-content">
            <strong class="hero-card-title">${escapeHtml(t("heroGuideLaunch"))}</strong>
            <span class="hero-card-sub">${escapeHtml(t("heroGuideLaunchSub"))}</span>
          </div>
        </button>
      </div>
    </section>
  `;

  bindHeroEvents(container);
}

function bindHeroEvents(container) {
  // 1-Click Language Switcher
  container.querySelectorAll(".hero-lang-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const code = pill.dataset.langCode;
      if (code) {
        setLang(code);
      }
    });
  });

  // Mascot Click -> Signature Custom Interaction
  const mascotBox = container.querySelector("#hero-mascot-avatar-box");
  const triggerMascot = () => {
    mascotBox.classList.add("hero-avatar-bounce");
    setTimeout(() => mascotBox.classList.remove("hero-avatar-bounce"), 600);
    triggerCustomInteraction();
  };
  mascotBox?.addEventListener("click", triggerMascot);
  mascotBox?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerMascot();
    }
  });

  // Quick Focus Sprint Button
  container.querySelector("#hero-action-sprint")?.addEventListener("click", () => {
    const timerEl = document.getElementById("session-progress") || document.getElementById("timer-classic");
    if (timerEl) {
      timerEl.scrollIntoView({ behavior: "smooth", block: "center" });
      timerEl.classList.add("highlight-timer-pulse");
      setTimeout(() => timerEl.classList.remove("highlight-timer-pulse"), 1200);
    }
  });

  // Tactics Launch Button
  container.querySelector("#hero-action-tactics")?.addEventListener("click", () => {
    const tacticsBtn = document.querySelector("[data-view='tactics']");
    if (tacticsBtn) tacticsBtn.click();
  });

  // Quests Launch Button
  container.querySelector("#hero-action-quests")?.addEventListener("click", () => {
    const todoBtn = document.querySelector("[data-view='list']");
    if (todoBtn) todoBtn.click();
  });

  // Technique Guide Modal Button
  container.querySelector("#hero-action-guide")?.addEventListener("click", () => {
    openTechniqueGuideModal();
  });
}

export function openTechniqueGuideModal() {
  let modal = document.getElementById("technique-guide-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "technique-guide-modal";
    modal.className = "technique-guide-modal-backdrop";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="technique-guide-dialog" role="dialog" aria-labelledby="guide-modal-title" aria-modal="true">
      <div class="guide-dialog-header">
        <div class="guide-dialog-title-wrap">
          <span class="guide-tomato-icon">${getIcon("tomato", { size: 24 })}</span>
          <h2 id="guide-modal-title">${escapeHtml(t("guideTitle"))}</h2>
        </div>
        <button class="guide-close-btn" id="close-technique-guide-btn" aria-label="${escapeHtml(t("closeGuide"))}">
          ${getIcon("close", { size: 18 })}
        </button>
      </div>

      <div class="guide-dialog-body">
        <section class="guide-section">
          <h3>${escapeHtml(t("whatIsPomodoro"))}</h3>
          <p>${escapeHtml(t("whatIsPomodoroDesc"))}</p>
          <div class="guide-origins-box">
            <p>
              Created by <a href="https://francescocirillo.com" target="_blank" rel="noopener noreferrer">Francesco Cirillo</a>.
              Learn more on the <a href="https://en.wikipedia.org/wiki/Pomodoro_Technique" target="_blank" rel="noopener noreferrer">Wikipedia Pomodoro Technique</a> page.
            </p>
          </div>
        </section>

        <section class="guide-section">
          <h3>${escapeHtml(t("howToUse"))}</h3>
          <ol class="guide-steps-list">
            <li>${escapeHtml(t("step1"))}</li>
            <li>${escapeHtml(t("step2"))}</li>
            <li>${escapeHtml(t("step3"))}</li>
            <li>${escapeHtml(t("step4"))}</li>
            <li>${escapeHtml(t("step5"))}</li>
            <li>${escapeHtml(t("step6"))}</li>
            <li>${escapeHtml(t("step7"))}</li>
            <li>${escapeHtml(t("step8"))}</li>
          </ol>
        </section>

        <section class="guide-section video-section">
          <h3>${escapeHtml(t("videoTitle"))}</h3>
          <p class="guide-video-desc">${escapeHtml(t("videoDesc"))}</p>
          <div class="guide-video-embed">
            <iframe
              width="100%"
              height="315"
              src="https://www.youtube-nocookie.com/embed/dTQDaUQ9MAU?si=JI44Y5eX-faXKZGs"
              title="Brain Training to Beat Procrastination | Barbara Oakley"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
          </div>
        </section>
      </div>

      <div class="guide-dialog-footer">
        <button class="button guide-done-btn" id="finish-technique-guide-btn">
          ${getIcon("check", { size: 15 })} ${escapeHtml(t("closeGuide"))}
        </button>
      </div>
    </div>
  `;

  modal.style.display = "flex";

  modal.querySelector("#close-technique-guide-btn")?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.querySelector("#finish-technique-guide-btn")?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
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
