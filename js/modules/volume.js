"use strict";

const buzzer = document.getElementById("buzzer");
const volumeSlider = document.getElementById("update-volume");
const volumeMinusButton = document.querySelector(".volume-container .fa-minus");
const volumePlusButton = document.querySelector(".volume-container .fa-plus");

export function initVolume() {
  // Set initial volume
  updateVolume();

  volumeSlider.addEventListener("input", updateVolume);
  volumeMinusButton.addEventListener("click", decreaseVolume);
  volumePlusButton.addEventListener("click", increaseVolume);
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
  buzzer.volume = volumeSlider.value / 100;
}
