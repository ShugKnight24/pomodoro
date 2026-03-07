/**
 * Test helpers — seed localStorage profiles for Playwright tests.
 *
 * Usage in a test:
 *   await seedProfile(page, 'power-user');
 *   await page.goto('/');
 */

// ── Helpers ─────────────────────────────────────────────────────────────

function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function isoTimestamp(daysAgo, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// TODO: possibly remove reliance on randomness in tests in favor of a happy path or a more deterministic generator, but for now this is good enough to create varied seed data without manually crafting it all. Just need to ensure the "committed" profile has enough activity to show stats and streaks in the UI and other basics. Can always add more specific profiles later if needed.
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Generators ──────────────────────────────────────────────────────────

function generateDailyData(days, { minP = 0, maxP = 12, skip = 0.1 }) {
  const data = {};
  for (let i = days; i >= 0; i--) {
    if (Math.random() < skip) continue;
    const p = rand(minP, maxP);
    if (p === 0) continue;
    data[isoDate(i)] = {
      pomodoros: p,
      tasks: Math.max(0, Math.floor(p * 0.4 + Math.random() * 2)),
      focusMinutes: p * 25,
    };
  }
  return data;
}

function generateSessions(dailyData) {
  const sessions = [];
  for (const [dateStr, entry] of Object.entries(dailyData)) {
    for (let p = 0; p < entry.pomodoros; p++) {
      sessions.push({
        timestamp: `${dateStr}T${String(rand(6, 22)).padStart(2, "0")}:${String(rand(0, 59)).padStart(2, "0")}:00.000Z`,
        duration: 25,
        type: "pomodoro",
      });
    }
  }
  return sessions.slice(-100);
}

function generateStats(days, opts) {
  const dailyData = generateDailyData(days, opts);
  const sessions = generateSessions(dailyData);
  let totalP = 0,
    totalT = 0,
    totalF = 0;
  for (const e of Object.values(dailyData)) {
    totalP += e.pomodoros;
    totalT += e.tasks;
    totalF += e.focusMinutes;
  }
  const dates = Object.keys(dailyData).sort();

  let longest = 0,
    cur = 0;
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      cur = 1;
    } else {
      const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    }
    longest = Math.max(longest, cur);
  }

  let streak = 0;
  const d = new Date();
  const todayStr = d.toISOString().split("T")[0];
  if (!dailyData[todayStr]) d.setDate(d.getDate() - 1);
  while (true) {
    const ds = d.toISOString().split("T")[0];
    if (dailyData[ds] && dailyData[ds].pomodoros > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }

  return {
    totalPomodoros: totalP,
    totalTasksCompleted: totalT,
    totalFocusMinutes: totalF,
    currentStreak: streak,
    longestStreak: longest,
    lastActiveDate: dates[dates.length - 1] || null,
    dailyGoal: 8,
    dailyData,
    sessions,
  };
}

let _tc = 0;
function task(name, opts = {}) {
  _tc++;
  return {
    id: _tc,
    completed: opts.completed ?? false,
    completedAt: opts.completed
      ? isoTimestamp(opts.doneDaysAgo ?? 0, 17)
      : null,
    createdAt: isoTimestamp(opts.createdDaysAgo ?? 7),
    dueDate: opts.dueDate ?? null,
    estimatedPomodoros: opts.est ?? 0,
    name,
    pomodoros: opts.poms ?? 0,
    priority: opts.priority ?? "medium",
  };
}

// ── Profiles ────────────────────────────────────────────────────────────

