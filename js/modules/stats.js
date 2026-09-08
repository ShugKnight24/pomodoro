/**
 * Statistics Module
 * Tracks and displays pomodoro statistics, daily goals, and weekly activity
 */

import { getIcon } from "../utils/icons.js";
import { renderTelemetryDashboard } from "./telemetry/telemetryUi.js";

const STATS_STORAGE_KEY = "pomodoro-stats";

// Default statistics structure
const defaultStats = {
  totalPomodoros: 0,
  totalTasksCompleted: 0,
  totalFocusMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  dailyGoal: 8,
  dailyData: {}, // { '2024-01-15': { pomodoros: 5, tasks: 3, focusMinutes: 125 } }
  sessions: [], // Recent sessions: [{ timestamp, duration, type }]
};

let stats = { ...defaultStats };
let currentHeatmapMonth = new Date();
let currentPeriod = "week";

/**
 * Initialize statistics module
 */
export function initStats() {
  loadStats();
  checkStreak();
  renderStats();
  setupEventListeners();
}

/**
 * Load stats from localStorage
 */
function loadStats() {
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (saved) {
      stats = { ...defaultStats, ...JSON.parse(saved) };
      // Ensure sessions array exists
      if (!stats.sessions) {
        stats.sessions = [];
      }
    }
  } catch (e) {
    console.error("Failed to load stats:", e);
    stats = { ...defaultStats };
  }
}

/**
 * Save stats to localStorage
 */
function saveStats() {
  try {
    // Keep only last 100 sessions to prevent storage bloat
    if (stats.sessions.length > 100) {
      stats.sessions = stats.sessions.slice(-100);
    }
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save stats:", e);
  }
}

/**
 * Get today's date as string (YYYY-MM-DD)
 */
function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Check and update streak
 */
function checkStreak() {
  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  if (stats.lastActiveDate === today) {
    // Already active today, no change
    return;
  }

  if (stats.lastActiveDate === yesterdayKey) {
    // Was active yesterday, streak continues if we do something today
    // Streak will be incremented when a pomodoro is completed
  } else if (stats.lastActiveDate && stats.lastActiveDate !== today) {
    // Missed a day, reset streak
    stats.currentStreak = 0;
    saveStats();
  }
}

/**
 * Record a completed pomodoro
 * @param {number} minutes - Duration of the pomodoro
 */
export function recordPomodoro(minutes = 25) {
  const today = getTodayKey();
  const now = new Date();

  // Get previous count to check if we just hit the goal
  const prevPomodoros = stats.dailyData[today]?.pomodoros || 0;

  // Update totals
  stats.totalPomodoros++;
  stats.totalFocusMinutes += minutes;

  // Update daily data
  if (!stats.dailyData[today]) {
    stats.dailyData[today] = { pomodoros: 0, tasks: 0, focusMinutes: 0 };
  }
  stats.dailyData[today].pomodoros++;
  stats.dailyData[today].focusMinutes += minutes;

  // Add to sessions history
  stats.sessions.push({
    timestamp: now.toISOString(),
    duration: minutes,
    type: "pomodoro",
  });

  // Update streak
  if (stats.lastActiveDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    if (stats.lastActiveDate === yesterdayKey || !stats.lastActiveDate) {
      stats.currentStreak++;
    } else {
      stats.currentStreak = 1;
    }
    stats.lastActiveDate = today;
  }

  // Update longest streak
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  saveStats();
  renderStats();

  // Check if we just hit the daily goal
  const newPomodoros = stats.dailyData[today].pomodoros;
  if (prevPomodoros < stats.dailyGoal && newPomodoros >= stats.dailyGoal) {
    // Dispatch daily goal reached event for achievements
    document.dispatchEvent(
      new CustomEvent("daily-goal-reached", {
        detail: {
          goal: stats.dailyGoal,
          pomodoros: newPomodoros,
          streak: stats.currentStreak,
        },
      }),
    );
  }
}

/**
 * Record a completed task
 */
export function recordTaskCompleted() {
  const today = getTodayKey();

  stats.totalTasksCompleted++;

  if (!stats.dailyData[today]) {
    stats.dailyData[today] = { pomodoros: 0, tasks: 0, focusMinutes: 0 };
  }
  stats.dailyData[today].tasks++;

  saveStats();
  renderStats();
}

