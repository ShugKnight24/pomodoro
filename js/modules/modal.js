"use strict";

let modalContainer = null;
let currentResolve = null;

export function initModal() {
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.className = "modal-overlay hidden";
    modalContainer.setAttribute("role", "dialog");
    modalContainer.setAttribute("aria-modal", "true");

    modalContainer.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title"></h2>
        </div>
        <div class="modal-body">
          <p class="modal-message"></p>
        </div>
        <div class="modal-actions">
          <button class="button modal-button modal-cancel-button" data-modal-cancel></button>
          <button class="button modal-button modal-confirm-button" data-modal-confirm></button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const cancelButton = modalContainer.querySelector("[data-modal-cancel]");
    const confirmButton = modalContainer.querySelector("[data-modal-confirm]");

    cancelButton.addEventListener("click", () => closeModal(false));
    confirmButton.addEventListener("click", () => closeModal(true));

    // Close on overlay click
    modalContainer.addEventListener("click", (event) => {
      if (event.target === modalContainer) {
        closeModal(false);
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        !modalContainer.classList.contains("hidden")
      ) {
        closeModal(false);
      }
    });
  }
}

/**
 * Show a confirmation modal
 * @param {Object} options - Configuration options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.confirmText - Text for confirm button (default: "Confirm")
 * @param {string} options.cancelText - Text for cancel button (default: "Cancel")
 * @param {string} options.type - Type of confirmation: 'danger', 'warning', 'info' (default: 'warning')
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal({
  title = "Confirm Action",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}) {
  return new Promise((resolve) => {
    currentResolve = resolve;

    const titleElement = modalContainer.querySelector(".modal-title");
    const messageElement = modalContainer.querySelector(".modal-message");
    const confirmButton = modalContainer.querySelector("[data-modal-confirm]");
    const cancelButton = modalContainer.querySelector("[data-modal-cancel]");
    const modal = modalContainer.querySelector(".modal");

    titleElement.textContent = title;
    messageElement.textContent = message;
    confirmButton.textContent = confirmText;
    cancelButton.textContent = cancelText;

    // Remove previous type to prevent conflicts
    modal.classList.remove("modal-danger", "modal-warning", "modal-info");

    if (type) {
      modal.classList.add(`modal-${type}`);
    }

    modalContainer.classList.remove("hidden");

    setTimeout(() => confirmButton.focus(), 10);
  });
}

function closeModal(confirmed) {
  modalContainer.classList.add("hidden");

  if (currentResolve) {
    currentResolve(confirmed);
    currentResolve = null;
  }
}

/**
 * Convenience function for delete confirmations
 */
export function confirmDelete(itemName, itemType = "item") {
  return showConfirmModal({
    title: `Delete ${itemType}`,
    message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    type: "danger",
  });
}

