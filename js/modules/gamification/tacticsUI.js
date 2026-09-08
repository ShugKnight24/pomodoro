/**
 * tacticsUI.js — Final Fantasy Tactics RPG & Chrono Realm UI
 * Features complete FFT Job System, Guild Tavern party recruitment,
 * 7x7 tactical grid with directional facing, AoE targeting, Limit Breaks,
 * and CT turn timeline. Zero emojis, 100% vector SVG.
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
import { getJob, JOBS } from "./jobs.js";
import {
  getAllPartyMembers,
  getRecruitedMembers,
  getRecruitableCandidates,
  recruitPartyMember,
  getActiveSquadMembers,
  setSquadUnit,
} from "./party.js";
import { renderJobSprite } from "./characterSprites.js";
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
import { escapeHtml } from "../../utils/sanitize.js";

let currentBattle = null;
let selectedTile = null; // { x, y }
let activeCombatAction = "move"; // 'move' | 'attack' | 'skill' | 'limit'
let selectedSkillId = null;
let hoveredTile = null; // { x, y }

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
        <span class="tactics-subtitle">Assemble your Job party, recruit allies at the Guild, and master tactical combat!</span>
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
        <button class="tactics-tab-btn ${exploration.activeMode === "squad" ? "active" : ""}" data-tactics-mode="squad" id="btn-tab-squad">
          ${getIcon("shield", { size: 15 })} Guild & Party
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
 * 1. SQUAD & GUILD TAVERN VIEW
 * ───────────────────────────────────────────────────────────── */
