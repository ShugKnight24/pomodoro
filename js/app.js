import { initPomodoro } from "./modules/pomodoro.js";
import { initToast } from "./modules/toast.js";
import { initTodo } from "./modules/todo.js";

document.addEventListener("DOMContentLoaded", () => {
  initToast();
  initPomodoro();
  initTodo();
});