/**
 * Get statistics for a specific date
 * @param {string} dateKey - Date in YYYY-MM-DD format
 */
export function getStatsForDate(dateKey) {
  return (
    stats.dailyData[dateKey] || { pomodoros: 0, tasks: 0, focusMinutes: 0 }
  );
}

/**
 * Get weekly data for chart
 */
function getWeeklyData() {
  const data = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = stats.dailyData[dateKey] || { pomodoros: 0 };

    data.push({
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      pomodoros: dayData.pomodoros,
      isToday: i === 0,
    });
  }

  return data;
}

/**
 * Calculate productivity insights
 * @param {string} period - 'week', 'month', or 'all'
 */
function calculateInsights(period) {
  const today = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Determine the number of days to look back
  let lookbackDays;
  switch (period) {
    case "week":
      lookbackDays = 7;
      break;
    case "month":
      lookbackDays = 30;
      break;
    case "all":
      // Calculate from the earliest entry in dailyData
      const allDates = Object.keys(stats.dailyData).sort();
      if (allDates.length > 0) {
        const earliest = new Date(allDates[0]);
        lookbackDays =
          Math.ceil((today - earliest) / (1000 * 60 * 60 * 24)) + 1;
      } else {
        lookbackDays = 30;
      }
      break;
    default:
      lookbackDays = 30;
  }

  let totalPomodoros = 0;
  let daysWithActivity = 0;
  let daysGoalMet = 0;
  const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat

  for (let i = 0; i < lookbackDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = stats.dailyData[dateKey] || { pomodoros: 0 };

    totalPomodoros += dayData.pomodoros;

    if (dayData.pomodoros > 0) {
      daysWithActivity++;
      dayTotals[date.getDay()] += dayData.pomodoros;
    }

    if (dayData.pomodoros >= stats.dailyGoal) {
      daysGoalMet++;
    }
  }

  // Average daily pomodoros (only counting active days)
  const avgDaily =
    daysWithActivity > 0 ? (totalPomodoros / daysWithActivity).toFixed(1) : "0";

  // Best day of week
  let bestDayIndex = 0;
  let bestDayTotal = 0;
  dayTotals.forEach((total, index) => {
    if (total > bestDayTotal) {
      bestDayTotal = total;
      bestDayIndex = index;
    }
  });
  const bestDay = bestDayTotal > 0 ? dayNames[bestDayIndex] : "--";

  // Goal completion rate
  const goalRate =
    daysWithActivity > 0
      ? Math.round((daysGoalMet / daysWithActivity) * 100)
      : 0;

  // Weekly trend (compare current period with previous equivalent period)
  const compareDays = period === "week" ? 7 : period === "month" ? 30 : 7;
  let thisPeriod = 0;
  let lastPeriod = 0;

  for (let i = 0; i < compareDays; i++) {
    const thisDate = new Date(today);
    thisDate.setDate(thisDate.getDate() - i);
    const thisKey = thisDate.toISOString().split("T")[0];
    thisPeriod += stats.dailyData[thisKey]?.pomodoros || 0;

    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() - i - compareDays);
    const lastKey = lastDate.toISOString().split("T")[0];
    lastPeriod += stats.dailyData[lastKey]?.pomodoros || 0;
  }

  let weeklyTrend = "--";
  let weeklyTrendPositive = true;
  if (lastPeriod > 0) {
    const change = Math.round(((thisPeriod - lastPeriod) / lastPeriod) * 100);
    weeklyTrend = change >= 0 ? `+${change}%` : `${change}%`;
    weeklyTrendPositive = change >= 0;
  } else if (thisPeriod > 0) {
    weeklyTrend = "+100%";
  }

  return {
    avgDaily,
    bestDay,
    goalRate: `${goalRate}%`,
    weeklyTrend,
    weeklyTrendPositive,
    thisPeriodTotal: thisPeriod,
    lastPeriodTotal: lastPeriod,
  };
}

/**
 * Get aggregated stats for a given period
 * @param {string} period - 'week', 'month', or 'all'
 * @returns {{ pomodoros: number, tasks: number, focusMinutes: number }}
 */
