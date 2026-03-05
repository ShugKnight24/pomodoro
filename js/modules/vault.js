// vault.js — Personal Vault / Notes system
// Combines the best of Obsidian (linked notes, markdown) and Notion (blocks, views)
// All data stays in localStorage — privacy-first

import { showSuccess } from "./toast.js";

const STORAGE_KEY = "pomidor.vault";
const VAULT_FOLDER_KEY = "pomidor.vault.folders";

let state = {
  notes: [],
  folders: [],
  activeNoteId: null,
  activeFolderId: null, // null = All Notes
  searchQuery: "",
  sortBy: "updated", // updated | created | title
  viewMode: "grid", // grid | list
  noteCounter: 0,
  folderCounter: 0,
};

// ─── Persistence ───────────────────────────────────────────

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
  } catch {
    // Start fresh
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Note CRUD ─────────────────────────────────────────────

function createNote(title = "Untitled", folderId = null) {
  state.noteCounter++;
  const note = {
    id: state.noteCounter,
    title,
    content: "",
    folderId,
    tags: [],
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedNoteIds: [],
  };
  state.notes.unshift(note);
  state.activeNoteId = note.id;
  saveState();
  render();
  focusEditor();
  return note;
}

function updateNote(id, updates) {
  const note = state.notes.find((n) => n.id === id);
  if (!note) return;
  Object.assign(note, updates, { updatedAt: new Date().toISOString() });

  // Auto-detect [[links]] in content
  if (updates.content !== undefined) {
    const linkMatches = updates.content.match(/\[\[([^\]]+)\]\]/g) || [];
    note.linkedNoteIds = linkMatches
      .map((m) => m.slice(2, -2))
      .map((title) => {
        const linked = state.notes.find(
          (n) => n.title.toLowerCase() === title.toLowerCase(),
        );
        return linked ? linked.id : null;
      })
      .filter(Boolean);
  }

  saveState();
}

function deleteNote(id) {
  state.notes = state.notes.filter((n) => n.id !== id);
  if (state.activeNoteId === id) {
    state.activeNoteId = state.notes[0]?.id || null;
  }
  // Remove from linked notes
  state.notes.forEach((n) => {
    n.linkedNoteIds = n.linkedNoteIds.filter((lid) => lid !== id);
  });
  saveState();
  render();
}

function togglePin(id) {
  const note = state.notes.find((n) => n.id === id);
  if (!note) return;
  note.pinned = !note.pinned;
  saveState();
  render();
}

// ─── Folder CRUD ───────────────────────────────────────────

function createFolder(name) {
  state.folderCounter++;
  const folder = {
    id: state.folderCounter,
    name,
    color: getRandomColor(),
    createdAt: new Date().toISOString(),
  };
  state.folders.push(folder);
  saveState();
  render();
  return folder;
}

function deleteFolder(id) {
  // Move notes to unfiled
  state.notes.forEach((n) => {
    if (n.folderId === id) n.folderId = null;
  });
  state.folders = state.folders.filter((f) => f.id !== id);
  if (state.activeFolderId === id) state.activeFolderId = null;
  saveState();
  render();
}

