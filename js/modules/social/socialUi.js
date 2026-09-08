/**
 * socialUi.js — Accountability Lounge & Social Focus Squad UI
 * Double-bezel design, SVG icons only (zero emojis), live peer interactions.
 */

"use strict";

import { getIcon } from "../../utils/icons.js";
import { renderMascotSvg } from "../mascot/mascotSprites.js";
import {
  getActiveTenant,
  getAccountabilityBuddies,
  sendHighFive,
  sendNudge,
  joinFocusRoom,
  updateFocusStatus,
  updatePrivacySetting,
  getSocialActivity,
  switchTenant,
} from "./profileManager.js";
import { showSuccess } from "../toast.js";
import { escapeHtml } from "../../utils/sanitize.js";

const FOCUS_ROOMS = [
  { id: "room_deep_code", name: "Deep Code Chamber", desc: "Systems engineering, algorithms, compiler builds", mascot: "kip" },
  { id: "room_medical_lib", name: "Silent Medical Library", desc: "Neuroscience papers, spaced repetition, quiet study", mascot: "bolt" },
  { id: "room_design_lab", name: "Design Sprint Lab", desc: "Design tokens, wireframes, animation choreography", mascot: "pip" },
  { id: "room_ship_room", name: "Indie Ship Room", desc: "Landing pages, sprint launches, revenue tracking", mascot: "pomi" },
];

export function initSocialUi() {
  window.addEventListener("tenant-switched", () => {
    const container = document.getElementById("social-container");
    if (container && !container.classList.contains("hidden")) {
      renderSocialUi();
    }
  });

  window.addEventListener("social-activity-updated", () => {
    const container = document.getElementById("social-container");
    if (container && !container.classList.contains("hidden")) {
      renderSocialUi();
    }
  });
}

