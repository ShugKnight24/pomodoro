/**
 * habits.js — Habit & Recurring Routine Accounting Module
 * Privacy-first local habit tracking with streaks, categories, and pomodoro integration.
 */

"use strict";

import { getIcon } from "../utils/icons.js";
import { showSuccess } from "./toast.js";

const STORAGE_KEY = "pomidor.habits";

const DEFAULT_HABITS = [
  {
    id: "h-1",
    title: "Morning Focus & Planning",
    category: "work",
    frequency: "daily",
    targetPomodoros: 1,
    createdAt: new Date().toISOString(),
    history: {},
  },
  {
    id: "h-2",
    title: "Deep Work Session",
    category: "work",
    frequency: "weekdays",
    targetPomodoros: 3,
    createdAt: new Date().toISOString(),
    history: {},
  },
  {
    id: "h-3",
    title: "Read Technical Articles or Book",
    category: "learning",
    frequency: "daily",
    targetPomodoros: 1,
    createdAt: new Date().toISOString(),
    history: {},
  },
  {
    id: "h-4",
    title: "Daily Movement & Walk",
    category: "health",
    frequency: "daily",
    targetPomodoros: 0,
    createdAt: new Date().toISOString(),
    history: {},
  },
];

let habits = [];

function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadHabits() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      habits = JSON.parse(saved);
    } else {
      habits = [...DEFAULT_HABITS];
      saveHabits();
    }
  } catch (e) {
    console.error("Failed to load habits:", e);
    habits = [...DEFAULT_HABITS];
  }
}

function saveHabits() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error("Failed to save habits:", e);
  }
}

/**
 * Calculates current streak for a habit
 */
export function calculateHabitStreak(habit) {
  if (!habit.history) return 0;

  const today = new Date();
  let streak = 0;
  let checkDate = new Date(today);

  // If today is completed, streak includes today
  const todayKey = getTodayKey();
  if (habit.history[todayKey]?.completed) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Check if yesterday was completed
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Iterate backwards
  while (true) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, "0");
    const day = String(checkDate.getDate()).padStart(2, "0");
    const key = `${year}-${month}-${day}`;

    // If weekdays frequency, skip weekends when computing streaks
    const dayOfWeek = checkDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (habit.frequency === "weekdays" && isWeekend) {
      checkDate.setDate(checkDate.getDate() - 1);
      continue;
    }

    if (habit.history[key]?.completed) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function initHabits() {
  loadHabits();
  setupHabitsUI();
  setupEventListeners();
}

function setupEventListeners() {
  // Listen for pomodoro completions to auto-credit active habit
  document.addEventListener("pomodoro-complete", (e) => {
    // If an active habit was linked
    const activeHabitId = sessionStorage.getItem("activeHabitId");
    if (activeHabitId) {
      logHabitPomodoro(activeHabitId);
    }
  });
}

export function getHabits() {
  return habits;
}

export function toggleHabitToday(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;

  if (!habit.history) habit.history = {};

  const todayKey = getTodayKey();
  const current = habit.history[todayKey] || { completed: false, pomodoros: 0 };
  const nextCompleted = !current.completed;

  habit.history[todayKey] = {
    ...current,
    completed: nextCompleted,
    completedAt: nextCompleted ? new Date().toISOString() : null,
  };

  saveHabits();
  renderHabitsList();

  if (nextCompleted) {
    const streak = calculateHabitStreak(habit);
    showSuccess(`Habit "${habit.title}" completed! ${streak} day streak`);
    document.dispatchEvent(
      new CustomEvent("habit-completed", {
        detail: { habit, streak },
      }),
    );
  }
}

export function logHabitPomodoro(id) {
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;

  if (!habit.history) habit.history = {};

  const todayKey = getTodayKey();
  const current = habit.history[todayKey] || { completed: false, pomodoros: 0 };
  const newPoms = (current.pomodoros || 0) + 1;
  const isNowComplete = habit.targetPomodoros > 0 ? newPoms >= habit.targetPomodoros : current.completed;

  habit.history[todayKey] = {
    ...current,
    pomodoros: newPoms,
    completed: isNowComplete,
    completedAt: isNowComplete ? new Date().toISOString() : current.completedAt,
  };

  saveHabits();
  renderHabitsList();
  showSuccess(`Logged 1 pomodoro for "${habit.title}" (${newPoms}/${habit.targetPomodoros || 1})`);
}

export function addHabit({ title, category = "work", frequency = "daily", targetPomodoros = 1 }) {
  const newHabit = {
    id: "h-" + Date.now(),
    title: title.trim(),
    category,
    frequency,
    targetPomodoros: parseInt(targetPomodoros) || 0,
    createdAt: new Date().toISOString(),
    history: {},
  };

  habits.push(newHabit);
  saveHabits();
  renderHabitsList();
  showSuccess(`Habit "${newHabit.title}" created`);
  return newHabit;
}

export function deleteHabit(id) {
  habits = habits.filter((h) => h.id !== id);
  saveHabits();
  renderHabitsList();
  showSuccess("Habit removed");
}

