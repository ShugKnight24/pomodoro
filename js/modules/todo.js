"use strict";

import { updateTasks } from "./calendar.js";
import { confirmDelete } from "./modal.js";
import { showSuccess, showError } from "./toast.js";
import { setupTaskDragAndDrop } from "../utils/todoDragDrop.js";
import { recordTaskCompleted } from "./stats.js";
import { getIcon, renderPomodoroBadges } from "../utils/icons.js";
import { renderHeroDashboard } from "./gamification/heroUI.js";

const archive = {
  ARCHIVE_LIST_ID: -1, // Special ID for archive list
  ARCHIVE_LIST_NAME: "Archive",
};

// TODO: Possibly create seperate state objects for different functionalities
// DOM Elements
export const elements = {
  calendarContainer: null,
  clearArchiveButton: null,
  clearCompletedTasks: null,
  clearSearchButton: null,
  deleteListButton: null,
  filterButtons: null,
  statsContainer: null,
  heroContainer: null,
  listsContainer: null,
  listCount: null,
  newListForm: null,
  newListInput: null,
  newTaskForm: null,
  newTaskInput: null,
  priorityFilterButtons: null,
  searchInput: null,
  taskDueDateInput: null,
  taskListContainer: null,
  taskListTitle: null,
  taskPrioritySelect: null,
  taskEstimateInput: null,
  taskSortButton: null,
  tasksContainer: null,
  taskCount: null,
  todoContainer: null,
  viewToggleButtons: null,
};

// Local storage keys
const STORAGE_KEYS = {
  ARCHIVE: "pomodoro.archive",
  LIST_COUNTER: "pomodoro.listCounter",
  LISTS: "pomodoro.lists",
  SELECTED_LIST_ID: "pomodoro.selectedListId",
  TASK_COUNTER: "pomodoro.taskCounter",
};

// State
const state = {
  archive: null,
  listCounter: 0,
  lists: [],
  priorityFilter: "all", // all | high | medium | low
  searchQuery: "",
  selectedListId: null,
  statusFilter: "all", // all | active | completed
  sortingType: "creation", // creation | dueDate | priority
  taskCounter: 0,
  view: "list", // 'list' | 'calendar'
};

const openSubtasks = new Set();

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function initTodo() {
  initializeElements();
  loadFromStorage();
  createArchive();
  createTutorialList();
  setupEventListeners();
  render();
}

function initializeElements() {
  elements.calendarContainer = document.getElementById("calendar-container");
  elements.statsContainer = document.getElementById("stats-container");
  elements.kanbanContainer = document.getElementById("kanban-container");
  elements.vaultContainer = document.getElementById("vault-container");
  elements.calendarGrid = document.querySelector("[data-calendar-grid]");
  elements.calendarTitle = document.querySelector("[data-calendar-title]");
  elements.calendarPrevBtn = document.querySelector("[data-calendar-prev]");
  elements.calendarNextBtn = document.querySelector("[data-calendar-next]");
  elements.clearArchiveButton = document.querySelector("[data-clear-archive]");
  elements.clearCompletedTasks = document.querySelector(
    "[data-clear-completed-tasks]",
  );
  elements.clearSearchButton = document.querySelector("[data-clear-search]");
  elements.deleteListButton = document.querySelector(
    "[data-delete-list-button]",
  );
  elements.filterButtons = document.querySelectorAll("[data-filter]");
  elements.listsContainer = document.querySelector("[data-lists]");
  elements.listCount = document.querySelector("[data-list-count]");
  elements.newListForm = document.querySelector("[data-new-list-form]");
  elements.newListInput = document.querySelector("[data-new-list-input]");
  elements.newTaskForm = document.querySelector("[data-new-task-form]");
  elements.newTaskInput = document.querySelector("[data-new-task-input]");
  elements.priorityFilterButtons = document.querySelectorAll(
    "[data-priority-filter]",
  );
  elements.searchInput = document.querySelector("[data-search-input]");
  elements.taskDueDateInput = document.querySelector("[data-task-due-date]");
  elements.taskListContainer = document.querySelector(
    "[data-list-display-container]",
  );
  elements.taskListTitle = document.querySelector("[data-list-title]");
  elements.taskPrioritySelect = document.querySelector("[data-task-priority]");
  elements.taskEstimateInput = document.querySelector("[data-task-estimate]");
  elements.taskSortButton = document.querySelector("[data-sort-toggle]");
  elements.tasksContainer = document.querySelector("[data-tasks]");
  elements.taskCount = document.querySelector("[data-task-count]");
  elements.todoContainer = document.querySelector(".todo-container");
  elements.heroContainer = document.getElementById("hero-container");
  // Only get main view toggle buttons (list, calendar, stats), not calendar month/week toggle
  elements.viewToggleButtons = document.querySelectorAll(
    ".view-controls [data-view]",
  );
}

/* Load data from localStorage */
function loadFromStorage() {
  state.archive =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.ARCHIVE)) || null;
  state.listCounter =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.LIST_COUNTER)) || 0;
  state.lists = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTS)) || [];
  state.selectedListId =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_LIST_ID)) || null;
  state.taskCounter =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.TASK_COUNTER)) || 0;
}

function createArchive() {
  if (!state.archive) {
    state.archive = {
      id: archive.ARCHIVE_LIST_ID,
      name: archive.ARCHIVE_LIST_NAME,
      tasks: [],
      isArchive: true,
    };
    save();
  }
}

// ─── Tutorial List ─────────────────────────────────────────
const TUTORIAL_KEY = "pomodoro.tutorialListDone";

function createTutorialList() {
  if (localStorage.getItem(TUTORIAL_KEY)) return;
  if (state.lists.length > 0) {
    localStorage.setItem(TUTORIAL_KEY, "done");
    return;
  }

  const list = createList("Getting Started");

  const tutorialTasks = [
    {
      name: "Welcome! Check this off to complete your first task",
      priority: "high",
      estimate: 0,
    },
    {
      name: "Try editing this task — click the pencil icon",
      priority: "medium",
      estimate: 0,
    },
    {
      name: "Set a due date on a task using the date picker",
      priority: "medium",
      estimate: 0,
    },
    {
      name: "Add a pomodoro to a task with the + button",
      priority: "medium",
      estimate: 2,
    },
    {
      name: "Drag tasks to reorder them (grab the handle)",
      priority: "low",
      estimate: 0,
    },
    {
      name: "Use the search bar to filter tasks by name",
      priority: "low",
      estimate: 0,
    },
    {
      name: "Try the priority filters — High / Medium / Low",
      priority: "low",
      estimate: 0,
    },
    {
      name: "Create a new list using the input below the sidebar",
      priority: "low",
      estimate: 1,
    },
    {
      name: "Clear completed tasks to send them to the Archive",
      priority: "low",
      estimate: 0,
    },
  ];

  tutorialTasks.forEach(({ name, priority, estimate }) => {
    list.tasks.push(createTask(name, priority, null, estimate));
  });

  state.lists.push(list);
  state.selectedListId = list.id;
  localStorage.setItem(TUTORIAL_KEY, "done");
  save();
}

