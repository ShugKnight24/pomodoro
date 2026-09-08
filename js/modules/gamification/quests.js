/**
 * quests.js — Narrative Quest Engine & Boss Battle System
 * Episodic chapters, story mode opt-out toggle, and boss combat logic.
 */

"use strict";

import { showSuccess } from "../toast.js";

const STORAGE_KEY = "pomidor.quests";

export const CHAPTERS = [
  {
    id: "ch_1",
    title: "Chapter 1: The Mists of Procrastination",
    bossId: "shade_delay",
    bossName: "Shade of Delay",
    bossMaxHP: 150,
    lore: "Thick purple mists roll across Chrono Valley. The Shade of Delay feeds on unfinished plans and wandering attention.",
    dialogue: {
      intro: "Greetings, young Chrono-Knight! I am Chronos, Guardian Owl of the Hourglass. The Shade of Delay has cast a fog over the valley. Every completed task and pomodoro cycle channels temporal energy to dispel it!",
      victory: "Magnificent! The fog clears and the sun breaks through! You have earned the Cape of the Novice and the valley breathes anew.",
    },
    objectives: [
      { id: "poms", label: "Complete 3 Pomodoro Focus Sessions", target: 3 },
      { id: "tasks", label: "Check off 5 Tasks", target: 5 },
      { id: "habits", label: "Check 1 Daily Habit", target: 1 },
    ],
    rewards: {
      xp: 200,
      gold: 100,
      itemDrop: "c_traveler_cloak",
    },
  },
  {
    id: "ch_2",
    title: "Chapter 2: The Lair of the Sloth Drake",
    bossId: "sloth_drake",
    bossName: "The Sloth Drake",
    bossMaxHP: 300,
    lore: "A titanic dragon sleeps across the road to the Citadel, snoring softly: 'There is always tomorrow... rest now...'",
    dialogue: {
      intro: "Hark! The Sloth Drake has blocked the high road. Its hypnotic snores tempt even the most disciplined workers. Keep your habit streaks alive to pierce its heavy slumber!",
      victory: "A thunderous yawn, and the Drake yields! It sheds its emerald scales in respect for your iron discipline.",
    },
    objectives: [
      { id: "poms", label: "Complete 6 Pomodoros", target: 6 },
      { id: "tasks", label: "Complete 8 Tasks", target: 8 },
      { id: "habits", label: "Log 2 Habits", target: 2 },
    ],
    rewards: {
      xp: 400,
      gold: 200,
      itemDrop: "m_battle_wolf",
    },
  },
  {
    id: "ch_3",
    title: "Chapter 3: The Clockwork Citadel Under Siege",
    bossId: "gear_automaton",
    bossName: "Gear-Eater Automaton",
    bossMaxHP: 500,
    lore: "Rogue cogwheels and runaway gears threaten to freeze time across the entire kingdom.",
    dialogue: {
      intro: "The grand clocktower's gears are jamming! The Gear-Eater Automaton devours structured routines. Strike it down with precision checklists and subtask execution!",
      victory: "The great gears align and chime in harmonic unison! The citadel artisans present you with a mastercrafted Bronze Clockwork Steed!",
    },
    objectives: [
      { id: "poms", label: "Complete 10 Pomodoros", target: 10 },
      { id: "tasks", label: "Complete 12 Tasks or Subtasks", target: 12 },
      { id: "habits", label: "Maintain habits for 3 days", target: 3 },
    ],
    rewards: {
      xp: 750,
      gold: 350,
      itemDrop: "m_clockwork_steed",
    },
  },
  {
    id: "ch_4",
    title: "Chapter 4: The Void of Tomorrow",
    bossId: "tomorrow_phantom",
    bossName: "The Tomorrow Phantom",
    bossMaxHP: 800,
    lore: "The ultimate cosmic phantom that whispers infinite delays from the edge of time.",
    dialogue: {
      intro: "Behold the final frontier! The Tomorrow Phantom thrives on 'someday'. Prove to the cosmos that the only time that exists is NOW!",
      victory: "You have conquered the Void! The Crown of the Epoch descends upon your brow. You are a legendary Time Sovereign!",
    },
    objectives: [
      { id: "poms", label: "Complete 15 Pomodoros", target: 15 },
      { id: "tasks", label: "Complete 20 Tasks", target: 20 },
      { id: "habits", label: "5 Daily Habit Completions", target: 5 },
    ],
    rewards: {
      xp: 1200,
      gold: 600,
      itemDrop: "m_celestial_griffin",
    },
  },
];

