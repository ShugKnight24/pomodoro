"use strict";

import { confirmDelete } from "./modal.js";
import { showSuccess, showError } from "./toast.js";

const archive = {
  ARCHIVE_LIST_ID: -1, // Special ID for archive list
  ARCHIVE_LIST_NAME: "Archive",
};

// TODO: Possibly create seperate state objects for different functionalities
// DOM Elements
const elements = {
  clearArchiveButton: null,
  clearCompletedTasks: null,
  clearSearchButton: null,
  deleteListButton: null,
  filterButtons: null,
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
  taskSortButton: null,
  tasksContainer: null,
  taskCount: null,
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
};

export function initTodo() {
  initializeElements();
  loadFromStorage();
  createArchive();
  setupEventListeners();
  render();
}

function initializeElements() {
  elements.clearArchiveButton = document.querySelector("[data-clear-archive]");
  elements.clearCompletedTasks = document.querySelector(
    "[data-clear-completed-tasks]"
  );
  elements.clearSearchButton = document.querySelector("[data-clear-search]");
  elements.deleteListButton = document.querySelector(
    "[data-delete-list-button]"
  );
  elements.filterButtons = document.querySelectorAll("[data-filter]");
  elements.listsContainer = document.querySelector("[data-lists]");
  elements.listCount = document.querySelector("[data-list-count]");
  elements.newListForm = document.querySelector("[data-new-list-form]");
  elements.newListInput = document.querySelector("[data-new-list-input]");
  elements.newTaskForm = document.querySelector("[data-new-task-form]");
  elements.newTaskInput = document.querySelector("[data-new-task-input]");
  elements.priorityFilterButtons = document.querySelectorAll(
    "[data-priority-filter]"
  );
  elements.searchInput = document.querySelector("[data-search-input]");
  elements.taskDueDateInput = document.querySelector("[data-task-due-date]");
  elements.taskListContainer = document.querySelector(
    "[data-list-display-container]"
  );
  elements.taskListTitle = document.querySelector("[data-list-title]");
  elements.taskPrioritySelect = document.querySelector("[data-task-priority]");
  elements.taskSortButton = document.querySelector("[data-sort-toggle]");
  elements.tasksContainer = document.querySelector("[data-tasks]");
  elements.taskCount = document.querySelector("[data-task-count]");
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
  elements.taskSortButton.addEventListener("click", toggleSortType);
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
    } moved to archive`
  );
}

async function clearArchive() {
  // Clear archive button should be hidden in this case, just in case
  if (state.archive.tasks.length === 0) {
    showError("Your archive is already empty");
    return;
  }

  const confirmed = await confirmDelete(
    `${state.archive.tasks.length} archived task${
      state.archive.tasks.length === 1 ? "" : "s"
    }`,
    "permanently delete"
  );
  if (!confirmed) return;

  const count = state.archive.tasks.length;
  state.archive.tasks = [];
  saveAndRender();
  showSuccess(
    `${count} archived task${count === 1 ? "" : "s"} deleted permanently`
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
  // Handle checkbox toggle
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
      (task) => task.id === parseInt(event.target.id)
    );
    selectedTask.completed = event.target.checked;
    selectedTask.completedAt = event.target.checked
      ? new Date().toISOString()
      : null;

    save();
    renderTaskCount(selectedList);
    updateTaskState(selectedTask.id);
    return;
  }

  // Find the button element (could be the button itself or an icon inside it)
  const button = event.target.closest("button");
  if (!button) return;

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

function newTaskSubmit(event) {
  event.preventDefault();
  const taskName = elements.newTaskInput.value.trim();
  const dueDate = elements.taskDueDateInput.value || null;
  const priority = elements.taskPrioritySelect.value;

  if (!taskName) {
    // TODO: create a validation error for the input
    showError("Task name cannot be empty");
    return;
  }

  const task = createTask(taskName, priority, dueDate);
  elements.newTaskInput.value = "";
  elements.taskDueDateInput.value = "";
  elements.taskPrioritySelect.value = "medium";

  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to add task`);
    return;
  }
  selectedList.tasks.push(task);
  saveAndRender();
  showSuccess(
    `Task "${taskName}" added with "${priority}" priority ${
      dueDate ? `due "${dueDate}"` : ""
    }`
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

function createTask(name, priority = "medium", dueDate = null) {
  state.taskCounter++;

  return {
    id: state.taskCounter, // TODO: Create a better unique id
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
    dueDate: dueDate,
    name: name,
    pomodoros: 0,
    priority: priority,
  };
}

function save() {
  localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(state.archive));
  localStorage.setItem(STORAGE_KEYS.LIST_COUNTER, state.listCounter);
  localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(state.lists));
  localStorage.setItem(STORAGE_KEYS.SELECTED_LIST_ID, state.selectedListId);
  localStorage.setItem(STORAGE_KEYS.TASK_COUNTER, state.taskCounter);
}