function getStatsForPeriod(period) {
  if (period === "all") {
    return {
      pomodoros: stats.totalPomodoros,
      tasks: stats.totalTasksCompleted,
      focusMinutes: stats.totalFocusMinutes,
    };
  }

  const days = period === "week" ? 7 : 30;
  const today = new Date();
  let pomodoros = 0;
  let tasks = 0;
  let focusMinutes = 0;

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    const dayData = stats.dailyData[dateKey];
    if (dayData) {
      pomodoros += dayData.pomodoros || 0;
      tasks += dayData.tasks || 0;
      focusMinutes += dayData.focusMinutes || 0;
    }
  }

  return { pomodoros, tasks, focusMinutes };
}

/**
 * Get the label for a period
 * @param {string} period
 */
function getPeriodLabel(period) {
  switch (period) {
    case "week":
      return "this week";
    case "month":
      return "this month";
    case "all":
      return "all time";
    default:
      return "this week";
  }
}

/**
 * Format focus time for display
 * @param {number} minutes - Total minutes
 */
function formatFocusTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Render all statistics
 */
function renderStats() {
  const periodData = getStatsForPeriod(currentPeriod);
  const periodLabel = getPeriodLabel(currentPeriod);

  // Update stat cards with period-filtered data
  const totalPomodorosEl = document.getElementById("total-pomodoros");
  const tasksCompletedEl = document.getElementById("tasks-completed");
  const currentStreakEl = document.getElementById("current-streak");
  const focusTimeEl = document.getElementById("focus-time");
  const streakInfoEl = document.getElementById("streak-info");

  if (totalPomodorosEl) totalPomodorosEl.textContent = periodData.pomodoros;
  if (tasksCompletedEl) tasksCompletedEl.textContent = periodData.tasks;
  if (currentStreakEl)
    currentStreakEl.textContent = `${stats.currentStreak} days`;
  if (focusTimeEl)
    focusTimeEl.textContent = formatFocusTime(periodData.focusMinutes);
  if (streakInfoEl) {
    streakInfoEl.innerHTML = `<span>Best: ${stats.longestStreak} days</span>`;
  }

  // Render weekly chart
  renderWeeklyChart();

  // Render daily goal
  renderDailyGoal();

  // Render insights
  renderInsights();

  // Render trends
  renderTrends();

  // Render heatmap
  renderHeatmap();

  // Render recent sessions
  renderRecentSessions();

  // Render time accounting & variance
  renderTimeAccounting();

  // Render mood & energy history
  renderMoodHistory();

  // Render client-side telemetry & bot audit dashboard
  renderTelemetryDashboard();
}

/**
 * Render productivity insights
 */
function renderInsights() {
  const insights = calculateInsights(currentPeriod);

  const avgDailyEl = document.getElementById("avg-daily-pomodoros");
  const bestDayEl = document.getElementById("best-day");
  const goalRateEl = document.getElementById("goal-completion-rate");
  const weeklyTrendEl = document.getElementById("weekly-trend");

  if (avgDailyEl) avgDailyEl.textContent = insights.avgDaily;
  if (bestDayEl) bestDayEl.textContent = insights.bestDay;
  if (goalRateEl) goalRateEl.textContent = insights.goalRate;
  if (weeklyTrendEl) {
    weeklyTrendEl.textContent = insights.weeklyTrend;
    weeklyTrendEl.classList.toggle("positive", insights.weeklyTrendPositive);
    weeklyTrendEl.classList.toggle("negative", !insights.weeklyTrendPositive);
  }
}

/**
 * Render trend indicators on stat cards
 */
