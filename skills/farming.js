// farming.js
import { fmt } from "../xp.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

function iconImg(item) {
  if (!item.icon) return "";
  return `<img class="item-icon" src="${ICON_BASE}${item.icon}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />`;
}

// ---------------------------------------------------------------------------
// FARM LIMITS
// ---------------------------------------------------------------------------
const LIMITS = {
  herbPatches: 3,
  fibrePatches: 4,
  poultryMax: 32,   // 1 poultry coop, one breed only
  stockMax: 16,     // 1 sheep/cow coop, one breed only
  eggStorageDays: 3,
  manureBonus: 0.2, // +20% on herbs/fibre, never on seeds
};

// ---------------------------------------------------------------------------
// CROP / ANIMAL DATA
// ---------------------------------------------------------------------------
const HERB_CROPS = {
  Wildleaf:  { level: 1,  plant: 10,   herb: 25  },
  Vervain:   { level: 21, plant: 39.5, herb: 99  },
  Moonbloom: { level: 41, plant: 77.5, herb: 195 },
  Embersage: { level: 61, plant: 120,  herb: 300 },
};

const FIBRE_CROPS = {
  Hemp:      { level: 11, plant: 23,   fibre: 7     },
  Flax:      { level: 21, plant: 39.5, fibre: 11.75 },
  Stinkreed: { level: 31, plant: 58,   fibre: 17.5  },
  Toetoe:    { level: 41, plant: 77.5, fibre: 23.25 },
  Sunthread: { level: 61, plant: 120,  fibre: 36    },
};

const HERBS_PER_PICK = [5, 7, 8, 9, 11, 13, 15, 19, 22, 26, 32, 38, 40];
const FIBRE_YIELD = [45, 63, 72, 81, 99, 117, 135];
const HERB_PICKINGS = 3;
const HERB_SEEDS_ESTIMATE = 2;      // seeds counted per herb planting
const HERB_MINUTES = 105 * 3 + 70;  // 3 pickings + seed run
const FIBRE_MINUTES = { fibre: 210, seeds: 315 };

function fibreSeedYield(diff) {
  if (diff <= 3) return 27;
  if (diff <= 7) return 36;
  if (diff <= 11) return 45;
  return 54;
}

const POULTRY = {
  Chicken:    { level: 1,  egg: 15,     grow: 10,   slaughter: 30  },
  Copperneck: { level: 21, egg: 59.25,  grow: 39.5, slaughter: 118.5 },
  Goose:      { level: 41, egg: 116.25, grow: 77.5, slaughter: 232.5 },
  Stormneck:  { level: 61, egg: 180,    grow: 120,  slaughter: 360 },
};

const STOCK = {
  Sheep:         { level: 1,  milk: 15,    wool: 30, grow: 10,   slaughter: 30 },
  Cow:           { level: 21, milk: 118.5, wool: 0,  grow: 39.5, slaughter: 118.5 },
  "Black Cow":   { level: 41, milk: 232.5, wool: 0,  grow: 77.5, slaughter: 232.5 },
  "Spotted Cow": { level: 61, milk: 360,   wool: 0,  grow: 120,  slaughter: 360 },
  Merino:        { level: 81, milk: 240,   wool: 480, grow: 160, slaughter: 480 },
};

// ---------------------------------------------------------------------------
// CALC HELPERS
// ---------------------------------------------------------------------------
const bonusMult = (log) => 1 + (log?.bonus || 0) / 100;

function herbsPerPick(level, cropLevel, manure) {
  const diff = Math.max(0, level - cropLevel);
  const base = HERBS_PER_PICK[Math.min(diff, HERBS_PER_PICK.length - 1)];
  return manure ? Math.round(base * (1 + LIMITS.manureBonus)) : base;
}

function herbPlantingXp(crop, level, manure) {
  const c = HERB_CROPS[crop];
  const per = herbsPerPick(level, c.level, manure);
  return c.plant + HERB_PICKINGS * per * c.herb + HERB_SEEDS_ESTIMATE * c.herb;
}

function fibrePlantingXp(crop, level, { manure, seeds }) {
  const c = FIBRE_CROPS[crop];
  const diff = Math.max(0, level - c.level);
  if (seeds) return c.plant + fibreSeedYield(diff) * c.fibre; // manure doesn't help seeds
  const base = FIBRE_YIELD[Math.min(diff, FIBRE_YIELD.length - 1)];
  const qty = manure ? Math.round(base * (1 + LIMITS.manureBonus)) : base;
  return c.plant + qty * c.fibre;
}

