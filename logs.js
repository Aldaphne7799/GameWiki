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

// base × (1 + bonus%)
export function xpWithBonus(baseXp, bonusPercent) {
  const raw = baseXp * (1 + bonusPercent / 100);
  return Math.round(raw * 10 + 1e-9) / 10;
}
