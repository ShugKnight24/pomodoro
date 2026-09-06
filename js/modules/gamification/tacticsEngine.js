/**
 * tacticsEngine.js — Core Turn-Based Tactical Grid Combat Engine
 * Data-oriented grid battle simulation following gamedev-forge & game-feel principles.
 */

"use strict";

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
        // Procedural terrain generation if not provided
        if (customTerrain?.[`${x},${y}`]) {
          terrain = customTerrain[`${x},${y}`];
        } else {
          // Add interesting tactical pillars & time rifts
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
    // Position player units on left flank (x = 0..1)
    const playerStarts = [
      { x: 1, y: 3 }, // Hero center
      { x: 0, y: 2 }, // Pet 1
      { x: 0, y: 4 }, // Pet 2
    ];

    playerUnits.forEach((u, i) => {
      const pos = playerStarts[i] || { x: 0, y: i };
      const unit = {
        ...u,
        side: "player",
        x: pos.x,
        y: pos.y,
        hp: u.hp || u.maxHp,
        maxHp: u.maxHp,
        ap: 3,
        maxAp: 3,
        isDefending: false,
        alive: true,
      };
      this.units.set(unit.id, unit);
      this.getCell(pos.x, pos.y).unitId = unit.id;
    });

    // Position enemy units on right flank (x = 5..6)
    const enemyStarts = [
      { x: 5, y: 3 },
      { x: 6, y: 2 },
      { x: 6, y: 4 },
      { x: 5, y: 1 },
    ];

    enemyUnits.forEach((u, i) => {
      const pos = enemyStarts[i] || { x: 6, y: i };
      const unit = {
        ...u,
        side: "enemy",
        x: pos.x,
        y: pos.y,
        hp: u.hp || u.maxHp,
        maxHp: u.maxHp,
        ap: 3,
        maxAp: 3,
        isDefending: false,
        alive: true,
      };
      this.units.set(unit.id, unit);
      this.getCell(pos.x, pos.y).unitId = unit.id;
    });
  }

  getCell(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return null;
    return this.grid[y * GRID_WIDTH + x];
  }

  calculateTurnTimeline() {
    const living = Array.from(this.units.values()).filter((u) => u.alive);
    // Sort by Speed descending
    this.turnOrder = living.sort((a, b) => b.spd - a.spd).map((u) => u.id);
    this.currentTurnIndex = 0;
    this.startTurn();
  }

  getActiveUnit() {
    const id = this.turnOrder[this.currentTurnIndex];
    return this.units.get(id);
  }

  startTurn() {
    if (this.isOver) return;

    const unit = this.getActiveUnit();
    if (!unit || !unit.alive) {
      this.nextTurn();
      return;
    }

    unit.ap = unit.maxAp;
    unit.isDefending = false;

    // Check terrain at unit's tile
    const cell = this.getCell(unit.x, unit.y);
    if (cell.terrain === "time_rift") {
      unit.ap += 1;
      this.addJuice("float", unit.x, unit.y, "+1 AP (Rift)", "#38bdf8");
    } else if (cell.terrain === "healing_glyph") {
      const heal = Math.min(unit.maxHp - unit.hp, 20);
      if (heal > 0) {
        unit.hp += heal;
        this.addJuice("float", unit.x, unit.y, `+${heal} HP`, "#10b981");
      }
    }

    this.combatLog.unshift(`[Turn] ${unit.name}'s turn (AP: ${unit.ap})`);

    // If AI turn, trigger AI execution
    if (unit.side === "enemy") {
      setTimeout(() => this.executeEnemyAI(unit), 450);
    }
  }

  nextTurn() {
    this.checkVictoryCondition();
    if (this.isOver) return;

    this.currentTurnIndex++;
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.round++;
      this.calculateTurnTimeline();
      return;
    }

    this.startTurn();
  }

  // --- ACTIONS ---

  canMove(unitId, targetX, targetY) {
    const unit = this.units.get(unitId);
    if (!unit || !unit.alive || unit.ap < 1) return false;

    const targetCell = this.getCell(targetX, targetY);
    if (!targetCell || targetCell.unitId || targetCell.terrain === "cover") return false;

    const dist = Math.abs(unit.x - targetX) + Math.abs(unit.y - targetY);
    return dist <= (unit.moveRange || 3);
  }

  move(unitId, targetX, targetY) {
    if (!this.canMove(unitId, targetX, targetY)) return false;

    const unit = this.units.get(unitId);
    const oldCell = this.getCell(unit.x, unit.y);
    const newCell = this.getCell(targetX, targetY);

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

  canAttack(attackerId, targetId) {
    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    if (!attacker || !target || !attacker.alive || !target.alive) return false;
    if (attacker.side === target.side) return false; // Friendly fire blocked
    if (attacker.ap < 1) return false;

    const dist = Math.abs(attacker.x - target.x) + Math.abs(attacker.y - target.y);
    const range = attacker.attackRange || 1;
    return dist <= range;
  }

  attack(attackerId, targetId) {
    if (!this.canAttack(attackerId, targetId)) return null;

    const attacker = this.units.get(attackerId);
    const target = this.units.get(targetId);
    attacker.ap -= 1;

    // Damage calculation: (ATK * 1.5) - (DEF * 0.75)
    const baseDamage = Math.max(8, Math.round(attacker.atk * 1.5 - target.def * 0.7));

    // Elemental multiplier
    let elemMultiplier = 1.0;
    if (attacker.element && target.element) {
      if (ELEMENT_CHART[attacker.element]?.strongAgainst === target.element) elemMultiplier = 1.4;
      if (ELEMENT_CHART[attacker.element]?.weakAgainst === target.element) elemMultiplier = 0.75;
    }

    // Critical strike chance (15% base + Speed difference)
    const isCrit = Math.random() < 0.15 + Math.max(0, (attacker.spd - target.spd) * 0.015);
    const critMultiplier = isCrit ? 1.6 : 1.0;

    // Defensive stance
    const defMultiplier = target.isDefending ? 0.6 : 1.0;

    const finalDamage = Math.max(5, Math.round(baseDamage * elemMultiplier * critMultiplier * defMultiplier));

    target.hp = Math.max(0, target.hp - finalDamage);

    // Juice feedback
    this.addJuice("float", target.x, target.y, `-${finalDamage}${isCrit ? " CRIT!" : ""}`, isCrit ? "#f59e0b" : "#ef4444");
    this.addJuice("shake", target.x, target.y, isCrit ? 6 : 3);

    this.combatLog.unshift(
      `⚔️ ${attacker.name} attacked ${target.name} for ${finalDamage} damage!${isCrit ? " (CRITICAL HIT)" : ""}`,
    );

    if (target.hp === 0) {
      this.eliminateUnit(target);
    }

    this.checkVictoryCondition();
    return { damage: finalDamage, isCrit, killed: target.hp === 0 };
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
        // Buff all allies
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
        // Blast target & cross tiles
        [
          { x: targetX, y: targetY },
          { x: targetX + 1, y: targetY },
          { x: targetX - 1, y: targetY },
          { x: targetX, y: targetY + 1 },
          { x: targetX, y: targetY - 1 },
        ].forEach((pos) => {
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
          this.addJuice("float", targetUnit.x, targetUnit.y, "Shielded! 🛡️", "#10b981");
        }
        break;

      case "Blizzard Vortex":
        if (targetUnit && targetUnit.side !== caster.side) {
          const dmg = Math.round(caster.atk * 1.2);
          targetUnit.hp = Math.max(0, targetUnit.hp - dmg);
          targetUnit.ap = 0; // Freeze skips next action
          this.addJuice("float", targetUnit.x, targetUnit.y, `-${dmg} FROZEN! ❄️`, "#67e8f9");
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
          this.addJuice("float", targetX, targetY, "Blink! ✨", "#a855f7");
        }
        break;

      default:
        // Generic tactical strike
        if (targetUnit && targetUnit.side !== caster.side) {
          const dmg = Math.round(caster.atk * 1.6);
          targetUnit.hp = Math.max(0, targetUnit.hp - dmg);
          this.addJuice("float", targetUnit.x, targetUnit.y, `-${dmg}`, "#ef4444");
          if (targetUnit.hp === 0) this.eliminateUnit(targetUnit);
        }
        break;
    }

    this.combatLog.unshift(`✨ ${caster.name} unleashed ${caster.skill.name}!`);
    this.checkVictoryCondition();
    return skillResult;
  }

  defend(unitId) {
    const unit = this.units.get(unitId);
    if (!unit || unit.ap < 1) return false;
    unit.isDefending = true;
    unit.ap = 0; // Consumes rest of turn
    this.combatLog.unshift(`🛡️ ${unit.name} raised defensive guard.`);
    this.addJuice("float", unit.x, unit.y, "Guard Up! 🛡️", "#3b82f6");
    this.nextTurn();
    return true;
  }

  eliminateUnit(unit) {
    unit.alive = false;
    unit.hp = 0;
    const cell = this.getCell(unit.x, unit.y);
    if (cell) cell.unitId = null;
    this.combatLog.unshift(`💀 ${unit.name} was defeated!`);
  }

  checkVictoryCondition() {
    const playerAlive = Array.from(this.units.values()).some((u) => u.side === "player" && u.alive);
    const enemyAlive = Array.from(this.units.values()).some((u) => u.side === "enemy" && u.alive);

    if (!enemyAlive) {
      this.isOver = true;
      this.winner = "player";
      this.combatLog.unshift("🏆 VICTORY! All enemies vanquished!");
      document.dispatchEvent(new CustomEvent("tactics-battle-won", { detail: { round: this.round } }));
    } else if (!playerAlive) {
      this.isOver = true;
      this.winner = "enemy";
      this.combatLog.unshift("💀 DEFEAT! Your squad has fallen.");
      document.dispatchEvent(new CustomEvent("tactics-battle-lost", { detail: { round: this.round } }));
    }
  }

  // --- ENEMY AI ---
  executeEnemyAI(unit) {
    if (!unit.alive || this.isOver) return;

    // Find nearest player unit
    const players = Array.from(this.units.values()).filter((u) => u.side === "player" && u.alive);
    if (players.length === 0) {
      this.nextTurn();
      return;
    }

    // Sort by Manhattan distance
    players.sort((a, b) => {
      const distA = Math.abs(unit.x - a.x) + Math.abs(unit.y - a.y);
      const distB = Math.abs(unit.x - b.x) + Math.abs(unit.y - b.y);
      return distA - distB;
    });

    const target = players[0];
    const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);

    // 1. If in attack range, strike!
    if (dist <= (unit.attackRange || 1) && unit.ap >= 1) {
      this.attack(unit.id, target.id);
      setTimeout(() => this.nextTurn(), 400);
      return;
    }

    // 2. Otherwise, move closer
    const stepX = unit.x + (target.x > unit.x ? 1 : target.x < unit.x ? -1 : 0);
    const stepY = unit.y + (target.y > unit.y ? 1 : target.y < unit.y ? -1 : 0);

    // Try horizontal step
    if (this.canMove(unit.id, stepX, unit.y)) {
      this.move(unit.id, stepX, unit.y);
    } else if (this.canMove(unit.id, unit.x, stepY)) {
      this.move(unit.id, unit.x, stepY);
    }

    // Check if now in attack range after move
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
