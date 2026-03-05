// kanban.js — Tutorial Kanban Board system
// Provides a visual kanban board for task management
// Includes a built-in tutorial that teaches users the app on first load

import { showSuccess } from "./toast.js";

const STORAGE_KEY = "pomidor.kanban";
const TUTORIAL_KEY = "pomidor.kanban.tutorialDone";

// Default tutorial board
const TUTORIAL_BOARD = {
  id: "tutorial",
  title: "Welcome to Pomidor! 🍅",
  columns: [
    {
      id: "col-start",
      title: "Start Here",
      color: "#3b82f6",
      cards: [
        {
          id: "t1",
          title: "Welcome to Pomidor!",
          description:
            "This kanban board is your guide to getting started. Move cards from left to right as you complete each step!\n\nDrag this card to 'In Progress' to begin.",
          labels: ["tutorial"],
          priority: "high",
        },
        {
          id: "t2",
          title: "Try the Pomodoro Timer ⏲️",
          description:
            "Scroll up to the timer section. Try setting a session length and pressing Start.\n\nThe timer supports:\n• Custom durations (25/5, 50/10, 90/20)\n• Classic or Modern timer styles\n• Focus Mode (press F) for distraction-free sessions",
          labels: ["tutorial", "timer"],
          priority: "medium",
        },
        {
          id: "t3",
          title: "Create a To-Do List ✅",
          description:
            "Switch to the List view and create your first list:\n1. Type a list name and press Enter\n2. Add tasks with priorities and due dates\n3. Drag tasks to reorder them\n4. Try the search and filter options",
          labels: ["tutorial", "tasks"],
          priority: "medium",
        },
        {
          id: "t4",
          title: "Explore the Calendar 📅",
          description:
            "Switch to Calendar view to see your tasks over time:\n• Month and Week views\n• Click any day to see details\n• Quick-add tasks from the calendar\n• Activity heatmap shows your productivity",
          labels: ["tutorial", "calendar"],
          priority: "low",
        },
        {
          id: "t5",
          title: "Check Your Stats 📊",
          description:
            "Switch to Stats view to track your progress:\n• Daily pomodoro count & goals\n• Streak tracking (keep the fire going!)\n• Weekly trends & productivity insights\n• Activity heatmap (GitHub-style)",
          labels: ["tutorial", "stats"],
          priority: "low",
        },
        {
          id: "t6",
          title: "Try the Vault (Notes) 📝",
          description:
            "Switch to Vault view for your personal notes:\n• Create folders to organize\n• Tag notes for easy search\n• Link notes with [[Note Title]] syntax\n• See backlinks automatically",
          labels: ["tutorial", "vault"],
          priority: "low",
        },
        {
          id: "t7",
          title: "Customize Everything ⚙️",
          description:
            "Open Settings (gear icon) to personalize:\n• 4 themes: Modern, Legal Pad, Midnight, Ocean\n• Dark / Light mode\n• English / Русский language\n• Timer presets & notifications\n• Export/import your data anytime",
          labels: ["tutorial", "settings"],
          priority: "low",
        },
      ],
    },
    {
      id: "col-progress",
      title: "In Progress",
      color: "#f59e0b",
      cards: [],
    },
    {
      id: "col-done",
      title: "Done!",
      color: "#10b981",
      cards: [],
    },
  ],
};

let state = {
  boards: [],
  activeBoardId: null,
  cardCounter: 0,
  columnCounter: 0,
  boardCounter: 0,
  dragState: null, // { cardId, sourceColumnId }
};

