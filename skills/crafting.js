import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

function iconImg(item) {
  if (!item.icon) return "";
  return `<img class="item-icon" src="${ICON_BASE}${item.icon}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />`;
}

// Icons for raw materials (not in ITEMS). Add more as you look them up in the wiki JSON.
const RAW_ICONS = {
  "Wool": "wool",
  "Hemp": "hemp",
  "Flax": "flax",
  "Stinkreed": "stinkreed",
  "Toetoe": "toetoe",
  "Sunthread": "sunthread",
  "Animal Hide I": "animal_hide",
  "Animal Hide II": "animal_hide_ii",
  "Animal Hide III": "troll_hide",
  "Animal Hide IV": "bear_hide",
  "Animal Hide V": "swamp_dragonhide",
  "Animal Hide VI": "green_dragonhide",
};

function rawIconImg(name) {
  const icon = RAW_ICONS[name];
  if (!icon) return "";
  return iconImg({ icon });
}

// Names, levels, XP and icons are taken from the wiki data (wiki.v1.json, recipes with skill 9).
// Every item in a tier shares the tier's required level.
// Bowstring appears once per tier, so the tier level is appended to keep names unique.
const BASE_ITEMS = [
  // Level 1
  { name: "Bowstring (Lv 1)",        level: 1,   xp: 5,      icon: "bowstring" },
  { name: "Leather I",               level: 1,   xp: 5,      icon: "leather" },
  { name: "Wool Cloth",              level: 1,   xp: 5,      icon: "wool_cloth" },
  { name: "Leather Helm I",          level: 1,   xp: 10,     icon: "leather_helm" },
  { name: "Wool Facemask",           level: 1,   xp: 10,     icon: "facemask" },
  { name: "Wool Hat",                level: 1,   xp: 10,     icon: "wool_hat" },
  { name: "Leather Boots I",         level: 1,   xp: 10,     icon: "leather_boots" },
  { name: "Wool Boots",              level: 1,   xp: 10,     icon: "wool_boots" },
  { name: "Leather Gloves I",        level: 1,   xp: 10,     icon: "leather_gloves" },
  { name: "Wool Gloves",             level: 1,   xp: 10,     icon: "wool_gloves" },
  { name: "Leather Legs I",          level: 1,   xp: 15,     icon: "leather_legs" },
  { name: "Leather Quiver I",        level: 1,   xp: 15,     icon: "leather_quiver" },
  { name: "Wool Cape",               level: 1,   xp: 15,     icon: "wool_cape" },
  { name: "Wool Robe Bottom",        level: 1,   xp: 15,     icon: "wool_robe_bottom" },
  { name: "Leather Body I",          level: 1,   xp: 25,     icon: "leather_body" },
  { name: "Wool Robe Top",           level: 1,   xp: 25,     icon: "wool_robe_top" },

  // Level 10
  { name: "Bowstring (Lv 10)",       level: 10,  xp: 10.5,   icon: "bowstring" },
  { name: "Leather II",              level: 10,  xp: 10.5,   icon: "hard_leather" },
  { name: "Hemp Cloth",              level: 10,  xp: 10.5,   icon: "hemp_cloth" },
  { name: "Leather Helm II",         level: 10,  xp: 21,     icon: "hard_leather_helm" },
  { name: "Hemp Facemask",           level: 10,  xp: 21,     icon: "facemask" },
  { name: "Hemp Hat",                level: 10,  xp: 21,     icon: "hemp_hat" },
  { name: "Leather Boots II",        level: 10,  xp: 21,     icon: "hard_leather_boots" },
  { name: "Hemp Boots",              level: 10,  xp: 21,     icon: "hemp_boots" },
  { name: "Leather Gloves II",       level: 10,  xp: 21,     icon: "hard_leather_gloves" },
  { name: "Hemp Gloves",             level: 10,  xp: 21,     icon: "hemp_gloves" },
  { name: "Leather Legs II",         level: 10,  xp: 31.5,   icon: "hard_leather_legs" },
  { name: "Leather Quiver II",       level: 10,  xp: 31.5,   icon: "hard_leather_quiver" },
  { name: "Hemp Cape",               level: 10,  xp: 31.5,   icon: "hemp_cape" },
  { name: "Hemp Robe Bottom",        level: 10,  xp: 31.5,   icon: "hemp_robe_bottom" },
  { name: "Leather Body II",         level: 10,  xp: 52.5,   icon: "hard_leather_body" },
  { name: "Hemp Robe Top",           level: 10,  xp: 52.5,   icon: "hemp_robe_top" },

  // Level 20
  { name: "Bowstring (Lv 20)",       level: 20,  xp: 18.75,  icon: "bowstring" },
  { name: "Leather III",             level: 20,  xp: 18.75,  icon: "troll_leather" },
  { name: "Flax Cloth",              level: 20,  xp: 18.75,  icon: "flax_cloth" },
  { name: "Leather Helm III",        level: 20,  xp: 37.5,   icon: "troll_hide_helm" },
  { name: "Flax Facemask",           level: 20,  xp: 37.5,   icon: "facemask" },
  { name: "Flax Hat",                level: 20,  xp: 37.5,   icon: "flax_hat" },
  { name: "Leather Boots III",       level: 20,  xp: 37.5,   icon: "troll_hide_boots" },
  { name: "Flax Boots",              level: 20,  xp: 37.5,   icon: "flax_boots" },
  { name: "Leather Gloves III",      level: 20,  xp: 37.5,   icon: "troll_hide_gloves" },
  { name: "Flax Gloves",             level: 20,  xp: 37.5,   icon: "flax_gloves" },
  { name: "Leather Legs III",        level: 20,  xp: 56.25,  icon: "troll_hide_legs" },
  { name: "Leather Quiver III",      level: 20,  xp: 56.25,  icon: "troll_hide_quiver" },
  { name: "Flax Cape",               level: 20,  xp: 56.25,  icon: "flax_cape" },
  { name: "Flax Robe Bottom",        level: 20,  xp: 56.25,  icon: "flax_robe_bottom" },
  { name: "Leather Body III",        level: 20,  xp: 93.75,  icon: "troll_hide_body" },
  { name: "Flax Robe Top",           level: 20,  xp: 93.75,  icon: "flax_robe_top" },

  // Level 30
  { name: "Bowstring (Lv 30)",       level: 30,  xp: 28,     icon: "bowstring" },
  { name: "Leather IV",              level: 30,  xp: 28,     icon: "bear_leather" },
  { name: "Stinkreed Cloth",         level: 30,  xp: 28,     icon: "stinkreed_cloth" },
  { name: "Leather Helm IV",         level: 30,  xp: 56,     icon: "bear_hide_helm" },
  { name: "Stinkreed Facemask",      level: 30,  xp: 56,     icon: "facemask" },
  { name: "Stinkreed Hat",           level: 30,  xp: 56,     icon: "stinkreed_hat" },
  { name: "Leather Boots IV",        level: 30,  xp: 56,     icon: "bear_hide_boots" },
  { name: "Stinkreed Boots",         level: 30,  xp: 56,     icon: "stinkreed_boots" },
  { name: "Leather Gloves IV",       level: 30,  xp: 56,     icon: "bear_hide_gloves" },
  { name: "Stinkreed Gloves",        level: 30,  xp: 56,     icon: "stinkreed_gloves" },
  { name: "Leather Legs IV",         level: 30,  xp: 84,     icon: "bear_hide_legs" },
  { name: "Leather Quiver IV",       level: 30,  xp: 84,     icon: "bear_hide_quiver" },
  { name: "Stinkreed Cape",          level: 30,  xp: 84,     icon: "stinkreed_cape" },
  { name: "Stinkreed Robe Bottom",   level: 30,  xp: 84,     icon: "stinkreed_robe_bottom" },
  { name: "Leather Body IV",         level: 30,  xp: 140,    icon: "bear_hide_body" },
  { name: "Stinkreed Robe Top",      level: 30,  xp: 140,    icon: "stinkreed_robe_top" },

  // Level 40
  { name: "Bowstring (Lv 40)",       level: 40,  xp: 37.75,  icon: "bowstring" },
  { name: "Leather V",               level: 40,  xp: 37.75,  icon: "swamp_dhide_leather" },
  { name: "Toetoe Cloth",            level: 40,  xp: 37.75,  icon: "toetoe_cloth" },
  { name: "Leather Helm V",          level: 40,  xp: 75.5,   icon: "swamp_dhide_helm" },
  { name: "Toetoe Facemask",         level: 40,  xp: 75.5,   icon: "facemask" },
  { name: "Toetoe Hat",              level: 40,  xp: 75.5,   icon: "toetoe_hat" },
  { name: "Leather Boots V",         level: 40,  xp: 75.5,   icon: "swamp_dhide_boots" },
  { name: "Toetoe Boots",            level: 40,  xp: 75.5,   icon: "toetoe_boots" },
  { name: "Leather Gloves V",        level: 40,  xp: 75.5,   icon: "swamp_dhide_gloves" },
  { name: "Toetoe Gloves",           level: 40,  xp: 75.5,   icon: "toetoe_gloves" },
  { name: "Leather Legs V",          level: 40,  xp: 113.25, icon: "swamp_dhide_legs" },
  { name: "Leather Quiver V",        level: 40,  xp: 113.25, icon: "swamp_dhide_quiver" },
  { name: "Toetoe Cape",             level: 40,  xp: 113.25, icon: "toetoe_cape" },
  { name: "Toetoe Robe Bottom",      level: 40,  xp: 113.25, icon: "toetoe_robe_bottom" },
  { name: "Leather Body V",          level: 40,  xp: 188.75, icon: "swamp_dhide_body" },
  { name: "Toetoe Robe Top",         level: 40,  xp: 188.75, icon: "toetoe_robe_top" },

  // Level 60
  { name: "Bowstring (Lv 60)",       level: 60,  xp: 60,     icon: "bowstring" },
  { name: "Leather VI",              level: 60,  xp: 60,     icon: "green_dhide_leather" },
  { name: "Sunthread Cloth",         level: 60,  xp: 60,     icon: "sunthread_cloth" },
  { name: "Leather Helm VI",         level: 60,  xp: 120,    icon: "green_dhide_helm" },
  { name: "Sunthread Facemask",      level: 60,  xp: 120,    icon: "facemask" },
  { name: "Sunthread Hat",           level: 60,  xp: 120,    icon: "sunthread_hat" },
  { name: "Leather Boots VI",        level: 60,  xp: 120,    icon: "green_dhide_boots" },
  { name: "Sunthread Boots",         level: 60,  xp: 120,    icon: "sunthread_boots" },
  { name: "Leather Gloves VI",       level: 60,  xp: 120,    icon: "green_dhide_gloves" },
  { name: "Sunthread Gloves",        level: 60,  xp: 120,    icon: "sunthread_gloves" },
  { name: "Leather Legs VI",         level: 60,  xp: 180,    icon: "green_dhide_legs" },
  { name: "Leather Quiver VI",       level: 60,  xp: 180,    icon: "green_dhide_quiver" },
  { name: "Sunthread Cape",          level: 60,  xp: 180,    icon: "sunthread_cape" },
  { name: "Sunthread Robe Bottom",   level: 60,  xp: 180,    icon: "sunthread_robe_bottom" },
  { name: "Leather Body VI",         level: 60,  xp: 300,    icon: "green_dhide_body" },
  { name: "Sunthread Robe Top",      level: 60,  xp: 300,    icon: "sunthread_robe_top" },
];

