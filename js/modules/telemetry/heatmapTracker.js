/**
 * heatmapTracker.js — Interaction Heatmap & Click Coordinate Tracking Engine
 * Records normalized (x,y) click positions, scroll milestones, and view dwell time.
 * Includes native HTML5 Canvas radial blur density renderer.
 */

"use strict";

import { safeGet, safeSet, safeRemove } from "../../utils/storage.js";
import { getActiveTenant } from "../social/profileManager.js";

const HEATMAP_STORAGE_KEY = "pomidor.telemetry.heatmaps";
const MAX_HEATMAP_POINTS = 500;

let clickPoints = [];
let currentView = "pomodoro";
let viewStartTime = Date.now();
const maxScrollDepthByView = {};

/**
 * Initialize heatmap tracker from storage
 */
export function initHeatmapTracker() {
  loadHeatmapData();
  bindScrollTracking();
}

function loadHeatmapData() {
  const loaded = safeGet(HEATMAP_STORAGE_KEY, null);
  if (Array.isArray(loaded) && loaded.length > 0) {
    clickPoints = loaded;
  } else {
    clickPoints = generateSeedMultiUserPoints();
    saveHeatmapData();
  }
}

function saveHeatmapData() {
  if (clickPoints.length > MAX_HEATMAP_POINTS) {
    clickPoints = clickPoints.slice(-MAX_HEATMAP_POINTS);
  }
  safeSet(HEATMAP_STORAGE_KEY, clickPoints);
}

function generateSeedMultiUserPoints() {
  const seeds = [];
  const now = Date.now();

  const personas = [
    {
      id: "tenant_admin",
      name: "Alexander Wright",
      role: "admin",
      points: [
        { x: 740, y: 140, relX: 0.74, relY: 0.175, docX: 740, docY: 140, view: "admin", selector: "#admin-open-heatmap-btn", label: "Launch Heatmap Overlay" },
        { x: 280, y: 320, relX: 0.28, relY: 0.4, docX: 280, docY: 320, view: "admin", selector: ".tenant-card", label: "Elena Rostova" },
        { x: 550, y: 180, relX: 0.55, relY: 0.225, docX: 550, docY: 180, view: "stats", selector: "#stats-export-telemetry-btn", label: "Export JSON" },
        { x: 920, y: 45, relX: 0.92, relY: 0.056, docX: 920, docY: 45, view: "pomodoro", selector: "#theme-toggle", label: "Theme Switcher" },
        { x: 450, y: 310, relX: 0.45, relY: 0.387, docX: 450, docY: 310, view: "admin", selector: ".impersonate-btn", label: "Impersonate" },
      ],
    },
    {
      id: "tenant_elena",
      name: "Elena Rostova",
      role: "staff_eng",
      points: [
        { x: 310, y: 220, relX: 0.31, relY: 0.275, docX: 310, docY: 220, view: "kanban", selector: ".kanban-column", label: "In Progress" },
        { x: 420, y: 290, relX: 0.42, relY: 0.362, docX: 420, docY: 290, view: "kanban", selector: ".kanban-card", label: "Refactor Telemetry Service" },
        { x: 180, y: 160, relX: 0.18, relY: 0.2, docX: 180, docY: 160, view: "kanban", selector: "#kanban-add-column", label: "Add Column" },
        { x: 500, y: 400, relX: 0.5, relY: 0.5, docX: 500, docY: 400, view: "pomodoro", selector: "#start-stop-btn", label: "Start Timer" },
        { x: 620, y: 180, relX: 0.62, relY: 0.225, docX: 620, docY: 180, view: "kanban", selector: ".kanban-board-tab", label: "Architecture Sprint" },
      ],
    },
    {
      id: "tenant_darius",
      name: "Darius Vance",
      role: "resident",
      points: [
        { x: 500, y: 400, relX: 0.5, relY: 0.5, docX: 500, docY: 400, view: "pomodoro", selector: "#start-stop-btn", label: "Start Timer" },
        { x: 450, y: 480, relX: 0.45, relY: 0.6, docX: 450, docY: 480, view: "pomodoro", selector: "#reset-btn", label: "Reset" },
        { x: 380, y: 210, relX: 0.38, relY: 0.262, docX: 380, docY: 210, view: "stats", selector: ".stats-metric-card", label: "Total Focus Hours" },
        { x: 610, y: 250, relX: 0.61, relY: 0.312, docX: 610, docY: 250, view: "stats", selector: ".activity-chart", label: "Hourly Focus Velocity" },
      ],
    },
    {
      id: "tenant_aiko",
      name: "Aiko Tanaka",
      role: "design_lead",
      points: [
        { x: 340, y: 180, relX: 0.34, relY: 0.225, docX: 340, docY: 180, view: "hero", selector: ".hero-tab-btn", label: "Quests & Boss Arena" },
        { x: 490, y: 350, relX: 0.49, relY: 0.437, docX: 490, docY: 350, view: "hero", selector: ".slot-item-card", label: "Main Weapon" },
        { x: 520, y: 280, relX: 0.52, relY: 0.35, docX: 520, docY: 280, view: "tactics", selector: ".tactics-node", label: "Boss Chamber 1" },
        { x: 260, y: 310, relX: 0.26, relY: 0.387, docX: 260, docY: 310, view: "todo", selector: ".energy-dot-btn", label: "High Energy" },
      ],
    },
    {
      id: "tenant_leo",
      name: "Leo Sterling",
      role: "founder",
      points: [
        { x: 190, y: 160, relX: 0.19, relY: 0.2, docX: 190, docY: 160, view: "vault", selector: "#vault-new-note", label: "New Note" },
        { x: 320, y: 240, relX: 0.32, relY: 0.3, docX: 320, docY: 240, view: "vault", selector: ".vault-note-item", label: "Pitch Deck Outline" },
        { x: 410, y: 300, relX: 0.41, relY: 0.375, docX: 410, docY: 300, view: "social", selector: ".room-join-btn", label: "Deep Work Sanctum" },
        { x: 500, y: 400, relX: 0.5, relY: 0.5, docX: 500, docY: 400, view: "pomodoro", selector: "#start-stop-btn", label: "Start Timer" },
      ],
    },
    {
      id: "tenant_novice",
      name: "You",
      role: "user",
      points: [
        { x: 500, y: 400, relX: 0.5, relY: 0.5, docX: 500, docY: 400, view: "pomodoro", selector: "#start-stop-btn", label: "Start Timer" },
        { x: 220, y: 290, relX: 0.22, relY: 0.362, docX: 220, docY: 290, view: "todo", selector: ".task-checkbox", label: "Complete tutorial" },
        { x: 80, y: 550, relX: 0.08, relY: 0.687, docX: 80, docY: 550, view: "pomodoro", selector: "#companion-avatar-wrap", label: "Pomi Mascot" },
      ],
    },
  ];

  for (const p of personas) {
    p.points.forEach((pt, idx) => {
      seeds.push({
        ...pt,
        trafficType: "human",
        botScore: 0,
        tenantId: p.id,
        tenantName: p.name,
        tenantRole: p.role,
        timestamp: now - (idx * 60000 + 1000),
      });
    });
  }

  return seeds;
}

