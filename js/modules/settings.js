"use strict";

const settingsPanel = document.querySelector(".side-settings");
const openButton = document.querySelector(".open-settings");
const closeButton = document.querySelector(".close-settings");

export function initSettings() {
  openButton.addEventListener("click", toggleSettingsPanel);
  closeButton.addEventListener("click", toggleSettingsPanel);
}

function toggleSettingsPanel() {
  settingsPanel.classList.toggle("open");
}