// Collapsible groups, by required level (min inclusive, max exclusive). Edit freely.
const GROUPS = [
  { min: 1,   max: 10,       label: "Crafts lvl 1" },
  { min: 10,  max: 20,       label: "Crafts lvl 10" },
  { min: 20,  max: 30,       label: "Crafts lvl 20" },
  { min: 30,  max: 40,       label: "Crafts lvl 30" },
  { min: 40,  max: 60,       label: "Crafts lvl 40" },
  { min: 60,  max: 80,       label: "Crafts lvl 60" },
  { min: 80,  max: 100,      label: "Crafts lvl 80" },
  { min: 100, max: Infinity, label: "Crafts lvl 100" },
];

// ---------------------------------------------------------------------------
// CRAFT TYPES: Leather vs Cloth
// ---------------------------------------------------------------------------
// Your selection is kept when you switch tabs, so you can tick leather items,
// switch to Cloth and tick more; both end up in the same plan.
const CRAFT_TYPES = [
  { id: "leather", label: "Leather" },
  { id: "cloth",   label: "Cloth" },
];

// Anything containing one of these is cloth
const CLOTH_KEYWORDS = ["wool", "hemp", "flax", "stinkreed", "toetoe", "sunthread", "merino", "bogsilk"];

// Always cloth, checked first (bowstrings and facemasks)
const CLOTH_OVERRIDES = ["bowstring", "facemask"];

