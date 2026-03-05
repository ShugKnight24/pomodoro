# Pomodoro App - TODO List of Improvements

Interactive Elements:
Smooth page transitions
Micro-interactions on button clicks

---

Functionality Enhancements:
Timer improvements: custom durations, auto-start breaks
Statistics: Track completed pomodoros per day/week, productivity charts
Customization: Custom sounds, themes, session presets
Data management: Export/import, cloud sync option

---

Technical Improvements:
ES6 modules for better code organization
State management pattern (simple reducer or state machine)
Web Audio API instead of basic <audio> element
Notifications API for desktop alerts
Service Worker for offline support

---

todo improvements: Allow users to edit due dates and priorities after task creation

🏷️ Categories/Tags (builds on priorities)
Additional Suggestions:
📊 Task completion stats (gamification)
💾 Export/Import data (data portability)
🌙 Dark mode toggle (accessibility)
UNDO / REDO
🗂️ Sub-tasks
📝 Task descriptions / notes
Calendar view integration
Recurring tasks

---

- Create a ticking sound per second

  - Allow this to be replaced by another sound -> YT vid, etc

- Refine Pomodoro tracking system

  - Possible add a modal that opens and allows user to input number of Pomodoros completed today / take notes / create a history / track productivity & progress over time etc...

---

1. Mobile Experience (High Priority) - continue to improve and refine this experience

Expandable Task Cards: Instead of trying to cram all metadata (dates, priority, pomodoro count) into one line, hide them by default on mobile.
Default view: Checkbox + Task Name.
Click/Tap: Expands the card to show Due Date, Priority, Pomodoro controls, and Edit/Delete buttons.
Benefit: Keeps the interface clean and focus-oriented.

- Dynamic Title: Update the browser tab title (e.g., (24:59) Pomodoro) so users can see the timer while in other tabs.

3. Core Timer Functionality
   Your timer.js has TODO comments for features that are standard in most Pomodoro apps.

Custom Durations: Replace the + / - 5-minute buttons with a modal or input field that lets users set exact times (e.g., 50/10 split).
Auto-start Breaks/Pomodoros: Add a toggle in settings to automatically start the next timer. This reduces friction and keeps the user in the "flow." 4. Audio & Notifications
Ticking Sound: Add a subtle ticking sound (white noise) that plays while the timer is running. This helps some users focus.
Browser Notifications: Use the Notification API to alert users when a timer ends, even if the browser is minimized.