function setupEventListeners() {
  elements.clearArchiveButton?.addEventListener("click", clearArchive);
  elements.clearCompletedTasks.addEventListener("click", clearCompletedTasks);
  elements.clearSearchButton.addEventListener("click", clearSearch);
  elements.deleteListButton.addEventListener("click", deleteCurrentList);
  elements.filterButtons.forEach((btn) => {
    btn.addEventListener("click", handleStatusFilter);
  });
  elements.listsContainer.addEventListener("click", listItemClick);
  elements.newListForm.addEventListener("submit", newListSubmit);
  elements.newTaskForm.addEventListener("submit", newTaskSubmit);
  elements.priorityFilterButtons.forEach((btn) => {
    btn.addEventListener("click", handlePriorityFilter);
  });
  elements.searchInput.addEventListener("input", handleSearch);
  elements.tasksContainer.addEventListener("click", taskClick);
  elements.tasksContainer.addEventListener("submit", handleSubtaskSubmit);
  elements.taskSortButton.addEventListener("click", toggleSortType);
  elements.viewToggleButtons.forEach((btn) => {
    btn.addEventListener("click", handleViewToggle);
  });

  document.getElementById("header-hero-badge")?.addEventListener("click", () => {
    state.view = "hero";
    elements.viewToggleButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === "hero");
    });
    render();
  });

  setupTaskDragAndDrop();

  // Listen for calendar quick-add tasks
  document.addEventListener("calendar-quick-add-task", (e) => {
    const { name, dueDate } = e.detail;
    if (!name || !dueDate) return;

    // Add to the currently selected list (or first list)
    const targetList = getCurrentList() || state.lists[0];
    if (!targetList || targetList.isArchive) {
      // If archive or no list, use first non-archive list
      const firstList = state.lists[0];
      if (!firstList) return;
      const task = createTask(name, "medium", dueDate, 0);
      firstList.tasks.push(task);
    } else {
      const task = createTask(name, "medium", dueDate, 0);
      targetList.tasks.push(task);
    }

    saveAndRender();
  });
}

function listItemClick(event) {
  // Find the button element (could be the button itself or an icon inside it)
  const button = event.target.closest("button");

  if (button) {
    event.stopPropagation();

    // Handle save button click
    if (button.dataset.saveList) {
      const listId = parseInt(button.dataset.saveList);
      saveListName(listId);
      return;
    }

    // Handle edit button click
    if (button.dataset.editList) {
      const listId = parseInt(button.dataset.editList);
      editListName(listId);
      return;
    }
  }

  // Handle list selection (only if not clicking on input or button)
  if (
    event.target.tagName.toLowerCase() !== "input" &&
    !button &&
    (event.target.tagName.toLowerCase() === "li" ||
      event.target.classList.contains("list-name-text"))
  ) {
    const listElement = event.target.closest("li");
    if (listElement) {
      state.selectedListId = parseInt(listElement.dataset.listId);
      saveAndRender();
    }
  }
}

function newListSubmit(event) {
  event.preventDefault();
  const listName = elements.newListInput.value.trim();

  if (!listName) {
    // TODO: create a validation error for the input
    showError("List name cannot be empty");
    return;
  }

  const list = createList(listName);
  elements.newListInput.value = "";
  state.lists.push(list);
  state.selectedListId = list.id;
  saveAndRender();
  showSuccess(`List "${listName}" created`);
}

function clearCompletedTasks() {
  const selectedList = getCurrentList();

  if (!selectedList) {
    showError(`No list selected to clear completed tasks`);
    return;
  }

  const completedTasks = selectedList.tasks.filter((task) => task.completed);

  if (completedTasks.length === 0) {
    showError("No completed tasks to clear");
    return;
  }

  // Add metadata for restoration from archive
  const tasksToArchive = completedTasks.map((task) => ({
    ...task,
    archivedAt: new Date().toISOString(),
    archivedFrom: selectedList.name,
    originalListId: selectedList.id,
  }));
  state.archive.tasks.push(...tasksToArchive);

  selectedList.tasks = selectedList.tasks.filter((task) => !task.completed);

  saveAndRender();
  showSuccess(
    `${completedTasks.length} task${
      completedTasks.length === 1 ? "" : "s"
    } moved to archive`,
  );
}

async function clearArchive() {
  // Clear archive button should already be hidden, just in case
  if (state.archive.tasks.length === 0) {
    showError("Your archive is already empty");
    return;
  }

  const confirmed = await confirmDelete(
    `${state.archive.tasks.length} archived task${
      state.archive.tasks.length === 1 ? "" : "s"
    }`,
    "permanently delete",
  );
  if (!confirmed) return;

  const count = state.archive.tasks.length;
  state.archive.tasks = [];
  saveAndRender();
  showSuccess(
    `${count} archived task${count === 1 ? "" : "s"} deleted permanently`,
  );
}

async function deleteCurrentList() {
  const listToDelete = getCurrentList();

  if (!listToDelete) {
    showError(`No list selected to delete`);
    return;
  }

  const confirmed = await confirmDelete(listToDelete.name, "list");
  if (!confirmed) return;

  state.lists = state.lists.filter((list) => list.id !== state.selectedListId);
  state.selectedListId = state.lists.length ? state.lists[0].id : null;
  saveAndRender();
  showSuccess(`List "${listToDelete.name}" deleted`);
}