function render() {
  clearElement(elements.listsContainer);
  renderLists();
  const selectedList = getCurrentList();

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

function saveAndRender() {
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
  const isActive = list.id === state.selectedListId ? "active-list" : "";
  const isArchive = list.isArchive ? "archive-list" : "";
  const archiveIcon = isArchive ? "🗃️" : "";

  // TODO: Break into atoms / render list input edit button... etc
  let listTemplate = `
    <li class="list-name ${isActive} ${isArchive}" data-list-id="${list.id}">
      <span class="list-name-text" data-list-text="${list.id}">${archiveIcon}${
    list.name
  }</span>
      ${
        !isArchive
          ? `<input
        name="list-name-${list.id}"
        class="list-name-input hidden" 
        data-list-input="${list.id}" 
        type="text" 
        value="${list.name}"
      />
      <button class="list-action-btn edit-list-btn" data-edit-list="${list.id}" title="Edit list name" aria-label="Edit list name">
        <i class="fas fa-pencil-alt"></i>
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
    (task) => !task.completed
  ).length;
  const taskString = incompleteTasksCount === 1 ? "task" : "tasks";

  // TODO: Remove Status filters from Archive view // Allow filtering by prio and search
  if (selectedList.isArchive) {
    elements.taskCount.innerText = `${filteredTasks.length} archived ${
      filteredTasks.length === 1 ? "task" : "tasks"
    }`;
  } else if (
    state.statusFilter !== "all" ||
    state.priorityFilter !== "all" ||
    state.searchQuery
  ) {
    // TODO: Better way to dispaly... causes layout
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
    buildTaskHTML(task, false, matchesSearch);
  });
}

// TODO: Break into atoms
function renderNoTasks(selectedList) {
  const noTasksHTML = `
    <div class="no-results">
      <div class="no-results-icon">${selectedList.isArchive ? "🗃️" : "🔍"}</div>
      <p>${
        selectedList.isArchive
          ? "Archive is empty"
          : state.searchQuery
          ? `No tasks found matching "${state.searchQuery}"`
          : "No tasks found"
      }</p>
      ${
        selectedList.isArchive
          ? `<p>Completed tasks will appear here when cleared from lists</p>`
          : state.searchQuery
          ? `<p>Try a different search term</p>`
          : state.statusFilter !== "all" || state.priorityFilter !== "all"
          ? `<p>Try adjusting your filters</p>`
          : `<p>Create your first task to get started!</p>`
      }
    </div>
  `;
  return noTasksHTML;
}

