// XP needed to go from level n to n+1
export function stepXp(n) {
  return Math.floor(100 + 3 * n + 0.5 * n ** 2 + 0.5 * n ** 3);
}

// Total XP required to reach a level (level 1 = 0 XP)
export function totalXpForLevel(level) {
  let total = 0;
  for (let n = 1; n < level; n++) total += stepXp(n);
  return total;
}

// Highest level reached with a given total XP (inverse of totalXpForLevel)
export function levelForXp(xp) {
  let level = 1;
  let total = 0;
  while (level < 200) {
    const next = total + stepXp(level);
    if (next > xp) break;
    total = next;
    level++;
  }
  return level;
}

export const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 5 });