const PROFILES = {
  fresh() {
    return {
      "pomodoro-stats": JSON.stringify({
        totalPomodoros: 0,
        totalTasksCompleted: 0,
        totalFocusMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        dailyGoal: 8,
        dailyData: {},
        sessions: [],
      }),
      "pomodoro.lists": JSON.stringify([]),
      "pomodoro.archive": JSON.stringify({
        id: -1,
        name: "Archive",
        tasks: [],
        isArchive: true,
      }),
      "pomodoro.listCounter": "0",
      "pomodoro.taskCounter": "0",
      "pomodoro-achievements": JSON.stringify([]),
      "pomidor.vault": JSON.stringify({
        notes: [],
        folders: [],
        activeNoteId: null,
        activeFolderId: null,
        searchQuery: "",
        sortBy: "updated",
        viewMode: "grid",
        noteCounter: 0,
        folderCounter: 0,
      }),
      "pomidor.kanban": JSON.stringify({
        boards: [],
        activeBoardId: null,
        cardCounter: 0,
        columnCounter: 0,
        boardCounter: 0,
        dragState: null,
      }),
      "pomodoro-theme": "dark",
      "pomidor-lang": "en",
      timerVisual: "ring",
      appTheme: "modern",
      timerStyle: "classic",
      customSessionTime: "25",
      customBreakTime: "5",
      buzzerVolume: "80",
      "keyboard-shortcuts-seen": "true",
    };
  },

  committed() {
    _tc = 0;
    const stats = generateStats(60, { minP: 3, maxP: 10, skip: 0.1 });
    const lists = [
      {
        id: 1,
        name: "Web Dev Project",
        tasks: [
          task("Implement user auth", {
            priority: "high",
            est: 8,
            poms: 5,
            createdDaysAgo: 20,
            dueDate: isoDate(-3),
          }),
          task("Design dashboard layout", {
            priority: "high",
            est: 6,
            poms: 6,
            completed: true,
            doneDaysAgo: 5,
            createdDaysAgo: 15,
          }),
          task("Write API docs", {
            priority: "medium",
            est: 4,
            poms: 1,
            createdDaysAgo: 10,
          }),
          task("Set up CI/CD pipeline", {
            priority: "medium",
            est: 3,
            createdDaysAgo: 7,
          }),
          task("Add unit tests for auth", {
            priority: "high",
            est: 5,
            createdDaysAgo: 3,
            dueDate: isoDate(-1),
          }),
        ],
      },
      {
        id: 2,
        name: "Learning",
        tasks: [
          task("Complete DSA graphs chapter", {
            priority: "high",
            est: 4,
            poms: 2,
            createdDaysAgo: 30,
          }),
          task("LeetCode medium x5", {
            priority: "medium",
            est: 10,
            poms: 4,
            createdDaysAgo: 14,
          }),
          task("Read Clean Code ch 7-9", {
            completed: true,
            doneDaysAgo: 8,
            priority: "medium",
            est: 3,
            createdDaysAgo: 25,
          }),
        ],
      },
      {
        id: 3,
        name: "Life Admin",
        tasks: [
          task("Schedule dentist", {
            completed: true,
            doneDaysAgo: 12,
            priority: "high",
            createdDaysAgo: 20,
          }),
          task("File tax documents", {
            priority: "high",
            est: 3,
            dueDate: isoDate(-30),
            createdDaysAgo: 45,
          }),
        ],
      },
    ];
    const achievements = [
      "firstSteps",
      "gettingStarted",
      "focused",
      "weekWarrior",
      "perfectDay",
      "earlyBird",
      "listMaster",
    ];
    const vault = {
      notes: [
        {
          id: 1,
          title: "Architecture Notes",
          content:
            "# Architecture\n\n## Stack\n- Vanilla JS\n- localStorage\n- PWA\n\nSee [[Tech Comparison]]",
          folderId: 1,
          tags: ["arch"],
          pinned: true,
          createdAt: isoTimestamp(60),
          updatedAt: isoTimestamp(2),
          linkedNoteIds: [2],
        },
        {
          id: 2,
          title: "Tech Comparison",
          content:
            "# Options\n\n| Option | Pros | Cons |\n|--|--|--|\n| Vanilla | Zero bundle | More code |\n| Preact | 3kb | Build step |",
          folderId: 1,
          tags: ["arch"],
          pinned: false,
          createdAt: isoTimestamp(55),
          updatedAt: isoTimestamp(30),
          linkedNoteIds: [1],
        },
        {
          id: 3,
          title: "Weekly Review Template",
          content:
            "# Weekly Review\n\n## Went well\n- \n\n## Didn't go well\n- \n\n## Next week\n1. \n2. \n3. ",
          folderId: null,
          tags: ["template"],
          pinned: true,
          createdAt: isoTimestamp(45),
          updatedAt: isoTimestamp(7),
          linkedNoteIds: [],
        },
      ],
      folders: [
        {
          id: 1,
          name: "Projects",
          color: "#3b82f6",
          createdAt: isoTimestamp(60),
        },
      ],
      activeNoteId: null,
      activeFolderId: null,
      searchQuery: "",
      sortBy: "updated",
      viewMode: "grid",
      noteCounter: 3,
      folderCounter: 1,
    };
    const kanban = {
      boards: [
        {
          id: "board-1",
          title: "Sprint Board",
          columns: [
            {
              id: "col-1",
              title: "Backlog",
              color: "#64748b",
              cards: [
                {
                  id: "card-1",
                  title: "Wishlist feature",
                  description: "",
                  labels: ["feature"],
                  priority: "low",
                },
                {
                  id: "card-2",
                  title: "Email redesign",
                  description: "",
                  labels: ["design"],
                  priority: "medium",
                },
              ],
            },
            {
              id: "col-2",
              title: "In Progress",
              color: "#3b82f6",
              cards: [
                {
                  id: "card-3",
                  title: "Stripe checkout",
                  description: "Payment flow",
                  labels: ["critical"],
                  priority: "high",
                },
              ],
            },
            {
              id: "col-3",
              title: "Done",
              color: "#10b981",
              cards: [
                {
                  id: "card-4",
                  title: "Product listing page",
                  description: "",
                  labels: ["feature"],
                  priority: "high",
                },
              ],
            },
          ],
        },
      ],
      activeBoardId: "board-1",
      cardCounter: 4,
      columnCounter: 3,
      boardCounter: 1,
      dragState: null,
    };

    return {
      "pomodoro-stats": JSON.stringify(stats),
      "pomodoro.lists": JSON.stringify(lists),
      "pomodoro.archive": JSON.stringify({
        id: -1,
        name: "Archive",
        tasks: [
          task("Tutorial walkthrough", {
            completed: true,
            doneDaysAgo: 55,
            createdDaysAgo: 60,
          }),
          task("Initial wireframes", {
            completed: true,
            doneDaysAgo: 40,
            createdDaysAgo: 50,
          }),
        ],
        isArchive: true,
      }),
      "pomodoro.listCounter": "3",
      "pomodoro.taskCounter": String(_tc),
      "pomodoro.selectedListId": "1",
      "pomodoro.tutorialListDone": "done",
      "pomodoro-achievements": JSON.stringify(achievements),
      "pomidor.vault": JSON.stringify(vault),
      "pomidor.kanban": JSON.stringify(kanban),
      "pomidor.kanban.tutorialDone": "shown",
      "pomodoro-theme": "dark",
      "pomidor-lang": "en",
      timerVisual: "ring",
      appTheme: "modern",
      timerStyle: "classic",
      customSessionTime: "25",
      customBreakTime: "5",
      buzzerVolume: "80",
      "keyboard-shortcuts-seen": "true",
    };
  },
};