function buildTaskHTML(
  task,
  returnHTMLOnly = false,
  searchMatched = false,
  isArchive = false
) {
  let completed = task.completed ? "checked" : "";
  // TODO: Allow priority update on edit
  const priority = task.priority || "medium";
  const { icon, label } = getPriorityInfo(priority);

  // TODO: Simplify date formatting
  const createdDate = formatDate(task.createdAt);
  const completedDate = task.completedAt
    ? formatDate(task.completedAt)
    : "Not completed";
  const createdDateLong = task.createdAt ? formatDateLong(task.createdAt) : "";
  const completedDateLong = task.completedAt
    ? formatDateLong(task.completedAt)
    : "Not completed";

  // TODO: due date time issue // currently sets the prior date @8pm the day before due to timezone offset?
  // Allow user to set time as well? Or set to noon by default to avoid timezone issues?
  // Time setting modal?
  // TODO: Allow due date update on edit
  const dueDate = task.dueDate ? formatDate(task.dueDate) : null;
  const dueDateLong = task.dueDate ? formatDateLong(task.dueDate) : "";
  const isOverdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  // Pomodoro display logic
  const pomodoroCount = task.pomodoros || 0;
  const pomodoroDisplay = getPomodoroDisplay(pomodoroCount);

  const searchMatchClass = searchMatched ? "search-match" : "";

  const archiveClass = isArchive ? "archived-task" : "";
  const archivedDate = task.archivedAt ? formatDate(task.archivedAt) : null;
  const archivedDateLong = task.archivedAt
    ? formatDateLong(task.archivedAt)
    : null;

  // TODO: Simplify by creating atoms
  const taskTemplate = `
    <div class="task task-priority-${priority} ${searchMatchClass} ${archiveClass}" data-task-item="${
    task.id
  }">
      <span class="priority-indicator" title="${label} priority">
        ${icon}
      </span>
      <input
        class="check"
        type="checkbox"
        id="${task.id}"
        name="" value=""
        ${completed}
        ${isArchive ? "disabled" : ""}
      >
      <label for="${task.id}">
        <span class="custom-checkbox"></span>
        <span class="task-name-text" data-task-text="${task.id}">${
    task.name
  }</span>
      </label>
      ${
        !isArchive
          ? `
            <input 
              class="task-name-input hidden" 
              data-task-input="${task.id}" 
              type="text" 
              value="${task.name}"
            />
          `
          : ""
      }
      <div class="task-pomodoro-tracker">
        <div class="pomodoro-display" title="${pomodoroCount} pomodoro${
    pomodoroCount === 1 ? "" : "s"
  } completed">
          ${pomodoroDisplay}
        </div>
        <button class="pomodoro-add-btn" data-add-pomodoro="${
          task.id
        }" title="Add completed pomodoro" aria-label="Add completed pomodoro">
          <i class="fas fa-plus"></i>
        </button>
        ${
          pomodoroCount > 0
            ? `
        <button class="pomodoro-remove-btn" data-remove-pomodoro="${task.id}" title="Remove pomodoro" aria-label="Remove pomodoro">
          <i class="fas fa-minus"></i>
        </button>
        `
            : ""
        }
      </div>
      <div class="task-metadata">
        ${
          // TODO: Remove nested ternaries
          isArchive && archivedDate
            ? `
                <span class="task-date archived-date" title="Archived: ${archivedDateLong}">⌛️ ${archivedDate}</span>
                <span class="task-date original-list" title="Originally from: ${task.archivedFrom}">📂 ${task.archivedFrom}</span>
            `
            : task.completed && completedDate
            ? `<span class="task-date completed-date" title="Completed: ${completedDateLong}">✓ ${completedDate}</span>`
            : dueDate
            ? `<span class="task-date due-date ${
                isOverdue ? "overdue" : ""
              }" title="Due: ${dueDateLong}">📅 ${dueDate}</span>`
            : `<span class="task-date created-date" title="Created: ${createdDateLong}">${createdDate}</span>`
        }
      </div>
      <div class="task-actions">
        ${
          isArchive
            ? `
                <button class="task-action-btn restore-task-btn" data-restore-task="${task.id}" title="Restore task">
                  <i class="fas fa-undo"></i>
                </button>
            `
            : `
                <button class="task-action-btn edit-task-btn" data-edit-task="${task.id}" title="Edit task">
                  <i class="fas fa-pencil-alt"></i>
                </button>
              `
        }
        <button class="task-action-btn delete-task-btn" data-delete-task="${
          task.id
        }" title="${isArchive ? "Delete permanently" : "Delete task"}">
          <i class="fas fa-trash"></i>
        </button>
      </div>
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

  const newTaskHTML = buildTaskHTML(task, true, false);

  // Create a temporary container
  const tempContainer = document.createElement("div");
  tempContainer.innerHTML = newTaskHTML;
  const newTaskElement = tempContainer.firstElementChild;

  // Replace the old element with the new one
  taskElement.parentNode.replaceChild(newTaskElement, taskElement);
}

function getPomodoroDisplay(count) {
  if (count === 0) return '<span class="pomodoro-empty">—</span>';
  if (count <= 3) return "🍅".repeat(count);
  return `🍅 <span class="pomodoro-count">${count}</span>`;
}

