/**
 * tacticsExploration.js — World Map, Dungeons & Towers Exploration Engine
 * Generates encounters, manages dungeon floors, tower progression, and treasure chests.
 */

"use strict";

import { unlockPet, awardTacticalTreats } from "./pets.js";
import { gainGold, gainXp } from "./hero.js";

const EXPLORATION_STORAGE_KEY = "pomidor.tacticsExploration";

export const WORLD_REGIONS = [
  {
    id: "region_meadow",
    name: "Whispering Meadow",
    difficulty: 1,
    levelReq: 1,
    description: "Sunlit rolling hills where temporal breezes blow gently. Home to wild Chrono Pups.",
    loot: ["Gold (40-80)", "Tactical Treats", "Wild Chrono Pup Egg"],
    nodes: [
      { id: "m_1", name: "Grassy Crossroads", type: "battle", enemyTier: 1 },
      { id: "m_2", name: "Forgotten Chest", type: "treasure", reward: { gold: 60, treats: 1 } },
      { id: "m_3", name: "Ancient Windmill", type: "shrine", healPct: 50 },
      { id: "m_4", name: "Meadow Den", type: "boss", enemyTier: 1.5, petReward: "pet_chrono_pup" },
    ],
  },
  {
    id: "region_clocktower",
    name: "The Sunken Clocktower",
    difficulty: 2,
    levelReq: 2,
    description: "Submerged brass cogs and clockwork corridors beneath the tranquil lake.",
    loot: ["Gold (100-180)", "Clockwork Gear", "Moss Golem Shard"],
    nodes: [
      { id: "c_1", name: "Flooded Gear Hall", type: "battle", enemyTier: 2 },
      { id: "c_2", name: "Brass Vault", type: "treasure", reward: { gold: 120, treats: 2 } },
      { id: "c_3", name: "Pendulum Chamber", type: "battle", enemyTier: 2.2 },
      { id: "c_4", name: "Mechanism Core", type: "boss", enemyTier: 2.5, petReward: "pet_moss_golem" },
    ],
  },
  {
    id: "region_peaks",
    name: "Prismatic Peaks",
    difficulty: 3,
    levelReq: 3,
    description: "Glacial spires that refract temporal energy into shimmering aurora crystals.",
    loot: ["Gold (200-350)", "Frost Relics", "Frost Owl Quill"],
    nodes: [
      { id: "p_1", name: "Frozen Ridge", type: "battle", enemyTier: 3 },
      { id: "p_2", name: "Crystal Cavern", type: "treasure", reward: { gold: 220, treats: 3 } },
      { id: "p_3", name: "Aurora Glade", type: "shrine", healPct: 100 },
      { id: "p_4", name: "Blizzard Peak", type: "boss", enemyTier: 3.5, petReward: "pet_frost_owl" },
    ],
  },
  {
    id: "region_caldera",
    name: "Obsidian Caldera",
    difficulty: 4,
    levelReq: 5,
    description: "Smoldering volcanic craters where magma wyrms guard ancient molten treasure.",
    loot: ["Gold (400-600)", "Dragon Scale", "Voidling Essence"],
    nodes: [
      { id: "o_1", name: "Slag River Crossing", type: "battle", enemyTier: 4 },
      { id: "o_2", name: "Magma Hoard", type: "treasure", reward: { gold: 450, treats: 4 } },
      { id: "o_3", name: "Dragon's Roost", type: "boss", enemyTier: 4.8, petReward: "pet_aether_fox" },
    ],
  },
];

export const TOWER_FLOORS = [
  { floor: 1, name: "Spire Foyer", enemyCount: 2, enemyLevel: 1, modifier: "Standard Engagement" },
  { floor: 2, name: "Hall of Echoes", enemyCount: 3, enemyLevel: 2, modifier: "Temporal Surge (+1 AP for all)" },
  { floor: 3, name: "Clockmaker's Loft", enemyCount: 3, enemyLevel: 3, modifier: "Grounded (Move Cost +1)" },
  { floor: 4, name: "Prism Observatory", enemyCount: 4, enemyLevel: 4, modifier: "Critical Focus (+20% Crit)" },
  { floor: 5, name: "Apex of the Epoch", enemyCount: 4, enemyLevel: 5, modifier: "Boss Chamber: Temporal Titan" },
];

