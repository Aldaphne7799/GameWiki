import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

function iconImg(item) {
  if (!item.icon) return "";
  return `<img class="item-icon" src="${ICON_BASE}${item.icon}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />`;
}

// Names, levels and XP are transcribed directly from the screenshots.
// XP values use dots here (the source used decimal commas).
// Bowstring appears once per tier, so the tier level is appended to keep names unique.
const BASE_ITEMS = [
  // Level 1-11
  { name: "Bowstring (Lv 1)",       level: 1,  xp: 5 },
  { name: "Leather",                level: 1,  xp: 5 },
  { name: "Wool Cloth",             level: 3,  xp: 5 },
  { name: "Leather Helm",           level: 3,  xp: 10 },
  { name: "Wool Facemask",          level: 3,  xp: 10 },
  { name: "Wool Hat",               level: 3,  xp: 10 },
  { name: "Leather Boots",          level: 5,  xp: 10 },
  { name: "Wool Boots",             level: 5,  xp: 10 },
  { name: "Leather Gloves",         level: 6,  xp: 10 },
  { name: "Wool Gloves",            level: 6,  xp: 10 },
  { name: "Leather Legs",           level: 8,  xp: 15 },
  { name: "Leather Quiver",         level: 8,  xp: 15 },
  { name: "Wool Cape",              level: 8,  xp: 15 },
  { name: "Wool Robe Bottom",       level: 8,  xp: 15 },
  { name: "Leather Body",           level: 10, xp: 25 },
  { name: "Wool Robe Top",          level: 10, xp: 25 },

  // Level 11-21
  { name: "Bowstring (Lv 11)",      level: 11, xp: 11.5 },
  { name: "Hard Leather",           level: 11, xp: 11.5 },
  { name: "Hemp Cloth",             level: 11, xp: 11.5 },
  { name: "Hard Leather Helm",      level: 13, xp: 23 },
  { name: "Hemp Facemask",          level: 13, xp: 23 },
  { name: "Hemp Hat",               level: 13, xp: 23 },
  { name: "Hard Leather Boots",     level: 15, xp: 23 },
  { name: "Hemp Boots",             level: 15, xp: 23 },
  { name: "Hard Leather Gloves",    level: 16, xp: 23 },
  { name: "Hemp Gloves",            level: 16, xp: 23 },
  { name: "Hard Leather Legs",      level: 18, xp: 34.5 },
  { name: "Hard Leather Quiver",    level: 18, xp: 34.5 },
  { name: "Hemp Cape",              level: 18, xp: 34.5 },
  { name: "Hemp Robe Bottom",       level: 18, xp: 34.5 },
  { name: "Hard Leather Body",      level: 20, xp: 57.5 },
  { name: "Hemp Robe Top",          level: 20, xp: 57.5 },

  // Level 21-31
  { name: "Bowstring (Lv 21)",      level: 21, xp: 19.75 },
  { name: "Troll Leather",          level: 21, xp: 19.75 },
  { name: "Flax Cloth",             level: 21, xp: 19.75 },
  { name: "Troll Hide Helm",        level: 23, xp: 39.5 },
  { name: "Flax Facemask",          level: 23, xp: 39.5 },
  { name: "Flax Hat",               level: 23, xp: 39.5 },
  { name: "Troll Hide Boots",       level: 25, xp: 39.5 },
  { name: "Flax Boots",             level: 25, xp: 39.5 },
  { name: "Troll Hide Gloves",      level: 26, xp: 39.5 },
  { name: "Flax Gloves",            level: 26, xp: 39.5 },
  { name: "Troll Hide Legs",        level: 28, xp: 59.25 },
  { name: "Troll Hide Quiver",      level: 28, xp: 59.25 },
  { name: "Flax Cape",              level: 28, xp: 59.25 },
  { name: "Flax Robe Bottom",       level: 28, xp: 59.25 },
  { name: "Troll Hide Body",        level: 30, xp: 98.75 },
  { name: "Flax Robe Top",          level: 30, xp: 98.75 },

  // Level 31-41
  { name: "Bowstring (Lv 31)",      level: 31, xp: 29 },
  { name: "Bear Leather",           level: 31, xp: 29 },
  { name: "Stinkreed Cloth",        level: 31, xp: 29 },
  { name: "Bear Hide Helm",         level: 33, xp: 58 },
  { name: "Stinkreed Facemask",     level: 33, xp: 58 },
  { name: "Stinkreed Hat",          level: 33, xp: 58 },
  { name: "Bear Hide Boots",        level: 35, xp: 58 },
  { name: "Stinkreed Boots",        level: 35, xp: 58 },
  { name: "Bear Hide Gloves",       level: 36, xp: 58 },
  { name: "Stinkreed Gloves",       level: 36, xp: 58 },
  { name: "Bear Hide Legs",         level: 38, xp: 87 },
  { name: "Bear Hide Quiver",       level: 38, xp: 87 },
  { name: "Stinkreed Cape",         level: 38, xp: 87 },
  { name: "Stinkreed Robe Bottom",  level: 38, xp: 87 },
  { name: "Bear Hide Body",         level: 40, xp: 145 },
  { name: "Stinkreed Robe Top",     level: 40, xp: 145 },

  // Level 41-61
  { name: "Bowstring (Lv 41)",      level: 41, xp: 38.75 },
  { name: "Swamp D'hide Leather",   level: 41, xp: 38.75 },
  { name: "Toetoe Cloth",           level: 41, xp: 38.75 },
  { name: "Swamp D'hide Helm",      level: 43, xp: 77.5 },
  { name: "Toetoe Facemask",        level: 43, xp: 77.5 },
  { name: "Toetoe Hat",             level: 43, xp: 77.5 },
  { name: "Swamp D'hide Boots",     level: 46, xp: 77.5 },
  { name: "Toetoe Boots",           level: 46, xp: 77.5 },
  { name: "Swamp D'hide Gloves",    level: 49, xp: 77.5 },
  { name: "Toetoe Gloves",          level: 49, xp: 77.5 },
  { name: "Swamp D'hide Legs",      level: 53, xp: 116.25 },
  { name: "Swamp D'hide Quiver",    level: 53, xp: 116.25 },
  { name: "Toetoe Cape",            level: 53, xp: 116.25 },
  { name: "Toetoe Robe Bottom",     level: 53, xp: 116.25 },
  { name: "Swamp D'hide Body",      level: 57, xp: 193.75 },
  { name: "Toetoe Robe Top",        level: 57, xp: 193.75 },

  // Level 61-81
  { name: "Bowstring (Lv 61)",      level: 61, xp: 60 },
  { name: "Green D'hide Leather",   level: 61, xp: 60 },
  { name: "Sunthread Cloth",        level: 61, xp: 60 },
  { name: "Green D'hide Helm",      level: 63, xp: 120 },
  { name: "Sunthread Facemask",     level: 63, xp: 120 },
  { name: "Sunthread Hat",          level: 63, xp: 120 },
  { name: "Green D'hide Boots",     level: 66, xp: 120 },
  { name: "Sunthread Boots",        level: 66, xp: 120 },
  { name: "Green D'hide Gloves",    level: 69, xp: 120 },
  { name: "Sunthread Gloves",       level: 69, xp: 120 },
  { name: "Green D'hide Legs",      level: 73, xp: 180 },
  { name: "Green D'hide Quiver",    level: 73, xp: 180 },
  { name: "Sunthread Cape",         level: 73, xp: 180 },
  { name: "Sunthread Robe Bottom",  level: 73, xp: 180 },
  { name: "Green D'hide Body",      level: 77, xp: 300 },
  { name: "Sunthread Robe Top",     level: 77, xp: 300 },
];

