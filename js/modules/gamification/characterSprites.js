/**
 * characterSprites.js — Dynamic Modular SVG Paper-Doll & Sprite Renderer
 * Zero external raster images. Scalable, crisp vector art for characters, gear, mounts & bosses.
 */

"use strict";

export function renderHeroPaperDoll(hero, options = { size: 240 }) {
  const {
    name = "Hero",
    archetype = "knight",
    hairStyle = "short",
    hairColor = "#3b82f6",
    skinTone = "#fcd34d",
    level = 1,
    equipped = {},
  } = hero || {};

  const weaponKey = equipped.weapon?.spriteKey || "broadsword";
  const armorKey = equipped.armor?.spriteKey || "tunic";
  const helmKey = equipped.headgear?.spriteKey || "headband";
  const cloakKey = equipped.cloak?.spriteKey || "none";
  const offhandKey = equipped.offhand?.spriteKey || "none";
  const mountKey = equipped.mount?.spriteKey || "none";

  return `
    <svg class="hero-paperdoll-svg" width="${options.size}" height="${options.size * 1.15}" viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name} the ${archetype}">
      <defs>
        <!-- Gradients & Filters -->
        <linearGradient id="g-aura" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#818cf8" stop-opacity="0.05"/>
        </linearGradient>
        <linearGradient id="g-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
        <linearGradient id="g-mithril" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="50%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
        <linearGradient id="g-void" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="50%" stop-color="#7e22ce"/>
          <stop offset="100%" stop-color="#3b0764"/>
        </linearGradient>
        <filter id="f-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>

      <!-- 1. Background Aura / Ground Shadow -->
      <ellipse cx="100" cy="205" rx="55" ry="12" fill="rgba(0,0,0,0.22)"/>
      ${level >= 5 ? `<circle cx="100" cy="115" r="75" fill="url(#g-aura)" filter="url(#f-glow)" class="sprite-aura-ring"/>` : ""}

      <!-- 2. Mount Layer (Underneath character) -->
      <g id="layer-mount" class="sprite-mount-layer">
        ${renderMountSprite(mountKey)}
      </g>

      <!-- 3. Cloak / Wings (Behind back) -->
      <g id="layer-cloak" class="sprite-cloak-layer">
        ${renderCloakSprite(cloakKey)}
      </g>

      <!-- 4. Base Character Body -->
      <g id="layer-body" class="sprite-body-layer">
        <!-- Legs & Boots -->
        <rect x="88" y="148" width="10" height="42" rx="4" fill="#334155"/>
        <rect x="102" y="148" width="10" height="42" rx="4" fill="#1e293b"/>
        <path d="M86 182h14v10H82a4 4 0 0 1 4-4v-6z" fill="#0f172a"/>
        <path d="M100 182h14v10h-18a4 4 0 0 1 4-4v-6z" fill="#0f172a"/>

        <!-- Neck & Torso Base -->
        <rect x="94" y="90" width="12" height="12" fill="${skinTone}"/>
        <rect x="85" y="98" width="30" height="52" rx="6" fill="#475569"/>

        <!-- Arms Base -->
        <rect x="73" y="100" width="12" height="40" rx="5" fill="${skinTone}"/>
        <rect x="115" y="100" width="12" height="40" rx="5" fill="${skinTone}"/>
        <!-- Hands -->
        <circle cx="79" cy="142" r="6" fill="${skinTone}"/>
        <circle cx="121" cy="142" r="6" fill="${skinTone}"/>

        <!-- Head Base -->
        <circle cx="100" cy="74" r="18" fill="${skinTone}"/>
        <!-- Facial details -->
        <circle cx="94" cy="73" r="2.2" fill="#0f172a"/>
        <circle cx="106" cy="73" r="2.2" fill="#0f172a"/>
        <path d="M96 82q4 3 8 0" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round" fill="none"/>

        <!-- Hairstyle -->
        ${renderHairSprite(hairStyle, hairColor)}
      </g>

      <!-- 5. Armor / Robes Layer -->
      <g id="layer-armor" class="sprite-armor-layer">
        ${renderArmorSprite(armorKey)}
      </g>

      <!-- 6. Helmet / Headgear Layer -->
      <g id="layer-helm" class="sprite-helm-layer">
        ${renderHelmSprite(helmKey)}
      </g>

      <!-- 7. Off-Hand / Shield Layer (Left side) -->
      <g id="layer-offhand" class="sprite-offhand-layer">
        ${renderOffhandSprite(offhandKey)}
      </g>

      <!-- 8. Main-Hand Weapon Layer (Right side) -->
      <g id="layer-weapon" class="sprite-weapon-layer">
        ${renderWeaponSprite(weaponKey)}
      </g>
    </svg>
  `;
}