function taskClick(event) {
  // Handle subtask checkbox toggle
  if (
    event.target.tagName.toLowerCase() === "input" &&
    event.target.type === "checkbox" &&
    event.target.dataset.toggleSubtask
  ) {
    const [taskIdStr, subtaskId] = event.target.dataset.toggleSubtask.split(":");
    const taskId = parseInt(taskIdStr);
    const selectedList = getCurrentList();
    const task = selectedList?.tasks.find((t) => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find((st) => String(st.id) === String(subtaskId));
      if (subtask) {
        subtask.completed = event.target.checked;
        save();
        updateTaskState(taskId);
        if (subtask.completed) {
          document.dispatchEvent(
            new CustomEvent("subtask-complete", {
              detail: { taskId, subtaskId },
            }),
          );
        }
      }
    }
    return;
  }

  // Handle main task checkbox toggle
  if (
    event.target.tagName.toLowerCase() === "input" &&
    event.target.type === "checkbox"
  ) {
    const selectedList = getCurrentList();
    if (!selectedList) {
      showError(`No list selected`);
      return;
    }
    const selectedTask = selectedList.tasks.find(
      (task) => task.id === parseInt(event.target.id),
    );
    selectedTask.completed = event.target.checked;
    selectedTask.completedAt = event.target.checked
      ? new Date().toISOString()
      : null;

    // Track completed tasks in statistics
    if (event.target.checked) {
      recordTaskCompleted();

      // Dispatch task-complete event for achievements
      document.dispatchEvent(
        new CustomEvent("task-complete", {
          detail: { taskName: selectedTask.name, taskId: selectedTask.id },
        }),
      );

      // Add celebration animation to the task
      const taskElement = document.querySelector(
        `[data-task-item="${selectedTask.id}"]`,
      );
      if (taskElement) {
        taskElement.classList.add("task-complete-animation");
        setTimeout(() => {
          taskElement.classList.remove("task-complete-animation");
        }, 600);
      }
    }

    save();
    renderTaskCount(selectedList);
    updateTaskState(selectedTask.id);
    return;
  }

  // Find the button element (could be the button itself or an icon inside it)
  const button = event.target.closest("button");

  if (button) {
    // Handle toggle subtasks button click
    if (button.dataset.toggleSubtasks) {
      const taskId = parseInt(button.dataset.toggleSubtasks);
      if (openSubtasks.has(taskId)) {
        openSubtasks.delete(taskId);
      } else {
        openSubtasks.add(taskId);
      }
      updateTaskState(taskId);
      return;
    }

    // Handle delete subtask button click
    if (button.dataset.deleteSubtask) {
      const [taskIdStr, subtaskId] = button.dataset.deleteSubtask.split(":");
      const taskId = parseInt(taskIdStr);
      const selectedList = getCurrentList();
      const task = selectedList?.tasks.find((t) => t.id === taskId);
      if (task && task.subtasks) {
        task.subtasks = task.subtasks.filter((st) => String(st.id) !== String(subtaskId));
        save();
        updateTaskState(taskId);
      }
      return;
    }
    // Handle restore button click (for archive)
    if (button.dataset.restoreTask) {
      const taskId = parseInt(button.dataset.restoreTask);
      restoreTask(taskId);
      return;
    }

    // Handle add pomodoro button click
    if (button.dataset.addPomodoro) {
      const taskId = parseInt(button.dataset.addPomodoro);
      addPomodoro(taskId);
      return;
    }

    // Handle remove pomodoro button click
    if (button.dataset.removePomodoro) {
      const taskId = parseInt(button.dataset.removePomodoro);
      removePomodoro(taskId);
      return;
    }

    // Handle save button click
    if (button.dataset.saveTask) {
      const taskId = parseInt(button.dataset.saveTask);
      saveTaskName(taskId);
      return;
    }

    // Handle delete button click
    if (button.dataset.deleteTask) {
      const taskId = parseInt(button.dataset.deleteTask);
      deleteTask(taskId);
      return;
    }

    // Handle edit button click
    if (button.dataset.editTask) {
      const taskId = parseInt(button.dataset.editTask);
      editTaskName(taskId);
      return;
    }
  }

  // Mobile Expansion Logic
  // TODO: Add a modal for desktop as well?
  if (window.innerWidth <= 768) {
    if (event.target.matches("input, select, textarea")) {
      return;
    }

    const taskCard = event.target.closest(".task");
    if (taskCard) {
      if (event.target.closest("label")) {
        event.preventDefault();
      }
      taskCard.classList.toggle("expanded");
    }
  }
}

function handleSubtaskSubmit(e) {
  const form = e.target.closest("[data-add-subtask-form]");
  if (!form) return;
  e.preventDefault();
  const taskId = parseInt(form.dataset.addSubtaskForm);
  const input = form.querySelector(".subtask-add-input");
  const text = input?.value.trim();
  if (text) {
    const selectedList = getCurrentList();
    const task = selectedList?.tasks.find((t) => t.id === taskId);
    if (task) {
      task.subtasks = task.subtasks || [];
      task.subtasks.push({
        id: Date.now().toString(),
        text,
        completed: false,
      });
      openSubtasks.add(taskId);
      save();
      updateTaskState(taskId);
    }
  }
}