// ---------------------------------------------------------------------------
// ACTION CATALOG (every action from the xlsx; xp is computed at calc time)
// kind: herb | fibre | fibreSeeds | egg | growup | slaughter | milk | wool | muck
// `unit` is what one "repeat" means; `max` is the farm cap per repeat.
// ---------------------------------------------------------------------------
const ITEMS = [
  // ---- HERBS (one planting = plant + 3 pickings + seeds) ----
  ...Object.entries(HERB_CROPS).map(([name, c]) => ({
    name: `${name} planting`, category: "herbs", kind: "herb", crop: name,
    level: c.level, unit: "planting", max: LIMITS.herbPatches,
  })),

  // ---- FIBRE (fibre OR seeds, never both) ----
  ...Object.entries(FIBRE_CROPS).flatMap(([name, c]) => ([
    { name: `${name} planting (fibre)`, category: "fibre", kind: "fibre", crop: name,
      level: c.level, unit: "planting", max: LIMITS.fibrePatches },
    { name: `${name} planting (seeds)`, category: "fibre", kind: "fibreSeeds", crop: name,
      level: c.level, unit: "planting", max: LIMITS.fibrePatches },
  ])),

  // ---- LIVESTOCK ----
  { name: "Muck out (per muck level)", category: "livestock", kind: "muck",
    level: 1, unit: "muck level", max: 3 },

  ...Object.entries(POULTRY).flatMap(([name, t]) => ([
    { name: `${name} egg`,         category: "livestock", kind: "egg",       animal: name, level: t.level, unit: "egg",   max: LIMITS.poultryMax * LIMITS.eggStorageDays },
    { name: `${name} grows up`,    category: "livestock", kind: "growup",    animal: name, level: t.level, unit: "bird",  max: LIMITS.poultryMax },
    { name: `Slaughter ${name}`,   category: "livestock", kind: "slaughter", animal: name, level: t.level, unit: "bird",  max: LIMITS.poultryMax },
  ])),

  ...Object.entries(STOCK).flatMap(([name, t]) => {
    const rows = [
      { name: `${name} milk`,       category: "livestock", kind: "milk",      animal: name, level: t.level, unit: "milking", max: LIMITS.stockMax },
      { name: `${name} grows up`,   category: "livestock", kind: "growup",    animal: name, level: t.level, unit: "animal",  max: LIMITS.stockMax },
      { name: `Slaughter ${name}`,  category: "livestock", kind: "slaughter", animal: name, level: t.level, unit: "animal",  max: LIMITS.stockMax },
    ];
    if (t.wool) rows.splice(1, 0,
      { name: `${name} wool`, category: "livestock", kind: "wool", animal: name, level: t.level, unit: "shearing", max: LIMITS.stockMax });
    return rows;
  }),
];

// XP for ONE repeat of an action (before log bonus)
function itemXp(item, level, opts = {}) {
  const { manure = false } = opts;
  const tier = POULTRY[item.animal] || STOCK[item.animal];
  switch (item.kind) {
    case "herb":       return herbPlantingXp(item.crop, level, manure);
    case "fibre":      return fibrePlantingXp(item.crop, level, { manure, seeds: false });
    case "fibreSeeds": return fibrePlantingXp(item.crop, level, { manure: false, seeds: true });
    case "egg":        return tier.egg;
    case "growup":     return tier.grow;
    case "slaughter":  return tier.slaughter;
    case "milk":       return tier.milk;
    case "wool":       return tier.wool;
    case "muck":       return 5;
    default:           return 0;
  }
}

const CATEGORIES = [
  { id: "herbs",     label: "Herbs" },
  { id: "fibre",     label: "Fibre" },
  { id: "livestock", label: "Livestock" },
];

const GROUPS = [
  { min: 1,  max: 21, label: "Farming lvl 1-20" },
  { min: 21, max: 41, label: "Farming lvl 21-40" },
  { min: 41, max: 61, label: "Farming lvl 41-60" },
  { min: 61, max: 81, label: "Farming lvl 61-80" },
  { min: 81, max: 100, label: "Farming lvl 81+" },
];

