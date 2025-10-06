"use strict";

/**
 * Format seconds to MM:SS
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedSeconds = seconds >= 10 ? seconds : `0${seconds}`;
  return `${minutes}:${formattedSeconds}`;
}

/**
 * Hide multiple elements
 * @param {Element[]} elements
 */
export function hideElements(elements) {
  elements.forEach((element) => {
    if (element) element.classList.add("hidden");
  });
}

/**
 * Show multiple elements
 * @param {Element[]} elements
 */
export function showElements(elements) {
  elements.forEach((element) => {
    if (element) element.classList.remove("hidden");
  });
}
