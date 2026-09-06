"use strict";

import { getStatsForDate } from "./stats.js";
import { getIcon } from "../utils/icons.js";

const state = {
  currentDate: new Date(),
  tasks: [],
  viewMode: "month", // 'month' or 'week'
  showDatePicker: false,
  selectedDate: null, // Track selected date for day modal
};

const elements = {
  container: null,
  grid: null,
  nextBtn: null,
  prevBtn: null,
  todayBtn: null,
  title: null,
  tooltip: null,
  viewToggleBtns: null,
  datePicker: null,
  weekdaysContainer: null,
  dayModal: null,
  dayModalTitle: null,
  dayModalTaskList: null,
  dayPomodoros: null,
  dayCompleted: null,
  dayQuickTaskInput: null,
  dayAddTaskBtn: null,
};

export function initCalendar() {
  const containerElement = document.querySelector(".calendar-container");

  elements.container = containerElement;
  elements.grid = elements.container.querySelector("[data-calendar-grid]");
  elements.prevBtn = elements.container.querySelector("[data-calendar-prev]");
  elements.nextBtn = elements.container.querySelector("[data-calendar-next]");
  elements.todayBtn = elements.container.querySelector("[data-calendar-today]");
  elements.title = elements.container.querySelector("[data-calendar-title]");
  elements.viewToggleBtns =
    elements.container.querySelectorAll(".view-toggle-btn");
  elements.weekdaysContainer =
    elements.container.querySelector(".calendar-weekdays");

  // Day modal elements
  elements.dayModal = document.getElementById("day-modal");
  elements.dayModalTitle = document.getElementById("day-modal-title");
  elements.dayModalTaskList = document.getElementById("day-task-list");
  elements.dayPomodoros = document.getElementById("day-pomodoros");
  elements.dayCompleted = document.getElementById("day-completed");
  elements.dayQuickTaskInput = document.getElementById("day-quick-task");
  elements.dayAddTaskBtn = document.getElementById("day-add-task-btn");

  createTooltip();
  createDatePicker();
  setupEventListeners();
  render();
}

function createTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "calendar-tooltip";
  document.body.appendChild(tooltip);
  elements.tooltip = tooltip;
}

function createDatePicker() {
  const picker = document.createElement("div");
  picker.className = "date-picker-dropdown";
  picker.innerHTML = `
    <div class="date-picker-header">
      <button class="date-picker-nav" data-picker-prev-year aria-label="Previous year">
        ${getIcon("chevron-left", { size: 14 })}
      </button>
      <span class="date-picker-year" data-picker-year></span>
      <button class="date-picker-nav" data-picker-next-year aria-label="Next year">
        ${getIcon("chevron-right", { size: 14 })}
      </button>
    </div>
    <div class="date-picker-months" data-picker-months></div>
  `;

  // Insert after title in the calendar-nav container
  elements.title.parentNode.insertBefore(picker, elements.title.nextSibling);
  elements.datePicker = picker;
}

function setupEventListeners() {
  elements.prevBtn.addEventListener("click", () => navigate(-1));
  elements.nextBtn.addEventListener("click", () => navigate(1));
  elements.todayBtn?.addEventListener("click", goToToday);

  // View toggle buttons
  elements.viewToggleBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const view = e.currentTarget.dataset.view;
      setViewMode(view);
    });
  });

  // Title click for date picker
  elements.title.addEventListener("click", toggleDatePicker);
  elements.title.style.cursor = "pointer";
  elements.title.title = "Click to select month/year";

  // Date picker events
  elements.datePicker.addEventListener("click", handleDatePickerClick);

  // Close date picker on outside click
  document.addEventListener("click", (e) => {
    if (
      !elements.datePicker.contains(e.target) &&
      e.target !== elements.title
    ) {
      closeDatePicker();
    }
  });

  // Day modal events
  const closeModalBtn = elements.dayModal?.querySelector(
    "[data-close-day-modal]",
  );
  closeModalBtn?.addEventListener("click", closeDayModal);

  // Close modal on backdrop click
  elements.dayModal?.addEventListener("click", (e) => {
    if (e.target === elements.dayModal) {
      closeDayModal();
    }
  });

  // Close modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && elements.dayModal?.classList.contains("active")) {
      closeDayModal();
    }
  });

  // Quick-add task from day modal
  elements.dayAddTaskBtn?.addEventListener("click", handleDayQuickAdd);
  elements.dayQuickTaskInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDayQuickAdd();
    }
  });
}