// ---------------------------------------------------------------------------
// MODULE STATE + DOM HELPERS
// ---------------------------------------------------------------------------
let root = null;
let activeCategory = "herbs";
let lastLevel = 1;
const selected = new Set();   // indexes into ITEMS
const manureOn = new Set();   // indexes with manure enabled
const counts = new Map();     // custom plan: index -> repeats per round

const q = (s) => root.querySelector(s);
const qa = (s) => [...root.querySelectorAll(s)];

function visibleIndexes() {
  return ITEMS.map((it, i) => i).filter((i) => ITEMS[i].category === activeCategory);
}

function groupsHtml() {
  const idx = visibleIndexes();
  return GROUPS.map((g) => {
    const rows = idx.filter((i) => ITEMS[i].level >= g.min && ITEMS[i].level < g.max);
    if (!rows.length) return "";
    const supportsManure = (it) => it.kind === "herb" || it.kind === "fibre";
    return `
      <details class="group" open>
        <summary>${g.label}</summary>
        ${rows.map((i) => {
          const it = ITEMS[i];
          return `
          <div class="item-row" data-level="${it.level}" data-name="${it.name.toLowerCase()}">
            <label>
              <input type="checkbox" class="itemCheck" data-i="${i}" ${selected.has(i) ? "checked" : ""} />
              ${iconImg(it)} <span class="item-name">${it.name}</span>
              <span class="item-level">Lv ${it.level}</span>
              <span class="item-xp">${fmt(itemXp(it, Math.max(lastLevel, it.level)))} xp / ${it.unit}</span>
            </label>
            ${supportsManure(it) ? `
              <label class="manure"><input type="checkbox" class="manureCheck" data-i="${i}" ${manureOn.has(i) ? "checked" : ""} /> manure</label>` : ""}
          </div>`;
        }).join("")}
      </details>`;
  }).join("");
}

function renderGroups() {
  q(".groups").innerHTML = groupsHtml();
  qa(".itemCheck").forEach((el) =>
    el.addEventListener("change", () => {
      const i = Number(el.dataset.i);
      el.checked ? selected.add(i) : selected.delete(i);
      updateCount(); renderMix();
    })
  );
  qa(".manureCheck").forEach((el) =>
    el.addEventListener("change", () => {
      const i = Number(el.dataset.i);
      el.checked ? manureOn.add(i) : manureOn.delete(i);
    })
  );
  applyFilter(); applyLevelHint(lastLevel); updateCount(); renderMix();
}

function setActiveCategory(id) {
  activeCategory = id;
  qa(".farmTab").forEach((b) => {
    const on = b.dataset.cat === id;
    b.classList.toggle("active", on);
    b.setAttribute("aria-selected", String(on));
  });
  renderGroups();
}

function applyFilter() {
  const term = (q(".itemFilter")?.value || "").trim().toLowerCase();
  qa(".item-row").forEach((r) => { r.hidden = term && !r.dataset.name.includes(term); });
}

function setVisibleItems(on) {
  qa(".item-row:not([hidden]) .itemCheck").forEach((el) => {
    el.checked = on;
    const i = Number(el.dataset.i);
    on ? selected.add(i) : selected.delete(i);
  });
  updateCount(); renderMix();
}

function updateCount() {
  q(".selectedCount").textContent = `${selected.size} selected`;
}

// Visual hint (not a lock) for actions above the current level
function applyLevelHint(level) {
  qa(".item-row").forEach((r) => {
    r.classList.toggle("above-level", Number(r.dataset.level) > level);
  });
}

// "Actions per round" inputs for the combo / custom plan
function renderMix() {
  const sec = q(".mixSection");
  const box = q(".mixInputs");
  const picks = [...selected];
  sec.hidden = picks.length < 2;
  box.innerHTML = picks.map((i) => `
    <label class="mixRow">
      <span>${ITEMS[i].name}</span>
      <input type="number" class="ratioInput" data-i="${i}" min="1" step="1"
             value="${counts.get(i) ?? 1}" />
      <span class="unit">${ITEMS[i].unit}${ITEMS[i].max ? ` (max ${ITEMS[i].max})` : ""}</span>
    </label>`).join("");
  qa(".ratioInput").forEach((el) =>
    el.addEventListener("input", () => {
      counts.set(Number(el.dataset.i), Math.max(1, Math.floor(Number(el.value) || 1)));
    })
  );
}

