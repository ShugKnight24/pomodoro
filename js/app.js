import { initModal } from "./modules/modal.js";
import { initPomodoro } from "./modules/pomodoro.js";
import { initToast } from "./modules/toast.js";
import { initTodo } from "./modules/todo.js";
import { initSectionToggle } from "./modules/sectionToggle.js";

document.addEventListener("DOMContentLoaded", () => {
  initModal();
  initToast();
  initPomodoro();
  initTodo();
  initSectionToggle();
});