function navigate(offset) {
  const newDate = new Date(state.currentDate);

  if (state.viewMode === "week") {
    newDate.setDate(newDate.getDate() + offset * 7);
  } else {
    newDate.setMonth(newDate.getMonth() + offset);
  }

  state.currentDate = newDate;
  render();
}

function goToToday() {
  state.currentDate = new Date();
  render();

  // Visual feedback
  const todayCell = elements.grid.querySelector(".calendar-day.today");
  if (todayCell) {
    todayCell.classList.add("highlight-pulse");
    setTimeout(() => todayCell.classList.remove("highlight-pulse"), 600);
  }
}

function setViewMode(mode) {
  state.viewMode = mode;

  // Update button states
  elements.viewToggleBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === mode);
  });

  render();
}

function toggleDatePicker(e) {
  e?.stopPropagation();
  if (state.showDatePicker) {
    closeDatePicker();
  } else {
    openDatePicker();
  }
}

function openDatePicker() {
  state.showDatePicker = true;
  elements.datePicker.classList.add("visible");
  renderDatePicker();
}

function closeDatePicker() {
  state.showDatePicker = false;
  elements.datePicker.classList.remove("visible");
}

function renderDatePicker() {
  const year = state.currentDate.getFullYear();
  const currentMonth = state.currentDate.getMonth();

  // Update year display
  elements.datePicker.querySelector("[data-picker-year]").textContent = year;

  // Render months
  const monthsContainer = elements.datePicker.querySelector(
    "[data-picker-months]",
  );
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const today = new Date();
  const isCurrentYear = year === today.getFullYear();

  monthsContainer.innerHTML = monthNames
    .map((name, index) => {
      const isSelected = index === currentMonth;
      const isCurrent = isCurrentYear && index === today.getMonth();
      return `
      <button class="date-picker-month ${isSelected ? "selected" : ""} ${
        isCurrent ? "current" : ""
      }" 
              data-month="${index}">
        ${name}
      </button>
    `;
    })
    .join("");
}

function handleDatePickerClick(e) {
  const target = e.target.closest("button");
  if (!target) return;

  if (target.dataset.pickerPrevYear !== undefined) {
    state.currentDate.setFullYear(state.currentDate.getFullYear() - 1);
    renderDatePicker();
  } else if (target.dataset.pickerNextYear !== undefined) {
    state.currentDate.setFullYear(state.currentDate.getFullYear() + 1);
    renderDatePicker();
  } else if (target.dataset.month !== undefined) {
    state.currentDate.setMonth(parseInt(target.dataset.month));
    closeDatePicker();
    render();
  }
}

// Keep original function name for backward compatibility
function changeMonth(offset) {
  navigate(offset);
}

export function updateTasks(newTasks) {
  state.tasks = newTasks;
  render();
}

function showTooltip(event, task) {
  const tooltip = elements.tooltip;
  if (!tooltip) return;

  const estimateText = task.estimatedPomodoros
    ? `<div class="tooltip-estimate">${task.pomodoros || 0}/${
        task.estimatedPomodoros
      } pomodoros</div>`
    : task.pomodoros
      ? `<div class="tooltip-pomodoros">${task.pomodoros} pomodoros</div>`
      : "";

  tooltip.innerHTML = `
    <div class="tooltip-header">${task.name}</div>
    <div class="tooltip-meta">
      <span class="tooltip-priority ${task.priority}">${task.priority}</span>
      <span>${task.completed ? `${getIcon("check", { size: 12 })} Completed` : "Active"}</span>
    </div>
    ${estimateText}
  `;

  const rect = event.target.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  tooltip.style.top = `${rect.bottom + scrollTop + 5}px`;
  tooltip.style.left = `${rect.left + scrollLeft}px`;

  if (rect.left + 200 > window.innerWidth) {
    tooltip.style.left = `${rect.right + scrollLeft - 200}px`;
  }

  tooltip.classList.add("visible");
}