// Collapsible groups, by required level (min inclusive, max exclusive). Edit freely.
const GROUPS = [
  { min: 1,  max: 11, label: "Crafts lvl 1-11" },
  { min: 11, max: 21, label: "Crafts lvl 11-21" },
  { min: 21, max: 31, label: "Crafts lvl 21-31" },
  { min: 31, max: 41, label: "Crafts lvl 31-41" },
  { min: 41, max: 61, label: "Crafts lvl 41-61" },
  { min: 61, max: 81, label: "Crafts lvl 61-81" },
];

// ---------------------------------------------------------------------------
// CRAFT TYPES: Leather vs Cloth
// ---------------------------------------------------------------------------
const CRAFT_TYPES = [
  { id: "leather", label: "Leather" },
  { id: "cloth",   label: "Cloth" },
];

// Anything containing one of these is cloth
const CLOTH_KEYWORDS = ["wool", "hemp", "flax", "stinkreed", "toetoe", "sunthread"];

// Always cloth, checked first (bowstrings and facemasks)
const CLOTH_OVERRIDES = ["bowstring", "facemask"];

function getCraftType(item) {
  const n = item.name.toLowerCase();
  if (CLOTH_OVERRIDES.some((k) => n.includes(k))) return "cloth";
  if (CLOTH_KEYWORDS.some((k) => n.includes(k))) return "cloth";
  return "leather"; // leather, hard leather, troll/bear hide, d'hide
}

