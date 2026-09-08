/**
 * storage.js — Resilient LocalStorage Wrapper
 * Handles corrupted JSON parsing, quota exhaustion (QuotaExceededError),
 * and private browsing restrictions safely without application crashes.
 */

"use strict";

/**
 * Checks if localStorage is supported and accessible
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = "__pomidor_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely retrieve and parse JSON data from localStorage
 * @param {string} key
 * @param {any} fallback
 * @returns {any}
 */
export function safeGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] Corrupt or unparseable JSON for key "${key}", falling back:`, error);
    return fallback;
  }
}

/**
 * Safely serialize and store data in localStorage
 * @param {string} key
 * @param {any} value
 * @returns {boolean} true on success, false on quota/write failure
 */
export function safeSet(key, value) {
  try {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`[storage] Failed to write key "${key}" (QuotaExceeded or disabled):`, error);
    window.dispatchEvent(
      new CustomEvent("storage-error", {
        detail: { key, error: error.name || "StorageError" },
      })
    );
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * @param {string} key
 */
export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`[storage] Failed to remove key "${key}":`, error);
  }
}