/**
 * Set active view for contextual heatmap clustering
 * @param {string} view
 */
export function setActiveView(view) {
  if (currentView !== view) {
    const dwellMs = Date.now() - viewStartTime;
    currentView = view;
    viewStartTime = Date.now();
    return dwellMs;
  }
  return 0;
}

export function getActiveView() {
  return currentView;
}

/**
 * Record click or tap event coordinates and metadata
 * @param {MouseEvent|PointerEvent} e
 * @param {string} trafficType - 'human' | 'suspicious' | 'bot'
 * @param {number} botScore
 */
export function recordClick(e, trafficType = "human", botScore = 0) {
  if (!e) return null;

  const width = window.innerWidth || document.documentElement.clientWidth || 1000;
  const height = window.innerHeight || document.documentElement.clientHeight || 800;

  // Normalized relative coordinates (0.0 to 1.0)
  const relX = Math.min(1, Math.max(0, e.clientX / width));
  const relY = Math.min(1, Math.max(0, e.clientY / height));

  // Absolute document coordinates (including scroll)
  const docX = e.pageX || e.clientX + (window.scrollX || window.pageXOffset || 0);
  const docY = e.pageY || e.clientY + (window.scrollY || window.pageYOffset || 0);

  // Inspect target element
  const target = e.target;
  let selector = "";
  let label = "";

  if (target && target instanceof Element) {
    selector = buildElementSelector(target);
    label = (target.getAttribute("aria-label") || target.title || target.innerText || target.tagName)
      .trim()
      .slice(0, 45);
  }

  let tenantId = "tenant_novice";
  let tenantName = "You";
  let tenantRole = "user";
  try {
    const t = getActiveTenant();
    if (t) {
      tenantId = t.id || tenantId;
      tenantName = t.name || tenantName;
      tenantRole = t.role || tenantRole;
    }
  } catch {}

  const point = {
    x: Math.round(e.clientX),
    y: Math.round(e.clientY),
    relX: Number(relX.toFixed(4)),
    relY: Number(relY.toFixed(4)),
    docX: Math.round(docX),
    docY: Math.round(docY),
    view: currentView,
    selector,
    label,
    trafficType,
    botScore,
    tenantId,
    tenantName,
    tenantRole,
    timestamp: Date.now(),
  };

  clickPoints.push(point);
  saveHeatmapData();

  return point;
}

/**
 * Construct compact, meaningful CSS selector for click hotspot analysis
 */
function buildElementSelector(el) {
  if (el.id) return `#${el.id}`;

  const viewAttr = el.getAttribute("data-view");
  if (viewAttr) return `[data-view="${viewAttr}"]`;

  const role = el.getAttribute("role");
  const testId = el.getAttribute("data-testid");
  if (testId) return `[data-testid="${testId}"]`;

  const tag = el.tagName.toLowerCase();
  const classList = Array.from(el.classList).filter((c) => !c.startsWith("is-") && !c.startsWith("animate-"));
  if (classList.length > 0) {
    return `${tag}.${classList.slice(0, 2).join(".")}`;
  }

  return tag;
}