// ---------------------------------------------------------------------------
// RECIPES (from the in-game screenshots)
//   Body / Robe Top .............. 5 material
//   Legs / Quiver / Cape / Robe Bottom ... 3 material
//   Helm / Hat / Facemask / Gloves / Boots ... 2 material
// The base material (Leather, Wool Cloth, etc.) is itself a craft in this list,
// so it is an intermediate: crafts of it in your plan are consumed first, and any
// shortfall expands down to the raw input (Wool, Toetoe, Swamp Dragonhide...).
// ---------------------------------------------------------------------------

// Base material per tier level
const TIER_MATS = {
  1:  { leather: "Leather",              cloth: "Wool Cloth" },
  11: { leather: "Hard Leather",         cloth: "Hemp Cloth" },
  21: { leather: "Troll Leather",        cloth: "Flax Cloth" },
  31: { leather: "Bear Leather",         cloth: "Stinkreed Cloth" },
  41: { leather: "Swamp D'hide Leather", cloth: "Toetoe Cloth" },
  61: { leather: "Green D'hide Leather", cloth: "Sunthread Cloth" },
};

// Raw input for each tier's bowstring (screenshot shows "Toetoe" for the lv 41 string)
const BOWSTRING_RAW = {
  1:  "Wool",
  11: "Hemp",
  21: "Flax",
  31: "Stinkreed",
  41: "Toetoe",
  61: "Sunthread",
};

// Raw input for the base material items themselves (Leather, Cloth)
const BASE_MAT_RAW = {
  "Leather":              "Animal Hide",
  "Hard Leather":         "Animal Hide",
  "Troll Leather":        "Troll Hide",
  "Bear Leather":         "Bear Hide",
  "Swamp D'hide Leather": "Swamp Dragonhide",
  "Green D'hide Leather": "Green Dragonhide",
  "Wool Cloth":           "Wool",
  "Hemp Cloth":           "Hemp",
  "Flax Cloth":           "Flax",
  "Stinkreed Cloth":      "Stinkreed",
  "Toetoe Cloth":         "Toetoe",
  "Sunthread Cloth":      "Sunthread",
};

// Tier base level for an item (1, 11, 21, 31, 41, 61)
function tierOf(level) {
  const tiers = Object.keys(TIER_MATS).map(Number).sort((a, b) => a - b);
  let t = tiers[0];
  for (const x of tiers) if (level >= x) t = x;
  return t;
}

// How many base materials a piece needs, by name
function piecesCount(name) {
  const n = name.toLowerCase();
  if (n.endsWith(" body") || n.endsWith("robe top")) return 5;
  if (n.endsWith(" legs") || n.endsWith("quiver") || n.endsWith(" cape") ||
      n.endsWith("robe bottom")) return 3;
  if (n.endsWith(" helm") || n.endsWith(" hat") || n.endsWith("facemask") ||
      n.endsWith(" boots") || n.endsWith(" gloves")) return 2;
  return 0;
}