let questState = {
  currentChapterId: "ch_1",
  bossCurrentHP: 150,
  storyMode: true, // Narrative opt-out switch
  completedChapters: [],
  dialogueHistory: [],
};

export function initQuests() {
  loadQuestState();
}

function loadQuestState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      questState = { ...questState, ...JSON.parse(saved) };
    } else {
      const firstChapter = CHAPTERS[0];
      questState.bossCurrentHP = firstChapter.bossMaxHP;
      saveQuestState();
    }
  } catch (e) {
    console.error("Failed to load quests:", e);
  }
}

export function saveQuestState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questState));
  } catch (e) {
    console.error("Failed to save quests:", e);
  }
}

export function getQuestState() {
  return questState;
}

export function getCurrentChapter() {
  return (
    CHAPTERS.find((ch) => ch.id === questState.currentChapterId) || CHAPTERS[0]
  );
}

export function setStoryMode(enabled) {
  questState.storyMode = !!enabled;
  saveQuestState();
  document.dispatchEvent(
    new CustomEvent("story-mode-changed", { detail: { storyMode: questState.storyMode } }),
  );
}

/**
 * Deal damage to active chapter boss
 * @param {number} damage - Hitpoints to deduct
 * @returns {object} { damageDealt, bossDefeated, remainingHP }
 */
export function damageActiveBoss(damage) {
  const currentChapter = getCurrentChapter();
  if (!currentChapter) return { damageDealt: 0, bossDefeated: false };

  const actualDamage = Math.max(1, Math.round(damage));
  questState.bossCurrentHP = Math.max(0, questState.bossCurrentHP - actualDamage);
  const bossDefeated = questState.bossCurrentHP === 0;

  if (bossDefeated) {
    handleBossDefeat(currentChapter);
  }

  saveQuestState();

  document.dispatchEvent(
    new CustomEvent("boss-damaged", {
      detail: {
        damage: actualDamage,
        remainingHP: questState.bossCurrentHP,
        maxHP: currentChapter.bossMaxHP,
        bossDefeated,
        bossName: currentChapter.bossName,
      },
    }),
  );

  return {
    damageDealt: actualDamage,
    bossDefeated,
    remainingHP: questState.bossCurrentHP,
  };
}

function handleBossDefeat(chapter) {
  if (!questState.completedChapters.includes(chapter.id)) {
    questState.completedChapters.push(chapter.id);
  }

  showSuccess(`VICTORY! ${chapter.bossName} has been vanquished!`);

  // Award rewards via hero event
  document.dispatchEvent(
    new CustomEvent("quest-chapter-completed", {
      detail: {
        chapter,
        rewards: chapter.rewards,
      },
    }),
  );

  // Advance to next chapter if available
  const currentIndex = CHAPTERS.findIndex((c) => c.id === chapter.id);
  if (currentIndex < CHAPTERS.length - 1) {
    const nextChapter = CHAPTERS[currentIndex + 1];
    questState.currentChapterId = nextChapter.id;
    questState.bossCurrentHP = nextChapter.bossMaxHP;
  } else {
    // Loop / end-game mode: reset boss HP with 1.5x multiplier
    questState.bossCurrentHP = Math.round(chapter.bossMaxHP * 1.5);
  }

  saveQuestState();
}