function getCraftType(item) {
  const n = item.name.toLowerCase();
  if (CLOTH_OVERRIDES.some((k) => n.includes(k))) return "cloth";
  if (CLOTH_KEYWORDS.some((k) => n.includes(k))) return "cloth";
  return "leather"; // Leather I-VII and their gear
}

// ---------------------------------------------------------------------------
// RECIPES (from the wiki data)
//   Body / Robe Top .............. 5 material
//   Legs / Quiver / Cape / Robe Bottom ... 3 material
//   Helm / Hat / Facemask / Gloves / Boots ... 2 material
// The base material (Leather, Wool Cloth, etc.) is itself a craft in this list,
// so it is an intermediate: crafts of it in your plan are consumed first, and any
// shortfall expands down to the raw input (Wool, Toetoe, Animal Hide V...).
// ---------------------------------------------------------------------------

// Base material per tier level
const TIER_MATS = {
  1:   { leather: "Leather I",   cloth: "Wool Cloth" },
  10:  { leather: "Leather II",  cloth: "Hemp Cloth" },
  20:  { leather: "Leather III", cloth: "Flax Cloth" },
  30:  { leather: "Leather IV",  cloth: "Stinkreed Cloth" },
  40:  { leather: "Leather V",   cloth: "Toetoe Cloth" },
  60:  { leather: "Leather VI",  cloth: "Sunthread Cloth" },
};