function hideTooltip() {
  if (elements.tooltip) {
    elements.tooltip.classList.remove("visible");
  }
}

function render() {
  if (!elements.grid) return;

  if (state.viewMode === "week") {
    renderWeekView();
  } else {
    renderMonthView();
  }
}

function renderWeekView() {
  const current = new Date(state.currentDate);
  const dayOfWeek = current.getDay();

  // Get start of week (Sunday)
  const weekStart = new Date(current);
  weekStart.setDate(current.getDate() - dayOfWeek);

  // Get end of week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Update title
  const startMonth = weekStart.toLocaleString("default", { month: "short" });
  const endMonth = weekEnd.toLocaleString("default", { month: "short" });
  const startYear = weekStart.getFullYear();
  const endYear = weekEnd.getFullYear();

  if (startMonth === endMonth) {
    elements.title.textContent = `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${startYear}`;
  } else if (startYear === endYear) {
    elements.title.textContent = `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${startYear}`;
  } else {
    elements.title.textContent = `${startMonth} ${weekStart.getDate()}, ${startYear} - ${endMonth} ${weekEnd.getDate()}, ${endYear}`;
  }

  elements.grid.innerHTML = "";
  elements.grid.classList.add("week-view");
  elements.grid.classList.remove("month-view");

  const today = new Date();

  // Generate week days
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);

    const dateStr = formatDateStr(date);
    const cell = document.createElement("div");
    cell.className = "calendar-day week-day";
    cell.dataset.date = dateStr;

    // Highlight today
    if (isSameDay(date, today)) {
      cell.classList.add("today");
    }

    // Find tasks for this day
    const tasksForDay = state.tasks.filter((task) => task.dueDate === dateStr);

    // Check stats for this day
    const dayStats = getStatsForDate(dateStr);
    if (dayStats.pomodoros > 0) {
      cell.classList.add("has-stats");
    }
    if (tasksForDay.length > 0) {
      cell.classList.add("has-tasks");
    }

    // Make cell clickable
    cell.style.cursor = "pointer";
    cell.addEventListener("click", (e) => {
      if (e.target.closest(".calendar-task-pill")) return;
      openDayModal(dateStr);
    });

    // Build HTML - show day name and date more prominently in week view
    const dayHeader = document.createElement("div");
    dayHeader.className = "week-day-header";

    // Show mini stats in week view header
    const statsHtml =
      dayStats.pomodoros > 0
        ? `<span class="week-day-stats" title="${dayStats.pomodoros} pomodoros, ${dayStats.focusMinutes}min focus time">
           <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="14" r="8"/><path d="M12 6V2"/><path d="M8 2h8"/></svg>
           ${dayStats.pomodoros}
         </span>`
        : "";

    dayHeader.innerHTML = `
      <span class="week-day-name">${date.toLocaleString("default", {
        weekday: "short",
      })}</span>
      <span class="week-day-number">${date.getDate()}</span>
      ${statsHtml}
    `;
    cell.appendChild(dayHeader);

    const taskContainer = document.createElement("div");
    taskContainer.className = "calendar-tasks week-tasks";

    // Show more tasks in week view
    const MAX_VISIBLE_TASKS = 6;
    const visibleTasks = tasksForDay.slice(0, MAX_VISIBLE_TASKS);

    visibleTasks.forEach((task) => {
      const pill = document.createElement("div");
      pill.className = `calendar-task-pill priority-${
        task.priority || "medium"
      } ${task.completed ? "completed" : ""}`;
      pill.textContent = task.name;

      pill.addEventListener("mouseenter", (event) => showTooltip(event, task));
      pill.addEventListener("mouseleave", hideTooltip);

      taskContainer.appendChild(pill);
    });

    if (tasksForDay.length > MAX_VISIBLE_TASKS) {
      const moreLabel = document.createElement("div");
      moreLabel.className = "calendar-more-tasks";
      moreLabel.textContent = `+${tasksForDay.length - MAX_VISIBLE_TASKS} more`;
      taskContainer.appendChild(moreLabel);
    }

    cell.appendChild(taskContainer);
    elements.grid.appendChild(cell);
  }
}