function newTaskSubmit(event) {
  event.preventDefault();
  const taskName = elements.newTaskInput.value.trim();
  const dueDate = elements.taskDueDateInput.value || null;
  const priority = elements.taskPrioritySelect.value;
  const estimate = parseInt(elements.taskEstimateInput?.value) || 0;

  if (!taskName) {
    // TODO: create a validation error for the input
    showError("Task name cannot be empty");
    return;
  }

  const task = createTask(taskName, priority, dueDate, estimate);
  elements.newTaskInput.value = "";
  elements.taskDueDateInput.value = "";
  elements.taskPrioritySelect.value = "medium";
  if (elements.taskEstimateInput) elements.taskEstimateInput.value = "";

  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to add task`);
    return;
  }
  selectedList.tasks.push(task);
  saveAndRender();

  const estimateText = estimate > 0 ? ` (${estimate} estimated pomodoros)` : "";
  showSuccess(
    `Task "${taskName}" added with "${priority}" priority${
      dueDate ? ` due "${dueDate}"` : ""
    }${estimateText}`,
  );
}

function createList(name) {
  state.listCounter++;

  return {
    id: state.listCounter, // TODO: Create a better unique id
    name: name,
    tasks: [],
  };
}

function createTask(name, priority = "medium", dueDate = null, estimate = 0) {
  state.taskCounter++;

  return {
    id: state.taskCounter, // TODO: Create a better unique id
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    dueDate: dueDate,
    estimatedPomodoros: estimate,
    name: name,
    pomodoros: 0,
    priority: priority,
    subtasks: [],
  };
}

function save() {
  const { archive, listCounter, lists, selectedListId, taskCounter } = state;
  localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archive));
  localStorage.setItem(STORAGE_KEYS.LIST_COUNTER, listCounter);
  localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  localStorage.setItem(STORAGE_KEYS.SELECTED_LIST_ID, selectedListId);
  localStorage.setItem(STORAGE_KEYS.TASK_COUNTER, taskCounter);
}

function render() {
  clearElement(elements.listsContainer);
  renderLists();
  const selectedList = getCurrentList();

  // Hide all containers first
  elements.todoContainer.classList.add("hidden");
  elements.calendarContainer.classList.add("hidden");
  elements.statsContainer?.classList.add("hidden");
  elements.kanbanContainer?.classList.add("hidden");
  elements.vaultContainer?.classList.add("hidden");
  elements.heroContainer?.classList.add("hidden");

  if (state.view === "calendar") {
    elements.calendarContainer.classList.remove("hidden");

    // Collect all tasks from all lists for the calendar
    const allTasks = state.lists.flatMap((list) => list.tasks);
    updateTasks(allTasks);
  } else if (state.view === "stats") {
    elements.statsContainer?.classList.remove("hidden");
  } else if (state.view === "kanban") {
    elements.kanbanContainer?.classList.remove("hidden");
  } else if (state.view === "vault") {
    elements.vaultContainer?.classList.remove("hidden");
  } else if (state.view === "hero") {
    elements.heroContainer?.classList.remove("hidden");
    renderHeroDashboard();
  } else {
    // List view (default)
    elements.todoContainer.classList.remove("hidden");

    if (!selectedList) {
      elements.taskListContainer.classList.add("hidden");
      return;
    } else {
      elements.taskListContainer.classList.remove("hidden");
      elements.taskListTitle.innerText = selectedList.name;
      renderTaskCount(selectedList);
      clearElement(elements.tasksContainer);
      renderTasks(selectedList);
      updateArchiveSectionVisibility();
    }
  }
}

export function saveAndRender() {
  save();
  render();
}

function renderLists() {
  state.lists.forEach((list) => {
    buildListHTML(list);
  });
  // Render Archive last in list
  buildListHTML(state.archive);
  renderListCount();
}

function buildListHTML(list) {
  const { id, isArchive, name } = list;
  const isActive = id === state.selectedListId ? "active-list" : "";
  const archiveClass = isArchive ? "archive-list" : "";
  const archiveIcon = archiveClass ? `${getIcon("archive", { size: 14 })} ` : "";

  // TODO: Break into atoms / render list input edit button... etc
  let listTemplate = `
    <li class="list-name ${isActive} ${archiveClass}" data-list-id="${id}">
      <span class="list-name-text" data-list-text="${id}">${archiveIcon}${name}</span>
      ${
        !archiveClass
          ? `<input
        name="list-name-${id}"
        class="list-name-input hidden" 
        data-list-input="${id}" 
        type="text" 
        value="${name}"
      />
      <button class="list-action-btn edit-list-btn" data-edit-list="${id}" title="Edit list name" aria-label="Edit list name">
        ${getIcon("edit", { size: 13 })}
      </button>`
          : ""
      }
      
    </li>
  `;

  // TODO: Add delete list here as well?

  elements.listsContainer.insertAdjacentHTML("beforeend", listTemplate);
}

function renderListCount() {
  const listsPlusArchive = state.lists.length + 1;
  const listCountString = `${listsPlusArchive} list${
    listsPlusArchive === 1 ? "" : "s"
  }`;
  elements.listCount.innerText = listCountString;
}

function renderTaskCount(selectedList) {
  const filteredTasks = filterTasks(selectedList.tasks);
  const incompleteTasksCount = filteredTasks.filter(
    (task) => !task.completed,
  ).length;
  const taskString = incompleteTasksCount === 1 ? "task" : "tasks";

  if (selectedList.isArchive) {
    elements.taskCount.innerText = `${filteredTasks.length} archived ${
      filteredTasks.length === 1 ? "task" : "tasks"
    }`;
  } else if (
    state.statusFilter !== "all" ||
    state.priorityFilter !== "all" ||
    state.searchQuery
  ) {
    // TODO: Better way to display... causes layout shift
    elements.taskCount.innerText = `${filteredTasks.length} ${
      filteredTasks.length === 1 ? "task" : "tasks"
    } shown (${incompleteTasksCount} ${taskString} remaining)`;
  } else {
    elements.taskCount.innerText = `${incompleteTasksCount} ${taskString} remaining`;
  }
}

function renderTasks(selectedList) {
  const tasksToRender = getTasksToRender(selectedList.tasks);

  if (tasksToRender.length === 0) {
    return (elements.tasksContainer.innerHTML = renderNoTasks(selectedList));
  }

  tasksToRender.forEach((task) => {
    const matchesSearch =
      state.searchQuery && task.name.toLowerCase().includes(state.searchQuery);
    buildTaskHTML(task, false, matchesSearch, selectedList.isArchive);
  });
}

// TODO: Simplify Ternary Logic to improve readability and clarify
function renderNoTasks(selectedList) {
  const { isArchive } = selectedList;
  const { priorityFilter, searchQuery, statusFilter } = state;

  const icon = isArchive ? getIcon("archive", { size: 32 }) : getIcon("search", { size: 32 });
  const noTaskMessage = isArchive
    ? "Archive is empty"
    : searchQuery
      ? `No tasks found matching "${searchQuery}"`
      : "No tasks found";
  const noTaskHint = isArchive
    ? `Completed tasks will appear here when cleared from lists`
    : searchQuery
      ? `Try a different search term`
      : statusFilter !== "all" || priorityFilter !== "all"
        ? `Try adjusting your filters`
        : `Create your first task to get started!`;

  const noTasksHTML = `
    <div class="no-results">
      <div class="no-results-icon">${icon}</div>
      <p>${noTaskMessage}</p>
      <p>${noTaskHint}</p>
    </div>
  `;
  return noTasksHTML;
}

function getTaskDates(task) {
  return {
    archivedAt: task.archivedAt ? formatDate(task.archivedAt) : null,
    archivedAtLong: task.archivedAt ? formatDateLong(task.archivedAt) : null,
    completedAt: task.completedAt ? formatDate(task.completedAt) : null,
    completedAtLong: task.completedAt ? formatDateLong(task.completedAt) : null,
    createdAt: task.createdAt ? formatDate(task.createdAt) : null,
    createdAtLong: task.createdAt ? formatDateLong(task.createdAt) : null,
    dueDate: task.dueDate ? formatDate(task.dueDate) : null,
    dueDateLong: task.dueDate ? formatDateLong(task.dueDate) : null,
  };
}

function getTaskState(task) {
  const now = new Date();
  return {
    isCompleted: task.completed,
    isOverdue: task.dueDate && !task.completed && new Date(task.dueDate) < now,
    priority: task.priority || "medium",
    pomodoroCount: task.pomodoros || 0,
  };
}

// TODO: Export all these functions into utils and import from there??
function buildDragHandle() {
  return `
    <button class="drag-handle" data-drag-handle aria-label="Drag to reorder" title="Drag to reorder" draggable="true">
      ${getIcon("grip", { size: 14 })}
    </button>
  `;
}

function buildPriorityIndicator(priority) {
  const { icon, label } = getPriorityInfo(priority);
  return `<span class="priority-indicator" title="${label} priority">${icon}</span>`;
}

function buildCustomCheckbox(task, completed, isArchive) {
  const { id, name } = task;
  return `
    <input
      class="check"
      type="checkbox"
      id="${id}"
      name="" value=""
      ${completed}
      ${isArchive ? "disabled" : ""}
    >
    <label for="${id}">
      <span class="custom-checkbox"></span>
      <span class="task-name-text" data-task-text="${id}">${name}</span>
    </label>
  `;
}

function buildTaskInput(task, isArchive) {
  if (isArchive) return "";
  const { dueDate, id, name, priority } = task;

  return `
    <div class="task-edit-form hidden" data-task-edit-form="${id}">
      <input
        class="task-name-input"
        data-task-input="${id}"
        type="text"
        value="${name}"
      />
      <input 
        class="task-due-date-edit"
        data-task-due-date-edit="${id}"
        type="date"
        value="${dueDate || ""}"
        aria-label="Edit due date"
      />
      <select
        class="task-priority-edit"
        data-task-priority-edit="${id}"
        aria-label="Edit task priority"
      >
        <option value="low" ${
          priority === "low" ? "selected" : ""
        }>Low</option>
        <option value="medium" ${
          priority === "medium" || !priority ? "selected" : ""
        }>Medium</option>
        <option value="high" ${
          priority === "high" ? "selected" : ""
        }>High</option>
      </select>
    </div>
  `;
}

function buildPomodoroDisplay(count, estimate = 0) {
  return renderPomodoroBadges(count, estimate, 16);
}

function buildPomodoroAddButton(taskId) {
  return `
    <button class="pomodoro-add-btn" data-add-pomodoro="${taskId}" 
      title="Add completed pomodoro" aria-label="Add completed pomodoro">
      ${getIcon("plus", { size: 12 })}
    </button>
  `;
}

function buildPomodoroRemoveButton(taskId) {
  return `
    <button class="pomodoro-remove-btn" data-remove-pomodoro="${taskId}"
      title="Remove pomodoro" aria-label="Remove pomodoro">
      ${getIcon("minus", { size: 12 })}
    </button>
  `;
}

function buildPomodoroControls(taskId, count) {
  return `
    ${buildPomodoroAddButton(taskId)}
    ${count ? `${buildPomodoroRemoveButton(taskId)}` : ""}
  `;
}

function buildPomodoroTracker(task, isArchive) {
  const count = task.pomodoros || 0;
  const estimate = task.estimatedPomodoros || 0;
  const pomodoroDisplay = buildPomodoroDisplay(count, estimate);

  let pomodoroTitle;
  if (estimate > 0) {
    const status =
      count >= estimate ? "Complete!" : `${estimate - count} remaining`;
    pomodoroTitle = `${count}/${estimate} pomodoros (${status})`;
  } else {
    const pomodoroText = count === 1 ? "pomodoro" : "pomodoros";
    pomodoroTitle =
      count === 0 ? "No pomodoros" : `${count} ${pomodoroText} completed`;
  }

  return `
    <div class="task-pomodoro-tracker${estimate > 0 ? " has-estimate" : ""}">
      <div class="pomodoro-display" title="${pomodoroTitle}" aria-label="${pomodoroTitle}">
        ${pomodoroDisplay}
      </div>
      ${isArchive ? "" : `${buildPomodoroControls(task.id, count)}`}
    </div>
  `;
}

function buildArchivedDates(task, dates) {
  const { archivedAt, archivedAtLong } = dates;
  const { archivedFrom } = task;
  if (!archivedAt) return "";
  return `
    <span class="task-date archived-date" title="Archived at: ${archivedAtLong}">
      ${getIcon("hourglass", { size: 13 })} ${archivedAtLong}
    </span>
    <span class="task-date original-list" title="Originally from: ${archivedFrom} list">
      ${getIcon("folder", { size: 13 })} ${archivedFrom}
    </span>
  `;
}

function buildCompletedDates(dates) {
  const { completedAt, completedAtLong } = dates;
  return `
    <span class="task-date completed-date" title="Completed at: ${completedAtLong}">
      ${getIcon("check", { size: 13 })} ${completedAt}
    </span>
  `;
}

function buildDueDates(dates, isOverdue) {
  const { dueDate, dueDateLong } = dates;
  const overdueClass = isOverdue ? "overdue" : "";
  return `
    <span class="task-date due-date ${overdueClass}" title="Due at: ${dueDateLong}">
      ${getIcon("calendar", { size: 13 })} ${dueDate}
    </span>
  `;
}

function buildCreatedDates(dates) {
  const { createdAt, createdAtLong } = dates;
  return `
    <span class="task-date created-date" title="Created at: ${createdAtLong}">
      ${createdAt}
    </span>
  `;
}

function buildTaskDates(task, isArchive, dates, state) {
  let taskDates;
  const { archivedAt, completedAt, dueDate } = dates;
  const { isCompleted, isOverdue } = state;

  if (isArchive && archivedAt) {
    taskDates = buildArchivedDates(task, dates);
  } else if (isCompleted && completedAt) {
    taskDates = buildCompletedDates(dates);
  } else if (dueDate) {
    taskDates = buildDueDates(dates, isOverdue);
  } else {
    taskDates = buildCreatedDates(dates);
  }

  return `<div class="task-metadata">${taskDates}</div>`;
}

function buildArchiveRestoreButton(taskId) {
  return `
      <button class="task-action-btn restore-task-btn" data-restore-task="${taskId}"
      title="Restore task">
      ${getIcon("undo", { size: 14 })}
    </button>
  `;
}

function buildEditTaskButton(taskId) {
  return `
    <button class="task-action-btn edit-task-btn" data-edit-task="${taskId}"
      title="Edit task">
      ${getIcon("edit", { size: 14 })}
    </button>
  `;
}

function buildTaskDeleteButton(taskId, isArchive) {
  const deleteTitle = isArchive ? "Delete task permanently" : "Delete task";
  return `
    <button class="task-action-btn delete-task-btn" data-delete-task="${taskId}"
      title="${deleteTitle}">
      ${getIcon("trash", { size: 14 })}
    </button>
  `;
}

function buildSubtaskButton(task, isArchive) {
  if (isArchive) return "";
  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((st) => st.completed).length;
  const hasSubtasks = subtasks.length > 0;
  const badge = hasSubtasks
    ? `<span class="subtask-badge">${completedCount}/${subtasks.length}</span>`
    : "";

  return `
    <button class="task-action-btn subtasks-toggle-btn ${hasSubtasks ? "has-subtasks" : ""}" 
      data-toggle-subtasks="${task.id}" 
      title="${hasSubtasks ? `${completedCount}/${subtasks.length} subtasks` : "Subtasks checklist"}">
      ${getIcon("list", { size: 13 })}
      ${badge}
    </button>
  `;
}

function buildSubtasksSection(task, isArchive) {
  if (isArchive) return "";
  const subtasks = task.subtasks || [];
  const isOpen = openSubtasks.has(task.id);
  if (!isOpen && subtasks.length === 0) return "";

  const completedCount = subtasks.filter((st) => st.completed).length;
  const totalCount = subtasks.length;
  const pct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return `
    <div class="task-subtasks-wrapper ${isOpen ? "" : "hidden"}" data-subtasks-section="${task.id}">
      <div class="subtasks-header">
        <span class="subtasks-title">Subtasks (${completedCount}/${totalCount})</span>
        <div class="subtasks-progress"><div class="subtasks-progress-fill" style="width: ${pct}%"></div></div>
      </div>
      <div class="subtasks-list">
        ${subtasks
          .map(
            (st) => `
          <div class="subtask-item ${st.completed ? "completed" : ""}">
            <input 
              type="checkbox" 
              class="subtask-checkbox" 
              id="st-${task.id}-${st.id}" 
              data-toggle-subtask="${task.id}:${st.id}" 
              ${st.completed ? "checked" : ""} 
            />
            <label for="st-${task.id}-${st.id}" class="subtask-text">${escapeHtml(st.text)}</label>
            <button class="subtask-delete-btn" data-delete-subtask="${task.id}:${st.id}" title="Delete subtask" aria-label="Delete subtask">
              ${getIcon("close", { size: 10 })}
            </button>
          </div>
        `,
          )
          .join("")}
      </div>
      <form class="subtask-add-form" data-add-subtask-form="${task.id}">
        <input type="text" class="subtask-add-input" placeholder="Add subtask..." maxlength="100" />
        <button type="submit" class="subtask-add-btn" aria-label="Add subtask">
          ${getIcon("plus", { size: 12 })}
        </button>
      </form>
    </div>
  `;
}

function buildTaskActions(task, isArchive) {
  const { id } = task;
  const editOrRestore = isArchive
    ? buildArchiveRestoreButton(id)
    : buildEditTaskButton(id);

  return `
    <div class="task-actions">
      ${buildSubtaskButton(task, isArchive)}
      ${editOrRestore}
      ${buildTaskDeleteButton(id, isArchive)}
    </div>
  `;
}

function buildTaskHTML(
  task,
  returnHTMLOnly = false,
  searchMatched = false,
  isArchive = false,
) {
  const { completed, id } = task;
  const isCompleted = completed ? "checked" : "";

  // TODO: due date time issue // currently sets the prior date @8pm the day before due to timezone offset?
  // Allow user to set time as well? Or set to noon by default to avoid timezone issues?
  // Time setting modal?
  const taskDates = getTaskDates(task);
  const taskState = getTaskState(task);
  const { priority } = taskState;

  const archiveClass = isArchive ? "archived-task" : "";
  const searchMatchClass = searchMatched ? "search-match" : "";

  const taskTemplate = `
    <div class="task task-priority-${priority} ${searchMatchClass} ${archiveClass}" data-task-item="${id}">
      ${buildDragHandle()}
      ${buildPriorityIndicator(priority)}
      ${buildCustomCheckbox(task, isCompleted, isArchive)}
      ${buildTaskInput(task, isArchive)}
      ${buildPomodoroTracker(task, isArchive)}
      ${buildTaskDates(task, isArchive, taskDates, taskState)}
      ${buildTaskActions(task, isArchive)}
      ${buildSubtasksSection(task, isArchive)}
    </div>
  `;

  if (returnHTMLOnly) {
    return taskTemplate;
  }

  elements.tasksContainer.insertAdjacentHTML("beforeend", taskTemplate);
}

function updateTaskState(taskId) {
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  if (!taskElement) return;

  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to update task state`);
    return;
  }

  const task = selectedList.tasks.find((task) => task.id === taskId);
  if (!task) return;

  const newTaskHTML = buildTaskHTML(task, true, false, selectedList.isArchive);

  // Create a temporary container
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = newTaskHTML;
  const newTaskElement = tempContainer.firstElementChild;

  // Replace the old element with the new one
  taskElement.parentNode.replaceChild(newTaskElement, taskElement);
}

