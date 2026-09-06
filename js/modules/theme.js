import { getIcon } from "../utils/icons.js";

const THEME_KEY = "pomodoro-theme";

export function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");

  // Load saved theme, or respect system preference, or default to light
  const saved = localStorage.getItem(THEME_KEY);
  const systemPrefersDark = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const savedTheme = saved || (systemPrefersDark ? "dark" : "light");
  applyTheme(savedTheme);

  // Toggle theme on button click
  themeToggle?.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);

    // Add a nice animation to the button
    themeToggle.style.transform = "rotate(360deg) scale(1.2)";
    setTimeout(() => {
      themeToggle.style.transform = "";
    }, 300);
  });

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", (e) => {
    // Only apply system preference if user hasn't manually set theme
    if (!localStorage.getItem(THEME_KEY)) {
      applyTheme(e.matches ? "dark" : "light");
    }
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);

  // Update theme toggle icon
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.innerHTML =
      theme === "dark"
        ? getIcon("sun", { size: 18 })
        : getIcon("moon", { size: 18 });
  }
}
