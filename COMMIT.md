# Commit Strategy

Below is a suggested order for breaking down changes into bite-sized, feature-specific commits using conventional commits.

---

## 1. Core Timer Enhancements

```bash
git add js/modules/timer.js
git commit -m "feat(timer): add timer events and state management

- Add dispatchTimerEvent for inter-module communication
- Add getTimerState export for external modules
- Add timer-tick, timer-state-change events
- Listen for timer-preset-change events"
```

```bash
git add js/modules/timer.js
git commit -m "feat(timer): add tab title updates during timer

- Show remaining time and mode in browser tab
- Update title on each tick (e.g., '24:59 - 🍅 Focus')
- Reset title on timer reset/complete"
```

```bash
git add js/modules/timer.js
git commit -m "feat(timer): integrate stats and notifications

- Record pomodoro completion in stats module
- Send browser notifications on session/break complete
- Dispatch pomodoro-complete event for achievements"
```

---

## 2. Statistics Module

```bash
git add js/modules/stats.js
git commit -m "feat(stats): add comprehensive statistics tracking

- Track total pomodoros, tasks, focus minutes
- Daily data with pomodoros/tasks/focusMinutes per day
- Session history with timestamps
- Current and longest streak tracking"
```

```bash
git add js/modules/stats.js index.html css/styles.css
git commit -m "feat(stats): add activity heatmap and insights

- GitHub-style activity heatmap with month navigation
- Productivity insights (avg daily, best day, goal rate, weekly trend)
- Recent sessions list
- Period toggle (week/month/all time)"
```

---

## 3. Focus Mode

```bash
git add js/modules/focusMode.js index.html css/styles.css
git commit -m "feat: add fullscreen focus mode

- Distraction-free timer overlay
- Sync with main timer state
- Progress ring visualization
- Play/pause/reset controls
- Keyboard shortcut (F) to toggle"
```

```bash
git add js/modules/focusMode.js
git commit -m "feat(focus-mode): add session/break mode toggle

- Toggle between session and break before starting
- Time adjustment controls (+/- 5 min)
- Sync with timer presets"
```

---

## 4. Modern Timer UI

```bash
git add js/modules/modernTimer.js index.html css/styles.css
git commit -m "feat: add modern timer UI style

- Focus-mode style timer for main view
- Large progress ring with animated countdown
- Session/break mode toggle
- Time adjustment controls
- Toggle in settings between classic and modern"
```

---

## 5. Achievements System

```bash
git add js/modules/achievements.js index.html css/styles.css
git commit -m "feat: add achievements and gamification

- 13 unlockable achievements with icons
- Popup notification on unlock
- Achievement sound effect
- Confetti celebration for major achievements
- Track pomodoros, tasks, streaks, time of day"
```

---

## 6. Keyboard Shortcuts

```bash
git add js/modules/keyboard.js index.html css/styles.css
git commit -m "feat: add keyboard shortcuts module

- Space: start/pause timer
- R: reset, N: new task, L: new list
- T: toggle theme, S: settings, V: switch view
- F: focus mode, ?: show shortcuts overlay
- First-visit overlay to introduce shortcuts"
```

---

## 7. Theme System

```bash
git add js/modules/theme.js css/styles.css css/variables.css
git commit -m "feat: add dark mode toggle

- Light/dark theme switching
- Persist preference in localStorage
- Listen for system preference changes
- Animated toggle button"
```

---

## 8. Todo Enhancements

```bash
git add js/modules/todo.js
git commit -m "feat(todo): add task completion tracking

- Record completed tasks in statistics
- Task complete animation
- Dispatch task-complete event for achievements"
```

```bash
git add js/modules/todo.js index.html css/styles.css
git commit -m "feat(todo): add pomodoro estimates for tasks

- Optional estimated pomodoros when creating task
- Visual progress indicator (filled vs remaining)
- Over-estimate indicator
- Stats view toggle"
```

---

## 9. Volume & Toast Improvements

```bash
git add js/modules/volume.js
git commit -m "fix(volume): improve volume control

- Persist volume in localStorage
- Add null checks for elements
- Display current volume percentage"
```

```bash
git add js/modules/toast.js
git commit -m "feat(toast): add custom event listener

- Listen for show-toast custom events
- Allow triggering toasts from any module"
```

---

## 10. PWA Support

```bash
git add manifest.json sw.js
git commit -m "feat: add PWA support

- Web app manifest with icons and shortcuts
- Service worker with offline caching
- Stale-while-revalidate strategy
- Push notification support
- Background sync placeholder"
```

---

## 11. Documentation & Config

```bash
git add ROADMAP.md TODO.md NOTES.md
git commit -m "docs: add project documentation

- Roadmap with feature phases
- TODO list with planned improvements
- Technical notes for future reference"
```

```bash
git add css/futureVars.css js/modules/futureSectionToggle.js js/utils/futureDragNDrop.js
git commit -m "chore: add future/experimental modules

- CSS variables for future theming
- Section toggle utility
- Generic drag and drop utility"
```

---

## Quick Reference

| Prefix | Purpose |
|--------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting (no code change) |
| `refactor` | Code restructure |
| `perf` | Performance improvement |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

---

## Suggested Order

1. **Timer events** (foundation for other features)
2. **Stats module** (used by timer, todo, achievements)
3. **Theme** (standalone)
4. **Toast improvements** (used by many modules)
5. **Volume fix** (standalone)
6. **Todo enhancements** (depends on stats)
7. **Keyboard shortcuts** (depends on focus mode)
8. **Focus mode** (depends on timer events)
9. **Modern timer** (depends on timer events)
10. **Achievements** (depends on stats, timer events)
11. **PWA support** (standalone)
12. **Documentation** (last)