function addPomodoro(taskId) {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to add pomodoro to task`);
    return;
  }

  const task = selectedList.tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.pomodoros = (task.pomodoros || 0) + 1;
  save();
  updateTaskState(taskId);
  showSuccess(`Pomodoro added! Total: ${task.pomodoros} 🍅`);
}

function removePomodoro(taskId) {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to remove pomodoro from task`);
    return;
  }

  const task = selectedList.tasks.find((t) => t.id === taskId);
  if (!task || !task.pomodoros || task.pomodoros <= 0) return;

  task.pomodoros -= 1;
  save();
  updateTaskState(taskId);
  showSuccess(`Pomodoro removed. Total: ${task.pomodoros} 🍅`);
}

// TODO: Refine this functionality and connect to Pomodoro
// export function addPomodoroToActiveTask() {
//   const selectedList = getCurrentList();

//   if (!selectedList || selectedList.tasks.length === 0) return false;

//   // TODO: Define "active" task logic better
//   const activeTask = selectedList.tasks.find((task) => !task.completed);

//   if (!activeTask) return false;

//   activeTask.pomodoros = (activeTask.pomodoros || 0) + 1;
//   save();
//   updateTaskState(activeTask.id);
//   showSuccess(
//     `Pomodoro completed! ${activeTask.name}: ${activeTask.pomodoros} 🍅`
//   );
//   return true;
// }

function updateArchiveSectionVisibility() {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(
      `Archive isn't rendered correctly, reload the page and try again`
    );
    return;
  }

  const newTaskCreator = elements.newTaskForm.closest(".new-task-creator");
  const listFilterButtons = document.querySelector(".filter-buttons");

  if (selectedList && selectedList.isArchive) {
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
  const task = state.archive.tasks.find((t) => t.id === taskId);
  if (!task) return;

  // Original list
  let targetList = state.lists.find((list) => list.id === task.originalListId);

  // If original list no longer exists, use the first list or create a new one
  if (!targetList) {
    if (state.lists.length > 0) {
      targetList = state.lists[0];
      showSuccess(
        `Original list not found. Restored "${task.name}" to "${targetList.name}"`
      );
    } else {
      targetList = createList("Restored Tasks");
      state.lists.push(targetList);
      showSuccess(
        `Created new list "Restored Tasks" and restored "${task.name}"`
      );
    }
  } else {
    showSuccess(`Restored "${task.name}" to "${targetList.name}"`);
  }

  // Remove archive metadata
  const { archivedAt, archivedFrom, originalListId, ...restoredTask } = task;

  targetList.tasks.push(restoredTask);
  state.archive.tasks = state.archive.tasks.filter((t) => t.id !== taskId);
  saveAndRender();
}

async function deleteTask(taskId) {
  const selectedList = getCurrentList();
  if (!selectedList) {
    showError(`No list selected to delete task from`);
    return;
  }

  const task = selectedList.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const isArchived = selectedList.isArchive;
  const confirmMessage = isArchived
    ? "This will permanently delete this task. This action cannot be undone."
    : task.name;

  const confirmed = await confirmDelete(confirmMessage, "task");
  if (!confirmed) return;

  selectedList.tasks = selectedList.tasks.filter((t) => t.id !== taskId);
  saveAndRender();
  showSuccess(`Task "${task.name}" ${isArchived ? "permanently" : ""} deleted`);
}

function editTaskName(taskId) {
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  const textElement = taskElement.querySelector(`[data-task-text="${taskId}"]`);
  const inputElement = taskElement.querySelector(
    `[data-task-input="${taskId}"]`
  );
  const editBtn = taskElement.querySelector(`[data-edit-task="${taskId}"]`);

  // Toggle to edit mode
  textElement.classList.add("hidden");
  inputElement.classList.remove("hidden");
  inputElement.focus();
  inputElement.select();

  // Change edit button to save button
  editBtn.innerHTML = '<i class="fas fa-check"></i>';
  editBtn.title = "Save task";
  editBtn.dataset.saveTask = taskId;
  delete editBtn.dataset.editTask;

  const handleBlur = () => {
    inputElement.removeEventListener("keydown", handleKeydown);
    inputElement.removeEventListener("blur", handleBlur);
    saveTaskName(taskId);
  };

  // Handle save on Enter key
  const handleKeydown = (event) => {
    if (event.key === "Enter" || event.key === "Escape") {
      inputElement.removeEventListener("blur", handleBlur);
      inputElement.removeEventListener("keydown", handleKeydown);
    }

    if (event.key === "Enter") {
      saveTaskName(taskId);
    } else if (event.key === "Escape") {
      cancelTaskEdit(taskId);
    }
  };

  inputElement.addEventListener("keydown", handleKeydown);
  inputElement.addEventListener("blur", handleBlur);
}

