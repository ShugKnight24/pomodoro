"use strict";

import { initAccordion } from "./modules/accordion.js";
import { initSettings } from "./modules/settings.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Pomodoro App...");

  initAccordion();
  initSettings();

  console.log("Pomodoro App Initialized");
});
