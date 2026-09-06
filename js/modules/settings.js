"use strict";

import { importStats, getAllStats } from "./stats.js";
import {
  setCompanionEnabled,
  setCompanionMode,
  setSelectedMascot,
  getCompanionSettings,
  openMascotPicker,
} from "./mascot/companion.js";
import { restartAllTours, startTourForCurrentTool } from "./mascot/onboardingTour.js";
import { clearExperienceData } from "./sampleData.js";
import { showSuccess } from "./toast.js";

const settingsPanel = document.querySelector(".side-settings");
const openButton = document.querySelector(".open-settings");
const closeButton = document.querySelector(".close-settings");
const visualToggle = document.getElementById("visual-toggle");

export function initSettings() {
  // Panel toggle
  openButton?.addEventListener("click", toggleSettingsPanel);
  closeButton?.addEventListener("click", toggleSettingsPanel);

  // Visual toggle
  const savedVisual = localStorage.getItem("timerVisual");
  if (visualToggle && savedVisual === "hourglass") {
    visualToggle.checked = true;
  }
  visualToggle?.addEventListener("change", handleVisualToggle);

  // Initialize new settings
  initThemeSelector();
  initTimerStyleSelector();
  initAnimationStyleSelector();
  initTimerPresets();
  initNotifications();
  initDataManagement();
  initMascotSettings();
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
  settingsPanel?.classList.toggle("open");
}

// ===================================
// APP THEME SELECTOR
// ===================================

function initThemeSelector() {
  const themeSelect = document.getElementById("app-theme-select");
  if (!themeSelect) return;

  // Load saved theme
  const savedTheme = localStorage.getItem("appTheme") || "modern";
  themeSelect.value = savedTheme;
  applyAppTheme(savedTheme);

  // Listen for changes
  themeSelect.addEventListener("change", (e) => {
    const theme = e.target.value;
    applyAppTheme(theme);
    localStorage.setItem("appTheme", theme);
  });
}

function applyAppTheme(theme) {
  document.documentElement.setAttribute("data-app-theme", theme);
}

// ===================================
// TIMER STYLE SELECTOR
// ===================================

function initTimerStyleSelector() {
  const timerStyleSelect = document.getElementById("timer-style-select");
  if (!timerStyleSelect) return;

  // Load saved style
  const savedStyle = localStorage.getItem("timerStyle") || "classic";
  timerStyleSelect.value = savedStyle;
  applyTimerStyle(savedStyle);

  // Listen for changes
  timerStyleSelect.addEventListener("change", (e) => {
    const style = e.target.value;
    applyTimerStyle(style);
    localStorage.setItem("timerStyle", style);
  });
}

function applyTimerStyle(style) {
  document.body.setAttribute("data-timer-style", style);

  // Remove hidden class from timers to let CSS handle visibility
  const classicTimer = document.getElementById("timer-classic");
  const modernTimer = document.getElementById("timer-modern");

  if (classicTimer) classicTimer.classList.remove("hidden");
  if (modernTimer) modernTimer.classList.remove("hidden");

  // When switching to classic, restore both session and break divs
  // (the modern timer's mode toggle may have hidden one of them)
  if (style === "classic") {
    const sessionDiv = document.querySelector(".session-div");
    const breakDiv = document.querySelector(".break-div");
    const sessionMinus = document.getElementById("minus-5-clock");
    const sessionPlus = document.getElementById("add-5-clock");
    const breakMinus = document.getElementById("minus-5-break");
    const breakPlus = document.getElementById("add-5-break");

    if (sessionDiv) sessionDiv.classList.remove("hidden");
    if (breakDiv) breakDiv.classList.remove("hidden");
    if (sessionMinus) sessionMinus.classList.remove("hidden");
    if (sessionPlus) sessionPlus.classList.remove("hidden");
    if (breakMinus) breakMinus.classList.remove("hidden");
    if (breakPlus) breakPlus.classList.remove("hidden");
  }

  // Dispatch event for other modules to listen
  const event = new CustomEvent("timer-style-change", {
    detail: { style },
  });
  document.dispatchEvent(event);
}

// ===================================
// ANIMATION STYLE SELECTOR
// ===================================

function initAnimationStyleSelector() {
  const animationSelect = document.getElementById("animation-style-select");
  if (!animationSelect) return;

  // Load saved animation
  const savedAnimation = localStorage.getItem("animationStyle") || "none";
  animationSelect.value = savedAnimation;
  applyAnimationStyle(savedAnimation);

  // Listen for changes
  animationSelect.addEventListener("change", (e) => {
    const animation = e.target.value;
    applyAnimationStyle(animation);
    localStorage.setItem("animationStyle", animation);
  });
}

function applyAnimationStyle(animation) {
  // Apply to modern timer
  const modernTimer = document.getElementById("timer-modern");
  if (modernTimer) {
    modernTimer.setAttribute("data-animation", animation);
  }

  // Apply to focus mode
  const focusMode = document.getElementById("focus-mode");
  if (focusMode) {
    focusMode.setAttribute("data-animation", animation);
  }

  // Dispatch event
  const event = new CustomEvent("animation-style-change", {
    detail: { animation },
  });
  document.dispatchEvent(event);
}