// Raw input for each tier's bowstring
const BOWSTRING_RAW = {
  1:   "Wool",
  10:  "Hemp",
  20:  "Flax",
  30:  "Stinkreed",
  40:  "Toetoe",
  60:  "Sunthread",
};

// Raw input for the base material items themselves (Leather, Cloth)
const BASE_MAT_RAW = {
  "Leather I":       "Animal Hide I",
  "Leather II":      "Animal Hide II",
  "Leather III":     "Animal Hide III",
  "Leather IV":      "Animal Hide IV",
  "Leather V":       "Animal Hide V",
  "Leather VI":      "Animal Hide VI",
  "Leather VII":     "Animal Hide VII",
  "Wool Cloth":      "Wool",
  "Hemp Cloth":      "Hemp",
  "Flax Cloth":      "Flax",
  "Stinkreed Cloth": "Stinkreed",
  "Toetoe Cloth":    "Toetoe",
  "Sunthread Cloth": "Sunthread",
};

// Tier base level for an item (1, 10, 20, 30, 40, 60, 80, 100)
function tierOf(level) {
  const tiers = Object.keys(TIER_MATS).map(Number).sort((a, b) => a - b);
  let t = tiers[0];
  for (const x of tiers) if (level >= x) t = x;
  return t;
}

// How many base materials a piece needs, by name
function piecesCount(name) {
  // Drop a trailing tier numeral ("Leather Body IV" -> "leather body")
  const n = name.toLowerCase().replace(/ [ivx]+$/, "");
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
  return mats[type] ? { [mats[type]]: count } : {};
}

