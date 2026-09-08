import { getIcon } from "../utils/icons.js";
import { escapeHtml } from "../utils/sanitize.js";

let toastContainer = null;

export function initToast() {
  if (!toastContainer) {
    toastContainer = createToastContainer();
  }

  // Listen for custom show-toast events
  document.addEventListener("show-toast", (event) => {
    const { message, type = "info", duration } = event.detail;
    showToast(message, type, duration);
  });
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toast-container";
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  document.body.appendChild(container);
  return container;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default 3000)
 */
export function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");

  const icons = {
    success: getIcon("toast-success", { size: 18 }),
    error: getIcon("toast-error", { size: 18 }),
    warning: getIcon("toast-warning", { size: 18 }),
    info: getIcon("toast-info", { size: 18 }),
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => toast.classList.add("toast-show"), 10);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove("toast-show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

export function showSuccess(message, duration) {
  showToast(message, "success", duration);
}

export function showError(message, duration) {
  showToast(message, "error", duration);
}

export function showWarning(message, duration) {
  showToast(message, "warning", duration);
}

export function showInfo(message, duration) {
  showToast(message, "info", duration);
}
