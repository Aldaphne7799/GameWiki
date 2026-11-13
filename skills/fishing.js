import { fmt, totalXpForLevel, stepXp } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

function itemIconHTML(icon, fallbackText = "") {
  return `<img class="item-icon" src="${ICON_BASE}${icon}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />${fallbackText}`;
}

/* ============ DATA ============ */

const FISH = [
  { name: "Shrimp",        lvl: 1,  xp: 10,  rod: "bronze",  spot: "shrimp", icon: "raw_shrimp" },
  { name: "Trout",         lvl: 10, xp: 42,  rod: "iron",    spot: "river",  icon: "raw_trout" },
  { name: "Salmon",        lvl: 20, xp: 75,  rod: "steel",   spot: "river",  icon: "raw_salmon" },
  { name: "Sturgeon",      lvl: 30, xp: 112, rod: "mithril", spot: "river",  icon: "raw_sturgeon" },
  { name: "Barnacle Bass", lvl: 40, xp: 151, rod: "ebony",   spot: "sea",    icon: "raw_barnacle_bass" },
  { name: "Stormjaw",      lvl: 60, xp: 240, rod: "verdite", spot: "sea",    icon: "raw_stormjaw" },
  { name: "Vesperfin",     lvl: 80, xp: 320, rod: "tyrian",  spot: "river",  icon: "raw_vesperfin" },
];

const ROD_TIERS = { bronze: 0, iron: 1, steel: 2, mithril: 3, ebony: 4, verdite: 5, tyrian: 6 };

const SPOTS = [
  { id: "shrimp", label: "Shrimp spot" },
  { id: "river",  label: "River" },
  { id: "sea",    label: "Sea" },
];

const RODS = [
  { id: "bronze",  label: "Bronze rod",  icon: "bronze_fishing_rod" },
  { id: "iron",    label: "Iron rod",    icon: "iron_fishing_rod" },
  { id: "steel",   label: "Steel rod",   icon: "steel_fishing_rod" },
  { id: "mithril", label: "Mithril rod", icon: "mithril_fishing_rod" },
  { id: "ebony",   label: "Ebony rod",   icon: "ebony_fishing_rod" },
  { id: "verdite", label: "Verdite rod", icon: "verdite_fishing_rod" },
  { id: "tyrian",  label: "Tyrian rod",  icon: "tyrian_fishing_rod" },
];

const MAX_LEVEL = 200;

/* ============ STATE ============ */

// Persists across re-renders (the calculator only re-renders on skill switch).
const state = { spot: "river", rod: "verdite" };
let lastLevel = 1;
let mounted = null; // { spotSelect, rodSelect, hint }

/* ============ PURE MATH ============ */

function weight(p) {
  let w = Math.pow(3, Math.min(p, 6) / 6);
  if (p > 10) w *= Math.pow(0.5, (p - 10) / 10);
  return w;
}

function eligibleFish(level, rod, spot) {
  const rodTier = ROD_TIERS[rod];
  return FISH.filter(
    (f) => f.spot === spot && level >= f.lvl && ROD_TIERS[f.rod] <= rodTier
  );
}

function catchChances(level, rod, spot) {
  const eligible = eligibleFish(level, rod, spot).map((f) => ({
    name: f.name,
    w: weight(level - f.lvl),
  }));
  const total = eligible.reduce((sum, f) => sum + f.w, 0);
  if (total === 0) return {};
  return Object.fromEntries(eligible.map((f) => [f.name, f.w / total]));
}

/**
 * Simulates the climb level by level for one (rod, spot) combination.
 * Returns expected catches overall, per fish, and per level.
 *
 * Note: each levelBreakdown entry's `level` is the level you are AT while
 * earning that XP (so the entry for level 60 is the XP that takes you 60 -> 61).
 */
function simulate({ startXp, xpNeeded, currentLevel, rod, spot, bonus }) {
  const catchesByFish = {};
  const levelBreakdown = []; // { level, catches, chances }
  let totalCatches = 0;
  let xpGained = 0;
  let level = currentLevel;
  let xpIntoLevel = startXp - totalXpForLevel(level);
  let stalledAt = null;

  while (xpGained < xpNeeded && level < MAX_LEVEL) {
    const chances = catchChances(level, rod, spot);
    const entries = Object.entries(chances);
    if (entries.length === 0) {
      stalledAt = level;
      break;
    }

    let expectedXp = 0;
    for (const [name, chance] of entries) {
      const fish = FISH.find((f) => f.name === name);
      expectedXp += chance * xpWithBonus(fish.xp, bonus);
    }

    const remainingInLevel = stepXp(level) - xpIntoLevel;
    const xpThisStep = Math.min(remainingInLevel, xpNeeded - xpGained);
    const catches = xpThisStep / expectedXp;

    totalCatches += catches;
    xpGained += xpThisStep;
    for (const [name, chance] of entries) {
      catchesByFish[name] = (catchesByFish[name] || 0) + catches * chance;
    }
    levelBreakdown.push({ level, catches, chances });

    if (xpThisStep >= remainingInLevel) {
      level += 1;
      xpIntoLevel = 0;
    } else {
      xpIntoLevel += xpThisStep;
    }
  }

  return { totalCatches, catchesByFish, levelBreakdown, xpGained, endLevel: level, stalledAt };
}

