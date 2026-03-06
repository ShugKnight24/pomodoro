"use strict";

const buzzer = document.getElementById("buzzer");
const volumeSlider = document.getElementById("update-volume");
const volumeMinusButton = document.getElementById("volume-down");
const volumePlusButton = document.getElementById("volume-up");
const volumeDisplay = document.querySelector(".volume-display");

export function initVolume() {
  if (!volumeSlider) return;

  // Set initial volume from localStorage or default to 100
  const savedVolume = localStorage.getItem("buzzerVolume");
  if (savedVolume !== null) {
    volumeSlider.value = savedVolume;
  }

  updateVolume();

  volumeSlider.addEventListener("input", updateVolume);
  volumeMinusButton?.addEventListener("click", decreaseVolume);
  volumePlusButton?.addEventListener("click", increaseVolume);
}

function decreaseVolume() {
  volumeSlider.stepDown();
  updateVolume();
}

function increaseVolume() {
  volumeSlider.stepUp();
  updateVolume();
}

/**
 * Update volume based on slider value
 */
function updateVolume() {
  if (buzzer) {
    buzzer.volume = volumeSlider.value / 100;
  }

  // Update display
  if (volumeDisplay) {
    volumeDisplay.textContent = `${volumeSlider.value}%`;
  }

  // Save to localStorage
  localStorage.setItem("buzzerVolume", volumeSlider.value);
}