function getRandomColor() {
  const colors = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ─── Filtering & Sorting ──────────────────────────────────

function getFilteredNotes() {
  let notes = [...state.notes];

  // Filter by folder
  if (state.activeFolderId !== null) {
    notes = notes.filter((n) => n.folderId === state.activeFolderId);
  }

  // Search
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    notes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  // Sort — pinned always first
  notes.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    if (state.sortBy === "title") return a.title.localeCompare(b.title);
    if (state.sortBy === "created")
      return new Date(b.createdAt) - new Date(a.createdAt);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return notes;
}

// ─── Rendering ─────────────────────────────────────────────

function render() {
  renderSidebar();
  renderNoteList();
  renderEditor();
}

function renderSidebar() {
  const sidebar = document.getElementById("vault-sidebar");
  if (!sidebar) return;

  const foldersHtml = state.folders
    .map(
      (f) => `
    <div class="vault-folder-item ${state.activeFolderId === f.id ? "active" : ""}" data-vault-folder="${f.id}">
      <span class="vault-folder-dot" style="background:${f.color}"></span>
      <span class="vault-folder-name">${escapeHtml(f.name)}</span>
      <span class="vault-folder-count">${state.notes.filter((n) => n.folderId === f.id).length}</span>
      <button class="vault-folder-delete" data-delete-folder="${f.id}" aria-label="Delete folder" title="Delete folder">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `,
    )
    .join("");

  sidebar.innerHTML = `
    <div class="vault-folder-item ${state.activeFolderId === null ? "active" : ""}" data-vault-folder="all">
      <i class="fas fa-layer-group"></i>
      <span class="vault-folder-name">All Notes</span>
      <span class="vault-folder-count">${state.notes.length}</span>
    </div>
    ${foldersHtml}
    <div class="vault-add-folder">
      <input type="text" class="vault-folder-input" id="vault-new-folder" placeholder="New folder..." maxlength="30" />
      <button class="vault-folder-add-btn" id="vault-add-folder-btn" aria-label="Add folder">
        <i class="fas fa-plus"></i>
      </button>
    </div>
  `;

  // Folder click handlers
  sidebar.querySelectorAll("[data-vault-folder]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-delete-folder]")) return;
      const val = el.dataset.vaultFolder;
      state.activeFolderId = val === "all" ? null : parseInt(val);
      state.activeNoteId = null;
      saveState();
      render();
    });
  });

  sidebar.querySelectorAll("[data-delete-folder]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deleteFolder(parseInt(btn.dataset.deleteFolder));
    });
  });

  const addBtn = document.getElementById("vault-add-folder-btn");
  const input = document.getElementById("vault-new-folder");
  if (addBtn && input) {
    addBtn.onclick = () => {
      const name = input.value.trim();
      if (name) {
        createFolder(name);
        input.value = "";
      }
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") addBtn.click();
    };
  }
}

function renderNoteList() {
  const container = document.getElementById("vault-note-list");
  if (!container) return;

  const notes = getFilteredNotes();

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="vault-empty">
        <i class="fas fa-book-open"></i>
        <p>${state.searchQuery ? "No notes match your search" : "No notes yet. Create one!"}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notes
    .map(
      (n) => `
    <div class="vault-note-card ${state.activeNoteId === n.id ? "active" : ""} ${n.pinned ? "pinned" : ""}" data-vault-note="${n.id}">
      <div class="vault-note-card-header">
        <span class="vault-note-title">${escapeHtml(n.title || "Untitled")}</span>
        ${n.pinned ? '<i class="fas fa-thumbtack vault-pin-badge"></i>' : ""}
      </div>
      <div class="vault-note-preview">${escapeHtml(getPreview(n.content))}</div>
      <div class="vault-note-meta">
        <span class="vault-note-date">${timeAgo(n.updatedAt)}</span>
        ${n.tags.length ? `<span class="vault-note-tags">${n.tags.map((t) => `<span class="vault-tag">#${escapeHtml(t)}</span>`).join("")}</span>` : ""}
        ${n.linkedNoteIds.length ? `<span class="vault-note-links"><i class="fas fa-link"></i> ${n.linkedNoteIds.length}</span>` : ""}
      </div>
    </div>
  `,
    )
    .join("");

  container.querySelectorAll("[data-vault-note]").forEach((el) => {
    el.addEventListener("click", () => {
      state.activeNoteId = parseInt(el.dataset.vaultNote);
      saveState();
      render();
    });
  });
}

