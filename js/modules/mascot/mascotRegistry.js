/**
 * mascotRegistry.js — Mascot & Brand Character Registry
 * Provides built-in mascots and an extensible API for future dev / company branding.
 */

"use strict";

export const MASCOTS = {
  pomi: {
    id: "pomi",
    name: "Pomi the Tomato",
    brand: "Pomidor",
    title: "Focus Master & Time Guardian",
    bio: "A bouncy, cheerful anthropomorphic tomato with a fresh leaf crown. Loves deep focus sessions and celebrating task victories!",
    palette: {
      primary: "#ef4444",
      secondary: "#10b981",
      accent: "#f59e0b",
      shadow: "#b91c1c",
      highlight: "#fca5a5",
    },
    defaultTool: "pomodoro",
    greetings: {
      pomodoro: "Ready to conquer time together? Let's start a juicy focus session!",
      todo: "Look at all these milestones! We'll slice right through them.",
      kanban: "Flowing through the board like a champion. What's moving to Done next?",
      vault: "Your thoughts are safe in the vault! Knowledge is our secret superpower.",
      calendar: "Your calendar, your rules. Read-only and 100% private.",
      stats: "Look at your growth! Every focused tomato counts toward your journey.",
      hero: "Suit up, hero! The battlefield and ancient towers await!",
      tactics: "Tactical formation ready! Lead our squad into the unknown!",
    },
    tips: [
      "A 25-minute sprint keeps mental fatigue away!",
      "Break big monster tasks into bite-sized subtasks.",
      "Stay hydrated! Even tomatoes need water to stay fresh.",
      "Consistency beats intensity every single time.",
    ],
  },
  kip: {
    id: "kip",
    name: "Kip the Cyber-Cat",
    brand: "ByteCraft",
    title: "Agile Sprinter & Bug Catcher",
    bio: "A neon-lit cybernetic feline with energetic holographic whiskers. Masters kanban boards and rapid task execution.",
    palette: {
      primary: "#06b6d4",
      secondary: "#ec4899",
      accent: "#a855f7",
      shadow: "#0e7490",
      highlight: "#67e8f9",
    },
    defaultTool: "kanban",
    greetings: {
      pomodoro: "Purr-fect focus time! No distractions allowed on my watch.",
      todo: "Got your claws ready? Let's check these items off fast.",
      kanban: "Keep the WIP limits clean! Drag that card across the finish line.",
      vault: "Indexed, encrypted, and tidy. Exactly how a feline likes it.",
      calendar: "Schedule locked in. Zero time leaks detected.",
      stats: "Your velocity metrics are looking sleek today!",
      hero: "Sharp claws, keen reflexes. Ready for tactical deployment!",
      tactics: "Position on the flank for maximum critical strike damage!",
    },
    tips: [
      "Limit Work In Progress (WIP) to keep flow smooth.",
      "Check off your toughest task first thing in the morning.",
      "A stretch break keeps your spine nimble and ready.",
    ],
  },
  chronos: {
    id: "chronos",
    name: "Chronos the Time Owl",
    brand: "Aegis Time",
    title: "Keeper of the Temporal Archive",
    bio: "An erudite owl adorned with an ornate pocket watch and brass spectacles. Master of calendars and long-term strategy.",
    palette: {
      primary: "#8b5cf6",
      secondary: "#d97706",
      accent: "#38bdf8",
      shadow: "#6d28d9",
      highlight: "#c4b5fd",
    },
    defaultTool: "calendar",
    greetings: {
      pomodoro: "Wisdom dictates focused effort. Channel the hours carefully.",
      todo: "Structure brings serenity. Prioritize with intention.",
      kanban: "Observe the stream of progress across the columns.",
      vault: "The archives preserve the insights of today for tomorrow.",
      calendar: "Behold the continuum of your days. Harmonize your schedule.",
      stats: "The numbers reveal patterns of dedication and quiet strength.",
      hero: "The hourglass turns! Ancient beasts challenge our realm.",
      tactics: "Foresee the enemy's movement three turns in advance.",
    },
    tips: [
      "Plan your tomorrow before you sleep tonight.",
      "Protect your focus hours like priceless treasure.",
      "Reflection at the end of the week builds lasting wisdom.",
    ],
  },
  pip: {
    id: "pip",
    name: "Pip the Penguin",
    brand: "ChillWork",
    title: "Zen Navigator & Cold-Brew Companion",
    bio: "A calm penguin wrapped in a cozy knitted scarf. Keeps focus cool, collected, and completely stress-free.",
    palette: {
      primary: "#3b82f6",
      secondary: "#f97316",
      accent: "#10b981",
      shadow: "#1d4ed8",
      highlight: "#93c5fd",
    },
    defaultTool: "vault",
    greetings: {
      pomodoro: "Deep breath. Cold breeze. Let's glide smoothly into focus.",
      todo: "One step at a time, just like walking on the ice.",
      kanban: "Keep things gliding effortlessly from Left to Right.",
      vault: "A quiet snowy library for all your thoughts and ideas.",
      calendar: "Plenty of room to breathe between your milestones.",
      stats: "Smooth sailing and steady progress. You're doing great.",
      hero: "Stay cool under pressure, brave friend!",
      tactics: "Freeze enemy units in their tracks with icy patience.",
    },
    tips: [
      "Don't rush; smooth is fast.",
      "Take your breaks seriously — breathe and step away from the screen.",
      "Celebrate small wins; they build mountains.",
    ],
  },
  bolt: {
    id: "bolt",
    name: "Bolt the Clockwork Bot",
    brand: "Mechanica",
    title: "Precision Automaton & Data Analyst",
    bio: "A polished brass automaton with spinning cogs and glowing diode eyes. Passionate about productivity stats and optimization.",
    palette: {
      primary: "#eab308",
      secondary: "#64748b",
      accent: "#f43f5e",
      shadow: "#a16207",
      highlight: "#fde047",
    },
    defaultTool: "stats",
    greetings: {
      pomodoro: "BEEP-BOOP! Clockwork gears synced for optimal focus cycle.",
      todo: "Task checklist parsed. Operational efficiency at 99.8%.",
      kanban: "Pipeline throughput nominal. Ready for batch execution.",
      vault: "Data stored in local non-volatile memory. Integrity verified.",
      calendar: "Chronometer calibrated. Temporal allocations optimized.",
      stats: "Computing productivity telemetry... exceptional numbers detected!",
      hero: "Combat chassis reinforced. Weapons online and calibrated!",
      tactics: "Calculate line-of-sight and AP consumption for maximum yield.",
    },
    tips: [
      "Track your energy highs and lows to schedule complex tasks.",
      "Batch similar tasks together to reduce context switching.",
      "Regular system reboots (walks) restore cognitive throughput.",
    ],
  },
};

// Specialist tool assignments
export const TOOL_SPECIALISTS = {
  pomodoro: "pomi",
  todo: "kip",
  kanban: "bolt",
  vault: "pip",
  calendar: "chronos",
  stats: "bolt",
  hero: "pomi",
  tactics: "pomi",
};

/**
 * Register or override a brand mascot.
 * Allows future developers/companies to easily integrate their brand character.
 */
export function registerMascot(customMascot) {
  if (!customMascot?.id) throw new Error("Mascot requires an id");
  MASCOTS[customMascot.id] = {
    ...customMascot,
    palette: customMascot.palette || {
      primary: "#10b981",
      secondary: "#3b82f6",
      accent: "#f59e0b",
      shadow: "#059669",
      highlight: "#6ee7b7",
    },
    greetings: customMascot.greetings || {},
    tips: customMascot.tips || ["Focus on what matters most today."],
  };
  document.dispatchEvent(new CustomEvent("mascot-registered", { detail: customMascot }));
  return MASCOTS[customMascot.id];
}

export function getMascot(id) {
  return MASCOTS[id] || MASCOTS.pomi;
}

export function getAllMascots() {
  return Object.values(MASCOTS);
}
