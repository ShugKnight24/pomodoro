"use strict";

import { initAccordion } from "./modules/accordion.js";
import { initSettings } from "./modules/settings.js";
import { initTimer } from "./modules/timer.js";
import { initVolume } from "./modules/volume.js";

document.addEventListener("DOMContentLoaded", () => {
  initPomodoro();
});

const initPomodoro = () => {
  initAccordion();
  initSettings();
  initVolume();
  initTimer();
};