/* ─── Mount Sprites ─────────────────────────────────────────── */
function renderMountSprite(key) {
  switch (key) {
    case "solar_hare":
      return `
        <!-- Solar Hare Companion -->
        <g transform="translate(118, 142) scale(0.9)">
          <ellipse cx="25" cy="40" rx="16" ry="12" fill="#fef08a" stroke="#eab308" stroke-width="2"/>
          <circle cx="36" cy="30" r="9" fill="#fef08a" stroke="#eab308" stroke-width="1.5"/>
          <ellipse cx="36" cy="16" rx="4" ry="10" fill="#fef9c3" stroke="#eab308" stroke-width="1.5"/>
          <ellipse cx="41" cy="17" rx="3.5" ry="9" fill="#fef9c3" stroke="#eab308" stroke-width="1.5"/>
          <circle cx="39" cy="28" r="1.5" fill="#ca8a04"/>
          <circle cx="10" cy="38" r="5" fill="#ffffff"/>
          <circle cx="30" cy="42" r="3" fill="#eab308" opacity="0.4"/>
        </g>
      `;

    case "battle_wolf":
      return `
        <!-- Ironfang Battle Wolf -->
        <g transform="translate(35, 130)">
          <!-- Body -->
          <ellipse cx="65" cy="50" rx="38" ry="20" fill="#475569" stroke="#1e293b" stroke-width="2"/>
          <!-- Legs -->
          <rect x="35" y="55" width="8" height="26" rx="3" fill="#334155"/>
          <rect x="50" y="55" width="8" height="26" rx="3" fill="#1e293b"/>
          <rect x="75" y="55" width="8" height="26" rx="3" fill="#334155"/>
          <rect x="90" y="55" width="8" height="26" rx="3" fill="#1e293b"/>
          <!-- Tail -->
          <path d="M28 50C15 42 12 28 20 22c4 8 10 16 12 22z" fill="#334155"/>
          <!-- Head & Mane -->
          <polygon points="98,32 122,46 102,58" fill="#64748b"/>
          <polygon points="102,24 108,34 96,34" fill="#334155"/>
          <circle cx="108" cy="42" r="2.5" fill="#f59e0b"/>
          <path d="M120 46h-6l-2 4" stroke="#f8fafc" stroke-width="1.5"/>
        </g>
      `;

    case "clockwork_steed":
      return `
        <!-- Bronze Clockwork Steed -->
        <g transform="translate(30, 125)">
          <ellipse cx="70" cy="52" rx="42" ry="22" fill="#b45309" stroke="#78350f" stroke-width="2.5"/>
          <!-- Brass Gears & Rivets -->
          <circle cx="70" cy="52" r="12" fill="#d97706" stroke="#fbbf24" stroke-width="2"/>
          <circle cx="70" cy="52" r="4" fill="#78350f"/>
          <!-- Legs -->
          <rect x="42" y="60" width="7" height="28" rx="2" fill="#78350f"/>
          <rect x="56" y="60" width="7" height="28" rx="2" fill="#92400e"/>
          <rect x="82" y="60" width="7" height="28" rx="2" fill="#78350f"/>
          <rect x="96" y="60" width="7" height="28" rx="2" fill="#92400e"/>
          <!-- Mechanical Neck & Head -->
          <path d="M98 46l18-24 12 6-10 24z" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
          <polygon points="120,24 134,32 118,40" fill="#f59e0b"/>
          <circle cx="124" cy="30" r="3" fill="#38bdf8" filter="url(#f-glow)"/>
        </g>
      `;

    case "cyber_drake":
      return `
        <!-- Emerald Cyber Drake -->
        <g transform="translate(20, 115)">
          <!-- Coiled Dragon Body -->
          <path d="M30 75C20 40 55 30 75 45c25 18 55 10 75-5 5 25-15 40-40 35-25-5-50 15-80 0z" fill="#064e3b" stroke="#10b981" stroke-width="2.5"/>
          <!-- Glowing Cyber Scales -->
          <path d="M45 52l12 6M75 50l12-4M105 45l14 2" stroke="#34d399" stroke-width="2" stroke-linecap="round"/>
          <!-- Dragon Head -->
          <polygon points="145,35 170,28 152,50 138,42" fill="#047857" stroke="#10b981" stroke-width="2"/>
          <polygon points="144,24 154,34 140,34" fill="#065f46"/>
          <circle cx="152" cy="36" r="3" fill="#38bdf8" filter="url(#f-glow)"/>
        </g>
      `;

    case "celestial_griffin":
      return `
        <!-- Celestial Griffin -->
        <g transform="translate(15, 105)">
          <!-- Large Golden/Starlight Wings -->
          <path d="M25 65C10 20 45 5 70 25c-5 15-10 30-15 40z" fill="#fef08a" stroke="#eab308" stroke-width="2" opacity="0.85"/>
          <path d="M145 65C165 20 130 5 105 25c5 15 10 30 15 40z" fill="#fef08a" stroke="#eab308" stroke-width="2" opacity="0.85"/>
          <!-- Griffin Lion Body -->
          <ellipse cx="85" cy="65" rx="36" ry="20" fill="#ca8a04" stroke="#854d0e" stroke-width="2"/>
          <!-- Claws & Legs -->
          <rect x="55" y="70" width="8" height="24" rx="2" fill="#a16207"/>
          <rect x="105" y="70" width="8" height="24" rx="2" fill="#a16207"/>
          <!-- Eagle Head & Beak -->
          <circle cx="120" cy="50" r="14" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
          <polygon points="132,46 146,54 130,58" fill="#eab308"/>
          <circle cx="124" cy="48" r="2.5" fill="#0284c7"/>
        </g>
      `;

    default:
      return "";
  }
}

