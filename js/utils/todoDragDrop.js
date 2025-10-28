"use strict";

import { elements, getCurrentList, saveAndRender } from "../modules/todo.js";
import { showSuccess } from "../modules/toast.js";

let draggedTask = null;

// TODO: Refactor - more reusable for things other than tasks
export function setupTaskDragAndDrop() {
  elements.tasksContainer.addEventListener("dragend", handleDragEnd);
  elements.tasksContainer.addEventListener("dragenter", handleDragEnter);
  elements.tasksContainer.addEventListener("dragleave", handleDragLeave);
  elements.tasksContainer.addEventListener("dragover", handleDragOver);
  elements.tasksContainer.addEventListener("dragstart", handleDragStart);
  elements.tasksContainer.addEventListener("drop", handleDrop);
}

function handleDragStart(event) {
  const dragHandle = event.target.closest("[data-drag-handle]");

  if (!dragHandle) {
    event.preventDefault();
    return;
  }

  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  const editForm = taskElement.querySelector("[data-task-edit-form]");
  // No d&d while editing
  if (editForm && !editForm.classList.contains("hidden")) {
    event.preventDefault();
    return;
  }

  draggedTask = taskElement;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/html", taskElement.innerHTML);
  event.dataTransfer.setDragImage(taskElement, 0, 0);

  setTimeout(() => {
    taskElement.classList.add("dragging");
  }, 0);
}

function handleDragEnd(event) {
  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  taskElement.classList.remove("dragging");

  document.querySelectorAll(".drag-over").forEach((element) => {
    element.classList.remove("drag-over");
  });

  draggedTask = null;
}

function handleDragOver(event) {
  if (event.preventDefault) {
    event.preventDefault();
  }
  event.dataTransfer.dropEffect = "move";
  return false;
}

function handleDragEnter(event) {
  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement || taskElement === draggedTask) return;

  taskElement.classList.add("drag-over");
}

function handleDragLeave(event) {
  const taskElement = event.target.closest("[data-task-item]");
  if (!taskElement) return;

  // Remove when leaving the element
  if (!taskElement.contains(event.relatedTarget)) {
    taskElement.classList.remove("drag-over");
  }
}

function handleDrop(event) {
  if (event.stopPropagation) {
    event.stopPropagation();
  }

  const targetElement = event.target.closest("[data-task-item]");
  if (!targetElement || !draggedTask || targetElement === draggedTask) return;

  const selectedList = getCurrentList();
  if (!selectedList) return;

  const draggedId = parseInt(draggedTask.dataset.taskItem);
  const targetId = parseInt(targetElement.dataset.taskItem);

  const draggedIndex = selectedList.tasks.findIndex(
    (task) => task.id === draggedId
  );
  const targetIndex = selectedList.tasks.findIndex(
    (task) => task.id === targetId
  );

  if (draggedIndex === -1 || targetIndex === -1) return;

  // Account for removal shifting indices
  const adjustedTargetIndex =
    draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const listType = selectedList.isArchive ? "archived task" : "task";

  if (draggedIndex === adjustedTargetIndex) {
    showSuccess(
      `${
        listType.charAt(0).toUpperCase() + listType.slice(1)
      } kept in original position`
    );
    return false;
  }

  // Reorder the tasks array
  const [removed] = selectedList.tasks.splice(draggedIndex, 1);
  selectedList.tasks.splice(adjustedTargetIndex, 0, removed);

  saveAndRender();
  showSuccess(
    `${listType.charAt(0).toUpperCase() + listType.slice(1)} reordered`
  );

  return false;
}
