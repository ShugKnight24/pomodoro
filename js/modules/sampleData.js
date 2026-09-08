/**
 * sampleData.js — Experience Seed Data & Tutorial Clearing Manager
 * Populates starter tutorial data across all experiences and allows clearing them. Zero emojis.
 */

"use strict";

import { showSuccess } from "./toast.js";

const VAULT_KEY = "pomidor.vault";
const KANBAN_KEY = "pomidor.kanban";
const TODO_LISTS_KEY = "pomodoro-todo-lists";
const HABITS_KEY = "pomidor.habits";

export function initSampleData() {
  initVaultSample();
  initHabitsSample();
}

function initVaultSample() {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) {
      const initialVault = {
        notes: [
          {
            id: 1,
            title: "Getting Started with Notes Vault",
            content: "# Welcome to Your Personal Vault\n\nThis is your private, offline markdown knowledge repository. Everything you write stays strictly in your browser.\n\n### Key Features:\n- **Markdown Support**: Headers, bold, italics, checklists, and code blocks.\n- **Wikilinks**: Connect ideas by typing double brackets, like [[Focus Strategies]].\n- **Tags**: Organize topics with tags like #productivity or #research.\n\n*Feel free to edit this note or clear tutorial data anytime from Settings!*",
            folderId: null,
            tags: ["guide", "welcome"],
            pinned: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            linkedNoteIds: [],
          },
          {
            id: 2,
            title: "Focus Strategies",
            content: "# Focus Strategies\n\nLinked from [[Getting Started with Notes Vault]].\n\n1. **Pomodoro 25/5**: 25 minutes of unbroken focus followed by 5 minutes of rest.\n2. **Batching**: Group similar administrative or coding tasks together.\n3. **Daily Assessment**: Check your bandwidth in the Mood tab every morning.",
            folderId: null,
            tags: ["productivity"],
            pinned: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            linkedNoteIds: [1],
          }
        ],
        folders: [
          { id: 1, name: "Guides", color: "#10b981", createdAt: new Date().toISOString() }
        ],
        activeNoteId: 1,
        activeFolderId: null,
        searchQuery: "",
        sortBy: "updated",
        viewMode: "grid",
        noteCounter: 2,
        folderCounter: 1,
      };
      localStorage.setItem(VAULT_KEY, JSON.stringify(initialVault));
    }
  } catch (e) {
    console.warn("Could not init vault sample:", e);
  }
}

function initHabitsSample() {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) {
      const defaultHabits = [
        {
          id: "habit-plan",
          title: "Morning planning & daily focus goal",
          targetDays: 7,
          streak: 3,
          history: {},
          createdAt: new Date().toISOString(),
        },
        {
          id: "habit-pomodoro",
          title: "Complete at least 4 Pomodoro sessions",
          targetDays: 5,
          streak: 5,
          history: {},
          createdAt: new Date().toISOString(),
        },
        {
          id: "habit-walk",
          title: "Step away and stretch during breaks",
          targetDays: 7,
          streak: 2,
          history: {},
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(HABITS_KEY, JSON.stringify(defaultHabits));
    }
  } catch (e) {
    console.warn("Could not init habits sample:", e);
  }
}

export function clearExperienceData(experience) {
  try {
    if (experience === "todo" || experience === "list") {
      const lists = JSON.parse(localStorage.getItem(TODO_LISTS_KEY) || "[]");
      const cleaned = lists.filter(l => l.name !== "Getting Started");
      localStorage.setItem(TODO_LISTS_KEY, JSON.stringify(cleaned));
      localStorage.setItem("pomodoro.tutorialListDone", "done");
      window.dispatchEvent(new CustomEvent("todo-data-cleared"));
      showSuccess("To-Do sample data cleared!");
    } else if (experience === "kanban") {
      localStorage.removeItem(KANBAN_KEY);
      localStorage.setItem("pomidor.kanban.tutorialDone", "done");
      window.dispatchEvent(new CustomEvent("kanban-data-cleared"));
      showSuccess("Kanban tutorial board cleared!");
    } else if (experience === "vault") {
      const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || "{}");
      if (vault.notes) {
        vault.notes = vault.notes.filter(n => !n.title.toLowerCase().includes("getting started") && !n.title.toLowerCase().includes("focus strategies"));
        vault.activeNoteId = vault.notes.length > 0 ? vault.notes[0].id : null;
        localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
        window.dispatchEvent(new CustomEvent("vault-data-cleared"));
      }
      showSuccess("Vault tutorial notes cleared!");
    } else if (experience === "all") {
      clearExperienceData("todo");
      clearExperienceData("kanban");
      clearExperienceData("vault");
      showSuccess("All tutorial sample data cleared! Fresh slate ready.");
    }
  } catch (e) {
    console.warn("Error clearing experience data:", e);
  }
}