/* ─── Cloak & Wings Sprites ─────────────────────────────────── */
function renderCloakSprite(key) {
  switch (key) {
    case "traveler_cloak":
      return `<path d="M80 96c-18 25-24 60-15 88 15-8 30-5 35-10-8-25-10-55-15-78h-5z" fill="#15803d" stroke="#166534" stroke-width="1.5"/>`;
    case "midnight_cloak":
      return `<path d="M78 96c-22 30-30 75-20 102 24-10 40-5 46-12-12-32-15-68-20-90h-6z" fill="#1e1b4b" stroke="#312e81" stroke-width="1.5"/>`;
    case "starweaver_cape":
      return `
        <path d="M76 96c-25 35-32 80-22 106 28-12 45-6 52-14-14-34-18-72-24-92h-6z" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
        <circle cx="65" cy="140" r="2" fill="#ffffff"/>
        <circle cx="78" cy="165" r="1.5" fill="#93c5fd"/>
        <circle cx="68" cy="180" r="1.5" fill="#ffffff"/>
      `;
    case "wings_diligence":
      return `
        <!-- Angelic Wings -->
        <g filter="url(#f-glow)" opacity="0.95">
          <path d="M78 105C45 60 25 80 35 125c12-10 25-15 40-10z" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5"/>
          <path d="M122 105C155 60 175 80 165 125c-12-10-25-15-40-10z" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5"/>
        </g>
      `;
    default:
      return "";
  }
}