function setupHabitsUI() {
  const todoContainer = document.querySelector(".todo-container");
  if (!todoContainer) return;

  // Insert Habit Accounting Section above or inside the tasks container
  let habitSection = document.getElementById("habits-section");
  if (!habitSection) {
    habitSection = document.createElement("div");
    habitSection.id = "habits-section";
    habitSection.className = "habits-section";
    
    // Insert after lists section or at top of tasks
    const tasksSection = document.querySelector(".tasks-section");
    if (tasksSection) {
      tasksSection.parentNode.insertBefore(habitSection, tasksSection);
    } else {
      todoContainer.prepend(habitSection);
    }
  }

  habitSection.innerHTML = `
    <div class="habits-header">
      <div class="habits-title-group">
        <h3 class="habits-title">${getIcon("fire", { size: 20 })} Daily Habits & Routines</h3>
        <span class="habits-progress-badge" id="habits-progress-badge">0/0 Done</span>
      </div>
      <button class="button habits-toggle-form-btn" id="toggle-new-habit-btn" title="Add new habit">
        ${getIcon("plus", { size: 14 })} New Habit
      </button>
    </div>

    <!-- Collapsible New Habit Form -->
    <div class="new-habit-form hidden" id="new-habit-form">
      <input type="text" id="new-habit-title" placeholder="Habit title (e.g. Read 30 mins)..." class="new-input habit-title-input" />
      <div class="habit-form-row">
        <select id="new-habit-category" class="setting-select habit-select">
          <option value="work">Work</option>
          <option value="learning">Learning</option>
          <option value="health">Health</option>
          <option value="mindfulness">Mindfulness</option>
        </select>
        <select id="new-habit-frequency" class="setting-select habit-select">
          <option value="daily">Every Day</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekly">Weekly</option>
        </select>
        <input type="number" id="new-habit-target" min="0" max="10" value="1" placeholder="Target Pomodoros" class="new-input habit-num-input" title="Target Pomodoros (0 = check only)" />
        <button class="button save-habit-btn" id="save-habit-btn">Add Habit</button>
      </div>
    </div>

    <div class="habits-list-container" id="habits-list-container"></div>
  `;

  // Bind toggle form
  const toggleBtn = document.getElementById("toggle-new-habit-btn");
  const form = document.getElementById("new-habit-form");
  toggleBtn?.addEventListener("click", () => {
    form?.classList.toggle("hidden");
  });

  const saveBtn = document.getElementById("save-habit-btn");
  saveBtn?.addEventListener("click", () => {
    const titleInput = document.getElementById("new-habit-title");
    const categorySelect = document.getElementById("new-habit-category");
    const freqSelect = document.getElementById("new-habit-frequency");
    const targetInput = document.getElementById("new-habit-target");

    if (!titleInput?.value.trim()) return;

    addHabit({
      title: titleInput.value,
      category: categorySelect?.value || "work",
      frequency: freqSelect?.value || "daily",
      targetPomodoros: targetInput?.value || 1,
    });

    titleInput.value = "";
    form?.classList.add("hidden");
  });

  renderHabitsList();
}

export function renderHabitsList() {
  const container = document.getElementById("habits-list-container");
  const badge = document.getElementById("habits-progress-badge");
  if (!container) return;

  const todayKey = getTodayKey();
  const completedCount = habits.filter((h) => h.history?.[todayKey]?.completed).length;

  if (badge) {
    badge.textContent = `${completedCount}/${habits.length} Done`;
    if (completedCount === habits.length && habits.length > 0) {
      badge.classList.add("all-done");
    } else {
      badge.classList.remove("all-done");
    }
  }

  if (habits.length === 0) {
    container.innerHTML = `<p class="empty-habits-message">No habits tracked yet. Click "+ New Habit" to begin!</p>`;
    return;
  }

  container.innerHTML = habits
    .map((habit) => {
      const todayData = habit.history?.[todayKey] || { completed: false, pomodoros: 0 };
      const isCompleted = todayData.completed;
      const streak = calculateHabitStreak(habit);
      const pomodoroCount = todayData.pomodoros || 0;
      const target = habit.targetPomodoros || 0;

      return `
        <div class="habit-card ${isCompleted ? "completed" : ""}" data-habit-id="${habit.id}">
          <button class="habit-check-btn ${isCompleted ? "checked" : ""}" data-toggle-habit="${habit.id}" title="${isCompleted ? "Mark incomplete" : "Complete habit today"}" aria-label="Toggle habit">
            ${isCompleted ? getIcon("check", { size: 16 }) : ""}
          </button>
          
          <div class="habit-info">
            <span class="habit-title ${isCompleted ? "strikethrough" : ""}">${escapeHtml(habit.title)}</span>
            <div class="habit-metadata">
              <span class="habit-category-tag category-${habit.category}">${escapeHtml(habit.category)}</span>
              <span class="habit-frequency-tag">${habit.frequency}</span>
              ${streak > 0 ? `<span class="habit-streak-badge" title="${streak} day streak">${getIcon("fire", { size: 13 })} ${streak}d</span>` : ""}
            </div>
          </div>

          <div class="habit-actions">
            ${
              target > 0
                ? `<span class="habit-poms-pill" title="${pomodoroCount} of ${target} pomodoros logged today">
                    ${getIcon("tomato", { size: 14 })} ${pomodoroCount}/${target}
                   </span>
                   <button class="habit-action-btn habit-log-pom" data-log-habit-pom="${habit.id}" title="Log focus pomodoro">
                     ${getIcon("plus", { size: 12 })}
                   </button>`
                : ""
            }
            <button class="habit-action-btn danger habit-delete-btn" data-delete-habit="${habit.id}" title="Delete habit">
              ${getIcon("trash", { size: 13 })}
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  // Attach event delegation
  container.querySelectorAll("[data-toggle-habit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toggleHabitToday(btn.getAttribute("data-toggle-habit"));
    });
  });

  container.querySelectorAll("[data-log-habit-pom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      logHabitPomodoro(btn.getAttribute("data-log-habit-pom"));
    });
  });

  container.querySelectorAll("[data-delete-habit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-delete-habit");
      if (confirm("Are you sure you want to remove this habit?")) {
        deleteHabit(id);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
