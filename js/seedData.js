/**
 * Pomidor Seed Data Loader
 *
 * Loads realistic "used" data into localStorage for testing scenarios
 * you wouldn't naturally encounter for weeks or months.
 *
 * Usage:
 *   1. Open index.html in a browser
 *   2. Open DevTools console
 *   3. Paste this file or run: import('./js/seedData.js')
 *   4. Call one of the preset profiles or build a custom one
 *
 * Presets:
 *   loadSeedData('fresh')        — Brand new user, empty state
 *   loadSeedData('casual')       — 2 weeks in, light usage
 *   loadSeedData('committed')    — 2 months in, daily user with streaks
 *   loadSeedData('power-user')   — 6 months in, heavy usage, all features used
 *   loadSeedData('streak-risk')  — Active streak about to break (test streak logic)
 *   loadSeedData('corrupt')      — Partially corrupt data (test resilience)
 *   loadSeedData('clean')        — Wipe ALL Pomidor data from localStorage
 */

// ── Helpers ─────────────────────────────────────────────────────────────

function isoDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

function isoTimestamp(daysAgo, hour = 10, min = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Data Generators ─────────────────────────────────────────────────────

function generateDailyData(
  totalDays,
  { minPomodoros = 0, maxPomodoros = 12, skipChance = 0.1 },
) {
  const dailyData = {};
  for (let i = totalDays; i >= 0; i--) {
    if (Math.random() < skipChance) continue; // simulate missed days
    const pomodoros = randomBetween(minPomodoros, maxPomodoros);
    if (pomodoros === 0) continue;
    const tasks = Math.max(0, Math.floor(pomodoros * 0.4 + Math.random() * 2));
    dailyData[isoDate(i)] = {
      pomodoros,
      tasks,
      focusMinutes: pomodoros * 25,
    };
  }
  return dailyData;
}

function generateSessions(dailyData, maxKept = 100) {
  const sessions = [];
  const dates = Object.keys(dailyData).sort();
  for (const dateStr of dates) {
    const entry = dailyData[dateStr];
    for (let p = 0; p < entry.pomodoros; p++) {
      const hour = randomBetween(6, 22);
      const minute = randomBetween(0, 59);
      sessions.push({
        timestamp: `${dateStr}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`,
        duration: 25,
        type: "pomodoro",
      });
    }
  }
  // Keep last N sessions like the app does
  return sessions.slice(-maxKept);
}

function calculateStreak(dailyData) {
  let streak = 0;
  let d = new Date();
  // Check today first
  const todayStr = d.toISOString().split("T")[0];
  if (!dailyData[todayStr]) {
    // If no data today, check if yesterday had data (streak not yet broken)
    d.setDate(d.getDate() - 1);
  }
  while (true) {
    const dateStr = d.toISOString().split("T")[0];
    if (dailyData[dateStr] && dailyData[dateStr].pomodoros > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function generateStats(dailyData) {
  const sessions = generateSessions(dailyData);
  let totalPomodoros = 0;
  let totalTasks = 0;
  let totalFocusMinutes = 0;

  for (const entry of Object.values(dailyData)) {
    totalPomodoros += entry.pomodoros;
    totalTasks += entry.tasks;
    totalFocusMinutes += entry.focusMinutes;
  }

  const dates = Object.keys(dailyData).sort();
  const lastDate = dates.length > 0 ? dates[dates.length - 1] : null;

  // Calculate longest streak
  let longest = 0;
  let current = 0;
  const allDates = Object.keys(dailyData).sort();
  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      current = 1;
    } else {
      const prev = new Date(allDates[i - 1]);
      const curr = new Date(allDates[i]);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      current = diffDays === 1 ? current + 1 : 1;
    }
    longest = Math.max(longest, current);
  }

  return {
    totalPomodoros,
    totalTasksCompleted: totalTasks,
    totalFocusMinutes,
    currentStreak: calculateStreak(dailyData),
    longestStreak: longest,
    lastActiveDate: lastDate,
    dailyGoal: 8,
    dailyData,
    sessions,
  };
}

let _taskCounter = 0;

function makeTask(name, opts = {}) {
  _taskCounter++;
  return {
    id: _taskCounter,
    completed: opts.completed ?? false,
    completedAt: opts.completed
      ? isoTimestamp(opts.completedDaysAgo ?? 0, 17)
      : null,
    createdAt: isoTimestamp(opts.createdDaysAgo ?? 7),
    dueDate: opts.dueDate ?? null,
    estimatedPomodoros: opts.estimate ?? 0,
    name,
    pomodoros: opts.pomodoros ?? 0,
    priority: opts.priority ?? "medium",
  };
}

function generateTodoLists(profile) {
  _taskCounter = 0;

  if (profile === "casual") {
    return {
      lists: [
        {
          id: 1,
          name: "Work",
          tasks: [
            makeTask("Finish quarterly report", {
              priority: "high",
              estimate: 4,
              pomodoros: 2,
              createdDaysAgo: 10,
              dueDate: isoDate(-2),
            }),
            makeTask("Reply to client emails", {
              completed: true,
              completedDaysAgo: 3,
              priority: "medium",
              createdDaysAgo: 5,
            }),
            makeTask("Update project timeline", {
              priority: "low",
              estimate: 2,
              createdDaysAgo: 3,
            }),
          ],
        },
        {
          id: 2,
          name: "Personal",
          tasks: [
            makeTask("Read 30 pages of current book", {
              priority: "low",
              estimate: 2,
              createdDaysAgo: 14,
            }),
            makeTask("Grocery shopping list", {
              completed: true,
              completedDaysAgo: 1,
              createdDaysAgo: 2,
            }),
          ],
        },
      ],
      archive: {
        id: -1,
        name: "Archive",
        tasks: [
          makeTask("Set up Pomidor app", {
            completed: true,
            completedDaysAgo: 14,
            createdDaysAgo: 14,
          }),
        ],
        isArchive: true,
      },
      listCounter: 2,
      taskCounter: _taskCounter,
      selectedListId: 1,
    };
  }

  if (profile === "committed") {
    return {
      lists: [
        {
          id: 1,
          name: "Web Dev Project",
          tasks: [
            makeTask("Implement user authentication", {
              priority: "high",
              estimate: 8,
              pomodoros: 5,
              createdDaysAgo: 20,
              dueDate: isoDate(-3),
            }),
            makeTask("Design dashboard layout", {
              priority: "high",
              estimate: 6,
              pomodoros: 6,
              completed: true,
              completedDaysAgo: 5,
              createdDaysAgo: 15,
            }),
            makeTask("Write API documentation", {
              priority: "medium",
              estimate: 4,
              pomodoros: 1,
              createdDaysAgo: 10,
            }),
            makeTask("Set up CI/CD pipeline", {
              priority: "medium",
              estimate: 3,
              createdDaysAgo: 7,
            }),
            makeTask("Add unit tests for auth module", {
              priority: "high",
              estimate: 5,
              createdDaysAgo: 3,
              dueDate: isoDate(-1),
            }),
            makeTask("Fix mobile responsive issues", {
              priority: "low",
              estimate: 2,
              createdDaysAgo: 5,
            }),
            makeTask("Optimize database queries", {
              priority: "medium",
              estimate: 4,
              createdDaysAgo: 2,
            }),
          ],
        },
        {
          id: 2,
          name: "Learning",
          tasks: [
            makeTask("Complete DSA chapter on graphs", {
              priority: "high",
              estimate: 4,
              pomodoros: 2,
              createdDaysAgo: 30,
            }),
            makeTask("Practice LeetCode medium problems (5)", {
              priority: "medium",
              estimate: 10,
              pomodoros: 4,
              createdDaysAgo: 14,
            }),
            makeTask("Watch system design video series", {
              priority: "low",
              estimate: 6,
              createdDaysAgo: 20,
            }),
            makeTask("Read Clean Code ch. 7-9", {
              completed: true,
              completedDaysAgo: 8,
              priority: "medium",
              estimate: 3,
              createdDaysAgo: 25,
            }),
          ],
        },
        {
          id: 3,
          name: "Life Admin",
          tasks: [
            makeTask("Schedule dentist appointment", {
              completed: true,
              completedDaysAgo: 12,
              priority: "high",
              createdDaysAgo: 20,
            }),
            makeTask("Renew gym membership", {
              priority: "medium",
              dueDate: isoDate(-5),
              createdDaysAgo: 15,
            }),
            makeTask("File tax documents", {
              priority: "high",
              estimate: 3,
              dueDate: isoDate(-30),
              createdDaysAgo: 45,
            }),
          ],
        },
      ],
      archive: {
        id: -1,
        name: "Archive",
        tasks: [
          makeTask("Tutorial tasks walkthrough", {
            completed: true,
            completedDaysAgo: 55,
            createdDaysAgo: 60,
          }),
          makeTask("Set up project repo", {
            completed: true,
            completedDaysAgo: 50,
            createdDaysAgo: 55,
          }),
          makeTask("Initial wireframes", {
            completed: true,
            completedDaysAgo: 40,
            createdDaysAgo: 50,
          }),
          makeTask("Choose tech stack", {
            completed: true,
            completedDaysAgo: 48,
            createdDaysAgo: 55,
          }),
          makeTask("Domain name purchase", {
            completed: true,
            completedDaysAgo: 45,
            createdDaysAgo: 50,
          }),
        ],
        isArchive: true,
      },
      listCounter: 3,
      taskCounter: _taskCounter,
      selectedListId: 1,
    };
  }

  if (profile === "power-user") {
    return {
      lists: [
        {
          id: 1,
          name: "E-Commerce Build",
          tasks: [
            makeTask("Stripe integration checkout flow", {
              priority: "high",
              estimate: 8,
              pomodoros: 6,
              createdDaysAgo: 30,
              dueDate: isoDate(-5),
            }),
            makeTask("Product image optimization pipeline", {
              priority: "medium",
              estimate: 4,
              pomodoros: 4,
              completed: true,
              completedDaysAgo: 2,
              createdDaysAgo: 14,
            }),
            makeTask("Inventory sync with Shopify API", {
              priority: "high",
              estimate: 10,
              pomodoros: 3,
              createdDaysAgo: 20,
            }),
            makeTask("Cart abandonment email workflow", {
              priority: "medium",
              estimate: 6,
              createdDaysAgo: 10,
              dueDate: isoDate(-7),
            }),
            makeTask("SEO meta tags for all product pages", {
              priority: "low",
              estimate: 3,
              pomodoros: 1,
              createdDaysAgo: 25,
            }),
            makeTask("Load testing with k6", {
              priority: "medium",
              estimate: 4,
              createdDaysAgo: 5,
            }),
            makeTask("WCAG 2.1 AA accessibility audit", {
              priority: "high",
              estimate: 8,
              createdDaysAgo: 3,
            }),
          ],
        },
        {
          id: 2,
          name: "CCNA Study",
          tasks: [
            makeTask("Subnetting practice (50 problems)", {
              priority: "high",
              estimate: 6,
              pomodoros: 4,
              createdDaysAgo: 60,
              dueDate: isoDate(-10),
            }),
            makeTask("Lab: OSPF multi-area config", {
              priority: "high",
              estimate: 8,
              pomodoros: 8,
              completed: true,
              completedDaysAgo: 15,
              createdDaysAgo: 45,
            }),
            makeTask("Review: STP and EtherChannel", {
              priority: "medium",
              estimate: 4,
              pomodoros: 2,
              createdDaysAgo: 30,
            }),
            makeTask("Practice test #3", {
              priority: "high",
              estimate: 4,
              createdDaysAgo: 7,
              dueDate: isoDate(-2),
            }),
            makeTask("Flashcards: port numbers & protocols", {
              priority: "low",
              estimate: 2,
              completed: true,
              completedDaysAgo: 20,
              createdDaysAgo: 50,
            }),
            makeTask("Watch CBT Nuggets: wireless section", {
              priority: "medium",
              estimate: 6,
              createdDaysAgo: 14,
            }),
          ],
        },
        {
          id: 3,
          name: "Security Learning",
          tasks: [
            makeTask("TryHackMe: Complete Beginner path", {
              priority: "high",
              estimate: 20,
              pomodoros: 12,
              createdDaysAgo: 90,
            }),
            makeTask("Set up home lab (VirtualBox + Kali)", {
              completed: true,
              completedDaysAgo: 60,
              priority: "high",
              estimate: 4,
              createdDaysAgo: 90,
            }),
            makeTask("Read OWASP Top 10 (2021)", {
              completed: true,
              completedDaysAgo: 30,
              priority: "high",
              estimate: 3,
              createdDaysAgo: 75,
            }),
            makeTask("Nmap scripting engine deep dive", {
              priority: "medium",
              estimate: 4,
              createdDaysAgo: 20,
            }),
            makeTask("Write blog post: SQL injection basics", {
              priority: "low",
              estimate: 6,
              createdDaysAgo: 10,
            }),
          ],
        },
        {
          id: 4,
          name: "Personal",
          tasks: [
            makeTask("Meal prep Sunday", {
              priority: "medium",
              createdDaysAgo: 1,
              dueDate: isoDate(0),
            }),
            makeTask("Call mom", {
              completed: true,
              completedDaysAgo: 0,
              priority: "high",
              createdDaysAgo: 1,
            }),
            makeTask("Organize desk and cable management", {
              priority: "low",
              estimate: 2,
              createdDaysAgo: 14,
            }),
          ],
        },
        {
          id: 5,
          name: "Blog Posts",
          tasks: [
            makeTask("Draft: Strangler Fig in frontend apps", {
              priority: "medium",
              estimate: 6,
              pomodoros: 2,
              createdDaysAgo: 5,
            }),
            makeTask("Draft: What I learned from CCNA prep", {
              priority: "low",
              estimate: 4,
              createdDaysAgo: 20,
            }),
            makeTask("Published: My Pomodoro setup", {
              completed: true,
              completedDaysAgo: 40,
              priority: "medium",
              estimate: 5,
              createdDaysAgo: 60,
            }),
          ],
        },
      ],
      archive: {
        id: -1,
        name: "Archive",
        tasks: Array.from({ length: 25 }, (_, i) =>
          makeTask(`Archived task ${i + 1}`, {
            completed: true,
            completedDaysAgo: randomBetween(10, 150),
            createdDaysAgo: randomBetween(30, 180),
            priority: pick(["high", "medium", "low"]),
          }),
        ),
        isArchive: true,
      },
      listCounter: 5,
      taskCounter: _taskCounter,
      selectedListId: 1,
    };
  }

  // Default: fresh
  return {
    lists: [],
    archive: { id: -1, name: "Archive", tasks: [], isArchive: true },
    listCounter: 0,
    taskCounter: 0,
    selectedListId: null,
  };
}

function generateVault(profile) {
  const base = {
    notes: [],
    folders: [],
    activeNoteId: null,
    activeFolderId: null,
    searchQuery: "",
    sortBy: "updated",
    viewMode: "grid",
    noteCounter: 0,
    folderCounter: 0,
  };

  if (profile === "fresh" || profile === "casual") return base;

  if (profile === "committed" || profile === "power-user") {
    const folders = [
      {
        id: 1,
        name: "Projects",
        color: "#3b82f6",
        createdAt: isoTimestamp(60),
      },
      {
        id: 2,
        name: "Learning",
        color: "#10b981",
        createdAt: isoTimestamp(55),
      },
      { id: 3, name: "Ideas", color: "#f59e0b", createdAt: isoTimestamp(50) },
    ];

    const notes = [
      {
        id: 1,
        title: "Project Architecture Notes",
        content:
          "# Architecture\n\n## Current Stack\n- Frontend: Vanilla JS (ES modules)\n- Storage: localStorage\n- PWA: Service Worker + manifest\n\n## Key Decisions\n- No framework — keep bundle zero\n- Module pattern with init functions\n- CSS variables for theming\n\nSee also: [[Tech Stack Comparison]]",
        folderId: 1,
        tags: ["architecture", "decisions"],
        pinned: true,
        createdAt: isoTimestamp(60),
        updatedAt: isoTimestamp(2),
        linkedNoteIds: [4],
      },
      {
        id: 2,
        title: "Weekly Review Template",
        content:
          "# Weekly Review\n\n## What went well?\n- \n\n## What didn't go well?\n- \n\n## What will I do differently?\n- \n\n## Top 3 priorities next week\n1. \n2. \n3. ",
        folderId: null,
        tags: ["template", "review"],
        pinned: true,
        createdAt: isoTimestamp(45),
        updatedAt: isoTimestamp(7),
        linkedNoteIds: [],
      },
      {
        id: 3,
        title: "Meeting Notes — Sprint Planning",
        content:
          "# Sprint Planning 2026-02-20\n\n## Goals\n- Ship auth module by Friday\n- Start API docs\n- Fix 3 high-priority bugs\n\n## Action Items\n- [ ] Auth: token refresh flow\n- [ ] Auth: rate limiting\n- [x] Deploy staging environment\n\n## Notes\nDiscussed moving to Strangler Fig pattern for the legacy dashboard. See [[Project Architecture Notes]].",
        folderId: 1,
        tags: ["meeting", "sprint"],
        pinned: false,
        createdAt: isoTimestamp(13),
        updatedAt: isoTimestamp(13),
        linkedNoteIds: [1],
      },
      {
        id: 4,
        title: "Tech Stack Comparison",
        content:
          "# Tech Stack Options\n\n| Option | Pros | Cons |\n|--------|------|------|\n| Vanilla JS | Zero bundle, full control | More boilerplate |\n| Preact | 3kb, JSX, ecosystem | Build step needed |\n| Svelte | Compiled, small output | Newer, less ecosystem |\n| Lit | Web components native | Learning curve |\n\n## Decision\nStay vanilla for now. [[Project Architecture Notes]] explains why.",
        folderId: 1,
        tags: ["architecture", "comparison"],
        pinned: false,
        createdAt: isoTimestamp(55),
        updatedAt: isoTimestamp(30),
        linkedNoteIds: [1],
      },
      {
        id: 5,
        title: "CCNA Study Plan",
        content:
          "# CCNA 200-301\n\n## Exam Topics Weight\n- Network Fundamentals: 20%\n- Network Access: 20%\n- IP Connectivity: 25%\n- IP Services: 10%\n- Security Fundamentals: 15%\n- Automation: 10%\n\n## Resources\n- CBT Nuggets (primary)\n- Packet Tracer labs\n- Boson practice exams\n\n## Timeline\n- Months 1-2: Fundamentals + Access\n- Months 3-4: Connectivity + Services\n- Month 5: Security + Automation + Review\n- Month 6: Practice exams + weak areas",
        folderId: 2,
        tags: ["ccna", "study", "networking"],
        pinned: false,
        createdAt: isoTimestamp(90),
        updatedAt: isoTimestamp(5),
        linkedNoteIds: [],
      },
      {
        id: 6,
        title: "Blog Post Ideas",
        content:
          "# Blog Ideas\n\n## Ready to Draft\n- The Strangler Fig pattern for frontend modernization\n- Why I chose vanilla JS over React for my productivity app\n\n## Needs Research\n- Local-first software: the future of privacy\n- WebRTC for peer-to-peer sync (no server needed)\n\n## Published\n- ~~My Pomodoro workflow~~ ✅",
        folderId: 3,
        tags: ["blog", "writing", "ideas"],
        pinned: false,
        createdAt: isoTimestamp(40),
        updatedAt: isoTimestamp(3),
        linkedNoteIds: [],
      },
    ];

    return {
      ...base,
      notes: profile === "power-user" ? notes : notes.slice(0, 3),
      folders: profile === "power-user" ? folders : folders.slice(0, 2),
      noteCounter: profile === "power-user" ? 6 : 3,
      folderCounter: profile === "power-user" ? 3 : 2,
    };
  }

  return base;
}

function generateKanban(profile) {
  const base = {
    boards: [],
    activeBoardId: null,
    cardCounter: 0,
    columnCounter: 0,
    boardCounter: 0,
    dragState: null,
  };

  if (profile === "fresh" || profile === "casual") return base;

  let cardId = 0;
  const card = (title, desc = "", labels = [], priority = "medium") => {
    cardId++;
    return { id: `card-${cardId}`, title, description: desc, labels, priority };
  };

  const boards = [
    {
      id: "board-1",
      title: "E-Commerce Sprint",
      columns: [
        {
          id: "col-1",
          title: "Backlog",
          color: "#64748b",
          cards: [
            card(
              "Wishlist feature",
              "Allow users to save products",
              ["feature"],
              "low",
            ),
            card(
              "Email template redesign",
              "Match new brand",
              ["design"],
              "medium",
            ),
            card(
              "Analytics dashboard",
              "Admin view of sales data",
              ["feature"],
              "medium",
            ),
          ],
        },
        {
          id: "col-2",
          title: "In Progress",
          color: "#3b82f6",
          cards: [
            card(
              "Stripe checkout integration",
              "Payment flow with 3D Secure",
              ["critical", "payment"],
              "high",
            ),
            card(
              "Product image CDN",
              "Set up Cloudflare R2",
              ["infra"],
              "medium",
            ),
          ],
        },
        {
          id: "col-3",
          title: "Review",
          color: "#f59e0b",
          cards: [
            card(
              "Search autocomplete",
              "Fuse.js integration, needs perf review",
              ["feature"],
              "medium",
            ),
          ],
        },
        {
          id: "col-4",
          title: "Done",
          color: "#10b981",
          cards: [
            card(
              "Product listing page",
              "Grid + filters working",
              ["feature"],
              "high",
            ),
            card(
              "Cart persistence",
              "localStorage cart survives refresh",
              ["feature"],
              "high",
            ),
            card(
              "Mobile nav hamburger",
              "Responsive header menu",
              ["design"],
              "medium",
            ),
          ],
        },
      ],
    },
  ];

  if (profile === "power-user") {
    boards.push({
      id: "board-2",
      title: "Study Tracker",
      columns: [
        {
          id: "col-5",
          title: "To Study",
          color: "#64748b",
          cards: [
            card(
              "Wireless fundamentals",
              "CCNA wireless section",
              ["ccna"],
              "medium",
            ),
            card(
              "OWASP API Security",
              "Top 10 API risks",
              ["security"],
              "high",
            ),
          ],
        },
        {
          id: "col-6",
          title: "Studying",
          color: "#3b82f6",
          cards: [
            card(
              "OSPF deep dive",
              "Multi-area, stub areas, LSA types",
              ["ccna"],
              "high",
            ),
          ],
        },
        {
          id: "col-7",
          title: "Reviewed",
          color: "#10b981",
          cards: [
            card("Subnetting", "Can subnet in sleep now", ["ccna"], "high"),
            card(
              "STP basics",
              "Root bridge election, port states",
              ["ccna"],
              "medium",
            ),
            card(
              "SQL injection",
              "UNION, blind, error-based",
              ["security"],
              "high",
            ),
          ],
        },
      ],
    });
  }

  return {
    ...base,
    boards,
    activeBoardId: "board-1",
    cardCounter: cardId,
    columnCounter: 7,
    boardCounter: boards.length,
  };
}

function generateAchievements(profile) {
  const all = [
    "firstSteps",
    "gettingStarted",
    "focused",
    "centurion",
    "taskCrusher",
    "weekWarrior",
    "monthMaster",
    "perfectDay",
    "perfectWeek",
    "earlyBird",
    "nightOwl",
    "marathoner",
    "listMaster",
  ];

  const map = {
    fresh: [],
    casual: ["firstSteps", "gettingStarted"],
    committed: [
      "firstSteps",
      "gettingStarted",
      "focused",
      "weekWarrior",
      "perfectDay",
      "earlyBird",
      "listMaster",
    ],
    "power-user": [
      "firstSteps",
      "gettingStarted",
      "focused",
      "centurion",
      "taskCrusher",
      "weekWarrior",
      "monthMaster",
      "perfectDay",
      "perfectWeek",
      "earlyBird",
      "nightOwl",
      "marathoner",
      "listMaster",
    ],
    "streak-risk": [
      "firstSteps",
      "gettingStarted",
      "focused",
      "weekWarrior",
      "perfectDay",
    ],
  };

  return map[profile] || [];
}

// ── Profile Definitions ─────────────────────────────────────────────────

const PROFILES = {
  fresh: {
    description: "Brand new user — empty state",
    days: 0,
    dailyOpts: { minPomodoros: 0, maxPomodoros: 0, skipChance: 1 },
  },
  casual: {
    description:
      "2 weeks in, light usage (2-5 pomodoros/day, some missed days)",
    days: 14,
    dailyOpts: { minPomodoros: 1, maxPomodoros: 5, skipChance: 0.3 },
  },
  committed: {
    description: "2 months in, consistent daily user with growing streaks",
    days: 60,
    dailyOpts: { minPomodoros: 3, maxPomodoros: 10, skipChance: 0.1 },
  },
  "power-user": {
    description: "6 months in, heavy daily usage, all features exercised",
    days: 180,
    dailyOpts: { minPomodoros: 4, maxPomodoros: 14, skipChance: 0.05 },
  },
  "streak-risk": {
    description:
      "14-day streak, but no activity today — tests streak preservation logic",
    days: 30,
    dailyOpts: { minPomodoros: 4, maxPomodoros: 10, skipChance: 0.1 },
  },
};

// ── Main Loader ─────────────────────────────────────────────────────────

function clearAllPomidorData() {
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
}

function loadSeedData(profile = "committed") {
  if (profile === "clean") {
    clearAllPomidorData();
    console.log("🧹 All Pomidor data cleared from localStorage.");
    console.log("   Reload the page to see a fresh state.");
    return;
  }

  const config = PROFILES[profile];
  if (!config) {
    console.error(
      `Unknown profile: "${profile}". Available: ${Object.keys(PROFILES).join(", ")}, clean`,
    );
    return;
  }

  // Clear first
  clearAllPomidorData();

  // Generate daily data
  let dailyData = generateDailyData(config.days, config.dailyOpts);

  // Special handling for streak-risk: ensure continuous streak ending yesterday
  if (profile === "streak-risk") {
    for (let i = 1; i <= 14; i++) {
      const dateStr = isoDate(i);
      dailyData[dateStr] = {
        pomodoros: randomBetween(5, 10),
        tasks: randomBetween(1, 4),
        focusMinutes: randomBetween(125, 250),
      };
    }
    // Explicitly remove today — the streak is at risk
    delete dailyData[isoDate(0)];
  }

  // Stats
  const stats = generateStats(dailyData);
  localStorage.setItem("pomodoro-stats", JSON.stringify(stats));

  // Todos
  const todoData = generateTodoLists(profile);
  localStorage.setItem("pomodoro.lists", JSON.stringify(todoData.lists));
  localStorage.setItem("pomodoro.archive", JSON.stringify(todoData.archive));
  localStorage.setItem("pomodoro.listCounter", String(todoData.listCounter));
  localStorage.setItem("pomodoro.taskCounter", String(todoData.taskCounter));
  if (todoData.selectedListId != null) {
    localStorage.setItem(
      "pomodoro.selectedListId",
      String(todoData.selectedListId),
    );
  }
  if (profile !== "fresh") {
    localStorage.setItem("pomodoro.tutorialListDone", "done");
  }

  // Achievements
  const achievements = generateAchievements(profile);
  localStorage.setItem("pomodoro-achievements", JSON.stringify(achievements));

  // Vault
  const vault = generateVault(profile);
  localStorage.setItem("pomidor.vault", JSON.stringify(vault));

  // Kanban
  const kanban = generateKanban(profile);
  localStorage.setItem("pomidor.kanban", JSON.stringify(kanban));
  if (profile !== "fresh") {
    localStorage.setItem("pomidor.kanban.tutorialDone", "shown");
  }

  // Settings — set sensible defaults
  localStorage.setItem("pomodoro-theme", "dark");
  localStorage.setItem("timerVisual", "ring");
  localStorage.setItem("appTheme", "modern");
  localStorage.setItem(
    "timerStyle",
    profile === "power-user" ? "modern" : "classic",
  );
  localStorage.setItem("customSessionTime", "25");
  localStorage.setItem("customBreakTime", "5");
  localStorage.setItem("buzzerVolume", "80");
  localStorage.setItem("keyboard-shortcuts-seen", "true");
  localStorage.setItem("pomidor-lang", "en");

  // Print summary
  console.log(`🍅 Seed data loaded: "${profile}" — ${config.description}`);
  console.log(
    `   📊 Stats: ${stats.totalPomodoros} pomodoros, ${stats.totalTasksCompleted} tasks, ${stats.currentStreak}-day streak (longest: ${stats.longestStreak})`,
  );
  console.log(
    `   📋 Todos: ${todoData.lists.length} lists, ${todoData.lists.reduce((a, l) => a + l.tasks.length, 0)} active tasks, ${todoData.archive.tasks.length} archived`,
  );
  console.log(`   🏆 Achievements: ${achievements.length}/13 unlocked`);
  console.log(
    `   📝 Vault: ${vault.notes.length} notes, ${vault.folders.length} folders`,
  );
  console.log(`   📌 Kanban: ${kanban.boards.length} boards`);
  console.log(`   ⏱️  Sessions spanning ${config.days} days of history`);
  console.log("");
  console.log("   Reload the page to see the seeded state.");

  return { stats, todoData, achievements, vault, kanban };
}

// ── Corrupt Data Profile ────────────────────────────────────────────────

function loadCorruptData() {
  clearAllPomidorData();

  // Stats with wrong types and missing fields
  localStorage.setItem(
    "pomodoro-stats",
    JSON.stringify({
      totalPomodoros: "not-a-number",
      totalTasksCompleted: -5,
      // totalFocusMinutes missing entirely
      currentStreak: null,
      longestStreak: 999999,
      lastActiveDate: "not-a-date",
      dailyGoal: 0,
      dailyData: {
        "bad-date": { pomodoros: "three" },
        [isoDate(1)]: { pomodoros: 5, tasks: 2, focusMinutes: 125 },
        // Entry with negative values
        [isoDate(3)]: { pomodoros: -1, tasks: -1, focusMinutes: -25 },
      },
      sessions: [
        { timestamp: "garbage", duration: "long", type: 42 },
        { timestamp: isoTimestamp(1), duration: 25, type: "pomodoro" },
        null,
        "not an object",
      ],
      extraField: "shouldn't be here",
    }),
  );

  // Lists with mixed valid/invalid tasks
  localStorage.setItem(
    "pomodoro.lists",
    JSON.stringify([
      {
        id: 1,
        name: "Valid List",
        tasks: [
          {
            id: 1,
            name: "Valid task",
            completed: false,
            createdAt: isoTimestamp(5),
            completedAt: null,
            dueDate: null,
            estimatedPomodoros: 2,
            pomodoros: 0,
            priority: "medium",
          },
          { id: 2, name: "", completed: "yes", priority: "invalid-priority" }, // missing fields, wrong types
          null, // null task in array
        ],
      },
      { id: "not-a-number", name: 12345, tasks: "not-an-array" }, // broken list
    ]),
  );

  // Achievements with duplicates and fake IDs
  localStorage.setItem(
    "pomodoro-achievements",
    JSON.stringify([
      "firstSteps",
      "firstSteps",
      "fakeAchievement",
      "gettingStarted",
      null,
      42,
    ]),
  );

  // Vault with circular-reference-like data
  localStorage.setItem(
    "pomidor.vault",
    JSON.stringify({
      notes: [
        {
          id: 1,
          title: "Note pointing to itself",
          content: "[[Note pointing to itself]]",
          folderId: 999,
          tags: [null, 42, "valid"],
          pinned: "yes",
          createdAt: isoTimestamp(5),
          updatedAt: isoTimestamp(1),
          linkedNoteIds: [1, 999],
        },
      ],
      folders: [
        { id: 999, name: null, color: "not-a-hex", createdAt: "bad-date" },
      ],
      noteCounter: 1,
      folderCounter: 1,
    }),
  );

  console.log("💀 Corrupt seed data loaded for resilience testing.");
  console.log("   This simulates: wrong types, missing fields, null entries,");
  console.log("   invalid dates, negative values, and broken references.");
  console.log("   Reload the page and check the console for errors.");
}

// ── Export for console and module use ────────────────────────────────────

// Make globally available when pasted into console
if (typeof window !== "undefined") {
  window.loadSeedData = loadSeedData;
  window.loadCorruptData = loadCorruptData;
  window.clearAllPomidorData = clearAllPomidorData;

  console.log("🍅 Pomidor Seed Data Loader ready!");
  console.log("   Available commands:");
  console.log("     loadSeedData('fresh')       — Empty state");
  console.log("     loadSeedData('casual')      — 2-week light user");
  console.log("     loadSeedData('committed')   — 2-month daily user");
  console.log("     loadSeedData('power-user')  — 6-month heavy user");
  console.log("     loadSeedData('streak-risk') — Streak about to break");
  console.log("     loadSeedData('clean')       — Wipe all data");
  console.log(
    "     loadCorruptData()           — Broken data (resilience test)",
  );
}

export { loadSeedData, loadCorruptData, clearAllPomidorData };
