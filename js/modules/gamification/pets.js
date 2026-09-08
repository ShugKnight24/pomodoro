/**
 * pets.js — Pet Companion & Tactical Unit System
 * Manage pet discovery, hatching, leveling, bonding, and tactical combat skills.
 */

"use strict";

const STORAGE_KEY = "pomidor.pets";

export const PET_CATALOG = {
  pet_chrono_pup: {
    id: "pet_chrono_pup",
    name: "Chrono Pup",
    species: "Temporal Hound",
    element: "time",
    baseHp: 80,
    baseAtk: 22,
    baseDef: 12,
    baseSpd: 18,
    moveRange: 3,
    attackRange: 1,
    skill: {
      name: "Haste Bark",
      cost: 2,
      range: 2,
      description: "Grants +2 AP and +3 Speed to all allies for 2 turns.",
    },
    passive: "+10% XP gained during Pomodoro focus sessions",
    lore: "Born from the swirls of the hourglass. Always eager to fetch lost moments.",
    unlocked: true, // Starter pet!
    color: "#38bdf8",
  },
  pet_ember_drake: {
    id: "pet_ember_drake",
    name: "Ember Drake",
    species: "Pyre Wyrm",
    element: "fire",
    baseHp: 95,
    baseAtk: 32,
    baseDef: 10,
    baseSpd: 14,
    moveRange: 2,
    attackRange: 2,
    skill: {
      name: "Pyroclast",
      cost: 3,
      range: 3,
      description: "Blasts target and adjacent tiles for 45 Fire damage.",
    },
    passive: "+15% extra damage to bosses upon task completion",
    lore: "Feeds on passionate sparks of inspiration. Its breath can smelt raw ore.",
    unlocked: true,
    color: "#ef4444",
  },
  pet_moss_golem: {
    id: "pet_moss_golem",
    name: "Moss Golem",
    species: "Stone Guardian",
    element: "nature",
    baseHp: 130,
    baseAtk: 18,
    baseDef: 24,
    baseSpd: 8,
    moveRange: 2,
    attackRange: 1,
    skill: {
      name: "Granite Shield",
      cost: 2,
      range: 2,
      description: "Creates an earthen barrier absorbing up to 50 damage on an ally.",
    },
    passive: "Protects your habit streak from breaking once per week",
    lore: "Assembled from ancient cobblestones and resilient mountain moss.",
    unlocked: false,
    color: "#10b981",
  },
  pet_aether_fox: {
    id: "pet_aether_fox",
    name: "Aether Fox",
    species: "Prismatic Kitsune",
    element: "arcane",
    baseHp: 75,
    baseAtk: 28,
    baseDef: 11,
    baseSpd: 22,
    moveRange: 4,
    attackRange: 1,
    skill: {
      name: "Phase Blink",
      cost: 2,
      range: 3,
      description: "Teleports to an open tile and delivers an automatic critical strike.",
    },
    passive: "+25% Gold drops from all tasks and exploration chests",
    lore: "Steps between dimensions. Leaves behind a faint trail of lavender stardust.",
    unlocked: false,
    color: "#a855f7",
  },
  pet_frost_owl: {
    id: "pet_frost_owl",
    name: "Frost Owl",
    species: "Glacial Strigid",
    element: "ice",
    baseHp: 85,
    baseAtk: 24,
    baseDef: 14,
    baseSpd: 16,
    moveRange: 3,
    attackRange: 3,
    skill: {
      name: "Blizzard Vortex",
      cost: 3,
      range: 3,
      description: "Freezes the target enemy for 1 turn and deals 30 Ice damage.",
    },
    passive: "Restores +15 extra Resolve (HP) during break periods",
    lore: "Glides silently across the tundra. Its icy gaze stops foes in their tracks.",
    unlocked: false,
    color: "#67e8f9",
  },
  pet_voidling: {
    id: "pet_voidling",
    name: "Voidling",
    species: "Abyssal Sprite",
    element: "void",
    baseHp: 90,
    baseAtk: 30,
    baseDef: 12,
    baseSpd: 17,
    moveRange: 3,
    attackRange: 2,
    skill: {
      name: "Gravitational Pull",
      cost: 2,
      range: 4,
      description: "Drags target enemy 2 tiles closer and reduces their DEF by 20%.",
    },
    passive: "+20% higher chance to uncover rare artifacts in dungeons",
    lore: "A curious creature born of deep space. Friendly despite its cosmic origin.",
    unlocked: false,
    color: "#c084fc",
  },
};