/* ─── Hair Sprites ──────────────────────────────────────────── */
function renderHairSprite(style, color) {
  switch (style) {
    case "flowing":
      return `
        <path d="M82 72c0-12 8-18 18-18s18 6 18 18c0 14-4 28-8 32-2-6-4-12-4-18-4 0-10 0-14 0-2 6-4 12-6 18-4-4-4-20-4-32z" fill="${color}"/>
      `;
    case "spiky":
      return `
        <polygon points="82,68 86,50 94,62 100,46 106,62 114,50 118,68 100,58" fill="${color}"/>
      `;
    case "cowl":
      return `
        <path d="M80 72c0-14 9-20 20-20s20 6 20 20v14c-4 4-10 6-20 6s-16-2-20-6V72z" fill="${color}" opacity="0.9"/>
      `;
    case "short":
    default:
      return `
        <path d="M82 70c0-10 8-16 18-16s18 6 18 16c0 4-2 6-4 6-4-6-10-8-14-8s-10 2-14 8c-2 0-4-2-4-6z" fill="${color}"/>
      `;
  }
}

/* ─── Armor Sprites ─────────────────────────────────────────── */
function renderArmorSprite(key) {
  switch (key) {
    case "leather_armor":
      return `
        <rect x="85" y="98" width="30" height="50" rx="6" fill="#78350f" stroke="#451a03" stroke-width="1.5"/>
        <line x1="88" y1="112" x2="112" y2="112" stroke="#b45309" stroke-width="2"/>
        <line x1="88" y1="126" x2="112" y2="126" stroke="#b45309" stroke-width="2"/>
        <circle cx="100" cy="112" r="2.5" fill="#f59e0b"/>
        <circle cx="100" cy="126" r="2.5" fill="#f59e0b"/>
      `;
    case "mithril_plate":
      return `
        <path d="M85 100c0-2 4-4 15-4s15 2 15 4v46l-15 4-15-4V100z" fill="url(#g-mithril)" stroke="#334155" stroke-width="1.5"/>
        <!-- Plate Pauldrons -->
        <rect x="74" y="98" width="12" height="14" rx="4" fill="url(#g-mithril)" stroke="#334155"/>
        <rect x="114" y="98" width="12" height="14" rx="4" fill="url(#g-mithril)" stroke="#334155"/>
        <!-- Chest Emblem -->
        <polygon points="100,108 106,118 94,118" fill="#38bdf8"/>
      `;
    case "chrono_robe":
      return `
        <path d="M83 98c0-2 6-4 17-4s17 2 17 4v56c-6 4-12 6-17 6s-11-2-17-6V98z" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
        <circle cx="100" cy="116" r="8" fill="none" stroke="#60a5fa" stroke-width="2"/>
        <line x1="100" y1="116" x2="100" y2="111" stroke="#fbbf24" stroke-width="1.5"/>
        <line x1="100" y1="116" x2="104" y2="116" stroke="#fbbf24" stroke-width="1.5"/>
      `;
    case "dragonscale_plate":
      return `
        <path d="M84 98c0-3 6-4 16-4s16 1 16 4v48l-16 5-16-5V98z" fill="#065f46" stroke="#10b981" stroke-width="2"/>
        <!-- Scaled Pattern -->
        <path d="M92 110q8 8 16 0M88 122q12 10 24 0M92 134q8 8 16 0" stroke="#34d399" stroke-width="2" fill="none"/>
        <circle cx="100" cy="108" r="4" fill="#ef4444" stroke="#fbbf24" stroke-width="1.5"/>
      `;
    case "tunic":
    default:
      return `
        <rect x="85" y="98" width="30" height="48" rx="5" fill="#b45309" stroke="#78350f" stroke-width="1.5"/>
        <line x1="100" y1="98" x2="100" y2="146" stroke="#78350f" stroke-width="1.5"/>
      `;
  }
}

