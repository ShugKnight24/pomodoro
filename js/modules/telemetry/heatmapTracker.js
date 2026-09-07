/**
 * heatmapTracker.js — Interaction Heatmap & Click Coordinate Tracking Engine
 * Records normalized (x,y) click positions, scroll milestones, and view dwell time.
 * Includes native HTML5 Canvas radial blur density renderer.
 */

"use strict";

const HEATMAP_STORAGE_KEY = "pomidor.telemetry.heatmaps";
const MAX_HEATMAP_POINTS = 500;

let clickPoints = [];
let currentView = "pomodoro";
let viewStartTime = Date.now();
const maxScrollDepthByView = {};

/**
 * Initialize heatmap tracker from localStorage
 */
export function initHeatmapTracker() {
  loadHeatmapData();
  bindScrollTracking();
}

function loadHeatmapData() {
  try {
    const raw = localStorage.getItem(HEATMAP_STORAGE_KEY);
    if (raw) {
      clickPoints = JSON.parse(raw);
    }
  } catch {
    clickPoints = [];
  }
}

function saveHeatmapData() {
  try {
    if (clickPoints.length > MAX_HEATMAP_POINTS) {
      clickPoints = clickPoints.slice(-MAX_HEATMAP_POINTS);
    }
    localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(clickPoints));
  } catch {}
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
  return list;
}

export function clearHeatmapPoints() {
  clickPoints = [];
  localStorage.removeItem(HEATMAP_STORAGE_KEY);
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
