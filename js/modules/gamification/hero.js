/**
 * hero.js — Core RPG Hero Progression, Economy & Event Dispatcher
 * Manages stats, leveling curve, equipment, inventory, and cross-module hooks.
 */

"use strict";

import { CATALOG, getItemById } from "./catalog.js";
import { damageActiveBoss, initQuests } from "./quests.js";
import { showSuccess, showError, showInfo } from "../toast.js";
import { getIcon } from "../../utils/icons.js";

const STORAGE_KEY = "pomidor.hero";

export const ARCHETYPES = {
  knight: {
    id: "knight",
    name: "Chrono Knight",
    title: "Defender of Time",
    description: "Disciplined warrior of the Aegis. High resolve and heavy strikes against procrastination.",
    startingWeapon: "w_iron_sword",
    startingArmor: "a_apprentice_tunic",
    startingHeadgear: "h_focus_band",
    baseHp: 120,
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    bossDamageBonus: 10,
  },
  mage: {
    id: "mage",
    name: "Aether Mage",
    title: "Weaver of Hours",
    description: "Scholar of temporal arts. Exceptional XP gains from deep focus and sustained streaks.",
    startingWeapon: "w_staff_aeons",
    startingArmor: "a_apprentice_tunic",
    startingHeadgear: "h_scholar_circlet",
    baseHp: 90,
    xpMultiplier: 1.25,
    goldMultiplier: 1.0,
    bossDamageBonus: 5,
  },
  rogue: {
    id: "rogue",
    name: "Shadow Rogue",
    title: "Checklist Striker",
    description: "Swift task eliminator. High gold drop rates and rapid execution of subtasks.",
    startingWeapon: "w_dual_daggers",
    startingArmor: "a_padded_leather",
    startingHeadgear: "h_focus_band",
    baseHp: 100,
    xpMultiplier: 1.05,
    goldMultiplier: 1.3,
    bossDamageBonus: 8,
  },
  paladin: {
    id: "paladin",
    name: "Solar Paladin",
    title: "Beacon of Diligence",
    description: "Radiant guardian. Daily habits replenish resolve and grant balanced rewards.",
    startingWeapon: "w_sun_halberd",
    startingArmor: "a_apprentice_tunic",
    startingHeadgear: "h_focus_band",
    baseHp: 110,
    xpMultiplier: 1.15,
    goldMultiplier: 1.15,
    bossDamageBonus: 7,
  },
};

let hero = null;

export function initHero() {
  loadHero();
  initQuests();
  setupEventListeners();
  updateHeaderBadge();
}

function getDefaultHero() {
  const defaultClass = ARCHETYPES.knight;
  return {
    name: "Kaelen Timeweaver",
    title: defaultClass.title,
    archetype: "knight",
    level: 1,
    xp: 0,
    maxXp: 100,
    hp: defaultClass.baseHp,
    maxHp: defaultClass.baseHp,
    gold: 80,
    hairStyle: "short",
    hairColor: "#38bdf8",
    skinTone: "#fcd34d",
    hasCreatedCharacter: false,
    equipped: {
      weapon: getItemById(defaultClass.startingWeapon),
      armor: getItemById(defaultClass.startingArmor),
      headgear: getItemById(defaultClass.startingHeadgear),
      cloak: getItemById("c_none"),
      offhand: getItemById("o_none"),
      mount: getItemById("m_none"),
    },
    inventory: [
      defaultClass.startingWeapon,
      defaultClass.startingArmor,
      defaultClass.startingHeadgear,
      "c_none",
      "o_none",
      "m_none",
    ],
    stats: {
      pomodorosCompleted: 0,
      tasksCompleted: 0,
      habitsCompleted: 0,
      totalGoldEarned: 80,
      totalXpEarned: 0,
    },
  };
}

function loadHero() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      hero = { ...getDefaultHero(), ...parsed };
      // Hydrate equipped objects from catalog in case of updates
      for (const slot of ["weapon", "armor", "headgear", "cloak", "offhand", "mount"]) {
        const itemObj = hero.equipped[slot];
        if (itemObj?.id) {
          hero.equipped[slot] = getItemById(itemObj.id) || itemObj;
        }
      }
      recalculateMaxHp();
    } else {
      hero = getDefaultHero();
      saveHero();
    }
  } catch (e) {
    console.error("Failed to load hero:", e);
    hero = getDefaultHero();
  }
}

export function saveHero() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hero));
    updateHeaderBadge();
  } catch (e) {
    console.error("Failed to save hero:", e);
  }
}

export function getHero() {
  if (!hero) loadHero();
  return hero;
}

