/**
 * Achievements Module
 * Gamification with unlockable achievements and badges
 */

"use strict";

const ACHIEVEMENTS_KEY = "pomodoro-achievements";

// Achievement definitions
const ACHIEVEMENTS = {
  firstSteps: {
    id: "firstSteps",
    name: "First Steps",
    description: "Complete your first pomodoro",
    icon: "🌱",
    requirement: { type: "pomodoros", count: 1 },
  },
  gettingStarted: {
    id: "gettingStarted",
    name: "Getting Started",
    description: "Complete 10 pomodoros",
    icon: "🌿",
    requirement: { type: "pomodoros", count: 10 },
  },
  focused: {
    id: "focused",
    name: "Focused",
    description: "Complete 50 pomodoros",
    icon: "🌳",
    requirement: { type: "pomodoros", count: 50 },
  },
  centurion: {
    id: "centurion",
    name: "Centurion",
    description: "Complete 100 pomodoros",
    icon: "💯",
    requirement: { type: "pomodoros", count: 100 },
  },
  taskCrusher: {
    id: "taskCrusher",
    name: "Task Crusher",
    description: "Complete 100 tasks",
    icon: "💪",
    requirement: { type: "tasks", count: 100 },
  },
  weekWarrior: {
    id: "weekWarrior",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚔️",
    requirement: { type: "streak", count: 7 },
  },
  monthMaster: {
    id: "monthMaster",
    name: "Month Master",
    description: "Maintain a 30-day streak",
    icon: "👑",
    requirement: { type: "streak", count: 30 },
  },
  perfectDay: {
    id: "perfectDay",
    name: "Perfect Day",
    description: "Hit your daily goal",
    icon: "⭐",
    requirement: { type: "dailyGoal", count: 1 },
  },
  perfectWeek: {
    id: "perfectWeek",
    name: "Perfect Week",
    description: "Hit your daily goal 7 days in a row",
    icon: "🏆",
    requirement: { type: "dailyGoalStreak", count: 7 },
  },
  earlyBird: {
    id: "earlyBird",
    name: "Early Bird",
    description: "Complete a pomodoro before 7am",
    icon: "🌅",
    requirement: { type: "timeOfDay", before: 7 },
  },
  nightOwl: {
    id: "nightOwl",
    name: "Night Owl",
    description: "Complete a pomodoro after 10pm",
    icon: "🦉",
    requirement: { type: "timeOfDay", after: 22 },
  },
  marathoner: {
    id: "marathoner",
    name: "Marathoner",
    description: "Complete 8 pomodoros in one day",
    icon: "🏃",
    requirement: { type: "dailyPomodoros", count: 8 },
  },
  listMaster: {
    id: "listMaster",
    name: "List Master",
    description: "Create 5 different lists",
    icon: "📋",
    requirement: { type: "lists", count: 5 },
  },
};

// State
let unlockedAchievements = new Set();
let achievementPopup;
let achievementIcon;
let achievementName;

export function initAchievements() {
  loadAchievements();

  // Get DOM elements
  achievementPopup = document.getElementById("achievement-popup");
  achievementIcon = document.getElementById("achievement-icon");
  achievementName = document.getElementById("achievement-name");

  // Listen for events that could trigger achievements
  document.addEventListener("pomodoro-complete", handlePomodoroComplete);
  document.addEventListener("task-complete", handleTaskComplete);
  document.addEventListener("daily-goal-reached", handleDailyGoalReached);
}

/**
 * Load achievements from localStorage
 */
function loadAchievements() {
  try {
    const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (saved) {
      unlockedAchievements = new Set(JSON.parse(saved));
    }
  } catch (e) {
    console.error("Failed to load achievements:", e);
    unlockedAchievements = new Set();
  }
}

/**
 * Save achievements to localStorage
 */
function saveAchievements() {
  try {
    localStorage.setItem(
      ACHIEVEMENTS_KEY,
      JSON.stringify([...unlockedAchievements])
    );
  } catch (e) {
    console.error("Failed to save achievements:", e);
  }
}

/**
 * Check and unlock an achievement
 * @param {string} achievementId - The achievement ID to check
 * @returns {boolean} - Whether the achievement was newly unlocked
 */
