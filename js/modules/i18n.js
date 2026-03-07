// i18n — Internationalization module for Pomidor
// Currently supports: English (en), Russian (ru)
// More languages can be added by extending the `translations` object.

const translations = {
  en: {
    // Settings
    settings: "Settings",
    language: "Language",
    moreLangsComing: "More languages coming soon",
    appTheme: "App Theme",
    modern: "Modern",
    legalPad: "Legal Pad (Legacy)",
    midnight: "Midnight",
    ocean: "Ocean",
    timerStyle: "Timer Style",
    classic: "Classic",
    modernTimer: "Modern",
    animationStyle: "Animation Style",
    timerPresets: "Timer Presets",
    customDuration: "Custom Duration",
    notifications: "Notifications",
    enableNotifications: "Enable Notifications",
    volume: "Volume",
    exportData: "Export",
    importData: "Import",
    darkMode: "Toggle dark mode",
    openSettings: "Open settings",

    // Timer
    session: "Session",
    break: "Break",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    skip: "Skip",
    focusMode: "Focus Mode",

    // Todo
    todoLists: "To-Do Lists",
    newList: "New List",
    newTask: "New Task",
    addTask: "Add Task",
    priority: "Priority",
    high: "High",
    medium: "Medium",
    low: "Low",
    dueDate: "Due Date",
    pomodoroEstimate: "Pomodoro Estimate",
    search: "Search tasks...",
    archive: "Archive",
    all: "All",
    active: "Active",
    completed: "Completed",

    // Calendar
    calendar: "Calendar",
    today: "Today",
    monthView: "Month",
    weekView: "Week",

    // Stats
    statistics: "Statistics",
    week: "Week",
    month: "Month",
    allTime: "All Time",
    pomodoros: "Pomodoros",
    tasks: "Tasks",
    streak: "Streak",
    focusTime: "Focus Time",
    dailyGoal: "Daily Goal",
    bestDay: "Best Day",
    avgDaily: "Avg Daily",
    goalCompletion: "Goal Completion",
    weeklyTrend: "Weekly Trend",
    activityHeatmap: "Activity",
    recentSessions: "Recent Sessions",

    // Achievements
    achievements: "Achievements",
    firstSteps: "First Steps",
    gettingStarted: "Getting Started",
    focused: "Focused",
    centurion: "Centurion",
    weekWarrior: "Week Warrior",
    monthMaster: "Month Master",
    taskCrusher: "Task Crusher",
    earlyBird: "Early Bird",
    nightOwl: "Night Owl",
    perfectDay: "Perfect Day",
    perfectWeek: "Perfect Week",

    // Pomodoro FAQ
    whatIsPomodoro: "What is the Pomodoro Technique?",
    howToUse: "How to Use the Pomodoro Technique?",
    watchVideo: "Watch this video to learn more about The Pomodoro Technique",

    // Brand
    tagline: "Own your time, own your data",
    madeWith: "Made with 🍅 by open source contributors",
  },
  ru: {
    // Settings
    settings: "Настройки",
    language: "Язык",
    moreLangsComing: "Больше языков скоро",
    appTheme: "Тема приложения",
    modern: "Современная",
    legalPad: "Блокнот (классика)",
    midnight: "Полночь",
    ocean: "Океан",
    timerStyle: "Стиль таймера",
    classic: "Классический",
    modernTimer: "Современный",
    animationStyle: "Стиль анимации",
    timerPresets: "Шаблоны таймера",
    customDuration: "Своя длительность",
    notifications: "Уведомления",
    enableNotifications: "Включить уведомления",
    volume: "Громкость",
    exportData: "Экспорт",
    importData: "Импорт",
    darkMode: "Тёмная тема",
    openSettings: "Открыть настройки",

    // Timer
    session: "Сессия",
    break: "Перерыв",
    start: "Старт",
    pause: "Пауза",
    reset: "Сброс",
    skip: "Пропустить",
    focusMode: "Режим фокуса",

    // Todo
    todoLists: "Списки задач",
    newList: "Новый список",
    newTask: "Новая задача",
    addTask: "Добавить задачу",
    priority: "Приоритет",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
    dueDate: "Срок",
    pomodoroEstimate: "Оценка помидоров",
    search: "Поиск задач...",
    archive: "Архив",
    all: "Все",
    active: "Активные",
    completed: "Завершённые",

    // Calendar
    calendar: "Календарь",
    today: "Сегодня",
    monthView: "Месяц",
    weekView: "Неделя",

    // Stats
    statistics: "Статистика",
    week: "Неделя",
    month: "Месяц",
    allTime: "За всё время",
    pomodoros: "Помидоры",
    tasks: "Задачи",
    streak: "Серия",
    focusTime: "Время фокуса",
    dailyGoal: "Дневная цель",
    bestDay: "Лучший день",
    avgDaily: "В среднем за день",
    goalCompletion: "Выполнение цели",
    weeklyTrend: "Недельный тренд",
    activityHeatmap: "Активность",
    recentSessions: "Последние сессии",

    // Achievements
    achievements: "Достижения",
    firstSteps: "Первые шаги",
    gettingStarted: "Начало пути",
    focused: "Сфокусирован",
    centurion: "Центурион",
    weekWarrior: "Воин недели",
    monthMaster: "Мастер месяца",
    taskCrusher: "Сокрушитель задач",
    earlyBird: "Ранняя пташка",
    nightOwl: "Полуночник",
    perfectDay: "Идеальный день",
    perfectWeek: "Идеальная неделя",

    // Pomodoro FAQ
    whatIsPomodoro: "Что такое техника Помидора?",
    howToUse: "Как использовать технику Помидора?",
    watchVideo: "Посмотрите видео, чтобы узнать больше о технике Помидора",

    // Brand
    tagline: "Владей своим временем, владей своими данными",
    madeWith: "Сделано с 🍅 участниками с открытым кодом",
  },
};

let currentLang = localStorage.getItem("pomidor-lang") || "en";

export function t(key) {
  return translations[currentLang]?.[key] || translations.en[key] || key;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("pomidor-lang", lang);
  document.documentElement.setAttribute("data-active-lang", lang);
  document.documentElement.setAttribute("lang", lang);
  applyTranslations();
  // Dispatch event for modules to react
  window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (el.placeholder !== undefined && el.tagName === "INPUT") {
      el.placeholder = text;
    } else if (el.tagName === "OPTION") {
      el.textContent = text;
    } else {
      el.textContent = text;
    }
  });

  // Update brand images based on language
  const enPics = document.querySelectorAll(
    ".brand-banner picture:not(.brand-hero-ru)",
  );
  const ruPics = document.querySelectorAll(".brand-hero-ru");

  enPics.forEach((p) => (p.style.display = currentLang === "en" ? "" : "none"));
  ruPics.forEach((p) => (p.style.display = currentLang === "ru" ? "" : "none"));

  // Update page title
  document.title =
    currentLang === "ru" ? "Помидор — Pomidor" : "Pomidor — Помидор";
}

export function initI18n() {
  const saved = localStorage.getItem("pomidor-lang");
  if (saved && translations[saved]) {
    currentLang = saved;
  }

  document.documentElement.setAttribute("data-active-lang", currentLang);
  document.documentElement.setAttribute("lang", currentLang);

  const langSelect = document.getElementById("language-select");
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener("change", (e) => setLang(e.target.value));
  }

  applyTranslations();
}

export default { t, getLang, setLang, initI18n, applyTranslations };
