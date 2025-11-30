"use strict";

const state = {
  currentDate: new Date(),
  tasks: [],
};

const elements = {
  container: null,
  grid: null,
  title: null,
  prevBtn: null,
  nextBtn: null,
};

export function initCalendar() {
  const containerElement = document.querySelector(".calendar-container");

  elements.container = containerElement;
  elements.grid = elements.container.querySelector("[data-calendar-grid]");
  elements.title = elements.container.querySelector("[data-calendar-title]");
  elements.prevBtn = elements.container.querySelector("[data-calendar-prev]");
  elements.nextBtn = elements.container.querySelector("[data-calendar-next]");

  setupEventListeners();
  render();
}

function setupEventListeners() {
  elements.prevBtn.addEventListener("click", () => changeMonth(-1));
  elements.nextBtn.addEventListener("click", () => changeMonth(1));
}

export function updateTasks(newTasks) {
  state.tasks = newTasks;
  render();
}

function changeMonth(offset) {
  const newDate = new Date(state.currentDate);
  newDate.setMonth(newDate.getMonth() + offset);
  state.currentDate = newDate;
  render();
}

function render() {
  if (!elements.grid) return;

  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();

  // Update Title
  // TODO: Make title clickable to open a year/month picker
  const monthName = state.currentDate.toLocaleString("default", {
    month: "long",
  });
  elements.title.textContent = `${monthName} ${year}`;

  elements.grid.innerHTML = "";

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
      day
    ).padStart(2, "0")}`;
    const cell = document.createElement("div");
    cell.className = "calendar-day";

    // Highlight current day
    if (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    ) {
      cell.classList.add("today");
    }

    // Find tasks for this day
    const tasksForDay = state.tasks.filter((task) => {
      if (!task.dueDate) return false;
      return task.dueDate === dateStr;
    });

    // Build HTML
    // TODO: Make dots clickable to open task details
    // TODO: Implement similar to Google Calendar with hover details
    let dotsHTML = '<div class="calendar-tasks">';
    tasksForDay.forEach((task) => {
      const priorityClass = `priority-${task.priority || "medium"}`;
      const completedClass = task.completed ? "completed" : "";
      dotsHTML += `<div class="calendar-task-dot ${priorityClass} ${completedClass}" title="${task.name}"></div>`;
    });
    dotsHTML += "</div>";

    cell.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      ${dotsHTML}
    `;

    elements.grid.appendChild(cell);
  }
}
