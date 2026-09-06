/**
 * mascotSprites.js — Procedural Vector SVG Sprite Engine for Mascots
 * Zero external raster images. Crisp, scalable vector art with expressive animation states.
 */

"use strict";

export function renderMascotSvg(mascotId = "pomi", state = "idle", size = 120) {
  switch (mascotId) {
    case "kip":
      return renderKipSvg(state, size);
    case "chronos":
      return renderChronosSvg(state, size);
    case "pip":
      return renderPipSvg(state, size);
    case "bolt":
      return renderBoltSvg(state, size);
    case "pomi":
    default:
      return renderPomiSvg(state, size);
  }
}

/**
 * POMI THE TOMATO (Brand Mascot)
 */
function renderPomiSvg(state = "idle", size = 120) {
  const isCheer = state === "cheer";
  const isSleep = state === "sleep";
  const isThink = state === "think";
  const isHeart = state === "heart";

  // Eye & mouth shapes based on state
  let eyesSvg = `
    <ellipse cx="44" cy="58" rx="6" ry="8" fill="#1e293b"/>
    <circle cx="42" cy="55" r="2.5" fill="#ffffff"/>
    <ellipse cx="76" cy="58" rx="6" ry="8" fill="#1e293b"/>
    <circle cx="74" cy="55" r="2.5" fill="#ffffff"/>
  `;
  let mouthSvg = `<path d="M52 68 Q60 76 68 68" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  let armLeft = `M26 62 Q16 68 22 78`;
  let armRight = `M94 62 Q104 68 98 78`;

  if (isCheer) {
    eyesSvg = `
      <path d="M38 58 Q44 50 50 58" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round" fill="none"/>
      <path d="M70 58 Q76 50 82 58" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    `;
    mouthSvg = `<path d="M50 66 Q60 82 70 66 Z" fill="#b91c1c" stroke="#1e293b" stroke-width="2"/>`;
    armLeft = `M24 58 Q12 36 24 30`;
    armRight = `M96 58 Q108 36 96 30`;
  } else if (isSleep) {
    eyesSvg = `
      <path d="M38 60 Q44 64 50 60" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M70 60 Q76 64 82 60" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
    `;
    mouthSvg = `<circle cx="60" cy="70" r="3.5" fill="#1e293b"/>`;
  } else if (isThink) {
    eyesSvg = `
      <ellipse cx="44" cy="55" rx="5.5" ry="7" fill="#1e293b"/>
      <circle cx="46" cy="53" r="2" fill="#ffffff"/>
      <ellipse cx="76" cy="55" rx="5.5" ry="7" fill="#1e293b"/>
      <circle cx="78" cy="53" r="2" fill="#ffffff"/>
    `;
    mouthSvg = `<path d="M54 70 Q60 68 66 70" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    armLeft = `M26 62 Q36 70 48 68`;
  }

  return `
    <svg class="mascot-svg mascot-pomi state-${state}" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pomi the Tomato">
      <defs>
        <radialGradient id="pomi-grad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="65%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#b91c1c"/>
        </radialGradient>
        <linearGradient id="leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34d399"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <filter id="shadow-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>

      <!-- Ground Shadow -->
      <ellipse cx="60" cy="110" rx="34" ry="7" fill="rgba(0,0,0,0.18)" filter="url(#shadow-blur)"/>

      <!-- Legs & Boots -->
      <rect x="42" y="92" width="10" height="15" rx="4" fill="#0f172a"/>
      <rect x="68" y="92" width="10" height="15" rx="4" fill="#0f172a"/>
      <ellipse cx="45" cy="106" rx="9" ry="4.5" fill="#10b981"/>
      <ellipse cx="75" cy="106" rx="9" ry="4.5" fill="#10b981"/>

      <!-- Arms -->
      <path d="${armLeft}" stroke="#ef4444" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="${armRight}" stroke="#ef4444" stroke-width="8" stroke-linecap="round" fill="none"/>
      <circle cx="${isCheer ? 24 : 22}" cy="${isCheer ? 30 : 78}" r="5.5" fill="#fca5a5"/>
      <circle cx="${isCheer ? 96 : 98}" cy="${isCheer ? 30 : 78}" r="5.5" fill="#fca5a5"/>

      <!-- Tomato Body -->
      <circle cx="60" cy="66" r="38" fill="url(#pomi-grad)"/>

      <!-- Cheeks -->
      <ellipse cx="36" cy="67" rx="7" ry="4.5" fill="#fda4af" opacity="0.8"/>
      <ellipse cx="84" cy="67" rx="7" ry="4.5" fill="#fda4af" opacity="0.8"/>

      <!-- Eyes & Mouth -->
      ${eyesSvg}
      ${mouthSvg}

      <!-- Leaf Stem Crown -->
      <g id="pomi-stem" class="stem-crown">
        <path d="M60 30 C58 20 62 14 65 10 C63 12 60 16 57 28 Z" fill="#047857"/>
        <path d="M60 28 C50 18 36 24 38 31 C46 32 54 30 60 28 Z" fill="url(#leaf-grad)"/>
        <path d="M60 28 C70 18 84 24 82 31 C74 32 66 30 60 28 Z" fill="url(#leaf-grad)"/>
        <path d="M60 29 C56 36 44 38 46 42 C52 42 58 36 60 29 Z" fill="url(#leaf-grad)"/>
        <path d="M60 29 C64 36 76 38 74 42 C68 42 62 36 60 29 Z" fill="url(#leaf-grad)"/>
        <circle cx="60" cy="29" r="4.5" fill="#065f46"/>
      </g>

      <!-- Extras for states -->
      ${
        isHeart
          ? `<path d="M60 18 C60 12 52 10 50 15 C48 20 60 26 60 26 C60 26 72 20 70 15 C68 10 60 12 60 18 Z" fill="#f43f5e" class="emote-heart"/>`
          : ""
      }
      ${
        isSleep
          ? `<text x="82" y="32" font-family="sans-serif" font-weight="bold" font-size="14" fill="#38bdf8" class="emote-zzz">zZz</text>`
          : ""
      }
    </svg>
  `;
}