function renderTrends() {
  const periodData = getStatsForPeriod(currentPeriod);
  const periodLabel = getPeriodLabel(currentPeriod);

  // Pomodoro trend - compare current period vs previous period
  const pomodoroTrendEl = document.getElementById("pomodoro-trend");
  if (pomodoroTrendEl) {
    let prevPeriodPomodoros = 0;
    const today = new Date();
    const days =
      currentPeriod === "week" ? 7 : currentPeriod === "month" ? 30 : 0;

    if (days > 0) {
      for (let i = days; i < days * 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split("T")[0];
        prevPeriodPomodoros += stats.dailyData[dateKey]?.pomodoros || 0;
      }
    }

    const isPositive =
      currentPeriod === "all" || periodData.pomodoros >= prevPeriodPomodoros;
    const icon = isPositive
      ? getIcon("arrow-up", { size: 12 })
      : getIcon("arrow-down", { size: 12 });
    pomodoroTrendEl.innerHTML = `${icon} <span>${periodData.pomodoros} ${periodLabel}</span>`;
    pomodoroTrendEl.className = `stat-trend ${isPositive ? "positive" : "negative"}`;
  }

  // Task trend
  const taskTrendEl = document.getElementById("task-trend");
  if (taskTrendEl) {
    taskTrendEl.innerHTML = `${getIcon("arrow-up", { size: 12 })} <span>${periodData.tasks} ${periodLabel}</span>`;
    taskTrendEl.className = `stat-trend ${periodData.tasks > 0 ? "positive" : ""}`;
  }

  // Focus time trend
  const timeTrendEl = document.getElementById("time-trend");
  if (timeTrendEl) {
    timeTrendEl.innerHTML = `<span>${formatFocusTime(periodData.focusMinutes)} ${periodLabel}</span>`;
  }
}

/**
 * Render activity heatmap for current month
 */
function renderHeatmap() {
  const gridEl = document.getElementById("heatmap-grid");
  const monthEl = document.getElementById("heatmap-month");

  if (!gridEl) return;

  const year = currentHeatmapMonth.getFullYear();
  const month = currentHeatmapMonth.getMonth();

  // Update month label
  if (monthEl) {
    monthEl.textContent = currentHeatmapMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday

  // Calculate max pomodoros for scaling
  let maxPomodoros = 1;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d,
    ).padStart(2, "0")}`;
    const pomodoros = stats.dailyData[dateKey]?.pomodoros || 0;
    if (pomodoros > maxPomodoros) maxPomodoros = pomodoros;
  }

  // Build grid HTML
  let html = "";
  const todayKey = getTodayKey();

  // Add empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    html += '<div class="heatmap-cell other-month"></div>';
  }

  // Add cells for each day
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d,
    ).padStart(2, "0")}`;
    const pomodoros = stats.dailyData[dateKey]?.pomodoros || 0;
    const isToday = dateKey === todayKey;

    // Calculate intensity level (0-4)
    let level = 0;
    if (pomodoros > 0) {
      level = Math.min(4, Math.ceil((pomodoros / maxPomodoros) * 4));
    }

    const tooltip = `${new Date(dateKey).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}: ${pomodoros} pomodoro${pomodoros !== 1 ? "s" : ""}`;

    html += `<div class="heatmap-cell level-${level}${
      isToday ? " today" : ""
    }" data-date="${dateKey}" data-tooltip="${tooltip}"></div>`;
  }

  gridEl.innerHTML = html;
}

/**
 * Render recent sessions list
 */
function renderRecentSessions() {
  const listEl = document.getElementById("sessions-list");
  if (!listEl) return;

  if (!stats.sessions || stats.sessions.length === 0) {
    listEl.innerHTML =
      '<p class="empty-sessions">No sessions recorded yet. Complete a pomodoro to see your history!</p>';
    return;
  }

  // Filter sessions based on current period
  const now = new Date();
  let cutoffDate = null;
  if (currentPeriod === "week") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (currentPeriod === "month") {
    cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  }

  let filteredSessions = [...stats.sessions].reverse();
  if (cutoffDate) {
    filteredSessions = filteredSessions.filter(
      (s) => new Date(s.timestamp) >= cutoffDate,
    );
  }

  // Show up to 10 most recent
  const recentSessions = filteredSessions.slice(0, 10);

  if (recentSessions.length === 0) {
    const periodLabel = getPeriodLabel(currentPeriod);
    listEl.innerHTML = `<p class="empty-sessions">No sessions recorded ${periodLabel}.</p>`;
    return;
  }

  const html = recentSessions
    .map((session) => {
      const date = new Date(session.timestamp);
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      return `
      <div class="session-item">
        <span class="session-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="14" r="8"/>
            <path d="M12 6V2"/>
            <path d="M8 2h8"/>
            <circle cx="12" cy="14" r="3" fill="currentColor" opacity="0.3"/>
          </svg>
        </span>
        <div class="session-details">
          <span class="session-title">Pomodoro Session</span>
          <span class="session-meta">
            <span>${dateStr}</span>
            <span>•</span>
            <span>${timeStr}</span>
          </span>
        </div>
        <span class="session-duration">${session.duration}m</span>
      </div>
    `;
    })
    .join("");

  listEl.innerHTML = html;
}