/**
 * Largest-remainder rounding: rounds values to integers so they sum exactly
 * to Math.ceil(sum of values). Returns an array in the same order as input.
 */
function roundToTotal(values) {
  const target = Math.ceil(values.reduce((a, b) => a + b, 0) - 1e-9);
  const floors = values.map(Math.floor);
  let remaining = target - floors.reduce((a, b) => a + b, 0);
  const order = values
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...floors];
  for (const { i } of order) {
    if (remaining <= 0) break;
    out[i] += 1;
    remaining -= 1;
  }
  return out;
}

/* ============ UI HELPERS ============ */

const spotLabel = (id) => SPOTS.find((s) => s.id === id)?.label ?? id;
const rodLabel = (id) => RODS.find((r) => r.id === id)?.label ?? id;

function spotHasAnyFish(spot, level) {
  return FISH.some((f) => f.spot === spot && level >= f.lvl);
}

// A rod unlocks at the level of the lowest-level fish that needs it.
// Rods with no fish never unlock.
function rodUnlockLevel(rod) {
  const levels = FISH.filter((f) => f.rod === rod).map((f) => f.lvl);
  return levels.length ? Math.min(...levels) : Infinity;
}

function rodUnlocked(rod, level) {
  return level >= rodUnlockLevel(rod);
}

function updateHint() {
  if (!mounted) return;
  const canCatch = eligibleFish(lastLevel, state.rod, state.spot).length > 0;
  mounted.hint.textContent = canCatch
    ? ""
    : `Heads up: a ${rodLabel(state.rod)} can't catch anything at the ` +
      `${spotLabel(state.spot)} at level ${lastLevel}.`;
  mounted.hint.hidden = canCatch;
}

function refreshDisabledStates() {
  if (!mounted) return;
  const { spotSelect, rodSelect } = mounted;

  // Spots: grey out the ones with no fish at your level.
  for (const opt of spotSelect.options) {
    const usable = spotHasAnyFish(opt.value, lastLevel);
    opt.disabled = !usable;
    opt.classList.toggle("above-level", !usable);
  }
  // If the chosen spot became unusable, switch to the first usable one.
  if (!spotHasAnyFish(state.spot, lastLevel)) {
    const fallback = SPOTS.find((s) => spotHasAnyFish(s.id, lastLevel));
    if (fallback) {
      state.spot = fallback.id;
      spotSelect.value = fallback.id;
    }
  }

  // Rods: grey out only the ones you don't have the level for.
  for (const opt of rodSelect.options) {
    const unlockAt = rodUnlockLevel(opt.value);
    const unlocked = lastLevel >= unlockAt;
    const rod = RODS.find((r) => r.id === opt.value);
    opt.disabled = !unlocked;
    opt.classList.toggle("above-level", !unlocked);
    opt.textContent = unlocked
      ? rod.label
      : unlockAt === Infinity
        ? `${rod.label} (no fish yet)`
        : `${rod.label} (L${unlockAt})`;
  }
  // If the chosen rod got locked, fall back to the best unlocked one.
  if (!rodUnlocked(state.rod, lastLevel)) {
    const unlockedRods = RODS.filter((r) => rodUnlocked(r.id, lastLevel));
    if (unlockedRods.length) {
      state.rod = unlockedRods[unlockedRods.length - 1].id;
      rodSelect.value = state.rod;
    }
  }

  updateHint();
}

function buildSelect(id, labelText, options, selected) {
  const wrap = document.createElement("label");
  wrap.textContent = labelText + " ";
  const select = document.createElement("select");
  select.id = id;
  for (const o of options) {
    const opt = document.createElement("option");
    opt.value = o.id;
    opt.textContent = o.label;
    if (o.id === selected) opt.selected = true;
    select.appendChild(opt);
  }
  wrap.appendChild(select);
  return { wrap, select };
}

/* ============ RESULT RENDERING ============ */



function addChances(acc, chances, weightBy) {
  const out = { ...acc };
  for (const [name, c] of Object.entries(chances)) {
    out[name] = (out[name] || 0) + c * weightBy;
  }
  return out;
}

