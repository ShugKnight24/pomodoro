"use strict";

import { elements, getCurrentList, saveAndRender } from "../modules/todo.js";
import { showSuccess } from "../modules/toast.js";

let draggedTask = null;

// TODO: Build this element dynamically based on the section once this module is more reusable
const dropZone = document.querySelector("[data-drop-zone]");

// TODO: Refactor - more reusable for things other than tasks
export function setupTaskDragAndDrop() {
  elements.tasksContainer.addEventListener("dragend", handleDragEnd);
  elements.tasksContainer.addEventListener("dragenter", handleDragEnter);
  elements.tasksContainer.addEventListener("dragleave", handleDragLeave);
  elements.tasksContainer.addEventListener("dragover", handleDragOver);
  elements.tasksContainer.addEventListener("dragstart", handleDragStart);
  elements.tasksContainer.addEventListener("drop", handleDrop);
  setupDropZone();
}

function setupDropZone() {
  dropZone.addEventListener("dragenter", handleDropZoneEnter);
  dropZone.addEventListener("dragleave", handleDropZoneLeave);
  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("drop", handleDropZoneDrop);
}

function handleDragStart(event) {
  const dragHandle = event.target.closest("[data-drag-handle]");

  if (!dragHandle) {
    event.preventDefault?.();
    return;
  }

  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  const editForm = taskElement.querySelector("[data-task-edit-form]");
  // No d&d while editing
  if (editForm && !editForm.classList.contains("hidden")) {
    event.preventDefault?.();
    return;
  }

  draggedTask = taskElement;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", taskElement.innerHTML);
  event.dataTransfer.setDragImage(taskElement, 0, 0);

  setTimeout(() => {
    taskElement.classList.add("dragging");
    if (dropZone) {
      dropZone.hidden = false;
    }
  }, 0);
}

function handleDragEnd(event) {
  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  taskElement.classList.remove("dragging");

  document.querySelectorAll(".drag-over").forEach((element) => {
    element.classList.remove("drag-over");
  });

  if (dropZone) {
    dropZone.hidden = true;
    dropZone.classList.remove("drag-over");
  }

  draggedTask = null;
}

function handleDragOver(event) {
  event.preventDefault?.();
  event.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter(event) {
  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  if (taskElement && taskElement !== draggedTask) {
    taskElement.classList.add("drag-over");
  }
}

function handleDragLeave(event) {
  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  if (taskElement && !taskElement.contains(event.relatedTarget)) {
    taskElement.classList.remove("drag-over");
  }

  if (taskElement && !taskElement.contains(event.relatedTarget)) {
    taskElement.classList.remove("drag-over");
  }
}

function handleDrop(event) {
  event.stopPropagation?.();

  if (!draggedTask) return false;

  const selectedList = getCurrentList();
  if (!selectedList) return false;

  const targetElement = event.target.closest("[data-task-item]");
  const draggedId = parseInt(draggedTask.dataset.taskItem);
  const draggedIndex = selectedList.tasks.findIndex(
    (task) => task.id === draggedId
  );

  if (draggedIndex === -1) return false;

  const listType = selectedList.isArchive ? "archived task" : "task";

  // Drop on itself
  if (targetElement === draggedTask) {
    showSuccess(
      `${
        listType.charAt(0).toUpperCase() + listType.slice(1)
      } kept in original position`
    );
    return false;
  }

  // Drop on another task
  if (targetElement && targetElement !== draggedTask) {
    const targetId = parseInt(targetElement.dataset.taskItem);
    const targetIndex = selectedList.tasks.findIndex(
      (task) => task.id === targetId
    );

    if (targetIndex === -1) return false;

    const adjustedTargetIndex =
      draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;

    // Reorder the tasks array
    const [removed] = selectedList.tasks.splice(draggedIndex, 1);
    selectedList.tasks.splice(adjustedTargetIndex, 0, removed);

    saveAndRender();
    showSuccess(
      `${listType.charAt(0).toUpperCase() + listType.slice(1)} reordered`
    );
  }

  return false;
}

function handleDropZoneEnter(event) {
  event.preventDefault();
  if (dropZone) {
    dropZone.classList.add("drag-over");
  }
}

function handleDropZoneLeave(event) {
  if (dropZone && !dropZone.contains(event.relatedTarget)) {
    dropZone.classList.remove("drag-over");
  }
}

function handleDropZoneDrop(event) {
  event.preventDefault?.();
  event.stopPropagation?.();

  if (!draggedTask) return false;

  const selectedList = getCurrentList();
  if (!selectedList) return false;

  const draggedId = parseInt(draggedTask.dataset.taskItem);
  const draggedIndex = selectedList.tasks.findIndex(
    (task) => task.id === draggedId
  );

  if (draggedIndex === -1) return false;

  const lastIndex = selectedList.tasks.length - 1;

  // Already last task
  if (draggedIndex === lastIndex) {
    const listType = selectedList.isArchive ? "archived task" : "task";
    showSuccess(
      `${
        listType.charAt(0).toUpperCase() + listType.slice(1)
      } kept in original position`
    );
    if (dropZone) {
      dropZone.hidden = true;
      dropZone.classList.remove("drag-over");
    }
    return false;
  }

  // Move to end
  const [removed] = selectedList.tasks.splice(draggedIndex, 1);
  selectedList.tasks.push(removed);

  if (dropZone) {
    dropZone.hidden = true;
    dropZone.classList.remove("drag-over");
  }

  saveAndRender();
  const listType = selectedList.isArchive ? "archived task" : "task";
  showSuccess(
    `${listType.charAt(0).toUpperCase() + listType.slice(1)} moved to end`
  );

  return false;
}
