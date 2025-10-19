"use strict";

import { confirmDelete } from "./modal.js";
import { showSuccess, showError } from "./toast.js";

// DOM Elements
const elements = {
  clearCompletedTasks: null,
  deleteListButton: null,
  listsContainer: null,
  listCount: null,
  newListForm: null,
  newListInput: null,
  newTaskForm: null,
  newTaskInput: null,
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
  LISTS: "pomodoro.lists",
  SELECTED_LIST_ID: "pomodoro.selectedListId",
  LIST_COUNTER: "pomodoro.listCounter",
  TASK_COUNTER: "pomodoro.taskCounter",
};

// State
const state = {
  lists: [],
  selectedListId: null,
  listCounter: 0,
  sortingType: "creation", // creation | dueDate | priority
  taskCounter: 0,
};

export function initTodo() {
  initializeElements();
  loadFromStorage();
  setupEventListeners();
  render();
}

function initializeElements() {
  elements.clearCompletedTasks = document.querySelector(
    "[data-clear-completed-tasks]"
  );
  elements.deleteListButton = document.querySelector(
    "[data-delete-list-button]"
  );
  elements.listsContainer = document.querySelector("[data-lists]");
  elements.listCount = document.querySelector("[data-list-count]");
  elements.newListForm = document.querySelector("[data-new-list-form]");
  elements.newListInput = document.querySelector("[data-new-list-input]");
  elements.newTaskForm = document.querySelector("[data-new-task-form]");
  elements.newTaskInput = document.querySelector("[data-new-task-input]");
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
  state.lists = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTS)) || [];
  state.selectedListId =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_LIST_ID)) || null;
  state.listCounter =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.LIST_COUNTER)) || 0;
  state.taskCounter =
    JSON.parse(localStorage.getItem(STORAGE_KEYS.TASK_COUNTER)) || 0;
}

function setupEventListeners() {
  elements.clearCompletedTasks.addEventListener("click", clearCompletedTasks);
  elements.deleteListButton.addEventListener("click", deleteCurrentList);
  elements.listsContainer.addEventListener("click", listItemClick);
  elements.newListForm.addEventListener("submit", newListSubmit);
  elements.newTaskForm.addEventListener("submit", newTaskSubmit);
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
  const selectedList = state.lists.find(
    (list) => list.id === state.selectedListId
  );
  if (selectedList) {
    const count = selectedList.tasks.filter((task) => task.completed).length;
    selectedList.tasks = selectedList.tasks.filter((task) => !task.completed);
    saveAndRender();
    showSuccess(`${count} completed task${count === 1 ? "" : "s"} cleared`);
  }
}

async function deleteCurrentList() {
  const listToDelete = state.lists.find(
    (list) => list.id === state.selectedListId
  );

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
    const selectedList = state.lists.find(
      (list) => list.id === state.selectedListId
    );
    const selectedTask = selectedList.tasks.find(
      (task) => task.id === parseInt(event.target.id)
    );
    selectedTask.completed = event.target.checked;
    selectedTask.completedAt = event.target.checked
      ? new Date().toISOString()
      : null;

    save();
    renderTaskCount(selectedList);
    return;
  }

  // Find the button element (could be the button itself or an icon inside it)
  const button = event.target.closest("button");
  if (!button) return;

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

  const selectedList = state.lists.find(
    (list) => list.id === state.selectedListId
  );
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
    priority: priority,
  };
}

function save() {
  localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(state.lists));
  localStorage.setItem(STORAGE_KEYS.SELECTED_LIST_ID, state.selectedListId);
  localStorage.setItem(STORAGE_KEYS.LIST_COUNTER, state.listCounter);
  localStorage.setItem(STORAGE_KEYS.TASK_COUNTER, state.taskCounter);
}