function renderLevelBreakdown(levelBreakdown) {
  // Group consecutive levels with the same fish mix to keep the table short.
  const groups = [];
  for (const row of levelBreakdown) {
    const key = Object.keys(row.chances).join("|");
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.endLevel = row.level;
      last.catches += row.catches;
      last.chanceSum = addChances(last.chanceSum, row.chances, row.catches);
    } else {
      groups.push({
        key,
        startLevel: row.level,
        endLevel: row.level,
        catches: row.catches,
        chanceSum: addChances({}, row.chances, row.catches),
      });
    }
  }

  const rounded = roundToTotal(groups.map((g) => g.catches));

  const body = groups
    .map((g, i) => {
      const mix = Object.entries(g.chanceSum)
        .map(([name, c]) => ({ name, share: c / g.catches }))
        .sort((a, b) => b.share - a.share)
        .map((m) => `${m.name} ${(m.share * 100).toFixed(0)}%`)
        .join(", ");
      // Show where each stretch takes you (e.g. "58 → 61"), so the last row's
      // end matches the headline's end level.
      const range = `${g.startLevel} → ${g.endLevel + 1}`;
      return `<tr><td>${range}</td><td>${fmt(rounded[i])}</td><td>${mix}</td></tr>`;
    })
    .join("");

  return `
    <h3>Catch mix by level range</h3>
    <table>
      <thead><tr><th>Level progress</th><th>Catches</th><th>Average mix</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
}

/* ============ SKILL DEFINITION ============ */

export const fishing = {
  id: "fishing",
  name: "Fishing",
  icon: "https://aldermere.online/assets/wiki/skills/fishing.webp",
  active: true,
  taskTitle: "Choose a fishing spot and rod",

  renderTask(container) {
    container.innerHTML = "";

    const actions = document.createElement("div");
    actions.className = "ore-actions";

    const spotUi = buildSelect("fishingSpot", "Spot:", SPOTS, state.spot);
    const rodUi = buildSelect("fishingRod", "Rod:", RODS, state.rod);

    spotUi.select.addEventListener("change", () => {
      state.spot = spotUi.select.value;
      refreshDisabledStates();
    });
    rodUi.select.addEventListener("change", () => {
      state.rod = rodUi.select.value;
      refreshDisabledStates();
    });

    actions.append(spotUi.wrap, rodUi.wrap);

    const note = document.createElement("p");
    note.className = "note";
    note.textContent =
      "Your rod decides which fish can bite. Better rods unlock higher-XP fish earlier, " +
      "so the same climb takes fewer catches. Rods are greyed out until you reach the " +
      "level of the first fish they unlock.";

    const hint = document.createElement("p");
    hint.className = "note error";
    hint.hidden = true;

    container.append(actions, note, hint);

    mounted = { spotSelect: spotUi.select, rodSelect: rodUi.select, hint };
    refreshDisabledStates();
  },

  onLevelChange(level) {
    lastLevel = level;
    refreshDisabledStates();
  },

  calculate({ xpNeeded, currentLevel, startXp, log }) {
    const bonus = log?.bonus ?? 0;
    const { spot, rod } = state;
    const begin = Number.isFinite(startXp) ? startXp : totalXpForLevel(currentLevel);

    if (eligibleFish(currentLevel, rod, spot).length === 0) {
      return (
        `<p class="error">Nothing is catchable at the ${spotLabel(spot)} with a ` +
        `${rodLabel(rod)} at level ${currentLevel}. Try a different spot or a better rod.</p>`
      );
    }

    const sim = simulate({ startXp: begin, xpNeeded, currentLevel, rod, spot, bonus });

    if (sim.stalledAt !== null) {
      return (
        `<p class="error">Progress stalls at level ${sim.stalledAt}: nothing is catchable ` +
        `at the ${spotLabel(spot)} with a ${rodLabel(rod)}.</p>`
      );
    }

    // Sort fish by expected catches, then round so the column sums to the headline total.
    const fishEntries = Object.entries(sim.catchesByFish).sort((a, b) => b[1] - a[1]);
    const roundedCatches = roundToTotal(fishEntries.map(([, count]) => count));

    const fishRows = fishEntries
      .map(([name, count], i) => {
        const fish = FISH.find((f) => f.name === name);
        const share = (count / sim.totalCatches) * 100;
        return `<tr>
          <td>${itemIconHTML(fish.icon ?? "", name)}</td>
          <td>${fmt(roundedCatches[i])}</td>
          <td>${share.toFixed(1)}%</td>
          <td>${fmt(xpWithBonus(fish.xp, bonus))}</td>
        </tr>`;
      })
      .join("");

    const reachedCap = sim.endLevel >= MAX_LEVEL && sim.xpGained < xpNeeded;

    return `
      <h3>Fishing: ${spotLabel(spot)} with ${rodLabel(rod)}</h3>
      <p><strong>About ${fmt(Math.ceil(sim.totalCatches))} catches</strong>
        to gain ${fmt(Math.round(sim.xpGained))} XP
        (level ${currentLevel} → ${sim.endLevel}).</p>
      ${reachedCap ? `<p class="note">Level cap (${MAX_LEVEL}) reached before the full target.</p>` : ""}

      <h3>Total catches by fish</h3>
      <table>
        <thead><tr><th>Fish</th><th>Expected catches</th><th>Share</th><th>XP each</th></tr></thead>
        <tbody>${fishRows}</tbody>
      </table>

      ${renderLevelBreakdown(sim.levelBreakdown)}

      <p class="note">Figures are expected values; real results vary with luck.
        The mix shifts as you level. Catch rate per hour isn't modelled.
        Level ranges show where each stretch takes you (e.g. 58 → 61 means
        you finish levels 58, 59 and 60).</p>
    `;
  },
};
