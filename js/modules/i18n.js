// i18n — Internationalization module for Pomidor
// Supported languages: English (en), Russian (ru), Azerbaijani (az), Hebrew (he)
// Direction support: Hebrew (he) uses RTL (dir="rtl"), others use LTR (dir="ltr")

import en from "./locales/en.js";
import ru from "./locales/ru.js";
import az from "./locales/az.js";
import he from "./locales/he.js";

const translations = { en, ru, az, he };

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", appName: "Pomidor" },
  { code: "ru", label: "Русский", appName: "Помидор" },
  { code: "az", label: "Azərbaycanca", appName: "Pomidor" },
  { code: "he", label: "עברית", appName: "עגבנייה" },
];

let currentLang = localStorage.getItem("pomidor-lang") || "en";
if (!translations[currentLang]) {
  currentLang = "en";
}

export function t(key, fallback = "") {
  return translations[currentLang]?.[key] || translations.en[key] || fallback || key;
}

export function getLang() {
  return currentLang;
}

export function getAppName() {
  return t("appName") || "Pomidor";
}

export function getTomatoName() {
  return t("tomatoName") || "Pomidor";
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem("pomidor-lang", lang);

  const isRtl = lang === "he";
  document.documentElement.setAttribute("data-active-lang", lang);
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");

  applyTranslations();

  // Dispatch event for other components to react
  window.dispatchEvent(new CustomEvent("langchange", { detail: { lang, isRtl } }));
}

export function applyTranslations() {
  const isRtl = currentLang === "he";
  document.documentElement.setAttribute("data-active-lang", currentLang);
  document.documentElement.setAttribute("lang", currentLang);
  document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");

  // Update elements with data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      if (el.placeholder !== undefined) el.placeholder = text;
    } else if (el.tagName === "OPTION") {
      el.textContent = text;
    } else {
      el.textContent = text;
    }
  });

  // Update elements with data-i18n-placeholder
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.placeholder = t(key);
  });

  // Update elements with data-i18n-title
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    el.title = t(key);
  });

  // Update elements with data-i18n-aria-label
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    el.setAttribute("aria-label", t(key));
  });

  // Update brand titles
  document.querySelectorAll(".brand-app-name").forEach((el) => {
    el.textContent = getAppName();
  });

  // Update page title
  const appName = getAppName();
  const tagline = t("appTagline");
  document.title = `${appName} — ${tagline}`;

  // Sync settings dropdown if present
  const langSelect = document.getElementById("language-select");
  if (langSelect && langSelect.value !== currentLang) {
    langSelect.value = currentLang;
  }
}

export function initI18n() {
  const saved = localStorage.getItem("pomidor-lang");
  if (saved && translations[saved]) {
    currentLang = saved;
  }

  const isRtl = currentLang === "he";
  document.documentElement.setAttribute("data-active-lang", currentLang);
  document.documentElement.setAttribute("lang", currentLang);
  document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");

  const langSelect = document.getElementById("language-select");
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener("change", (e) => setLang(e.target.value));
  }

  applyTranslations();
}

export default {
  t,
  getLang,
  setLang,
  getAppName,
  getTomatoName,
  initI18n,
  applyTranslations,
  SUPPORTED_LANGUAGES,
};
