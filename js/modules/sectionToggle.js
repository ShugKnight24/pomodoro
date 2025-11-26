"use strict";

const STORAGE_KEY = "pomodoroSectionStates";

export function initSectionToggle() {
  const toggleButtons = document.querySelectorAll("[data-section-toggle]");

  toggleButtons.forEach((button) => {
    const sectionName = button.dataset.sectionToggle;
    const section = document.querySelector(`[data-section="${sectionName}"]`);

    if (!section) return;

    // Restore collapsed state from localStorage
    const savedStates = getSavedStates();
    if (savedStates[sectionName]) {
      section.classList.add("section-collapsed");
      button.classList.add("section-collapsed");
    }

    button.addEventListener("click", () => toggleSection(section, button));
  });
}

function toggleSection(section, button) {
  section.classList.toggle("section-collapsed");
  button.classList.toggle("section-collapsed");

  const isCollapsed = section.classList.contains("section-collapsed");
  const sectionName = button.dataset.sectionToggle;
  saveState(sectionName, isCollapsed);
}

function getSavedStates() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Error loading section states:", error);
    return {};
  }
}

function saveState(sectionName, isCollapsed) {
  try {
    const states = getSavedStates();
    states[sectionName] = isCollapsed;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  } catch (error) {
    console.error("Error saving section state:", error);
  }
}