function addPomodoro(taskId) {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to add pomodoro to task`);
    return;
  }

  const task = selectedList.tasks.find((task) => task.id === taskId);
  if (!task) return;

  const { pomodoros } = task;

  task.pomodoros = (pomodoros || 0) + 1;
  save();
  updateTaskState(taskId);
  showSuccess(`Pomodoro added! Total: ${task.pomodoros}`);
}

function removePomodoro(taskId) {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to remove pomodoro from task`);
    return;
  }

  const task = selectedList.tasks.find((task) => task.id === taskId);

  const { pomodoros } = task;

  if (!task || !pomodoros || pomodoros <= 0) return;

  task.pomodoros -= 1;
  save();
  updateTaskState(taskId);
  showSuccess(`Pomodoro removed. Total: ${task.pomodoros}`);
}

// TODO: Setup selection of an active task and connect to Pomodoro
// export function addPomodoroToActiveTask() {
//   const selectedList = getCurrentList();

//   if (!selectedList || selectedList.tasks.length === 0) return false;

//   const activeTask = selectedList.tasks.find((task) => !task.completed);

//   if (!activeTask) return false;

//   activeTask.pomodoros = (activeTask.pomodoros || 0) + 1;
//   save();
//   updateTaskState(activeTask.id);
//   showSuccess(
//     `Pomodoro completed! ${activeTask.name}: ${activeTask.pomodoros}`
//   );
//   return true;
// }

