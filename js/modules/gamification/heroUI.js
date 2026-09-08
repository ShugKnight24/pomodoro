/**
 * heroUI.js — Hero Dashboard, Character Creator & Paper-Doll View
 * Renders the SVG character stage, equipment slots, shop, quests & boss arena.
 */

"use strict";

import {
  getHero,
  saveHero,
  buyItem,
  equipItem,
  createCharacter,
  ARCHETYPES,
} from "./hero.js";
import {
  CATALOG,
  ITEM_CATEGORIES,
  getItemById,
  getItemsByCategory,
} from "./catalog.js";
import {
  CHAPTERS,
  getCurrentChapter,
  getQuestState,
  setStoryMode,
} from "./quests.js";
import { renderHeroPaperDoll, renderBossSprite, renderNPCPortrait } from "./characterSprites.js";
import { getIcon } from "../../utils/icons.js";
import { escapeHtml } from "../../utils/sanitize.js";

const RANDOM_NAMES = [
  "Kaelen Timeweaver",
  "Aria Dawnstride",
  "Boran Ironwill",
  "Lyra Starwhisper",
  "Theron Quickblade",
  "Sylas Focusward",
  "Mira Sunforge",
  "Darian Chronos",
  "Vespera Shadowveil",
  "Orion Aegis",
];

let activeTab = "quests"; // 'quests', 'shop', 'inventory'
let activeShopCategory = "all";

export function initHeroUI() {
  renderHeroDashboard();
  setupUIEventListeners();
}