function unlockAchievement(achievementId) {
  if (unlockedAchievements.has(achievementId)) {
    return false; // Already unlocked
  }

  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return false;

  unlockedAchievements.add(achievementId);
  saveAchievements();
  showAchievementPopup(achievement);

  return true;
}

/**
 * Show achievement popup
 * @param {Object} achievement - The achievement object
 */
function showAchievementPopup(achievement) {
  if (!achievementPopup) return;

  achievementIcon.textContent = achievement.icon;
  achievementName.textContent = achievement.name;

  achievementPopup.classList.add("show");

  // Play sound (optional)
  playAchievementSound();

  // Trigger confetti for special achievements
  if (["centurion", "monthMaster", "perfectWeek"].includes(achievement.id)) {
    triggerConfetti();
  }

  // Hide after delay
  setTimeout(() => {
    achievementPopup.classList.remove("show");
  }, 4000);
}

/**
 * Play achievement unlock sound
 */
function playAchievementSound() {
  // Create a simple tone
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    // Audio not available
  }
}

/**
 * Handle pomodoro complete event
 */
function handlePomodoroComplete(event) {
  const stats = getStats();
  const now = new Date();
  const hour = now.getHours();

  // Check pomodoro count achievements
  if (stats.totalPomodoros >= 1) unlockAchievement("firstSteps");
  if (stats.totalPomodoros >= 10) unlockAchievement("gettingStarted");
  if (stats.totalPomodoros >= 50) unlockAchievement("focused");
  if (stats.totalPomodoros >= 100) unlockAchievement("centurion");

  // Check streak achievements
  if (stats.currentStreak >= 7) unlockAchievement("weekWarrior");
  if (stats.currentStreak >= 30) unlockAchievement("monthMaster");

  // Check time of day achievements
  if (hour < 7) unlockAchievement("earlyBird");
  if (hour >= 22) unlockAchievement("nightOwl");

  // Check daily pomodoros
  const today = new Date().toISOString().split("T")[0];
  const todayData = stats.dailyData?.[today];
  if (todayData && todayData.pomodoros >= 8) {
    unlockAchievement("marathoner");
  }
}

/**
 * Handle task complete event
 */
function handleTaskComplete(event) {
  const stats = getStats();

  if (stats.totalTasksCompleted >= 100) {
    unlockAchievement("taskCrusher");
  }
}

/**
 * Handle daily goal reached event
 */
function handleDailyGoalReached(event) {
  unlockAchievement("perfectDay");

  // Check for perfect week
  const stats = getStats();
  if (stats.dailyGoalStreak >= 7) {
    unlockAchievement("perfectWeek");
  }

  // Trigger celebration
  triggerConfetti();
}

/**
 * Get stats from localStorage
 */
function getStats() {
  try {
    const saved = localStorage.getItem("pomodoro-stats");
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Trigger confetti celebration
 */
export function triggerConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;

  const colors = [
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
  ];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confetti.style.animationDuration = `${2 + Math.random() * 2}s`;

    // Random shapes
    const shapes = ["circle", "square", "triangle"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    if (shape === "circle") {
      confetti.style.borderRadius = "50%";
    } else if (shape === "triangle") {
      confetti.style.width = "0";
      confetti.style.height = "0";
      confetti.style.borderLeft = "5px solid transparent";
      confetti.style.borderRight = "5px solid transparent";
      confetti.style.borderBottom = `10px solid ${confetti.style.backgroundColor}`;
      confetti.style.backgroundColor = "transparent";
    }

    container.appendChild(confetti);
    confetti.classList.add("animate");

    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, 4000);
  }
}

/**
 * Get all achievements with their unlock status
 */
export function getAllAchievements() {
  return Object.values(ACHIEVEMENTS).map((achievement) => ({
    ...achievement,
    unlocked: unlockedAchievements.has(achievement.id),
  }));
}

/**
 * Get unlocked achievements count
 */
export function getUnlockedCount() {
  return unlockedAchievements.size;
}

/**
 * Get total achievements count
 */
export function getTotalCount() {
  return Object.keys(ACHIEVEMENTS).length;
}

/**
 * Check achievement for list creation
 */
export function checkListAchievement(listCount) {
  if (listCount >= 5) {
    unlockAchievement("listMaster");
  }
}
