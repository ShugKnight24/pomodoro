/**
 * Keyboard Shortcuts Module
 * Provides keyboard shortcuts for common actions
 */

import { showToast } from "./toast.js";
import {
  toggleFocusMode,
  isFocusModeActive,
  exitFocusMode,
} from "./focusMode.js";

let shortcutsOverlayVisible = false;

export function initKeyboardShortcuts() {
  document.addEventListener("keydown", handleKeyPress);

  // Setup shortcuts overlay close button
  const closeBtn = document.querySelector(".shortcuts-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", hideShortcutsOverlay);
  }

  // Close on backdrop click
  const overlay = document.getElementById("keyboard-shortcuts-overlay");
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideShortcutsOverlay();
      }
    });
  }

  // Show keyboard shortcuts on first visit
  if (!localStorage.getItem("keyboard-shortcuts-seen")) {
    setTimeout(() => {
      showShortcutsOverlay();
      localStorage.setItem("keyboard-shortcuts-seen", "true");
    }, 2000);
  }
}

function handleKeyPress(e) {
  // Don't trigger shortcuts when typing in input fields
  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA" ||
    e.target.isContentEditable
  ) {
    return;
  }

  // Escape - Close overlays
  if (e.key === "Escape") {
    e.preventDefault();
    if (shortcutsOverlayVisible) {
      hideShortcutsOverlay();
      return;
    }
    if (isFocusModeActive()) {
      exitFocusMode();
      return;
    }
    // Close settings modal if open
    const settingsModal = document.getElementById("settings-modal");
    if (settingsModal && !settingsModal.classList.contains("hidden")) {
      settingsModal.classList.add("hidden");
      return;
    }
  }

  // Space - Start/Stop timer
  if (e.code === "Space") {
    e.preventDefault();
    const startBtn = document.getElementById("start");
    const stopBtn = document.getElementById("stop");

    if (!startBtn.classList.contains("hidden")) {
      startBtn.click();
    } else if (!stopBtn.classList.contains("hidden")) {
      stopBtn.click();
    }
  }

  // R - Reset timer
  if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const resetBtn = document.getElementById("reset");
    if (!resetBtn.classList.contains("hidden")) {
      resetBtn.click();
    }
  }

  // N - Focus new task input
  if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const newTaskInput = document.querySelector("[data-new-task-input]");
    if (newTaskInput) {
      newTaskInput.focus();
      newTaskInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // L - Focus new list input
  if (e.key.toLowerCase() === "l" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const newListInput = document.querySelector("[data-new-list-input]");
    if (newListInput) {
      newListInput.focus();
      newListInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // T - Toggle theme (dark/light mode)
  if (e.key.toLowerCase() === "t" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.click();
    }
  }

  // S - Open settings
  if (e.key.toLowerCase() === "s" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const settingsBtn = document.querySelector(".open-settings");
    if (settingsBtn) {
      settingsBtn.click();
    }
  }

  // V - Toggle view (List/Calendar)
  if (e.key.toLowerCase() === "v" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    const viewBtns = document.querySelectorAll(".view-btn");
    const activeBtn = document.querySelector(".view-btn.active");
    const nextBtn = Array.from(viewBtns).find(
      (btn) => !btn.classList.contains("active")
    );
    if (nextBtn) {
      nextBtn.click();
    }
  }

  // F - Toggle Focus Mode
  if (e.key.toLowerCase() === "f" && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    toggleFocusMode();
  }

  // 1, 2, 3 - Quick view switching
  if (e.key === "1" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    const viewBtns = document.querySelectorAll(".view-btn");
    if (viewBtns[0]) viewBtns[0].click();
  }

  if (e.key === "2" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    const viewBtns = document.querySelectorAll(".view-btn");
    if (viewBtns[1]) viewBtns[1].click();
  }

  if (e.key === "3" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    const statsSection = document.getElementById("stats-section");
    if (statsSection) {
      statsSection.scrollIntoView({ behavior: "smooth" });
    }
  }

  // ? - Show keyboard shortcuts overlay
  if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
    e.preventDefault();
    toggleShortcutsOverlay();
  }
}

/**
 * Show the keyboard shortcuts overlay
 */
function showShortcutsOverlay() {
  const overlay = document.getElementById("keyboard-shortcuts-overlay");
  if (overlay) {
    overlay.classList.add("show");
    shortcutsOverlayVisible = true;
  }
}

/**
 * Hide the keyboard shortcuts overlay
 */
function hideShortcutsOverlay() {
  const overlay = document.getElementById("keyboard-shortcuts-overlay");
  if (overlay) {
    overlay.classList.remove("show");
    shortcutsOverlayVisible = false;
  }
}

/**
 * Toggle the keyboard shortcuts overlay
 */
function toggleShortcutsOverlay() {
  if (shortcutsOverlayVisible) {
    hideShortcutsOverlay();
  } else {
    showShortcutsOverlay();
  }
}

function showKeyboardShortcutsHelp() {
  const shortcuts = [
    { key: "Space", action: "Start/Pause timer" },
    { key: "R", action: "Reset timer" },
    { key: "N", action: "New task" },
    { key: "L", action: "New list" },
    { key: "T", action: "Toggle dark mode" },
    { key: "S", action: "Open settings" },
    { key: "V", action: "Switch view" },
    { key: "F", action: "Focus mode" },
    { key: "?", action: "Show this help" },
  ];

  const helpText = shortcuts
    .map(({ key, action }) => `<strong>${key}</strong> - ${action}`)
    .join("<br>");

  showToast(
    `<div style="line-height: 1.8">
      <strong style="font-size: 1.1em; display: block; margin-bottom: 8px;">⌨️ Keyboard Shortcuts</strong>
      ${helpText}
    </div>`,
    "info",
    7000
  );
}
