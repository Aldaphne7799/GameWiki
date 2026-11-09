import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------
const HERB_PATCHES = 3;
const FIBRE_PATCHES = 4;
const COOP_CAP = { poultry: 32, sheep: 16, cow: 16 };

const MANURE_BONUS = 1.2;     // +20% herbs / fibre. Does NOT affect seeds.
const PICKS_PER_HERB = 3;     // 3 pickings per herb planting
const HERB_SEEDS_AVG = 2;     // herb planting returns 1 or 2 seeds, assume 2
const HERB_SEEDS_USED = 1;    // seeds consumed per herb planting
const FIBRE_SEEDS_USED = 9;   // seeds consumed per fibre planting

// Herbs per picking, indexed by levels above the crop's level (+12 and up = 40)
const HERB_PICK_TABLE = [5, 7, 8, 9, 11, 13, 15, 19, 22, 26, 32, 38, 40];
// Fibre per harvest, indexed by levels above the crop (+6 and up = 135)
const FIBRE_YIELD_TABLE = [45, 63, 72, 81, 99, 117, 135];

// Seeds returned when a fibre crop goes to seed (manure doesn't help)
function fibreSeedYield(above) {
  if (above >= 12) return 54;
  if (above >= 8) return 45;
  if (above >= 4) return 36;
  return 27;
}

// Timings in minutes
const HERB_GROW = 105;        // 1h45 per picking
const HERB_SEED_TIME = 70;    // 1h10 to seed after last picking
const FIBRE_GROW = 210;       // 3h30
const FIBRE_SEED_GROW = 315;  // 3h30 + 1h45

// Livestock timing / rules
const EGG_STORAGE_DAYS = 3;   // egg boxes stop filling after 3 days
const TWO_DAY_CYCLE = 2;      // milk and shearing come every 2 days
const MUCK_XP_PER_LEVEL = 5;
const SLAUGHTER_MULT = 3;     // slaughter XP = 3 x grow-up XP

// ---------------------------------------------------------------------------
// DATA
// ---------------------------------------------------------------------------
const HERBS = [
  { name: "Wildleaf",  level: 1,  plantXp: 10,   herbXp: 25 },
  { name: "Vervain",   level: 21, plantXp: 39.5, herbXp: 99 },
  { name: "Moonbloom", level: 41, plantXp: 77.5, herbXp: 195 },
  { name: "Embersage", level: 61, plantXp: 120,  herbXp: 300 },
];

const FIBRES = [
  { name: "Hemp",      level: 11, plantXp: 23,   fibreXp: 7 },
  { name: "Flax",      level: 21, plantXp: 39.5, fibreXp: 11.75 },
  { name: "Stinkreed", level: 31, plantXp: 58,   fibreXp: 17.5 },
  { name: "Toetoe",    level: 41, plantXp: 77.5, fibreXp: 23.25 },
  { name: "Sunthread", level: 61, plantXp: 120,  fibreXp: 36 },
];

const BREEDS = [
  { id: "hen",        name: "Hen",             level: 1,  kind: "poultry", eggXp: 15,     growXp: 10 },
  { id: "copperneck", name: "Copperneck Hen",  level: 21, kind: "poultry", eggXp: 59.25,  growXp: 39.5 },
  { id: "goose",      name: "Goose",           level: 41, kind: "poultry", eggXp: 116.25, growXp: 77.5 },
  { id: "stormneck",  name: "Stormneck Goose", level: 61, kind: "poultry", eggXp: 180,    growXp: 120 },

  { id: "sheep",      name: "Sheep",           level: 1,  kind: "sheep",   shearXp: 30,   milkXp: 15,    growXp: 10 },
  { id: "merino",     name: "Merino Sheep",    level: 81, kind: "sheep",   shearXp: 480,  milkXp: 240,   growXp: 160 },

  { id: "cow",        name: "Cow",             level: 21, kind: "cow",     milkXp: 118.5, growXp: 39.5 },
  { id: "blackcow",   name: "Black Cow",       level: 41, kind: "cow",     milkXp: 232.5, growXp: 77.5 },
  { id: "spotted",    name: "Spotted Cow",     level: 61, kind: "cow",     milkXp: 360,   growXp: 120 },
];
const BREED_BY_ID = Object.fromEntries(BREEDS.map((b) => [b.id, b]));

