"use strict";

import { initAccordion } from "./modules/accordion.js";
import { initSettings } from "./modules/settings.js";
import { initVolume } from "./modules/volume.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Pomodoro App...");
  initPomodoro();
  console.log("Pomodoro App Initialized");
});

const initPomodoro = () => {
  initAccordion();
  initSettings();
  initVolume();
};
