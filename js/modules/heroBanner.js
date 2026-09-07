/**
 * heroBanner.js — Interactive Hero Component & Living Outpost Character Carousel
 * Displays localized brand title, 1-click language switcher,
 * massive animated living diorama & interactive realm carousel with real-time character locomotion,
 * interactive companion stage, and quick launchpad action cards. Zero emojis.
 */

"use strict";

import { t, getLang, setLang, getAppName, SUPPORTED_LANGUAGES } from "./i18n.js";
import { getCurrentMascot, triggerCustomInteraction } from "./mascot/companion.js";
import { renderMascotSvg } from "./mascot/mascotSprites.js";
import { renderJobSprite } from "./gamification/characterSprites.js";
import { getIcon } from "../utils/icons.js";
import { openInteractiveTutorial } from "./interactiveTutorial.js";
import { openCompanionChoresModal, getSolvedChores } from "./mascot/companionChores.js";
import { toggleHeatmapOverlay } from "./telemetry/telemetryUi.js";

const SHOWCASE_STORAGE_KEY = "pomidor.heroShowcase.dismissed";
const MARKETING_STORAGE_KEY = "pomidor.marketingHero.dismissed";
const OUTPOST_MODE_KEY = "pomidor.outpost.viewMode";

let focusEnergy = 25;
let currentDioramaJob = "knight";
let activeRealmIndex = 0;
let outpostMode = "panoramic";

try {
  outpostMode = localStorage.getItem(OUTPOST_MODE_KEY) || "panoramic";
} catch {
  outpostMode = "panoramic";
}

function playOutpostTone(freq = 440, type = "sine", duration = 0.15) {
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

function spawnFloatingToast(targetEl, text, color = "#ef4444") {
  if (!targetEl) return;
  const toast = document.createElement("div");
  toast.className = "outpost-floating-toast";
  toast.textContent = text;
  toast.style.color = color;
  targetEl.appendChild(toast);
  setTimeout(() => toast.remove(), 1000);
}

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
  window.addEventListener("companion-chores-updated", () => {
    renderHeroBanner(container);
  });
  window.addEventListener("brand-logo-changed", () => {
    renderHeroBanner(container);
  });
}

export function getBrandLogoPath(style, lang) {
  const isRu = lang === "ru";
  if (style === "soviet") {
    return `icons/brand/variants/pomidor_soviet_${isRu ? "ru" : "en"}.svg`;
  }
  if (style === "edgy") {
    return `icons/brand/variants/pomidor_edgy_${isRu ? "ru" : "en"}.svg`;
  }
  if (style === "lighthearted") {
    return `icons/brand/variants/pomidor_lighthearted_${isRu ? "ru" : "en"}.svg`;
  }
  return `icons/brand/variants/pomidor_modern_${isRu ? "ru" : "en"}.svg`;
}

export function getBrandStyleDisplayName(style) {
  const map = {
    modern: t("brandStyleModern", "Sleek Modern"),
    soviet: t("brandStyleSoviet", "Soviet Constructivist"),
    edgy: t("brandStyleEdgy", "Edgy & Dark"),
    lighthearted: t("brandStyleLighthearted", "Lighthearted & Playful"),
  };
  return map[style] || map.modern;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return t("heroGreetingMorning");
  if (hour < 18) return t("heroGreetingAfternoon");
  return t("heroGreetingEvening");
}