export function recalculateMaxHp() {
  if (!hero) return;
  const arch = ARCHETYPES[hero.archetype] || ARCHETYPES.knight;
  let bonusHp = 0;
  for (const item of Object.values(hero.equipped)) {
    if (item?.hpBonus) bonusHp += item.hpBonus;
  }
  hero.maxHp = arch.baseHp + (hero.level - 1) * 15 + bonusHp;
  hero.hp = Math.min(hero.hp, hero.maxHp);
}

export function createCharacter({ name, archetype, hairStyle, hairColor, skinTone }) {
  const chosenClass = ARCHETYPES[archetype] || ARCHETYPES.knight;
  hero.name = name.trim() || "Chrono Knight";
  hero.archetype = chosenClass.id;
  hero.title = chosenClass.title;
  hero.hairStyle = hairStyle || "short";
  hero.hairColor = hairColor || "#38bdf8";
  hero.skinTone = skinTone || "#fcd34d";
  hero.hasCreatedCharacter = true;

  // Equip starter items for this archetype
  hero.equipped.weapon = getItemById(chosenClass.startingWeapon);
  hero.equipped.armor = getItemById(chosenClass.startingArmor);
  hero.equipped.headgear = getItemById(chosenClass.startingHeadgear);
  hero.equipped.cloak = getItemById("c_none");
  hero.equipped.offhand = getItemById("o_none");
  hero.equipped.mount = getItemById("m_none");

  // Add to inventory
  [
    chosenClass.startingWeapon,
    chosenClass.startingArmor,
    chosenClass.startingHeadgear,
  ].forEach((id) => {
    if (!hero.inventory.includes(id)) hero.inventory.push(id);
  });

  recalculateMaxHp();
  hero.hp = hero.maxHp;
  saveHero();

  showSuccess(`Welcome, ${hero.name} the ${chosenClass.name}! Your adventure begins.`);
  document.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  return hero;
}

export function gainXp(amount) {
  if (!hero) return;
  const arch = ARCHETYPES[hero.archetype] || ARCHETYPES.knight;
  let multiplier = arch.xpMultiplier;

  // Item multipliers
  for (const item of Object.values(hero.equipped)) {
    if (item?.xpBonus) multiplier += item.xpBonus;
  }

  const earned = Math.round(amount * multiplier);
  hero.xp += earned;
  hero.stats.totalXpEarned += earned;

  // Level Up Check
  while (hero.xp >= hero.maxXp) {
    hero.xp -= hero.maxXp;
    hero.level += 1;
    hero.maxXp = Math.round(100 * Math.pow(1.35, hero.level - 1));
    recalculateMaxHp();
    hero.hp = hero.maxHp; // Full heal on level up!
    showSuccess(`🌟 LEVEL UP! You reached Level ${hero.level}! (+15 Max HP, Full Heal)`);
    document.dispatchEvent(new CustomEvent("hero-level-up", { detail: { level: hero.level } }));
  }

  saveHero();
  document.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  return earned;
}

export function gainGold(amount) {
  if (!hero) return;
  const arch = ARCHETYPES[hero.archetype] || ARCHETYPES.knight;
  let multiplier = arch.goldMultiplier;

  for (const item of Object.values(hero.equipped)) {
    if (item?.goldBonus) multiplier += item.goldBonus;
  }

  const earned = Math.round(amount * multiplier);
  hero.gold += earned;
  hero.stats.totalGoldEarned += earned;

  saveHero();
  document.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  return earned;
}

export function healHero(amount) {
  if (!hero) return;
  const prev = hero.hp;
  hero.hp = Math.min(hero.maxHp, hero.hp + amount);
  const diff = hero.hp - prev;
  if (diff > 0) {
    saveHero();
    document.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  }
  return diff;
}

export function buyItem(itemId) {
  const item = getItemById(itemId);
  if (!item) return { success: false, message: "Item not found" };

  if (hero.inventory.includes(itemId) && item.category !== "consumable") {
    return { success: false, message: "You already own this item" };
  }

  if (hero.gold < item.cost) {
    return { success: false, message: "Not enough Chrono-Coins (Gold)" };
  }

  hero.gold -= item.cost;

  if (item.category === "consumable") {
    useConsumable(item);
  } else {
    hero.inventory.push(item.id);
    equipItem(item.id);
    showSuccess(`Purchased & equipped ${item.name}! ⚔️`);
  }

  saveHero();
  document.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  return { success: true, item };
}