function render() {
  clearElement(elements.listsContainer);
  renderLists();
  const selectedList = state.lists.find(
    (list) => list.id === state.selectedListId
  );

  if (state.selectedListId === null) {
    // TODO: Achieve with a dynamic class and css specificity to avoid inline styles - hidden...
    elements.taskListContainer.style.display = "none";
  } else {
    // TODO: Achieve with a dynamic class - not hidden
    elements.taskListContainer.style.display = "";
    elements.taskListTitle.innerText = selectedList.name;
    renderTaskCount(selectedList);
    clearElement(elements.tasksContainer);
    renderTasks(selectedList);
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
  renderListCount();
}

function buildListHTML(list) {
  const isActive = list.id === state.selectedListId ? "active-list" : "";
  let listTemplate = `
    <li class="list-name ${isActive}" data-list-id="${list.id}">
      <span class="list-name-text" data-list-text="${list.id}">${list.name}</span>
      <input
        name="list-name-${list.id}"
        class="list-name-input hidden" 
        data-list-input="${list.id}" 
        type="text" 
        value="${list.name}"
      />
      <button class="list-action-btn edit-list-btn" data-edit-list="${list.id}" title="Edit list name" aria-label="Edit list name">
        <i class="fas fa-pencil-alt"></i>
      </button>
    </li>
  `;

  // TODO: Add delete list here as well?

  elements.listsContainer.insertAdjacentHTML("beforeend", listTemplate);
}

function renderListCount() {
  const listCountString = `${state.lists.length} lists`;
  elements.listCount.innerText = listCountString;
}

function renderTaskCount(selectedList) {
  const incompleteTasksCount = selectedList.tasks.filter(
    (task) => !task.completed
  ).length;
  const taskString = incompleteTasksCount === 1 ? "task" : "tasks";

  elements.taskCount.innerText = `${incompleteTasksCount} ${taskString} remaining`;
}

function renderTasks(selectedList) {
  let tasksToRender = selectedList.tasks;

  tasksToRender = getTasksToRender(tasksToRender);

  tasksToRender.forEach((task) => {
    buildTaskHTML(task);
  });
}

function buildTaskHTML(task) {
  let completed = task.completed ? "checked" : "";
  const priority = task.priority || "medium";
  const { icon, label } = getPriorityInfo(priority);

  // Simplify date formatting
  const createdDate = formatDate(task.createdAt);
  const completedDate = task.completedAt
    ? formatDate(task.completedAt)
    : "Not completed";
  const createdDateLong = task.createdAt ? formatDateLong(task.createdAt) : "";
  const completedDateLong = task.completedAt
    ? formatDateLong(task.completedAt)
    : "Not completed";

  const dueDate = task.dueDate ? formatDate(task.dueDate) : null;
  const dueDateLong = task.dueDate ? formatDateLong(task.dueDate) : "";
  const isOverdue =
    task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  // TODO: Simplify with template literals and functions
  const taskTemplate = `
    <div class="task task-priority-${priority}" data-task-item="${task.id}">
      <span class="priority-indicator" title="${label} priority">
        ${icon}
      </span>
      <input
        class="check"
        type="checkbox"
        id="${task.id}"
        name="" value=""
        ${completed}
      >
      <label for="${task.id}">
        <span class="custom-checkbox"></span>
        <span class="task-name-text" data-task-text="${task.id}">${
    task.name
  }</span>
      </label>
      <input 
        class="task-name-input hidden" 
        data-task-input="${task.id}" 
        type="text" 
        value="${task.name}"
      />
      <div class="task-metadata">
        ${
          task.completed && completedDate
            ? `<span class="task-date completed-date" title="Completed: ${completedDateLong}">✓ ${completedDate}</span>`
            : dueDate
            ? `<span class="task-date due-date ${
                isOverdue ? "overdue" : ""
              }" title="Due: ${dueDateLong}">📅 ${dueDate}</span>`
            : `<span class="task-date created-date" title="Created: ${createdDateLong}">${createdDate}</span>`
        }
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit-task-btn" data-edit-task="${
          task.id
        }" title="Edit task">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="task-action-btn delete-task-btn" data-delete-task="${
          task.id
        }" title="Delete task">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;

  // TODO: Add Pomodoro tracker

  elements.tasksContainer.insertAdjacentHTML("beforeend", taskTemplate);
}

async function deleteTask(taskId) {
  const selectedList = state.lists.find(
    (list) => list.id === state.selectedListId
  );

  const task = selectedList.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const confirmed = await confirmDelete(task.name, "task");

  if (confirmed) {
    selectedList.tasks = selectedList.tasks.filter((t) => t.id !== taskId);
    saveAndRender();
    showSuccess(`Task "${task.name}" deleted`);
  }
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

  const selectedList = state.lists.find(
    (list) => list.id === state.selectedListId
  );
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
  switch (state.sortingType) {
    case "priority":
      return sortTasksByPriority(tasks);
    case "dueDate":
      return sortTasksByDueDate(tasks);
    default:
      return tasks; // creation order
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
