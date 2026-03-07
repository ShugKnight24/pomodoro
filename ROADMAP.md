# 🍅 Pomidor (Помидор) — Roadmap

## Vision

**Own your time, own your data.** Build the best privacy-first, bilingual productivity suite that gives people control over their calendar data while using proven focus techniques. No accounts, no cloud lock-in, no surveillance — just you and your tomatoes.

---

## 🎯 Strategic Direction: Calendar Data Ownership

The core pivot: Transform from a Pomodoro timer into a **personal productivity command center** that lets users own their Google Calendar data through **read-only integration**. We'll never write to your calendar — only help you visualize, analyze, and export your own schedule alongside your focused work sessions.

### Why This Matters

- Google Calendar is the de facto standard, but users can't easily analyze their own time data
- Most productivity tools require write access and cloud accounts — we don't
- Privacy-conscious users deserve tools that work offline-first
- Bilingual (EN/RU) from day one shows commitment to global accessibility

---

## 🚀 Current Sprint: v1.5 — Rebrand & Polish

### Completed ✅

- [x] **Rebrand to Pomidor (Помидор)** — New name, brand images, manifest
- [x] **Bilingual Support (EN/RU)** — i18n module with `data-i18n` attribute system
- [x] **Language Selector in Settings** — Persistent preference, live switching
- [x] **Brand Assets** — Cropped, WebP, SVG, PWA icons (72-512px) from brand images
- [x] **Open Source README** — Professional documentation with architecture, contributing guide
- [x] **Service Worker v2** — Updated cache with all new assets

### In Progress 🚧

- [ ] **Apply `data-i18n` to all UI strings** — Complete the translation coverage
- [ ] **MIT License file** — Create LICENSE
- [ ] **CONTRIBUTING.md** — Translation guide, code style, PR process
- [ ] **Code of Conduct** — Standard contributor covenant
- [ ] **Remove Google Analytics** — Replace with privacy-respecting alternative or remove entirely
- [ ] **Screenshots** — Generate desktop and mobile screenshots for manifest

---

## 📅 v2.0 — Calendar Data Ownership (Next Major)

### Google Calendar Read Integration

- [ ] **OAuth2 Authentication** — Google Calendar API read-only scope (`calendar.readonly`)
- [ ] **Event Visualization** — Display Google Calendar events alongside Pomidor tasks in calendar view
- [ ] **Time Block Analysis** — Show how you actually spend time vs. how you plan to
- [ ] **Data Export** — Export merged calendar + task data as ICS, CSV, or JSON
- [ ] **Offline Cache** — Cache last-synced calendar data for offline viewing
- [ ] **No Write Access** — Architectural constraint: read-only by design, enforced at OAuth scope level

### Calendar Enhancements

- [ ] **Day View** — Hourly breakdown with Google Calendar events + Pomodoro sessions
- [ ] **Agenda View** — Chronological list of upcoming events + tasks
- [ ] **Work Week View** — Mon-Fri focused calendar
- [ ] **Event ↔ Task Linking** — Associate calendar events with Pomidor tasks
- [ ] **Time Audit Report** — Weekly/monthly report showing calendar time vs. focused time

### Privacy Dashboard

- [ ] **Data Inventory** — Show users exactly what data is stored and where
- [ ] **One-Click Export** — Export ALL personal data (GDPR-style)
- [ ] **One-Click Delete** — Wipe all local data with confirmation
- [ ] **Connection Status** — Show when Google Calendar data was last synced, what scope is granted

---

## 🌍 v2.1 — Community & i18n Expansion

### Internationalization

- [ ] **Translation Contribution Guide** — Step-by-step for adding languages
- [ ] **Translation Progress Tracker** — Show completion % per language in README
- [ ] **RTL Support Foundation** — For Arabic, Hebrew, etc.
- [ ] **Date/Time Localization** — Locale-aware date formats, week start day
- [ ] **Number Formatting** — Locale-specific number display

### Community Infrastructure

- [ ] **Issue Templates** — Bug report, feature request, translation PR
- [ ] **GitHub Actions CI** — Linting, accessibility checks, translation validation
- [ ] **Playwright E2E Tests** — Core user flows
- [ ] **Unit Tests** — Timer logic, stats calculations, i18n module
- [ ] **Contribution Leaderboard** — Recognize contributors in README

---

## 🔐 v3.0 — Data Sovereignty Suite

### Local-First Analytics