/**
 * KIP THE CYBER-CAT
 */
function renderKipSvg(state = "idle", size = 120) {
  const isCheer = state === "cheer";
  return `
    <svg class="mascot-svg mascot-kip state-${state}" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kip the Cyber-Cat">
      <defs>
        <linearGradient id="kip-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="110" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
      <!-- Tail -->
      <path d="M30 85 Q10 75 14 60" stroke="#06b6d4" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Body & Ears -->
      <path d="M36 34 L28 14 L50 26 Z" fill="#0891b2"/>
      <path d="M84 34 L92 14 L70 26 Z" fill="#0891b2"/>
      <circle cx="60" cy="65" r="36" fill="url(#kip-grad)"/>
      <!-- Cyber Visor / Eyes -->
      <rect x="36" y="52" width="48" height="16" rx="8" fill="#0f172a"/>
      <rect x="40" y="55" width="18" height="10" rx="4" fill="#ec4899"/>
      <rect x="62" y="55" width="18" height="10" rx="4" fill="#ec4899"/>
      <!-- Whiskers -->
      <line x1="24" y1="62" x2="34" y2="64" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="24" y1="70" x2="34" y2="68" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="96" y1="62" x2="86" y2="64" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="96" y1="70" x2="86" y2="68" stroke="#a855f7" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Nose / Mouth -->
      <polygon points="57,74 63,74 60,78" fill="#ec4899"/>
      <path d="M54 80 Q60 84 66 80" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Paws -->
      <ellipse cx="44" cy="98" rx="8" ry="6" fill="#0e7490"/>
      <ellipse cx="76" cy="98" rx="8" ry="6" fill="#0e7490"/>
      ${isCheer ? `<path d="M30 50 L20 38 M90 50 L100 38" stroke="#06b6d4" stroke-width="6" stroke-linecap="round"/>` : ""}
    </svg>
  `;
}

/**
 * CHRONOS THE TIME OWL
 */