// Attach type + recipe once; ITEMS indexes stay stable
// Icons come from the wiki data (`icon` on each BASE_ITEMS entry). iconName() is only a
// fallback for entries without one. Add special cases to ICON_OVERRIDES if an icon breaks.
const ICON_OVERRIDES = {};

function iconName(name) {
  if (ICON_OVERRIDES[name]) return ICON_OVERRIDES[name];
  if (name.startsWith("Bowstring")) return "bowstring";
  if (name.endsWith("Facemask")) return "facemask";
  if (name.endsWith("Quiver")) return "quiver";
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const ITEMS = BASE_ITEMS.map((it) => ({
  ...it,
  icon: it.icon || iconName(it.name),
  type: getCraftType(it),
  mats: recipeFor(it),
  // Cloth / Leather: these are used up by the gear pieces
  isBaseMat: Boolean(BASE_MAT_RAW[it.name]),
}));

const ITEM_BY_NAME = Object.fromEntries(ITEMS.map((it) => [it.name, it]));

// Icon for any material name: crafted items first, then raw materials
function matIconImg(name) {
  const item = ITEM_BY_NAME[name];
  return item ? iconImg(item) : rawIconImg(name);
}

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
          <td>${matIconImg(mat)}${mat}</td>
          <td>${fmt(qty)}</td>
          <td><input type="number" class="haveInput" min="0" step="1"
                     data-need="${qty}" placeholder="0"
                     aria-label="Amount of ${mat} you have" /></td>
          <td class="remaining">${fmt(qty)}</td>
        </tr>`).join("")}
    </table>`;
}

// What each planned item uses: crafts x material per craft = total.
function perItemMatsTable(planItems) {
  const rows = [];
  planItems.forEach(({ item, count }) => {
    if (!count) return;
    for (const [mat, per] of Object.entries(item.mats)) {
      rows.push(`
        <tr>
          <td>${iconImg(item)}${item.name}</td>
          <td>${fmt(count)}</td>
          <td>${per} × ${matIconImg(mat)}${mat}</td>
          <td>${fmt(per * count)}</td>
        </tr>`);
    }
  });
  if (rows.length === 0) return "";
  return `
    <h3>Materials per item</h3>
    <table class="matsTable">
      <tr><th>Item</th><th>Crafts</th><th>Each craft uses</th><th>Total used</th></tr>
      ${rows.join("")}
    </table>`;
}

// Exact cloth / leather that the gear pieces in the plan use up.
// "Crafted in this plan" = cloth/leather crafts that are part of the plan itself.
function baseMatsTable(planItems) {
  const needed = {};
  const fromPlan = {};
  planItems.forEach(({ item, count }) => {
    if (!count) return;
    if (item.isBaseMat) fromPlan[item.name] = (fromPlan[item.name] || 0) + count;
    for (const [mat, per] of Object.entries(item.mats)) {
      if (ITEM_BY_NAME[mat]?.isBaseMat) needed[mat] = (needed[mat] || 0) + per * count;
    }
  });

  const rows = Object.entries(needed).sort((a, b) => a[0].localeCompare(b[0]));
  if (rows.length === 0) return "";
  return `
    <h3>Cloth &amp; leather needed</h3>
    <table class="matsTable">
      <tr><th>Material</th><th>Needed</th><th>Crafted in this plan</th><th>You have</th><th>Still need</th></tr>
      ${rows.map(([mat, qty]) => {
        const made = fromPlan[mat] || 0;
        const left = Math.max(0, qty - made);
        return `
        <tr>
          <td>${matIconImg(mat)}${mat}</td>
          <td>${fmt(qty)}</td>
          <td>${fmt(made)}</td>
          <td><input type="number" class="haveInput" min="0" step="1"
                     data-need="${left}" placeholder="0"
                     aria-label="Amount of ${mat} you have" /></td>
          <td class="remaining${left === 0 ? " done" : ""}">${fmt(left)}</td>
        </tr>`;
      }).join("")}
    </table>`;
}