let explorationState = {
  activeMode: "world", // 'world' | 'dungeon' | 'tower'
  selectedRegionId: "region_meadow",
  completedNodes: {},
  highestTowerFloor: 1,
  dungeonFloor: 1,
  dungeonRoomsCleared: 0,
  stats: {
    chestsOpened: 0,
    monstersDefeated: 0,
    towersConquered: 0,
  },
};

export function initExploration() {
  loadExplorationState();
}

function loadExplorationState() {
  try {
    const saved = localStorage.getItem(EXPLORATION_STORAGE_KEY);
    if (saved) {
      explorationState = { ...explorationState, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Failed to load exploration state:", e);
  }
}

export function saveExplorationState() {
  try {
    localStorage.setItem(EXPLORATION_STORAGE_KEY, JSON.stringify(explorationState));
    document.dispatchEvent(new CustomEvent("tactics-exploration-saved", { detail: explorationState }));
  } catch (e) {
    console.warn("Failed to save exploration state:", e);
  }
}

export function getExplorationState() {
  return { ...explorationState };
}

export function setExplorationMode(mode) {
  explorationState.activeMode = mode;
  saveExplorationState();
}

export function selectRegion(regionId) {
  explorationState.selectedRegionId = regionId;
  saveExplorationState();
}

export function openTreasureNode(node) {
  if (explorationState.completedNodes[node.id]) {
    return { success: false, message: "Chest already looted!" };
  }

  explorationState.completedNodes[node.id] = true;
  explorationState.stats.chestsOpened++;

  const gold = node.reward?.gold || 50;
  const treats = node.reward?.treats || 1;

  gainGold(gold);
  awardTacticalTreats(treats);
  gainXp(gold * 2);

  saveExplorationState();
  return { success: true, gold, treats };
}

export function completeNode(nodeId, petReward = null) {
  explorationState.completedNodes[nodeId] = true;
  explorationState.stats.monstersDefeated++;

  if (petReward) {
    unlockPet(petReward);
  }

  saveExplorationState();
}

export function advanceTowerFloor() {
  explorationState.highestTowerFloor++;
  explorationState.stats.towersConquered++;
  gainGold(150 * explorationState.highestTowerFloor);
  awardTacticalTreats(2);
  saveExplorationState();
}

export function advanceDungeonRoom() {
  explorationState.dungeonRoomsCleared++;
  if (explorationState.dungeonRoomsCleared % 3 === 0) {
    explorationState.dungeonFloor++;
  }
  saveExplorationState();
}

/**
 * Generate enemy team for tactical battle
 */
export function generateEnemySquad(tier = 1, count = 2) {
  const enemyTemplates = [
    {
      id: "enemy_chrono_goblin",
      name: "Chrono Goblin",
      element: "time",
      baseHp: 55,
      baseAtk: 18,
      baseDef: 8,
      baseSpd: 14,
      moveRange: 3,
      attackRange: 1,
    },
    {
      id: "enemy_void_phantom",
      name: "Void Phantom",
      element: "void",
      baseHp: 65,
      baseAtk: 24,
      baseDef: 10,
      baseSpd: 16,
      moveRange: 3,
      attackRange: 2,
    },
    {
      id: "enemy_clock_golem",
      name: "Cog Automaton",
      element: "nature",
      baseHp: 110,
      baseAtk: 20,
      baseDef: 22,
      baseSpd: 7,
      moveRange: 2,
      attackRange: 1,
    },
    {
      id: "enemy_fire_salamander",
      name: "Ash Salamander",
      element: "fire",
      baseHp: 80,
      baseAtk: 28,
      baseDef: 12,
      baseSpd: 13,
      moveRange: 2,
      attackRange: 2,
    },
  ];

  const squad = [];
  for (let i = 0; i < count; i++) {
    const template = enemyTemplates[i % enemyTemplates.length];
    const scale = 1 + (tier - 1) * 0.25;
    squad.push({
      id: `enemy_${i}_${Date.now()}`,
      name: `${template.name} Lv.${Math.round(tier)}`,
      element: template.element,
      hp: Math.round(template.baseHp * scale),
      maxHp: Math.round(template.baseHp * scale),
      atk: Math.round(template.baseAtk * scale),
      def: Math.round(template.baseDef * scale),
      spd: template.baseSpd + Math.floor(tier),
      moveRange: template.moveRange,
      attackRange: template.attackRange,
      skill: {
        name: "Shadow Strike",
        cost: 2,
        range: template.attackRange,
      },
    });
  }
  return squad;
}
