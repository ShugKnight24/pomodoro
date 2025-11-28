"use strict";

const settingsPanel = document.querySelector(".side-settings");
const openButton = document.querySelector(".open-settings");
const closeButton = document.querySelector(".close-settings");
const visualToggle = document.getElementById("visual-toggle");

export function initSettings() {
  openButton.addEventListener("click", toggleSettingsPanel);
  closeButton.addEventListener("click", toggleSettingsPanel);

  const savedVisual = localStorage.getItem("timerVisual");
  if (savedVisual === "hourglass") {
    visualToggle.checked = true;
  }

  visualToggle.addEventListener("change", handleVisualToggle);
}

function handleVisualToggle(event) {
  const isHourglass = event.target.checked;
  const visualType = isHourglass ? "hourglass" : "ring";

  localStorage.setItem("timerVisual", visualType);

  // Dispatch event for timer.js to listen to
  const indicatorEventChange = new CustomEvent("timer-visual-change", {
    detail: { visualType },
  });
  document.dispatchEvent(indicatorEventChange);
}

function toggleSettingsPanel() {
  settingsPanel.classList.toggle("open");
}