// ---------------------------------------------------------------------------
// RESULTS HTML
// ---------------------------------------------------------------------------
function singleRows(picks, xpNeeded, level, log) {
  const mult = bonusMult(log);
  return picks.map((i) => {
    const it = ITEMS[i];
    const xp = itemXp(it, level, { manure: manureOn.has(i) }) * mult;
    const need = xp > 0 ? Math.ceil(xpNeeded / xp) : 0;
    const rounds = it.max ? Math.ceil(need / it.max) : null;
    return `<tr>
      <td>${iconImg(it)} ${it.name}${manureOn.has(i) ? " + manure" : ""}</td>
      <td>${fmt(xp)}</td>
      <td>${fmt(need)} ${it.unit}${need === 1 ? "" : "s"}</td>
      <td>${rounds ? fmt(rounds) : "-"}</td>
    </tr>`;
  }).join("");
}

function planHtml(picks, xpNeeded, level, log) {
  const mult = bonusMult(log);
  const perRound = picks.reduce((sum, i) => {
    const it = ITEMS[i];
    const n = Math.min(counts.get(i) ?? 1, it.max || Infinity);
    return sum + itemXp(it, level, { manure: manureOn.has(i) }) * n * mult;
  }, 0);
  const rounds = perRound > 0 ? Math.ceil(xpNeeded / perRound) : 0;
  return `
    <h3>Combined plan</h3>
    <p>${fmt(perRound)} xp per round, <strong>${fmt(rounds)}</strong> rounds
       (${fmt(rounds * perRound)} xp total).</p>`;
}

// ---------------------------------------------------------------------------
// SKILL DEFINITION
// ---------------------------------------------------------------------------
export const farming = {
  id: "farming",
  name: "Farming",
  icon: "https://aldermere.online/assets/wiki/skills/farming.webp",
  active: true,
  taskTitle: "Choose your farming actions",

  renderTask(container) {
    root = container;
    activeCategory = "herbs";
    selected.clear(); manureOn.clear(); counts.clear();

    root.innerHTML = `
      <div class="craft-tabs" role="tablist">
        ${CATEGORIES.map((t) => `
          <button type="button" role="tab"
            class="farmTab ${t.id === activeCategory ? "active" : ""}"
            data-cat="${t.id}"
            aria-selected="${t.id === activeCategory}">${t.label}</button>`).join("")}
      </div>
      <div class="ore-actions">
        <input type="search" class="itemFilter" aria-label="Filter actions"
               placeholder="Filter actions (e.g. moonbloom, milk, egg)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
        <span class="selectedCount">0 selected</span>
      </div>
      <div class="groups"></div>
      <div class="mixSection" hidden>
        <h3>Amount per round</h3>
        <p class="note">Set how many of each action you do per round, e.g. 2 moonbloom
          and 1 vervain planting. Caps follow your farm: 3 herb patches, 4 fibre patches,
          32 poultry, 16 sheep/cows.</p>
        <div class="mixInputs"></div>
      </div>`;

    qa(".farmTab").forEach((b) =>
      b.addEventListener("click", () => setActiveCategory(b.dataset.cat))
    );
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));
    renderGroups();
  },

  onLevelChange(level) {
    lastLevel = level;
    if (!root) return;
    applyLevelHint(level);
    renderGroups();
  },

  calculate({ xpNeeded, currentLevel, log }) {
    const picks = [...selected];
    if (picks.length === 0) {
      return `<p class="note">Select at least one action to see how many you need.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";
    if (picks.length > 1) html += planHtml(picks, xpNeeded, currentLevel, log);

    html += `
      <h3>${title}: single-action breakdown</h3>
      <table class="results">
        <thead><tr><th>Action</th><th>XP each</th><th>Needed</th><th>Rounds</th></tr></thead>
        <tbody>${singleRows(picks, xpNeeded, currentLevel, log)}</tbody>
      </table>
      <p class="note">Counts round up, so totals can overshoot your target by up to one
      repeat. Herb plantings assume 3 pickings plus about 2 seeds. Manure adds 20% to
      herbs and fibre but not to seeds. Real harvests can land a pick or so either side.</p>`;
    return html;
  },
};