function renderMonthView() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  // Update Title
  const monthName = state.currentDate.toLocaleString("default", {
    month: "long",
  });
  elements.title.textContent = `${monthName} ${year}`;

  elements.grid.innerHTML = "";
  elements.grid.classList.add("month-view");
  elements.grid.classList.remove("week-view");

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayIndex = firstDay.getDay(); // 0 = Sunday

  // Empty cells for days before start of month
  for (let i = 0; i < startDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day empty";
    elements.grid.appendChild(emptyCell);
  }

  const today = new Date();

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day,
    ).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.dataset.date = dateStr;

    // Highlight current day
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      cell.classList.add("today");
    }

    // Find tasks for this day
    const tasksForDay = state.tasks.filter((task) => task.dueDate === dateStr);

    // Check if this day has pomodoro stats
    const dayStats = getStatsForDate(dateStr);
    if (dayStats.pomodoros > 0) {
      cell.classList.add("has-stats");
    }
    if (tasksForDay.length > 0) {
      cell.classList.add("has-tasks");
    }

    // Make cell clickable to open day modal
    cell.style.cursor = "pointer";
    cell.addEventListener("click", (e) => {
      // Don't open modal if clicking on a task pill
      if (e.target.closest(".calendar-task-pill")) return;
      openDayModal(dateStr);
    });

    // Build HTML
    const dayNumber = document.createElement("span");
    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = day;
    cell.appendChild(dayNumber);

    // Add stats indicator if there are pomodoros
    if (dayStats.pomodoros > 0) {
      const statsIndicator = document.createElement("span");
      statsIndicator.className = "calendar-stats-indicator";
      statsIndicator.title = `${dayStats.pomodoros} pomodoro${dayStats.pomodoros !== 1 ? "s" : ""}, ${dayStats.focusMinutes}min`;
      statsIndicator.innerHTML = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="14" r="8"/><path d="M12 6V2"/><path d="M8 2h8"/></svg> ${dayStats.pomodoros}`;
      cell.appendChild(statsIndicator);
    }

    const taskContainer = document.createElement("div");
    taskContainer.className = "calendar-tasks";

    const MAX_VISIBLE_TASKS = 3;
    const visibleTasks = tasksForDay.slice(0, MAX_VISIBLE_TASKS);

    visibleTasks.forEach((task) => {
      const dotsHTML = document.createElement("span");
      dotsHTML.className = "calendar-task-dots";
      const priorityClass = `priority-${task.priority || "medium"}`;
      const completedClass = task.completed ? "completed" : "";

      const dot = document.createElement("div");
      dot.className = `calendar-task-dot ${priorityClass} ${completedClass}`;
      dot.title = task.name;
      dotsHTML.appendChild(dot);

      const pill = document.createElement("div");
      pill.className = `calendar-task-pill priority-${
        task.priority || "medium"
      } ${task.completed ? "completed" : ""}`;
      pill.textContent = task.name;

      pill.addEventListener("mouseenter", (event) => showTooltip(event, task));
      pill.addEventListener("mouseleave", hideTooltip);

      taskContainer.appendChild(dotsHTML);
      taskContainer.appendChild(pill);
    });

    if (tasksForDay.length > MAX_VISIBLE_TASKS) {
      const moreLabel = document.createElement("div");
      moreLabel.className = "calendar-more-tasks";
      moreLabel.textContent = `+${tasksForDay.length - MAX_VISIBLE_TASKS} more`;
      taskContainer.appendChild(moreLabel);
    }

    cell.appendChild(taskContainer);
    elements.grid.appendChild(cell);
  }
}

// ===================================
// Day Modal Functions
// ===================================

/**
 * Open the day detail modal for a given date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 */
function openDayModal(dateStr) {
  if (!elements.dayModal) return;

  state.selectedDate = dateStr;

  // Format the date for the title
  const date = new Date(dateStr + "T00:00:00");
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (elements.dayModalTitle) {
    elements.dayModalTitle.textContent = formattedDate;
  }

  // Get stats for this day
  const dayStats = getStatsForDate(dateStr);

  if (elements.dayPomodoros) {
    elements.dayPomodoros.textContent = `${dayStats.pomodoros} Pomodoro${dayStats.pomodoros !== 1 ? "s" : ""}`;
  }
  if (elements.dayCompleted) {
    elements.dayCompleted.textContent = `${dayStats.tasks} Completed`;
  }

  // Get tasks for this day
  const tasksForDay = state.tasks.filter((task) => task.dueDate === dateStr);

  renderDayModalTasks(tasksForDay);

  // Show the modal
  elements.dayModal.classList.add("active");

  // Focus the quick-add input
  setTimeout(() => {
    elements.dayQuickTaskInput?.focus();
  }, 300);
}

/**
 * Close the day detail modal
 */
function closeDayModal() {
  if (!elements.dayModal) return;
  elements.dayModal.classList.remove("active");
  state.selectedDate = null;
}

/**
 * Render task list inside the day modal
 * @param {Array} tasks - Array of task objects
 */
function renderDayModalTasks(tasks) {
  if (!elements.dayModalTaskList) return;

  if (tasks.length === 0) {
    elements.dayModalTaskList.innerHTML =
      '<p class="empty-day-message">No tasks scheduled for this day</p>';
    return;
  }

  const html = tasks
    .map((task) => {
      const priorityClass = `priority-${task.priority || "medium"}`;
      const completedClass = task.completed ? "completed" : "";
      const pomodoroInfo = task.estimatedPomodoros
        ? `<span class="day-task-pomodoros">${task.pomodoros || 0}/${task.estimatedPomodoros}</span>`
        : task.pomodoros
          ? `<span class="day-task-pomodoros">${task.pomodoros}</span>`
          : "";

      return `
        <div class="day-task-item ${completedClass} ${priorityClass}">
          ${task.completed ? getIcon("check", { size: 14, className: "day-task-check" }) : getIcon("clock", { size: 14, className: "day-task-check" })}
          <span class="day-task-name">${task.name}</span>
          ${pomodoroInfo}
        </div>
      `;
    })
    .join("");

  elements.dayModalTaskList.innerHTML = html;
}

/**
 * Handle quick-add task from day modal
 */
function handleDayQuickAdd() {
  const input = elements.dayQuickTaskInput;
  if (!input || !input.value.trim() || !state.selectedDate) return;

  const taskName = input.value.trim();

  // Dispatch a custom event for the todo module to handle
  document.dispatchEvent(
    new CustomEvent("calendar-quick-add-task", {
      detail: {
        name: taskName,
        dueDate: state.selectedDate,
      },
    }),
  );

  input.value = "";

  // Refresh the day modal after a brief delay to allow todo module to process
  setTimeout(() => {
    const tasksForDay = state.tasks.filter(
      (task) => task.dueDate === state.selectedDate,
    );
    renderDayModalTasks(tasksForDay);

    // Update stats
    const dayStats = getStatsForDate(state.selectedDate);
    if (elements.dayPomodoros) {
      elements.dayPomodoros.textContent = `${dayStats.pomodoros} Pomodoro${dayStats.pomodoros !== 1 ? "s" : ""}`;
    }
    if (elements.dayCompleted) {
      elements.dayCompleted.textContent = `${dayStats.tasks} Completed`;
    }
  }, 100);
}

// Utility functions
function formatDateStr(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