// ---------------------------------------------------------------------------
// CROP ACTIONS (herbs + fibre). Livestock uses its own panel.
// ---------------------------------------------------------------------------
const ACTIONS = [];

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

function groupsFor(tab) {
  const seen = [];
  ACTIONS.filter((a) => a.tab === tab).forEach((a) => {
    if (!seen.includes(a.group)) seen.push(a.group);
  });
  return seen;
}

// ---------------------------------------------------------------------------
// XP MATHS: crops
// ---------------------------------------------------------------------------
function herbPlantingXp(h, farmingLevel, manure, seedsBack) {
  const above = Math.max(0, Math.min(farmingLevel - h.level, 12));
  let perPick = HERB_PICK_TABLE[above];
  if (manure) perPick = Math.round(perPick * MANURE_BONUS);
  const herbs = PICKS_PER_HERB * perPick;
  return h.plantXp + herbs * h.herbXp + seedsBack * h.herbXp;
}

// mode: "fibre" (harvest fibre) or "seed" (let it go to seed). Never both.
function fibrePlantingXp(f, farmingLevel, manure, mode) {
  const above = Math.max(0, Math.min(farmingLevel - f.level, 12));
  if (mode === "seed") {
    return f.plantXp + fibreSeedYield(above) * f.fibreXp; // manure doesn't help seeds
  }
  let fibre = FIBRE_YIELD_TABLE[Math.min(above, 6)];
  if (manure) fibre = Math.round(fibre * MANURE_BONUS);
  return f.plantXp + fibre * f.fibreXp;
}

function plantingMinutes(kind, mode) {
  if (kind === "herb") return PICKS_PER_HERB * HERB_GROW + HERB_SEED_TIME;
  return mode === "seed" ? FIBRE_SEED_GROW : FIBRE_GROW;
}

function xpForOne(action, farmingLevel, opts) {
  if (action.kind === "herb") {
    const seedsBack = opts.minSeeds ? 1 : HERB_SEEDS_AVG;
    return herbPlantingXp(action.data, farmingLevel, !!opts.manure, seedsBack);
  }
  return fibrePlantingXp(action.data, farmingLevel, !!opts.manure, opts.seed ? "seed" : "fibre");
}

// ---------------------------------------------------------------------------
// XP MATHS: livestock
//   Eggs, milk: grown FEMALES only.
//   Shearing: grown females AND males.
//   Slaughter: all grown animals. Grow-up: young (+ eggs kept to hatch).
// ---------------------------------------------------------------------------
function breedEvents(b) {
  const ev = [];
  if (b.eggXp)   ev.push({ id: "egg",       label: `${b.name} eggs`,       xp: b.eggXp });
  if (b.milkXp)  ev.push({ id: "milk",      label: `${b.name} milk`,       xp: b.milkXp });
  if (b.shearXp) ev.push({ id: "shear",     label: `${b.name} shearing`,   xp: b.shearXp });
  ev.push({ id: "grow",      label: `${b.name} grows up`,    xp: b.growXp });
  ev.push({ id: "slaughter", label: `Slaughter ${b.name}`,   xp: b.growXp * SLAUGHTER_MULT });
  return ev;
}

function newPen() {
  return { females: 0, males: 0, young: 0, hatch: 0, days: 1, muck: 0 };
}

function penTotal(pen) {
  return (pen.females || 0) + (pen.males || 0) + (pen.young || 0) + (pen.hatch || 0);
}

function penOverflow(b, pen) {
  return Math.max(0, penTotal(pen) - COOP_CAP[b.kind]);
}

function eventQuantities(pen) {
  const f = pen.females || 0;
  const m = pen.males || 0;
  const y = pen.young || 0;
  const days = Math.max(0, pen.days || 0);
  const eggDays = Math.min(days, EGG_STORAGE_DAYS);
  const ready = Math.floor(days / TWO_DAY_CYCLE) >= 1 ? 1 : 0; // no stacking

  return {
    egg: f * eggDays,                 // females only
    milk: f * ready,                  // females only
    shear: (f + m) * ready,           // both sexes
    grow: y + (pen.hatch || 0),       // young + eggs kept to hatch
    slaughter: f + m,
  };
}