// ─── Persistence ───────────────────────────────────────────

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      Object.assign(state, JSON.parse(saved));
    }
  } catch {
    // Fresh start
  }

  // Add tutorial board if first visit
  if (!localStorage.getItem(TUTORIAL_KEY) && state.boards.length === 0) {
    state.boards.push(JSON.parse(JSON.stringify(TUTORIAL_BOARD)));
    state.activeBoardId = "tutorial";
    localStorage.setItem(TUTORIAL_KEY, "shown");
  }

  if (!state.activeBoardId && state.boards.length > 0) {
    state.activeBoardId = state.boards[0].id;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Board CRUD ────────────────────────────────────────────

function createBoard(title = "New Board") {
  state.boardCounter++;
  const board = {
    id: `board-${state.boardCounter}`,
    title,
    columns: [
      {
        id: `col-${++state.columnCounter}`,
        title: "To Do",
        color: "#3b82f6",
        cards: [],
      },
      {
        id: `col-${++state.columnCounter}`,
        title: "In Progress",
        color: "#f59e0b",
        cards: [],
      },
      {
        id: `col-${++state.columnCounter}`,
        title: "Done",
        color: "#10b981",
        cards: [],
      },
    ],
  };
  state.boards.push(board);
  state.activeBoardId = board.id;
  saveState();
  render();
  return board;
}

function deleteBoard(id) {
  state.boards = state.boards.filter((b) => b.id !== id);
  if (state.activeBoardId === id) {
    state.activeBoardId = state.boards[0]?.id || null;
  }
  saveState();
  render();
}

function getActiveBoard() {
  return state.boards.find((b) => b.id === state.activeBoardId);
}

// ─── Column CRUD ───────────────────────────────────────────

function addColumn(boardId, title = "New Column") {
  const board = state.boards.find((b) => b.id === boardId);
  if (!board) return;
  state.columnCounter++;
  board.columns.push({
    id: `col-${state.columnCounter}`,
    title,
    color: "#64748b",
    cards: [],
  });
  saveState();
  render();
}

function deleteColumn(boardId, columnId) {
  const board = state.boards.find((b) => b.id === boardId);
  if (!board) return;
  board.columns = board.columns.filter((c) => c.id !== columnId);
  saveState();
  render();
}

function renameColumn(boardId, columnId, newTitle) {
  const board = state.boards.find((b) => b.id === boardId);
  const col = board?.columns.find((c) => c.id === columnId);
  if (col) {
    col.title = newTitle;
    saveState();
  }
}

// ─── Card CRUD ─────────────────────────────────────────────

function addCard(boardId, columnId, title = "New Card") {
  const board = state.boards.find((b) => b.id === boardId);
  const col = board?.columns.find((c) => c.id === columnId);
  if (!col) return;
  state.cardCounter++;
  const card = {
    id: `card-${state.cardCounter}`,
    title,
    description: "",
    labels: [],
    priority: "medium",
    createdAt: new Date().toISOString(),
  };
  col.cards.push(card);
  saveState();
  render();
  return card;
}

function deleteCard(boardId, columnId, cardId) {
  const board = state.boards.find((b) => b.id === boardId);
  const col = board?.columns.find((c) => c.id === columnId);
  if (!col) return;
  col.cards = col.cards.filter((c) => c.id !== cardId);
  saveState();
  render();
}

function moveCard(cardId, fromColumnId, toColumnId, insertIndex = -1) {
  const board = getActiveBoard();
  if (!board) return;

  const fromCol = board.columns.find((c) => c.id === fromColumnId);
  const toCol = board.columns.find((c) => c.id === toColumnId);
  if (!fromCol || !toCol) return;

  const cardIdx = fromCol.cards.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return;

  const [card] = fromCol.cards.splice(cardIdx, 1);
  if (insertIndex >= 0) {
    toCol.cards.splice(insertIndex, 0, card);
  } else {
    toCol.cards.push(card);
  }

  saveState();
  render();
}

// ─── Drag and Drop ─────────────────────────────────────────

function setupDragAndDrop() {
  const container = document.getElementById("kanban-board");
  if (!container) return;

  container.addEventListener("dragstart", (e) => {
    const cardEl = e.target.closest("[data-kanban-card]");
    if (!cardEl) return;
    state.dragState = {
      cardId: cardEl.dataset.kanbanCard,
      sourceColumnId: cardEl.closest("[data-kanban-column]")?.dataset
        .kanbanColumn,
    };
    cardEl.classList.add("kanban-dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  container.addEventListener("dragend", (e) => {
    const cardEl = e.target.closest("[data-kanban-card]");
    if (cardEl) cardEl.classList.remove("kanban-dragging");
    state.dragState = null;
    // Remove all drag-over indicators
    container
      .querySelectorAll(".kanban-drag-over")
      .forEach((el) => el.classList.remove("kanban-drag-over"));
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    const colEl = e.target.closest("[data-kanban-column]");
    if (colEl) {
      // Remove drag-over from all others
      container
        .querySelectorAll(".kanban-drag-over")
        .forEach((el) => el.classList.remove("kanban-drag-over"));
      colEl.classList.add("kanban-drag-over");
    }
  });

  container.addEventListener("dragleave", (e) => {
    const colEl = e.target.closest("[data-kanban-column]");
    if (colEl && !colEl.contains(e.relatedTarget)) {
      colEl.classList.remove("kanban-drag-over");
    }
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    const colEl = e.target.closest("[data-kanban-column]");
    if (!colEl || !state.dragState) return;

    colEl.classList.remove("kanban-drag-over");

    const toColumnId = colEl.dataset.kanbanColumn;
    const { cardId, sourceColumnId } = state.dragState;

    if (sourceColumnId !== toColumnId) {
      moveCard(cardId, sourceColumnId, toColumnId);
      showSuccess("Card moved!");
    }

    state.dragState = null;
  });
}

// ─── Rendering ─────────────────────────────────────────────

function render() {
  renderBoardSelector();
  renderBoard();
}

function renderBoardSelector() {
  const selector = document.getElementById("kanban-board-selector");
  if (!selector) return;

  selector.innerHTML = state.boards
    .map(
      (b) =>
        `<button class="kanban-board-tab ${b.id === state.activeBoardId ? "active" : ""}" data-select-board="${b.id}">
          ${escapeHtml(b.title)}
          ${
            b.id !== "tutorial"
              ? `<span class="kanban-board-delete" data-delete-board="${b.id}"><i class="fas fa-times"></i></span>`
              : ""
          }
        </button>`,
    )
    .join("");

  selector.querySelectorAll("[data-select-board]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (e.target.closest("[data-delete-board]")) {
        const id = e.target.closest("[data-delete-board]").dataset.deleteBoard;
        if (confirm("Delete this board?")) {
          deleteBoard(id);
          showSuccess("Board deleted");
        }
        return;
      }
      state.activeBoardId = btn.dataset.selectBoard;
      saveState();
      render();
    });
  });
}

