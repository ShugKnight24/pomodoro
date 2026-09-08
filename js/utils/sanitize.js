/**
 * sanitize.js — Centralized Security & HTML Sanitization Utilities
 * Eliminates duplicate escapeHtml implementations and prevents XSS vulnerabilities.
 */

"use strict";

/**
 * Escapes HTML entities to prevent Cross-Site Scripting (XSS)
 * @param {any} str - Input to escape
 * @returns {string} Sanitized string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Strips HTML tags completely for plain-text contexts
 * @param {string} str
 * @returns {string} Plain text
 */
export function stripHtml(str) {
  if (!str) return "";
  return String(str).replace(/<[^>]*>/g, "");
}

/**
 * Sanitizes user input string: trims and strips control chars
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
export function sanitizeInput(str, maxLen = 200) {
  if (!str) return "";
  return String(str)
    .trim()
    .slice(0, maxLen)
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, "");
}