function renderSquadView() {
  const hero = getHero();
  const squadMembers = getActiveSquadMembers();
  const squadPets = getActiveSquadPets();
  const candidates = getRecruitableCandidates();
  const allRecruited = getRecruitedMembers();
  const allPets = getAllPets();
  const treats = getTreatsCount();

  const heroJobId = hero?.archetype === "mage" ? "black_mage" : hero?.archetype === "paladin" ? "knight" : hero?.archetype || "knight";
  const heroJob = getJob(heroJobId);

  return `
    <div class="tactics-squad-section" id="tactics-squad-panel">
      <!-- 1. Active Deployment Squad Card -->
      <div class="tactics-card squad-roster-card">
        <div class="card-header-row">
          <div>
            <h3>Active Deployment Squad (Max 4 Units)</h3>
            <p class="section-subtext">Units ready for deployment into Campaign, Chrono Tower, and Tactical Arena engagements.</p>
          </div>
          <div class="squad-header-badges">
            <span class="gold-pill">${getIcon("sparkles", { size: 14 })} Gold: <strong>${hero?.gold || 0}</strong></span>
            <span class="treats-pill">${getIcon("treat", { size: 14 })} Treats: <strong>${treats}</strong></span>
          </div>
        </div>

        <div class="squad-slots-grid">
          <!-- Hero Leader Slot -->
          <div class="squad-unit-card hero-slot">
            <span class="slot-badge leader-badge">LEADER</span>
            <div class="squad-unit-avatar">
              ${renderJobSprite(heroJobId, { size: 54, facing: "S" })}
            </div>
            <div class="squad-unit-meta">
              <h4>${escapeHtml(hero?.name || "Hero")}</h4>
              <span class="unit-class-tag" style="background: ${heroJob.badgeColor}20; color: ${heroJob.badgeColor}; border: 1px solid ${heroJob.badgeColor}40;">
                Lv.${hero?.level || 1} ${heroJob.name}
              </span>
              <div class="unit-stats-mini">
                <span>HP: ${hero?.hp || 160}/${hero?.maxHp || 160}</span>
                <span>MP: 50/50</span>
                <span>ATK: ${Math.round(24 + (hero?.level || 1) * 4)}</span>
                <span>DEF: ${Math.round(15 + (hero?.level || 1) * 2)}</span>
              </div>
              <div class="limit-break-preview">
                <span class="limit-break-label">${getIcon("zap", { size: 11 })} Limit:</span>
                <span class="limit-break-name">${heroJob.limitBreak?.name || "Omnislash"}</span>
              </div>
            </div>
          </div>

          <!-- Ally Slot 1 -->
          ${renderSquadMemberSlot(squadMembers[1], 1)}

          <!-- Ally Slot 2 -->
          ${renderSquadMemberSlot(squadMembers[2], 2)}

          <!-- Ally / Pet Slot 3 -->
          ${renderSquadMemberSlot(squadMembers[3] || (squadPets[0] ? { isPet: true, pet: squadPets[0] } : null), 3)}
        </div>
      </div>

      <!-- 2. Adventurers' Guild Tavern (Job Recruitment) -->
      <div class="tactics-card guild-tavern-card">
        <div class="card-header-row">
          <div>
            <h3>The Adventurers' Guild Tavern</h3>
            <p class="section-subtext">Recruit seasoned Job specialists with Gold earned from focus sprints and task completions.</p>
          </div>
        </div>

        ${
          candidates.length === 0
            ? `<div class="all-recruited-banner">${getIcon("check", { size: 16 })} All tavern champions have been recruited to your guild!</div>`
            : `
          <div class="guild-candidates-grid">
            ${candidates.map((c) => renderCandidateCard(c, hero?.gold || 0)).join("")}
          </div>
        `
        }

        <!-- Recruited Guild Reserve Roster -->
        ${
          allRecruited.length > 0
            ? `
          <div class="guild-reserve-section">
            <h4 class="subheading-tag">${getIcon("shield", { size: 14 })} Guild Roster (${allRecruited.length} Recruited Members)</h4>
            <div class="reserve-members-row">
              ${allRecruited.map((m) => renderReserveMemberChip(m, squadMembers)).join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>

      <!-- 3. Pet Sanctuary & Tactical Companions -->
      <div class="tactics-card pets-collection-card">
        <div class="card-header-row">
          <div>
            <h3>Pet Companions Sanctuary</h3>
            <p class="section-subtext">Feed treats earned through deep focus to unlock bond abilities and deploy them as supportive battle units.</p>
          </div>
        </div>
        <div class="pets-grid">
          ${allPets.map((pet) => renderPetCollectionCard(pet, squadPets)).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderSquadMemberSlot(unit, slotIndex) {
  if (!unit) {
    return `
      <div class="squad-unit-card empty-slot">
        <span class="slot-badge">SLOT ${slotIndex + 1}</span>
        <div class="empty-slot-placeholder">
          <span class="placeholder-icon">${getIcon("plus", { size: 24 })}</span>
          <p>Assign Ally or Pet below</p>
        </div>
      </div>
    `;
  }

  if (unit.isPet) {
    const pet = unit.pet;
    return `
      <div class="squad-unit-card pet-slot">
        <span class="slot-badge pet-badge">PET COMPANION</span>
        <div class="squad-unit-avatar">
          ${renderPetSvg(pet.id, 50)}
        </div>
        <div class="squad-unit-meta">
          <h4>${escapeHtml(pet.name)}</h4>
          <span class="unit-class-tag elem-${pet.element}">
            ${pet.species} (Lv.${pet.level})
          </span>
          <div class="unit-stats-mini">
            <span>HP: ${pet.hp}</span>
            <span>ATK: ${pet.atk}</span>
            <span>SPD: ${pet.spd}</span>
          </div>
          <span class="unit-skill-tag">${getIcon("sparkles", { size: 11 })} ${pet.skill.name}</span>
          <button class="tactics-btn-sm unassign-pet-btn" data-pet-id="${pet.id}">
            Remove from Squad
          </button>
        </div>
      </div>
    `;
  }

  const job = getJob(unit.jobId || "knight");
  return `
    <div class="squad-unit-card ally-slot">
      <span class="slot-badge ally-badge">ALLY ${slotIndex}</span>
      <div class="squad-unit-avatar">
        ${renderJobSprite(unit.jobId || "knight", { size: 54, facing: "S" })}
      </div>
      <div class="squad-unit-meta">
        <h4>${escapeHtml(unit.name)}</h4>
        <span class="unit-class-tag" style="background: ${job.badgeColor}20; color: ${job.badgeColor}; border: 1px solid ${job.badgeColor}40;">
          Lv.${unit.level} ${job.name}
        </span>
        <div class="unit-stats-mini">
          <span>HP: ${unit.hp}/${unit.maxHp}</span>
          <span>MP: ${unit.mp}/${unit.maxMp}</span>
          <span>JP: ${unit.jp || 0}</span>
        </div>
        <div class="gear-preview-mini">
          <span class="gear-tag">${escapeHtml(unit.equippedWeapon || "Weapon")}</span>
        </div>
        <button class="tactics-btn-sm remove-ally-btn" data-slot-index="${slotIndex}">
          Remove from Squad
        </button>
      </div>
    </div>
  `;
}

function renderCandidateCard(candidate, currentGold) {
  const job = getJob(candidate.jobId);
  const cost = candidate.cost || 100;
  const canAfford = currentGold >= cost;

  return `
    <div class="guild-candidate-card ${canAfford ? "can-recruit" : "cannot-afford"}">
      <div class="candidate-top-row">
        <div class="candidate-avatar">
          ${renderJobSprite(candidate.jobId, { size: 52, facing: "S" })}
        </div>
        <div class="candidate-headline">
          <h4>${escapeHtml(candidate.name)}</h4>
          <span class="job-role-pill" style="color: ${job.badgeColor}; background: ${job.badgeColor}15;">
            ${job.name} — ${job.role}
          </span>
          <div class="candidate-cost-tag ${canAfford ? "affordable" : "expensive"}">
            ${getIcon("sparkles", { size: 12 })} <strong>${cost} Gold</strong>
          </div>
        </div>
      </div>

      <p class="candidate-bio">${escapeHtml(candidate.bio)}</p>

      <div class="candidate-abilities-preview">
        <span class="abilities-preview-title">Key Abilities:</span>
        <div class="abilities-chips-row">
          ${job.abilities
            .slice(0, 3)
            .map((a) => `<span class="ability-chip" title="${escapeHtml(a.description)}">${escapeHtml(a.name)}</span>`)
            .join("")}
        </div>
      </div>

      <div class="candidate-action-footer">
        <button class="tactics-btn-primary recruit-candidate-btn" data-candidate-id="${candidate.id}" ${!canAfford ? "disabled" : ""}>
          ${getIcon("shield", { size: 13 })} Recruit (${cost} Gold)
        </button>
      </div>
    </div>
  `;
}

function renderReserveMemberChip(member, squadMembers) {
  const isInSquad = squadMembers.some((m) => m.id === member.id);
  const job = getJob(member.jobId);

  return `
    <div class="reserve-member-chip ${isInSquad ? "in-squad" : ""}">
      <div class="chip-avatar">
        ${renderJobSprite(member.jobId, { size: 34, facing: "S" })}
      </div>
      <div class="chip-info">
        <strong>${escapeHtml(member.name.split(" ")[0])}</strong>
        <span style="color: ${job.badgeColor};">${job.name} (Lv.${member.level})</span>
      </div>
      <div class="chip-action">
        ${
          isInSquad
            ? `<span class="squad-active-tag">${getIcon("check", { size: 12 })} Deployed</span>`
            : `
          <button class="tactics-btn-sm deploy-reserve-btn" data-member-id="${member.id}">
            Deploy
          </button>
        `
        }
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
          ${renderPetSvg(pet.id, 52)}
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
              ${getIcon("treat", { size: 13 })} Feed Treat
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
      <div class="tactics-regions-bar">
        ${WORLD_REGIONS.map(
          (reg) => `
          <button class="region-select-btn ${reg.id === exploration.selectedRegionId ? "active" : ""}" data-region-id="${reg.id}">
            <span class="region-btn-name">${escapeHtml(reg.name)}</span>
            <span class="region-btn-level">Lv.${reg.minLevel}+</span>
          </button>
        `,
        ).join("")}
      </div>

      <div class="region-stage-card">
        <div class="region-stage-header">
          <div>
            <h3>${escapeHtml(currentRegion.name)}</h3>
            <p>${escapeHtml(currentRegion.description)}</p>
          </div>
          <span class="region-level-pill">Min Level: ${currentRegion.minLevel}</span>
        </div>

        <div class="region-nodes-grid">
          ${currentRegion.nodes
            .map((node) => {
              const isCleared = Boolean(exploration.completedNodes?.[node.id]);
              const nodeIcons = {
                battle: "sword",
                boss: "skull",
                treasure: "sparkles",
                sanctuary: "heart",
              };
              const iconName = nodeIcons[node.type] || "sword";

              return `
              <div class="world-node-card region-node-card node-type-${node.type} ${isCleared ? "cleared" : ""}">
                <div class="node-icon-bubble">
                  ${getIcon(iconName, { size: 22 })}
                </div>
                <div class="node-info">
                  <h4>${escapeHtml(node.name)}</h4>
                  <span class="node-badge">${node.type.toUpperCase()}</span>
                </div>
                <div class="node-action">
                  ${
                    isCleared
                      ? `<span class="cleared-badge">${getIcon("check", { size: 14 })} Cleared</span>`
                      : `
                    <button class="tactics-btn-primary launch-node-btn" data-node-id="${node.id}" data-node-type="${node.type}">
                      ${node.type === "treasure" ? "Open Chest" : "Engage"}
                    </button>
                  `
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
 * 3. DUNGEONS VIEW
 * ───────────────────────────────────────────────────────────── */
function renderDungeonView() {
  const exploration = getExplorationState();

  return `
    <div class="tactics-card dungeon-section tactics-dungeon-container">
      <div class="card-header-row">
        <div>
          <h3>Ancient Chrono Dungeons</h3>
          <p class="section-subtext">Floor ${exploration.dungeonFloor} — Room ${exploration.dungeonRoom + 1}/5</p>
        </div>
        <span class="treats-pill">${getIcon("castle", { size: 14 })} Dungeon Level ${exploration.dungeonFloor}</span>
      </div>

      <div class="dungeon-rooms-flow">
        ${[0, 1, 2, 3, 4]
          .map((roomIndex) => {
            const isDone = roomIndex < exploration.dungeonRoom;
            const isCurrent = roomIndex === exploration.dungeonRoom;
            const isBoss = roomIndex === 4;

            return `
            <div class="dungeon-room-card ${isCurrent ? "current" : ""} ${isDone ? "done" : ""}">
              <div class="room-icon">
                ${getIcon(isBoss ? "skull" : "sword", { size: 20 })}
              </div>
              <div class="room-meta">
                <h4>Room ${roomIndex + 1}: ${isBoss ? "Sanctum Guardian" : "Shadow Vanguard"}</h4>
                <span>${isBoss ? "Boss Battle (Rare Loot)" : "Standard Encounter"}</span>
              </div>
              <div class="room-status">
                ${
                  isDone
                    ? `<span class="cleared-badge">${getIcon("check", { size: 14 })} Cleared</span>`
                    : isCurrent
                      ? `<button class="tactics-btn-primary start-dungeon-battle-btn">Engage Room</button>`
                      : `<span class="locked-tag">${getIcon("lock", { size: 12 })} Locked</span>`
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

/* ─────────────────────────────────────────────────────────────
 * 4. CHRONO TOWER VIEW
 * ───────────────────────────────────────────────────────────── */
function renderTowerView() {
  const exploration = getExplorationState();

  return `
    <div class="tactics-card tower-section tactics-tower-container">
      <div class="card-header-row">
        <div>
          <h3>Chrono Spire (Endless Ascent)</h3>
          <p class="section-subtext">Highest Floor Conquered: Floor ${exploration.towerFloor}</p>
        </div>
        <span class="treats-pill">${getIcon("tower", { size: 14 })} Spire Level</span>
      </div>

      <div class="tower-floors-list">
        ${TOWER_FLOORS.map((tf) => {
          const isUnlocked = tf.floor <= exploration.towerFloor + 1;
          const isCurrent = tf.floor === exploration.towerFloor + 1;
          const isCompleted = tf.floor <= exploration.towerFloor;

          return `
            <div class="tower-floor-card ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""}">
              <div class="floor-number">F${tf.floor}</div>
              <div class="floor-meta">
                <h4>Floor ${tf.floor}</h4>
                <span class="floor-mutator">${escapeHtml(tf.mutator)}</span>
              </div>
              <div class="floor-action">
                ${
                  isCompleted
                    ? `<span class="cleared-badge">${getIcon("check", { size: 14 })} Conquered</span>`
                    : isUnlocked
                      ? `<button class="tactics-btn-primary launch-tower-btn" data-floor="${tf.floor}">
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
 * 5. BATTLE ARENA VIEW (FFT 7x7 GRID & COMBAT HUD)
 * ───────────────────────────────────────────────────────────── */
function renderBattleArenaView() {
  if (!currentBattle) {
    return `
      <div class="tactics-battle-empty-state">
        <div class="empty-battle-card">
          <span class="empty-icon">${getIcon("sword", { size: 44 })}</span>
          <h3>No Active Tactical Engagement</h3>
          <p>Deploy your squad from the <strong>World Map</strong>, enter the <strong>Ancient Dungeons</strong>, or test your prowess in a <strong>Quick Skirmish</strong>!</p>
          <button class="tactics-btn-primary" id="btn-quick-skirmish">
            ${getIcon("zap", { size: 15 })} Quick Skirmish (Training Arena)
          </button>
        </div>
      </div>
    `;
  }

  const activeUnit = currentBattle.getActiveUnit();
  const isPlayerTurn = activeUnit?.side === "player" && !currentBattle.isOver;
  const activeJob = activeUnit?.jobData || (activeUnit?.jobId ? getJob(activeUnit.jobId) : null);
  const activeLimit = activeJob?.limitBreak;

  return `
    <div class="tactics-arena-layout">
      <!-- 1. Top CT (Charge Time) Turn Order Timeline -->
      <div class="arena-turn-timeline">
        <div class="timeline-header-pill">
          <span class="timeline-round-label">Round ${currentBattle.round}</span>
          <span class="timeline-label">Turn Order:</span>
        </div>
        <div class="timeline-units-row">
          ${currentBattle.turnOrder
            .map((unitId) => {
              const u = currentBattle.units.get(unitId);
              if (!u || !u.alive) return "";
              const isActive = u.id === activeUnit?.id;
              const unitJob = u.jobData || (u.jobId ? getJob(u.jobId) : null);

              return `
              <div class="timeline-unit-pill ${u.side} ${isActive ? "active" : ""}" title="${escapeHtml(u.name)} (${u.side.toUpperCase()})">
                <div class="pill-avatar">
                  ${
                    u.side === "player"
                      ? unitJob
                        ? renderJobSprite(unitJob.id, { size: 24, facing: u.facing })
                        : renderPetSvg(u.id, 24)
                      : getIcon("skull", { size: 16 })
                  }
                </div>
                <div class="pill-meta">
                  <span class="pill-name">${escapeHtml(u.name.split(" ")[0])}</span>
                  <div class="pill-hp-track">
                    <div class="pill-hp-fill" style="width: ${(u.hp / u.maxHp) * 100}%"></div>
                  </div>
                </div>
                ${
                  u.limitGauge >= 100
                    ? `<span class="pill-limit-glow" title="Limit Ready!">${getIcon("zap", { size: 10 })}</span>`
                    : ""
                }
              </div>
            `;
            })
            .join("")}
        </div>
      </div>

      <!-- 2. Main Battlefield Row (Grid Canvas & Combat HUD) -->
      <div class="battlefield-main-row">
        <!-- 7x7 Grid Stage -->
        <div class="battlefield-grid-container" id="tactics-grid-stage">
          <div class="grid-coordinate-labels-top">
            <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span><span>G</span>
          </div>
          <div class="grid-canvas-wrap">
            <div class="grid-coordinate-labels-left">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
            </div>
            <div class="battlefield-grid">
              ${currentBattle.grid.map((cell) => renderGridCell(cell, activeUnit)).join("")}
            </div>
          </div>
        </div>

        <!-- Combat HUD Panel -->
        <div class="combat-hud-panel">
          <!-- Active Unit Vitals Card -->
          <div class="active-unit-hud">
            <div class="hud-header-tag">
              <span>${isPlayerTurn ? "Player Command Phase" : "Enemy AI Phase"}</span>
            </div>

            ${
              activeUnit
                ? `
              <div class="hud-unit-card ${activeUnit.side}">
                <div class="hud-unit-header">
                  <div class="hud-unit-avatar">
                    ${
                      activeUnit.side === "player"
                        ? activeJob
                          ? renderJobSprite(activeJob.id, { size: 42, facing: activeUnit.facing })
                          : renderPetSvg(activeUnit.id, 42)
                        : getIcon("skull", { size: 28 })
                    }
                  </div>
                  <div class="hud-unit-titles">
                    <h4>${escapeHtml(activeUnit.name)}</h4>
                    <span class="unit-subclass">${activeJob ? activeJob.name : activeUnit.side === "player" ? "Pet Companion" : "Enemy Striker"}</span>
                  </div>
                </div>

                <div class="hud-vitals-meters">
                  <!-- HP Meter -->
                  <div class="meter-row">
                    <div class="meter-label">
                      <span>HP</span>
                      <strong>${activeUnit.hp}/${activeUnit.maxHp}</strong>
                    </div>
                    <div class="meter-bar hp-meter">
                      <div class="meter-fill" style="width: ${(activeUnit.hp / activeUnit.maxHp) * 100}%"></div>
                    </div>
                  </div>

                  <!-- MP Meter -->
                  <div class="meter-row">
                    <div class="meter-label">
                      <span>MP</span>
                      <strong>${activeUnit.mp || 0}/${activeUnit.maxMp || 50}</strong>
                    </div>
                    <div class="meter-bar mp-meter">
                      <div class="meter-fill" style="width: ${((activeUnit.mp || 0) / (activeUnit.maxMp || 50)) * 100}%"></div>
                    </div>
                  </div>

                  <!-- AP Pips -->
                  <div class="ap-row">
                    <span class="ap-title">Action Points:</span>
                    <div class="ap-pips">
                      ${Array.from({ length: 3 })
                        .map(
                          (_, i) => `
                        <span class="ap-pip ${i < activeUnit.ap ? "available" : "depleted"}">
                          ${getIcon("zap", { size: 14 })}
                        </span>
                      `,
                        )
                        .join("")}
                    </div>
                  </div>

                  <!-- Limit Break Gauge -->
                  <div class="limit-gauge-row ${activeUnit.limitGauge >= 100 ? "limit-ready" : ""}">
                    <div class="meter-label">
                      <span>Limit Break</span>
                      <strong>${activeUnit.limitGauge || 0}%</strong>
                    </div>
                    <div class="meter-bar limit-meter">
                      <div class="meter-fill" style="width: ${Math.min(100, activeUnit.limitGauge || 0)}%"></div>
                    </div>
                    ${
                      activeUnit.limitGauge >= 100
                        ? `<span class="limit-ready-shimmer">${getIcon("sparkles", { size: 12 })} LIMIT READY!</span>`
                        : ""
                    }
                  </div>

                  <!-- Directional Facing Compass -->
                  <div class="facing-compass-box">
                    <span class="compass-label">Facing Direction: <strong>${activeUnit.facing}</strong></span>
                    <div class="compass-buttons-row">
                      <button class="compass-dir-btn ${activeUnit.facing === "N" ? "active" : ""}" data-face-dir="N" title="Face North (Avoid Back Attack)">▲ N</button>
                      <button class="compass-dir-btn ${activeUnit.facing === "E" ? "active" : ""}" data-face-dir="E" title="Face East (Avoid Back Attack)">▶ E</button>
                      <button class="compass-dir-btn ${activeUnit.facing === "S" ? "active" : ""}" data-face-dir="S" title="Face South (Avoid Back Attack)">▼ S</button>
                      <button class="compass-dir-btn ${activeUnit.facing === "W" ? "active" : ""}" data-face-dir="W" title="Face West (Avoid Back Attack)">◀ W</button>
                    </div>
                  </div>

                  <!-- Status Effects -->
                  ${
                    activeUnit.statusEffects && activeUnit.statusEffects.length > 0
                      ? `
                    <div class="unit-status-effects-row">
                      ${activeUnit.statusEffects.map((s) => `<span class="status-effect-badge">${escapeHtml(s.type)} (${s.duration}t)</span>`).join("")}
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            `
                : "<p>Waiting for next turn...</p>"
            }
          </div>

          <!-- Action Controls (Player Phase) -->
          ${
            isPlayerTurn
              ? `
            <div class="combat-action-menu">
              <h4 class="menu-heading">Command Action</h4>
              <div class="action-buttons-grid">
                <button class="tactics-action-btn ${activeCombatAction === "move" ? "selected" : ""}" data-action="move" ${activeUnit.ap < 1 ? "disabled" : ""}>
                  ${getIcon("move", { size: 14 })} Move (1 AP)
                </button>
                <button class="tactics-action-btn ${activeCombatAction === "attack" ? "selected" : ""}" data-action="attack" ${activeUnit.ap < 1 ? "disabled" : ""}>
                  ${getIcon("sword", { size: 14 })} Attack (1 AP)
                </button>
              </div>

              <!-- Job Abilities Sub-Menu -->
              ${
                activeJob && activeJob.abilities
                  ? `
                <div class="job-skills-section">
                  <span class="sub-label">Job Abilities:</span>
                  <div class="job-skills-list">
                    ${activeJob.abilities
                      .map((a) => {
                        const canCast = activeUnit.ap >= (a.apCost || 1) && (activeUnit.mp || 0) >= (a.mpCost || 0);
                        const isChosen = activeCombatAction === "skill" && selectedSkillId === a.id;
                        return `
                        <button class="job-ability-btn ${isChosen ? "selected" : ""}" data-job-skill-id="${a.id}" ${!canCast ? "disabled" : ""}>
                          <div class="skill-name-col">
                            <strong>${escapeHtml(a.name)}</strong>
                            <span class="skill-aoe-tag">${a.aoe || "single"}</span>
                          </div>
                          <div class="skill-cost-col">
                            ${a.mpCost > 0 ? `<span class="mp-cost">${a.mpCost} MP</span>` : ""}
                            <span class="ap-cost">${a.apCost || 1} AP</span>
                          </div>
                        </button>
                      `;
                      })
                      .join("")}
                  </div>
                </div>
              `
                  : activeUnit.skill
                    ? `
                <div class="pet-skill-section">
                  <button class="tactics-action-btn ${activeCombatAction === "skill" ? "selected" : ""}" data-action="pet_skill" ${activeUnit.ap < (activeUnit.skill.cost || 2) ? "disabled" : ""}>
                    ${getIcon("sparkles", { size: 14 })} ${escapeHtml(activeUnit.skill.name)} (${activeUnit.skill.cost || 2} AP)
                  </button>
                </div>
              `
                    : ""
              }

              <!-- Signature Limit Break Button -->
              ${
                activeLimit
                  ? `
                <button class="limit-break-btn ${currentBattle.canExecuteLimit(activeUnit.id) ? "ready" : "locked"} ${activeCombatAction === "limit" ? "selected" : ""}" id="btn-combat-limit" ${!currentBattle.canExecuteLimit(activeUnit.id) ? "disabled" : ""}>
                  <div class="limit-btn-content">
                    <span class="limit-star-icon">${getIcon("sparkles", { size: 16 })}</span>
                    <div class="limit-btn-text">
                      <strong>Limit Break: ${escapeHtml(activeLimit.name)}</strong>
                      <span>${currentBattle.canExecuteLimit(activeUnit.id) ? "READY! Tap target on grid" : "Requires 100% Limit Gauge & 1 AP"}</span>
                    </div>
                  </div>
                </button>
              `
                  : ""
              }

              <div class="turn-resolution-row">
                <button class="tactics-action-btn guard-btn" id="btn-combat-defend" ${activeUnit.ap < 1 ? "disabled" : ""}>
                  ${getIcon("shield", { size: 14 })} Defend (Guard)
                </button>
                <button class="tactics-action-btn wait-btn" id="btn-combat-wait">
                  ${getIcon("hourglass", { size: 14 })} End Turn
                </button>
              </div>
            </div>
          `
              : `<div class="enemy-turn-indicator"><span>Enemy AI Calculating Tactics...</span></div>`
          }

          <!-- Combat Event Log -->
          <div class="combat-log-container">
            <h4>Tactical Combat Log</h4>
            <div class="combat-log-stream">
              ${currentBattle.combatLog.map((log) => `<p class="log-entry">${escapeHtml(log)}</p>`).join("")}
            </div>
          </div>
        </div>
      </div>

      <!-- Victory Fanfare Modal Overlay -->
      ${
        currentBattle.isOver && currentBattle.winner === "player"
          ? renderVictoryFanfareModal()
          : currentBattle.isOver && currentBattle.winner === "enemy"
            ? renderDefeatModal()
            : ""
      }
    </div>
  `;
}

function renderVictoryFanfareModal() {
  return `
    <div class="tactics-modal-overlay" id="victory-fanfare-modal">
      <div class="tactics-modal-card victory-card">
        <div class="fanfare-header">
          <span class="fanfare-icon">${getIcon("sparkles", { size: 36 })}</span>
          <h2>VICTORY ACHIEVED!</h2>
          <span class="fanfare-subtitle">The battlefield is conquered in ${currentBattle.round} tactical rounds!</span>
        </div>

        <div class="fanfare-rewards-grid">
          <div class="reward-pill">
            <span class="reward-label">Hero & Party EXP</span>
            <strong class="reward-value">+${Math.round(150 + currentBattle.round * 25)}</strong>
          </div>
          <div class="reward-pill">
            <span class="reward-label">Job Points (JP)</span>
            <strong class="reward-value">+${Math.round(80 + currentBattle.round * 15)}</strong>
          </div>
          <div class="reward-pill">
            <span class="reward-label">Gold Bounty</span>
            <strong class="reward-value">+${Math.round(50 + currentBattle.round * 10)}g</strong>
          </div>
          <div class="reward-pill">
            <span class="reward-label">Pet Treats</span>
            <strong class="reward-value">+2</strong>
          </div>
        </div>

        <div class="fanfare-footer">
          <button class="tactics-btn-primary continue-quest-btn" id="btn-claim-victory">
            ${getIcon("check", { size: 16 })} Claim Spoils & Continue Quest
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderDefeatModal() {
  return `
    <div class="tactics-modal-overlay" id="defeat-modal">
      <div class="tactics-modal-card defeat-card">
        <div class="fanfare-header defeat-header">
          <span class="fanfare-icon">${getIcon("skull", { size: 36 })}</span>
          <h2>SQUAD RETREAT</h2>
          <span class="fanfare-subtitle">Your squad was overcome. Regroup at the Guild Tavern and hone your jobs!</span>
        </div>
        <div class="fanfare-footer">
          <button class="tactics-btn-primary retreat-guild-btn" id="btn-retreat-guild">
            ${getIcon("shield", { size: 16 })} Retreat to Guild Tavern
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderGridCell(cell, activeUnit) {
  const unit = cell.unitId ? currentBattle.units.get(cell.unitId) : null;
  const isSelected = selectedTile?.x === cell.x && selectedTile?.y === cell.y;

  let isMoveHighlight = false;
  let isAttackHighlight = false;
  let isAoEHighlight = false;

  if (activeUnit && activeUnit.side === "player") {
    if (activeCombatAction === "move" && currentBattle.canMove(activeUnit.id, cell.x, cell.y)) {
      isMoveHighlight = true;
    } else if (
      activeCombatAction === "attack" &&
      unit &&
      unit.side !== "player" &&
      currentBattle.canAttack(activeUnit.id, unit.id)
    ) {
      isAttackHighlight = true;
    } else if (activeCombatAction === "skill" || activeCombatAction === "limit") {
      // AoE hover highlight preview
      if (hoveredTile) {
        const activeJob = activeUnit.jobData || (activeUnit.jobId ? getJob(activeUnit.jobId) : null);
        const ability = activeJob?.abilities?.find((a) => a.id === selectedSkillId);
        const aoeShape = activeCombatAction === "limit" ? activeJob?.limitBreak?.aoe || "single" : ability?.aoe || "single";
        const aoeTiles = currentBattle.getAoETiles(hoveredTile.x, hoveredTile.y, aoeShape, activeUnit.facing);
        if (aoeTiles.some((t) => t.x === cell.x && t.y === cell.y)) {
          isAoEHighlight = true;
        }
      }
    }
  }

  const unitJob = unit?.jobData || (unit?.jobId ? getJob(unit.jobId) : null);

  return `
    <div class="grid-cell terrain-${cell.terrain} ${isSelected ? "selected" : ""} ${isMoveHighlight ? "highlight-move" : ""} ${isAttackHighlight ? "highlight-attack" : ""} ${isAoEHighlight ? "highlight-aoe" : ""}"
         data-grid-x="${cell.x}" data-grid-y="${cell.y}">
      ${cell.terrain === "cover" ? `<span class="terrain-icon terrain-cover-icon">${getIcon("rock", { size: 18 })}</span>` : ""}
      ${cell.terrain === "time_rift" ? `<span class="terrain-icon terrain-rift-icon">${getIcon("portal", { size: 18 })}</span>` : ""}
      ${cell.terrain === "healing_glyph" ? `<span class="terrain-icon terrain-vital-icon">${getIcon("sparkles", { size: 18 })}</span>` : ""}
      ${cell.terrain === "hazard" ? `<span class="terrain-icon terrain-hazard-icon">${getIcon("skull", { size: 18 })}</span>` : ""}
      ${
        unit
          ? `
        <div class="cell-unit-sprite ${unit.side}">
          <div class="unit-token-avatar">
            ${
              unit.side === "player"
                ? unitJob
                  ? renderJobSprite(unitJob.id, { size: 36, facing: unit.facing })
                  : renderPetSvg(unit.id, 36)
                : `<div class="enemy-monster-token facing-${unit.facing}">${getIcon("skull", { size: 22 })}</div>`
            }
          </div>
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

  // Candidate Recruitment in Guild Tavern
  container.querySelectorAll(".recruit-candidate-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const candidateId = btn.dataset.candidateId;
      const success = recruitPartyMember(candidateId);
      if (success) {
        renderTacticsContainer();
      }
    });
  });

  // Deploy Reserve Member to Squad
  container.querySelectorAll(".deploy-reserve-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const memberId = btn.dataset.memberId;
      setSquadUnit(1, memberId);
      showSuccess("Deployed party member into active squad!");
      renderTacticsContainer();
    });
  });

  // Remove Ally from Squad
  container.querySelectorAll(".remove-ally-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slotIndex = parseInt(btn.dataset.slotIndex, 10);
      setSquadUnit(slotIndex, "empty");
      renderTacticsContainer();
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

  // Unassign Pet
  container.querySelectorAll(".unassign-pet-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const petId = btn.dataset.petId;
      const active = getActiveSquadPets().map((p) => p.id);
      setActiveSquadPets(active.filter((id) => id !== petId));
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
  const squadMembers = getActiveSquadMembers();
  const squadPets = getActiveSquadPets();

  const playerUnits = [];

  squadMembers.forEach((member) => {
    const isHero = member.isLeader || member.id === "hero";
    const job = getJob(member.jobId || "knight");
    const level = member.level || hero?.level || 1;
    const statMods = job?.statModifiers || {};

    playerUnits.push({
      id: member.id,
      name: member.name,
      jobId: member.jobId || "knight",
      element: isHero ? "time" : job?.weaponType === "rod" ? "arcane" : "plain",
      hp: member.hp || Math.round(140 * (statMods.hp || 1)),
      maxHp: member.maxHp || Math.round(140 * (statMods.hp || 1)),
      mp: member.mp !== undefined ? member.mp : Math.round(50 * (statMods.mp || 1)),
      maxMp: member.maxMp || Math.round(50 * (statMods.mp || 1)),
      atk: Math.round((22 + level * 4) * (statMods.atk || 1)),
      mag: Math.round((20 + level * 4) * (statMods.mag || 1)),
      def: Math.round((14 + level * 2) * (statMods.def || 1)),
      spd: Math.round(14 * (statMods.spd || 1)),
      moveRange: statMods.mov || 3,
      attackRange: job?.weaponType === "bow" ? 3 : job?.weaponType === "spear" ? 2 : 1,
      isLeader: isHero,
    });
  });

  // If squad has room, include deployed tactical pets (up to 5 player units total)
  squadPets.forEach((p) => {
    if (playerUnits.length < 5) {
      playerUnits.push({
        id: p.id,
        name: p.name,
        element: p.element,
        hp: p.hp,
        maxHp: p.maxHp,
        atk: p.atk,
        def: p.def,
        spd: p.spd,
        moveRange: p.moveRange || 3,
        attackRange: p.attackRange || 1,
        skill: p.skill,
      });
    }
  });

  const enemyUnits = generateEnemySquad(tier, Math.min(4, 2 + Math.floor(tier / 2)));

  currentBattle = new TacticsBattle(playerUnits, enemyUnits);
  currentBattle.encounterId = encounterId;
  currentBattle.petReward = petReward;

  activeCombatAction = "move";
  selectedSkillId = null;
  selectedTile = null;
  hoveredTile = null;

  setExplorationMode("battle");
  renderTacticsContainer();
  showInfo("Tactical engagement commenced! Position your squad wisely.");
}

function bindBattleArenaEvents() {
  const gridContainer = document.getElementById("tactics-grid-stage");
  if (!gridContainer || !currentBattle) return;

  // Grid Cell Click & Hover for AoE
  gridContainer.querySelectorAll(".grid-cell").forEach((cellEl) => {
    cellEl.addEventListener("click", () => {
      const x = parseInt(cellEl.dataset.gridX, 10);
      const y = parseInt(cellEl.dataset.gridY, 10);
      handleGridCellClick(x, y);
    });

    cellEl.addEventListener("mouseenter", () => {
      const x = parseInt(cellEl.dataset.gridX, 10);
      const y = parseInt(cellEl.dataset.gridY, 10);
      hoveredTile = { x, y };
      if (activeCombatAction === "skill" || activeCombatAction === "limit") {
        updateGridAoEHighlights();
      }
    });
  });

  // Action Buttons
  document.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCombatAction = btn.dataset.action;
      selectedSkillId = null;
      renderTacticsContainer();
    });
  });

  // Job Skill Buttons
  document.querySelectorAll("[data-job-skill-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeCombatAction = "skill";
      selectedSkillId = btn.dataset.jobSkillId;
      renderTacticsContainer();
    });
  });

  // Limit Break Button
  document.getElementById("btn-combat-limit")?.addEventListener("click", () => {
    activeCombatAction = "limit";
    renderTacticsContainer();
  });

  // Directional Facing Compass Buttons
  document.querySelectorAll("[data-face-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.dataset.faceDir;
      const activeUnit = currentBattle.getActiveUnit();
      if (activeUnit) {
        currentBattle.setUnitFacing(activeUnit.id, dir);
        renderTacticsContainer();
      }
    });
  });

  // Defend Button
  document.getElementById("btn-combat-defend")?.addEventListener("click", () => {
    const activeUnit = currentBattle.getActiveUnit();
    if (activeUnit) {
      currentBattle.defend(activeUnit.id);
      renderTacticsContainer();
    }
  });

  // Wait / End Turn Button
  document.getElementById("btn-combat-wait")?.addEventListener("click", () => {
    currentBattle.nextTurn();
    renderTacticsContainer();
  });

  // Victory Claim Button
  document.getElementById("btn-claim-victory")?.addEventListener("click", () => {
    const round = currentBattle?.round || 1;
    const encounterId = currentBattle?.encounterId;
    const petReward = currentBattle?.petReward;

    currentBattle = null;
    if (encounterId) {
      if (encounterId.startsWith("tower_")) {
        advanceTowerFloor();
      } else if (encounterId === "dungeon_room") {
        advanceDungeonRoom();
      } else {
        completeNode(encounterId, petReward);
      }
    }
    setExplorationMode("world");
    renderTacticsContainer();
  });

  // Defeat Retreat Button
  document.getElementById("btn-retreat-guild")?.addEventListener("click", () => {
    currentBattle = null;
    setExplorationMode("squad");
    renderTacticsContainer();
  });
}