let petsState = {
  pets: {},
  activePetIds: ["pet_chrono_pup", "pet_ember_drake"], // Equipped into tactical squad (max 2 + Hero = 3)
  treats: 5,
};

export function initPets() {
  loadPets();
  setupPetEventListeners();
}

function loadPets() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      petsState = {
        pets: parsed.pets || {},
        activePetIds: parsed.activePetIds || ["pet_chrono_pup", "pet_ember_drake"],
        treats: parsed.treats !== undefined ? parsed.treats : 5,
      };
    }
  } catch (e) {
    console.warn("Error loading pets state:", e);
  }

  // Hydrate with all catalog entries
  for (const [id, def] of Object.entries(PET_CATALOG)) {
    if (!petsState.pets[id]) {
      petsState.pets[id] = {
        id,
        level: 1,
        xp: 0,
        maxXp: 100,
        bond: 20,
        unlocked: def.unlocked,
      };
    }
  }
  savePets();
}

export function savePets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(petsState));
    document.dispatchEvent(new CustomEvent("pets-updated", { detail: petsState }));
  } catch (e) {
    console.warn("Error saving pets state:", e);
  }
}

export function getAllPets() {
  return Object.keys(PET_CATALOG).map((id) => getPetDetails(id));
}

export function getPetDetails(id) {
  const def = PET_CATALOG[id];
  if (!def) return null;
  const data = petsState.pets[id] || { level: 1, xp: 0, maxXp: 100, bond: 20, unlocked: def.unlocked };

  const lvl = data.level;
  return {
    ...def,
    ...data,
    hp: Math.round(def.baseHp * (1 + (lvl - 1) * 0.15)),
    maxHp: Math.round(def.baseHp * (1 + (lvl - 1) * 0.15)),
    atk: Math.round(def.baseAtk * (1 + (lvl - 1) * 0.12)),
    def: Math.round(def.baseDef * (1 + (lvl - 1) * 0.1)),
    spd: def.baseSpd + Math.floor(lvl / 3),
  };
}

export function getActiveSquadPets() {
  return petsState.activePetIds.map((id) => getPetDetails(id)).filter(Boolean);
}

export function setActiveSquadPets(petIds) {
  petsState.activePetIds = petIds.slice(0, 2);
  savePets();
}

export function unlockPet(id) {
  if (petsState.pets[id]) {
    petsState.pets[id].unlocked = true;
    savePets();
    document.dispatchEvent(new CustomEvent("pet-unlocked", { detail: { petId: id } }));
    return true;
  }
  return false;
}

export function feedPet(id) {
  if (petsState.treats <= 0) return { success: false, message: "No treats remaining!" };
  const pet = petsState.pets[id];
  if (!pet || !pet.unlocked) return { success: false, message: "Pet not found or locked" };

  petsState.treats--;
  pet.bond = Math.min(100, pet.bond + 15);
  gainPetXp(id, 45);
  savePets();
  return { success: true, bond: pet.bond, treats: petsState.treats };
}

export function gainPetXp(id, amount) {
  const pet = petsState.pets[id];
  if (!pet) return;

  pet.xp += amount;
  while (pet.xp >= pet.maxXp) {
    pet.xp -= pet.maxXp;
    pet.level++;
    pet.maxXp = Math.round(100 * Math.pow(1.3, pet.level - 1));
    document.dispatchEvent(new CustomEvent("pet-level-up", { detail: { petId: id, level: pet.level } }));
  }
  savePets();
}

export function awardTacticalTreats(count) {
  petsState.treats += count;
  savePets();
}

export function getTreatsCount() {
  return petsState.treats;
}

function setupPetEventListeners() {
  // Focus Pomodoro Complete: Award Squad Pets XP & Bond
  document.addEventListener("pomodoro-complete", () => {
    petsState.activePetIds.forEach((id) => {
      gainPetXp(id, 60);
      if (petsState.pets[id]) {
        petsState.pets[id].bond = Math.min(100, petsState.pets[id].bond + 2);
      }
    });
    // Chance to discover a treat or pet egg
    if (Math.random() < 0.45) {
      awardTacticalTreats(1);
    }
  });

  // Task Complete: Award Pet XP
  document.addEventListener("task-complete", () => {
    petsState.activePetIds.forEach((id) => gainPetXp(id, 30));
  });
}

