/**
 * profileManager.js — Multi-Tenant State Partitioning & Accountability Manager
 * Handles atomic tenant state swapping, buddy interactions, privacy visibility filters,
 * and shared focus room synchronization.
 */

"use strict";

import { TENANT_PERSONAS } from "./profileCatalog.js";
import { showSuccess, showInfo } from "../toast.js";
import { safeGet, safeSet, safeRemove } from "../../utils/storage.js";

const ACTIVE_TENANT_KEY = "pomidor.activeTenantId";
const TENANT_STORAGE_PREFIX = "pomidor.tenant.";
const SOCIAL_ACTIVITY_KEY = "pomidor.social.activity";

let activeTenantId = "tenant_novice";
let activityFeed = [];

function playSocialChime(freq = 660) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

/**
 * Initialize multi-tenant store and ensure all personas exist in isolated slots
 */
export function initProfileManager() {
  loadActiveTenantId();
  ensureSeedTenants();
  loadSocialActivity();

  // If active state is not yet populated, hydrate active tenant into runtime keys
  if (!localStorage.getItem("pomidor.hero") || !localStorage.getItem("pomodoro-lists")) {
    hydrateTenantToState(activeTenantId);
  }
}

function loadActiveTenantId() {
  try {
    activeTenantId = localStorage.getItem(ACTIVE_TENANT_KEY) || "tenant_novice";
  } catch {
    activeTenantId = "tenant_novice";
  }
}

function ensureSeedTenants() {
  for (const [id, persona] of Object.entries(TENANT_PERSONAS)) {
    const key = `${TENANT_STORAGE_PREFIX}${id}`;
    if (!localStorage.getItem(key)) {
      const tenantSnapshot = {
        profile: {
          id: persona.id,
          name: persona.name,
          handle: persona.handle,
          title: persona.title,
          role: persona.role,
          accent: persona.accent,
          avatarMascot: persona.avatarMascot,
          bio: persona.bio,
          status: persona.status,
          level: persona.level,
          className: persona.className,
          streak: persona.streak,
          focusHours: persona.focusHours,
          room: persona.room,
          privacySettings: { ...persona.privacySettings },
        },
        hero: persona.hero,
        lists: [
          {
            id: `list_${persona.id}_main`,
            name: `${persona.name.split(" ")[0]}'s Focus Tasks`,
            tasks: persona.tasks,
          },
        ],
        habits: persona.habits,
        vaultNotes: persona.vaultNotes,
        stats: persona.stats,
      };
      safeSet(key, tenantSnapshot);
    }
  }
}

function loadSocialActivity() {
  const stored = safeGet(SOCIAL_ACTIVITY_KEY, null);
  if (Array.isArray(stored)) {
    activityFeed = stored;
  } else {
    // Seed initial realistic social events
    activityFeed = [
      { id: "act_1", user: "Elena Rostova", action: "finished a 25m sprint on Raft consensus", time: Date.now() - 1000 * 60 * 14, mascot: "kip" },
      { id: "act_2", user: "Dr. Darius Vance", action: "reached a 32-day streak in Spaced Repetition", time: Date.now() - 1000 * 60 * 45, mascot: "bolt" },
      { id: "act_3", user: "Aiko Tanaka", action: "joined the Design Sprint Lab room", time: Date.now() - 1000 * 60 * 120, mascot: "pip" },
      { id: "act_4", user: "Leo Morales", action: "completed 3 product launch tasks", time: Date.now() - 1000 * 60 * 240, mascot: "pomi" },
    ];
    saveSocialActivity();
  }
}

function saveSocialActivity() {
  safeSet(SOCIAL_ACTIVITY_KEY, activityFeed.slice(0, 50));
}

export function getActiveTenant() {
  const key = `${TENANT_STORAGE_PREFIX}${activeTenantId}`;
  const snapshot = safeGet(key, null);
  if (snapshot?.profile) return snapshot.profile;
  return TENANT_PERSONAS[activeTenantId] || TENANT_PERSONAS.tenant_novice || TENANT_PERSONAS.tenant_admin;
}