export function renderHeroDashboard() {
  const container = document.getElementById("hero-container");
  if (!container) return;

  const hero = getHero();
  const xpPct = Math.min(100, Math.round((hero.xp / hero.maxXp) * 100));
  const hpPct = Math.min(100, Math.round((hero.hp / hero.maxHp) * 100));
  const arch = ARCHETYPES[hero.archetype] || ARCHETYPES.knight;

  container.innerHTML = `
    <!-- Top Hero Banner & Status Header -->
    <div class="hero-header-banner">
      <div class="hero-identity-group">
        <div class="hero-level-ring">
          <span class="level-num">${hero.level}</span>
          <span class="level-label">LEVEL</span>
        </div>
        <div class="hero-titles">
          <div class="hero-name-row">
            <h2 class="hero-name">${escapeHtml(hero.name)}</h2>
            <span class="hero-class-tag class-${hero.archetype}">${arch.name}</span>
          </div>
          <p class="hero-title-text">${escapeHtml(hero.title)}</p>
        </div>
      </div>

      <div class="hero-vitals-group">
        <!-- Resolve (HP) Bar -->
        <div class="vital-bar-item">
          <div class="vital-label-row">
            <span class="vital-name">${getIcon("heart", { size: 14 })} Resolve (HP)</span>
            <span class="vital-values">${hero.hp} / ${hero.maxHp}</span>
          </div>
          <div class="vital-track hp-track">
            <div class="vital-fill hp-fill" style="width: ${hpPct}%"></div>
          </div>
        </div>

        <!-- Focus XP Bar -->
        <div class="vital-bar-item">
          <div class="vital-label-row">
            <span class="vital-name">${getIcon("sparkles", { size: 14 })} Focus XP</span>
            <span class="vital-values">${hero.xp} / ${hero.maxXp}</span>
          </div>
          <div class="vital-track xp-track">
            <div class="vital-fill xp-fill" style="width: ${xpPct}%"></div>
          </div>
        </div>
      </div>

      <div class="hero-treasury-group">
        <div class="treasury-card">
          <span class="treasury-icon">${getIcon("coins", { size: 20 })}</span>
          <div class="treasury-info">
            <span class="treasury-label">Chrono-Coins</span>
            <span class="treasury-amount">${hero.gold}g</span>
          </div>
        </div>
        <button class="button hero-customize-btn" id="open-character-creator-btn" title="Customize Hero Appearance">
          ${getIcon("edit", { size: 14 })} Customize Hero
        </button>
      </div>
    </div>

    <!-- Main Hero Workspace Grid -->
    <div class="hero-workspace-grid">
      <!-- Column 1: Live Character Paper Doll & Equipment Slots -->
      <div class="hero-stage-card">
        <div class="stage-header">
          <h3 class="stage-title">${getIcon("shield", { size: 18 })} Equipped Armaments</h3>
          ${
            hero.equipped.mount?.id !== "m_none"
              ? `<span class="equipped-mount-badge">${hero.equipped.mount.name}</span>`
              : ""
          }
        </div>

        <!-- SVG Paper-Doll Canvas -->
        <div class="paperdoll-canvas-wrapper" id="paperdoll-canvas-container">
          ${renderHeroPaperDoll(hero, { size: 240 })}
        </div>

        <!-- Equipment Slots Grid -->
        <div class="equipment-slots-grid">
          ${renderEquipmentSlot("weapon", "Main Weapon", hero.equipped.weapon)}
          ${renderEquipmentSlot("armor", "Armor", hero.equipped.armor)}
          ${renderEquipmentSlot("headgear", "Headgear", hero.equipped.headgear)}
          ${renderEquipmentSlot("offhand", "Off-Hand", hero.equipped.offhand)}
          ${renderEquipmentSlot("cloak", "Cloak", hero.equipped.cloak)}
          ${renderEquipmentSlot("mount", "Mount", hero.equipped.mount)}
        </div>
      </div>

      <!-- Column 2: Interactive Tabs (Quests & Boss Arena, Bazaar Shop, Inventory) -->
      <div class="hero-tabs-card">
        <div class="hero-tabs-nav">
          <button class="hero-tab-btn ${activeTab === "quests" ? "active" : ""}" data-hero-tab="quests">
            ${getIcon("sword", { size: 16 })} Quests & Boss Arena
          </button>
          <button class="hero-tab-btn ${activeTab === "shop" ? "active" : ""}" data-hero-tab="shop">
            ${getIcon("coins", { size: 16 })} Armory & Bazaar
          </button>
          <button class="hero-tab-btn ${activeTab === "inventory" ? "active" : ""}" data-hero-tab="inventory">
            ${getIcon("archive", { size: 16 })} Inventory (${hero.inventory.length})
          </button>
          <button class="hero-tab-btn" id="hero-launch-tactics-btn" style="background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15)); border-color: rgba(16,185,129,0.4);">
            ${getIcon("sword", { size: 16 })} Tactics &amp; Pets Arena
          </button>
        </div>

        <div class="hero-tab-content" id="hero-tab-content-area">
          ${renderTabContent(hero)}
        </div>
      </div>
    </div>

    <!-- Modal: Character Creator (Collapsible / Dynamic) -->
    <div class="character-creator-modal-overlay hidden" id="character-creator-modal">
      <div class="character-creator-modal">
        <div class="creator-modal-header">
          <h3>Create Your Chrono-Knight</h3>
          <button class="button close-creator-btn" id="close-creator-btn">${getIcon("close", { size: 16 })}</button>
        </div>
        <div class="creator-modal-body" id="creator-modal-body">
          <!-- Dynamic creator controls will mount here -->
        </div>
      </div>
    </div>
  `;

  bindTabButtons();
  bindSlotButtons();
  bindCreatorModal();
  bindShopButtons();
  bindInventoryButtons();
  bindQuestControls();
}

/* ─── Equipment Slot Component ──────────────────────────────── */
function renderEquipmentSlot(category, label, item) {
  const isEquipped = item && item.id && !item.id.endsWith("_none");
  const itemName = isEquipped ? item.name : "None";
  const itemPerk = isEquipped ? item.perk : "Empty Slot";
  const rarity = item?.rarity || "common";

  return `
    <div class="equip-slot-item slot-${category} ${isEquipped ? `rarity-${rarity}` : "empty"}" data-slot-category="${category}">
      <div class="slot-header">
        <span class="slot-type-label">${label}</span>
        ${isEquipped ? `<span class="slot-rarity-pill">${rarity}</span>` : ""}
      </div>
      <div class="slot-details">
        <strong class="slot-item-name">${escapeHtml(itemName)}</strong>
        <span class="slot-item-perk">${escapeHtml(itemPerk)}</span>
      </div>
    </div>
  `;
}