function updateArchiveSectionVisibility() {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(
      `Archive isn't rendered correctly, reload the page and try again`,
    );
    return;
  }

  const newTaskCreator = elements.newTaskForm.closest(".new-task-creator");
  const listFilterButtons = document.querySelector(".filter-buttons");

  if (selectedList.isArchive) {
    // Hide task creation and delete list button
    if (state.archive.tasks.length === 0) {
      elements.clearArchiveButton.classList.add("hidden");
    } else {
      elements.clearArchiveButton.classList.remove("hidden");
    }
    elements.clearCompletedTasks.classList.add("hidden");
    elements.deleteListButton.classList.add("hidden");
    if (listFilterButtons) {
      listFilterButtons.classList.add("hidden");
    }
    if (newTaskCreator) {
      newTaskCreator.classList.add("hidden");
    }
  } else {
    // Show task creation and delete list button
    elements.clearArchiveButton.classList.add("hidden");
    elements.clearCompletedTasks.classList.remove("hidden");
    elements.deleteListButton.classList.remove("hidden");
    if (listFilterButtons) {
      listFilterButtons.classList.remove("hidden");
    }
    if (newTaskCreator) {
      newTaskCreator.classList.remove("hidden");
    }
  }
}

function restoreTask(taskId) {
  const task = state.archive.tasks.find((task) => task.id === taskId);
  if (!task) return;

  const { name } = task;

  // Original list
  let targetList = state.lists.find((list) => list.id === task.originalListId);

  // If original list no longer exists, use the first list or create a new one
  if (!targetList) {
    if (state.lists.length > 0) {
      targetList = state.lists[0];

      showSuccess(
        `Original list not found. Restored "${name}" to "${targetList.name}"`,
      );
    } else {
      targetList = createList("Restored Tasks");
      state.lists.push(targetList);
      showSuccess(`Created new list "Restored Tasks" and restored "${name}"`);
    }
  } else {
    showSuccess(`Restored "${name}" to "${targetList.name}"`);
  }

  // Remove archive metadata
  const { archivedAt, archivedFrom, originalListId, ...restoredTask } = task;

  targetList.tasks.push(restoredTask);
  state.archive.tasks = state.archive.tasks.filter(
    (task) => task.id !== taskId,
  );
  saveAndRender();
}