/**
 * Seed a Playwright page with a localStorage profile before navigation.
 * Must be called BEFORE page.goto('/').
 */
export async function seedProfile(page, profile = "committed") {
  const gen = PROFILES[profile];
  if (!gen) throw new Error(`Unknown profile: ${profile}`);
  const data = gen();

  // Navigate to the origin first to set localStorage on the right domain
  await page.goto("/", { waitUntil: "commit" });
  for (const [key, value] of Object.entries(data)) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
  }
  // Reload so the app picks up the seeded data
  await page.reload({ waitUntil: "domcontentloaded" });
}

/**
 * Clear all Pomidor localStorage keys.
 */
export async function clearData(page) {
  await page.evaluate(() => {
    const keys = [
      "pomodoro-stats",
      "pomodoro.lists",
      "pomodoro.archive",
      "pomodoro.listCounter",
      "pomodoro.taskCounter",
      "pomodoro.selectedListId",
      "pomodoro.tutorialListDone",
      "pomodoro-achievements",
      "pomidor.vault",
      "pomidor.kanban",
      "pomidor.kanban.tutorialDone",
      "pomodoro-theme",
      "pomidor-lang",
      "timerVisual",
      "appTheme",
      "timerStyle",
      "animationStyle",
      "customSessionTime",
      "customBreakTime",
      "buzzerVolume",
      "notifications",
      "pomodoroSectionStates",
      "keyboard-shortcuts-seen",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
  });
}