function saveTaskName(taskId) {
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  const inputElement = taskElement.querySelector(
    `[data-task-input="${taskId}"]`
  );
  const newName = inputElement.value.trim();

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
  const task = selectedList.tasks.find((t) => t.id === taskId);

  if (task && newName !== task.name) {
    task.name = newName;
    saveAndRender();
    showSuccess("Task name updated");
  } else {
    cancelTaskEdit(taskId);
  }
}

function cancelTaskEdit(taskId) {
  // TODO: Add a cancel button too?
  const taskElement = document.querySelector(`[data-task-item="${taskId}"]`);
  if (!taskElement) return;

  const textElement = taskElement.querySelector(`[data-task-text="${taskId}"]`);
  const inputElement = taskElement.querySelector(
    `[data-task-input="${taskId}"]`
  );

  textElement.classList.remove("hidden");
  inputElement.classList.add("hidden");

  render();
}

function editListName(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const textElement = listElement.querySelector(`[data-list-text="${listId}"]`);
  const inputElement = listElement.querySelector(
    `[data-list-input="${listId}"]`
  );
  const editBtn = listElement.querySelector(`[data-edit-list="${listId}"]`);

  // Toggle to edit mode
  textElement.classList.add("hidden");
  inputElement.classList.remove("hidden");
  inputElement.focus();
  inputElement.select();

  // Change edit button to save button
  editBtn.innerHTML = '<i class="fas fa-check"></i>';
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
    if (event.key === "Enter" || event.key === "Escape") {
      inputElement.removeEventListener("blur", handleBlur);
      inputElement.removeEventListener("keydown", handleKeydown);
    }

    if (event.key === "Enter") {
      saveListName(listId);
    } else if (event.key === "Escape") {
      cancelListEdit(listId);
    }
  };

  inputElement.addEventListener("keydown", handleKeydown);
  inputElement.addEventListener("blur", handleBlur);
}

function saveListName(listId) {
  const listElement = document.querySelector(`[data-list-id="${listId}"]`);
  const inputElement = listElement.querySelector(
    `[data-list-input="${listId}"]`
  );
  const newName = inputElement.value.trim();

  if (!newName) {
    showError("List name cannot be empty");
    cancelListEdit(listId);
    return;
  }

  const list = state.lists.find((l) => l.id === listId);

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
    `[data-list-input="${listId}"]`
  );

  textElement.classList.remove("hidden");
  inputElement.classList.add("hidden");

  render();
}

function getCurrentList() {
  if (state.selectedListId === archive.ARCHIVE_LIST_ID) {
    return state.archive;
  }
  return state.lists.find((list) => list.id === state.selectedListId);
}

function getPriorityInfo(priority) {
  const priorityData = {
    high: { icon: "🔴", label: "High" },
    medium: { icon: "🟡", label: "Medium" },
    low: { icon: "🟢", label: "Low" },
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
    creation: "Sorting by creation order",
    priority: "Sorting by priority",
    dueDate: "Sorting by due date",
  };

  const buttonInfo = {
    creation: "Sorting by creation order, toggle to sort by priority",
    priority: "Sorting by priority, toggle to sort by due date",
    dueDate: "Sorting by due date, toggle to sort by creation order",
  };

  if (state.sortingType === "creation") {
    elements.taskSortButton.classList.remove("active");
  } else {
    elements.taskSortButton.classList.add("active");
  }

  elements.taskSortButton.ariaLabel = buttonInfo[state.sortingType].ariaLabel;
  elements.taskSortButton.title = buttonInfo[state.sortingType].title;
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
      (task) => (task.priority || "medium") === state.priorityFilter
    );
  }

  // Filter by search query
  if (state.searchQuery) {
    filtered = filtered.filter((task) =>
      task.name.toLowerCase().includes(state.searchQuery)
    );
  }

  return filtered;
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
