# 🍅 Pomidor — Project Task Tracker

## Completed & Shipped ✅

### Core Timer & Audio
- [x] **High-Precision Dual Timer Engines** — Classic hourglass SVG visualization + Modern circular SVG progress ring.
- [x] **Dynamic Browser Tab Title** — Real-time countdown timer updates in tab title `(MM:SS) Mode — Pomidor`.
- [x] **Custom Durations & Session Presets** — 25/5, 50/10, 90/20, or custom duration settings with instant persistence.
- [x] **Web Audio API Chime Fallback** — Dual-tone synthesized chime handles browser autoplay restrictions gracefully.
- [x] **Browser Notifications** — Web Notifications API triggers alerts upon interval completion.
- [x] **Auto-Start Next Interval** — Settings toggle to chain focus and break sessions seamlessly.

### Tasks, Notes & Planning
- [x] **Expandable Task Cards** — Clean default view with expandable metadata (due date, priority, pomodoros, subtasks, notes).
- [x] **Subtasks & Notes Integration** — Nested subtask checklists and collapsible markdown notes per task item.
- [x] **Categories & Priorities** — High/Medium/Low priority badges, task tagging, and search filtering.
- [x] **Visual Kanban Board** — Drag-and-drop columns for Backlog, In Progress, and Completed tasks.
- [x] **Encrypted Notes Vault** — Folder tree, note tagging, and client-side markdown note editor.
- [x] **Interactive Calendar & Day Modal** — Month and week grid views with quick-add task modals.

### Gamification & Living Outpost
- [x] **Living Outpost Diorama** — 5 animated stations with real-time character locomotion and interactive tap loot.
- [x] **Realm Focus Carousel & Panoramic Modes** — Smooth touch-swipe, navigation arrows, and snap scrolling.
- [x] **Dignified Companion Expeditions** — Zero-flicker modal updating tasks and awarding the Chrono Sovereign Sigil.
- [x] **Final Fantasy Tactics RPG Engine** — 7x7 grid turn-based combat, CT timeline, job classes, party recruitment tavern, and dungeon exploration.

### Multi-Tenancy, Privacy & Administration
- [x] **Partitioned Persona Architecture** — 6 preloaded tenant profiles isolated under `pomidor.tenant.<id>` keys.
- [x] **Accountability Lounge** — Virtual co-working focus chambers, buddy squad cards, and real-time activity stream.
- [x] **Admin Telemetry Command Center** — Live FPS, memory heap gauges, latency tracking, and partition directory inspection.
- [x] **Client-Side Bot Differentiation** — Heuristic automation scanner scoring WebDriver and synthetic movements.
- [x] **Visual Coordinate Heatmap HUD** — Canvas heatmap overlay with traffic type filters.

### Design, Branding & PWA
- [x] **4 Brand Logo Variants** — Sleek Modern, Soviet Constructivist, Edgy Tactical, Lighthearted Playful (EN/RU SVGs).
- [x] **Strict Zero-Unicode-Emoji Policy** — 100% scalable SVG vector architecture across all views and components.
- [x] **Modern Glassmorphic Settings Drawer** — Sticky header, category filter tabs (`All`, `Appearance`, `Timer`, `Companions`, `Data`), sticky footer with Esc key handling.
- [x] **Multilingual Support (i18n)** — English, Russian, Azerbaijani, and Hebrew dictionaries.
- [x] **Offline-First PWA (v4)** — Complete Service Worker caching of all 60+ modules and offline assets.
- [x] **Automated Test Coverage** — 12 Playwright test suites with 99 tests passing 100%.

---

## Upcoming Backlog (v2.0 — Calendar Data Ownership) 🎯

### Google Calendar Integration
- [ ] **Read-Only OAuth2 Flow** — Google Calendar read-only scope (`calendar.readonly`) with zero write permissions.
- [ ] **Calendar Event Layering** — Display Google Calendar schedule events alongside Pomidor tasks in calendar view.
- [ ] **Time Block Audit** — Visual comparison of scheduled calendar commitments vs actual tracked focus pomodoros.
- [ ] **Export Merged Schedule** — Export calendar sessions and completed pomodoros as standard `.ics` / `.csv`.

### Sound & Ambient Audio Enhancements
- [ ] **Ambient White Noise & Ticking** — Synthesized subtle mechanical clock ticking or rain/forest ambient soundscapes using Web Audio API nodes.
- [ ] **Custom Audio Pack Loader** — Allow users to load custom audio chimes into IndexedDB.

### Mobile & Touch Polish
- [ ] **PWA Standalone Display Polish** — iOS safe area notch padding and dynamic viewport height (`100dvh`) refinement.