/**
 * Render weekly activity chart
 */
function renderWeeklyChart() {
  const chartContainer = document.getElementById("weekly-chart");
  if (!chartContainer) return;

  const weeklyData = getWeeklyData();
  const maxPomodoros = Math.max(
    ...weeklyData.map((d) => d.pomodoros),
    stats.dailyGoal,
    1,
  );

  // Check if using the static HTML structure or generate dynamic
  const existingBars = chartContainer.querySelectorAll(".chart-bar[data-day]");

  if (existingBars.length > 0) {
    // Update existing static HTML bars
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    existingBars.forEach((bar) => {
      const dayName = bar.dataset.day;
      const dayData = weeklyData.find(
        (d) => d.day === dayName || d.day === dayName.slice(0, 3),
      );
      if (dayData) {
        const height =
          maxPomodoros > 0 ? (dayData.pomodoros / maxPomodoros) * 100 : 0;
        const fill = bar.querySelector(".bar-fill");
        if (fill) {
          fill.style.height = `${Math.max(height, 5)}%`;
        }
        bar.classList.toggle("today", dayData.isToday);
      }
    });
  } else {
    // Generate dynamic chart
    const barsHtml = weeklyData
      .map((day) => {
        const height =
          maxPomodoros > 0 ? (day.pomodoros / maxPomodoros) * 100 : 0;
        return `
        <div class="chart-bar-wrapper">
          <span class="chart-bar-value">${day.pomodoros}</span>
          <div class="chart-bar ${day.isToday ? "today" : ""}" 
               style="height: ${Math.max(height, 3)}%"
               title="${day.pomodoros} pomodoros"></div>
        </div>
      `;
      })
      .join("");

    const labelsHtml = weeklyData
      .map((day) => `<span class="chart-label">${day.day}</span>`)
      .join("");

    chartContainer.innerHTML = `
      <h4 class="chart-title">Weekly Activity</h4>
      <div class="chart-bars">${barsHtml}</div>
      <div class="chart-labels">${labelsHtml}</div>
    `;
  }
}

/**
 * Render daily goal progress
 */
function renderDailyGoal() {
  const today = getTodayKey();
  const todayData = stats.dailyData[today] || { pomodoros: 0 };
  const progress = Math.min((todayData.pomodoros / stats.dailyGoal) * 100, 100);
  const isComplete = todayData.pomodoros >= stats.dailyGoal;

  // Update progress bar (try both potential element structures)
  const progressEl = document.getElementById("daily-progress");
  const goalCountEl = document.getElementById("daily-goal-count");
  const goalInputEl = document.getElementById("daily-goal-input");

  if (progressEl) {
    // Check if it's the simple progress bar or our custom structure
    if (progressEl.classList.contains("progress-fill")) {
      // Static HTML structure: progressEl is the fill bar itself
      progressEl.style.width = `${progress}%`;
      if (isComplete) {
        progressEl.classList.add("complete");
      } else {
        progressEl.classList.remove("complete");
      }
    } else {
      // Dynamic structure
      progressEl.innerHTML = `
        <div class="daily-progress-fill ${isComplete ? "complete" : ""}" 
             style="width: ${progress}%"></div>
        <span class="progress-text">${todayData.pomodoros} / ${
          stats.dailyGoal
        } pomodoros</span>
      `;
    }
  }

  // Update goal count display
  if (goalCountEl) {
    goalCountEl.textContent = `${todayData.pomodoros} / ${stats.dailyGoal}`;
  }

  // Update goal input
  if (goalInputEl) {
    goalInputEl.value = stats.dailyGoal;
  }
}

/**
 * Update daily goal
 * @param {number} goal - New daily goal
 */
export function setDailyGoal(goal) {
  const newGoal = Math.max(1, Math.min(50, parseInt(goal) || 8));
  stats.dailyGoal = newGoal;
  saveStats();
  renderDailyGoal();
  renderInsights();
}

/**
 * Export all statistics data
 */
