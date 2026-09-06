/**
 * tacticsEngine.js — Core Turn-Based Tactical Grid Combat Engine
 * Final Fantasy Tactics-inspired data-oriented grid battle simulation.
 * Features Job abilities, directional facing, AoE spells, Limit Breaks,
 * reaction abilities, status effects, and rich combat juice feedback. Zero emojis.
 */

"use strict";

import { getJob } from "./jobs.js";

export const GRID_WIDTH = 7;
export const GRID_HEIGHT = 7;

export const TERRAIN_TYPES = {
  plain: { id: "plain", name: "Grassland", moveCost: 1, defBonus: 0 },
  cover: { id: "cover", name: "Ruin Pillar", moveCost: 99, defBonus: 30 }, // Impassable cover
  time_rift: { id: "time_rift", name: "Time Rift", moveCost: 1, apBonus: 1, defBonus: 0 },
  healing_glyph: { id: "healing_glyph", name: "Vital Fountain", moveCost: 1, healOnTurn: 20, defBonus: 5 },
  hazard: { id: "hazard", name: "Void Hazard", moveCost: 2, damageOnEnter: 15, defBonus: -10 },
};

export const ELEMENT_CHART = {
  fire: { strongAgainst: "nature", weakAgainst: "ice" },
  nature: { strongAgainst: "time", weakAgainst: "fire" },
  ice: { strongAgainst: "fire", weakAgainst: "arcane" },
  arcane: { strongAgainst: "void", weakAgainst: "ice" },
  time: { strongAgainst: "void", weakAgainst: "nature" },
  void: { strongAgainst: "time", weakAgainst: "arcane" },
};

export class TacticsBattle {
  constructor(playerUnits, enemyUnits, terrainMap = null) {
    this.grid = [];
    this.units = new Map(); // id -> unit state
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.round = 1;
    this.isOver = false;
    this.winner = null; // 'player' | 'enemy'
    this.combatLog = [];
    this.juiceEvents = []; // Screen shake, floating numbers, hit-stop

    this.initGrid(terrainMap);
    this.initUnits(playerUnits, enemyUnits);
    this.calculateTurnTimeline();
  }

