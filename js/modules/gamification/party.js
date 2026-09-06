/**
 * party.js — Final Fantasy Guild Tavern & Party Roster System
 * Manages recruited adventurers, job progression, squad deployment, and equipment.
 * Zero emojis, 100% SVG.
 */

"use strict";

import { getJob } from "./jobs.js";
import { getHero } from "./hero.js";
import { showSuccess, showError, showInfo } from "../toast.js";

const STORAGE_KEY = "pomidor.party";

const DEFAULT_PARTY_MEMBERS = [
  {
    id: "ally_sarah",
    name: "Sarah the White Mage",
    jobId: "white_mage",
    level: 2,
    hp: 120,
    maxHp: 120,
    mp: 60,
    maxMp: 60,
    jp: 150,
    recruited: true,
    equippedWeapon: "Silver Crook",
    equippedArmor: "White Silk Cloak",
    bio: "Compassionate sanctum cleric whose curative magics sustain allies through the direst trials.",
  },
  {
    id: "ally_vivi",
    name: "Vivi the Black Mage",
    jobId: "black_mage",
    level: 2,
    hp: 105,
    maxHp: 105,
    mp: 75,
    maxMp: 75,
    jp: 180,
    recruited: true,
    equippedWeapon: "Astral Rod",
    equippedArmor: "Midnight Robe",
    bio: "Curious scholar of the elemental cosmos capable of invoking devastating Fire and Ice cross-storms.",
  },
  {
    id: "ally_kain",
    name: "Kain the Dragoon",
    jobId: "dragoon",
    level: 1,
    hp: 140,
    maxHp: 140,
    mp: 35,
    maxMp: 35,
    jp: 90,
    recruited: false,
    cost: 120, // Gold
    equippedWeapon: "Wyvern Spear",
    equippedArmor: "Dragon Scale Plate",
    bio: "Proud high-altitude lancer whose aerial dive-bombs break enemy battlements with impunity.",
  },
  {
    id: "ally_locke",
    name: "Locke the Shadow Thief",
    jobId: "thief",
    level: 1,
    hp: 130,
    maxHp: 130,
    mp: 40,
    maxMp: 40,
    jp: 75,
    recruited: false,
    cost: 100, // Gold
    equippedWeapon: "Main Gauche",
    equippedArmor: "Shadow Hood & Tunic",
    bio: "Agile scout and treasure hunter who maneuvers through enemy lines to pickpocket gold.",
  },
  {
    id: "ally_lenna",
    name: "Lenna the Time Mage",
    jobId: "time_mage",
    level: 1,
    hp: 110,
    maxHp: 110,
    mp: 65,
    maxMp: 65,
    jp: 60,
    recruited: false,
    cost: 140, // Gold
    equippedWeapon: "Hourglass Scepter",
    equippedArmor: "Chrono Vestments",
    bio: "Enigmatic chronomancer manipulating the continuum to grant haste or freeze foes in place.",
  },
];

let partyState = {
  members: JSON.parse(JSON.stringify(DEFAULT_PARTY_MEMBERS)),
  activeSquadIds: ["hero", "ally_sarah", "ally_vivi"],
};

export function initParty() {
  loadParty();
}

function loadParty() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      partyState = {
        members: parsed.members && parsed.members.length > 0 ? parsed.members : JSON.parse(JSON.stringify(DEFAULT_PARTY_MEMBERS)),
        activeSquadIds: parsed.activeSquadIds || ["hero", "ally_sarah", "ally_vivi"],
      };
    } else {
      partyState = {
        members: JSON.parse(JSON.stringify(DEFAULT_PARTY_MEMBERS)),
        activeSquadIds: ["hero", "ally_sarah", "ally_vivi"],
      };
      saveParty();
    }
  } catch (e) {
    console.warn("Could not load party state:", e);
    partyState = {
      members: JSON.parse(JSON.stringify(DEFAULT_PARTY_MEMBERS)),
      activeSquadIds: ["hero", "ally_sarah", "ally_vivi"],
    };
  }
}

// Auto-initialize on module load
loadParty();

function saveParty() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partyState));
  } catch (e) {
    console.warn("Could not save party state:", e);
  }
}

export function getAllPartyMembers() {
  if (!partyState.members || partyState.members.length === 0) loadParty();
  return partyState.members;
}

export function getRecruitedMembers() {
  if (!partyState.members || partyState.members.length === 0) loadParty();
  return partyState.members.filter((m) => m.recruited);
}

export function getRecruitableCandidates() {
  if (!partyState.members || partyState.members.length === 0) loadParty();
  return partyState.members.filter((m) => !m.recruited);
}

export function recruitPartyMember(candidateId) {
  const member = partyState.members.find((m) => m.id === candidateId);
  if (!member || member.recruited) return false;

  const hero = getHero();
  const cost = member.cost || 100;
  if ((hero?.gold || 0) < cost) {
    showError(`Need ${cost} Gold to recruit ${member.name}! Complete tasks or focus sessions to earn Gold.`);
    return false;
  }

  // Deduct gold
  if (hero) {
    hero.gold -= cost;
    window.dispatchEvent(new CustomEvent("hero-updated", { detail: { hero } }));
  }

  member.recruited = true;

  // If squad has room (under 4 units), auto-add
  if (partyState.activeSquadIds.length < 4) {
    partyState.activeSquadIds.push(member.id);
  }

  saveParty();
  showSuccess(`Recruited ${member.name} to your Guild!`);
  window.dispatchEvent(new CustomEvent("party-updated", { detail: { partyState } }));
  return true;
}

export function getActiveSquadMembers() {
  const hero = getHero();
  const heroJobId = hero?.archetype === "mage" ? "black_mage" : hero?.archetype === "paladin" ? "knight" : hero?.archetype || "knight";
  const heroUnit = {
    id: "hero",
    name: hero?.name || "Hero",
    jobId: heroJobId,
    level: hero?.level || 1,
    hp: hero?.hp || 160,
    maxHp: hero?.maxHp || 160,
    mp: 50,
    maxMp: 50,
    jp: (hero?.level || 1) * 100,
    isLeader: true,
  };

  const units = [];
  for (const id of partyState.activeSquadIds) {
    if (id === "hero") {
      units.push(heroUnit);
    } else {
      const ally = partyState.members.find((m) => m.id === id && m.recruited);
      if (ally) {
        units.push(ally);
      }
    }
  }

  if (units.length === 0) units.push(heroUnit);
  return units;
}

export function setSquadUnit(index, unitId) {
  if (unitId === "empty") {
    partyState.activeSquadIds.splice(index, 1);
  } else {
    // Cannot duplicate unit in squad
    const filtered = partyState.activeSquadIds.filter((id) => id !== unitId);
    filtered.splice(index, 0, unitId);
    partyState.activeSquadIds = filtered.slice(0, 4);
  }

  // Ensure hero is always in squad
  if (!partyState.activeSquadIds.includes("hero")) {
    partyState.activeSquadIds.unshift("hero");
  }

  saveParty();
  window.dispatchEvent(new CustomEvent("party-updated", { detail: { partyState } }));
}