function renderBoard() {
  const container = document.getElementById("kanban-board");
  if (!container) return;

  const board = getActiveBoard();
  if (!board) {
    container.innerHTML = `
      <div class="kanban-empty">
        <i class="fas fa-columns"></i>
        <p>No boards yet. Create one to get started!</p>
      </div>
    `;
    return;
  }

  const priority_icons = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  container.innerHTML = board.columns
    .map(
      (col) => `
    <div class="kanban-column" data-kanban-column="${col.id}">
      <div class="kanban-column-header" style="border-top: 3px solid ${col.color}">
        <span class="kanban-column-title" contenteditable="true" data-rename-column="${col.id}">${escapeHtml(col.title)}</span>
        <span class="kanban-column-count">${col.cards.length}</span>
        <div class="kanban-column-actions">
          <button class="kanban-col-btn" data-add-card="${col.id}" title="Add card">
            <i class="fas fa-plus"></i>
          </button>
          ${
            board.columns.length > 1
              ? `<button class="kanban-col-btn danger" data-delete-column="${col.id}" title="Delete column">
              <i class="fas fa-trash"></i>
            </button>`
              : ""
          }
        </div>
      </div>
      <div class="kanban-card-list" data-column-drop="${col.id}">
        ${col.cards
          .map(
            (card) => `
          <div class="kanban-card ${card.labels?.includes("tutorial") ? "kanban-tutorial-card" : ""}" draggable="true" data-kanban-card="${card.id}">
            <div class="kanban-card-labels">
              ${(card.labels || []).map((l) => `<span class="kanban-label kanban-label-${l}">${escapeHtml(l)}</span>`).join("")}
            </div>
            <div class="kanban-card-title">${escapeHtml(card.title)}</div>
            ${card.description ? `<div class="kanban-card-desc">${escapeHtml(card.description).substring(0, 100)}${card.description.length > 100 ? "..." : ""}</div>` : ""}
            <div class="kanban-card-footer">
              <span class="kanban-card-priority">${priority_icons[card.priority] || "🟡"}</span>
              <button class="kanban-card-delete" data-delete-card="${card.id}" data-from-column="${col.id}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");

  // Add card buttons
  container.querySelectorAll("[data-add-card]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const colId = btn.dataset.addCard;
      const title = prompt("Card title:");
      if (title?.trim()) {
        addCard(board.id, colId, title.trim());
        showSuccess("Card added");
      }
    });
  });

  // Delete card buttons
  container.querySelectorAll("[data-delete-card]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCard(board.id, btn.dataset.fromColumn, btn.dataset.deleteCard);
    });
  });

  // Delete column buttons
  container.querySelectorAll("[data-delete-column]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (confirm("Delete this column and all its cards?")) {
        deleteColumn(board.id, btn.dataset.deleteColumn);
      }
    });
  });

  // Rename column (contenteditable blur)
  container.querySelectorAll("[data-rename-column]").forEach((el) => {
    el.addEventListener("blur", () => {
      const newTitle = el.textContent.trim();
      if (newTitle) {
        renameColumn(board.id, el.dataset.renameColumn, newTitle);
      }
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        el.blur();
      }
    });
  });

  // Card click → expand detail
  container.querySelectorAll("[data-kanban-card]").forEach((cardEl) => {
    cardEl.addEventListener("click", (e) => {
      if (
        e.target.closest("[data-delete-card]") ||
        e.target.closest("[data-kanban-card]")?.getAttribute("contenteditable")
      )
        return;

      const cardId = cardEl.dataset.kanbanCard;
      const colId = cardEl.closest("[data-kanban-column]").dataset.kanbanColumn;
      openCardModal(board.id, colId, cardId);
    });
  });

  setupDragAndDrop();
}