/**
 * Bind passive scroll listener to track maximum scroll depth per view
 */
function bindScrollTracking() {
  let scrollTimeout = null;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight > 0) {
          const depthPct = Math.min(100, Math.round(((window.scrollY || 0) / totalHeight) * 100));
          maxScrollDepthByView[currentView] = Math.max(maxScrollDepthByView[currentView] || 0, depthPct);
        }
      }, 200);
    },
    { passive: true }
  );
}

export function getMaxScrollDepth(view = currentView) {
  return maxScrollDepthByView[view] || 0;
}

export function getHeatmapPoints(filter = {}) {
  let list = [...clickPoints];
  if (filter.view && filter.view !== "all") {
    list = list.filter((p) => p.view === filter.view);
  }
  if (filter.trafficType && filter.trafficType !== "all") {
    list = list.filter((p) => p.trafficType === filter.trafficType);
  }
  if (filter.tenantId && filter.tenantId !== "all") {
    list = list.filter((p) => p.tenantId === filter.tenantId);
  }
  return list;
}

export function clearHeatmapPoints() {
  clickPoints = [];
  safeRemove(HEATMAP_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("heatmap-data-updated"));
}

/**
 * Aggregate top click hotspots across elements
 * @param {number} limit
 */
export function getTopHotspots(limit = 6) {
  const counts = {};
  const labels = {};

  for (const p of clickPoints) {
    const key = p.selector || p.label || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    if (p.label && !labels[key]) labels[key] = p.label;
  }

  const sorted = Object.entries(counts)
    .map(([selector, count]) => ({
      selector,
      label: labels[selector] || selector,
      count,
      percent: clickPoints.length ? Math.round((count / clickPoints.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, limit);
}

/**
 * Draw density heatmap onto an HTML5 canvas
 * @param {HTMLCanvasElement} canvas
 * @param {Array} points
 * @param {Object} options
 */
export function renderHeatmapOnCanvas(canvas, points, options = {}) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if (!points || points.length === 0) return;

  const radius = options.radius || 28;
  const intensity = options.intensity || 0.7;

  // Use an offscreen canvas for radial density accumulation
  const offscreen = document.createElement("canvas");
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  // Create base radial stamp
  const stamp = document.createElement("canvas");
  stamp.width = radius * 2;
  stamp.height = radius * 2;
  const stampCtx = stamp.getContext("2d");
  if (stampCtx) {
    const radGrad = stampCtx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    radGrad.addColorStop(0, `rgba(0, 0, 0, ${intensity})`);
    radGrad.addColorStop(0.5, `rgba(0, 0, 0, ${intensity * 0.5})`);
    radGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    stampCtx.fillStyle = radGrad;
    stampCtx.fillRect(0, 0, radius * 2, radius * 2);
  }

  // Stamp points onto offscreen alpha mask
  for (const pt of points) {
    const x = pt.relX * width;
    const y = pt.relY * height;
    offCtx.drawImage(stamp, x - radius, y - radius);
  }

  // Map alpha values to color gradient lookup
  const colorMap = createColorGradient(options.trafficType);
  const imgData = offCtx.getImageData(0, 0, width, height);
  const pixels = imgData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha > 0) {
      const colorIdx = Math.min(255, alpha) * 4;
      pixels[i] = colorMap[colorIdx]; // R
      pixels[i + 1] = colorMap[colorIdx + 1]; // G
      pixels[i + 2] = colorMap[colorIdx + 2]; // B
      pixels[i + 3] = Math.min(240, Math.floor(alpha * 1.2)); // A
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Generate a 256-step RGBA color gradient palette
 * @param {string} trafficType
 */
function createColorGradient(trafficType = "all") {
  const gradCanvas = document.createElement("canvas");
  gradCanvas.width = 256;
  gradCanvas.height = 1;
  const ctx = gradCanvas.getContext("2d");
  if (!ctx) return new Uint8ClampedArray(1024);

  const grad = ctx.createLinearGradient(0, 0, 256, 0);

  if (trafficType === "bot") {
    // Magenta/Purple palette for bot traffic
    grad.addColorStop(0.0, "rgba(147, 51, 234, 0.0)");
    grad.addColorStop(0.2, "rgba(168, 85, 247, 0.6)");
    grad.addColorStop(0.5, "rgba(236, 72, 153, 0.85)");
    grad.addColorStop(0.8, "rgba(244, 63, 94, 0.95)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 1.0)");
  } else {
    // Thermal spectrum: Cyan -> Emerald -> Amber -> Red -> White
    grad.addColorStop(0.0, "rgba(6, 182, 212, 0.0)");
    grad.addColorStop(0.25, "rgba(14, 165, 233, 0.7)");
    grad.addColorStop(0.5, "rgba(16, 185, 129, 0.85)");
    grad.addColorStop(0.75, "rgba(245, 158, 11, 0.95)");
    grad.addColorStop(0.9, "rgba(239, 68, 68, 1.0)");
    grad.addColorStop(1.0, "rgba(255, 255, 255, 1.0)");
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);
  return ctx.getImageData(0, 0, 256, 1).data;
}
