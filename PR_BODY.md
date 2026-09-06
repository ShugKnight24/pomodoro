## 🍅 Pomidor v1.5 — Major Feature Expansion

### What changed

This PR transforms Pomidor from a simple Pomodoro timer into a full **privacy-first productivity suite**. Everything runs locally — no accounts, no cloud, no tracking.

### New Features

| Feature                  | Description                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Statistics Dashboard** | Total pomodoros, tasks completed, focus time, streaks. Weekly activity chart, GitHub-style heatmap, session history, productivity insights |
| **Focus Mode**           | Fullscreen distraction-free timer with 5 animation styles (particles, ripples, orbiting dots, breathing glow, progress arc)                |
| **Modern Timer UI**      | Alternative centered timer with large animated progress ring. Toggle between classic and modern in settings                                |
| **Achievements**         | 13 unlockable badges — first pomodoro, centurion (100), week warrior, perfect day, early bird, night owl, and more                         |
| **Kanban Board**         | Multi-column boards with drag-and-drop cards, labels, priorities. Tutorial board for first-time users                                      |
| **Vault (Notes)**        | Markdown notes with `[[wiki-style backlinks]]`, folder organization, tags, pinning, search, grid/list views                                |
| **Keyboard Shortcuts**   | Space=start/pause, R=reset, N=new task, F=focus, T=theme, S=settings, V=switch view                                                        |
| **Dark Mode**            | Light/dark theme toggle with system preference detection. 4 app themes: Modern, Legal Pad, Midnight, Ocean                                 |
| **Bilingual (EN/RU)**    | Full i18n with `data-i18n` attribute system, live language switching, persistent preferences                                               |
| **PWA Support**          | Web manifest with app shortcuts, service worker with cache-first offline strategy, installable on desktop and mobile                       |
| **Seed Data Loader**     | 6 test profiles (fresh, casual, committed, power-user, streak-risk, corrupt) for rapid scenario testing                                    |

### Enhancements to Existing Features

- **Timer**: Inter-module event system, tab title updates, stats integration, browser notifications
- **Todo**: Task completion tracking in stats, pomodoro estimate per task with visual progress, enhanced archive
- **Calendar**: Activity heatmap, day modal with task details, week/month toggle, date picker navigation
- **Settings**: Theme presets, timer customization, animation selector, export/import all data as JSON
- **Toast/Volume/Modal**: Custom events, persistent volume, utility methods

### Testing & Automation

- **Playwright E2E tests**: 10 smoke tests covering every view and core interaction
- **Screenshot automation**: 17 automated captures across dark mode, light mode, mobile viewport, and empty states
- Run `npm test` for smoke tests, `npm run screenshots` for visual captures

### Technical Details

- **31 commits** following conventional commit format
- **Zero new dependencies at runtime** — Playwright is dev-only
- **No build step** — still pure vanilla JS ES modules
- **All state in localStorage** — no external services, no tracking
- **PWA installable** — works offline after first visit

### How to Test

```bash
# Install deps (Playwright + serve)
npm install
PLAYWRIGHT_BROWSERS_PATH=0 npx playwright install

# Run smoke tests (10 tests, ~10s)
npm test

# Generate screenshots to screenshots/pr/
npm run screenshots

# Or just open it
npm run serve
# → http://localhost:3000

# Load test data in browser console:
import('./js/seedData.js')
loadSeedData('power-user')  // then reload
```

### Screenshots

> Generated automatically by `npm run screenshots`

<details>
<summary>🌙 Dark Mode</summary>

**Timer (Classic)**
![Timer Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/01-timer-classic-dark.png)

**Todo List**
![Todo Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/02-todo-list-dark.png)

**Stats Dashboard**
![Stats Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/03-stats-dashboard-dark.png)

**Calendar**
![Calendar Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/04-calendar-month-dark.png)

**Kanban Board**
![Kanban Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/05-kanban-board-dark.png)

**Vault Notes**
![Vault Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/06-vault-notes-dark.png)

**Settings**
![Settings Dark](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/07-settings-panel-dark.png)

</details>

<details>
<summary>☀️ Light Mode</summary>

**Timer (Classic)**
![Timer Light](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/08-timer-classic-light.png)

**Todo List**
![Todo Light](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/09-todo-list-light.png)

**Stats Dashboard**
![Stats Light](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/10-stats-dashboard-light.png)

</details>

<details>
<summary>📱 Mobile</summary>

**Timer**
![Timer Mobile](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/11-timer-mobile.png)

**Todo List**
![Todo Mobile](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/12-todo-mobile.png)

**Stats**
![Stats Mobile](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/13-stats-mobile.png)

**Kanban**
![Kanban Mobile](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/14-kanban-mobile.png)

</details>

<details>
<summary>🆕 Empty State (New User)</summary>

**Timer**
![Timer Fresh](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/15-timer-fresh.png)

**Todo (Empty)**
![Todo Empty](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/16-todo-empty.png)

**Stats (Empty)**
![Stats Empty](https://raw.githubusercontent.com/ShugKnight24/pomodoro/refactor/improve_functionality/screenshots/pr/17-stats-empty.png)

</details>