function recipeFor(item) {
  const tier = tierOf(item.level);
  const mats = TIER_MATS[tier];
  if (!mats) return {};
  const n = item.name;

  // Bowstring: 1 raw fibre
  if (n.startsWith("Bowstring")) {
    const raw = BOWSTRING_RAW[tier];
    return raw ? { [raw]: 1 } : {};
  }

  // Base material (Leather, Cloth): 1 raw input
  if (BASE_MAT_RAW[n]) return { [BASE_MAT_RAW[n]]: 1 };

  // Armour / gear pieces: X of the tier's base material
  const count = piecesCount(n);
  if (count === 0) return {};
  const type = getCraftType(item);
  return { [mats[type]]: count };
}

// Attach type + recipe once; ITEMS indexes stay stable
// Icon name = item name in lowercase with underscores (e.g. "Hard Leather Helm" -> "hard_leather_helm").
// Bowstring tiers all share one icon. Add special cases to ICON_OVERRIDES if an icon breaks.
const ICON_OVERRIDES = {
  // "Swamp D'hide Leather": "swamp_dhide_leather",
};

function iconName(name) {
  if (ICON_OVERRIDES[name]) return ICON_OVERRIDES[name];
  if (name.startsWith("Bowstring")) return "bowstring";
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const ITEMS = BASE_ITEMS.map((it) => ({
  ...it,
  icon: iconName(it.name),
  type: getCraftType(it),
  mats: recipeFor(it),
}));

const ITEM_BY_NAME = Object.fromEntries(ITEMS.map((it) => [it.name, it]));

// ---------- Materials calculation ----------

// Expand `matName` x `qty`. Intermediates the plan already produces (in `produced`)
// are consumed first; only the shortfall expands into raw materials.
function addRawMats(totals, produced, matName, qty) {
  const sub = ITEM_BY_NAME[matName];
  if (sub && Object.keys(sub.mats).length) {
    const available = produced[matName] || 0;
    const used = Math.min(available, qty);
    produced[matName] = available - used;
    const shortfall = qty - used;
    if (shortfall > 0) {
      for (const [m, perCraft] of Object.entries(sub.mats)) {
        addRawMats(totals, produced, m, perCraft * shortfall);
      }
    }
  } else {
    totals[matName] = (totals[matName] || 0) + qty;
  }
}

// `planItems` = [{ item, count }]. Returns raw material totals.
// Each planned item's own ingredients are expanded exactly once; an intermediate
// (e.g. Hemp Cloth) that is also in the plan is taken from `produced` first.
function planRawMats(planItems) {
  const totals = {};
  const produced = {};
  planItems.forEach(({ item, count }) => {
    produced[item.name] = (produced[item.name] || 0) + count;
  });

  planItems.forEach(({ item, count }) => {
    if (!count) return;
    for (const [m, perCraft] of Object.entries(item.mats)) {
      addRawMats(totals, produced, m, perCraft * count);
    }
  });
  return totals;
}

function matsTable(totals, heading) {
  const rows = Object.entries(totals).sort((a, b) => a[0].localeCompare(b[0]));
  if (rows.length === 0) return "";
  return `
    <h3>${heading}</h3>
    <table class="matsTable">
      <tr><th>Material</th><th>Needed</th><th>You have</th><th>Still need</th></tr>
      ${rows.map(([mat, qty]) => `
        <tr>
          <td>${mat}</td>
          <td>${fmt(qty)}</td>
          <td><input type="number" class="haveInput" min="0" step="1"
                     data-need="${qty}" placeholder="0"
                     aria-label="Amount of ${mat} you have" /></td>
          <td class="remaining">${fmt(qty)}</td>
        </tr>`).join("")}
    </table>`;
}

// Call once after the results HTML has been inserted into the page
export function wireMatsInputs(resultsRoot) {
  resultsRoot.querySelectorAll(".haveInput").forEach((input) => {
    input.addEventListener("input", () => {
      const need = parseFloat(input.dataset.need) || 0;
      const have = parseFloat(input.value) || 0;
      const left = Math.max(0, need - have);
      const cell = input.closest("tr").querySelector(".remaining");
      cell.textContent = fmt(left);
      cell.classList.toggle("done", left === 0);
    });
  });
}

// ---------- UI ----------

// Module-level state
let root = null;
let activeType = "leather";
let lastLevel = null;

// Ratios (crafts per round) the user has typed, keyed by item index.
// Preserved across rebuilds so ticking another item doesn't wipe a tuned ratio.
const savedRatios = new Map();

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedIndexes = () =>
  qa(".itemCheck:checked").map((c) => parseInt(c.value, 10));

function updateSelectedCount() {
  const el = q(".selectedCount");
  if (el) el.textContent = `${selectedIndexes().length} selected`;
}

function updateGroupCounts() {
  qa(".group").forEach((g) => {
    const boxes = [...g.querySelectorAll(".itemCheck")];
    const checked = boxes.filter((b) => b.checked).length;
    g.querySelector(".group-count").textContent = `(${checked}/${boxes.length})`;
  });
}

// Rebuild the "Crafts per round" rows for the current selection.
// Default ratio is 1 for every item (= equal crafts); typed values are remembered.
function rebuildRatioInputs() {
  updateSelectedCount();

  const mixSection = q(".mixSection");
  const mixInputs = q(".mixInputs");
  const idx = selectedIndexes();

  // Remember whatever is currently typed before wiping the rows
  qa(".ratioInput").forEach((el) => {
    savedRatios.set(parseInt(el.dataset.item, 10), el.value);
  });

  mixInputs.innerHTML = "";

  if (idx.length < 2) {
    mixSection.hidden = true;
    return;
  }
  mixSection.hidden = false;

  idx.forEach((i) => {
    const value = savedRatios.has(i) ? savedRatios.get(i) : 1;
    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `<span>${ITEMS[i].name}</span>
      <span><input type="number" class="ratioInput" data-item="${i}" min="0" step="1" value="${value}" placeholder="0" /> crafts</span>`;
    mixInputs.appendChild(row);
  });
}

function onSelectionChange() {
  updateGroupCounts();
  rebuildRatioInputs();
}

// Select all / clear only affect items currently visible (respects the filter box)
function setVisibleItems(state) {
  qa(".item-row").forEach((label) => {
    if (label.hidden) return;
    label.querySelector(".itemCheck").checked = state;
  });
  onSelectionChange();
}

// Per-group shortcut (also respects the filter box)
function setGroupItems(groupEl, state) {
  groupEl.querySelectorAll(".item-row").forEach((label) => {
    if (label.hidden) return;
    label.querySelector(".itemCheck").checked = state;
  });
  onSelectionChange();
}

function applyFilter() {
  const term = q(".itemFilter").value.trim().toLowerCase();

  qa(".group").forEach((g) => {
    let anyVisible = false;

    g.querySelectorAll(".item-row").forEach((label) => {
      const name = ITEMS[parseInt(label.dataset.index, 10)].name.toLowerCase();
      const match = term === "" || name.includes(term);
      label.hidden = !match;
      if (match) anyVisible = true;
    });

    // Hide groups with no matches; auto-open groups with matches while filtering
    g.hidden = !anyVisible;
    if (term !== "") {
      if (g.dataset.userOpen === undefined) g.dataset.userOpen = g.open ? "1" : "0";
      g.open = anyVisible;
    } else if (g.dataset.userOpen !== undefined) {
      // Filter cleared: restore whatever state the group had before filtering
      g.open = g.dataset.userOpen === "1";
      delete g.dataset.userOpen;
    }
  });
}

// Apply the "above your level" hint to whatever is currently rendered
function applyLevelHint(level) {
  if (!root || level === null) return;
  qa(".item-row").forEach((label) => {
    const item = ITEMS[parseInt(label.dataset.index, 10)];
    label.classList.toggle("above-level", level < item.level);
  });
}

// Build the group list for the active craft type
function renderGroups() {
  const groupsEl = q(".groups");
  groupsEl.innerHTML = "";

  GROUPS.forEach((grp) => {
    // Indexes of items in this group that belong to the active craft type
    const indexes = [];
    ITEMS.forEach((item, i) => {
      if (item.type !== activeType) return;
      if (item.level < grp.min || item.level >= grp.max) return;
      indexes.push(i);
    });

    if (indexes.length === 0) return; // skip empty groups

    const details = document.createElement("details");
    details.className = "group";

    details.innerHTML = `
      <summary>
        <span class="group-label">${grp.label}</span>
        <span class="group-count"></span>
        <span class="group-actions">
          <button type="button" class="groupAllBtn">all</button>
          <button type="button" class="groupNoneBtn">none</button>
        </span>
      </summary>
      <div class="ore-grid"></div>`;

    const grid = details.querySelector(".ore-grid");

    indexes.forEach((i) => {
      const item = ITEMS[i];
      const label = document.createElement("label");
      label.className = "ore-item item-row";
      label.dataset.index = i;
      label.innerHTML = `
        <input type="checkbox" class="itemCheck" value="${i}" />
        <span class="ore-name">${iconImg(item)}${item.name}</span>
        <span class="ore-meta">Req. Lv ${item.level} · ${item.xp} XP</span>`;
      grid.appendChild(label);
    });

    // Buttons live inside <summary>: stop clicks from toggling the dropdown
    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    details.querySelector(".groupAllBtn").addEventListener("click", (e) => {
      stop(e);
      setGroupItems(details, true);
    });
    details.querySelector(".groupNoneBtn").addEventListener("click", (e) => {
      stop(e);
      setGroupItems(details, false);
    });

    groupsEl.appendChild(details);
  });

  qa(".itemCheck").forEach((c) => c.addEventListener("change", onSelectionChange));

  // Open the first group by default so the panel isn't just a column of headers
  const first = q(".group");
  if (first) first.open = true;

  // Re-apply the current filter text and level hint to the new tab
  applyFilter();
  applyLevelHint(lastLevel);

  // New tab = fresh (empty) selection, so refresh counters and the ratio panel
  onSelectionChange();
}

function setActiveType(type) {
  if (type === activeType) return;
  activeType = type;

  qa(".craftTab").forEach((btn) => {
    const on = btn.dataset.type === activeType;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });

  // Groups are rebuilt, so previous checkboxes disappear (selection resets)
  renderGroups();
}

// ---------- Result builders ----------

function usableCell(currentLevel, item) {
  return currentLevel >= item.level ? "✅" : "❌ Lv " + item.level;
}

// Each selected item has a ratio r (crafts per round). One round yields
// sum(r * xpEach) XP. R = smallest whole number of rounds that reaches the target.
// Crafts per item = r * R. With every ratio at 1 this is the old "equal crafts" plan.
function ratioPlanHtml(selected, xpNeeded, currentLevel, log, title) {
  const ratios = selected.map(({ i }) => {
    const el = q(`.ratioInput[data-item="${i}"]`);
    const r = Math.floor(parseFloat(el?.value));
    return Number.isFinite(r) && r > 0 ? r : 0;
  });

  const xpPerRound = selected.reduce(
    (s, { item }, n) => s + ratios[n] * xpWithBonus(item.xp, log.bonus), 0);

  if (xpPerRound <= 0) {
    return `<p class="error" role="alert">Set at least one item to 1 or more crafts per round.</p>`;
  }

  const rounds = Math.ceil(xpNeeded / xpPerRound);
  const planItems = [];
  let totalCrafts = 0;

  let html = `
    <h3>Combined plan (${title})</h3>
    <p class="note">${fmt(rounds)} round${rounds === 1 ? "" : "s"} of the ratio below.</p>
    <table>
      <tr><th>Item</th><th>Per round</th><th>XP each</th><th>Crafts needed</th><th>XP from item</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }, n) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const count = ratios[n] * rounds;
    totalCrafts += count;
    planItems.push({ item, count });
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${ratios[n]}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(count)}</td>
        <td>${fmt(xpEach * count)}</td>
        <td>${usableCell(currentLevel, item)}</td>
      </tr>`;
  });

  html += `
      <tr><td colspan="3"><strong>Total crafts</strong></td>
      <td><strong>${fmt(totalCrafts)}</strong></td><td></td><td></td></tr>
    </table>`;

  html += matsTable(planRawMats(planItems), "Materials needed (combined plan)");
  return html;
}

function singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title) {
  let html = `
    <h3>If you craft only one item (${title})</h3>
    <table>
      <tr><th>Item</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ logs</th><th>Crafts needed</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${item.level}</td>
        <td>${fmt(item.xp)}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(Math.ceil(xpNeeded / xpEach))}</td>
        <td>${usableCell(currentLevel, item)}</td>
      </tr>`;
  });

  html += `</table>`;

  // With exactly one item selected there is no combined plan,
  // so show that item's materials here instead.
  if (selected.length === 1) {
    const { item } = selected[0];
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const count = Math.ceil(xpNeeded / xpEach);
    html += matsTable(planRawMats([{ item, count }]), `Materials needed (${item.name})`);
  }

  return html;
}

// ---------- Skill definition ----------

export const crafting = {
  id: "crafting",
  name: "Crafting",
  icon: "https://aldermere.online/assets/wiki/skills/crafting.webp",
  active: true,
  taskTitle: "Choose your items",

  renderTask(container) {
    root = container;
    activeType = "leather"; // default tab each time the panel is built
    savedRatios.clear();

    root.innerHTML = `
      <div class="craft-tabs" role="tablist">
        ${CRAFT_TYPES.map((t) => `
          <button type="button" role="tab"
            class="craftTab ${t.id === activeType ? "active" : ""}"
            data-type="${t.id}"
            aria-selected="${t.id === activeType}">${t.label}</button>`).join("")}
      </div>
      <div class="ore-actions">
        <input type="search" class="itemFilter" aria-label="Filter items"
               placeholder="Filter items (e.g. boots, hemp, d'hide)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
        <span class="selectedCount">0 selected</span>
      </div>
      <div class="groups"></div>
      <div class="mixSection" hidden>
        <h3>Crafts per round</h3>
        <p class="note">Set how many of each item to craft per round, e.g. 17 cloth
          for every 1 of everything else. Leave everything at 1 for equal crafts.</p>
        <div class="mixInputs"></div>
        <button type="button" class="resetRatiosBtn">Reset all to 1</button>
      </div>`;

    qa(".craftTab").forEach((btn) =>
      btn.addEventListener("click", () => setActiveType(btn.dataset.type))
    );
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));
    q(".resetRatiosBtn").addEventListener("click", () => {
      savedRatios.clear();
      qa(".ratioInput").forEach((el) => { el.value = 1; });
    });

    renderGroups();
  },

  // Visual hint (not a lock) for items above the current level
  onLevelChange(level) {
    lastLevel = level;
    if (!root) return;
    applyLevelHint(level);
  },

  // Returns an HTML string for the results panel.
  // After inserting it into the page, call wireMatsInputs(resultsElement).
  calculate({ xpNeeded, currentLevel, log }) {
    const selected = selectedIndexes().map((i) => ({ item: ITEMS[i], i }));

    if (selected.length === 0) {
      return `<p class="note">Select at least one item to see how many you need.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";

    // Combined plan (2+ items)
    if (selected.length > 1) {
      html += ratioPlanHtml(selected, xpNeeded, currentLevel, log, title);
    }

    // Single-item breakdown
    html += singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title);

    html += `
      <p class="note">Craft counts round up, so totals can overshoot your target by up
      to one round's worth of XP. Materials include the base cloth/leather you craft
      yourself; if you plan those crafts too, they are counted first.</p>`;

    return html;
  },
};