// All three material tables for a plan
function materialsHtml(planItems) {
  return perItemMatsTable(planItems) +
    baseMatsTable(planItems) +
    matsTable(planRawMats(planItems),
      "Raw materials (if you craft all the cloth/leather yourself)");
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

// Selected item indexes. Kept here (not read from the checkboxes) so the
// selection survives switching between the Leather / Cloth / Both tabs.
const selected = new Set();

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedIndexes = () => [...selected].sort((a, b) => a - b);

// Copy the state of the checkboxes currently on screen into `selected`
function syncSelectionFromChecks() {
  qa(".itemCheck").forEach((c) => {
    const i = parseInt(c.value, 10);
    if (c.checked) selected.add(i);
    else selected.delete(i);
  });
}

function updateSelectedCount() {
  const el = q(".selectedCount");
  if (el) el.textContent = `${selected.size} selected`;

  // Per-tab counts, so you can see what's ticked on the other tab
  qa(".craftTab").forEach((btn) => {
    const type = btn.dataset.type;
    const n = [...selected].filter((i) => ITEMS[i].type === type).length;
    const badge = btn.querySelector(".tab-count");
    if (badge) badge.textContent = n ? ` (${n})` : "";
  });
}

// ---------- Crafts per round ----------

// The number typed in item i's "crafts per round" box (empty = 0)
function typedRatio(i) {
  const el = q(`.ratioInput[data-item="${i}"]`);
  const raw = el ? el.value : (savedRatios.has(i) ? savedRatios.get(i) : "");
  const r = Math.floor(parseFloat(raw));
  return Number.isFinite(r) && r > 0 ? r : 0;
}

// Ratios for the selected items, as Map(index -> crafts per round).
// Crafts per round is optional. Gear left empty is not in the combined plan.
// Cloth/leather left empty: the calculation uses exactly what your gear uses per
// round (e.g. 1 Facemask + 1 Robe Top = 2 + 5 = 7 Sunthread Cloth).
// Type a number for it and your own number is used instead.
function computeRatios(idx) {
  const res = new Map();
  idx.forEach((i) => {
    if (!ITEMS[i].isBaseMat) res.set(i, typedRatio(i));
  });
  idx.forEach((i) => {
    const base = ITEMS[i];
    if (!base.isBaseMat) return;
    const typed = typedRatio(i);
    let need = 0;
    idx.forEach((j) => {
      const gear = ITEMS[j];
      if (gear.isBaseMat) return;
      const per = gear.mats[base.name];
      if (per) need += per * res.get(j);
    });
    res.set(i, typed === 0 && need > 0 ? need : typed);
  });
  return res;
}

function updateGroupCounts() {
  qa(".group").forEach((g) => {
    const boxes = [...g.querySelectorAll(".itemCheck")];
    const checked = boxes.filter((b) => b.checked).length;
    g.querySelector(".group-count").textContent = `(${checked}/${boxes.length})`;
  });
}

// Rebuild the "Crafts per round" rows for the current selection.
// Boxes start empty (optional); typed values are remembered.
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
    const value = savedRatios.has(i) ? savedRatios.get(i) : "";
    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `<span>${iconImg(ITEMS[i])}${ITEMS[i].name}</span>
      <span><input type="number" class="ratioInput" data-item="${i}" min="0" step="1" value="${value}" placeholder="-" /> crafts</span>`;
    mixInputs.appendChild(row);
  });
}