function penVisitXp(b, pen, overrides) {
  const qtys = eventQuantities(pen);
  const rows = [];
  let total = 0;

  breedEvents(b).forEach((ev) => {
    const key = `${b.id}_${ev.id}`;
    const manual = overrides.get(key);
    const hasManual = Number.isFinite(manual);
    const qty = hasManual ? manual : (qtys[ev.id] || 0);
    const xp = qty * ev.xp;
    total += xp;
    rows.push({ ev, qty, xp, manual: hasManual });
  });

  const muckXp = (pen.muck || 0) * MUCK_XP_PER_LEVEL;
  total += muckXp;
  return { rows, muckXp, total };
}

function penActive(b, pen) {
  if (!pen) return false;
  const hasStock = penTotal(pen) + (pen.muck || 0) > 0;
  const hasManual = breedEvents(b).some((ev) => manualOverrides.has(`${b.id}_${ev.id}`));
  return hasStock || hasManual;
}

// ---------------------------------------------------------------------------
// UI STATE
// ---------------------------------------------------------------------------
const MODES = [
  { id: "herbs",  label: "Herbs" },
  { id: "fibre",  label: "Fibre" },
  { id: "coops",  label: "Coops" },
  { id: "combo",  label: "Combo" },
];

let root = null;
let activeMode = "herbs";
let lastLevel = null;

// Which sections count when in combo mode
const comboOn = { herbs: true, fibre: true, coops: true };

const savedCounts = new Map();     // action key -> typed count
const savedOptions = new Map();    // action key -> { manure, seed, minSeeds }
const penState = new Map();        // breed id -> pen
const manualOverrides = new Map(); // "breed_event" -> number
const tickedKeys = new Set();      // ticked crop actions, survives mode switches

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];
const actionByKey = (key) => ACTIONS.find((a) => a.key === key);

function getPen(id) {
  if (!penState.has(id)) penState.set(id, newPen());
  return penState.get(id);
}

// Sections currently visible / counted
function visibleSections() {
  if (activeMode === "combo") return ["herbs", "fibre", "coops"].filter((s) => comboOn[s]);
  return [activeMode];
}

// ---------------------------------------------------------------------------
// UI: crop section (herbs / fibre), checkbox groups plus count rows
// ---------------------------------------------------------------------------
function updateSelectedCount(root_) {
  const el = root_.querySelector(".selectedCount");
  if (el) el.textContent = `${root_.querySelectorAll(".actionCheck:checked").length} selected`;
}

function updateGroupCounts(root_) {
  root_.querySelectorAll(".group").forEach((g) => {
    const boxes = [...g.querySelectorAll(".actionCheck")];
    const checked = boxes.filter((b) => b.checked).length;
    const el = g.querySelector(".group-count");
    if (el) el.textContent = `(${checked}/${boxes.length})`;
  });
}

function saveCropInputs() {
  qa(".countInput").forEach((el) => savedCounts.set(el.dataset.key, el.value));
  const upd = (cls, field) => qa(cls).forEach((el) => {
    const o = savedOptions.get(el.dataset.key) || {};
    savedOptions.set(el.dataset.key, { ...o, [field]: el.checked });
  });
  upd(".manureCheck", "manure");
  upd(".seedCheck", "seed");
  upd(".minSeedCheck", "minSeeds");
}

function saveTicks() {
  qa(".actionCheck").forEach((c) => {
    if (c.checked) tickedKeys.add(c.value);
    else tickedKeys.delete(c.value);
  });
}

function patchCapNote(action) {
  if (action.kind === "herb") return `max ${HERB_PATCHES} patches`;
  if (action.kind === "fibre") return `max ${FIBRE_PATCHES} patches`;
  return "";
}

function rebuildCountInputs() {
  saveTicks();
  saveCropInputs();

  qa(".cropSection").forEach((section) => {
    const tab = section.dataset.tab;
    const inputs = section.querySelector(".countInputs");
    const countBox = section.querySelector(".countSection");
    inputs.innerHTML = "";

    const keys = ACTIONS.filter((a) => a.tab === tab && tickedKeys.has(a.key)).map((a) => a.key);
    updateSelectedCount(section);
    updateGroupCounts(section);

    if (keys.length === 0) { countBox.hidden = true; return; }
    countBox.hidden = false;

    keys.forEach((key) => {
      const a = actionByKey(key);
      const count = savedCounts.has(key) ? savedCounts.get(key) : 1;
      const opts = savedOptions.get(key) || { manure: false, seed: false, minSeeds: false };
      const isHerb = a.kind === "herb";

      const cropOpts = `
        <label class="opt"><input type="checkbox" class="manureCheck" data-key="${key}"
          ${opts.manure ? "checked" : ""} /> Manured (+20%)</label>
        ${isHerb ? `
        <label class="opt"><input type="checkbox" class="minSeedCheck" data-key="${key}"
          ${opts.minSeeds ? "checked" : ""} /> Assume 1 seed back (not 2)</label>` : `
        <label class="opt"><input type="checkbox" class="seedCheck" data-key="${key}"
          ${opts.seed ? "checked" : ""} /> Let it go to seed (instead of fibre)</label>`}`;

      const row = document.createElement("div");
      row.className = "count-row";
      row.innerHTML = `
        <span class="count-label">${a.label} <em>(${patchCapNote(a)})</em></span>
        <span><input type="number" class="countInput" data-key="${key}" min="0" step="1"
               value="${count}" /> plantings per round</span>
        ${cropOpts}`;
      inputs.appendChild(row);
    });
  });
}

