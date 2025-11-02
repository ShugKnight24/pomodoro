"use strict";

// TODO: refactor, functionality is repetitive. Simplify and DRY out
const STORAGE_KEY = "pomodoroSectionStates";

export function initSectionToggle() {
  const toggleButtons = document.querySelectorAll("[data-section-toggle]");

  toggleButtons.forEach((button) => {
    const sectionName = button.dataset.sectionToggle;
    const section = document.querySelector(`[data-section="${sectionName}"]`);

    if (!section) return;

    if (!section.classList.contains("section-collapsed")) {
      section.style.maxHeight = section.scrollHeight + "px";
    }

    // Restore collapsed state from localStorage
    const savedStates = getSavedStates();
    if (savedStates[sectionName]) {
      collapseSection(section, button, false);
    }

    button.addEventListener("click", () => toggleSection(section, button));
  });
}

function toggleSection(section, button) {
  const isCollapsed = section.classList.contains("section-collapsed");

  if (isCollapsed) {
    expandSection(section, button);
  } else {
    collapseSection(section, button, true);
  }

  // Save state
  const sectionName = button.dataset.sectionToggle;
  saveState(sectionName, !isCollapsed);
}

function expandSection(section, button) {
  section.classList.remove("section-collapsed");
  button.classList.remove("section-collapsed");

  section.style.maxHeight = section.scrollHeight + "px";

  setTimeout(() => {
    if (!section.classList.contains("section-collapsed")) {
      section.style.maxHeight = section.scrollHeight + "px";
    }
  }, 600); // Match CSS transition
}

function collapseSection(section, button, animate = true) {
  if (animate) {
    section.style.maxHeight = section.scrollHeight + "px";
    section.offsetHeight;

    requestAnimationFrame(() => {
      section.classList.add("section-collapsed");
      button.classList.add("section-collapsed");
      section.style.maxHeight = "0";
    });
  } else {
    section.classList.add("section-collapsed");
    button.classList.add("section-collapsed");
    section.style.maxHeight = "0";
  }
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