export function equipItem(itemId) {
  const item = getItemById(itemId);
  if (!item) return false;

  const slot = item.category;
  if (!hero.equipped[slot] && slot !== "offhand" && slot !== "headgear") return false;

  hero.equipped[slot] = item;
  recalculateMaxHp();
  saveHero();
  showInfo(`Equipped ${item.name}`);
  document.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  return true;
}

export function useConsumable(item) {
  if (item.id === "p_willpower_elixir") {
    healHero(50);
    showSuccess("Drank Elixir of Willpower: +50 HP Restored! 🧪");
  } else if (item.id === "p_focus_potion") {
    showSuccess("Potion of Swift Focus active for your next Pomodoros! ⚡");
  } else if (item.id === "p_streak_shield") {
    showSuccess("Chrono-Shield Aegis active: habit streaks protected! 🛡️");
  }
}

/* ─── Floating Loot Animation ───────────────────────────────── */
export function triggerFloatingLoot(text, type = "loot") {
  const container = document.getElementById("floating-loot-container");
  if (!container) return;

  const floater = document.createElement("div");
  floater.className = `floating-loot-item ${type}`;
  floater.innerHTML = text;
  container.appendChild(floater);

  setTimeout(() => {
    floater.classList.add("fade-out");
    setTimeout(() => floater.remove(), 400);
  }, 2200);
}

/* ─── Header Mini Badge Sync ────────────────────────────────── */
function updateHeaderBadge() {
  const badge = document.getElementById("header-hero-badge");
  if (!badge || !hero) return;
  badge.innerHTML = `
    <span class="hero-level-chip">Lv.${hero.level}</span>
    <span class="hero-gold-chip">${getIcon("coins", { size: 14 })} ${hero.gold}g</span>
  `;
}

/* ─── Cross-Module Event Hooks ──────────────────────────────── */
function setupEventListeners() {
  // 1. Pomodoro Timer Complete
  document.addEventListener("pomodoro-complete", () => {
    const arch = ARCHETYPES[hero?.archetype] || ARCHETYPES.knight;
    const xpGained = gainXp(100);
    const goldGained = gainGold(25);
    healHero(10);
    const dmg = 30 + arch.bossDamageBonus;
    damageActiveBoss(dmg);

    hero.stats.pomodorosCompleted += 1;
    saveHero();

    triggerFloatingLoot(`+${xpGained} XP • +${goldGained} Gold • 💥 -${dmg} Boss HP!`, "pomodoro");
  });

  // 2. Task Complete
  document.addEventListener("task-complete", (e) => {
    const xpGained = gainXp(50);
    const goldGained = gainGold(15);
    damageActiveBoss(15);

    hero.stats.tasksCompleted += 1;
    saveHero();

    triggerFloatingLoot(`+${xpGained} XP • +${goldGained} Gold • ⚔️ -15 Boss HP`, "task");
  });

  // 3. Subtask Complete
  document.addEventListener("subtask-complete", () => {
    const xpGained = gainXp(15);
    const goldGained = gainGold(6);
    damageActiveBoss(5);
    saveHero();

    triggerFloatingLoot(`+${xpGained} XP • +${goldGained} Gold`, "subtask");
  });

  // 4. Habit Complete
  document.addEventListener("habit-completed", (e) => {
    const streak = e.detail?.streak || 1;
    const xpGained = gainXp(40 + Math.min(streak * 2, 20));
    const goldGained = gainGold(12);
    healHero(5);
    damageActiveBoss(15);

    hero.stats.habitsCompleted += 1;
    saveHero();

    triggerFloatingLoot(`+${xpGained} XP • +${goldGained} Gold • 🔥 ${streak}d Streak!`, "habit");
  });

  // 5. Daily Mood & Bandwidth Check-in
  document.addEventListener("mood-checked-in", () => {
    const xpGained = gainXp(30);
    const goldGained = gainGold(10);
    healHero(15);
    saveHero();

    triggerFloatingLoot(`+${xpGained} XP • +${goldGained} Gold • 💖 +15 HP Restored`, "mood");
  });

  // 6. Quest Chapter Completed
  document.addEventListener("quest-chapter-completed", (e) => {
    const { rewards } = e.detail || {};
    if (rewards) {
      if (rewards.xp) gainXp(rewards.xp);
      if (rewards.gold) gainGold(rewards.gold);
      if (rewards.itemDrop) {
        if (!hero.inventory.includes(rewards.itemDrop)) {
          hero.inventory.push(rewards.itemDrop);
          const dropItem = getItemById(rewards.itemDrop);
          if (dropItem) {
            showSuccess(`Loot Drop! Received ${dropItem.name} 🎁`);
            equipItem(dropItem.id);
          }
        }
      }
      saveHero();
    }
  });
}
