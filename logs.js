// logs.js

export const LOGS = [
  { name: "No Logs",   bonus: 0   },
  { name: "Birch",     bonus: 0.5 },
  { name: "Oak",       bonus: 1   },
  { name: "Willow",    bonus: 1.5 },
  { name: "Swampwood", bonus: 2   },
  { name: "Maple",     bonus: 2.5 },
  { name: "Pine",      bonus: 3   },
  { name: "Moonwood",  bonus: 3.5 },
];

/**
 * Average XP per action with a log bonus applied.
 *
 * Formula: base × (100 + bonus) / 100
 *
 * - Multiply first, divide last: avoids float error from computing
 *   1.025 up front (30 × 1.025 gives 30.749999999999996, but
 *   30 × 102.5 / 100 gives 30.75).
 * - No rounding: the game carries the leftover fraction between
 *   actions, so the unrounded value is the real average XP.
 *
 * @param {number} baseXp        XP per action without a bonus
 * @param {number} bonusPercent  Log bonus as a percentage (e.g. 2.5)
 * @returns {number}
 */
export function xpWithBonus(baseXp, bonusPercent) {
  return baseXp * (100 + bonusPercent) / 100;
}

/**
 * Number of actions needed to earn a given amount of XP.
 *
 * Uses a single division at the very end, then rounds up since
 * you can't perform a partial action.
 *
 * Example: 77,500 XP at 77.5 base XP with Maple (+2.5%) = 976
 *
 * @param {number} xpNeeded      XP remaining to the goal
 * @param {number} baseXp        XP per action without a bonus
 * @param {number} bonusPercent  Log bonus as a percentage
 * @returns {number}
 */
export function actionsToGoal(xpNeeded, baseXp, bonusPercent) {
  return Math.ceil((xpNeeded * 100) / (baseXp * (100 + bonusPercent)));
}

/**
 * Format an XP value for display only (never use the result in
 * further calculations).
 *
 * Examples: 30.75, 79.4375, 1,025
 *
 * @param {number} xp
 * @returns {string}
 */
export function formatXp(xp) {
  return xp.toLocaleString("en", { maximumFractionDigits: 5 });
}