async function deleteTask(taskId) {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to delete task from`);
    return;
  }

  const task = selectedList.tasks.find((task) => task.id === taskId);
  if (!task) return;

  const { name } = task;

  const isArchived = selectedList.isArchive;
  const confirmMessage = isArchived
    ? "This will permanently delete this task. This action cannot be undone."
    : name;

  const confirmed = await confirmDelete(confirmMessage, "task");
  if (!confirmed) return;

  selectedList.tasks = selectedList.tasks.filter((task) => task.id !== taskId);
  saveAndRender();
  showSuccess(`Task "${name}" ${isArchived ? "permanently" : ""} deleted`);
}

function editTaskName(taskId) {
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  const textElement = taskElement.querySelector(`[data-task-text="${taskId}"]`);
  const editForm = taskElement.querySelector(
    `[data-task-edit-form="${taskId}"]`,
  );
  const inputElement = taskElement.querySelector(
    `[data-task-input="${taskId}"]`,
  );
  const editBtn = taskElement.querySelector(`[data-edit-task="${taskId}"]`);

  // Toggle to edit mode
  textElement.classList.add("hidden");
  editForm.classList.remove("hidden");
  inputElement.focus();
  inputElement.select();

  // Change edit button to save button
  editBtn.innerHTML = getIcon("check", { size: 14 });
  editBtn.title = "Save task";
  editBtn.dataset.saveTask = taskId;
  delete editBtn.dataset.editTask;

  const handleBlur = (event) => {
    // Prevent cancelation when clicking within the edit form
    // Possibly update this functionality to prevent canceling when clicking other specific elements too
    if (editForm.contains(event.relatedTarget)) {
      return;
    }
    inputElement.removeEventListener("keydown", handleKeydown);
    inputElement.removeEventListener("blur", handleBlur);
    saveTaskName(taskId);
  };

  // Handle save on Enter key
  const handleKeydown = (event) => {
    const { key } = event;
    if (key === "Enter" || key === "Escape") {
      inputElement.removeEventListener("blur", handleBlur);
      inputElement.removeEventListener("keydown", handleKeydown);
    }

    if (key === "Enter") {
      event.preventDefault();
      saveTaskName(taskId);
    } else if (key === "Escape") {
      cancelTaskEdit(taskId);
    }
  };

  inputElement.addEventListener("keydown", handleKeydown);
  inputElement.addEventListener("blur", handleBlur);
}

function saveTaskName(taskId) {
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  const inputElement = taskElement.querySelector(
    `[data-task-input="${taskId}"]`,
  );
  const prioritySelect = taskElement.querySelector(
    `[data-task-priority-edit="${taskId}"]`,
  );
  const dueDateInput = taskElement.querySelector(
    `[data-task-due-date-edit="${taskId}"]`,
  );

  const newName = inputElement.value.trim();
  const newPriority = prioritySelect.value;
  const newDueDate = dueDateInput.value || null;

  if (!newName) {
    showError("Task name cannot be empty");
    cancelTaskEdit(taskId);
    return;
  }

  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to update task name`);
    return;
  }
  const task = selectedList.tasks.find((task) => task.id === taskId);
  if (!task) return;

  let hasChanges = false;
  const taskEdits = [];

  let { name, priority, dueDate } = task;

  if (name !== newName) {
    task.name = newName;
    hasChanges = true;
    taskEdits.push("name");
  }

  if ((priority || "medium") !== newPriority) {
    task.priority = newPriority;
    hasChanges = true;
    taskEdits.push("priority");
  }

  if (dueDate !== newDueDate) {
    task.dueDate = newDueDate;
    hasChanges = true;
    taskEdits.push("due date");
  }

  if (hasChanges) {
    saveAndRender();
    const changesText = taskEdits.join(", ");
    showSuccess(`Task updated: ${changesText}`);
  } else {
    cancelTaskEdit(taskId);
  }
}

function cancelTaskEdit(taskId) {
  // TODO: Add a cancel button too?
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  if (!taskElement) return;

  const textElement = taskElement.querySelector(`[data-task-text="${taskId}"]`);
  const editForm = taskElement.querySelector(
    `[data-task-edit-form="${taskId}"]`,
  );

  textElement.classList.remove("hidden");
  editForm.classList.add("hidden");

  render();
}

function editListName(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const textElement = listElement.querySelector(`[data-list-text="${listId}"]`);
  const inputElement = listElement.querySelector(
    `[data-list-input="${listId}"]`,
  );
  const editBtn = listElement.querySelector(`[data-edit-list="${listId}"]`);

  // Toggle to edit mode
  textElement.classList.add("hidden");
  inputElement.classList.remove("hidden");
  inputElement.focus();
  inputElement.select();

  // Change edit button to save button
  editBtn.innerHTML = getIcon("check", { size: 14 });
  editBtn.title = "Save list";
  editBtn.dataset.saveList = listId;
  delete editBtn.dataset.editList;

  const handleBlur = () => {
    inputElement.removeEventListener("keydown", handleKeydown);
    inputElement.removeEventListener("blur", handleBlur);
    saveListName(listId);
  };

  // Handle save on Enter key
  const handleKeydown = (event) => {
    const { key } = event;
    if (key === "Enter" || key === "Escape") {
      inputElement.removeEventListener("blur", handleBlur);
      inputElement.removeEventListener("keydown", handleKeydown);
    }

    if (key === "Enter") {
      saveListName(listId);
    } else if (key === "Escape") {
      cancelListEdit(listId);
    }
  };

  inputElement.addEventListener("keydown", handleKeydown);
  inputElement.addEventListener("blur", handleBlur);
}

