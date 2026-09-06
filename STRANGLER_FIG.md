# Strangler Fig Modernization Plan

> _"Like the fig, it begins with small additions, often new features, that are built on top of, yet separate to the legacy code base."_ — Martin Fowler

## Overview

This document tracks the incremental modernization of Pomidor using the **Strangler Fig** pattern. The current codebase (`pomodoro/`) remains the source of truth. New implementations are prototyped in `pomodoro-next/`, and when proven, they replace the original code through well-defined seams.

## Desired Outcomes

1. **Maintainability** — Modules that are easier to test, reason about, and extend
2. **Testability** — Every migrated component has unit + integration tests
3. **Performance** — Smaller bundle, faster renders, no unnecessary DOM thrashing
4. **Data integrity** — localStorage data survives every migration step perfectly
5. **Zero downtime** — Users never experience broken functionality during migration

## Current Architecture Assessment

### What We Have (Monolithic SPA)

```
app.js (orchestrator)
  └── 15+ modules, each with:
      ├── Module-level state (closure variables)
      ├── Direct DOM manipulation (querySelector everywhere)
      ├── Direct localStorage read/writes (scattered keys)
      └── Cross-module communication via DOM events + shared state
```

### Key Pain Points / Seam Opportunities

| Area                 | Pain                                                                           | Seam Strategy                                                        |
| -------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| **State management** | Each module reads/writes localStorage independently, no single source of truth | Extract a `Store` layer that all modules read/write through          |
| **DOM coupling**     | Modules directly manipulate HTML by ID/class, tightly coupled to markup        | Introduce component boundaries with clear render contracts           |
| **Init ordering**    | `app.js` must initialize modules in exact sequence                             | Move to event-driven registration where modules declare dependencies |
| **Timer logic**      | Split across `timer.js`, `modernTimer.js`, `focusMode.js`                      | Unify into single timer engine with pluggable UI renderers           |
| **Data shapes**      | No schema validation, silent failures on corrupt data                          | Add schema validation at the storage boundary                        |
| **Testing**          | Zero tests                                                                     | Each migrated module gets tests before replacement                   |

---

## Migration Phases

### Phase 0: Foundation (Do First)

**Goal:** Build the infrastructure that makes Strangler Fig possible without changing any user-facing behavior.

- [ ] **Create a unified `Store` module**
  - Wraps all localStorage access behind a clean API
  - `store.get('stats')`, `store.set('stats', data)`, `store.subscribe('stats', callback)`
  - Existing modules continue working — just redirect their localStorage calls through Store
  - **Seam:** Every `localStorage.getItem/setItem` call is a replacement point

- [ ] **Add schema validation**
  - Define expected shapes for each data key (stats, lists, vault, kanban, achievements)
  - Validate on read, migrate on version mismatch
  - Handles corrupt data gracefully instead of silent breakage

- [ ] **Set up test framework**
  - Vitest or similar (fast, no-config, ESM-native)
  - Test the Store module first as proof of concept
  - Add `npm test` script

- [ ] **Create feature flag system**
  - Simple `flags.js`: `isEnabled('newTimer')` → checks localStorage toggle
  - Settings UI toggle: "Use experimental features"
  - This is the core Strangler Fig mechanism — route to old or new code per feature

### Phase 1: Timer Engine Unification

**Goal:** One timer brain, multiple UI skins.

**Current state:** Timer logic lives in 3 places:

- `timer.js` — classic mode (session/break counters, DOM updates)
- `modernTimer.js` — modern mode (progress ring, centered layout)
- `focusMode.js` — fullscreen overlay (reads from whichever timer is active)

**Migration:**

- [ ] Extract pure timer logic into `timerEngine.js` (no DOM, no UI)
  - State: `{ mode, timeRemaining, totalTime, isRunning, isPaused }`
  - Methods: `start()`, `pause()`, `reset()`, `tick()`, `switchMode()`
  - Events: `onTick`, `onComplete`, `onModeSwitch`
- [ ] Wire classic UI (`timer.js`) to consume `timerEngine` instead of its own logic
- [ ] Wire modern UI (`modernTimer.js`) to consume `timerEngine`
- [ ] Wire focus mode to consume `timerEngine`
- [ ] Delete duplicated timer logic from all three files
- [ ] **Tests:** Timer engine unit tests (tick accuracy, mode switching, edge cases)

