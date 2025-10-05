$(document).ready(function () {
  "use strict";

  const buzzer = $("#buzzer")[0];
  let sessionTime = parseInt($("#session-time").html()),
    breakTime = parseInt($("#break-time").html()),
    startSessionTimer,
    startBreakTimer;

  $("#start").on("click", function () {
    startSessionTimer = setInterval(timer, 1000);
    sessionTime *= 60;
    timer();
  });

  function timer() {
    // Hide all the different titles and buttons
    $(
      "#start, #minus-5-clock, #add-5-clock, .break-div, #minus-5-break, #add-5-break"
    ).addClass("hidden");
    $("#stop").removeClass("hidden");

    sessionTime -= 1;

    if (sessionTime === 0) {
      buzzer.play();
      clearInterval(startSessionTimer);
      startBreakTimer = setInterval(breakTimer, 1000);
      breakTime *= 60;
      $(".time-div").addClass("hidden");
      breakTimer();
    }

    let sessionRemainder = sessionTime % 60;

    if (sessionRemainder >= 10) {
      $("#session-time")
        .empty()
        .append(Math.floor(sessionTime / 60) + ":" + sessionRemainder);
    } else {
      $("#session-time")
        .empty()
        .append(Math.floor(sessionTime / 60) + ":" + "0" + sessionRemainder);
    }
  }

  function breakTimer() {
    $(".break-div").removeClass("hidden");
    breakTime -= 1;

    if (breakTime === 0) {
      clearInterval(startBreakTimer);
      buzzer.play();
      $("#reset").removeClass("hidden");
      $("#break-time, #stop").addClass("hidden");
    }

    let breakRemainder = breakTime % 60;

    if (breakRemainder >= 10) {
      $("#break-time")
        .empty()
        .append(Math.floor(breakTime / 60) + ":" + breakRemainder);
    } else {
      $("#break-time")
        .empty()
        .append(Math.floor(breakTime / 60) + ":" + "0" + breakRemainder);
    }
  }

  $("#reset, #stop").on("click", function () {
    sessionTime = 25;
    breakTime = 5;
    $("#session-time").empty().append(sessionTime);
    $("#break-time").empty().append(breakTime);
    resetPomodoro();
  });

  function resetPomodoro() {
    $(
      ".time-div, #start, #minus-5-clock, #add-5-clock, #minus-5-break, #add-5-break, #session-time, #break-time, #session-header, #break-header"
    ).removeClass("hidden");
    $("#reset, #stop").addClass("hidden");
  }

  $("#minus-5-clock").on("click", function () {
    updateTimerValues("session", "subtract");
  });

  $("#add-5-clock").on("click", function () {
    updateTimerValues("session", "add");
  });

  $("#minus-5-break").on("click", function () {
    updateTimerValues("break", "subtract");
  });

  $("#add-5-break").on("click", function () {
    updateTimerValues("break", "add");
  });

  function updateTimerValues(timeType, operation) {
    let $sessionTime = $("#session-time"),
      $breakTime = $("#break-time");

    if (timeType === "session") {
      if (operation === "add") {
        sessionTime += 5;
        $sessionTime.empty().append(sessionTime);
      }
      if (operation === "subtract") {
        if (sessionTime > 5) {
          sessionTime -= 5;
          $sessionTime.empty().append(sessionTime);
        }
      }
    }

    if (timeType === "break") {
      if (operation === "add") {
        breakTime += 5;
        $breakTime.empty().append(breakTime);
      }
      if (operation === "subtract") {
        if (breakTime > 5) {
          breakTime -= 5;
          $breakTime.empty().append(breakTime);
        }
      }
    }
  }
});

// Toggle accordion
$(".accordion-heading").on("click", function (event) {
  event.stopPropagation();
  var $this = $(this);
  $this.parent(".accordion").toggleClass("accordion-active");
  $this
    .parent(".accordion")
    .siblings(".accordion-body")
    .slideToggle("fast")
    .toggleClass("accordion-active");
});

// Handle Settings Menu
function openSettings() {
  $(".side-settings").addClass("open");
}

const $openSettingsButton = $(".open-settings");
$openSettingsButton.on("click", openSettings);

function closeSettings() {
  $(".side-settings").removeClass("open");
}

const $closeSettingsButton = $(".close-settings");
$closeSettingsButton.on("click", closeSettings);

const $buzzer = $("#buzzer")[0];
// Adjust Volume Input
function updateVolume() {
  $buzzer.volume = this.value / 100;
}

const $updateVolumeInput = $("#update-volume");

$updateVolumeInput.on("change", updateVolume).on("mousemove", updateVolume);

// Decrease Volume
const $volumeMinusIcon = $(".volume-container .fa-minus");

$volumeMinusIcon.on("click", function () {
  $updateVolumeInput[0].stepDown(10);
  $buzzer.volume = $updateVolumeInput[0].value / 100;
});

// Increase Volume
const $volumePlusIcon = $(".volume-container .fa-plus");

$volumePlusIcon.on("click", function () {
  $updateVolumeInput[0].stepUp(10);
  $buzzer.volume = $updateVolumeInput[0].value / 100;
});

// TODO: Create an entirely seperate object for TODO functionality...?
// ToDo List Logic
function getQuerySelector(element) {
  return document.querySelector(element);
}