function saveListName(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const inputElement = listElement.querySelector(
    `[data-list-input="${listId}"]`,
  );
  const newName = inputElement.value.trim();

  if (!newName) {
    showError("List name cannot be empty");
    cancelListEdit(listId);
    return;
  }

  const list = state.lists.find((list) => list.id === listId);

  if (list && newName !== list.name) {
    list.name = newName;
    saveAndRender();
    showSuccess("List name updated");
  } else {
    cancelListEdit(listId);
  }
}

function cancelListEdit(listId) {
  // TODO: Add a cancel button too?
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  if (!listElement) return;

  const textElement = listElement.querySelector(`[data-list-text="${listId}"]`);
  const inputElement = listElement.querySelector(
    `[data-list-input="${listId}"]`,
  );

  textElement.classList.remove("hidden");
  inputElement.classList.add("hidden");

  render();
}

export function getCurrentList() {
  if (state.selectedListId === archive.ARCHIVE_LIST_ID) {
    return state.archive;
  }
  return state.lists.find((list) => list.id === state.selectedListId);
}

function getPriorityInfo(priority) {
  const priorityData = {
    high: { icon: getIcon("priority-high", { size: 14 }), label: "High" },
    medium: { icon: getIcon("priority-medium", { size: 14 }), label: "Medium" },
    low: { icon: getIcon("priority-low", { size: 14 }), label: "Low" },
  };
  return priorityData[priority] || priorityData.medium;
}

function sortTasksByPriority(tasks) {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  return [...tasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority || "medium"];
    const bPriority = priorityOrder[b.priority || "medium"];
    return aPriority - bPriority;
  });
}

function sortTasksByDueDate(tasks) {
  // TODO: Filter out completed tasks first or add them to the end?
  return [...tasks].sort((a, b) => {
    // Tasks without due dates go to the end
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return new Date(a.dueDate) - new Date(b.dueDate);
  });
}

function getTasksToRender(tasks) {
  // Apply filter first
  let filtered = filterTasks(tasks);

  switch (state.sortingType) {
    case "priority":
      return sortTasksByPriority(filtered);
    case "dueDate":
      return sortTasksByDueDate(filtered);
    default:
      return filtered; // creation order
  }
}

function toggleSortType() {
  const sortTypes = ["creation", "priority", "dueDate"];
  const currentIndex = sortTypes.indexOf(state.sortingType);
  const nextIndex = (currentIndex + 1) % sortTypes.length;
  state.sortingType = sortTypes[nextIndex];

  const sortLabels = {
    creation: "Sorting by creation / manual sort",
    priority: "Sorting by priority",
    dueDate: "Sorting by due date",
  };

  const buttonInfo = {
    creation:
      "Sorting by creation order and manual sort, toggle to sort by priority",
    priority: "Sorting by priority, toggle to sort by due date",
    dueDate: "Sorting by due date, toggle to sort by creation order",
  };

  if (state.sortingType === "creation") {
    elements.taskSortButton.classList.remove("active");
  } else {
    elements.taskSortButton.classList.add("active");
  }

  elements.taskSortButton.ariaLabel = buttonInfo[state.sortingType];
  elements.taskSortButton.title = buttonInfo[state.sortingType];
  document.querySelector(".sort-text").textContent =
    sortLabels[state.sortingType];

  showSuccess(sortLabels[state.sortingType]);
  render();
}

// Search and Filters
function handleSearch(event) {
  state.searchQuery = event.target.value.trim().toLowerCase();

  // Show/hide clear button
  if (state.searchQuery) {
    elements.clearSearchButton.classList.remove("hidden");
  } else {
    elements.clearSearchButton.classList.add("hidden");
  }

  render();
}

function clearSearch() {
  state.searchQuery = "";
  elements.searchInput.value = "";
  elements.clearSearchButton.classList.add("hidden");
  render();
}

function handleStatusFilter(event) {
  const filterType = event.target.dataset.filter;
  state.statusFilter = filterType;

  // Update active state
  elements.filterButtons.forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  render();
  showSuccess(`Showing ${filterType} tasks`);
}

function handlePriorityFilter(event) {
  const priority = event.target.dataset.priorityFilter;
  state.priorityFilter = priority;

  // Update active state
  elements.priorityFilterButtons.forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  const priorityLabels = {
    all: "all priorities",
    high: "high priority",
    medium: "medium priority",
    low: "low priority",
  };

  render();
  showSuccess(`Showing ${priorityLabels[priority]} tasks`);
}

function filterTasks(tasks) {
  let filtered = [...tasks];

  // Filter by status
  if (state.statusFilter === "active") {
    filtered = filtered.filter((task) => !task.completed);
  } else if (state.statusFilter === "completed") {
    filtered = filtered.filter((task) => task.completed);
  }

  // Filter by priority
  if (state.priorityFilter !== "all") {
    filtered = filtered.filter(
      (task) => (task.priority || "medium") === state.priorityFilter,
    );
  }

  // Filter by search query
  if (state.searchQuery) {
    filtered = filtered.filter((task) =>
      task.name.toLowerCase().includes(state.searchQuery),
    );
  }

  return filtered;
}

// TODO: add this in a better place
function handleViewToggle(event) {
  const button = event.target.closest("button");
  if (!button) return;

  const view = button.dataset.view;
  state.view = view;

  // Update active button state
  elements.viewToggleButtons.forEach((button) => {
    button.classList.remove("active");
  });
  button.classList.add("active");

  render();
  // TODO: Prevent this message from firing if the view is the same as the current state
  showSuccess(`Switched to ${view} view`);
}

// Todo utils
function formatDate(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return "just now"; // Just now < 1 minute
  if (diffInMins < 60) return `${diffInMins}m ago`; // Minutes ago < 1 hour
  if (diffInHours < 24) return `${diffInHours}h ago`; // Hours ago < 24 hours
  if (diffInDays < 7) return `${diffInDays}d ago`; // Days ago < 7 days

  return date.toLocaleDateString();
}

function formatDateLong(isoString) {
  if (!isoString) return "Not completed";

  const date = new Date(isoString);
  return date.toLocaleString();
}

function clearElement(element) {
  if (element) {
    element.innerHTML = "";
  }
}