export function exportStats() {
  return {
    stats: { ...stats },
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import statistics data
 * @param {Object} data - Imported stats data
 */
export function importStats(data) {
  if (data && data.stats) {
    stats = { ...defaultStats, ...data.stats };
    saveStats();
    renderStats();
    return true;
  }
  return false;
}

/**
 * Reset all statistics
 */
export function resetStats() {
  stats = { ...defaultStats };
  saveStats();
  renderStats();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Re-render when switching to stats view
  document.querySelectorAll('[data-view="stats"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      renderStats();
    });
  });

  // Daily goal input
  const goalInput = document.getElementById("daily-goal-input");
  if (goalInput) {
    goalInput.addEventListener("change", (e) => {
      setDailyGoal(e.target.value);
    });
  }

  // Period toggle buttons
  const periodBtns = document.querySelectorAll(".period-btn");
  periodBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      periodBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentPeriod = btn.dataset.period;
      renderStats();
    });
  });

  // Heatmap navigation
  const heatmapPrev = document.getElementById("heatmap-prev");
  const heatmapNext = document.getElementById("heatmap-next");

  heatmapPrev?.addEventListener("click", () => {
    currentHeatmapMonth.setMonth(currentHeatmapMonth.getMonth() - 1);
    renderHeatmap();
  });

  heatmapNext?.addEventListener("click", () => {
    currentHeatmapMonth.setMonth(currentHeatmapMonth.getMonth() + 1);
    renderHeatmap();
  });

  // Time accounting export button
  const exportBtn = document.getElementById("export-time-audit-btn");
  exportBtn?.addEventListener("click", () => {
    exportTimeAuditCSV();
  });

  // Re-render mood history when new mood is checked in
  document.addEventListener("mood-checked-in", () => {
    renderMoodHistory();
  });
}

/**
 * Render Time Accounting & Estimation Variance
 */
function renderTimeAccounting() {
  const estEl = document.getElementById("accounting-estimated");
  const actEl = document.getElementById("accounting-actual");
  const varEl = document.getElementById("accounting-variance");

  if (!estEl || !actEl || !varEl) return;

  let totalEstPoms = 0;
  let totalActPoms = 0;

  try {
    const lists = JSON.parse(localStorage.getItem("pomodoro.lists") || "[]");
    const archive = JSON.parse(localStorage.getItem("pomodoro.archive") || '{"tasks":[]}');

    lists.forEach((list) => {
      (list.tasks || []).forEach((t) => {
        totalEstPoms += parseInt(t.estimatedPomodoros) || 0;
        totalActPoms += parseInt(t.pomodoros) || 0;
      });
    });

    (archive.tasks || []).forEach((t) => {
      totalEstPoms += parseInt(t.estimatedPomodoros) || 0;
      totalActPoms += parseInt(t.pomodoros) || 0;
    });
  } catch (e) {
    console.error("Error calculating time accounting:", e);
  }

  const estHours = ((totalEstPoms * 25) / 60).toFixed(1);
  const actHours = ((totalActPoms * 25) / 60).toFixed(1);

  estEl.textContent = `${estHours}h (${totalEstPoms} poms)`;
  actEl.textContent = `${actHours}h (${totalActPoms} poms)`;

  if (totalEstPoms > 0) {
    const diff = totalActPoms - totalEstPoms;
    const pct = Math.round((diff / totalEstPoms) * 100);
    const sign = pct > 0 ? "+" : "";
    varEl.textContent = `${sign}${pct}% (${diff > 0 ? "over budget" : diff < 0 ? "under budget" : "on target"})`;
    varEl.className = `accounting-value ${pct > 15 ? "negative" : pct < -15 ? "neutral" : "positive"}`;
  } else {
    varEl.textContent = "No estimates set";
    varEl.className = "accounting-value neutral";
  }
}

/**
 * Export complete Time Audit Ledger as CSV
 */
