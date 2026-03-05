<!-- Explanation of the hourglass update function -->

function updateHourglass(percent) {
const isBreak = state.isBreak;
const svg = isBreak ? elements.breakHourglass : elements.sessionHourglass;
if (!svg) return;

const topSand = svg.querySelector(".sand-top");
const bottomSand = svg.querySelector(".sand-bottom");

// Calculate heights (Total sand height in one bulb is approx 50 units)
// Percent is "remaining time", so:
// 100% remaining = Top full (50), Bottom empty (0)
// 0% remaining = Top empty (0), Bottom full (50)

const sandHeight = 45; // Max height of sand in bulb
const topHeight = (percent / 100) \* sandHeight;
const bottomHeight = sandHeight - topHeight;

// Adjust y position for top sand to make it look like it's draining down
// Top bulb y range is roughly 5 to 50.
// We want the rect to shrink from the top or bottom?
// Standard rect shrinks from bottom up if we just change height.
// To shrink from top down, we increase y and decrease height.

topSand.setAttribute("height", Math.max(0, topHeight));
topSand.setAttribute("y", 50 - topHeight); // Anchored at bottom of top bulb (50)

bottomSand.setAttribute("height", Math.max(0, bottomHeight));
bottomSand.setAttribute("y", 95 - bottomHeight); // Anchored at bottom of bottom bulb (95)
}