/* ─── Helmet / Headgear Sprites ─────────────────────────────── */
function renderHelmSprite(key) {
  switch (key) {
    case "headband":
      return `<rect x="82" y="66" width="36" height="5" rx="2" fill="#ef4444"/>`;
    case "scholar_circlet":
      return `
        <path d="M82 66c5-4 13-6 18-6s13 2 18 6" stroke="#cbd5e1" stroke-width="2.5" fill="none"/>
        <polygon points="100,58 103,64 97,64" fill="#f59e0b"/>
      `;
    case "knight_helm":
      return `
        <path d="M81 72c0-12 8-18 19-18s19 6 19 18v8H81v-8z" fill="url(#g-mithril)" stroke="#334155" stroke-width="1.5"/>
        <line x1="86" y1="74" x2="114" y2="74" stroke="#0f172a" stroke-width="3"/>
        <!-- Plume -->
        <path d="M100 54c-4-12 4-16 8-18-2 6-2 12-4 18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
      `;
    case "chrono_goggles":
      return `
        <circle cx="94" cy="72" r="5.5" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="94" cy="72" r="2.5" fill="#38bdf8"/>
        <circle cx="106" cy="72" r="5.5" fill="#78350f" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="106" cy="72" r="2.5" fill="#38bdf8"/>
        <line x1="99" y1="72" x2="101" y2="72" stroke="#fbbf24" stroke-width="2"/>
      `;
    case "epoch_crown":
      return `
        <polygon points="80,68 85,50 93,62 100,44 107,62 115,50 120,68" fill="url(#g-gold)" stroke="#ca8a04" stroke-width="1.5"/>
        <circle cx="100" cy="56" r="3" fill="#38bdf8" filter="url(#f-glow)"/>
      `;
    default:
      return "";
  }
}

/* ─── Off-Hand / Shield Sprites ─────────────────────────────── */
function renderOffhandSprite(key) {
  switch (key) {
    case "buckler":
      return `
        <circle cx="72" cy="136" r="14" fill="#78350f" stroke="#475569" stroke-width="3"/>
        <circle cx="72" cy="136" r="4" fill="#94a3b8"/>
      `;
    case "aegis_shield":
      return `
        <path d="M62 118h20c0 14-6 26-10 32-4-6-10-18-10-32z" fill="#0284c7" stroke="url(#g-gold)" stroke-width="2"/>
        <polygon points="72,126 77,136 67,136" fill="#fef08a"/>
      `;
    case "spell_tome":
      return `
        <rect x="58" y="124" width="18" height="24" rx="3" fill="#581c87" stroke="#fbbf24" stroke-width="1.5" transform="rotate(-12, 67, 136)"/>
        <circle cx="67" cy="136" r="3" fill="#a855f7" filter="url(#f-glow)"/>
      `;
    case "chrono_orb":
      return `
        <circle cx="70" cy="136" r="11" fill="none" stroke="#fbbf24" stroke-width="2"/>
        <circle cx="70" cy="136" r="8" fill="#38bdf8" filter="url(#f-glow)" opacity="0.8"/>
        <line x1="70" y1="130" x2="70" y2="142" stroke="#ffffff" stroke-width="1.5"/>
      `;
    default:
      return "";
  }
}