export function exportTimeAuditCSV() {
  const tasks = [];
  try {
    const lists = JSON.parse(localStorage.getItem("pomodoro.lists") || "[]");
    const archive = JSON.parse(localStorage.getItem("pomodoro.archive") || '{"tasks":[]}');

    lists.forEach((list) => {
      (list.tasks || []).forEach((t) => {
        tasks.push({
          ...t,
          listName: list.name,
          status: t.completed ? "Completed" : "Active",
        });
      });
    });

    (archive.tasks || []).forEach((t) => {
      tasks.push({
        ...t,
        listName: "Archive",
        status: "Archived",
      });
    });
  } catch (e) {
    console.error("Failed to read tasks for time audit:", e);
  }

  const rows = [
    [
      "ID",
      "Task Name",
      "List",
      "Priority",
      "Estimated Pomodoros",
      "Actual Pomodoros",
      "Est. Minutes (25m)",
      "Actual Minutes",
      "Variance (Mins)",
      "Status",
      "Due Date",
      "Completed Date",
    ],
  ];

  tasks.forEach((t) => {
    const estPoms = parseInt(t.estimatedPomodoros) || 0;
    const actPoms = parseInt(t.pomodoros) || 0;
    const estMins = estPoms * 25;
    const actMins = actPoms * 25;
    const variance = actMins - estMins;

    rows.push([
      t.id,
      `"${(t.name || "").replace(/"/g, '""')}"`,
      `"${(t.listName || "").replace(/"/g, '""')}"`,
      t.priority || "medium",
      estPoms,
      actPoms,
      estMins,
      actMins,
      variance,
      t.status,
      t.dueDate || "",
      t.completedAt || "",
    ]);
  });

  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((row) => row.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `pomidor-time-audit-${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Render 7-day mood & bandwidth accounting in stats view
 */
function renderMoodHistory() {
  let section = document.getElementById("stats-mood-section");
  if (!section) {
    const statsAccounting = document.querySelector(".stats-accounting-section");
    if (!statsAccounting) return;
    section = document.createElement("div");
    section.id = "stats-mood-section";
    section.className = "stats-mood-section";
    statsAccounting.parentNode.insertBefore(section, statsAccounting);
  }

  let moodHistory = [];
  try {
    moodHistory = JSON.parse(localStorage.getItem("pomidor.moods") || "[]");
  } catch (e) {
    console.error("Failed to parse mood history for stats:", e);
  }

  // Generate last 7 days keys
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const dayName = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayNum = d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
    const entry = moodHistory.find((m) => m.date === key) || null;
    days.push({ key, dayName, dayNum, entry });
  }

  const loggedDays = days.filter((d) => d.entry);
  const avgEnergy = loggedDays.length
    ? (
        loggedDays.reduce((acc, d) => acc + (d.entry.energy || 3), 0) /
        loggedDays.length
      ).toFixed(1)
    : "—";

  const todayEntry = days[days.length - 1].entry;
  const currentMoodLabel = todayEntry ? todayEntry.mood : "Not assessed";

  const moodColors = {
    energized: "#f59e0b",
    focused: "#0ea5e9",
    neutral: "#10b981",
    fatigued: "#8b5cf6",
    overwhelmed: "#ef4444",
  };

  section.innerHTML = `
    <div class="accounting-header">
      <h3 class="stats-section-title">
        ${getIcon("flame", { size: 18 })}
        Mood & Bandwidth Accounting
      </h3>
      <span class="mood-stats-summary-pill">
        Avg Energy: <strong>${avgEnergy}${avgEnergy !== "—" ? "/5" : ""}</strong> • Today: <strong style="text-transform: capitalize;">${currentMoodLabel}</strong>
      </span>
    </div>
    <div class="stats-mood-strip">
      ${days
        .map((d) => {
          if (!d.entry) {
            return `
              <div class="stats-mood-day-card empty">
                <span class="stats-mood-day-name">${d.dayName}</span>
                <span class="stats-mood-day-date">${d.dayNum}</span>
                <div class="stats-mood-day-icon empty">—</div>
                <span class="stats-mood-day-label">No check-in</span>
              </div>
            `;
          }
          const iconName = `mood-${d.entry.mood}`;
          const color = moodColors[d.entry.mood] || "#10b981";
          return `
            <div class="stats-mood-day-card logged" style="--mood-day-color: ${color};">
              <span class="stats-mood-day-name">${d.dayName}</span>
              <span class="stats-mood-day-date">${d.dayNum}</span>
              <div class="stats-mood-day-icon" title="${d.entry.mood} (${d.entry.energy}/5)">
                ${getIcon(iconName, { size: 24 })}
              </div>
              <span class="stats-mood-day-label" style="text-transform: capitalize;">${d.entry.mood}</span>
              <span class="stats-mood-energy-pill">Energy: ${d.entry.energy}/5</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

/**
 * Get all stats (for export/display)
 */
export function getAllStats() {
  return { ...stats };
}