export function getAllTenants() {
  return Object.keys(TENANT_PERSONAS).map((id) => {
    const key = `${TENANT_STORAGE_PREFIX}${id}`;
    const snap = safeGet(key, null);
    if (snap?.profile) return snap.profile;
    return TENANT_PERSONAS[id];
  });
}

/**
 * Perform atomic multi-tenant hot-swap
 * Saves current active runtime state to current tenant slot,
 * then hydrates target tenant snapshot into runtime keys.
 * @param {string} targetTenantId
 */
export function switchTenant(targetTenantId) {
  if (!TENANT_PERSONAS[targetTenantId]) return false;
  if (targetTenantId === activeTenantId) return true;

  // 1. Snapshot current active state into current tenant slot
  saveCurrentStateToTenant(activeTenantId);

  // 2. Hydrate target tenant state into active runtime keys
  hydrateTenantToState(targetTenantId);

  const prevId = activeTenantId;
  activeTenantId = targetTenantId;
  localStorage.setItem(ACTIVE_TENANT_KEY, activeTenantId);

  const newProfile = getActiveTenant();
  showSuccess(`Impersonation active: Switched to ${newProfile.name} (${newProfile.role.toUpperCase()})`);

  playSocialChime(580);

  // Log to social activity feed
  activityFeed.unshift({
    id: `sw_${Date.now()}`,
    user: newProfile.name,
    action: `switched active session (${newProfile.title})`,
    time: Date.now(),
    mascot: newProfile.avatarMascot,
  });
  saveSocialActivity();

  // Dispatch event for UI updates across all components
  window.dispatchEvent(
    new CustomEvent("tenant-switched", {
      detail: {
        activeTenantId,
        previousTenantId: prevId,
        profile: newProfile,
      },
    })
  );

  return true;
}

/**
 * Snapshot current runtime storage keys into tenant's isolated slot
 */
function saveCurrentStateToTenant(tenantId) {
  try {
    const key = `${TENANT_STORAGE_PREFIX}${tenantId}`;
    const existing = safeGet(key, {});

    const snapshot = {
      ...existing,
      hero: safeGet("pomidor.hero", {}),
      lists: safeGet("pomodoro-lists", []),
      habits: safeGet("pomodoro-habits", []),
      vaultNotes: safeGet("pomodoro-vault-notes", []),
      stats: safeGet("pomodoro-stats", {}),
    };

    safeSet(key, snapshot);
  } catch (e) {
    console.warn("Failed to snapshot tenant state:", e);
  }
}

/**
 * Hydrate tenant snapshot from isolated slot into active runtime keys
 */
function hydrateTenantToState(tenantId) {
  try {
    const key = `${TENANT_STORAGE_PREFIX}${tenantId}`;
    const snap = safeGet(key, null);
    if (!snap) return;

    if (snap.hero) safeSet("pomidor.hero", snap.hero);
    if (snap.lists) safeSet("pomodoro-lists", snap.lists);
    if (snap.habits) safeSet("pomodoro-habits", snap.habits);
    if (snap.vaultNotes) safeSet("pomodoro-vault-notes", snap.vaultNotes);
    if (snap.stats) safeSet("pomodoro-stats", snap.stats);

    if (snap.profile?.avatarMascot) {
      try {
        localStorage.setItem("pomidor.activeMascot", snap.profile.avatarMascot);
      } catch {}
    }
  } catch (e) {
    console.warn("Failed to hydrate tenant state:", e);
  }
}

/**
 * Reset a tenant's state back to default seed template
 */
export function resetTenantState(tenantId) {
  const seed = TENANT_PERSONAS[tenantId];
  if (!seed) return;

  const key = `${TENANT_STORAGE_PREFIX}${tenantId}`;
  safeRemove(key);
  ensureSeedTenants();

  if (activeTenantId === tenantId) {
    hydrateTenantToState(tenantId);
  }

  showInfo(`Reset workspace data for ${seed.name}.`);
  window.dispatchEvent(new CustomEvent("tenant-switched", { detail: { activeTenantId } }));
}