function isShowcaseDismissed() {
  try {
    return localStorage.getItem(SHOWCASE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setShowcaseDismissed(dismissed) {
  try {
    localStorage.setItem(SHOWCASE_STORAGE_KEY, dismissed ? "true" : "false");
  } catch {}
}

function isMarketingDismissed() {
  try {
    return localStorage.getItem(MARKETING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function setMarketingDismissed(dismissed) {
  try {
    localStorage.setItem(MARKETING_STORAGE_KEY, dismissed ? "true" : "false");
  } catch {}
}

export const REALM_DEFINITIONS = [
  {
    id: "forge",
    cardId: "showcase-card-focus",
    nameKey: "realmChronoForge",
    fallbackName: "The Chrono Forge",
    stageClass: "stage-chrono-forge",
    accent: "#ef4444",
    lead: "Pomi & Bolt",
    lore: "Rhythmic 25-minute bellows forging. Ticking clockwork gears convert focus into forged momentum.",
    actionLabel: "Enter Chrono Forge (Timer)",
    actionTarget: "timer",
  },
  {
    id: "grid",
    cardId: "showcase-card-tasks",
    nameKey: "realmHoloGrid",
    fallbackName: "Agile Holo-Grid",
    stageClass: "stage-holo-grid",
    accent: "#06b6d4",
    lead: "Kip the Cyber-Cat",
    lore: "Streaming Kanban cyber-pipelines. Kip patrols the grid, slicing distraction glitch-bugs with neon claws.",
    actionLabel: "Launch Holo-Grid (Kanban)",
    actionTarget: "kanban",
  },
  {
    id: "astral",
    cardId: "showcase-card-vault",
    nameKey: "realmAstralVault",
    fallbackName: "Astral Archives",
    stageClass: "stage-astral-vault",
    accent: "#8b5cf6",
    lead: "Chronos the Time Owl",
    lore: "Celestial orrery rings chart temporal wisdom. Chronos levitates with ancient markdown scrolls & encrypted runes.",
    actionLabel: "Consult Astral Archives (Vault)",
    actionTarget: "vault",
  },
  {
    id: "arboretum",
    cardId: "showcase-card-habits",
    nameKey: "realmZenArboretum",
    fallbackName: "Zen Arboretum",
    stageClass: "stage-zen-arboretum",
    accent: "#10b981",
    lead: "Pip the Penguin",
    lore: "Tranquil habit conservatory. Pip tends golden streak seedlings, pouring cold brew elixirs to bloom daily routines.",
    actionLabel: "Cultivate Arboretum (Habits)",
    actionTarget: "habits",
  },
  {
    id: "rampart",
    cardId: "showcase-card-tactics",
    nameKey: "realmTacticsRampart",
    fallbackName: "Tactics Rampart",
    stageClass: "stage-tactics-rampart",
    accent: "#3b82f6",
    lead: "Chrono Knight & Mages",
    lore: "Tactical battlements. Heroes spar on training dummies, charging party Limit Breaks for arena battles.",
    actionLabel: "Enter Tactics Rampart (Arena)",
    actionTarget: "tactics",
  },
];

export function renderHeroBanner(container) {
  const currentLang = getLang();
  const appName = getAppName();
  const tagline = t("appTagline");
  const mascot = getCurrentMascot();
  const greeting = getTimeGreeting();
  const interaction = mascot?.customInteraction || {
    name: "Focus Cheer",
    description: "Boosts morale",
    speech: "Let's conquer time together!",
    badge: "+5 Focus XP",
  };
  const isDismissed = isShowcaseDismissed();
  const isMarketingHidden = isMarketingDismissed();
  const choresSolved = getSolvedChores().length;

  const currentBrandStyle = localStorage.getItem("pomidor_brand_logo_style") || "modern";
  const brandLogoSrc = getBrandLogoPath(currentBrandStyle, currentLang);

  container.innerHTML = `
    <section class="interactive-hero" aria-label="Interactive Hero Stage">
      <!-- Premium Marketing Copy Hero (Dismissible) -->
      ${
        !isMarketingHidden
          ? `
        <div class="marketing-hero-outer" id="marketing-hero-banner">
          <div class="marketing-hero-inner">
            <div class="marketing-header-row">
              <span class="marketing-eyebrow-pill">
                ${getIcon("sparkles", { size: 12 })}
                <span>${escapeHtml(t("marketingEyebrow", "The Chrono Productivity System"))}</span>
              </span>
              <div class="marketing-header-actions">
                <button class="marketing-style-switcher-btn" id="marketing-brand-cycle-btn" title="Cycle Logo Style" aria-label="Cycle Logo Style">
                  <svg class="svg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  <span id="marketing-brand-style-label">${escapeHtml(getBrandStyleDisplayName(currentBrandStyle))}</span>
                </button>
                <button class="marketing-dismiss-btn" id="dismiss-marketing-hero-btn" title="${escapeHtml(t("marketingDismiss", "Hide Banner"))}" aria-label="${escapeHtml(t("marketingDismiss", "Hide Banner"))}">
                  ${getIcon("close", { size: 13 })} <span>${escapeHtml(t("marketingDismiss", "Hide Banner"))}</span>
                </button>
              </div>
            </div>

            <!-- Vector Brand Logo Banner -->
            <div class="marketing-brand-banner-frame">
              <img
                src="${brandLogoSrc}"
                alt="${escapeHtml(appName)}"
                class="marketing-brand-banner-img"
                id="marketing-brand-banner-img"
              />
            </div>

            <div class="marketing-content-row">
              <div class="marketing-text-block">
                <h2 class="marketing-main-headline">${escapeHtml(t("marketingHeadline", "Master Your Time. Command Your Focus."))}</h2>
                <p class="marketing-subcopy">${escapeHtml(t("marketingSubcopy", "The bilingual personal productivity suite merging rhythmic Pomodoro focus, offline encrypted vaults, and tactical RPG companion progression. Zero cloud tracking. 100% private."))}</p>
              </div>

              <div class="marketing-trust-pills">
                <div class="marketing-trust-pill">
                  ${getIcon("shield", { size: 13 })}
                  <span>${escapeHtml(t("marketingBadgePrivate", "100% Client-Side Private"))}</span>
                </div>
                <div class="marketing-trust-pill">
                  ${getIcon("play", { size: 13 })}
                  <span>${escapeHtml(t("marketingBadgeTactics", "Tactics Turn-Based RPG"))}</span>
                </div>
                <div class="marketing-trust-pill">
                  ${getIcon("sparkles", { size: 13 })}
                  <span>${escapeHtml(t("marketingBadgeCompanions", "5 Archetypal Mentors"))}</span>
                </div>
              </div>
            </div>

            <div class="marketing-cta-row">
              <button class="marketing-cta-primary group" id="launch-companion-tour-btn">
                <span>${escapeHtml(t("marketingCtaTour", "Launch Interactive Tour"))}</span>
                <span class="btn-circle-icon">${getIcon("sparkles", { size: 13 })}</span>
              </button>
              <button class="marketing-cta-secondary" id="enter-focus-chamber-btn">
                ${getIcon("play", { size: 14 })}
                <span>${escapeHtml(t("marketingCtaFocus", "Enter Focus Chamber"))}</span>
              </button>
            </div>
          </div>
        </div>
      `
          : ""
      }

      <!-- Top Bar: Brand Badge, Scene Reopen Pill, & 1-Click Language Switcher -->
      <div class="hero-top-bar">
        <div class="hero-brand-wrap">
          <div class="hero-tomato-badge" aria-hidden="true" title="${escapeHtml(appName)}">
            <img src="icons/favicon.svg" alt="${escapeHtml(appName)}" class="hero-brand-emblem-svg" width="34" height="34" />
          </div>
          <div class="hero-brand-titles">
            <h1 class="hero-app-title">${escapeHtml(appName)}</h1>
            <p class="hero-app-tagline">${escapeHtml(tagline)}</p>
          </div>
        </div>

        <div class="hero-top-controls">
          <button class="hero-chores-badge-btn ${choresSolved === 5 ? "all-solved" : ""}" id="hero-chores-badge-btn" title="Companion Expeditions & Outpost Duties">
            ${getIcon("sparkles", { size: 13 })} <span>Expeditions [${choresSolved}/5]</span>
          </button>

          <button class="hero-heatmap-badge-btn" id="hero-heatmap-badge-btn" title="Toggle Interaction Heatmap Overlay">
            ${getIcon("eye", { size: 13 })} <span>Heatmap HUD</span>
          </button>

          ${
            isMarketingHidden
              ? `
            <button class="hero-marketing-restore-btn" id="restore-marketing-hero-btn" title="Open product overview">
              ${getIcon("sparkles", { size: 13 })} <span>${escapeHtml(t("marketingRestore", "Product Overview"))}</span>
            </button>
          `
              : ""
          }

          ${
            isDismissed
              ? `
            <button class="hero-showcase-restore-btn" id="restore-hero-showcase-btn" title="Open living character outpost">
              ${getIcon("sparkles", { size: 13 })} <span>Outpost Showcase</span>
            </button>
          `
              : ""
          }

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
      </div>

      <!-- Massive Living Character Outpost & Interactive Carousel -->
      ${
        !isDismissed
          ? `
        <div class="hero-animated-showcase" id="hero-animated-showcase">
          <!-- Outpost Header Row -->
          <div class="showcase-header-row">
            <div class="showcase-title-group">
              <span class="showcase-pill-badge">${getIcon("sparkles", { size: 12 })} ${escapeHtml(t("outpostTitle", "The Chrono Outpost"))}</span>
              <h3 class="showcase-title">Master Your Time &amp; Focus</h3>
              <p class="showcase-sub">${escapeHtml(t("outpostSub", "A living preview of your productivity companions, tools, and tactical battle arenas."))}</p>
            </div>

            <div class="showcase-header-actions">
              <!-- Mode Switcher: Panoramic vs Carousel -->
              <div class="outpost-mode-switcher" role="group" aria-label="Outpost View Mode">
                <button
                  class="outpost-mode-btn ${outpostMode === "panoramic" ? "active" : ""}"
                  id="outpost-mode-panoramic-btn"
                  title="Panoramic Base Camp View"
                >
                  ${getIcon("eye", { size: 13 })} <span>${escapeHtml(t("outpostModePanoramic", "Panoramic"))}</span>
                </button>
                <button
                  class="outpost-mode-btn ${outpostMode === "carousel" ? "active" : ""}"
                  id="outpost-mode-carousel-btn"
                  title="Realm Focus Carousel View"
                >
                  ${getIcon("play", { size: 12 })} <span>${escapeHtml(t("outpostModeCarousel", "Realm Focus"))}</span>
                </button>
              </div>

              <!-- Expeditions Trigger Button -->
              <button class="showcase-chores-trigger-btn ${choresSolved === 5 ? "all-solved" : ""}" id="showcase-open-chores-btn" title="Open companion field expeditions">
                ${getIcon("sparkles", { size: 13 })} <span>${escapeHtml(t("expeditionBtnLabel", "Expeditions"))} [${choresSolved}/5]</span>
              </button>

              <button class="hero-showcase-dismiss-btn" id="dismiss-hero-showcase-btn" title="Dismiss animated scene">
                ${getIcon("chevron-up", { size: 14 })} <span>Hide Scene</span>
              </button>
            </div>
          </div>

          <!-- Realm Navigation Pills Bar -->
          <div class="outpost-realm-pills" role="tablist">
            <button
              class="outpost-realm-pill ${outpostMode === "panoramic" ? "active" : ""}"
              data-realm-index="-1"
              role="tab"
            >
              ${getIcon("eye", { size: 12 })} <span>${escapeHtml(t("realmAll", "All Realms"))}</span>
            </button>
            ${REALM_DEFINITIONS.map(
              (r, idx) => `
              <button
                class="outpost-realm-pill ${outpostMode === "carousel" && activeRealmIndex === idx ? "active" : ""}"
                data-realm-index="${idx}"
                role="tab"
              >
                <span>${idx + 1}. ${escapeHtml(t(r.nameKey, r.fallbackName))}</span>
              </button>
            `,
            ).join("")}
          </div>

          <!-- Living Animated Realm Stage Wrapper -->
          <div class="outpost-stage-wrapper mode-${outpostMode}" id="outpost-stage-wrapper">
            <div class="outpost-realm-grid" id="outpost-realm-grid">
              ${REALM_DEFINITIONS.map((realm, index) => renderLivingRealmCard(realm, index)).join("")}
            </div>

            <!-- Carousel Bottom Controls (Displayed in Carousel Mode) -->
            <div class="outpost-carousel-controls">
              <button class="carousel-nav-btn prev" id="outpost-carousel-prev" aria-label="Previous Realm">
                ${getIcon("chevron-up", { size: 14, className: "rotate-270" })}
              </button>
              <div class="carousel-dots-row">
                ${REALM_DEFINITIONS.map(
                  (_, idx) => `
                  <button
                    class="carousel-dot ${activeRealmIndex === idx ? "active" : ""}"
                    data-dot-index="${idx}"
                    aria-label="Go to realm ${idx + 1}"
                  ></button>
                `,
                ).join("")}
              </div>
              <button class="carousel-nav-btn next" id="outpost-carousel-next" aria-label="Next Realm">
                ${getIcon("chevron-up", { size: 14, className: "rotate-90" })}
              </button>
            </div>
          </div>
        </div>
      `
          : ""
      }

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
  applyCarouselSlidePosition(container);
}

function renderLivingRealmCard(realm, index) {
  const title = t(realm.nameKey, realm.fallbackName);

  return `
    <div
      class="outpost-realm-card"
      id="${realm.cardId}"
      data-realm-id="${realm.id}"
      data-realm-index="${index}"
      style="--realm-accent: ${realm.accent};"
    >
      <!-- Card Header -->
      <div class="realm-card-header">
        <div class="realm-card-identity">
          <span class="realm-number-tag">${index + 1}</span>
          <div class="realm-title-wrap">
            <h4>${escapeHtml(title)}</h4>
          </div>
        </div>
        <span class="realm-stage-badge">${escapeHtml(realm.lead)}</span>
      </div>

      <!-- Interactive Living Stage (Zero Emojis, 100% Vector Animations) -->
      <div
        class="realm-interactive-stage ${realm.stageClass}"
        id="realm-stage-${realm.id}"
        role="button"
        tabindex="0"
        title="Interact with ${escapeHtml(title)}"
        aria-label="Interact with ${escapeHtml(title)}"
      >
        ${renderLivingStageContent(realm.id)}
      </div>

      <!-- Backward-Compatible Inner Widgets for Automation Test Assertions -->
      ${renderBackwardCompatibleWidgets(realm.id)}

      <!-- Lore Caption -->
      <p class="realm-card-lore">${escapeHtml(realm.lore)}</p>

      <!-- 1-Click Launchpad Action -->
      <button class="outpost-launch-btn" data-realm-target="${realm.actionTarget}">
        ${getIcon("play", { size: 13 })}
        <span>${escapeHtml(realm.actionLabel)}</span>
      </button>
    </div>
  `;
}

function renderLivingStageContent(realmId) {
  if (realmId === "forge") {
    return `
      <div class="forge-furnace-glow"></div>
      <div class="forge-gears-cluster">
        <div class="gear-cog-big">${getIcon("refresh", { size: 34 })}</div>
        <div class="gear-cog-small">${getIcon("refresh", { size: 20 })}</div>
      </div>
      <div class="forge-steam-plume"></div>
      <div class="forge-actors-row">
        <div class="actor-pomi-forge" title="Pomi pumping forge bellows">
          ${renderMascotSvg("pomi", "cheer", 70)}
        </div>
        <div class="actor-bolt-forge" title="Bolt tuning clockwork cogs">
          ${renderMascotSvg("bolt", "idle", 64)}
        </div>
      </div>
    `;
  }

  if (realmId === "grid") {
    return `
      <div class="holo-grid-floor"></div>
      <div class="holo-kanban-cards-stream">
        <div class="holo-mini-card">Sprint #4: Active</div>
        <div class="holo-mini-card">PR #108: Merged</div>
        <div class="holo-mini-card">Bug #04: Patched</div>
      </div>
      <div class="actor-kip-holo" title="Kip leaping across holo-platforms">
        ${renderMascotSvg("kip", "cheer", 80)}
      </div>
      <div class="holo-glitch-target" title="Glitch bug target">
        ${getIcon("close", { size: 16 })}
      </div>
    `;
  }

  if (realmId === "astral") {
    return `
      <div class="astral-starfield"></div>
      <div class="astral-orrery-ring-outer"></div>
      <div class="astral-orrery-ring-inner"></div>
      <div class="astral-scroll-floating">${getIcon("book", { size: 24 })}</div>
      <div class="actor-chronos-astral" title="Chronos levitating with cosmic astrolabe">
        ${renderMascotSvg("chronos", "idle", 84)}
      </div>
    `;
  }

  if (realmId === "arboretum") {
    return `
      <div class="arboretum-pollen-drift"></div>
      <div class="arboretum-bonsai-tree">
        <svg class="bonsai-leaf-canopy" width="60" height="70" viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Tree Trunk -->
          <path d="M30 68 C30 50 36 40 32 30 C30 25 24 20 28 10" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
          <path d="M32 36 C42 32 46 26 48 20" stroke="#78350f" stroke-width="3" stroke-linecap="round"/>
          <!-- Foliage Orbs -->
          <circle cx="28" cy="12" r="14" fill="#10b981" opacity="0.85"/>
          <circle cx="48" cy="18" r="10" fill="#34d399" opacity="0.9"/>
          <circle cx="20" cy="24" r="9" fill="#059669" opacity="0.85"/>
          <!-- Golden Streak Fruit -->
          <circle cx="28" cy="12" r="4" fill="#fbbf24"/>
          <circle cx="48" cy="18" r="3.5" fill="#f59e0b"/>
        </svg>
      </div>
      <div class="actor-pip-garden" title="Pip watering habit saplings">
        ${renderMascotSvg("pip", "cheer", 76)}
      </div>
    `;
  }

  // Tactics Rampart
  return `
    <div class="rampart-battlement-wall"></div>
    <div class="rampart-training-dummy" id="rampart-training-dummy" title="Wooden sparring target">
      <svg width="42" height="64" viewBox="0 0 42 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Post -->
        <rect x="18" y="24" width="6" height="38" fill="#78350f"/>
        <line x1="8" y1="62" x2="34" y2="62" stroke="#451a03" stroke-width="4"/>
        <!-- Straw Body -->
        <ellipse cx="21" cy="30" rx="14" ry="16" fill="#d97706" stroke="#92400e" stroke-width="2"/>
        <!-- Head -->
        <circle cx="21" cy="12" r="8" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
        <!-- Bullseye target -->
        <circle cx="21" cy="30" r="5" fill="#ef4444"/>
        <circle cx="21" cy="30" r="2" fill="#ffffff"/>
      </svg>
    </div>
    <div class="tactics-squad-row">
      <div class="actor-chrono-knight" title="Chrono Knight sparring combo">
        ${renderJobSprite("knight", { size: 52, facing: "E" })}
      </div>
      <div class="actor-black-mage" title="Black Mage channeling flame vortex">
        ${renderJobSprite("black_mage", { size: 48, facing: "E" })}
      </div>
      <div class="actor-white-mage" title="White Mage projecting aegis barrier">
        ${renderJobSprite("white_mage", { size: 46, facing: "E" })}
      </div>
    </div>
  `;
}

function renderBackwardCompatibleWidgets(realmId) {
  if (realmId === "forge") {
    return `
      <div class="interactive-core-diorama" id="interactive-core-diorama" role="button" tabindex="0" title="Click to charge Flow Energy!" style="margin: 4px auto 8px auto;">
        <div class="core-clockwork-ring">
          <div class="core-orbit-dot dot-1"></div>
          <div class="core-orbit-dot dot-2"></div>
        </div>
        <div class="core-tomato-orb" style="width: 48px; height: 48px;">
          ${getIcon("tomato", { size: 30 })}
        </div>
      </div>
      <div class="core-energy-meter" style="margin-bottom: 6px;">
        <div class="energy-meter-label" style="display: flex; justify-content: space-between; font-size: 0.7rem;">
          <span>Flow Energy</span>
          <strong id="core-energy-value">${focusEnergy}%</strong>
        </div>
        <div class="energy-track" style="height: 5px; background: rgba(0,0,0,0.1); border-radius: 9999px; overflow: hidden;">
          <div class="energy-fill" id="core-energy-fill" style="width: ${focusEnergy}%; height: 100%; background: #ef4444; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }

  if (realmId === "grid") {
    return `
      <div class="interactive-tasks-diorama" style="padding: 2px 0 6px 0;">
        <div class="demo-task-item ${focusEnergy >= 50 ? "sliced" : ""}" id="demo-task-item" role="button" tabindex="0" style="display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 8px; border: 1px solid var(--color-gray-200, #cbd5e1); font-size: 0.74rem;">
          <span class="demo-task-check" style="width: 16px; height: 16px; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #94a3b8;">${getIcon("check", { size: 11 })}</span>
          <span class="demo-task-text" style="flex: 1;">Priority Sprint Objective</span>
          <span class="demo-task-reward" style="font-size: 0.68rem; color: #f59e0b; font-weight: 800;">+15g</span>
        </div>
        <div class="demo-slash-fx" id="demo-slash-fx"></div>
      </div>
    `;
  }

  if (realmId === "rampart") {
    return `
      <div class="interactive-rpg-diorama" style="margin-bottom: 6px;">
        <div class="rpg-job-switch-row" style="display: flex; gap: 4px; margin-bottom: 6px;">
          <button class="job-mini-tab ${currentDioramaJob === "knight" ? "active" : ""}" data-diorama-job="knight">Knight</button>
          <button class="job-mini-tab ${currentDioramaJob === "black_mage" ? "active" : ""}" data-diorama-job="black_mage">Black Mage</button>
          <button class="job-mini-tab ${currentDioramaJob === "white_mage" ? "active" : ""}" data-diorama-job="white_mage">White Mage</button>
        </div>
        <div class="rpg-preview-unit" id="rpg-preview-unit" style="display: flex; align-items: center; gap: 8px; padding: 4px 8px; border-radius: 8px; background: rgba(59, 130, 246, 0.08); font-size: 0.72rem;">
          <div class="unit-diorama-avatar" id="unit-diorama-avatar">
            ${renderDioramaJobAvatar(currentDioramaJob)}
          </div>
          <div class="unit-diorama-meta" style="display: flex; flex-direction: column;">
            <strong id="diorama-job-name">${getDioramaJobName(currentDioramaJob)}</strong>
            <span id="diorama-job-skill" style="color: #3b82f6;">${getDioramaJobSkill(currentDioramaJob)}</span>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function renderDioramaJobAvatar(job) {
  if (job === "black_mage") {
    return `<div class="mini-job-badge elem-fire">${getIcon("sparkles", { size: 18 })}</div>`;
  }
  if (job === "white_mage") {
    return `<div class="mini-job-badge elem-nature">${getIcon("heart", { size: 18 })}</div>`;
  }
  return `<div class="mini-job-badge elem-time">${getIcon("shield", { size: 18 })}</div>`;
}

function getDioramaJobName(job) {
  if (job === "black_mage") return "Black Mage";
  if (job === "white_mage") return "White Mage";
  return "Chrono Knight";
}

function getDioramaJobSkill(job) {
  if (job === "black_mage") return "Fira Blast (AoE Cross)";
  if (job === "white_mage") return "Cura & Protect Barrier";
  return "Power Break & Omnislash";
}

function applyCarouselSlidePosition(container) {
  const stageWrapper = container.querySelector("#outpost-stage-wrapper");
  const cards = container.querySelectorAll(".outpost-realm-card");
  const dots = container.querySelectorAll(".carousel-dot");
  const pills = container.querySelectorAll(".outpost-realm-pill");

  if (!stageWrapper) return;

  if (outpostMode === "carousel") {
    cards.forEach((card) => {
      card.style.transform = `translateX(-${activeRealmIndex * 100}%)`;
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === activeRealmIndex);
    });
    pills.forEach((pill) => {
      const idx = parseInt(pill.dataset.realmIndex, 10);
      pill.classList.toggle("active", idx === activeRealmIndex);
    });
  } else {
    cards.forEach((card) => {
      card.style.transform = "";
    });
    pills.forEach((pill) => {
      const idx = parseInt(pill.dataset.realmIndex, 10);
      pill.classList.toggle("active", idx === -1);
    });
  }
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

  // Brand Logo Style Cycler Button
  const brandCycleBtn = container.querySelector("#marketing-brand-cycle-btn");
  if (brandCycleBtn) {
    const STYLES = ["modern", "soviet", "edgy", "lighthearted"];
    brandCycleBtn.addEventListener("click", () => {
      const cur = localStorage.getItem("pomidor_brand_logo_style") || "modern";
      const idx = STYLES.indexOf(cur);
      const nextStyle = STYLES[(idx + 1) % STYLES.length];
      localStorage.setItem("pomidor_brand_logo_style", nextStyle);

      const brandSelect = document.getElementById("brand-logo-select");
      if (brandSelect) brandSelect.value = nextStyle;

      document.documentElement.setAttribute("data-brand-logo-style", nextStyle);
      window.dispatchEvent(new CustomEvent("brand-logo-changed", { detail: { style: nextStyle } }));
    });
  }

  // Dismiss Marketing Hero Banner
  container.querySelector("#dismiss-marketing-hero-btn")?.addEventListener("click", () => {
    setMarketingDismissed(true);
    renderHeroBanner(container);
  });

  // Restore Marketing Hero Banner
  container.querySelector("#restore-marketing-hero-btn")?.addEventListener("click", () => {
    setMarketingDismissed(false);
    renderHeroBanner(container);
  });

  // Launch Interactive Companion Tour
  container.querySelector("#launch-companion-tour-btn")?.addEventListener("click", () => {
    openInteractiveTutorial(0);
  });

  // Enter Focus Chamber
  container.querySelector("#enter-focus-chamber-btn")?.addEventListener("click", () => {
    const timerEl = document.getElementById("session-progress") || document.getElementById("timer-classic");
    if (timerEl) {
      timerEl.scrollIntoView({ behavior: "smooth", block: "center" });
      timerEl.classList.add("highlight-timer-pulse");
      setTimeout(() => timerEl.classList.remove("highlight-timer-pulse"), 1200);
    }
  });

  // Open Companion Expeditions Modal
  container.querySelector("#hero-chores-badge-btn")?.addEventListener("click", () => {
    openCompanionChoresModal();
  });
  container.querySelector("#showcase-open-chores-btn")?.addEventListener("click", () => {
    openCompanionChoresModal();
  });

  // Toggle Heatmap Overlay
  container.querySelector("#hero-heatmap-badge-btn")?.addEventListener("click", () => {
    toggleHeatmapOverlay();
  });

  // Dismiss Showcase Scene Button
  container.querySelector("#dismiss-hero-showcase-btn")?.addEventListener("click", () => {
    setShowcaseDismissed(true);
    renderHeroBanner(container);
  });

  // Restore Showcase Scene Button
  container.querySelector("#restore-hero-showcase-btn")?.addEventListener("click", () => {
    setShowcaseDismissed(false);
    renderHeroBanner(container);
  });

  // Mode Switcher: Panoramic vs Carousel
  container.querySelector("#outpost-mode-panoramic-btn")?.addEventListener("click", () => {
    outpostMode = "panoramic";
    try {
      localStorage.setItem(OUTPOST_MODE_KEY, "panoramic");
    } catch {}
    const wrapper = container.querySelector("#outpost-stage-wrapper");
    if (wrapper) {
      wrapper.className = "outpost-stage-wrapper mode-panoramic";
    }
    container.querySelector("#outpost-mode-panoramic-btn")?.classList.add("active");
    container.querySelector("#outpost-mode-carousel-btn")?.classList.remove("active");
    applyCarouselSlidePosition(container);
  });

  container.querySelector("#outpost-mode-carousel-btn")?.addEventListener("click", () => {
    outpostMode = "carousel";
    try {
      localStorage.setItem(OUTPOST_MODE_KEY, "carousel");
    } catch {}
    const wrapper = container.querySelector("#outpost-stage-wrapper");
    if (wrapper) {
      wrapper.className = "outpost-stage-wrapper mode-carousel";
    }
    container.querySelector("#outpost-mode-carousel-btn")?.classList.add("active");
    container.querySelector("#outpost-mode-panoramic-btn")?.classList.remove("active");
    applyCarouselSlidePosition(container);
  });

  // Realm Navigation Pills
  container.querySelectorAll(".outpost-realm-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const idx = parseInt(pill.dataset.realmIndex, 10);
      if (idx === -1) {
        // All Realms -> Panoramic
        outpostMode = "panoramic";
        try {
          localStorage.setItem(OUTPOST_MODE_KEY, "panoramic");
        } catch {}
        const wrapper = container.querySelector("#outpost-stage-wrapper");
        if (wrapper) wrapper.className = "outpost-stage-wrapper mode-panoramic";
        container.querySelector("#outpost-mode-panoramic-btn")?.classList.add("active");
        container.querySelector("#outpost-mode-carousel-btn")?.classList.remove("active");
      } else {
        // Specific realm -> Carousel focused on that slide
        outpostMode = "carousel";
        activeRealmIndex = idx;
        try {
          localStorage.setItem(OUTPOST_MODE_KEY, "carousel");
        } catch {}
        const wrapper = container.querySelector("#outpost-stage-wrapper");
        if (wrapper) wrapper.className = "outpost-stage-wrapper mode-carousel";
        container.querySelector("#outpost-mode-carousel-btn")?.classList.add("active");
        container.querySelector("#outpost-mode-panoramic-btn")?.classList.remove("active");
      }
      applyCarouselSlidePosition(container);
    });
  });

  // Carousel Prev / Next Buttons
  container.querySelector("#outpost-carousel-prev")?.addEventListener("click", () => {
    activeRealmIndex = (activeRealmIndex - 1 + REALM_DEFINITIONS.length) % REALM_DEFINITIONS.length;
    applyCarouselSlidePosition(container);
    playOutpostTone(480, "sine", 0.08);
  });

  container.querySelector("#outpost-carousel-next")?.addEventListener("click", () => {
    activeRealmIndex = (activeRealmIndex + 1) % REALM_DEFINITIONS.length;
    applyCarouselSlidePosition(container);
    playOutpostTone(520, "sine", 0.08);
  });

  // Carousel Dot Indicators
  container.querySelectorAll(".carousel-dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.dataset.dotIndex, 10);
      if (!isNaN(idx)) {
        activeRealmIndex = idx;
        applyCarouselSlidePosition(container);
        playOutpostTone(500, "sine", 0.08);
      }
    });
  });

  // 1-Click Launchpad Action Buttons on Realm Cards
  container.querySelectorAll(".outpost-launch-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const target = btn.dataset.realmTarget;
      if (target === "timer") {
        const timerEl = document.getElementById("session-progress") || document.getElementById("timer-classic");
        if (timerEl) {
          timerEl.scrollIntoView({ behavior: "smooth", block: "center" });
          timerEl.classList.add("highlight-timer-pulse");
          setTimeout(() => timerEl.classList.remove("highlight-timer-pulse"), 1200);
        }
      } else if (target === "kanban") {
        document.querySelector("[data-view='kanban']")?.click() || document.querySelector("[data-view='list']")?.click();
      } else if (target === "vault") {
        document.querySelector("[data-view='vault']")?.click();
      } else if (target === "habits") {
        const habitEl = document.getElementById("habits-section");
        if (habitEl) {
          habitEl.scrollIntoView({ behavior: "smooth", block: "center" });
          habitEl.classList.add("highlight-timer-pulse");
          setTimeout(() => habitEl.classList.remove("highlight-timer-pulse"), 1200);
        }
      } else if (target === "tactics") {
        document.querySelector("[data-view='tactics']")?.click();
      }
    });
  });

  // Interactive Clicks on the 5 Living Stations
  // Station 1: Chrono Forge Click
  const forgeStage = container.querySelector("#realm-stage-forge");
  forgeStage?.addEventListener("click", () => {
    playOutpostTone(620, "triangle", 0.18);
    spawnFloatingToast(forgeStage, "+15% Flow Energy!", "#f97316");
    chargeEnergy(15);
  });

  // Interactive Core Tap (for tests & flow charge)
  const coreDiorama = container.querySelector("#interactive-core-diorama");
  coreDiorama?.addEventListener("click", (e) => {
    e.stopPropagation();
    chargeEnergy(15);
    spawnFloatingToast(forgeStage || coreDiorama, "+15% Energy!", "#ef4444");
    playOutpostTone(680, "sine", 0.15);
  });

  function chargeEnergy(amount) {
    focusEnergy = Math.min(100, focusEnergy + amount);
    const fillEl = container.querySelector("#core-energy-fill");
    const valEl = container.querySelector("#core-energy-value");
    if (fillEl) fillEl.style.width = `${focusEnergy}%`;
    if (valEl) valEl.textContent = `${focusEnergy}%`;

    if (coreDiorama) {
      coreDiorama.classList.add("core-tap-active");
      setTimeout(() => coreDiorama.classList.remove("core-tap-active"), 400);
    }

    if (focusEnergy >= 100) {
      focusEnergy = 25;
    }
  }

  // Station 2: Agile Holo-Grid Click
  const gridStage = container.querySelector("#realm-stage-grid");
  gridStage?.addEventListener("click", () => {
    playOutpostTone(880, "sawtooth", 0.12);
    spawnFloatingToast(gridStage, "+15 Gold!", "#06b6d4");
  });

  // Interactive Demo Task Slice (for tests & task slice)
  const demoTask = container.querySelector("#demo-task-item");
  demoTask?.addEventListener("click", (e) => {
    e.stopPropagation();
    demoTask.classList.toggle("sliced");
    playOutpostTone(750, "square", 0.1);
    spawnFloatingToast(demoTask, "+15g!", "#f59e0b");
  });

  // Station 3: Astral Archives Click
  const astralStage = container.querySelector("#realm-stage-astral");
  astralStage?.addEventListener("click", () => {
    playOutpostTone(587, "sine", 0.25);
    spawnFloatingToast(astralStage, "+25 Arcane XP!", "#c084fc");
  });

  // Station 4: Zen Arboretum Click
  const gardenStage = container.querySelector("#realm-stage-arboretum");
  gardenStage?.addEventListener("click", () => {
    playOutpostTone(440, "sine", 0.3);
    spawnFloatingToast(gardenStage, "+20 Habit Streak!", "#34d399");
  });

  // Station 5: Tactics Rampart Click
  const rampartStage = container.querySelector("#realm-stage-rampart");
  rampartStage?.addEventListener("click", () => {
    playOutpostTone(987, "triangle", 0.2);
    const dummy = container.querySelector("#rampart-training-dummy");
    if (dummy) {
      dummy.classList.add("dummy-hit-shake");
      setTimeout(() => dummy.classList.remove("dummy-hit-shake"), 600);
    }
    spawnFloatingToast(rampartStage, "999! CRITICAL LIMIT BREAK!", "#fbbf24");
  });

  // Interactive RPG Job Switch
  container.querySelectorAll(".job-mini-tab").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentDioramaJob = btn.dataset.dioramaJob;
      container.querySelectorAll(".job-mini-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const avatarEl = container.querySelector("#unit-diorama-avatar");
      const nameEl = container.querySelector("#diorama-job-name");
      const skillEl = container.querySelector("#diorama-job-skill");

      if (avatarEl) avatarEl.innerHTML = renderDioramaJobAvatar(currentDioramaJob);
      if (nameEl) nameEl.textContent = getDioramaJobName(currentDioramaJob);
      if (skillEl) skillEl.textContent = getDioramaJobSkill(currentDioramaJob);
    });
  });

  // Mascot Click -> Signature Custom Interaction
  const mascotBox = container.querySelector("#hero-mascot-avatar-box");
  const triggerMascot = () => {
    mascotBox?.classList.add("hero-avatar-bounce");
    setTimeout(() => mascotBox?.classList.remove("hero-avatar-bounce"), 600);
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
