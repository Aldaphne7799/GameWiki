import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

// ---------------------------------------------------------------------------
// FARMING DATA (names, levels, XP transcribed from the XP table screenshots)
// ---------------------------------------------------------------------------

const HERB_PATCHES = 3;
const FIBRE_PATCHES = 4;
const COOP_CAP = { poultry: 32, sheep: 16, cow: 16 };

const MANURE_BONUS = 1.2;        // +20% herbs / fibre. Does NOT affect seeds.
const PICKS_PER_HERB = 3;        // herbs: 3 pickings per planting
const HERB_SEEDS_AVG = 2;        // "1 or 2 seeds" back, assume 2 (matches your by-hand method)

// Herbs per picking, indexed by levels above the crop's required level (+12 and up = 40)
const HERB_PICK_TABLE = [5, 7, 8, 9, 11, 13, 15, 19, 22, 26, 32, 38, 40];
// Fibre per harvest, indexed by levels above the crop (+6 and up = 135)
const FIBRE_YIELD_TABLE = [45, 63, 72, 81, 99, 117, 135];

// Seeds back from letting a fibre crop go to seed (manure doesn't help)
function fibreSeedYield(above) {
  if (above >= 12) return 54;
  if (above >= 8) return 45;
  if (above >= 4) return 36;
  return 27;
}

// Timings in minutes
const HERB_GROW = 105;      // 1h45 per picking
const HERB_SEED_TIME = 70;  // 1h10 to seed after last picking
const FIBRE_GROW = 210;     // 3h30
const FIBRE_SEED_GROW = 315; // 3h30 + 1h45 to let it go to seed

// ---------------------------------------------------------------------------
// HERBS: { plantXp, herbXp, level }
// ---------------------------------------------------------------------------
const HERBS = [
  { name: "Wildleaf",  level: 1,  plantXp: 10,   herbXp: 25 },
  { name: "Vervain",   level: 21, plantXp: 39.5, herbXp: 99 },
  { name: "Moonbloom", level: 41, plantXp: 77.5, herbXp: 195 },
  { name: "Embersage", level: 61, plantXp: 120,  herbXp: 300 },
];

// ---------------------------------------------------------------------------
// FIBRES: { plantXp, fibreXp (per fibre = per seed), level }
// ---------------------------------------------------------------------------
const FIBRES = [
  { name: "Hemp",      level: 11, plantXp: 23,   fibreXp: 7 },
  { name: "Flax",      level: 21, plantXp: 39.5, fibreXp: 11.75 },
  { name: "Stinkreed", level: 31, plantXp: 58,   fibreXp: 17.5 },
  { name: "Toetoe",    level: 41, plantXp: 77.5, fibreXp: 23.25 },
  { name: "Sunthread", level: 61, plantXp: 120,  fibreXp: 36 },
];

// ---------------------------------------------------------------------------
// LIVESTOCK
// Each animal has: unlocks at `level`, a pen `kind` (poultry/sheep/cow),
// and a set of repeatable actions with their XP.
// You can't mix breeds in one pen, so each breed is its own pen.
// ---------------------------------------------------------------------------
const ANIMALS = [
  { id: "hen",       name: "Hen",             level: 1,  kind: "poultry", egg: 15,     grow: 10,    slaughter: 30 },
  { id: "copperneck",name: "Copperneck Hen",  level: 21, kind: "poultry", egg: 59.25,  grow: 39.5,  slaughter: 118.5 },
  { id: "goose",     name: "Goose",           level: 41, kind: "poultry", egg: 116.25, grow: 77.5,  slaughter: 232.5 },
  { id: "stormneck", name: "Stormneck Goose", level: 61, kind: "poultry", egg: 180,    grow: 120,   slaughter: 360 },

  { id: "sheep",     name: "Sheep",           level: 1,  kind: "sheep",   shear: 30,   milk: 15,    grow: 10,  slaughter: 30 },
  { id: "merino",    name: "Merino Sheep",    level: 81, kind: "sheep",   shear: 480,  milk: 240,   grow: 160, slaughter: 480 },

  { id: "cow",       name: "Cow",             level: 21, kind: "cow",     milk: 118.5, grow: 39.5,  slaughter: 118.5 },
  { id: "blackcow",  name: "Black Cow",       level: 41, kind: "cow",     milk: 232.5, grow: 77.5,  slaughter: 232.5 },
  { id: "spotted",   name: "Spotted Cow",     level: 61, kind: "cow",     milk: 360,   grow: 120,   slaughter: 360 },
];

