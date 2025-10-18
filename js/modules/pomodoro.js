"use strict";

import { initAccordion } from "./accordion.js";
import { initSettings } from "./settings.js";
import { initTimer } from "./timer.js";
import { initVolume } from "./volume.js";

export const initPomodoro = () => {
  initAccordion();
  initSettings();
  initVolume();
  initTimer();
};