function renderChronosSvg(state = "idle", size = 120) {
  return `
    <svg class="mascot-svg mascot-chronos state-${state}" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chronos the Owl">
      <ellipse cx="60" cy="110" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
      <!-- Body -->
      <ellipse cx="60" cy="65" r="35" fill="#7c3aed"/>
      <ellipse cx="60" cy="72" rx="22" ry="24" fill="#ede9fe"/>
      <!-- Tuft Ears -->
      <path d="M32 35 L24 16 L44 26 Z" fill="#6d28d9"/>
      <path d="M88 35 L96 16 L76 26 Z" fill="#6d28d9"/>
      <!-- Monocle on right eye -->
      <circle cx="44" cy="54" r="12" fill="#ffffff" stroke="#5b21b6" stroke-width="2"/>
      <circle cx="44" cy="54" r="5" fill="#1e293b"/>
      <circle cx="76" cy="54" r="12" fill="#ffffff" stroke="#f59e0b" stroke-width="3.5"/>
      <circle cx="76" cy="54" r="5" fill="#1e293b"/>
      <line x1="88" y1="58" x2="98" y2="76" stroke="#f59e0b" stroke-width="2"/>
      <!-- Beak -->
      <polygon points="56,62 64,62 60,72" fill="#f59e0b"/>
      <!-- Wings -->
      <path d="M26 60 Q18 75 28 88" stroke="#5b21b6" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M94 60 Q102 75 92 88" stroke="#5b21b6" stroke-width="8" stroke-linecap="round" fill="none"/>
      <!-- Pocket Watch hanging -->
      <circle cx="88" cy="85" r="9" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
      <line x1="88" y1="85" x2="88" y2="80" stroke="#78350f" stroke-width="1.5"/>
      <line x1="88" y1="85" x2="92" y2="85" stroke="#78350f" stroke-width="1.5"/>
    </svg>
  `;
}

/**
 * PIP THE PENGUIN
 */
function renderPipSvg(state = "idle", size = 120) {
  return `
    <svg class="mascot-svg mascot-pip state-${state}" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pip the Penguin">
      <ellipse cx="60" cy="110" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
      <!-- Body -->
      <ellipse cx="60" cy="65" rx="32" ry="38" fill="#1e293b"/>
      <ellipse cx="60" cy="72" rx="20" ry="26" fill="#ffffff"/>
      <!-- Eyes -->
      <circle cx="48" cy="50" r="4" fill="#0f172a"/>
      <circle cx="72" cy="50" r="4" fill="#0f172a"/>
      <!-- Beak -->
      <polygon points="54,55 66,55 60,64" fill="#f97316"/>
      <!-- Cozy Knitted Scarf -->
      <rect x="36" y="66" width="48" height="10" rx="4" fill="#3b82f6"/>
      <rect x="64" y="72" width="12" height="20" rx="3" fill="#2563eb"/>
      <!-- Flippers -->
      <ellipse cx="24" cy="70" rx="6" ry="16" fill="#0f172a" transform="rotate(18 24 70)"/>
      <ellipse cx="96" cy="70" rx="6" ry="16" fill="#0f172a" transform="rotate(-18 96 70)"/>
      <!-- Feet -->
      <ellipse cx="46" cy="103" rx="8" ry="4" fill="#f97316"/>
      <ellipse cx="74" cy="103" rx="8" ry="4" fill="#f97316"/>
    </svg>
  `;
}

/**
 * BOLT THE CLOCKWORK BOT
 */
function renderBoltSvg(state = "idle", size = 120) {
  return `
    <svg class="mascot-svg mascot-bolt state-${state}" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bolt the Bot">
      <ellipse cx="60" cy="110" rx="30" ry="6" fill="rgba(0,0,0,0.2)"/>
      <!-- Antenna with glowing bulb -->
      <line x1="60" y1="30" x2="60" y2="18" stroke="#71717a" stroke-width="4"/>
      <circle cx="60" cy="14" r="6" fill="#ef4444"/>
      <!-- Brass Head & Chassis -->
      <rect x="34" y="30" width="52" height="42" rx="10" fill="#eab308" stroke="#a16207" stroke-width="3"/>
      <!-- Screen Visor -->
      <rect x="40" y="38" width="40" height="18" rx="5" fill="#18181b"/>
      <circle cx="48" cy="47" r="3.5" fill="#38bdf8"/>
      <circle cx="72" cy="47" r="3.5" fill="#38bdf8"/>
      <!-- Dial / Meter -->
      <rect x="42" y="60" width="36" height="6" rx="2" fill="#71717a"/>
      <rect x="43" y="61" width="22" height="4" rx="1" fill="#22c55e"/>
      <!-- Cogwheel ears -->
      <circle cx="28" cy="48" r="7" fill="#a16207"/>
      <circle cx="92" cy="48" r="7" fill="#a16207"/>
      <!-- Body & Treads -->
      <rect x="44" y="74" width="32" height="22" rx="4" fill="#ca8a04"/>
      <rect x="36" y="96" width="48" height="10" rx="5" fill="#3f3f46"/>
      <circle cx="44" cy="101" r="3" fill="#71717a"/>
      <circle cx="60" cy="101" r="3" fill="#71717a"/>
      <circle cx="76" cy="101" r="3" fill="#71717a"/>
    </svg>
  `;
}