/* ─── Weapon Sprites ────────────────────────────────────────── */
function renderWeaponSprite(key) {
  switch (key) {
    case "broadsword":
      return `
        <!-- Iron Broadsword -->
        <g transform="translate(118, 90)">
          <!-- Blade -->
          <polygon points="12,12 16,8 38,-28 42,-30 40,-24 16,14" fill="url(#g-mithril)" stroke="#334155" stroke-width="1"/>
          <!-- Guard & Hilt -->
          <line x1="8" y1="18" x2="22" y2="6" stroke="#d97706" stroke-width="3" stroke-linecap="round"/>
          <line x1="14" y1="14" x2="8" y2="22" stroke="#78350f" stroke-width="3"/>
          <circle cx="7" cy="23" r="2.5" fill="#f59e0b"/>
        </g>
      `;

    case "clarity_blade":
      return `
        <!-- Blade of Clarity -->
        <g transform="translate(118, 90)" filter="url(#f-glow)">
          <polygon points="12,12 15,8 44,-35 46,-37 42,-32 15,14" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5"/>
          <line x1="7" y1="18" x2="23" y2="6" stroke="#93c5fd" stroke-width="3"/>
          <circle cx="6" cy="24" r="3" fill="#38bdf8"/>
        </g>
      `;

    case "aeon_staff":
      return `
        <!-- Staff of Aeons -->
        <g transform="translate(118, 70)">
          <line x1="6" y1="80" x2="28" y2="-20" stroke="#78350f" stroke-width="4" stroke-linecap="round"/>
          <circle cx="28" cy="-20" r="10" fill="none" stroke="#fbbf24" stroke-width="2.5"/>
          <polygon points="25,-26 31,-26 28,-14" fill="#38bdf8"/>
          <polygon points="25,-14 31,-14 28,-26" fill="#38bdf8"/>
        </g>
      `;

    case "twin_daggers":
      return `
        <!-- Twin Shadow Daggers -->
        <g transform="translate(120, 110)">
          <polygon points="4,20 18,-6 22,-8 14,24" fill="#334155" stroke="#a855f7" stroke-width="1.5"/>
        </g>
        <g transform="translate(62, 110)">
          <polygon points="12,24 4,20 -8,-6 -6,-8" fill="#334155" stroke="#a855f7" stroke-width="1.5"/>
        </g>
      `;

    case "sun_halberd":
      return `
        <!-- Sun-Forged Halberd -->
        <g transform="translate(116, 60)">
          <line x1="6" y1="95" x2="32" y2="-25" stroke="#b45309" stroke-width="3.5"/>
          <polygon points="32,-25 36,-42 44,-20 28,-18" fill="url(#g-gold)" stroke="#ca8a04" stroke-width="1.5"/>
          <path d="M26,-15c-10 6-12 18-5 24" stroke="#f59e0b" stroke-width="3" fill="none"/>
        </g>
      `;

    case "voidcleaver":
      return `
        <!-- Voidcleaver of Chronos -->
        <g transform="translate(116, 75)" filter="url(#f-glow)">
          <polygon points="10,25 18,15 48,-42 54,-45 42,-34 16,30" fill="url(#g-void)" stroke="#e879f9" stroke-width="2"/>
          <line x1="6" y1="28" x2="24" y2="12" stroke="#c084fc" stroke-width="4"/>
          <circle cx="5" cy="32" r="3.5" fill="#f43f5e"/>
        </g>
      `;

    case "dagger":
    default:
      return `
        <!-- Novice Dagger -->
        <g transform="translate(122, 118)">
          <polygon points="2,14 10,-2 13,-3 6,17" fill="#94a3b8" stroke="#475569" stroke-width="1"/>
          <line x1="-1" y1="13" x2="8" y2="7" stroke="#78350f" stroke-width="2.5"/>
        </g>
      `;
  }
}