// ---------------------------------------------------------------------------
// ACTIONS: everything selectable in the UI becomes a flat list of "actions".
// Each action has a unique key, a tab (herbs / fibre / livestock), a group, a
// level, and a function xpEach(options) so manure / seed choices can change it.
// ---------------------------------------------------------------------------
const ACTIONS = [];

// ----- Herbs -----
// One action per herb: a full planting (plant + 3 pickings + seeds back).
// Options: manure (on/off), seed mode is built in (seeds always collected).
// Plus an optional "let it go to seed" variant, see note below.
HERBS.forEach((h) => {
  ACTIONS.push({
    key: `herb_${h.name}`,
    tab: "herbs",
    group: `${h.name} (Lv ${h.level})`,
    label: `${h.name} planting`,
    level: h.level,
    kind: "herb",
    data: h,
  });
});

// ----- Fibres -----
FIBRES.forEach((f) => {
  ACTIONS.push({
    key: `fibre_${f.name}`,
    tab: "fibre",
    group: `${f.name} (Lv ${f.level})`,
    label: `${f.name} planting`,
    level: f.level,
    kind: "fibre",
    data: f,
  });
});

// ----- Livestock -----
ANIMALS.forEach((a) => {
  const add = (suffix, label, xp, cadence) => {
    ACTIONS.push({
      key: `${a.id}_${suffix}`,
      tab: "livestock",
      group: `${a.name} (Lv ${a.level})`,
      label,
      level: a.level,
      kind: "livestock",
      animal: a,
      xp,
      cadence,
    });
  };
  if (a.egg)      add("egg",      `${a.name} egg`,        a.egg,      "egg");
  if (a.shear)    add("shear",    `${a.name} shear (wool)`, a.shear,  "twoday");
  if (a.milk)     add("milk",     `${a.name} milk`,       a.milk,     "twoday");
  if (a.grow)     add("grow",     `${a.name} grows up`,   a.grow,     "grow");
  if (a.slaughter) add("slaughter", `Slaughter ${a.name}`, a.slaughter, "slaughter");
});

// Muck out (generic action, 5 XP per muck level)
ACTIONS.push({
  key: "muck_out",
  tab: "livestock",
  group: "Pen upkeep",
  label: "Muck out (per muck level)",
  level: 1,
  kind: "livestock",
  xp: 5,
  cadence: "muck",
});

// Group display order inside each tab
function groupsFor(tab) {
  const seen = [];
  ACTIONS.filter((a) => a.tab === tab).forEach((a) => {
    if (!seen.includes(a.group)) seen.push(a.group);
  });
  return seen;
}

// ---------------------------------------------------------------------------
// XP MATHS
// ---------------------------------------------------------------------------

// ---- REPLACE herbPlantingXp with this version ----
// seedsBack: 1 or 2 (assumed average 2 unless the user picks "min")
function herbPlantingXp(h, farmingLevel, manure, seedsBack) {
  const above = Math.max(0, Math.min(farmingLevel - h.level, 12));
  let perPick = HERB_PICK_TABLE[above];
  if (manure) perPick = Math.round(perPick * MANURE_BONUS);
  const herbs = PICKS_PER_HERB * perPick;
  return h.plantXp + herbs * h.herbXp + seedsBack * h.herbXp;
}

