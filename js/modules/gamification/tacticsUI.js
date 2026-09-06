/**
 * tacticsUI.js — Complete Tactical RPG Battlefield & World Exploration UI
 * Renders the 7x7 grid, squad builder, pet bond manager, and exploration modes.
 */

"use strict";

import { getHero } from "./hero.js";
import {
  getAllPets,
  getActiveSquadPets,
  setActiveSquadPets,
  feedPet,
  renderPetSvg,
  getTreatsCount,
} from "./pets.js";
import { TacticsBattle, GRID_WIDTH, GRID_HEIGHT } from "./tacticsEngine.js";
import {
  WORLD_REGIONS,
  TOWER_FLOORS,
  getExplorationState,
  setExplorationMode,
  selectRegion,
  openTreasureNode,
  completeNode,
  advanceTowerFloor,
  advanceDungeonRoom,
  generateEnemySquad,
} from "./tacticsExploration.js";
import { showSuccess, showInfo, showError } from "../toast.js";
import { getIcon } from "../../utils/icons.js";

let currentBattle = null;
let selectedTile = null; // { x, y }
let activeCombatAction = "move"; // 'move' | 'attack' | 'skill'

export function initTacticsUI() {
  setupTacticsEventListeners();
  renderTacticsContainer();
}

export function renderTacticsContainer() {
  const container = document.getElementById("tactics-container");
  if (!container) return;

  const exploration = getExplorationState();

  container.innerHTML = `
    <!-- Tactics Top Navigation Header -->
    <div class="tactics-header-bar">
      <div class="tactics-title-group">
        <h2 class="tactics-main-title">${getIcon("sword", { size: 20 })} Tactics Arena & Chrono Realm</h2>
        <span class="tactics-subtitle">Assemble your squad, train pets, and conquer the realm!</span>
      </div>
      <div class="tactics-mode-tabs" id="tactics-modes-tabs">
        <button class="tactics-tab-btn ${exploration.activeMode === "world" ? "active" : ""}" data-tactics-mode="world">
          ${getIcon("map", { size: 15 })} World Map
        </button>
        <button class="tactics-tab-btn ${exploration.activeMode === "dungeon" ? "active" : ""}" data-tactics-mode="dungeon">
          ${getIcon("castle", { size: 15 })} Dungeons
        </button>
        <button class="tactics-tab-btn ${exploration.activeMode === "tower" ? "active" : ""}" data-tactics-mode="tower">
          ${getIcon("tower", { size: 15 })} Chrono Tower
        </button>
        <button class="tactics-tab-btn ${exploration.activeMode === "squad" ? "active" : ""}" data-tactics-mode="squad">
          ${getIcon("paw", { size: 15 })} Squad & Pets
        </button>
        <button class="tactics-tab-btn ${exploration.activeMode === "battle" ? "active" : ""}" data-tactics-mode="battle" id="btn-tab-battle">
          ${getIcon("sword", { size: 15 })} Battle Arena
        </button>
      </div>
    </div>

    <!-- Mode Body Container -->
    <div class="tactics-mode-body" id="tactics-mode-body">
      ${renderModeContent(exploration.activeMode)}
    </div>
  `;

  bindModeNavEvents(container);
  if (exploration.activeMode === "battle" && currentBattle) {
    bindBattleArenaEvents();
  }
}

function renderModeContent(mode) {
  switch (mode) {
    case "world":
      return renderWorldMapView();
    case "dungeon":
      return renderDungeonView();
    case "tower":
      return renderTowerView();
    case "squad":
      return renderSquadView();
    case "battle":
      return renderBattleArenaView();
    default:
      return renderWorldMapView();
  }
}

/* ─────────────────────────────────────────────────────────────
 * 1. SQUAD & PETS VIEW
 * ───────────────────────────────────────────────────────────── */