/* ─── Boss Sprites ──────────────────────────────────────────── */
export function renderBossSprite(bossId, options = { size: 160 }) {
  switch (bossId) {
    case "shade_delay":
      return `
        <svg width="${options.size}" height="${options.size}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shade of Delay">
          <ellipse cx="80" cy="140" rx="45" ry="10" fill="rgba(0,0,0,0.3)"/>
          <path d="M45 135C30 90 40 50 80 40c40 10 50 50 35 95-15-10-25-5-35-15-10 10-20 5-35 15z" fill="#1e1b4b" stroke="#6366f1" stroke-width="2.5"/>
          <ellipse cx="65" cy="72" rx="6" ry="3" fill="#ef4444"/>
          <ellipse cx="95" cy="72" rx="6" ry="3" fill="#ef4444"/>
          <path d="M70 95q10 6 20 0" stroke="#f43f5e" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;

    case "sloth_drake":
      return `
        <svg width="${options.size}" height="${options.size}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Sloth Drake">
          <ellipse cx="80" cy="138" rx="60" ry="14" fill="rgba(0,0,0,0.3)"/>
          <!-- Curled Slumbering Drake Body -->
          <ellipse cx="80" cy="95" rx="52" ry="34" fill="#047857" stroke="#10b981" stroke-width="3"/>
          <!-- Sleeping Snout & Horns -->
          <polygon points="105,72 135,78 120,95" fill="#065f46" stroke="#10b981" stroke-width="2"/>
          <polygon points="100,62 108,74 94,72" fill="#0f766e"/>
          <!-- Closed Eye (Zzz) -->
          <line x1="112" y1="82" x2="124" y2="82" stroke="#fef08a" stroke-width="2.5" stroke-linecap="round"/>
          <text x="126" y="65" fill="#38bdf8" font-size="14" font-weight="bold">Z</text>
          <text x="136" y="52" fill="#38bdf8" font-size="11" font-weight="bold">z</text>
        </svg>
      `;

    case "gear_automaton":
      return `
        <svg width="${options.size}" height="${options.size}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gear-Eater Automaton">
          <ellipse cx="80" cy="140" rx="45" ry="10" fill="rgba(0,0,0,0.3)"/>
          <!-- Brass Golem Torso -->
          <rect x="52" y="55" width="56" height="65" rx="10" fill="#b45309" stroke="#78350f" stroke-width="3"/>
          <circle cx="80" cy="88" r="16" fill="#d97706" stroke="#fbbf24" stroke-width="2.5"/>
          <circle cx="80" cy="88" r="5" fill="#78350f"/>
          <!-- Automaton Head -->
          <rect x="62" y="32" width="36" height="26" rx="6" fill="#92400e" stroke="#78350f" stroke-width="2"/>
          <circle cx="72" cy="45" r="3.5" fill="#ef4444"/>
          <circle cx="88" cy="45" r="3.5" fill="#ef4444"/>
          <!-- Exhaust Pipes -->
          <rect x="56" y="24" width="6" height="12" fill="#78350f"/>
          <rect x="98" y="24" width="6" height="12" fill="#78350f"/>
        </svg>
      `;

    case "tomorrow_phantom":
    default:
      return `
        <svg width="${options.size}" height="${options.size}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Tomorrow Phantom">
          <ellipse cx="80" cy="140" rx="50" ry="12" fill="rgba(0,0,0,0.35)"/>
          <path d="M40 135C20 80 40 35 80 25c40 10 60 55 40 110-18-12-28-6-40-18-12 12-22 6-40 18z" fill="#3b0764" stroke="#c084fc" stroke-width="3"/>
          <circle cx="68" cy="62" r="5" fill="#f43f5e"/>
          <circle cx="92" cy="62" r="5" fill="#f43f5e"/>
          <circle cx="80" cy="92" r="14" fill="none" stroke="#fbbf24" stroke-width="2"/>
          <line x1="80" y1="92" x2="80" y2="84" stroke="#f43f5e" stroke-width="1.5"/>
          <line x1="80" y1="92" x2="86" y2="92" stroke="#f43f5e" stroke-width="1.5"/>
        </svg>
      `;
  }
}

/* ─── NPC Guide Portrait (Chronos the Clockwork Owl) ───────── */
export function renderNPCPortrait(options = { size: 64 }) {
  return `
    <svg class="npc-portrait-svg" width="${options.size}" height="${options.size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chronos the Clockwork Owl">
      <circle cx="32" cy="32" r="30" fill="#1e293b" stroke="#fbbf24" stroke-width="2"/>
      <!-- Owl Face -->
      <circle cx="24" cy="28" r="9" fill="#d97706" stroke="#fbbf24" stroke-width="1.5"/>
      <circle cx="40" cy="28" r="9" fill="#d97706" stroke="#fbbf24" stroke-width="1.5"/>
      <circle cx="24" cy="28" r="4" fill="#38bdf8"/>
      <circle cx="40" cy="28" r="4" fill="#38bdf8"/>
      <!-- Monocle on right eye -->
      <circle cx="40" cy="28" r="8" fill="none" stroke="#fbbf24" stroke-width="1.5"/>
      <line x1="48" y1="30" x2="54" y2="44" stroke="#fbbf24" stroke-width="1"/>
      <!-- Beak -->
      <polygon points="32,34 36,42 28,42" fill="#f59e0b"/>
      <!-- Scholar Cap -->
      <polygon points="32,10 50,16 32,22 14,16" fill="#0f172a" stroke="#fbbf24" stroke-width="1"/>
      <rect x="24" y="16" width="16" height="5" fill="#1e293b"/>
    </svg>
  `;
}