// ---- Seeds consumed per planting ----
const HERB_SEEDS_USED = 1;
const FIBRE_SEEDS_USED = 9;

// ---- xpForOne now takes the seed-count option ----
function xpForOne(action, farmingLevel, opts) {
  if (action.kind === "herb") {
    const seedsBack = opts.minSeeds ? 1 : HERB_SEEDS_AVG;
    return herbPlantingXp(action.data, farmingLevel, !!opts.manure, seedsBack);
  }
  if (action.kind === "fibre") {
    return fibrePlantingXp(action.data, farmingLevel, !!opts.manure, opts.seed ? "seed" : "fibre");
  }
  return action.xp;
}

// Fibre planting XP. mode: "fibre" (harvest fibre) or "seed" (let it go to seed).
function fibrePlantingXp(f, farmingLevel, manure, mode) {
  const above = Math.max(0, Math.min(farmingLevel - f.level, 12));
  if (mode === "seed") {
    return f.plantXp + fibreSeedYield(above) * f.fibreXp; // manure doesn't help seeds
  }
  let fibre = FIBRE_YIELD_TABLE[Math.min(above, 6)];
  if (manure) fibre = Math.round(fibre * MANURE_BONUS);
  return f.plantXp + fibre * f.fibreXp;
}

// ---------------------------------------------------------------------------
// UI STATE
// ---------------------------------------------------------------------------
const TABS = [
  { id: "herbs",     label: "Herbs" },
  { id: "fibre",     label: "Fibre" },
  { id: "livestock", label: "Livestock" },
];

let root = null;
let activeTab = "herbs";
let lastLevel = null;

// Typed quantities per action key, preserved across rebuilds
const savedCounts = new Map();
// Per-action option state: { manure: bool, seed: bool }
const savedOptions = new Map();

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedKeys = () => qa(".actionCheck:checked").map((c) => c.value);
const actionByKey = (key) => ACTIONS.find((a) => a.key === key);

function updateSelectedCount() {
  const el = q(".selectedCount");
  if (el) el.textContent = `${selectedKeys().length} selected`;
}

function updateGroupCounts() {
  qa(".group").forEach((g) => {
    const boxes = [...g.querySelectorAll(".actionCheck")];
    const checked = boxes.filter((b) => b.checked).length;
    g.querySelector(".group-count").textContent = `(${checked}/${boxes.length})`;
  });
}

function patchCapNote(action) {
  if (action.kind === "herb") return `max ${HERB_PATCHES} patches`;
  if (action.kind === "fibre") return `max ${FIBRE_PATCHES} patches`;
  return "";
}