### Phase 2: Todo / Task System

**Goal:** Clean data layer, decoupled from DOM rendering.

**Current state:** `todo.js` is the largest module (~1200+ lines). It mixes data CRUD, DOM rendering, drag-and-drop, search/filter, and archive logic.

**Migration:**

- [ ] Extract `taskStore.js` — pure data CRUD for lists and tasks
  - `createList()`, `deleteList()`, `createTask()`, `updateTask()`, `archiveCompleted()`
  - All reads/writes go through the unified Store
- [ ] Extract `taskRenderer.js` — takes task data, returns DOM (or updates DOM)
- [ ] Extract `taskFilters.js` — search, priority filter, sort logic (pure functions)
- [ ] Rewire `todo.js` to orchestrate the above instead of doing everything inline
- [ ] **Tests:** Task CRUD, filter logic, archive behavior

### Phase 3: Stats & Achievements

**Goal:** Reliable analytics that can be independently tested.

- [ ] Extract `statsEngine.js` — pure calculation functions
  - `calculateStreak(dailyData)`, `weeklyTrend(dailyData)`, `averageDaily(dailyData)`
  - Input: stats data object. Output: computed metrics. No DOM.
- [ ] Extract `achievementEngine.js` — rule evaluation decoupled from UI
  - `evaluateAll(stats, tasks, settings) → newlyUnlocked[]`
- [ ] Rewire `stats.js` and `achievements.js` to consume engines
- [ ] **Tests:** Streak calculation edge cases, achievement unlock conditions

### Phase 4: Vault & Kanban

**Goal:** Clean separation between data and presentation for the two heaviest features.

- [ ] Extract `vaultStore.js` — note/folder CRUD, tag management, backlink resolution
- [ ] Extract `kanbanStore.js` — board/column/card CRUD, drag reorder logic
- [ ] Rewire UI modules to consume stores
- [ ] **Tests:** Backlink parsing, card reordering, board operations

### Phase 5: Remove Transitional Architecture

**Goal:** Once all modules consume the new layers, clean up.

- [ ] Remove feature flags (all flags → enabled)
- [ ] Remove any adapter/shim code
- [ ] Audit for dead code paths
- [ ] Update `ROADMAP.md` to reflect new architecture
- [ ] Full regression test pass

---

## Transitional Architecture

This is **expected and acceptable** overhead during migration:

```
┌─────────────────────────────────────────────┐
│                  app.js                      │
│  (orchestrator — unchanged during migration) │
├─────────────────────────────────────────────┤
│          Feature Flags (flags.js)            │
│  ┌──────────┐    ┌──────────────────┐       │
│  │ Old Path │ OR │   New Path       │       │
│  │ (direct  │    │ (engine + store  │       │
│  │  DOM/LS) │    │  + renderer)     │       │
│  └──────────┘    └──────────────────┘       │
├─────────────────────────────────────────────┤
│          Unified Store (store.js)            │
│         Schema Validation Layer              │
├─────────────────────────────────────────────┤
│              localStorage                    │
└─────────────────────────────────────────────┘
```

Both old and new code paths coexist. The feature flag determines which runs. This is the "vine growing alongside the tree" — it costs a bit of extra code, but:

- Reduced risk (flip back if something breaks)
- Earlier value (migrate one feature at a time)
- Learning (each phase teaches us more about the system)

---

## Decision Log

| Date       | Decision                                               | Rationale                                                              |
| ---------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| 2026-03-05 | Start with Store + feature flags before any UI changes | Foundation must exist before any module can be strangled               |
| 2026-03-05 | Timer unification is Phase 1                           | Highest duplication, most testable, affects focus mode UX              |
| 2026-03-05 | Keep `pomodoro/` as source of truth                    | No big-bang rewrites. Every change is proven in `pomodoro-next/` first |

---

## How to Track Progress

Each phase checkbox above tracks migration. The rule:

- **Prototype** in `pomodoro-next/`
- **Prove** with tests
- **Port** to `pomodoro/` behind a feature flag
- **Promote** by enabling the flag by default
- **Prune** by removing the old code path