/* ─── Social & Accountability Interactions ───────────────────── */

export function getAccountabilityBuddies() {
  const current = getActiveTenant();
  return getAllTenants()
    .filter((t) => t.id !== current.id)
    .map((buddy) => {
      const priv = buddy.privacySettings || {};
      return {
        ...buddy,
        displayStreak: priv.shareStreak ? buddy.streak : null,
        displayTask: priv.shareCurrentTask ? buddy.status : "Focusing in private session",
        displayRoom: priv.shareFocusRoom ? buddy.room : "Private Room",
      };
    });
}

export function sendHighFive(targetTenantId) {
  const sender = getActiveTenant();
  const target = getAllTenants().find((t) => t.id === targetTenantId);
  if (!target) return;

  playSocialChime(780);

  activityFeed.unshift({
    id: `hf_${Date.now()}`,
    user: sender.name,
    action: `sent a High-Five of Encouragement to ${target.name}!`,
    time: Date.now(),
    mascot: sender.avatarMascot,
  });
  saveSocialActivity();

  showSuccess(`Sent a High-Five to ${target.name}! Squad synergy boosted!`);
  window.dispatchEvent(new CustomEvent("social-activity-updated"));
}

export function sendNudge(targetTenantId) {
  const sender = getActiveTenant();
  const target = getAllTenants().find((t) => t.id === targetTenantId);
  if (!target) return;

  playSocialChime(520);

  activityFeed.unshift({
    id: `nd_${Date.now()}`,
    user: sender.name,
    action: `nudged ${target.name} to start their next focus sprint!`,
    time: Date.now(),
    mascot: sender.avatarMascot,
  });
  saveSocialActivity();

  showInfo(`Sent a gentle accountability nudge to ${target.name}.`);
  window.dispatchEvent(new CustomEvent("social-activity-updated"));
}

export function joinFocusRoom(roomName) {
  const tenant = getActiveTenant();
  tenant.room = roomName;

  // Persist updated room in snapshot
  const key = `${TENANT_STORAGE_PREFIX}${tenant.id}`;
  const snap = safeGet(key, {});
  if (snap.profile) {
    snap.profile.room = roomName;
    safeSet(key, snap);
  }

  playSocialChime(640);

  activityFeed.unshift({
    id: `rm_${Date.now()}`,
    user: tenant.name,
    action: `joined the ${roomName} study chamber`,
    time: Date.now(),
    mascot: tenant.avatarMascot,
  });
  saveSocialActivity();

  showSuccess(`Joined ${roomName}! Focus mode synchronized.`);
  window.dispatchEvent(new CustomEvent("social-activity-updated"));
}

export function updateFocusStatus(newStatus) {
  const tenant = getActiveTenant();
  tenant.status = newStatus;

  const key = `${TENANT_STORAGE_PREFIX}${tenant.id}`;
  const snap = safeGet(key, {});
  if (snap.profile) {
    snap.profile.status = newStatus;
    safeSet(key, snap);
  }

  showSuccess("Focus status updated across accountability squad.");
  window.dispatchEvent(new CustomEvent("social-activity-updated"));
}

export function updatePrivacySetting(settingKey, value) {
  const tenant = getActiveTenant();
  if (!tenant.privacySettings) tenant.privacySettings = {};
  tenant.privacySettings[settingKey] = value;

  const key = `${TENANT_STORAGE_PREFIX}${tenant.id}`;
  const snap = safeGet(key, {});
  if (snap.profile) {
    snap.profile.privacySettings = tenant.privacySettings;
    safeSet(key, snap);
  }

  showInfo(`Privacy setting updated: ${settingKey} = ${value}`);
  window.dispatchEvent(new CustomEvent("social-activity-updated"));
}

export function getSocialActivity() {
  return activityFeed.slice(0, 20);
}