- [ ] **Remove all third-party analytics** — No Google Analytics, no trackers
- [ ] **Local Analytics Dashboard** — Self-contained productivity analytics
- [ ] **Time Categorization** — Tag focus sessions with categories (Work, Study, Personal)
- [ ] **Productivity Reports** — Weekly/monthly auto-generated summaries
- [ ] **Heatmap Improvements** — Year view, contribution graph with intensity

### Data Portability

- [ ] **Standard Formats** — Import/export in ICS, CSV, JSON, Markdown
- [ ] **Cross-App Migration** — Import from other Pomodoro apps (Toggl, Forest, etc.)
- [ ] **Backup Scheduling** — Periodic auto-export reminders
- [ ] **Optional Encrypted Backup** — AES-256 encrypted JSON export

### Mobile Excellence

- [ ] **Responsive Overhaul** — Touch-first interactions, swipe gestures
- [ ] **Haptic Feedback** — Timer completion vibration (where supported)
- [ ] **Mini Floating Timer** — Small overlay that stays visible while browsing tasks

---

## ✅ Completed Features Archive

### v1.0 — Core Features

- [x] Pomodoro timer with session/break cycles
- [x] Todo list with multiple lists
- [x] Calendar view with task visualization
- [x] Progress ring and hourglass visualizations
- [x] Drag and drop task reordering
- [x] Archive functionality

### v1.1 — Modern Redesign

- [x] Glassmorphism UI design
- [x] Dark mode support
- [x] Professional color palette
- [x] Keyboard shortcuts module

### v1.2 — Statistics & Customization

- [x] Statistics dashboard with charts
- [x] Multiple app themes (Modern, Legal Pad, Midnight, Ocean)
- [x] Custom timer presets
- [x] Browser notifications
- [x] Timer in tab title
- [x] Export/Import data
- [x] Enhanced calendar with day modal

### v1.3 — Focus & Animations

- [x] Focus mode with fullscreen timer
- [x] 5 animation styles (particles, ripples, orbiting dots, breathing glow, progress arc)
- [x] Week/Month calendar views
- [x] Calendar date picker
- [x] Modern Timer UI
- [x] Achievement/badge system (13 badges)
- [x] Celebration animations (confetti, streaks, task completion)
- [x] Task pomodoro estimates

### v1.5 — Rebrand & Open Source

- [x] Rebrand to Pomidor (Помидор)
- [x] Bilingual support (EN/RU)
- [x] i18n module with extensible translation framework
- [x] Brand assets (WebP, SVG, PNG, PWA icons)
- [x] Open source README with architecture docs
- [x] Service worker v2

---

## 💡 Future Ideas (Backlog)

### Quick Wins

- [ ] Ambient sounds (rain, coffee shop, lo-fi, white noise)
- [ ] Motivational quotes in focus mode
- [ ] Sound effects library (satisfying task completion sounds)
- [ ] Task ↔ Timer association (click task to set as current focus)

### Medium Effort

- [ ] Subtasks & checklists
- [ ] Tags/Labels with color coding
- [ ] Daily review modal (end-of-day summary)
- [ ] Pomodoro templates ("Deep Work 50/10", "Sprint 25/5")
- [ ] Custom theme builder

### Ambitious

- [ ] Widget mode (tiny floating timer overlay)
- [ ] Spotify/music integration
- [ ] Time blocking calendar view
- [ ] Keyboard-first (vim-style) navigation
- [ ] Voice commands for hands-free timer control
- [ ] Browser extension companion
- [ ] Team collaboration features

---

## 🏗️ Technical Debt & Quality

- [ ] Add comprehensive unit tests (timer logic, stats calculations)
- [ ] Add E2E tests (Playwright)
- [ ] Refactor section toggle (don't rely on max-height)
- [ ] Improve accessibility (WCAG 2.1 AA)
- [ ] Performance audit (Lighthouse 100)
- [ ] Bundle size optimization (code-split large modules)
- [ ] CSP headers for security
- [ ] Semantic HTML audit

### Platform Expansion

- [ ] **Browser Extension** - Timer in browser toolbar
- [ ] **Mobile App** - React Native version
- [ ] **Team/Collaborative** - Shared pomodoros with teammates
- [ ] **Integration Hub** - Todoist, Notion, Calendar sync

---

## 🐛 Known Issues

- None currently tracked

---

## 📝 Notes

- Keep bundle size minimal - no heavy frameworks
- Prioritize offline functionality
- Maintain accessibility standards
- Test across browsers (Chrome, Firefox, Safari)
- Animations should be toggleable for performance/preference