// selectors
const listsContainer = getQuerySelector("[data-lists]");
const newListForm = getQuerySelector("[data-new-list-form]");
const newListInput = getQuerySelector("[data-new-list-input]");
const deleteListButton = getQuerySelector("[data-delete-list-button]");
const taskListContainer = getQuerySelector("[data-list-display-container]");
const taskListTitle = getQuerySelector("[data-list-title]");
const taskListCount = getQuerySelector("[data-list-count]");
const tasksContainer = getQuerySelector("[data-tasks]");
const newTaskForm = getQuerySelector("[data-new-task-form]");
const newTaskInput = getQuerySelector("[data-new-task-input]");
const clearCompletedTasks = getQuerySelector("[data-clear-completed-tasks]");

// local storage
const LOCAL_STORAGE_LIST_KEY = "pomodoro.lists";
const LOCAL_STORAGE_SELECTED_LIST_ID_KEY = "pomodoro.selectedListId";
const LOCAL_STORAGE_LIST_COUNTER_KEY = "pomodoro.listCounter";
const LOCAL_STORAGE_TASK_COUNTER_KEY = "pomodoro.taskCounter";

let lists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LIST_KEY)) || [];
let selectedListId =
  JSON.parse(localStorage.getItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY)) || null;
let listCounter =
  JSON.parse(localStorage.getItem(LOCAL_STORAGE_LIST_COUNTER_KEY)) || 0;
let taskCounter =
  JSON.parse(localStorage.getItem(LOCAL_STORAGE_TASK_COUNTER_KEY)) || 0;

function save() {
  localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(lists));
  localStorage.setItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY, selectedListId);
  localStorage.setItem(LOCAL_STORAGE_LIST_COUNTER_KEY, listCounter);
  localStorage.setItem(LOCAL_STORAGE_TASK_COUNTER_KEY, taskCounter);
}

listsContainer.addEventListener("click", (event) => {
  if (event.target.tagName.toLowerCase() === "li") {
    selectedListId = parseInt(event.target.dataset.listId);
    saveAndRender();
  }
});

newListForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const listName = newListInput.value;

  if (listName === null || listName === "") {
    // TODO: create actual validation error that displays to html
    return;
  }

  const list = createList(listName);
  newListInput.value = "";
  lists.push(list);
  selectedListId = list.id;
  saveAndRender();
});

function createList(name) {
  listCounter++;

  return {
    id: listCounter, // TODO: Create a better unique id
    name: name,
    tasks: [],
  };
}

clearCompletedTasks.addEventListener("click", (event) => {
  const selectedList = lists.find((list) => list.id === selectedListId);
  selectedList.tasks = selectedList.tasks.filter((task) => !task.completed);
  saveAndRender();
});

deleteListButton.addEventListener("click", (event) => {
  deleteCurrentList();
});

function deleteCurrentList() {
  lists = lists.filter((list) => list.id !== selectedListId);
  selectedListId = null;
  saveAndRender();
  // TODO: Add delete confirmation popup
}

tasksContainer.addEventListener("click", (event) => {
  if (event.target.tagName.toLowerCase() === "input") {
    const selectedList = lists.find((list) => list.id === selectedListId);
    const selectedTask = selectedList.tasks.find(
      (task) => task.id === parseInt(event.target.id)
    );
    selectedTask.completed = event.target.checked;
    save();
    renderTaskCount(selectedList);
  }
});

newTaskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const taskName = newTaskInput.value;

  if (taskName === null || taskName === "") {
    // TODO: create actual validation error that displays to html
    return;
  }

  const task = createTask(taskName);
  newTaskInput.value = "";
  const selectedList = lists.find((list) => list.id === selectedListId);
  selectedList.tasks.push(task);
  saveAndRender();
});

function createTask(name) {
  taskCounter++;

  return {
    id: taskCounter, // TODO: Create a better unique id
    name: name,
    completed: false,
  };
}

function render() {
  clearElement(listsContainer);
  renderLists();
  const selectedList = lists.find((list) => list.id === selectedListId);

  if (selectedListId === null) {
    // TODO: Achieve with a dynamic class and css specificity to avoid inline styles - hidden...
    taskListContainer.style.display = "none";
  } else {
    // TODO: Achieve with a dynamic class - not hidden
    taskListContainer.style.display = "";
    taskListTitle.innerText = selectedList.name;
    renderTaskCount(selectedList);
    clearElement(tasksContainer);
    renderTasks(selectedList);
  }
}
render();

function saveAndRender() {
  save();
  render();
}

function renderLists() {
  lists.forEach((list) => {
    buildListHTML(list);
  });
}

function buildListHTML(list) {
  const isActive = list.id === selectedListId ? "active-list" : "";
  let listTemplate = `
		<li class="list-name ${isActive}" data-list-id="${list.id}">
			${list.name}
		</li>
	`;

  // TODO: Add edit name list
  // TODO: Add delete list here as well?

  listsContainer.insertAdjacentHTML("beforeend", listTemplate);
}

function renderTaskCount(selectedList) {
  const incompleteTasksCount = selectedList.tasks.filter(
    (task) => !task.completed
  ).length;
  const taskString = incompleteTasksCount === 1 ? "task" : "tasks";

  taskListCount.innerText = `${incompleteTasksCount} ${taskString} remaining`;
}

function renderTasks(selectedList) {
  selectedList.tasks.forEach((task) => {
    buidTaskHTML(task);
  });
}

function buidTaskHTML(task) {
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

  tasksContainer.insertAdjacentHTML("beforeend", taskTemplate);
}

function clearElement(element) {
  element.innerHTML = "";
}