// ===================================
// TIMER PRESETS
// ===================================

function initTimerPresets() {
  const presetButtons = document.querySelectorAll(".preset-btn");
  const customWorkInput = document.getElementById("custom-session");
  const customBreakInput = document.getElementById("custom-break");
  const applyCustomBtn = document.getElementById("apply-custom-timer");

  if (!presetButtons.length) return;

  // Load saved preset
  const savedSession =
    parseInt(localStorage.getItem("customSessionTime")) || 25;
  const savedBreak = parseInt(localStorage.getItem("customBreakTime")) || 5;

  // Set active preset button based on saved values
  presetButtons.forEach((btn) => {
    const sessionTime = parseInt(btn.dataset.session);
    const breakTime = parseInt(btn.dataset.break);

    if (sessionTime === savedSession && breakTime === savedBreak) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      // Remove active from all
      presetButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Apply this preset
      applyTimerPreset({ work: sessionTime, break: breakTime });
      localStorage.setItem("customSessionTime", sessionTime);
      localStorage.setItem("customBreakTime", breakTime);

      // Update custom inputs to reflect selection
      if (customWorkInput) customWorkInput.value = sessionTime;
      if (customBreakInput) customBreakInput.value = breakTime;
    });
  });

  // Initialize custom input values
  if (customWorkInput) customWorkInput.value = savedSession;
  if (customBreakInput) customBreakInput.value = savedBreak;

  // Apply custom button handler
  applyCustomBtn?.addEventListener("click", () => {
    const customWork = parseInt(customWorkInput?.value) || 25;
    const customBreak = parseInt(customBreakInput?.value) || 5;

    // Remove active from preset buttons (custom values)
    presetButtons.forEach((b) => b.classList.remove("active"));

    applyTimerPreset({ work: customWork, break: customBreak });
    localStorage.setItem("customSessionTime", customWork);
    localStorage.setItem("customBreakTime", customBreak);
  });

  // Apply initial preset
  applyTimerPreset({ work: savedSession, break: savedBreak });
}

function applyTimerPreset(preset) {
  const event = new CustomEvent("timer-preset-change", {
    detail: {
      workMinutes: preset.work,
      breakMinutes: preset.break,
    },
  });
  document.dispatchEvent(event);
}

// ===================================
// NOTIFICATIONS
// ===================================

function initNotifications() {
  const notificationToggle = document.getElementById("notifications-toggle");

  if (!notificationToggle) return;

  if (!("Notification" in window)) {
    updateNotificationStatus();
    notificationToggle.disabled = true;
    return;
  }

  // Check current permission status
  updateNotificationStatus();

  // Load saved preference
  const savedNotifications = localStorage.getItem("notifications") === "true";
  notificationToggle.checked =
    savedNotifications && Notification.permission === "granted";

  notificationToggle.addEventListener("change", async (e) => {
    if (e.target.checked) {
      // Request permission
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          localStorage.setItem("notifications", "true");
          showTestNotification();
        } else {
          e.target.checked = false;
          localStorage.setItem("notifications", "false");
        }
      } else if (Notification.permission === "granted") {
        localStorage.setItem("notifications", "true");
      } else {
        e.target.checked = false;
        alert(
          "Notifications are blocked. Please enable them in your browser settings.",
        );
      }
    } else {
      localStorage.setItem("notifications", "false");
    }
    updateNotificationStatus();
  });
}

function updateNotificationStatus() {
  const notificationStatus = document.getElementById("notification-status");
  if (!notificationStatus) return;

  if (!("Notification" in window)) {
    notificationStatus.textContent = "Not supported";
    notificationStatus.className = "notification-status denied";
    return;
  }

  switch (Notification.permission) {
    case "granted":
      notificationStatus.textContent = "Enabled";
      notificationStatus.className = "notification-status granted";
      break;
    case "denied":
      notificationStatus.textContent = "Blocked in browser";
      notificationStatus.className = "notification-status denied";
      break;
    default:
      notificationStatus.textContent = "Click to enable";
      notificationStatus.className = "notification-status";
  }
}

function showTestNotification() {
  new Notification("Pomodoro Timer", {
    body: "Notifications are now enabled!",
    icon: "/icons/icon-192.png",
  });
}

/**
 * Send a notification (called from timer module)
 */
export function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  const enabled = localStorage.getItem("notifications") === "true";
  if (enabled && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icons/icon-192.png",
      tag: "pomodoro-timer",
    });
  }
}

// ===================================
// DATA MANAGEMENT (EXPORT/IMPORT)
// ===================================

function initDataManagement() {
  const exportBtn = document.getElementById("export-data");
  const importBtn = document.getElementById("import-data");
  const importInput = document.getElementById("import-file");

  exportBtn?.addEventListener("click", handleExport);
  importBtn?.addEventListener("click", () => importInput?.click());
  importInput?.addEventListener("change", handleImport);
}