function updateGridAoEHighlights() {
  const activeUnit = currentBattle?.getActiveUnit();
  if (!activeUnit || !hoveredTile) return;

  const activeJob = activeUnit.jobData || (activeUnit.jobId ? getJob(activeUnit.jobId) : null);
  const ability = activeJob?.abilities?.find((a) => a.id === selectedSkillId);
  const aoeShape = activeCombatAction === "limit" ? activeJob?.limitBreak?.aoe || "single" : ability?.aoe || "single";
  const aoeTiles = currentBattle.getAoETiles(hoveredTile.x, hoveredTile.y, aoeShape, activeUnit.facing);

  document.querySelectorAll(".grid-cell").forEach((cellEl) => {
    const cx = parseInt(cellEl.dataset.gridX, 10);
    const cy = parseInt(cellEl.dataset.gridY, 10);
    if (aoeTiles.some((t) => t.x === cx && t.y === cy)) {
      cellEl.classList.add("highlight-aoe");
    } else {
      cellEl.classList.remove("highlight-aoe");
    }
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
    if (activeUnit.jobData && selectedSkillId) {
      currentBattle.castJobAbility(activeUnit.id, selectedSkillId, x, y);
      renderTacticsContainer();
    } else if (activeUnit.skill) {
      currentBattle.castSkill(activeUnit.id, x, y);
      renderTacticsContainer();
    }
  } else if (activeCombatAction === "limit") {
    currentBattle.executeLimitBreak(activeUnit.id, x, y);
    renderTacticsContainer();
  }
}

function setupTacticsEventListeners() {
  document.addEventListener("tactics-battle-won", (e) => {
    const { round } = e.detail || {};
    showSuccess(`Tactical triumph in ${round} rounds! Rewards unlocked.`);
  });

  document.addEventListener("tactics-battle-lost", () => {
    showError("Squad defeated! Regroup at the Guild Tavern and recover Resolve.");
  });

  window.addEventListener("party-updated", () => {
    if (getExplorationState().activeMode === "squad") {
      renderTacticsContainer();
    }
  });
}