export function renderSocialUi() {
  const container = document.getElementById("social-container");
  if (!container) return;

  const current = getActiveTenant();
  const buddies = getAccountabilityBuddies();
  const activities = getSocialActivity();
  const privacy = current.privacySettings || {};

  container.innerHTML = `
    <div class="social-wrapper">
      <!-- 1. Hero Header & Active Profile -->
      <div class="social-header-card double-bezel-card">
        <div class="social-profile-main">
          <div class="social-avatar-wrap">
            <div class="social-mascot-frame" style="--accent-glow: ${current.accent}">
              ${renderMascotSvg(current.avatarMascot, "idle", 76)}
            </div>
            <span class="social-role-tag ${current.role}">${current.role.toUpperCase()}</span>
          </div>

          <div class="social-meta-wrap">
            <div class="social-title-line">
              <h2 class="social-user-name">${current.name}</h2>
              <span class="social-handle">${current.handle}</span>
            </div>
            <p class="social-user-bio">${current.bio}</p>

            <div class="social-rpg-badges">
              <span class="social-badge lvl">
                ${getIcon("sword", { size: 13 })} Level ${current.level} ${current.className}
              </span>
              <span class="social-badge streak">
                ${getIcon("flame", { size: 13 })} ${current.streak} Day Streak
              </span>
              <span class="social-badge hours">
                ${getIcon("clock", { size: 13 })} ${current.focusHours}h Focused
              </span>
              <span class="social-badge room">
                ${getIcon("castle", { size: 13 })} In: <strong>${current.room}</strong>
              </span>
            </div>
          </div>
        </div>

        <!-- Status Broadcast Bar -->
        <div class="social-status-broadcast">
          <label class="broadcast-label" for="social-status-input">
            ${getIcon("sparkles", { size: 14 })} <span>Squad Broadcast Status</span>
          </label>
          <div class="broadcast-input-group">
            <input 
              type="text" 
              id="social-status-input" 
              class="social-status-input" 
              value="${escapeHtml(current.status)}" 
              placeholder="What are you currently focusing on?"
              maxlength="120"
            />
            <button class="social-broadcast-btn" id="social-update-status-btn" title="Broadcast update to squad">
              ${getIcon("forward", { size: 14 })} <span>Broadcast</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Dual Column Layout: Focus Chambers & Privacy Control -->
      <div class="social-grid-two-col">
        <!-- Focus Chambers -->
        <div class="social-card double-bezel-card">
          <div class="card-title-row">
            <div class="title-with-icon">
              ${getIcon("castle", { size: 16 })}
              <h3>Shared Focus Chambers</h3>
            </div>
            <span class="chamber-active-pill">${current.room}</span>
          </div>
          <p class="card-subcopy">Synchronize your timer with peers working on similar craft</p>

          <div class="focus-rooms-grid">
            ${FOCUS_ROOMS.map((room) => {
              const isCurrent = current.room === room.name;
              // Find occupants
              const occupants = buddies.filter((b) => b.room === room.name && (b.privacySettings?.shareFocusRoom !== false));
              if (isCurrent) occupants.unshift(current);

              return `
                <div class="focus-room-card ${isCurrent ? "active-chamber" : ""}">
                  <div class="room-top">
                    <div class="room-mascot-preview">
                      ${renderMascotSvg(room.mascot, "idle", 34)}
                    </div>
                    <div class="room-info">
                      <h4 class="room-name">${room.name}</h4>
                      <p class="room-desc">${room.desc}</p>
                    </div>
                  </div>

                  <div class="room-bottom">
                    <div class="room-occupants">
                      <span class="occupant-count">
                        ${getIcon("users", { size: 12 })} ${occupants.length} focusing
                      </span>
                      <div class="occupant-avatars">
                        ${occupants.map((o) => `
                          <span class="occupant-mini-dot" title="${o.name} (${o.avatarMascot})">
                            ${renderMascotSvg(o.avatarMascot, "idle", 18)}
                          </span>
                        `).join("")}
                      </div>
                    </div>

                    ${
                      isCurrent
                        ? `<button class="room-join-btn current" disabled>${getIcon("check", { size: 13 })} Active</button>`
                        : `<button class="room-join-btn" data-room-name="${room.name}">${getIcon("portal", { size: 13 })} Join Room</button>`
                    }
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Privacy & Custom Access Matrix -->
        <div class="social-card double-bezel-card">
          <div class="card-title-row">
            <div class="title-with-icon">
              ${getIcon("shield", { size: 16 })}
              <h3>Tenant Privacy &amp; Visibility</h3>
            </div>
            <span class="privacy-scope-badge">Tenant Policy</span>
          </div>
          <p class="card-subcopy">Granularly choose what peers and accountability partners can see</p>

          <div class="privacy-toggles-list">
            <div class="privacy-item">
              <div class="privacy-meta">
                <span class="privacy-title">Share Daily Streak</span>
                <span class="privacy-desc">Allow squad members to see your active consistency streak</span>
              </div>
              <label class="switch">
                <input type="checkbox" class="social-privacy-toggle" data-privacy-key="shareStreak" ${privacy.shareStreak ? "checked" : ""} />
                <span class="slider round"></span>
              </label>
            </div>

            <div class="privacy-item">
              <div class="privacy-meta">
                <span class="privacy-title">Share Active Focus Task</span>
                <span class="privacy-desc">Broadcast your current todo item instead of generic private status</span>
              </div>
              <label class="switch">
                <input type="checkbox" class="social-privacy-toggle" data-privacy-key="shareCurrentTask" ${privacy.shareCurrentTask ? "checked" : ""} />
                <span class="slider round"></span>
              </label>
            </div>

            <div class="privacy-item">
              <div class="privacy-meta">
                <span class="privacy-title">Share Study Chamber</span>
                <span class="privacy-desc">Display which Focus Room you are currently occupying</span>
              </div>
              <label class="switch">
                <input type="checkbox" class="social-privacy-toggle" data-privacy-key="shareFocusRoom" ${privacy.shareFocusRoom ? "checked" : ""} />
                <span class="slider round"></span>
              </label>
            </div>

            <div class="privacy-item">
              <div class="privacy-meta">
                <span class="privacy-title">Share RPG Stats &amp; Badges</span>
                <span class="privacy-desc">Allow squad to inspect hero level, class, and achievements</span>
              </div>
              <label class="switch">
                <input type="checkbox" class="social-privacy-toggle" data-privacy-key="shareStats" ${privacy.shareStats ? "checked" : ""} />
                <span class="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Accountability Squad Buddies -->
      <div class="social-card double-bezel-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            ${getIcon("users", { size: 16 })}
            <h3>Accountability Squad</h3>
          </div>
          <span class="squad-counter-pill">${buddies.length} Peers Active</span>
        </div>
        <p class="card-subcopy">Send high-fives of encouragement or nudge your peers into focus</p>

        <div class="buddies-grid">
          ${buddies.map((buddy) => {
            const hasStreak = buddy.displayStreak !== null;
            return `
              <div class="buddy-card" style="--card-accent: ${buddy.accent}">
                <div class="buddy-top-row">
                  <div class="buddy-avatar-box">
                    ${renderMascotSvg(buddy.avatarMascot, "idle", 52)}
                  </div>
                  <div class="buddy-id-meta">
                    <div class="buddy-header-line">
                      <strong class="buddy-name">${buddy.name}</strong>
                      <span class="buddy-role-pill ${buddy.role}">${buddy.role.toUpperCase()}</span>
                    </div>
                    <span class="buddy-title-text">${buddy.title}</span>
                  </div>
                </div>

                <div class="buddy-status-box">
                  <div class="buddy-status-label">${getIcon("clock", { size: 12 })} Current Focus:</div>
                  <div class="buddy-status-content">${escapeHtml(buddy.displayTask)}</div>
                </div>

                <div class="buddy-metrics-row">
                  <span class="buddy-metric-item">
                    ${getIcon("castle", { size: 12 })} ${buddy.displayRoom}
                  </span>
                  <span class="buddy-metric-item">
                    ${getIcon("flame", { size: 12 })} ${hasStreak ? `${buddy.displayStreak}d Streak` : "Hidden"}
                  </span>
                  <span class="buddy-metric-item">
                    ${getIcon("sword", { size: 12 })} Lvl ${buddy.level}
                  </span>
                </div>

                <div class="buddy-actions-row">
                  <button class="buddy-action-btn highfive" data-highfive-id="${buddy.id}" title="Send High-Five">
                    ${getIcon("hand", { size: 13 })} <span>High-Five</span>
                  </button>
                  <button class="buddy-action-btn nudge" data-nudge-id="${buddy.id}" title="Send gentle focus nudge">
                    ${getIcon("zap", { size: 13 })} <span>Nudge</span>
                  </button>
                  <button class="buddy-action-btn impersonate" data-impersonate-id="${buddy.id}" title="Quickly switch to this persona">
                    ${getIcon("eye", { size: 13 })} <span>Switch</span>
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- 4. Real-Time Squad Activity Stream -->
      <div class="social-card double-bezel-card">
        <div class="card-title-row">
          <div class="title-with-icon">
            ${getIcon("activity", { size: 16 })}
            <h3>Live Squad Activity Stream</h3>
          </div>
          <span class="live-pulse-badge">
            <span class="live-dot"></span> Live Sync
          </span>
        </div>
        <p class="card-subcopy">Real-time interactions, pomodoro milestones, and accountability events</p>

        <div class="activity-feed-list">
          ${
            activities.length > 0
              ? activities.map((item) => `
                <div class="activity-row">
                  <div class="act-avatar-box">
                    ${renderMascotSvg(item.mascot || "pomi", "idle", 26)}
                  </div>
                  <div class="act-text-wrap">
                    <strong class="act-user">${item.user}</strong>
                    <span class="act-action">${item.action}</span>
                  </div>
                  <span class="act-time">${formatActivityTime(item.time)}</span>
                </div>
              `).join("")
              : `<p class="empty-hint">No squad activity recorded yet.</p>`
          }
        </div>
      </div>
    </div>
  `;

  bindSocialUiEvents(container);
}

function bindSocialUiEvents(container) {
  // Update broadcast status
  const statusInput = container.querySelector("#social-status-input");
  const updateBtn = container.querySelector("#social-update-status-btn");
  if (statusInput && updateBtn) {
    const handleUpdate = () => {
      const val = statusInput.value.trim();
      if (val) {
        updateFocusStatus(val);
      }
    };
    updateBtn.addEventListener("click", handleUpdate);
    statusInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleUpdate();
    });
  }

  // Join Room buttons
  container.querySelectorAll("[data-room-name]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const room = btn.dataset.roomName;
      if (room) joinFocusRoom(room);
    });
  });

  // Privacy toggles
  container.querySelectorAll(".social-privacy-toggle").forEach((toggle) => {
    toggle.addEventListener("change", () => {
      const key = toggle.dataset.privacyKey;
      const checked = toggle.checked;
      updatePrivacySetting(key, checked);
    });
  });

  // High-Five buttons
  container.querySelectorAll("[data-highfive-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.highfiveId;
      if (id) sendHighFive(id);
    });
  });

  // Nudge buttons
  container.querySelectorAll("[data-nudge-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.nudgeId;
      if (id) sendNudge(id);
    });
  });

  // Switch persona buttons
  container.querySelectorAll("[data-impersonate-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.impersonateId;
      if (id) switchTenant(id);
    });
  });
}

function formatActivityTime(timestamp) {
  if (!timestamp) return "just now";
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