function renderSquadView() {
  const hero = getHero();
  const activePets = getActiveSquadPets();
  const allPets = getAllPets();
  const treats = getTreatsCount();

  return `
    <div class="tactics-squad-section" id="tactics-squad-panel">
      <!-- Active Squad Deployment -->
      <div class="tactics-card squad-roster-card">
        <div class="card-header-row">
          <h3>Active Deployment Squad (Max 3 Units)</h3>
          <span class="treats-pill">${getIcon("treat", { size: 14 })} Treats: <strong>${treats}</strong></span>
        </div>
        <div class="squad-slots-grid">
          <!-- Hero Slot -->
          <div class="squad-unit-card hero-slot">
            <span class="slot-badge">LEADER</span>
            <div class="squad-unit-avatar">
              <span class="unit-icon-large">${getIcon("shield", { size: 28 })}</span>
            </div>
            <div class="squad-unit-meta">
              <h4>${escapeHtml(hero.name)}</h4>
              <span class="unit-class">Lv.${hero.level} ${hero.archetype.toUpperCase()}</span>
              <div class="unit-stats-mini">
                <span>HP: ${hero.hp}/${hero.maxHp}</span>
                <span>ATK: ${Math.round(25 + hero.level * 4)}</span>
              </div>
            </div>
          </div>

          <!-- Pet 1 Slot -->
          ${renderSquadPetSlot(activePets[0], 0)}
          <!-- Pet 2 Slot -->
          ${renderSquadPetSlot(activePets[1], 1)}
        </div>
      </div>

      <!-- Pets Collection & Training Roster -->
      <div class="tactics-card pets-collection-card">
        <h3>Pet Companions Roster</h3>
        <p class="section-subtext">Earn treats and XP through focus sessions to level up and bond with your tactical pets!</p>
        <div class="pets-grid">
          ${allPets.map((pet) => renderPetCollectionCard(pet, activePets)).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderSquadPetSlot(pet, index) {
  if (!pet) {
    return `
      <div class="squad-unit-card empty-slot">
        <span class="slot-badge">PET ${index + 1}</span>
        <div class="empty-slot-placeholder">
          <span>+</span>
          <p>Assign Pet from Roster below</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="squad-unit-card pet-slot">
      <span class="slot-badge">PET ${index + 1}</span>
      <div class="squad-unit-avatar">
        ${renderPetSvg(pet.id, 56)}
      </div>
      <div class="squad-unit-meta">
        <h4>${escapeHtml(pet.name)}</h4>
        <span class="unit-class">${pet.species} (Lv.${pet.level})</span>
        <div class="unit-stats-mini">
          <span>HP: ${pet.hp}</span>
          <span>ATK: ${pet.atk}</span>
          <span>SPD: ${pet.spd}</span>
        </div>
        <span class="unit-skill-tag">Skill: ${pet.skill.name}</span>
      </div>
    </div>
  `;
}

function renderPetCollectionCard(pet, activePets) {
  const isAssigned = activePets.some((p) => p?.id === pet.id);
  const isLocked = !pet.unlocked;

  return `
    <div class="pet-card ${isAssigned ? "is-assigned" : ""} ${isLocked ? "is-locked" : ""}">
      <div class="pet-card-top">
        <div class="pet-avatar-wrapper">
          ${renderPetSvg(pet.id, 56)}
        </div>
        <div class="pet-card-title">
          <h4>${escapeHtml(pet.name)}</h4>
          <span class="pet-element-tag elem-${pet.element}">${pet.element.toUpperCase()}</span>
        </div>
      </div>

      <p class="pet-lore">${escapeHtml(pet.lore)}</p>

      ${
        isLocked
          ? `<div class="pet-locked-notice">${getIcon("lock", { size: 14 })} Discover in World Exploration & Dungeons</div>`
          : `
          <div class="pet-stats-bars">
            <div class="pet-stat-row">
              <span>Level ${pet.level}</span>
              <span>XP: ${pet.xp}/${pet.maxXp}</span>
            </div>
            <div class="stat-progress-bar">
              <div class="stat-fill-bar" style="width: ${(pet.xp / pet.maxXp) * 100}%"></div>
            </div>

            <div class="pet-stat-row">
              <span>Bond: ${pet.bond}%</span>
              <span>${pet.passive}</span>
            </div>
          </div>

          <div class="pet-actions-row">
            <button class="tactics-btn-sm feed-pet-btn" data-pet-id="${pet.id}">
              ${getIcon("treat", { size: 13 })} Feed Treat (+XP/Bond)
            </button>
            <button class="tactics-btn-sm assign-pet-btn ${isAssigned ? "assigned" : ""}" data-pet-id="${pet.id}">
              ${isAssigned ? `${getIcon("check", { size: 12 })} In Squad` : "Deploy in Squad"}
            </button>
          </div>
        `
      }
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
 * 2. WORLD MAP VIEW
 * ───────────────────────────────────────────────────────────── */
function renderWorldMapView() {
  const exploration = getExplorationState();
  const currentRegion =
    WORLD_REGIONS.find((r) => r.id === exploration.selectedRegionId) ||
    WORLD_REGIONS[0];

  return `
    <div class="tactics-world-container">
      <!-- Region Selector Tabs -->
      <div class="world-regions-bar">
        ${WORLD_REGIONS.map(
          (r) => `
          <button class="region-select-btn ${r.id === currentRegion.id ? "active" : ""}" data-region-id="${r.id}">
            <span class="region-name">${r.name}</span>
            <span class="region-diff">Tier ${r.difficulty}</span>
          </button>
        `,
        ).join("")}
      </div>

      <!-- Selected Region Overworld Stage -->
      <div class="world-stage-card">
        <div class="region-header-meta">
          <h3>${currentRegion.name}</h3>
          <p>${currentRegion.description}</p>
          <div class="region-loot-tags">
            ${currentRegion.loot.map((l) => `<span class="loot-tag">${getIcon("gift", { size: 12 })} ${l}</span>`).join("")}
          </div>
        </div>

        <!-- Overworld Nodes Flow -->
        <div class="world-nodes-grid">
          ${currentRegion.nodes
            .map((node, i) => {
              const isCleared = exploration.completedNodes[node.id];
              const nodeIcon =
                node.type === "treasure"
                  ? getIcon("gem", { size: 18 })
                  : node.type === "shrine"
                  ? getIcon("fountain", { size: 18 })
                  : node.type === "boss"
                  ? getIcon("crown", { size: 18 })
                  : getIcon("sword", { size: 18 });
              return `
              <div class="world-node-card node-type-${node.type} ${isCleared ? "is-cleared" : ""}">
                <div class="node-icon-bubble">
                  ${nodeIcon}
                </div>
                <div class="node-info">
                  <h4>${escapeHtml(node.name)}</h4>
                  <span class="node-badge">${node.type.toUpperCase()}</span>
                </div>
                <div class="node-action-col">
                  ${
                    isCleared
                      ? `<span class="cleared-badge">${getIcon("check", { size: 12 })} Completed</span>`
                      : `<button class="tactics-btn-primary launch-node-btn" data-node-id="${node.id}" data-node-type="${node.type}">
                          ${node.type === "treasure" ? "Open Chest" : "Enter Battle"}
                         </button>`
                  }
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
 * 3. DUNGEON VIEW
 * ───────────────────────────────────────────────────────────── */
function renderDungeonView() {
  const exploration = getExplorationState();
  return `
    <div class="tactics-dungeon-container">
      <div class="tactics-card dungeon-banner-card">
        <div class="dungeon-meta-row">
          <div>
            <h3>${getIcon("castle", { size: 18 })} The Clockwork Crypts</h3>
            <p>Branching subterranean chambers filled with ancient traps, brass guardians, and treasure vaults.</p>
          </div>
          <div class="dungeon-progress-pill">
            <span>Floor: <strong>${exploration.dungeonFloor}</strong></span>
            <span>Rooms Cleared: <strong>${exploration.dungeonRoomsCleared}</strong></span>
          </div>
        </div>
      </div>

      <div class="dungeon-rooms-flow">
        <div class="dungeon-room-card active">
          <div class="room-icon">${getIcon("sword", { size: 22 })}</div>
          <h4>Chamber ${exploration.dungeonRoomsCleared + 1}</h4>
          <p>Lurking shadows block the corridor ahead.</p>
          <button class="tactics-btn-primary start-dungeon-battle-btn">
            Engage Dungeon Battle
          </button>
        </div>

        <div class="dungeon-room-card next">
          <div class="room-icon">${getIcon("gem", { size: 22 })}</div>
          <h4>Sealed Relic Chamber</h4>
          <p>Unlocks after clearing the current room.</p>
        </div>

        <div class="dungeon-room-card boss">
          <div class="room-icon">${getIcon("crown", { size: 22 })}</div>
          <h4>Floor Boss: Gear Titan</h4>
          <p>Guards the stairs to Floor ${exploration.dungeonFloor + 1}.</p>
        </div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
 * 4. CHRONO TOWER VIEW
 * ───────────────────────────────────────────────────────────── */
function renderTowerView() {
  const exploration = getExplorationState();

  return `
    <div class="tactics-tower-container">
      <div class="tactics-card tower-header-card">
        <div class="tower-meta-row">
          <div>
            <h3>${getIcon("tower", { size: 18 })} The Chrono Spire</h3>
            <p>Ascend the infinite spire of temporal trials. Each floor introduces unique combat mutators!</p>
          </div>
          <div class="tower-floor-badge">
            <span>Highest Floor Cleared</span>
            <strong>Floor ${exploration.highestTowerFloor}</strong>
          </div>
        </div>
      </div>

      <div class="tower-floors-list">
        ${TOWER_FLOORS.map((floor) => {
          const isUnlocked = floor.floor <= exploration.highestTowerFloor;
          const isCleared = floor.floor < exploration.highestTowerFloor;
          return `
            <div class="tower-floor-card ${isCleared ? "is-cleared" : ""} ${isUnlocked ? "is-unlocked" : "is-locked"}">
              <div class="floor-num-col">
                <span class="floor-number">F${floor.floor}</span>
              </div>
              <div class="floor-details-col">
                <h4>${escapeHtml(floor.name)}</h4>
                <span class="floor-mutator">${getIcon("zap", { size: 13 })} Mutator: ${floor.modifier}</span>
              </div>
              <div class="floor-action-col">
                ${
                  isCleared
                    ? `<span class="cleared-tag">${getIcon("check", { size: 12 })} Conquered</span>`
                    : isUnlocked
                      ? `<button class="tactics-btn-primary launch-tower-btn" data-floor="${floor.floor}">
                          Ascend Floor
                         </button>`
                      : `<span class="locked-tag">${getIcon("lock", { size: 12 })} Locked</span>`
                }
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
 * 5. BATTLE ARENA VIEW (7x7 GRID)
 * ───────────────────────────────────────────────────────────── */
function renderBattleArenaView() {
  if (!currentBattle) {
    return `
      <div class="tactics-battle-empty-state">
        <div class="empty-battle-card">
          <span class="empty-icon">${getIcon("sword", { size: 40 })}</span>
          <h3>No Active Battle</h3>
          <p>Select a battle from the <strong>World Map</strong>, <strong>Dungeons</strong>, or <strong>Chrono Tower</strong> to deploy your squad!</p>
          <button class="tactics-btn-primary" id="btn-quick-skirmish">
            ${getIcon("zap", { size: 15 })} Quick Skirmish (Training)
          </button>
        </div>
      </div>
    `;
  }

  const activeUnit = currentBattle.getActiveUnit();
  const isPlayerTurn = activeUnit?.side === "player";

  return `
    <div class="tactics-arena-layout">
      <!-- Top Turn Timeline -->
      <div class="arena-turn-timeline">
        <span class="timeline-label">Round ${currentBattle.round} Turn Order:</span>
        <div class="timeline-units-row">
          ${currentBattle.turnOrder
            .map((unitId) => {
              const u = currentBattle.units.get(unitId);
              if (!u || !u.alive) return "";
              const isActive = u.id === activeUnit?.id;
              return `
              <div class="timeline-unit-pill ${u.side} ${isActive ? "active" : ""}">
                <span class="pill-name">${escapeHtml(u.name.split(" ")[0])}</span>
                <span class="pill-hp">${u.hp} HP</span>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      <!-- Main Battlefield Row -->
      <div class="battlefield-main-row">
        <!-- 7x7 Grid Canvas / Stage -->
        <div class="battlefield-grid-container" id="tactics-grid-stage">
          <div class="battlefield-grid">
            ${currentBattle.grid.map((cell) => renderGridCell(cell)).join("")}
          </div>
        </div>

        <!-- Combat HUD Panel -->
        <div class="combat-hud-panel">
          <div class="active-unit-hud">
            <h3>Current Turn</h3>
            ${
              activeUnit
                ? `
              <div class="hud-unit-card ${activeUnit.side}">
                <h4>${escapeHtml(activeUnit.name)}</h4>
                <div class="hud-vitals">
                  <span>HP: ${activeUnit.hp} / ${activeUnit.maxHp}</span>
                  <div class="hp-bar-mini">
                    <div class="hp-fill-mini" style="width: ${(activeUnit.hp / activeUnit.maxHp) * 100}%"></div>
                  </div>
                  <span>AP: ${Array.from({ length: activeUnit.ap }).map(() => getIcon("zap", { size: 13, className: "ap-bolt" })).join("")} (${activeUnit.ap}/${activeUnit.maxAp})</span>
                </div>
              </div>
            `
                : "<p>Waiting...</p>"
            }
          </div>

          <!-- Action Controls for Player -->
          ${
            isPlayerTurn
              ? `
            <div class="combat-action-buttons">
              <button class="tactics-action-btn ${activeCombatAction === "move" ? "selected" : ""}" data-action="move" ${activeUnit.ap < 1 ? "disabled" : ""}>
                ${getIcon("move", { size: 14 })} Move (1 AP)
              </button>
              <button class="tactics-action-btn ${activeCombatAction === "attack" ? "selected" : ""}" data-action="attack" ${activeUnit.ap < 1 ? "disabled" : ""}>
                ${getIcon("sword", { size: 14 })} Strike (1 AP)
              </button>
              ${
                activeUnit.skill
                  ? `
                <button class="tactics-action-btn ${activeCombatAction === "skill" ? "selected" : ""}" data-action="skill" ${activeUnit.ap < (activeUnit.skill.cost || 2) ? "disabled" : ""}>
                  ${getIcon("sparkles", { size: 14 })} ${activeUnit.skill.name} (${activeUnit.skill.cost || 2} AP)
                </button>
              `
                  : ""
              }
              <button class="tactics-action-btn" id="btn-combat-defend" ${activeUnit.ap < 1 ? "disabled" : ""}>
                ${getIcon("shield", { size: 14 })} Defend (End)
              </button>
              <button class="tactics-action-btn secondary" id="btn-combat-wait">
                ${getIcon("hourglass", { size: 14 })} End Turn
              </button>
            </div>
          `
              : `<div class="enemy-turn-indicator"><span>Enemy AI Calculating...</span></div>`
          }

          <!-- Combat Event Log -->
          <div class="combat-log-container">
            <h4>Battle Log</h4>
            <div class="combat-log-stream">
              ${currentBattle.combatLog.map((log) => `<p class="log-entry">${escapeHtml(log)}</p>`).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGridCell(cell) {
  const unit = cell.unitId ? currentBattle.units.get(cell.unitId) : null;
  const isSelected = selectedTile?.x === cell.x && selectedTile?.y === cell.y;
  const activeUnit = currentBattle?.getActiveUnit();

  // Highlight valid move/attack targets
  let isMoveHighlight = false;
  let isAttackHighlight = false;

  if (activeUnit && activeUnit.side === "player") {
    if (activeCombatAction === "move" && currentBattle.canMove(activeUnit.id, cell.x, cell.y)) {
      isMoveHighlight = true;
    } else if (
      (activeCombatAction === "attack" || activeCombatAction === "skill") &&
      unit &&
      unit.side !== "player"
    ) {
      isAttackHighlight = true;
    }
  }

  return `
    <div class="grid-cell terrain-${cell.terrain} ${isSelected ? "selected" : ""} ${isMoveHighlight ? "highlight-move" : ""} ${isAttackHighlight ? "highlight-attack" : ""}"
         data-grid-x="${cell.x}" data-grid-y="${cell.y}">
      ${cell.terrain === "cover" ? `<span class="terrain-icon">${getIcon("rock", { size: 14 })}</span>` : ""}
      ${cell.terrain === "time_rift" ? `<span class="terrain-icon">${getIcon("portal", { size: 14 })}</span>` : ""}
      ${cell.terrain === "healing_glyph" ? `<span class="terrain-icon">${getIcon("sparkles", { size: 14 })}</span>` : ""}
      ${
        unit
          ? `
        <div class="cell-unit-sprite ${unit.side}">
          <span class="unit-token-avatar ${unit.side === "player" ? (unit.element ? "unit-pet" : "unit-hero") : "unit-enemy"}">
            ${unit.side === "player" ? (unit.element ? getIcon("paw", { size: 18 }) : getIcon("shield", { size: 18 })) : getIcon("skull", { size: 18 })}
          </span>
          <div class="unit-tile-hp-bar">
            <div class="unit-tile-hp-fill" style="width: ${(unit.hp / unit.maxHp) * 100}%"></div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
 * EVENT BINDINGS
 * ───────────────────────────────────────────────────────────── */
function bindModeNavEvents(container) {
  container.querySelectorAll("[data-tactics-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.tacticsMode;
      setExplorationMode(mode);
      renderTacticsContainer();
    });
  });

  // World Region Selector
  container.querySelectorAll(".region-select-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectRegion(btn.dataset.regionId);
      renderTacticsContainer();
    });
  });

  // Launch Node Action (World Map)
  container.querySelectorAll(".launch-node-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nodeId = btn.dataset.nodeId;
      const type = btn.dataset.nodeType;
      const region = WORLD_REGIONS.find((r) => r.id === getExplorationState().selectedRegionId);
      const node = region?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (type === "treasure") {
        const result = openTreasureNode(node);
        if (result.success) {
          showSuccess(`Opened chest! Received +${result.gold} Gold and +${result.treats} Treats!`);
          renderTacticsContainer();
        }
      } else {
        startTacticsBattle(node.enemyTier || 1, node.id, node.petReward);
      }
    });
  });

  // Feed Pet
  container.querySelectorAll(".feed-pet-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const petId = btn.dataset.petId;
      const result = feedPet(petId);
      if (result.success) {
        showSuccess(`Fed treat! Bond increased to ${result.bond}%!`);
        renderTacticsContainer();
      } else {
        showError(result.message);
      }
    });
  });

  // Deploy Pet in Squad
  container.querySelectorAll(".assign-pet-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const petId = btn.dataset.petId;
      const active = getActiveSquadPets().map((p) => p.id);
      if (active.includes(petId)) {
        setActiveSquadPets(active.filter((id) => id !== petId));
      } else {
        setActiveSquadPets([...active, petId]);
      }
      renderTacticsContainer();
    });
  });

  // Quick Skirmish
  container.querySelector("#btn-quick-skirmish")?.addEventListener("click", () => {
    startTacticsBattle(1);
  });

  // Launch Tower Floor
  container.querySelectorAll(".launch-tower-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const floor = parseInt(btn.dataset.floor, 10);
      startTacticsBattle(floor, `tower_${floor}`);
    });
  });

  // Dungeon room engage
  container.querySelector(".start-dungeon-battle-btn")?.addEventListener("click", () => {
    const floor = getExplorationState().dungeonFloor;
    startTacticsBattle(floor + 0.5, "dungeon_room");
  });
}

export function startTacticsBattle(tier = 1, encounterId = null, petReward = null) {
  const hero = getHero();
  const squadPets = getActiveSquadPets();

  // Assemble player squad units
  const playerUnits = [
    {
      id: "hero_unit",
      name: hero.name,
      element: "time",
      hp: hero.hp,
      maxHp: hero.maxHp,
      atk: Math.round(25 + hero.level * 4),
      def: Math.round(15 + hero.level * 2),
      spd: 16,
      moveRange: 3,
      attackRange: 1,
      skill: {
        name: "Chrono Cleave",
        cost: 2,
        description: "Heavy strike dealing massive critical damage.",
      },
    },
    ...squadPets.map((p) => ({
      id: p.id,
      name: p.name,
      element: p.element,
      hp: p.hp,
      maxHp: p.maxHp,
      atk: p.atk,
      def: p.def,
      spd: p.spd,
      moveRange: p.moveRange,
      attackRange: p.attackRange,
      skill: p.skill,
    })),
  ];

  const enemyUnits = generateEnemySquad(tier, Math.min(4, 2 + Math.floor(tier / 2)));

  currentBattle = new TacticsBattle(playerUnits, enemyUnits);
  currentBattle.encounterId = encounterId;
  currentBattle.petReward = petReward;

  setExplorationMode("battle");
  renderTacticsContainer();
  showInfo("Tactical engagement commenced!");
}

function bindBattleArenaEvents() {
  const gridContainer = document.getElementById("tactics-grid-stage");
  if (!gridContainer || !currentBattle) return;

  gridContainer.querySelectorAll(".grid-cell").forEach((cellEl) => {
    cellEl.addEventListener("click", () => {
      const x = parseInt(cellEl.dataset.gridX, 10);
      const y = parseInt(cellEl.dataset.gridY, 10);
      handleGridCellClick(x, y);
    });
  });

  // Action Buttons
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCombatAction = btn.dataset.action;
      renderTacticsContainer();
    });
  });

  document.getElementById("btn-combat-defend")?.addEventListener("click", () => {
    const activeUnit = currentBattle.getActiveUnit();
    if (activeUnit) {
      currentBattle.defend(activeUnit.id);
      renderTacticsContainer();
    }
  });

  document.getElementById("btn-combat-wait")?.addEventListener("click", () => {
    currentBattle.nextTurn();
    renderTacticsContainer();
  });
}

function handleGridCellClick(x, y) {
  if (!currentBattle || currentBattle.isOver) return;

  const activeUnit = currentBattle.getActiveUnit();
  if (!activeUnit || activeUnit.side !== "player") return;

  const targetCell = currentBattle.getCell(x, y);

  if (activeCombatAction === "move") {
    if (currentBattle.canMove(activeUnit.id, x, y)) {
      currentBattle.move(activeUnit.id, x, y);
      renderTacticsContainer();
    }
  } else if (activeCombatAction === "attack") {
    if (targetCell?.unitId) {
      const targetUnit = currentBattle.units.get(targetCell.unitId);
      if (targetUnit && targetUnit.side !== "player") {
        currentBattle.attack(activeUnit.id, targetUnit.id);
        renderTacticsContainer();
      }
    }
  } else if (activeCombatAction === "skill") {
    currentBattle.castSkill(activeUnit.id, x, y);
    renderTacticsContainer();
  }
}

function setupTacticsEventListeners() {
  document.addEventListener("tactics-battle-won", (e) => {
    const { round } = e.detail || {};
    showSuccess(`Victory in ${round} rounds! Rewards deposited into your vault.`);

    if (currentBattle?.encounterId) {
      if (currentBattle.encounterId.startsWith("tower_")) {
        advanceTowerFloor();
      } else if (currentBattle.encounterId === "dungeon_room") {
        advanceDungeonRoom();
      } else {
        completeNode(currentBattle.encounterId, currentBattle.petReward);
      }
    }
  });

  document.addEventListener("tactics-battle-lost", () => {
    showError("Squad defeated! Retreat and recover your Resolve (HP).");
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