/**
 * Procedural SVG Vector Sprite for Pets
 */
export function renderPetSvg(petId, size = 64) {
  switch (petId) {
    case "pet_chrono_pup":
      return `
        <svg class="pet-vector-svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.2)"/>
          <!-- Pup Body -->
          <ellipse cx="32" cy="38" rx="16" ry="14" fill="#38bdf8"/>
          <!-- Floppy Ears -->
          <path d="M18 22 Q12 34 18 40" stroke="#0284c7" stroke-width="5" stroke-linecap="round"/>
          <path d="M46 22 Q52 34 46 40" stroke="#0284c7" stroke-width="5" stroke-linecap="round"/>
          <!-- Head -->
          <circle cx="32" cy="28" r="14" fill="#7dd3fc"/>
          <!-- Snout & Nose -->
          <ellipse cx="32" cy="32" rx="6" ry="4" fill="#ffffff"/>
          <polygon points="30,30 34,30 32,33" fill="#0f172a"/>
          <!-- Eyes -->
          <circle cx="27" cy="26" r="2.5" fill="#0f172a"/>
          <circle cx="37" cy="26" r="2.5" fill="#0f172a"/>
          <!-- Temporal Collar Charm -->
          <circle cx="32" cy="43" r="4" fill="#fbbf24"/>
          <line x1="32" y1="41" x2="32" y2="43" stroke="#78350f" stroke-width="1"/>
          <!-- Wagging Tail -->
          <path d="M44 42 Q54 36 50 26" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/>
        </svg>
      `;
    case "pet_ember_drake":
      return `
        <svg class="pet-vector-svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.2)"/>
          <!-- Wings -->
          <path d="M26 34 L12 20 L24 28 Z" fill="#b91c1c"/>
          <path d="M38 34 L52 20 L40 28 Z" fill="#b91c1c"/>
          <!-- Drake Body -->
          <ellipse cx="32" cy="38" rx="14" ry="15" fill="#ef4444"/>
          <ellipse cx="32" cy="40" rx="9" ry="10" fill="#fef08a"/>
          <!-- Head & Horns -->
          <polygon points="24,18 20,8 28,15" fill="#ca8a04"/>
          <polygon points="40,18 44,8 36,15" fill="#ca8a04"/>
          <circle cx="32" cy="26" r="12" fill="#ef4444"/>
          <!-- Eyes -->
          <circle cx="27" cy="24" r="2.5" fill="#facc15"/>
          <circle cx="37" cy="24" r="2.5" fill="#facc15"/>
          <!-- Tail with flame -->
          <path d="M42 44 Q56 46 54 34" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
          <circle cx="55" cy="32" r="4" fill="#f97316"/>
          <circle cx="55" cy="32" r="2" fill="#fde047"/>
        </svg>
      `;
    case "pet_moss_golem":
      return `
        <svg class="pet-vector-svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="56" rx="18" ry="4" fill="rgba(0,0,0,0.2)"/>
          <rect x="20" y="24" width="24" height="26" rx="8" fill="#475569"/>
          <!-- Moss patches -->
          <ellipse cx="26" cy="26" rx="6" ry="4" fill="#10b981"/>
          <ellipse cx="38" cy="38" rx="5" ry="4" fill="#059669"/>
          <circle cx="28" cy="34" r="3" fill="#34d399"/>
          <circle cx="36" cy="34" r="3" fill="#34d399"/>
          <!-- Stone arms -->
          <rect x="12" y="30" width="8" height="16" rx="4" fill="#334155"/>
          <rect x="44" y="30" width="8" height="16" rx="4" fill="#334155"/>
          <!-- Sprout on head -->
          <path d="M32 24 Q30 16 36 12 Q36 18 32 24" fill="#10b981"/>
        </svg>
      `;
    default:
      return `
        <svg class="pet-vector-svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="56" rx="16" ry="4" fill="rgba(0,0,0,0.2)"/>
          <circle cx="32" cy="34" r="16" fill="#a855f7"/>
          <circle cx="27" cy="32" r="3" fill="#ffffff"/>
          <circle cx="37" cy="32" r="3" fill="#ffffff"/>
          <polygon points="30,36 34,36 32,39" fill="#f43f5e"/>
        </svg>
      `;
  }
}