/* ─── Tab Content Switcher ──────────────────────────────────── */
function renderTabContent(hero) {
  if (activeTab === "shop") {
    return renderShopView(hero);
  } else if (activeTab === "inventory") {
    return renderInventoryView(hero);
  } else {
    return renderQuestsView(hero);
  }
}

/* ─── 1. Quests & Boss Arena View ───────────────────────────── */
function renderQuestsView(hero) {
  const questState = getQuestState();
  const currentChapter = getCurrentChapter();
  const bossHpPct = Math.min(
    100,
    Math.round((questState.bossCurrentHP / currentChapter.bossMaxHP) * 100),
  );

  return `
    <div class="quests-dashboard-view">
      <!-- Story Mode Opt-Out Bar -->
      <div class="story-mode-toolbar">
        <div class="story-mode-label-group">
          <strong>${getIcon("scroll", { size: 16 })} Narrative Story Mode</strong>
          <span class="story-mode-subtext">Weaves lore dialogues and mentor guidance into your journey</span>
        </div>
        <label class="switch story-switch" title="Toggle narrative dialogues on or off">
          <input type="checkbox" id="story-mode-toggle" ${questState.storyMode ? "checked" : ""} />
          <span class="slider round"></span>
        </label>
      </div>

      <!-- Narrative Dialogue Box (Conditional on storyMode) -->
      ${
        questState.storyMode
          ? `
          <div class="narrative-dialogue-card" id="narrative-dialogue-card">
            <div class="npc-avatar-col">
              ${renderNPCPortrait({ size: 54 })}
              <span class="npc-name">Chronos</span>
            </div>
            <div class="dialogue-speech-bubble">
              <p class="dialogue-text">"${escapeHtml(currentChapter.dialogue.intro)}"</p>
              <span class="dialogue-hint">Tip: Completing tasks, ticking habits, and finishing pomodoro timers strikes the boss!</span>
            </div>
          </div>
        `
          : ""
      }

      <!-- Boss Arena Card -->
      <div class="boss-arena-card">
        <div class="boss-arena-visual">
          ${renderBossSprite(currentChapter.bossId, { size: 140 })}
        </div>
        <div class="boss-arena-details">
          <div class="boss-title-row">
            <span class="active-chapter-badge">${currentChapter.title}</span>
            <h3 class="boss-name">${escapeHtml(currentChapter.bossName)}</h3>
          </div>
          <p class="boss-lore">${escapeHtml(currentChapter.lore)}</p>

          <!-- Boss HP Bar -->
          <div class="boss-hp-section">
            <div class="boss-hp-labels">
              <span class="boss-hp-title">${getIcon("sword", { size: 14 })} Boss Resolve</span>
              <span class="boss-hp-num">${questState.bossCurrentHP} / ${currentChapter.bossMaxHP} HP</span>
            </div>
            <div class="boss-hp-track">
              <div class="boss-hp-fill" style="width: ${bossHpPct}%"></div>
            </div>
          </div>

          <!-- Combat Damage Ledger / Tips -->
          <div class="combat-rates-grid">
            <div class="combat-rate-pill">
              <span class="rate-icon">${getIcon("tomato", { size: 14 })}</span>
              <span class="rate-text">Pomodoro Focus: <strong>30-40 DMG</strong></span>
            </div>
            <div class="combat-rate-pill">
              <span class="rate-icon">${getIcon("check", { size: 14 })}</span>
              <span class="rate-text">Complete Task: <strong>15 DMG</strong></span>
            </div>
            <div class="combat-rate-pill">
              <span class="rate-icon">${getIcon("fire", { size: 14 })}</span>
              <span class="rate-text">Daily Habit: <strong>15 DMG</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Chapter Timeline -->
      <div class="chapters-timeline-section">
        <h4 class="timeline-title">${getIcon("crown", { size: 16 })} Chronicles Progression</h4>
        <div class="chapters-grid">
          ${CHAPTERS.map((ch, idx) => {
            const isCompleted = questState.completedChapters.includes(ch.id);
            const isActive = ch.id === questState.currentChapterId;
            const statusClass = isCompleted
              ? "completed"
              : isActive
                ? "active"
                : "locked";
            const statusText = isCompleted
              ? "Vanquished"
              : isActive
                ? "In Battle"
                : "Locked";
            const rewardItem = getItemById(ch.rewards.itemDrop);

            return `
              <div class="chapter-card ${statusClass}">
                <div class="chapter-card-header">
                  <span class="chapter-num">Act ${idx + 1}</span>
                  <span class="chapter-status-pill">${statusText}</span>
                </div>
                <h5 class="chapter-card-title">${escapeHtml(ch.bossName)}</h5>
                <div class="chapter-reward-row">
                  <span>+${ch.rewards.xp} XP</span>
                  <span>+${ch.rewards.gold} Gold</span>
                  ${rewardItem ? `<span class="reward-loot-pill">${rewardItem.name}</span>` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

/* ─── 2. Bazaar & Armory View ───────────────────────────────── */
function renderShopView(hero) {
  const items = getItemsByCategory(activeShopCategory);

  return `
    <div class="shop-dashboard-view">
      <!-- Category Filter Tabs -->
      <div class="shop-categories-nav">
        <button class="shop-cat-btn ${activeShopCategory === "all" ? "active" : ""}" data-shop-cat="all">All</button>
        ${ITEM_CATEGORIES.map(
          (cat) => `
          <button class="shop-cat-btn ${activeShopCategory === cat.id ? "active" : ""}" data-shop-cat="${cat.id}">
            ${cat.label}
          </button>
        `,
        ).join("")}
      </div>

      <!-- Catalog Cards Grid -->
      <div class="shop-items-grid">
        ${items
          .map((item) => {
            const isOwned =
              hero.inventory.includes(item.id) &&
              item.category !== "consumable";
            const isEquipped = hero.equipped[item.category]?.id === item.id;
            const canAfford = hero.gold >= item.cost;

            return `
            <div class="shop-item-card rarity-${item.rarity}">
              <div class="shop-card-top">
                <span class="item-cat-badge">${item.category}</span>
                <span class="item-rarity-badge">${item.rarity}</span>
              </div>
              <h4 class="shop-item-name">${escapeHtml(item.name)}</h4>
              <p class="shop-item-perk">${escapeHtml(item.perk)}</p>
              <p class="shop-item-lore">"${escapeHtml(item.lore)}"</p>
              
              <div class="shop-card-bottom">
                <span class="shop-price-tag ${canAfford ? "" : "insufficient"}">
                  ${getIcon("coins", { size: 14 })} ${item.cost}g
                </span>
                ${
                  isEquipped
                    ? `<span class="shop-btn-status equipped">Equipped</span>`
                    : isOwned
                      ? `<button class="button shop-equip-btn" data-equip-item="${item.id}">Equip</button>`
                      : `<button class="button shop-buy-btn ${canAfford ? "" : "disabled"}" data-buy-item="${item.id}" ${canAfford ? "" : "disabled"}>
                          Buy & Equip
                        </button>`
                }
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/* ─── 3. Inventory View ─────────────────────────────────────── */
function renderInventoryView(hero) {
  const ownedItems = hero.inventory
    .map((id) => getItemById(id))
    .filter((it) => it && it.id !== "c_none" && it.id !== "o_none" && it.id !== "m_none");

  if (ownedItems.length === 0) {
    return `
      <div class="empty-inventory-message">
        <p>Your armory pouch is empty. Visit the Bazaar to purchase weapons, armor, and mounts!</p>
      </div>
    `;
  }

  return `
    <div class="inventory-grid">
      ${ownedItems
        .map((item) => {
          const isEquipped = hero.equipped[item.category]?.id === item.id;
          return `
          <div class="inventory-item-card rarity-${item.rarity}">
            <div class="inv-header">
              <span class="item-cat-badge">${item.category}</span>
              <span class="item-rarity-badge">${item.rarity}</span>
            </div>
            <h4 class="inv-item-name">${escapeHtml(item.name)}</h4>
            <p class="inv-item-perk">${escapeHtml(item.perk)}</p>
            <div class="inv-footer">
              ${
                isEquipped
                  ? `<span class="shop-btn-status equipped">Equipped</span>`
                  : `<button class="button inv-equip-btn" data-equip-item="${item.id}">Equip</button>`
              }
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/* ─── Character Creator Modal Controller ────────────────────── */
function bindCreatorModal() {
  const openBtn = document.getElementById("open-character-creator-btn");
  const modal = document.getElementById("character-creator-modal");
  const closeBtn = document.getElementById("close-creator-btn");
  const body = document.getElementById("creator-modal-body");

  if (!openBtn || !modal || !body) return;

  openBtn.addEventListener("click", () => {
    openCharacterCreator();
  });

  closeBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

export function openCharacterCreator() {
  const modal = document.getElementById("character-creator-modal");
  const body = document.getElementById("creator-modal-body");
  if (!modal || !body) return;

  const hero = getHero();
  let tempHero = {
    name: hero.name || "Kaelen Timeweaver",
    archetype: hero.archetype || "knight",
    hairStyle: hero.hairStyle || "short",
    hairColor: hero.hairColor || "#38bdf8",
    skinTone: hero.skinTone || "#fcd34d",
    equipped: { ...hero.equipped },
  };

  const updatePreview = () => {
    const previewContainer = document.getElementById("creator-live-preview");
    if (previewContainer) {
      previewContainer.innerHTML = renderHeroPaperDoll(tempHero, { size: 180 });
    }
  };

  body.innerHTML = `
    <div class="creator-layout-grid">
      <!-- Live Preview -->
      <div class="creator-preview-col">
        <div class="creator-preview-canvas" id="creator-live-preview">
          ${renderHeroPaperDoll(tempHero, { size: 180 })}
        </div>
        <button class="button random-name-btn" id="creator-random-name-btn">
          ${getIcon("refresh", { size: 14 })} Random Name
        </button>
      </div>

      <!-- Customization Form Controls -->
      <div class="creator-controls-col">
        <div class="creator-field">
          <label>Hero Name</label>
          <input type="text" id="creator-input-name" class="new-input creator-input" value="${escapeHtml(tempHero.name)}" maxlength="30" />
        </div>

        <div class="creator-field">
          <label>Class Archetype</label>
          <div class="creator-archetypes-grid">
            ${Object.values(ARCHETYPES)
              .map(
                (arch) => `
              <button class="creator-class-card ${tempHero.archetype === arch.id ? "selected" : ""}" data-pick-class="${arch.id}">
                <strong>${arch.name}</strong>
                <span class="class-desc-tiny">${arch.description}</span>
              </button>
            `,
              )
              .join("")}
          </div>
        </div>

        <div class="creator-field-row">
          <div class="creator-field half">
            <label>Hairstyle</label>
            <select id="creator-select-hair" class="setting-select">
              <option value="short" ${tempHero.hairStyle === "short" ? "selected" : ""}>Short Crop</option>
              <option value="flowing" ${tempHero.hairStyle === "flowing" ? "selected" : ""}>Flowing Locks</option>
              <option value="spiky" ${tempHero.hairStyle === "spiky" ? "selected" : ""}>Spiky Adventurer</option>
              <option value="cowl" ${tempHero.hairStyle === "cowl" ? "selected" : ""}>Mage Cowl</option>
            </select>
          </div>

          <div class="creator-field half">
            <label>Skin Tone</label>
            <select id="creator-select-skin" class="setting-select">
              <option value="#fcd34d" ${tempHero.skinTone === "#fcd34d" ? "selected" : ""}>Warm Gold</option>
              <option value="#fed7aa" ${tempHero.skinTone === "#fed7aa" ? "selected" : ""}>Light Peach</option>
              <option value="#d97706" ${tempHero.skinTone === "#d97706" ? "selected" : ""}>Deep Bronze</option>
              <option value="#78350f" ${tempHero.skinTone === "#78350f" ? "selected" : ""}>Ebony Earth</option>
              <option value="#38bdf8" ${tempHero.skinTone === "#38bdf8" ? "selected" : ""}>Astral Cyan</option>
            </select>
          </div>
        </div>

        <div class="creator-actions">
          <button class="button save-hero-btn" id="confirm-create-hero-btn">
            ${getIcon("sword", { size: 14 })} Save & Begin Journey
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");

  // Bind live preview events
  const nameInput = document.getElementById("creator-input-name");
  nameInput?.addEventListener("input", (e) => {
    tempHero.name = e.target.value;
  });

  const randBtn = document.getElementById("creator-random-name-btn");
  randBtn?.addEventListener("click", () => {
    const randomPick =
      RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    tempHero.name = randomPick;
    if (nameInput) nameInput.value = randomPick;
  });

  body.querySelectorAll("[data-pick-class]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const clsId = btn.getAttribute("data-pick-class");
      tempHero.archetype = clsId;
      body
        .querySelectorAll("[data-pick-class]")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      updatePreview();
    });
  });

  document
    .getElementById("creator-select-hair")
    ?.addEventListener("change", (e) => {
      tempHero.hairStyle = e.target.value;
      updatePreview();
    });

  document
    .getElementById("creator-select-skin")
    ?.addEventListener("change", (e) => {
      tempHero.skinTone = e.target.value;
      updatePreview();
    });

  document
    .getElementById("confirm-create-hero-btn")
    ?.addEventListener("click", () => {
      createCharacter({
        name: tempHero.name,
        archetype: tempHero.archetype,
        hairStyle: tempHero.hairStyle,
        hairColor: tempHero.hairColor,
        skinTone: tempHero.skinTone,
      });
      modal.classList.add("hidden");
      renderHeroDashboard();
    });
}

/* ─── Event Binding Helpers ─────────────────────────────────── */
function bindTabButtons() {
  const container = document.getElementById("hero-container");
  if (!container) return;

  container.querySelectorAll("[data-hero-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTab = btn.getAttribute("data-hero-tab");
      renderHeroDashboard();
    });
  });

  container.querySelector("#hero-launch-tactics-btn")?.addEventListener("click", () => {
    document.querySelector(".view-controls [data-view='tactics']")?.click();
  });
}

function bindSlotButtons() {
  const container = document.getElementById("hero-container");
  if (!container) return;

  container.querySelectorAll("[data-slot-category]").forEach((slot) => {
    slot.addEventListener("click", () => {
      const category = slot.getAttribute("data-slot-category");
      activeShopCategory = category;
      activeTab = "shop";
      renderHeroDashboard();
    });
  });
}

function bindShopButtons() {
  const container = document.getElementById("hero-container");
  if (!container) return;

  container.querySelectorAll("[data-shop-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeShopCategory = btn.getAttribute("data-shop-cat");
      renderHeroDashboard();
    });
  });

  container.querySelectorAll("[data-buy-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemId = btn.getAttribute("data-buy-item");
      buyItem(itemId);
      renderHeroDashboard();
    });
  });

  container.querySelectorAll("[data-equip-item]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemId = btn.getAttribute("data-equip-item");
      equipItem(itemId);
      renderHeroDashboard();
    });
  });
}

function bindInventoryButtons() {
  const container = document.getElementById("hero-container");
  if (!container) return;

  container.querySelectorAll(".inv-equip-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const itemId = btn.getAttribute("data-equip-item");
      equipItem(itemId);
      renderHeroDashboard();
    });
  });
}

function bindQuestControls() {
  const toggle = document.getElementById("story-mode-toggle");
  toggle?.addEventListener("change", (e) => {
    setStoryMode(e.target.checked);
    const dialogueCard = document.getElementById("narrative-dialogue-card");
    if (dialogueCard) {
      dialogueCard.style.display = e.target.checked ? "flex" : "none";
    }
  });
}

function setupUIEventListeners() {
  document.addEventListener("hero-updated", () => {
    if (document.getElementById("hero-container") && !document.getElementById("hero-container").classList.contains("hidden")) {
      renderHeroDashboard();
    }
  });

  document.addEventListener("boss-damaged", () => {
    if (document.getElementById("hero-container") && !document.getElementById("hero-container").classList.contains("hidden")) {
      renderHeroDashboard();
    }
  });
}