function onSelectionChange() {
  syncSelectionFromChecks();
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
        <input type="checkbox" class="itemCheck" value="${i}" ${selected.has(i) ? "checked" : ""} />
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

  // Open groups that already have ticked items; otherwise open the first group
  const groups = qa(".group");
  groups.forEach((g) => {
    if (g.querySelector(".itemCheck:checked")) g.open = true;
  });
  if (groups.length && !groups.some((g) => g.open)) groups[0].open = true;

  // Re-apply the current filter text and level hint to the new tab
  applyFilter();
  applyLevelHint(lastLevel);

  // Selection is kept across tabs; just refresh counters and the ratio panel
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

  // Groups are rebuilt; ticked items stay ticked (they live in `selected`)
  renderGroups();
}

// ---------- Result builders ----------

function usableCell(currentLevel, item) {
  return currentLevel >= item.level ? "✅" : "❌ Lv " + item.level;
}

// Each selected item has a ratio r (crafts per round). One round yields
// sum(r * xpEach) XP. R = smallest whole number of rounds that reaches the target.
// Crafts per item = r * R. Only shown once at least one box has a number.
// Cloth/leather left at 1 is crafted in exactly the amount your gear uses
// (see computeRatios); any other number you type is used as-is.
function ratioPlanHtml(selected, xpNeeded, currentLevel, log, title) {
  const ratioMap = computeRatios(selected.map(({ i }) => i));
  const ratios = selected.map(({ i }) => ratioMap.get(i));

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
    if (!count) return; // left empty: not part of the combined plan
    totalCrafts += count;
    planItems.push({ item, count });
    html += `
      <tr>
        <td>${iconImg(item)}${item.name}</td>
        <td>${fmt(ratios[n])}</td>
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

  html += materialsHtml(planItems);
  return html;
}

function singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title) {
  let html = `
    <h3>If you craft only one item (${title})</h3>
    <table>
      <tr><th>Item</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ logs</th><th>Crafts needed</th><th>Materials used</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const count = Math.ceil(xpNeeded / xpEach);
    const mats = Object.entries(item.mats)
      .map(([m, per]) => `${fmt(per * count)} ${matIconImg(m)}${m}`).join(", ");
    html += `
      <tr>
        <td>${iconImg(item)}${item.name}</td>
        <td>${item.level}</td>
        <td>${fmt(item.xp)}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(count)}</td>
        <td>${mats}</td>
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
    html += materialsHtml([{ item, count }]);
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
    selected.clear();

    root.innerHTML = `
      <div class="craft-tabs" role="tablist">
        ${CRAFT_TYPES.map((t) => `
          <button type="button" role="tab"
            class="craftTab ${t.id === activeType ? "active" : ""}"
            data-type="${t.id}"
            aria-selected="${t.id === activeType}">${t.label}<span class="tab-count"></span></button>`).join("")}
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
        <p class="note">Optional. Fill in how many of each item to craft per round to
          get a combined plan; items left empty are skipped. Cloth and leather left
          empty are calculated as exactly what your gear uses.</p>
        <div class="mixInputs"></div>
        <button type="button" class="resetRatiosBtn">Clear all</button>
      </div>`;

    qa(".craftTab").forEach((btn) =>
      btn.addEventListener("click", () => setActiveType(btn.dataset.type))
    );
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));
    q(".resetRatiosBtn").addEventListener("click", () => {
      savedRatios.clear();
      qa(".ratioInput").forEach((el) => { el.value = ""; });
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

    // Combined plan: only when 2+ items are selected and at least one box is filled in
    const anyRatio = selected.some(({ i }) => typedRatio(i) > 0);
    if (selected.length > 1 && anyRatio) {
      html += ratioPlanHtml(selected, xpNeeded, currentLevel, log, title);
    }

    // Single-item breakdown
    html += singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title);

    html += `
      <p class="note">Craft counts round up, so totals can overshoot your target by up
      to one round's worth of XP. Material amounts come from the wiki recipes: body /
      robe top 5, legs / quiver / cape / robe bottom 3, helm / hat / facemask / boots /
      gloves 2 cloth or leather each.</p>`;

    return html;
  },
};