function handleExport() {
  // Gather all data
  const data = {
    stats: getAllStats(),
    settings: {
      timerVisual: localStorage.getItem("timerVisual"),
      appTheme: localStorage.getItem("appTheme"),
      timerStyle: localStorage.getItem("timerStyle"),
      animationStyle: localStorage.getItem("animationStyle"),
      customSessionTime: localStorage.getItem("customSessionTime"),
      customBreakTime: localStorage.getItem("customBreakTime"),
      notifications: localStorage.getItem("notifications"),
      "pomodoro-theme": localStorage.getItem("pomodoro-theme"),
      "pomidor-lang": localStorage.getItem("pomidor-lang"),
      buzzerVolume: localStorage.getItem("buzzerVolume"),
    },
    lists: JSON.parse(localStorage.getItem("pomodoro.lists") || "[]"),
    archive: JSON.parse(localStorage.getItem("pomodoro.archive") || "null"),
    achievements: JSON.parse(
      localStorage.getItem("pomodoro-achievements") || "[]",
    ),
    vault: JSON.parse(localStorage.getItem("pomidor.vault") || "null"),
    kanban: JSON.parse(localStorage.getItem("pomidor.kanban") || "null"),
    exportedAt: new Date().toISOString(),
  };

  // Create and download file
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pomodoro-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show success message
  const event = new CustomEvent("show-toast", {
    detail: { message: "Data exported successfully!", type: "success" },
  });
  document.dispatchEvent(event);
}

async function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate data structure
    if (!data.exportedAt) {
      throw new Error("Invalid backup file");
    }

    // Import stats
    if (data.stats) {
      importStats({ stats: data.stats });
    }

    // Import settings
    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
    }

    // Import lists and archive
    if (data.lists) {
      localStorage.setItem("pomodoro.lists", JSON.stringify(data.lists));
    }
    if (data.archive) {
      localStorage.setItem("pomodoro.archive", JSON.stringify(data.archive));
    }

    // Import achievements
    if (data.achievements) {
      localStorage.setItem(
        "pomodoro-achievements",
        JSON.stringify(data.achievements),
      );
    }

    // Import vault and kanban
    if (data.vault) {
      localStorage.setItem("pomidor.vault", JSON.stringify(data.vault));
    }
    if (data.kanban) {
      localStorage.setItem("pomidor.kanban", JSON.stringify(data.kanban));
    }

    // Show success and reload
    const event = new CustomEvent("show-toast", {
      detail: {
        message: "Data imported successfully! Reloading...",
        type: "success",
      },
    });
    document.dispatchEvent(event);

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (err) {
    console.error("Import error:", err);
    const event = new CustomEvent("show-toast", {
      detail: {
        message: "Failed to import data. Invalid file format.",
        type: "error",
      },
    });
    document.dispatchEvent(event);
  }

  // Reset input
  e.target.value = "";
}

// ===================================
// MASCOT COMPANION & ONBOARDING SETTINGS
// ===================================

function initMascotSettings() {
  const mascotToggle = document.getElementById("mascot-toggle");
  const mascotSelect = document.getElementById("mascot-select");
  const companionModeSelect = document.getElementById("companion-mode-select");
  const restartAllToursBtn = document.getElementById("restart-all-onboarding-btn");
  const tourToolButtons = document.querySelectorAll(".tour-tool-btn");

  const companionConfig = getCompanionSettings();

  if (mascotToggle) {
    mascotToggle.checked = companionConfig.enabled;
    mascotToggle.addEventListener("change", (e) => {
      setCompanionEnabled(e.target.checked);
    });
  }

  if (mascotSelect) {
    mascotSelect.value = companionConfig.selectedMascotId || "pomi";
    mascotSelect.addEventListener("change", (e) => {
      setSelectedMascot(e.target.value);
    });
  }

  if (companionModeSelect) {
    companionModeSelect.value = companionConfig.mode || "follow";
    companionModeSelect.addEventListener("change", (e) => {
      setCompanionMode(e.target.value);
    });
  }

  if (restartAllToursBtn) {
    restartAllToursBtn.addEventListener("click", () => {
      restartAllTours();
      showSuccess("All onboarding tours restarted! Start any tour from the buttons below or your companion.");
    });
  }

  const openExperienceAssignBtn = document.getElementById("open-experience-assign-btn");
  if (openExperienceAssignBtn) {
    openExperienceAssignBtn.addEventListener("click", () => {
      openMascotPicker();
      // Switch directly to experiences tab
      setTimeout(() => {
        document.getElementById("tab-btn-experiences")?.click();
      }, 50);
    });
  }

  const clearAllTutorialDataBtn = document.getElementById("clear-all-tutorial-data-btn");
  if (clearAllTutorialDataBtn) {
    clearAllTutorialDataBtn.addEventListener("click", () => {
      clearExperienceData("all");
    });
  }

  tourToolButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tool = btn.dataset.tourTool;
      if (tool) {
        startTourForCurrentTool(tool);
        // Close settings panel so user can see the tour spotlight
        document.querySelector(".side-settings")?.classList.remove("open");
      }
    });
  });
}

// Export for timer module to use
export { sendNotification as notify };