// Rebuild the "how many?" rows for the current selection.
// Herb/fibre rows get manure + let-it-go-to-seed toggles; livestock rows
// just get a count (animals, eggs, muck levels, etc).
function rebuildCountInputs() {
  updateSelectedCount();

  const section = q(".countSection");
  const inputs = q(".countInputs");
  const keys = selectedKeys();

  // Remember what's typed before wiping the rows
  qa(".countInput").forEach((el) => savedCounts.set(el.dataset.key, el.value));
  qa(".manureCheck").forEach((el) => {
    const o = savedOptions.get(el.dataset.key) || {};
    savedOptions.set(el.dataset.key, { ...o, manure: el.checked });
  });
  qa(".seedCheck").forEach((el) => {
    const o = savedOptions.get(el.dataset.key) || {};
    savedOptions.set(el.dataset.key, { ...o, seed: el.checked });
  });

  inputs.innerHTML = "";

  if (keys.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  keys.forEach((key) => {
    const a = actionByKey(key);
    const count = savedCounts.has(key) ? savedCounts.get(key) : 1;
    const opts = savedOptions.get(key) || { manure: false, seed: false };

    const row = document.createElement("div");
    row.className = "count-row";

    const isCrop = a.kind === "herb" || a.kind === "fibre";
    const cropOpts = isCrop ? `
      <label class="opt"><input type="checkbox" class="manureCheck" data-key="${key}"
        ${opts.manure ? "checked" : ""} /> Manured (+20%)</label>
      <label class="opt"><input type="checkbox" class="seedCheck" data-key="${key}"
        ${opts.seed ? "checked" : ""} /> Let it go to seed</label>` : "";

    const unit = isCrop ? "plantings" : "times";
    const capNote = patchCapNote(a);

    row.innerHTML = `
      <span class="count-label">${a.label}${capNote ? ` <em>(${capNote})</em>` : ""}</span>
      <span>
        <input type="number" class="countInput" data-key="${key}" min="0" step="1"
               value="${count}" /> ${unit}
      </span>
      ${cropOpts}`;
    inputs.appendChild(row);
  });
}

function onSelectionChange() {
  updateGroupCounts();
  rebuildCountInputs();
}

function setVisibleActions(state) {
  qa(".action-row").forEach((label) => {
    if (label.hidden) return;
    label.querySelector(".actionCheck").checked = state;
  });
  onSelectionChange();
}

function setGroupActions(groupEl, state) {
  groupEl.querySelectorAll(".action-row").forEach((label) => {
    if (label.hidden) return;
    label.querySelector(".actionCheck").checked = state;
  });
  onSelectionChange();
}

function applyFilter() {
  const term = q(".actionFilter").value.trim().toLowerCase();

  qa(".group").forEach((g) => {
    let anyVisible = false;
    g.querySelectorAll(".action-row").forEach((label) => {
      const a = actionByKey(label.dataset.key);
      const match = term === "" || a.label.toLowerCase().includes(term);
      label.hidden = !match;
      if (match) anyVisible = true;
    });

    g.hidden = !anyVisible;
    if (term !== "") {
      if (g.dataset.userOpen === undefined) g.dataset.userOpen = g.open ? "1" : "0";
      g.open = anyVisible;
    } else if (g.dataset.userOpen !== undefined) {
      g.open = g.dataset.userOpen === "1";
      delete g.dataset.userOpen;
    }
  });
}

function applyLevelHint(level) {
  if (!root || level === null) return;
  qa(".action-row").forEach((label) => {
    const a = actionByKey(label.dataset.key);
    label.classList.toggle("above-level", level < a.level);
  });
}

function renderGroups() {
  const groupsEl = q(".groups");
  groupsEl.innerHTML = "";

  groupsFor(activeTab).forEach((groupName) => {
    const actions = ACTIONS.filter((a) => a.tab === activeTab && a.group === groupName);
    if (actions.length === 0) return;

    const details = document.createElement("details");
    details.className = "group";
    details.innerHTML = `
      <summary>
        <span class="group-label">${groupName}</span>
        <span class="group-count"></span>
        <span class="group-actions">
          <button type="button" class="groupAllBtn">all</button>
          <button type="button" class="groupNoneBtn">none</button>
        </span>
      </summary>
      <div class="ore-grid"></div>`;

    const grid = details.querySelector(".ore-grid");
    actions.forEach((a) => {
      const label = document.createElement("label");
      label.className = "ore-item action-row";
      label.dataset.key = a.key;
      label.innerHTML = `
        <input type="checkbox" class="actionCheck" value="${a.key}" />
        <span class="ore-name">${a.label}</span>
        <span class="ore-meta">Req. Lv ${a.level}</span>`;
      grid.appendChild(label);
    });

    const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
    details.querySelector(".groupAllBtn").addEventListener("click", (e) => {
      stop(e); setGroupActions(details, true);
    });
    details.querySelector(".groupNoneBtn").addEventListener("click", (e) => {
      stop(e); setGroupActions(details, false);
    });

    groupsEl.appendChild(details);
  });

  qa(".actionCheck").forEach((c) => c.addEventListener("change", onSelectionChange));

  const first = q(".group");
  if (first) first.open = true;

  applyFilter();
  applyLevelHint(lastLevel);
  onSelectionChange();
}

function setActiveTab(tab) {
  if (tab === activeTab) return;
  activeTab = tab;
  qa(".farmTab").forEach((btn) => {
    const on = btn.dataset.tab === activeTab;
    btn.classList.toggle("active", on);
    btn.setAttribute("aria-selected", on ? "true" : "false");
  });
  renderGroups();
}

// ---------------------------------------------------------------------------
// RESULTS
// ---------------------------------------------------------------------------

// XP for ONE unit of an action (one planting, one egg, one slaughter...).
function xpForOne(action, farmingLevel, opts) {
  if (action.kind === "herb") {
    return herbPlantingXp(action.data, farmingLevel, !!opts.manure, "collect");
  }
  if (action.kind === "fibre") {
    return fibrePlantingXp(action.data, farmingLevel, !!opts.manure, opts.seed ? "seed" : "fibre");
  }
  // livestock actions carry a flat XP value
  return action.xp;
}

function usableCell(currentLevel, action) {
  return currentLevel >= action.level ? "✅" : "❌ Lv " + action.level;
}

// Read the user's current plan out of the count rows
function readPlan(farmingLevel) {
  return selectedKeys().map((key) => {
    const action = actionByKey(key);
    const countEl = q(`.countInput[data-key="${key}"]`);
    const manure = q(`.manureCheck[data-key="${key}"]`)?.checked || false;
    const seed = q(`.seedCheck[data-key="${key}"]`)?.checked || false;
    let count = Math.floor(parseFloat(countEl?.value));
    if (!Number.isFinite(count) || count < 0) count = 0;

    // Enforce patch limits so you can't plan more plantings than patches per round
    const opts = { manure, seed };
    const xpEach = xpForOne(action, farmingLevel, opts);
    return { action, count, opts, xpEach };
  });
}

function planTableHtml(plan, xpNeeded, currentLevel) {
  // One "round" = the counts exactly as typed (e.g. 3 moonbloom + 1 vervain).
  // Repeat the round until the XP target is reached.
  const xpPerRound = plan.reduce((s, p) => s + p.xpEach * p.count, 0);

  if (xpPerRound <= 0) {
    return `<p class="error" role="alert">Set at least one action to 1 or more.</p>`;
  }

  const rounds = Math.ceil(xpNeeded / xpPerRound);

  let html = `
    <h3>Your plan</h3>
    <p class="note">One round gives ${fmt(xpPerRound)} XP. You need
      <strong>${fmt(rounds)}</strong> round${rounds === 1 ? "" : "s"} to reach your target.</p>
    <table>
      <tr><th>Action</th><th>Options</th><th>XP each</th><th>Per round</th>
          <th>Total needed</th><th>XP from action</th><th>Usable?</th></tr>`;

  plan.forEach((p) => {
    if (p.count === 0) return;
    const optText = [
      p.opts.manure ? "manured" : "",
      p.opts.seed ? "to seed" : "",
    ].filter(Boolean).join(", ") || "-";
    const total = p.count * rounds;
    html += `
      <tr>
        <td>${p.action.label}</td>
        <td>${optText}</td>
        <td>${fmt(p.xpEach)}</td>
        <td>${fmt(p.count)}</td>
        <td>${fmt(total)}</td>
        <td>${fmt(p.xpEach * total)}</td>
        <td>${usableCell(currentLevel, p.action)}</td>
      </tr>`;
  });

  html += `</table>`;
  return html;
}

// Time estimate for the crop part of the plan (patches work in parallel)
function timeHtml(plan, rounds) {
  const crops = plan.filter((p) => p.count > 0 &&
    (p.action.kind === "herb" || p.action.kind === "fibre"));
  if (crops.length === 0) return "";

  