function renderEditor() {
  const editor = document.getElementById("vault-editor");
  if (!editor) return;

  const note = state.notes.find((n) => n.id === state.activeNoteId);

  if (!note) {
    editor.innerHTML = `
      <div class="vault-editor-empty">
        <i class="fas fa-feather-alt"></i>
        <p>Select a note or create a new one</p>
      </div>
    `;
    return;
  }

  // Render backlinks
  const backlinks = state.notes.filter((n) =>
    n.linkedNoteIds.includes(note.id),
  );
  const backlinkHtml = backlinks.length
    ? `<div class="vault-backlinks">
        <h4><i class="fas fa-arrow-left"></i> Backlinks (${backlinks.length})</h4>
        ${backlinks.map((b) => `<a class="vault-backlink" data-goto-note="${b.id}">${escapeHtml(b.title)}</a>`).join("")}
      </div>`
    : "";

  // Linked notes (forward)
  const linkedNotes = note.linkedNoteIds
    .map((id) => state.notes.find((n) => n.id === id))
    .filter(Boolean);
  const linkedHtml = linkedNotes.length
    ? `<div class="vault-linked">
        <h4><i class="fas fa-arrow-right"></i> Links to (${linkedNotes.length})</h4>
        ${linkedNotes.map((l) => `<a class="vault-backlink" data-goto-note="${l.id}">${escapeHtml(l.title)}</a>`).join("")}
      </div>`
    : "";

  editor.innerHTML = `
    <div class="vault-editor-toolbar">
      <input type="text" class="vault-title-input" id="vault-title-input" value="${escapeHtml(note.title)}" placeholder="Note title..." />
      <div class="vault-editor-actions">
        <button class="vault-action-btn" id="vault-pin-btn" title="${note.pinned ? "Unpin" : "Pin"} note">
          <i class="fas fa-thumbtack ${note.pinned ? "pinned" : ""}"></i>
        </button>
        <select class="vault-folder-select" id="vault-note-folder">
          <option value="">No folder</option>
          ${state.folders.map((f) => `<option value="${f.id}" ${note.folderId === f.id ? "selected" : ""}>${escapeHtml(f.name)}</option>`).join("")}
        </select>
        <button class="vault-action-btn danger" id="vault-delete-btn" title="Delete note">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="vault-tag-bar">
      <div class="vault-tags-list" id="vault-tags-list">
        ${note.tags.map((t, i) => `<span class="vault-tag editable">#${escapeHtml(t)} <button class="vault-tag-remove" data-remove-tag="${i}"><i class="fas fa-times"></i></button></span>`).join("")}
      </div>
      <input type="text" class="vault-tag-input" id="vault-tag-input" placeholder="Add tag..." maxlength="20" />
    </div>
    <textarea class="vault-content-editor" id="vault-content-editor" placeholder="Start writing...&#10;&#10;Tip: Use [[Note Title]] to link to other notes.&#10;Use #tags in the tag bar above.">${escapeHtml(note.content)}</textarea>
    <div class="vault-note-links-section">
      ${linkedHtml}
      ${backlinkHtml}
    </div>
    <div class="vault-editor-footer">
      <span class="vault-char-count">${note.content.length} characters</span>
      <span class="vault-word-count">${note.content.trim() ? note.content.trim().split(/\s+/).length : 0} words</span>
      <span class="vault-updated">Updated ${timeAgo(note.updatedAt)}</span>
    </div>
  `;

  // Wire editor events
  const titleInput = document.getElementById("vault-title-input");
  const contentEditor = document.getElementById("vault-content-editor");
  const pinBtn = document.getElementById("vault-pin-btn");
  const deleteBtn = document.getElementById("vault-delete-btn");
  const folderSelect = document.getElementById("vault-note-folder");
  const tagInput = document.getElementById("vault-tag-input");

  let saveTimeout;
  const debouncedSave = (updates) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      updateNote(note.id, updates);
      renderNoteList(); // Update list preview without full re-render
      updateFooter();
    }, 300);
  };

  titleInput?.addEventListener("input", () => {
    debouncedSave({ title: titleInput.value });
  });

  contentEditor?.addEventListener("input", () => {
    debouncedSave({ content: contentEditor.value });
  });

  // Tab key inserts spaces in textarea
  contentEditor?.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = contentEditor.selectionStart;
      const end = contentEditor.selectionEnd;
      contentEditor.value =
        contentEditor.value.substring(0, start) +
        "  " +
        contentEditor.value.substring(end);
      contentEditor.selectionStart = contentEditor.selectionEnd = start + 2;
      debouncedSave({ content: contentEditor.value });
    }
  });

  pinBtn?.addEventListener("click", () => togglePin(note.id));

  deleteBtn?.addEventListener("click", () => {
    if (confirm(`Delete "${note.title}"?`)) {
      deleteNote(note.id);
      showSuccess("Note deleted");
    }
  });

  folderSelect?.addEventListener("change", () => {
    const val = folderSelect.value;
    updateNote(note.id, { folderId: val ? parseInt(val) : null });
    render();
  });

  tagInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && tagInput.value.trim()) {
      const tag = tagInput.value.trim().replace(/^#/, "");
      if (tag && !note.tags.includes(tag)) {
        note.tags.push(tag);
        updateNote(note.id, { tags: note.tags });
        render();
      }
      tagInput.value = "";
    }
  });

  editor.querySelectorAll("[data-remove-tag]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.removeTag);
      note.tags.splice(idx, 1);
      updateNote(note.id, { tags: note.tags });
      render();
    });
  });

  editor.querySelectorAll("[data-goto-note]").forEach((link) => {
    link.addEventListener("click", () => {
      state.activeNoteId = parseInt(link.dataset.gotoNote);
      saveState();
      render();
    });
  });

  function updateFooter() {
    const charCount = editor.querySelector(".vault-char-count");
    const wordCount = editor.querySelector(".vault-word-count");
    if (charCount)
      charCount.textContent = `${contentEditor.value.length} characters`;
    if (wordCount) {
      const wc = contentEditor.value.trim()
        ? contentEditor.value.trim().split(/\s+/).length
        : 0;
      wordCount.textContent = `${wc} words`;
    }
  }
}

function focusEditor() {
  setTimeout(() => {
    const input = document.getElementById("vault-title-input");
    if (input) input.focus();
  }, 50);
}

// ─── Helpers ───────────────────────────────────────────────

function getPreview(content) {
  if (!content) return "Empty note";
  const firstLine = content.split("\n").find((l) => l.trim()) || "";
  return firstLine.substring(0, 80) + (firstLine.length > 80 ? "..." : "");
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ─── Toolbar Handlers ──────────────────────────────────────

function setupToolbar() {
  const newBtn = document.getElementById("vault-new-note");
  const searchInput = document.getElementById("vault-search");
  const sortSelect = document.getElementById("vault-sort");
  const viewToggle = document.getElementById("vault-view-toggle");

  newBtn?.addEventListener("click", () => {
    createNote("Untitled", state.activeFolderId);
    showSuccess("New note created");
  });

  searchInput?.addEventListener("input", () => {
    state.searchQuery = searchInput.value;
    renderNoteList();
  });

  sortSelect?.addEventListener("change", () => {
    state.sortBy = sortSelect.value;
    saveState();
    renderNoteList();
  });

  viewToggle?.addEventListener("click", () => {
    state.viewMode = state.viewMode === "grid" ? "list" : "grid";
    const noteList = document.getElementById("vault-note-list");
    if (noteList) {
      noteList.classList.toggle("vault-list-view", state.viewMode === "list");
    }
    viewToggle.innerHTML =
      state.viewMode === "grid"
        ? '<i class="fas fa-th"></i>'
        : '<i class="fas fa-list"></i>';
    saveState();
  });
}

// ─── Data Export for Vault ─────────────────────────────────

export function exportVaultData() {
  return {
    notes: state.notes,
    folders: state.folders,
  };
}

export function importVaultData(data) {
  if (data.notes) state.notes = data.notes;
  if (data.folders) state.folders = data.folders;
  state.noteCounter = Math.max(0, ...state.notes.map((n) => n.id));
  state.folderCounter = Math.max(0, ...state.folders.map((f) => f.id));
  saveState();
  render();
}

// ─── Init ──────────────────────────────────────────────────

export function initVault() {
  loadState();
  setupToolbar();
  render();
}