function onSelectionChange() {
  rebuildCountInputs();
}

function setVisibleActions(section, state) {
  section.querySelectorAll(".action-row").forEach((label) => {
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

function applyFilter(section) {
  const term = section.querySelector(".actionFilter").value.trim().toLowerCase();
  section.querySelectorAll(".group").forEach((g) => {
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

function buildCropSection(tab, title) {
  const section = document.createElement("div");
  section.className = "cropSection";
  section.dataset.tab = tab;
  section.innerHTML = `
    <h3>${title}</h3>
    <div class="ore-actions">
      <input type="search" class="actionFilter" aria-label="Filter ${title}"
             placeholder="Filter (e.g. moonbloom, flax)..." />
      <button type="button" class="selectAllBtn">Select all</button>
      <button type="button" class="clearBtn">Clear</button>
      <span class="selectedCount">0 selected</span>
    </div>
    <div class="groups"></div>
    <div class="countSection" hidden>
      <h4>How many per round?</h4>
      <p class="note">${tab === "herbs"
        ? `Capped by ${HERB_PATCHES} herb patches.`
        : `Capped by ${FIBRE_PATCHES} fibre patches.`}
        One round = the amounts below, repeated until you hit your target.</p>
      <div class="countInputs"></div>
    </div>`;

  const groupsEl = section.querySelector(".groups");
  groupsFor(tab).forEach((groupName) => {
    const actions = ACTIONS.filter((a) => a.tab === tab && a.group === groupName);
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
        <input type="checkbox" class="actionCheck" value="${a.key}"
          ${tickedKeys.has(a.key) ? "checked" : ""} />
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

  section.querySelectorAll(".actionCheck").forEach((c) =>
    c.addEventListener("change", onSelectionChange));
  section.querySelector(".actionFilter").addEventListener("input", () => applyFilter(section));
  section.querySelector(".selectAllBtn").addEventListener("click", () =>
    setVisibleActions(section, true));
  section.querySelector(".clearBtn").addEventListener("click", () =>
    setVisibleActions(section, false));

  const first = section.querySelector(".group");
  if (first) first.open = true;
  return section;
}

// ---------------------------------------------------------------------------
// UI: coops (livestock)
// ---------------------------------------------------------------------------
function readNum(el) {
  const n = parseFloat(el.value);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function buildCoopSection() {
  const section = document.createElement("div");
  section.className = "coopSection";
  section.innerHTML = `
    <h3>Coops</h3>
    <p class="note">
      Enter the animals in each pen and how many days since your last visit.
      Eggs and milk come from grown females only. Shearing counts grown females
      and males. Eggs stop filling after ${EGG_STORAGE_DAYS} days, and milk and
      shearing come every ${TWO_DAY_CYCLE} days without stacking.
      Coop caps: poultry ${COOP_CAP.poultry}, sheep ${COOP_CAP.sheep}, cows ${COOP_CAP.cow}.
    </p>
    <div class="pens"></div>`;

  const pens = section.querySelector(".pens");

  BREEDS.forEach((b) => {
    const pen = getPen(b.id);
    const details = document.createElement("details");
    details.className = "group penGroup";
    details.dataset.breed = b.id;

    const hasHatch = b.kind === "poultry";
    details.innerHTML = `
      <summary>
        <span class="group-label">${b.name}</span>
        <span class="ore-meta">Req. Lv ${b.level}</span>
        <span class="group-count penStatus"></span>
      </summary>
      <div class="pen-body">
        <div class="count-row">
          <label>Grown females <input type="number" class="penInput" data-breed="${b.id}"
            data-field="females" min="0" step="1" value="${pen.females}" /></label>
          <label>Grown males <input type="number" class="penInput" data-breed="${b.id}"
            data-field="males" min="0" step="1" value="${pen.males}" /></label>
          <label>Young <input type="number" class="penInput" data-breed="${b.id}"
            data-field="young" min="0" step="1" value="${pen.young}" /></label>
          <label>Days since last visit <input type="number" class="penInput" data-breed="${b.id}"
            data-field="days" min="0" step="1" value="${pen.days}" /></label>
          <label>Muck levels <input type="number" class="penInput" data-breed="${b.id}"
            data-field="muck" min="0" step="1" value="${pen.muck}" /></label>
          ${hasHatch ? `
          <label>Eggs kept to hatch <input type="number" class="penInput" data-breed="${b.id}"
            data-field="hatch" min="0" step="1" value="${pen.hatch || 0}" /></label>` : ""}
        </div>
        <p class="note penWarn" hidden></p>
        <details class="overrides">
          <summary>Manual overrides (optional)</summary>
          <div class="count-row overrideRows"></div>
        </details>
      </div>`;

    // Override rows: one per event, blank = use computed value
    const overrideRows = details.querySelector(".overrideRows");
    breedEvents(b).forEach((ev) => {
      const key = `${b.id}_${ev.id}`;
      const has = manualOverrides.has(key);
      const label = document.createElement("label");
      label.innerHTML = `${ev.label}
        <input type="number" class="overrideInput" data-key="${key}" min="0" step="1"
          placeholder="auto" value="${has ? manualOverrides.get(key) : ""}" />`;
      overrideRows.appendChild(label);
    });

    pens.appendChild(details);
  });

  section.querySelectorAll(".penInput").forEach((el) =>
    el.addEventListener("input", () => {
      const pen = getPen(el.dataset.breed);
      pen[el.dataset.field] = readNum(el);
      refreshPenStatus(section);
    }));

  section.querySelectorAll(".overrideInput").forEach((el) =>
    el.addEventListener("input", () => {
      const key = el.dataset.key;
      if (el.value.trim() === "") manualOverrides.delete(key);
      else manualOverrides.set(key, readNum(el));
      refreshPenStatus(section);
    }));

  refreshPenStatus(section);
  return section;
}

function refreshPenStatus(section) {
  section.querySelectorAll(".penGroup").forEach((g) => {
    const b = BREED_BY_ID[g.dataset.breed];
    const pen = getPen(b.id);
    const over = penOverflow(b, pen);
    const hatch = pen.hatch || 0;
    const eggsLaid = eventQuantities(pen).egg;

    const status = g.querySelector(".penStatus");
    const warn = g.querySelector(".penWarn");
    status.textContent = `(${penTotal(pen)}/${COOP_CAP[b.kind]})`;

    const msgs = [];
    if (over > 0) {
      msgs.push(`Over capacity by ${over}.${hatch > 0 ? " Eggs kept to hatch count toward the cap." : ""}`);
    }
    if (b.kind === "poultry" && hatch > eggsLaid && !manualOverrides.has(`${b.id}_egg`)) {
      msgs.push(`You are keeping ${hatch} eggs to hatch but only ${eggsLaid} were laid.`);
    }
    warn.hidden = msgs.length === 0;
    warn.textContent = msgs.join(" ");
  });
}

// ---------------------------------------------------------------------------
// RESULTS
// ---------------------------------------------------------------------------
function getLevel() {
  const el = q(".levelInput");
  const n = parseInt(el ? el.value : "", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 99) : null;
}

function cropResults(tab, level) {
  const rows = [];
  let xp = 0;
  let minutes = 0;

  ACTIONS.filter((a) => a.tab === tab && tickedKeys.has(a.key)).forEach((a) => {
    const count = Math.max(0, parseInt(savedCounts.get(a.key) ?? 1, 10) || 0);
    const cap = a.kind === "herb" ? HERB_PATCHES : FIBRE_PATCHES;
    const opts = savedOptions.get(a.key) || {};
    const one = xpForOne(a, level, opts);
    const mode = a.kind === "fibre" && opts.seed ? "seed" : "fibre";
    const mins = plantingMinutes(a.kind, mode);
    const total = one * count;
    xp += total;
    // Patches grow in parallel, so a round takes as long as its slowest crop
    minutes = Math.max(minutes, count > 0 ? mins : 0);
    rows.push({
      label: a.label,
      count,
      warn: count > cap ? `exceeds ${cap} patches` : level < a.level ? `needs Lv ${a.level}` : "",
      each: one,
      total,
    });
  });
  return { rows, xp, minutes };
}

function coopResults() {
  const rows = [];
  let xp = 0;
  BREEDS.forEach((b) => {
    const pen = getPen(b.id);
    if (!penActive(b, pen)) return;
    const v = penVisitXp(b, pen, manualOverrides);
    xp += v.total;
    rows.push({ breed: b, visit: v });
  });
  return { rows, xp };
}

function fmtMinutes(m) {
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return h > 0 ? `${h}h${String(min).padStart(2, "0")}` : `${min}min`;
}

function renderResults() {
  const out = q(".results");
  const level = getLevel();
  applyLevelHint(level);
  lastLevel = level;

  if (level === null) {
    out.innerHTML = `<p class="note">Enter your Farming level to see results.</p>`;
    return;
  }

  const sections = visibleSections();
  let html = "";
  let grand = 0;

  ["herbs", "fibre"].forEach((tab) => {
    if (!sections.includes(tab)) return;
    const r = cropResults(tab, level);
    if (r.rows.length === 0) return;
    grand += r.xp;
    html += `<h4>${tab === "herbs" ? "Herbs" : "Fibre"}</h4>
      <table class="resultTable"><thead>
        <tr><th>Action</th><th>Plantings</th><th>XP each</th><th>XP total</th><th></th></tr>
      </thead><tbody>
      ${r.rows.map((x) => `<tr>
        <td>${x.label}</td><td>${x.count}</td>
        <td>${fmt(x.each)}</td><td>${fmt(x.total)}</td>
        <td class="warn">${x.warn}</td></tr>`).join("")}
      </tbody></table>
      <p class="note">Round time (patches grow in parallel): ${fmtMinutes(r.minutes)}.
      Round XP: <strong>${fmt(r.xp)}</strong></p>`;
  });

  if (sections.includes("coops")) {
    const c = coopResults();
    if (c.rows.length > 0) {
      grand += c.xp;
      html += `<h4>Coops (per visit)</h4>`;
      c.rows.forEach(({ breed, visit }) => {
        html += `<table class="resultTable"><thead>
          <tr><th>${breed.name}</th><th>Qty</th><th>XP</th></tr></thead><tbody>
          ${visit.rows.filter((r) => r.qty > 0).map((r) => `<tr>
            <td>${r.ev.label}${r.manual ? " (manual)" : ""}</td>
            <td>${fmt(r.qty)}</td><td>${fmt(r.xp)}</td></tr>`).join("")}
          ${visit.muckXp > 0 ? `<tr><td>Mucking out</td><td>${getPen(breed.id).muck}</td>
            <td>${fmt(visit.muckXp)}</td></tr>` : ""}
          </tbody></table>
          <p class="note">${breed.name} visit total: <strong>${fmt(visit.total)}</strong></p>`;
      });
    }
  }

  if (html === "") {
    out.innerHTML = `<p class="note">Nothing selected yet.</p>`;
    return;
  }
  out.innerHTML = html +
    `<p class="grand">Total per round / visit: <strong>${fmt(grand)} XP</strong></p>`;
}

// ---------------------------------------------------------------------------
// COMBO TOGGLES + MODE SWITCHING
// ---------------------------------------------------------------------------
function buildComboBar() {
  const bar = document.createElement("div");
  bar.className = "comboBar";
  bar.hidden = true;
  bar.innerHTML = `<span>Include:</span>
    ${["herbs", "fibre", "coops"].map((s) => `
      <label class="opt"><input type="checkbox" class="comboCheck" data-section="${s}"
        ${comboOn[s] ? "checked" : ""} /> ${s[0].toUpperCase() + s.slice(1)}</label>`).join("")}`;
  bar.querySelectorAll(".comboCheck").forEach((c) =>
    c.addEventListener("change", () => {
      comboOn[c.dataset.section] = c.checked;
      showSections();
      renderResults();
    }));
  return bar;
}

function showSections() {
  const visible = visibleSections();
  qa("[data-section-id]").forEach((el) => {
    el.hidden = !visible.includes(el.dataset.sectionId);
  });
  const bar = q(".comboBar");
  if (bar) bar.hidden = activeMode !== "combo";
  qa(".modeBtn").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === activeMode));
}

function setMode(mode) {
  saveTicks();
  saveCropInputs();
  activeMode = mode;
  showSections();
  renderResults();
}

// ---------------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------------
export function renderFarming(container, initialLevel = 1) {
  root = container;
  root.innerHTML = `
    <div class="farming">
      <div class="level-row">
        <label>Farming level
          <input type="number" class="levelInput" min="1" max="99" step="1"
                 value="${initialLevel}" /></label>
      </div>
      <div class="modeTabs">
        ${MODES.map((m) => `<button type="button" class="modeBtn"
          data-mode="${m.id}">${m.label}</button>`).join("")}
      </div>
      <div class="sections"></div>
      <div class="results"></div>
    </div>`;

  const sections = q(".sections");
  sections.appendChild(buildComboBar());

  const herbs = buildCropSection("herbs", "Herbs");
  herbs.dataset.sectionId = "herbs";
  const fibre = buildCropSection("fibre", "Fibre");
  fibre.dataset.sectionId = "fibre";
  const coops = buildCoopSection();
  coops.dataset.sectionId = "coops";
  sections.append(herbs, fibre, coops);

  qa(".modeBtn").forEach((b) =>
    b.addEventListener("click", () => setMode(b.dataset.mode)));

  // Recalculate on any input change inside the module
  root.addEventListener("input", renderResults);
  root.addEventListener("change", renderResults);

  rebuildCountInputs();
  showSections();
  renderResults();
}
// ---------------------------------------------------------------------------
// SKILL DEFINITION
// ---------------------------------------------------------------------------
export const farming = {
  id: "farming",
  name: "Farming",
  icon: ""https://aldermere.online/assets/wiki/skills/farming.webp",",
  active: true,
  taskTitle: "Choose your farming actions",  renderTask(container) {
    root = container;
    activeTab = "herbs";
    savedCounts.clear();
    savedOptions.clear();
root.innerHTML = `
  <div class="craft-tabs" role="tablist">
    ${TABS.map((t) => `
      <button type="button" role="tab"
        class="farmTab ${t.id === activeTab ? "active" : ""}"
        data-tab="${t.id}"
        aria-selected="${t.id === activeTab}">${t.label}</button>`).join("")}
  </div>
  <div class="ore-actions">
    <input type="search" class="actionFilter" aria-label="Filter actions"
           placeholder="Filter actions (e.g. milk, moonbloom, slaughter)..." />
    <button type="button" class="selectAllBtn">Select all</button>
    <button type="button" class="clearBtn">Clear</button>
    <span class="selectedCount">0 selected</span>
  </div>
  <div class="groups"></div>
  <div class="countSection" hidden>
    <h3>How many per round?</h3>
    <p class="note">Plantings are capped by your patches: ${HERB_PATCHES} herb,
      ${FIBRE_PATCHES} fibre. Livestock pens hold ${COOP_CAP.poultry} poultry or
      ${COOP_CAP.sheep} sheep / cows, one breed per pen.</p>
    <div class="countInputs"></div>
    <button type="button" class="resetCountsBtn">Reset all to 1</button>
  </div>`;

qa(".farmTab").forEach((btn) =>
  btn.addEventListener("click", () => setActiveTab(btn.dataset.tab)));
q(".actionFilter").addEventListener("input", applyFilter);
q(".selectAllBtn").addEventListener("click", () => setVisibleActions(true));
q(".clearBtn").addEventListener("click", () => setVisibleActions(false));
q(".resetCountsBtn").addEventListener("click", () => {
  savedCounts.clear();
  qa(".countInput").forEach((el) => { el.value = 1; });
});

renderGroups();

  },  onLevelChange(level) {
    lastLevel = level;
    if (!root) return;
    applyLevelHint(level);
  },  calculate({ xpNeeded, currentLevel }) {
    const plan = readPlan(currentLevel);
if (plan.length === 0) {
  return `<p class="note">Select at least one action to see what you need.</p>`;
}

const result = planTableHtml(plan, xpNeeded, currentLevel);
if (typeof result === "string") return result; // error message

let html = result.html;
html += seedsHtml(plan, result.rounds);
html += timeHtml(plan, result.rounds);

html += `
  <p class="note">Totals round up to whole rounds, so you may overshoot your target
    slightly. Real harvests can land a pick or so either side of the table values.</p>`;

return html;

  },
};

  
