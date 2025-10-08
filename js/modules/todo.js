"use strict";

import { showSuccess, showError } from "./toast.js";

// DOM Elements
const elements = {
  clearCompletedTasks: null,
  deleteListButton: null,
  listsContainer: null,
  newListForm: null,
  newListInput: null,
  newTaskForm: null,
  newTaskInput: null,
  taskListContainer: null,
  taskListCount: null,
  taskListTitle: null,
  tasksContainer: null,
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
  elements.taskListContainer = document.querySelector(
    "[data-list-display-container]"
  );
  elements.taskListTitle = document.querySelector("[data-list-title]");
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
}

function listItemClick(event) {
  if (event.target.tagName.toLowerCase() === "li") {
    state.selectedListId = parseInt(event.target.dataset.listId);
    saveAndRender();
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

function deleteCurrentList() {
  // TODO: Add delete confirmation popup
  const listToDelete = state.lists.find(
    (list) => list.id === state.selectedListId
  );
  state.lists = state.lists.filter((list) => list.id !== state.selectedListId);
  state.selectedListId = state.lists.length ? state.lists[0].id : null;
  saveAndRender();
  showSuccess(`List "${listToDelete.name}" deleted`);
}

function taskClick(event) {
  if (event.target.tagName.toLowerCase() === "input") {
    const selectedList = state.lists.find(
      (list) => list.id === state.selectedListId
    );
    const selectedTask = selectedList.tasks.find(
      (task) => task.id === parseInt(event.target.id)
    );
    selectedTask.completed = event.target.checked;
    save();
    renderTaskCount(selectedList);
  }
}

function newTaskSubmit(event) {
  event.preventDefault();
  const taskName = elements.newTaskInput.value.trim();

  if (!taskName) {
    // TODO: create a validation error for the input
    showError("Task name cannot be empty");
    return;
  }

  const task = createTask(taskName);
  elements.newTaskInput.value = "";
  const selectedList = state.lists.find(
    (list) => list.id === state.selectedListId
  );
  selectedList.tasks.push(task);
  saveAndRender();
  showSuccess(`Task "${taskName}" added`);
}

function createList(name) {
  state.listCounter++;

  return {
    id: state.listCounter, // TODO: Create a better unique id
    name: name,
    tasks: [],
  };
}

function createTask(name) {
  state.taskCounter++;

  return {
    id: state.taskCounter, // TODO: Create a better unique id
    name: name,
    completed: false,
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
      ${list.name}
    </li>
  `;

  // TODO: Add edit name list
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
  selectedList.tasks.forEach((task) => {
    buildTaskHTML(task);
  });
}

function buildTaskHTML(task) {
  let completed = task.completed ? "checked" : "";
  let taskTemplate = `
    <div class="task">
      <input
        class="check"
        type="checkbox"
        id="${task.id}"
        name="" value=""
        ${completed}
      >
      <label for="${task.id}">
        <span class="custom-checkbox"></span>
        ${task.name}
      </label>
    </div>
  `;

  // TODO: Add edit task name
  // TODO: Add delete task
  // TODO: Add Pomodoro tracker

  elements.tasksContainer.insertAdjacentHTML("beforeend", taskTemplate);
}

function clearElement(element) {
  if (element) {
    element.innerHTML = "";
  }
}