  initGrid(customTerrain) {
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        let terrain = "plain";
        if (customTerrain?.[`${x},${y}`]) {
          terrain = customTerrain[`${x},${y}`];
        } else {
          // Add tactical pillars & time rifts
          if ((x === 2 && y === 2) || (x === 4 && y === 4) || (x === 2 && y === 4) || (x === 4 && y === 2)) {
            terrain = "cover";
          } else if (x === 3 && y === 3) {
            terrain = "time_rift";
          } else if ((x === 0 && y === 3) || (x === 6 && y === 3)) {
            terrain = "healing_glyph";
          }
        }
        this.grid.push({ x, y, terrain, unitId: null });
      }
    }
  }

  initUnits(playerUnits, enemyUnits) {
    // Up to 5 player squad positions
    const playerStarts = [
      { x: 1, y: 3 }, // Hero center
      { x: 0, y: 2 }, // Ally / Pet 1
      { x: 0, y: 4 }, // Ally / Pet 2
      { x: 1, y: 1 }, // Ally 3
      { x: 1, y: 5 }, // Ally 4
    ];

    playerUnits.forEach((u, i) => {
      const pos = playerStarts[i] || { x: 0, y: i };
      const jobData = u.jobId ? getJob(u.jobId) : null;
      const unit = {
        ...u,
        side: "player",
        x: pos.x,
        y: pos.y,
        facing: "E", // Facing right towards enemy lines
        hp: u.hp || u.maxHp || 150,
        maxHp: u.maxHp || 150,
        mp: u.mp !== undefined ? u.mp : 50,
        maxMp: u.maxMp || 50,
        ap: 3,
        maxAp: 3,
        limitGauge: 20, // Start with 20% limit break
        statusEffects: [],
        reaction: jobData?.reaction || null,
        jobData,
        isDefending: false,
        alive: true,
      };
      this.units.set(unit.id, unit);
      const cell = this.getCell(pos.x, pos.y);
      if (cell) cell.unitId = unit.id;
    });

    const enemyStarts = [
      { x: 5, y: 3 },
      { x: 6, y: 2 },
      { x: 6, y: 4 },
      { x: 5, y: 1 },
      { x: 5, y: 5 },
    ];

    enemyUnits.forEach((u, i) => {
      const pos = enemyStarts[i] || { x: 6, y: i };
      const unit = {
        ...u,
        side: "enemy",
        x: pos.x,
        y: pos.y,
        facing: "W", // Facing left towards player
        hp: u.hp || u.maxHp || 120,
        maxHp: u.maxHp || 120,
        mp: u.mp !== undefined ? u.mp : 40,
        maxMp: u.maxMp || 40,
        ap: 3,
        maxAp: 3,
        limitGauge: 0,
        statusEffects: [],
        isDefending: false,
        alive: true,
      };
      this.units.set(unit.id, unit);
      const cell = this.getCell(pos.x, pos.y);
      if (cell) cell.unitId = unit.id;
    });
  }

  getCell(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return null;
    return this.grid[y * GRID_WIDTH + x];
  }

  calculateTurnTimeline() {
    const living = Array.from(this.units.values()).filter((u) => u.alive);
    this.turnOrder = living.sort((a, b) => (b.spd || 10) - (a.spd || 10)).map((u) => u.id);
    this.currentTurnIndex = 0;
    this.startTurn();
  }

  getActiveUnit() {
    const id = this.turnOrder[this.currentTurnIndex];
    return this.units.get(id) || null;
  }

  startTurn() {
    const unit = this.getActiveUnit();
    if (!unit || !unit.alive) {
      this.nextTurn();
      return;
    }

    unit.isDefending = false;

    // Process Status Effects
    let hasStop = false;
    const remainingStatuses = [];

    for (const status of unit.statusEffects) {
      if (status.type === "poison") {
        const poisonDmg = Math.max(5, Math.round(unit.maxHp * 0.1));
        unit.hp = Math.max(1, unit.hp - poisonDmg);
        this.addJuice("float", unit.x, unit.y, `-${poisonDmg} Poison`, "#a855f7");
      } else if (status.type === "regen") {
        const regenHeal = Math.max(8, Math.round(unit.maxHp * 0.15));
        unit.hp = Math.min(unit.maxHp, unit.hp + regenHeal);
        this.addJuice("float", unit.x, unit.y, `+${regenHeal} Regen`, "#10b981");
      } else if (status.type === "stop") {
        hasStop = true;
        this.addJuice("float", unit.x, unit.y, "Stopped!", "#ec4899");
      }

      status.duration -= 1;
      if (status.duration > 0) {
        remainingStatuses.push(status);
      }
    }
    unit.statusEffects = remainingStatuses;

    if (hasStop) {
      this.combatLog.unshift(`${unit.name}'s turn was skipped due to Stop!`);
      this.nextTurn();
      return;
    }

    // Reset AP: Haste gives +1 AP, Slow gives -1 AP
    const hasHaste = unit.statusEffects.some((s) => s.type === "haste");
    const hasSlow = unit.statusEffects.some((s) => s.type === "slow");
    unit.ap = unit.maxAp + (hasHaste ? 1 : 0) - (hasSlow ? 1 : 0);

    // Terrain effect at start of turn
    const cell = this.getCell(unit.x, unit.y);
    if (cell?.terrain === "healing_glyph") {
      unit.hp = Math.min(unit.maxHp, unit.hp + 20);
      this.addJuice("float", unit.x, unit.y, "+20 Vitality", "#10b981");
    } else if (cell?.terrain === "time_rift") {
      unit.ap += 1;
      this.addJuice("float", unit.x, unit.y, "+1 Rift AP", "#38bdf8");
    }

    this.combatLog.unshift(`Round ${this.round} — ${unit.name}'s turn (${unit.side.toUpperCase()}).`);

    if (unit.side === "enemy") {
      setTimeout(() => this.executeEnemyAI(unit), 500);
    }
  }

  nextTurn() {
    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.round++;
      this.calculateTurnTimeline();
      return;
    }

    const nextUnit = this.getActiveUnit();
    if (!nextUnit || !nextUnit.alive) {
      this.nextTurn();
    } else {
      this.startTurn();
    }
  }

  setUnitFacing(unitId, facing) {
    const unit = this.units.get(unitId);
    if (!unit) return;
    if (["N", "E", "S", "W"].includes(facing)) {
      unit.facing = facing;
      this.combatLog.unshift(`${unit.name} turned to face ${facing}.`);
    }
  }

  canMove(unitId, targetX, targetY) {
    const unit = this.units.get(unitId);
    if (!unit || !unit.alive || unit.ap < 1) return false;

    // Immobilized check
    if (unit.statusEffects.some((s) => s.type === "immobilize")) return false;

    const cell = this.getCell(targetX, targetY);
    if (!cell || cell.unitId !== null) return false;
    if (cell.terrain === "cover") return false;

    const dist = Math.abs(unit.x - targetX) + Math.abs(unit.y - targetY);
    const maxMove = unit.jobData?.statModifiers?.mov || unit.moveRange || 3;
    return dist <= maxMove;
  }

  move(unitId, targetX, targetY) {
    if (!this.canMove(unitId, targetX, targetY)) return false;

    const unit = this.units.get(unitId);
    const oldCell = this.getCell(unit.x, unit.y);
    const newCell = this.getCell(targetX, targetY);

    // Auto-update facing based on move direction
    const dx = targetX - unit.x;
    const dy = targetY - unit.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      unit.facing = dx > 0 ? "E" : "W";
    } else {
      unit.facing = dy > 0 ? "S" : "N";
    }

    oldCell.unitId = null;
    newCell.unitId = unit.id;
    unit.x = targetX;
    unit.y = targetY;
    unit.ap -= 1;

    // Hazard terrain
    if (newCell.terrain === "hazard") {
      unit.hp = Math.max(1, unit.hp - 15);
      this.addJuice("float", targetX, targetY, "-15 Hazard", "#ef4444");
      this.addJuice("shake", targetX, targetY, 2);
    }

    this.combatLog.unshift(`${unit.name} moved to (${targetX}, ${targetY}).`);
    return true;
  }

  getRelativeAngle(attacker, target) {
    const dx = attacker.x - target.x;
    const dy = attacker.y - target.y;

    let incomingDir = "W";
    if (Math.abs(dx) >= Math.abs(dy)) {
      incomingDir = dx > 0 ? "E" : "W";
    } else {
      incomingDir = dy > 0 ? "S" : "N";
    }

    const opposite = { N: "S", S: "N", E: "W", W: "E" };
    if (target.facing === incomingDir) {
      return "front";
    } else if (target.facing === opposite[incomingDir]) {
      return "back";
    } else {
      return "flank";
    }
  }

  canAttack(attackerId, targetId) {
    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    if (!attacker || !target || !attacker.alive || !target.alive) return false;
    if (attacker.side === target.side) return false;
    if (attacker.ap < 1) return false;

    // Vanish protection against physical attacks
    if (target.statusEffects.some((s) => s.type === "vanish")) return false;

    const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
    const range = attacker.attackRange || 1;
    return dist <= range;
  }

  attack(attackerId, targetId) {
    if (!this.canAttack(attackerId, targetId)) return null;

    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    attacker.ap -= 1;

    // Directional calculation (FFT Style)
    const angle = this.getRelativeAngle(attacker, target);
    let angleMultiplier = 1.0;
    let angleLabel = "";

    if (angle === "back") {
      angleMultiplier = 1.5;
      angleLabel = "BACK ATTACK!";
    } else if (angle === "flank") {
      angleMultiplier = 1.25;
      angleLabel = "FLANK!";
    }

    // Base damage: (ATK * 1.5) - (DEF * 0.7)
    const baseDamage = Math.max(10, Math.round((attacker.atk || 20) * 1.5 - (target.def || 15) * 0.7));

    // Elemental multiplier
    let elemMultiplier = 1.0;
    if (attacker.element && target.element) {
      if (ELEMENT_CHART[attacker.element]?.strongAgainst === target.element) elemMultiplier = 1.4;
      if (ELEMENT_CHART[attacker.element]?.weakAgainst === target.element) elemMultiplier = 0.75;
    }

    // Critical strike chance
    const isCrit = Math.random() < 0.15 || angle === "back";
    const critMultiplier = isCrit ? 1.6 : 1.0;

    // Protect buff reduces physical damage by 35%
    const hasProtect = target.statusEffects.some((s) => s.type === "protect");
    const protectMultiplier = hasProtect ? 0.65 : 1.0;
    const defMultiplier = target.isDefending ? 0.6 : 1.0;

    const finalDamage = Math.max(
      6,
      Math.round(baseDamage * elemMultiplier * angleMultiplier * critMultiplier * defMultiplier * protectMultiplier),
    );

    target.hp = Math.max(0, target.hp - finalDamage);

    // Limit break charging
    attacker.limitGauge = Math.min(100, (attacker.limitGauge || 0) + 15);
    target.limitGauge = Math.min(100, (target.limitGauge || 0) + Math.round((finalDamage / target.maxHp) * 65));

    // Juice feedback
    const badgeText = `-${finalDamage}${angleLabel ? " " + angleLabel : ""}${isCrit && angle !== "back" ? " CRIT!" : ""}`;
    this.addJuice("float", target.x, target.y, badgeText, angle === "back" || isCrit ? "#f59e0b" : "#ef4444");
    this.addJuice("shake", target.x, target.y, angle === "back" ? 7 : 4);

    this.combatLog.unshift(
      `${attacker.name} struck ${target.name} for ${finalDamage} damage!${angleLabel ? ` (${angleLabel})` : ""}`,
    );

    // Check Reactions
    this.handleReactions(target, attacker);

    if (target.hp === 0) {
      this.eliminateUnit(target);
    }

    this.checkVictoryCondition();
    return { damage: finalDamage, angle, isCrit, killed: target.hp === 0 };
  }

  handleReactions(target, attacker) {
    if (!target.reaction || !target.alive) return;

    if (target.reaction.id === "counter" && target.hp > 0) {
      const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
      if (dist <= 1 && Math.random() < 0.5) {
        const counterDmg = Math.max(8, Math.round(target.atk * 0.9));
        attacker.hp = Math.max(0, attacker.hp - counterDmg);
        this.addJuice("float", attacker.x, attacker.y, `-${counterDmg} Counter!`, "#38bdf8");
        this.combatLog.unshift(`${target.name} countered ${attacker.name} for ${counterDmg} damage!`);
        if (attacker.hp === 0) this.eliminateUnit(attacker);
      }
    } else if (target.reaction.id === "auto_potion" && target.hp < target.maxHp * 0.5) {
      const healAmt = 35;
      target.hp = Math.min(target.maxHp, target.hp + healAmt);
      this.addJuice("float", target.x, target.y, `+${healAmt} Auto-Potion`, "#10b981");
      this.combatLog.unshift(`${target.name} consumed an Auto-Potion (+${healAmt} HP)!`);
    } else if (target.reaction.id === "damage_mp" && target.mp >= 10) {
      const mpAbsorb = 15;
      target.mp -= mpAbsorb;
      target.hp = Math.min(target.maxHp, target.hp + 12);
      this.addJuice("float", target.x, target.y, "MP Shield!", "#8b5cf6");
    }
  }

  getAoETiles(centerX, centerY, aoeType = "single", facing = "E") {
    const tiles = [];
    switch (aoeType) {
      case "cross":
        [
          { x: centerX, y: centerY },
          { x: centerX + 1, y: centerY },
          { x: centerX - 1, y: centerY },
          { x: centerX, y: centerY + 1 },
          { x: centerX, y: centerY - 1 },
        ].forEach((p) => {
          if (p.x >= 0 && p.x < GRID_WIDTH && p.y >= 0 && p.y < GRID_HEIGHT) tiles.push(p);
        });
        break;

      case "diamond_3":
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (Math.abs(dx) + Math.abs(dy) <= 2) {
              const tx = centerX + dx;
              const ty = centerY + dy;
              if (tx >= 0 && tx < GRID_WIDTH && ty >= 0 && ty < GRID_HEIGHT) {
                tiles.push({ x: tx, y: ty });
              }
            }
          }
        }
        break;

      case "line":
        const dirOffsets = { N: { dx: 0, dy: -1 }, S: { dx: 0, dy: 1 }, E: { dx: 1, dy: 0 }, W: { dx: -1, dy: 0 } };
        const offset = dirOffsets[facing] || { dx: 1, dy: 0 };
        for (let i = 1; i <= 3; i++) {
          const lx = centerX + offset.dx * i;
          const ly = centerY + offset.dy * i;
          if (lx >= 0 && lx < GRID_WIDTH && ly >= 0 && ly < GRID_HEIGHT) {
            tiles.push({ x: lx, y: ly });
          }
        }
        break;

      case "single":
      default:
        tiles.push({ x: centerX, y: centerY });
        break;
    }
    return tiles;
  }

  castJobAbility(casterId, abilityId, targetX, targetY) {
    const caster = this.units.get(casterId);
    if (!caster || !caster.alive) return null;

    const job = caster.jobData || getJob(caster.jobId || "knight");
    const ability = job?.abilities?.find((a) => a.id === abilityId);
    if (!ability) return null;

    if (caster.ap < (ability.apCost || 1)) return null;
    if (caster.mp < (ability.mpCost || 0)) return null;

    caster.ap -= ability.apCost || 1;
    caster.mp -= ability.mpCost || 0;

    const affectedTiles = this.getAoETiles(targetX, targetY, ability.aoe || "single", caster.facing);
    let hitCount = 0;

    affectedTiles.forEach((tile) => {
      const cell = this.getCell(tile.x, tile.y);
      if (!cell?.unitId) return;

      const target = this.units.get(cell.unitId);
      if (!target || !target.alive) return;

      if (ability.type === "heal") {
        if (target.side === caster.side) {
          const heal = Math.round((caster.mag || 20) * (ability.healMultiplier || 1.5));
          target.hp = Math.min(target.maxHp, target.hp + heal);
          this.addJuice("float", target.x, target.y, `+${heal} Cura`, "#10b981");
          hitCount++;
        }
      } else if (ability.type === "buff") {
        if (target.side === caster.side) {
          if (ability.status) {
            target.statusEffects.push({ type: ability.status, duration: ability.duration || 3 });
          }
          if (ability.buff) {
            target.statusEffects.push({ type: ability.buff.stat, amount: ability.buff.amount, duration: ability.buff.duration });
          }
          this.addJuice("float", target.x, target.y, `${ability.name}!`, "#38bdf8");
          hitCount++;
        }
      } else {
        // Offensive ability (physical or magic)
        if (target.side !== caster.side) {
          const power = ability.damageMultiplier || 1.4;
          const stat = ability.type === "magic" || ability.type === "holy" ? caster.mag || 20 : caster.atk || 20;
          const targetDef = ability.type === "magic" || ability.type === "holy" ? (target.def || 10) * 0.5 : target.def || 15;
          const rawDmg = Math.max(12, Math.round(stat * power * 1.5 - targetDef * 0.7));

          target.hp = Math.max(0, target.hp - rawDmg);
          caster.limitGauge = Math.min(100, (caster.limitGauge || 0) + 20);

          if (ability.debuff) {
            target.statusEffects.push({ type: ability.debuff.stat, amount: ability.debuff.amount, duration: ability.debuff.duration });
          }
          if (ability.status) {
            target.statusEffects.push({ type: ability.status, duration: ability.duration || 2 });
          }
          if (ability.vampiric) {
            const drain = Math.round(rawDmg * ability.vampiric);
            caster.hp = Math.min(caster.maxHp, caster.hp + drain);
            this.addJuice("float", caster.x, caster.y, `+${drain} Lancet`, "#10b981");
          }

          this.addJuice("float", target.x, target.y, `-${rawDmg} ${ability.name}`, "#f97316");
          this.addJuice("shake", target.x, target.y, 5);

          if (target.hp === 0) this.eliminateUnit(target);
          hitCount++;
        }
      }
    });

    this.combatLog.unshift(`${caster.name} cast ${ability.name}!`);
    this.checkVictoryCondition();
    return { name: ability.name, hitCount };
  }

  canExecuteLimit(unitId) {
    const unit = this.units.get(unitId);
    return unit && unit.alive && (unit.limitGauge || 0) >= 100 && unit.ap >= 1;
  }

  executeLimitBreak(casterId, targetX, targetY) {
    const caster = this.units.get(casterId);
    if (!this.canExecuteLimit(casterId)) return null;

    const job = caster.jobData || getJob(caster.jobId || "knight");
    const limit = job?.limitBreak;
    if (!limit) return null;

    caster.limitGauge = 0; // Reset gauge
    caster.ap = Math.max(0, caster.ap - 1);

    const targetCell = this.getCell(targetX, targetY);
    const targetUnit = targetCell?.unitId ? this.units.get(targetCell.unitId) : null;

    if (limit.aoe === "all_enemies") {
      Array.from(this.units.values())
        .filter((u) => u.side !== caster.side && u.alive)
        .forEach((foe) => {
          foe.statusEffects.push({ type: limit.status, duration: limit.duration });
          this.addJuice("float", foe.x, foe.y, "TIME FROZEN!", "#ec4899");
        });
      this.addJuice("shake", 3, 3, 10);
    } else if (limit.aoe === "all_allies") {
      Array.from(this.units.values())
        .filter((u) => u.side === caster.side && u.alive)
        .forEach((ally) => {
          const heal = Math.round(ally.maxHp * 0.8);
          ally.hp = Math.min(ally.maxHp, ally.hp + heal);
          ally.statusEffects.push({ type: "regen", duration: 3 });
          ally.statusEffects.push({ type: "protect", duration: 3 });
          this.addJuice("float", ally.x, ally.y, `+${heal} Grace!`, "#10b981");
        });
      this.addJuice("shake", caster.x, caster.y, 8);
    } else if (limit.aoe === "diamond_3") {
      const tiles = this.getAoETiles(targetX, targetY, "diamond_3", caster.facing);
      tiles.forEach((p) => {
        const cell = this.getCell(p.x, p.y);
        if (cell?.unitId) {
          const foe = this.units.get(cell.unitId);
          if (foe && foe.side !== caster.side && foe.alive) {
            const dmg = Math.round((caster.mag || caster.atk || 25) * limit.damageMultiplier * 1.5);
            foe.hp = Math.max(0, foe.hp - dmg);
            this.addJuice("float", foe.x, foe.y, `-${dmg} LIMIT!`, "#f59e0b");
            if (foe.hp === 0) this.eliminateUnit(foe);
          }
        }
      });
      this.addJuice("shake", targetX, targetY, 12);
    } else {
      // Single target heavy strike
      if (targetUnit && targetUnit.side !== caster.side) {
        const dmg = Math.round((caster.atk || 25) * limit.damageMultiplier * 1.5);
        targetUnit.hp = Math.max(0, targetUnit.hp - dmg);
        this.addJuice("float", targetUnit.x, targetUnit.y, `-${dmg} ${limit.name}!`, "#fbbf24");
        this.addJuice("shake", targetUnit.x, targetUnit.y, 10);
        if (targetUnit.hp === 0) this.eliminateUnit(targetUnit);
      }
    }

    this.combatLog.unshift(`LIMIT BREAK! ${caster.name} unleashed ${limit.name}!`);
    this.checkVictoryCondition();
    return { name: limit.name };
  }

  castSkill(casterId, targetX, targetY) {
    const caster = this.units.get(casterId);
    if (!caster || !caster.alive || !caster.skill) return null;
    const cost = caster.skill.cost || 2;
    if (caster.ap < cost) return null;

    caster.ap -= cost;
    const targetCell = this.getCell(targetX, targetY);
    const targetUnit = targetCell?.unitId ? this.units.get(targetCell.unitId) : null;

    let skillResult = { name: caster.skill.name };

    switch (caster.skill.name) {
      case "Haste Bark":
        Array.from(this.units.values())
          .filter((u) => u.side === caster.side && u.alive)
          .forEach((ally) => {
            ally.ap = Math.min(ally.maxAp + 2, ally.ap + 2);
            ally.spd += 3;
            this.addJuice("float", ally.x, ally.y, "+2 AP Haste!", "#38bdf8");
          });
        this.addJuice("shake", caster.x, caster.y, 4);
        break;

      case "Pyroclast":
        this.getAoETiles(targetX, targetY, "cross").forEach((pos) => {
          const cell = this.getCell(pos.x, pos.y);
          if (cell?.unitId) {
            const foe = this.units.get(cell.unitId);
            if (foe && foe.side !== caster.side && foe.alive) {
              const dmg = Math.round(caster.atk * 1.8);
              foe.hp = Math.max(0, foe.hp - dmg);
              this.addJuice("float", foe.x, foe.y, `-${dmg} Flame!`, "#f97316");
              if (foe.hp === 0) this.eliminateUnit(foe);
            }
          }
        });
        this.addJuice("shake", targetX, targetY, 7);
        break;

      case "Granite Shield":
        if (targetUnit && targetUnit.side === caster.side) {
          targetUnit.isDefending = true;
          targetUnit.def += 15;
          this.addJuice("float", targetUnit.x, targetUnit.y, "Shielded!", "#10b981");
        }
        break;

      case "Blizzard Vortex":
        if (targetUnit && targetUnit.side !== caster.side) {
          const dmg = Math.round(caster.atk * 1.2);
          targetUnit.hp = Math.max(0, targetUnit.hp - dmg);
          targetUnit.ap = 0;
          this.addJuice("float", targetUnit.x, targetUnit.y, `-${dmg} FROZEN!`, "#67e8f9");
          if (targetUnit.hp === 0) this.eliminateUnit(targetUnit);
        }
        break;

      case "Phase Blink":
        if (targetCell && !targetCell.unitId && targetCell.terrain !== "cover") {
          const oldCell = this.getCell(caster.x, caster.y);
          oldCell.unitId = null;
          targetCell.unitId = caster.id;
          caster.x = targetX;
          caster.y = targetY;
          this.addJuice("float", targetX, targetY, "Blink!", "#a855f7");
        }
        break;

      default:
        if (targetUnit && targetUnit.side !== caster.side) {
          const dmg = Math.round(caster.atk * 1.6);
          targetUnit.hp = Math.max(0, targetUnit.hp - dmg);
          this.addJuice("float", targetUnit.x, targetUnit.y, `-${dmg}`, "#ef4444");
          if (targetUnit.hp === 0) this.eliminateUnit(targetUnit);
        }
        break;
    }

    this.combatLog.unshift(`${caster.name} unleashed ${caster.skill.name}!`);
    this.checkVictoryCondition();
    return skillResult;
  }

  defend(unitId) {
    const unit = this.units.get(unitId);
    if (!unit || unit.ap < 1) return false;
    unit.isDefending = true;
    unit.ap = 0;
    this.combatLog.unshift(`${unit.name} raised defensive guard.`);
    this.addJuice("float", unit.x, unit.y, "Guard Up!", "#3b82f6");
    this.nextTurn();
    return true;
  }

  eliminateUnit(unit) {
    unit.alive = false;
    unit.hp = 0;
    const cell = this.getCell(unit.x, unit.y);
    if (cell) cell.unitId = null;
    this.combatLog.unshift(`${unit.name} was defeated!`);
  }

  checkVictoryCondition() {
    const playerAlive = Array.from(this.units.values()).some((u) => u.side === "player" && u.alive);
    const enemyAlive = Array.from(this.units.values()).some((u) => u.side === "enemy" && u.alive);

    if (!enemyAlive) {
      this.isOver = true;
      this.winner = "player";
      this.combatLog.unshift("VICTORY! All enemies vanquished!");
      document.dispatchEvent(new CustomEvent("tactics-battle-won", { detail: { round: this.round } }));
    } else if (!playerAlive) {
      this.isOver = true;
      this.winner = "enemy";
      this.combatLog.unshift("DEFEAT! Your squad has fallen.");
      document.dispatchEvent(new CustomEvent("tactics-battle-lost", { detail: { round: this.round } }));
    }
  }

  executeEnemyAI(unit) {
    if (!unit.alive || this.isOver) return;

    const players = Array.from(this.units.values()).filter((u) => u.side === "player" && u.alive);
    if (players.length === 0) {
      this.nextTurn();
      return;
    }

    players.sort((a, b) => {
      const distA = Math.abs(unit.x - a.x) + Math.abs(unit.y - a.y);
      const distB = Math.abs(unit.x - b.x) + Math.abs(unit.y - b.y);
      return distA - distB;
    });

    const target = players[0];
    const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);

    // If in attack range, strike
    if (dist <= (unit.attackRange || 1) && unit.ap >= 1) {
      this.attack(unit.id, target.id);
      setTimeout(() => this.nextTurn(), 400);
      return;
    }

    // Move closer
    const stepX = unit.x + (target.x > unit.x ? 1 : target.x < unit.x ? -1 : 0);
    const stepY = unit.y + (target.y > unit.y ? 1 : target.y < unit.y ? -1 : 0);

    if (this.canMove(unit.id, stepX, unit.y)) {
      this.move(unit.id, stepX, unit.y);
    } else if (this.canMove(unit.id, unit.x, stepY)) {
      this.move(unit.id, unit.x, stepY);
    }

    const newDist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
    if (newDist <= (unit.attackRange || 1) && unit.ap >= 1) {
      setTimeout(() => {
        this.attack(unit.id, target.id);
        setTimeout(() => this.nextTurn(), 400);
      }, 300);
      return;
    }

    setTimeout(() => this.nextTurn(), 400);
  }

  addJuice(type, x, y, text = "", color = "#ffffff") {
    this.juiceEvents.push({ type, x, y, text, color, timestamp: Date.now() });
  }

  consumeJuice() {
    const events = [...this.juiceEvents];
    this.juiceEvents = [];
    return events;
  }
}
