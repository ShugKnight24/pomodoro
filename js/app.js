import { initPomodoro } from "./modules/pomodoro.js";
import { initTodo } from "./modules/todo.js";

document.addEventListener("DOMContentLoaded", () => {
  initPomodoro();
  initTodo();
});