// ─── Card Detail Modal ─────────────────────────────────────

function openCardModal(boardId, columnId, cardId) {
  const board = state.boards.find((b) => b.id === boardId);
  const col = board?.columns.find((c) => c.id === columnId);
  const card = col?.cards.find((c) => c.id === cardId);
  if (!card) return;

  const modal = document.getElementById("kanban-card-modal");
  if (!modal) return;

  const priorities = ["high", "medium", "low"];

  modal.innerHTML = `
    <div class="kanban-modal-content">
      <div class="kanban-modal-header">
        <input type="text" class="kanban-modal-title" value="${escapeHtml(card.title)}" id="kanban-modal-title" />
        <button class="modal-close" id="kanban-modal-close"><i class="fas fa-times"></i></button>
      </div>
      <div class="kanban-modal-body">
        <div class="kanban-modal-field">
          <label>Column</label>
          <select id="kanban-modal-column">
            ${board.columns.map((c) => `<option value="${c.id}" ${c.id === columnId ? "selected" : ""}>${escapeHtml(c.title)}</option>`).join("")}
          </select>
        </div>
        <div class="kanban-modal-field">
          <label>Priority</label>
          <select id="kanban-modal-priority">
            ${priorities.map((p) => `<option value="${p}" ${card.priority === p ? "selected" : ""}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join("")}
          </select>
        </div>
        <div class="kanban-modal-field">
          <label>Description</label>
          <textarea id="kanban-modal-desc" rows="6" placeholder="Add a description...">${escapeHtml(card.description || "")}</textarea>
        </div>
        <div class="kanban-modal-field">
          <label>Labels (comma-separated)</label>
          <input type="text" id="kanban-modal-labels" value="${(card.labels || []).join(", ")}" placeholder="e.g. bug, feature, urgent" />
        </div>
      </div>
      <div class="kanban-modal-footer">
        <button class="button kanban-modal-save" id="kanban-modal-save">Save</button>
        <button class="button kanban-modal-cancel" id="kanban-modal-cancel">Cancel</button>
      </div>
    </div>
  `;

  modal.classList.add("active");

  document
    .getElementById("kanban-modal-close")
    ?.addEventListener("click", () => {
      modal.classList.remove("active");
    });

  document
    .getElementById("kanban-modal-cancel")
    ?.addEventListener("click", () => {
      modal.classList.remove("active");
    });

  document
    .getElementById("kanban-modal-save")
    ?.addEventListener("click", () => {
      card.title =
        document.getElementById("kanban-modal-title").value.trim() ||
        card.title;
      card.description = document.getElementById("kanban-modal-desc").value;
      card.priority = document.getElementById("kanban-modal-priority").value;
      card.labels = document
        .getElementById("kanban-modal-labels")
        .value.split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      // Handle column move
      const newColId = document.getElementById("kanban-modal-column").value;
      if (newColId !== columnId) {
        moveCard(card.id, columnId, newColId);
      }

      saveState();
      render();
      modal.classList.remove("active");
      showSuccess("Card updated");
    });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });
}

// ─── Toolbar ───────────────────────────────────────────────

function setupToolbar() {
  const newBoardBtn = document.getElementById("kanban-new-board");
  const addColBtn = document.getElementById("kanban-add-column");

  newBoardBtn?.addEventListener("click", () => {
    const title = prompt("Board name:");
    if (title?.trim()) {
      createBoard(title.trim());
      showSuccess("Board created");
    }
  });

  addColBtn?.addEventListener("click", () => {
    const board = getActiveBoard();
    if (!board) return;
    const title = prompt("Column name:");
    if (title?.trim()) {
      addColumn(board.id, title.trim());
      showSuccess("Column added");
    }
  });
}

// ─── Helpers ───────────────────────────────────────────────

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// ─── Data Export ───────────────────────────────────────────

export function exportKanbanData() {
  return { boards: state.boards };
}

export function importKanbanData(data) {
  if (data.boards) state.boards = data.boards;
  state.boardCounter = state.boards.length;
  state.activeBoardId = state.boards[0]?.id || null;
  saveState();
  render();
}

// ─── Init ──────────────────────────────────────────────────

export function initKanban() {
  loadState();
  setupToolbar();
  render();
}
