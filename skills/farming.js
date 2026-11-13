// farming.js
import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js"; // eslint-disable-line no-unused-vars

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
  manureBonus: 0.2, // +20% on herb/fibre harvests, never on seeds
};

// ---------------------------------------------------------------------------
// CROP / ANIMAL DATA
// plant = xp for planting the seed; herb / fibre = xp per herb, fibre OR seed
// Levels and planting xp come from the wiki data (wiki.v1.json, recipes with skill 14).
// The wiki doesn't list xp per herb / fibre, so those are estimates: herb = 2.5 x plant,
// fibre = 0.3 x plant (the ratios the old screenshot values followed; exact for lvl 60).
// ---------------------------------------------------------------------------
const HERB_CROPS = {
  Wildleaf:  { level: 1,  plant: 10,   herb: 25     },
  Vervain:   { level: 20, plant: 37.5, herb: 93.75  },
  Moonbloom: { level: 40, plant: 75.5, herb: 188.75 },
  Embersage: { level: 60, plant: 120,  herb: 300    },
};

const FIBRE_CROPS = {
  Hemp:      { level: 10,  plant: 21,   fibre: 6.3   },
  Flax:      { level: 20,  plant: 37.5, fibre: 11.25 },
  Stinkreed: { level: 30,  plant: 56,   fibre: 16.8  },
  Toetoe:    { level: 40,  plant: 75.5, fibre: 22.65 },
  Sunthread: { level: 60,  plant: 120,  fibre: 36    },
};

// Herbs per picking / fibre per harvest, indexed by levels above the crop
const HERBS_PER_PICK = [5, 7, 8, 9, 11, 13, 15, 19, 22, 26, 32, 38, 40];
const FIBRE_YIELD = [45, 63, 72, 81, 99, 117, 135];
const HERB_PICKINGS = 3;

// Seed harvests: each pick uses a share of the plant's yield bar (±15% random).
// share = start × decay^(levels above ÷ 13), never below floor.
const SEED_RULES = {
  herb:  { start: 1.0, decay: 0.5,    floor: 0.5,   seedsPerPick: 1, seedsToPlant: 1 },
  fibre: { start: 0.4, decay: 0.4625, floor: 0.185, seedsPerPick: 9, seedsToPlant: 9 },
};
const SEED_RAMP_LEVELS = 13;
const PICK_VARIANCE = 0.15;

// Livestock levels and xp come from the wiki data (wiki.v1.json, livestock.breeds).
const POULTRY = {
  Chicken:    { level: 1,  egg: 15,     grow: 10,   slaughter: 30    },
  Copperneck: { level: 20, egg: 56.25,  grow: 37.5, slaughter: 112.5 },
  Goose:      { level: 40, egg: 113.25, grow: 75.5, slaughter: 226.5 },
  Stormneck:  { level: 60, egg: 180,    grow: 120,  slaughter: 360   },
};

const STOCK = {
  Sheep:         { level: 1,  milk: 15,    wool: 30,  grow: 10,   slaughter: 30    },
  Cow:           { level: 20, milk: 112.5, wool: 0,   grow: 37.5, slaughter: 112.5 },
  "Black Cow":   { level: 40, milk: 226.5, wool: 0,   grow: 75.5, slaughter: 226.5 },
  "Spotted Cow": { level: 60, milk: 360,   wool: 0,   grow: 120,  slaughter: 360   },
  Merino:        { level: 80, milk: 240,   wool: 480, grow: 160,  slaughter: 480   },
};

// ---------------------------------------------------------------------------
// ICONS (item icon names from the wiki data)
// ---------------------------------------------------------------------------
const CROP_ICONS = {
  // crop: [harvested item, seed]. All fibre seeds share the wiki's "herb_seed" icon.
  Wildleaf:  ["wildleaf",  "wildleaf_seed"],
  Vervain:   ["vervain",   "vervain_seed"],
  Moonbloom: ["moonbloom", "moonbloom_seed"],
  Embersage: ["embersage", "embersage_seed"],
  Hemp:      ["hemp",      "herb_seed"],
  Flax:      ["flax",      "herb_seed"],
  Stinkreed: ["stinkreed", "herb_seed"],
  Toetoe:    ["toetoe",    "herb_seed"],
  Sunthread: ["sunthread", "herb_seed"],
};

const ANIMAL_ICONS = {
  // kind -> icon. growup shows the young animal, slaughter the adult.
  Chicken:       { egg: "egg",                 growup: "hen_chick",               slaughter: "hen" },
  Copperneck:    { egg: "copperneck_egg",      growup: "copperneck_hen_chick",    slaughter: "copperneck_hen" },
  Goose:         { egg: "goose_egg",           growup: "goose_gosling",           slaughter: "goose" },
  Stormneck:     { egg: "stormneck_goose_egg", growup: "stormneck_goose_gosling", slaughter: "stormneck_goose" },
  Sheep:         { milk: "sheep_milk",       wool: "wool",        growup: "ewe_lamb",            slaughter: "sheep" },
  Cow:           { milk: "cow_milk",                              growup: "heifer_calf",         slaughter: "cow" },
  "Black Cow":   { milk: "black_cow_milk",                        growup: "black_heifer_calf",   slaughter: "black_cow" },
  "Spotted Cow": { milk: "spotted_cow_milk",                      growup: "spotted_heifer_calf", slaughter: "spotted_cow" },
  Merino:        { milk: "merino_milk",      wool: "merino_wool", growup: "merino_ewe_lamb",     slaughter: "merino_sheep" },
};

function iconFor(item) {
  if (item.kind === "muck") return "manure";
  if (item.crop) {
    const [harvest, seed] = CROP_ICONS[item.crop] || [];
    return item.kind === "herbHarvest" || item.kind === "fibreHarvest" ? harvest : seed;
  }
  return ANIMAL_ICONS[item.animal]?.[item.kind];
}

// ---------------------------------------------------------------------------
// CALC HELPERS
// ---------------------------------------------------------------------------
const bonusMult = (log) => 1 + (log?.bonus || 0) / 100;
const levelsAbove = (level, cropLevel) => Math.max(0, level - cropLevel);
const oneDec = (n) => (Number.isInteger(n) ? fmt(n) : n.toFixed(1));

const cropType = (item) => (item.category === "herbs" ? "herb" : "fibre");
const cropData = (item) =>
  item.category === "herbs" ? HERB_CROPS[item.crop] : FIBRE_CROPS[item.crop];
const cropXpEach = (c) => c.herb ?? c.fibre;
const withManure = (qty, manure) =>
  manure ? Math.round(qty * (1 + LIMITS.manureBonus)) : qty;

function herbsPerPick(level, cropLevel, manure) {
  const diff = levelsAbove(level, cropLevel);
  return withManure(HERBS_PER_PICK[Math.min(diff, HERBS_PER_PICK.length - 1)], manure);
}

function fibrePerHarvest(level, cropLevel, manure) {
  const diff = levelsAbove(level, cropLevel);
  return withManure(FIBRE_YIELD[Math.min(diff, FIBRE_YIELD.length - 1)], manure);
}

// Share of the yield bar one pick uses, before the ±15% roll
function seedShare(type, diff) {
  const r = SEED_RULES[type];
  const d = Math.min(Math.max(0, diff), SEED_RAMP_LEVELS);
  return Math.max(r.floor, r.start * r.decay ** (d / SEED_RAMP_LEVELS));
}

// Expected number of picks until the bar is used up, when every pick uses
// share × U(0.85, 1.15). E[N] = Σ P(sum of first n picks < 100%).
function expectedPicks(share) {
  const BINS = 4000;
  const h = 1 / BINS;
  const a = Math.max(1, Math.round((share * (1 - PICK_VARIANCE)) / h));
  const b = Math.max(a, Math.round((share * (1 + PICK_VARIANCE)) / h));
  const w = 1 / (b - a + 1);
  let dist = new Float64Array(BINS);
  dist[0] = 1;
  let below = 1;
  let expected = 0;
  while (below > 1e-9) {
    expected += below;
    const pre = new Float64Array(BINS + 1);
    for (let j = 0; j < BINS; j++) pre[j + 1] = pre[j] + dist[j];
    const next = new Float64Array(BINS);
    below = 0;
    for (let j = a; j < BINS; j++) {
      next[j] = (pre[j - a + 1] - pre[Math.max(0, j - b)]) * w;
      below += next[j];
    }
    dist = next;
  }
  return expected;
}

const seedCache = new Map();
function seedHarvest(type, diff) {
  const d = Math.min(Math.max(0, diff), SEED_RAMP_LEVELS);
  const key = `${type}:${d}`;
  if (seedCache.has(key)) return seedCache.get(key);
  const r = SEED_RULES[type];
  const share = seedShare(type, d);
  const minPicks = Math.ceil(1 / (share * (1 + PICK_VARIANCE)) - 1e-9);
  const maxPicks = Math.ceil(1 / (share * (1 - PICK_VARIANCE)) - 1e-9);
  const expPicks = expectedPicks(share);
  const res = {
    share,
    minSeeds: minPicks * r.seedsPerPick,
    maxSeeds: maxPicks * r.seedsPerPick,
    expSeeds: expPicks * r.seedsPerPick,
  };
  seedCache.set(key, res);
  return res;
}

// ---------------------------------------------------------------------------
// ACTION CATALOG
// kind: plant | herbHarvest | fibreHarvest | seedHarvest |
//       egg | growup | slaughter | milk | wool | muck
// `unit` is what one "repeat" means; `max` is the farm cap per round.
// ---------------------------------------------------------------------------
const ITEMS = [
  // ---- HERBS: plant seed → 3 herb pickings → goes to seed ----
  ...Object.entries(HERB_CROPS).flatMap(([name, c]) => {
    const base = { category: "herbs", crop: name, level: c.level, max: LIMITS.herbPatches };
    return [
      { ...base, name: `${name}: plant seed`,     kind: "plant",       unit: "planting" },
      { ...base, name: `${name}: harvest herbs`,  kind: "herbHarvest", unit: "harvest" },
      { ...base, name: `${name}: harvest seeds`,  kind: "seedHarvest", unit: "seed harvest" },
    ];
  }),

  // ---- FIBRE: plant seed → harvest fibre OR let it go to seed ----
  ...Object.entries(FIBRE_CROPS).flatMap(([name, c]) => {
    const base = { category: "fibre", crop: name, level: c.level, max: LIMITS.fibrePatches };
    return [
      { ...base, name: `${name}: plant seeds`,             kind: "plant",        unit: "planting" },
      { ...base, name: `${name}: harvest fibre`,           kind: "fibreHarvest", unit: "harvest" },
      { ...base, name: `${name}: let it go to seed`,       kind: "seedHarvest",  unit: "seed harvest" },
    ];
  }),

  // ---- LIVESTOCK ----
  { name: "Muck out (per muck level)", category: "livestock", kind: "muck",
    level: 1, unit: "muck level", max: 3 },

  ...Object.entries(POULTRY).flatMap(([name, t]) => ([
    { name: `${name} egg`,       category: "livestock", kind: "egg",       animal: name, level: t.level, unit: "egg",  max: LIMITS.poultryMax * LIMITS.eggStorageDays },
    { name: `${name} grows up`,  category: "livestock", kind: "growup",    animal: name, level: t.level, unit: "bird", max: LIMITS.poultryMax },
    { name: `Slaughter ${name}`, category: "livestock", kind: "slaughter", animal: name, level: t.level, unit: "bird", max: LIMITS.poultryMax },
  ])),

  ...Object.entries(STOCK).flatMap(([name, t]) => {
    const rows = [
      { name: `${name} milk`,      category: "livestock", kind: "milk",      animal: name, level: t.level, unit: "milking", max: LIMITS.stockMax },
      { name: `${name} grows up`,  category: "livestock", kind: "growup",    animal: name, level: t.level, unit: "animal",  max: LIMITS.stockMax },
      { name: `Slaughter ${name}`, category: "livestock", kind: "slaughter", animal: name, level: t.level, unit: "animal",  max: LIMITS.stockMax },
    ];
    if (t.wool) rows.splice(1, 0,
      { name: `${name} wool`, category: "livestock", kind: "wool", animal: name, level: t.level, unit: "shearing", max: LIMITS.stockMax });
    return rows;
  }),
];

ITEMS.forEach((it) => { it.icon = iconFor(it); });

const supportsManure = (it) => it.kind === "herbHarvest" || it.kind === "fibreHarvest";

// XP for ONE repeat of an action at `level` (before log bonus)
function itemXp(item, level, opts = {}) {
  const { manure = false } = opts;
  if (item.crop) {
    const c = cropData(item);
    const diff = levelsAbove(level, c.level);
    switch (item.kind) {
      case "plant":        return c.plant;
      case "herbHarvest":  return HERB_PICKINGS * herbsPerPick(level, c.level, manure) * c.herb;
      case "fibreHarvest": return fibrePerHarvest(level, c.level, manure) * c.fibre;
      case "seedHarvest":  return seedHarvest(cropType(item), diff).expSeeds * cropXpEach(c);
      default:             return 0;
    }
  }
  const tier = POULTRY[item.animal] || STOCK[item.animal];
  switch (item.kind) {
    case "egg":       return tier.egg;
    case "growup":    return tier.grow;
    case "slaughter": return tier.slaughter;
    case "milk":      return tier.milk;
    case "wool":      return tier.wool;
    case "muck":      return 5;
    default:          return 0;
  }
}

// Seeds used / gained by ONE repeat
function itemSeeds(item, level) {
  if (!item.crop) return { used: 0, gained: 0 };
  const rules = SEED_RULES[cropType(item)];
  if (item.kind === "plant") return { used: rules.seedsToPlant, gained: 0 };
  if (item.kind === "seedHarvest") {
    const diff = levelsAbove(level, cropData(item).level);
    return { used: 0, gained: seedHarvest(cropType(item), diff).expSeeds };
  }
  return { used: 0, gained: 0 };
}

// One-line explanation shown under each action
function itemDetail(item, level, manure) {
  if (!item.crop) return "";
  const c = cropData(item);
  const type = cropType(item);
  const rules = SEED_RULES[type];
  const diff = levelsAbove(level, c.level);
  switch (item.kind) {
    case "plant":
      return `Uses ${rules.seedsToPlant} seed${rules.seedsToPlant === 1 ? "" : "s"}`;
    case "herbHarvest":
      return `${HERB_PICKINGS} pickings × ${herbsPerPick(level, c.level, manure)} herbs × ${fmt(c.herb)} xp`;
    case "fibreHarvest":
      return `${fibrePerHarvest(level, c.level, manure)} fibre × ${fmt(c.fibre)} xp`;
    case "seedHarvest": {
      const s = seedHarvest(type, diff);
      const range = s.minSeeds === s.maxSeeds ? `${s.minSeeds}` : `${s.minSeeds}–${s.maxSeeds}`;
      const when = type === "herb" ? "after the 3rd picking, " : "instead of fibre, ";
      return `Seeds only: ${when}~${oneDec(s.expSeeds)} seeds (${range}) × ${fmt(cropXpEach(c))} xp. ` +
             `Each pick uses ~${(s.share * 100).toFixed(1)}% of the yield bar`;
    }
    default:
      return "";
  }
}

const CATEGORIES = [
  { id: "herbs",     label: "Herbs" },
  { id: "fibre",     label: "Fibre" },
  { id: "livestock", label: "Livestock" },
];


// Collapsible groups, by required level (min inclusive, max exclusive). Edit freely.
const GROUPS = [
  { min: 1,   max: 10,       label: "Farming lvl 1-10" },
  { min: 10,  max: 20,       label: "Farming lvl 10-20" },
  { min: 20,  max: 30,       label: "Farming lvl 20-30" },
  { min: 30,  max: 40,       label: "Farming lvl 30-40" },
  { min: 40,  max: 60,       label: "Farming lvl 40-60" },
  { min: 60,  max: 80,       label: "Farming lvl 60-80" },
  { min: 80,  max: 100,      label: "Farming lvl 80-100" },
  { min: 100, max: Infinity, label: "Farming lvl 100" },
];

// ---------------------------------------------------------------------------
// STYLES (scoped; replaces the old checkboxes with toggle rows)
// ---------------------------------------------------------------------------
const STYLES = `
  .farming-ui .farm-row { display: flex; align-items: stretch; gap: 8px; margin: 4px 0; }
  .farming-ui .farm-pick {
    flex: 1; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px;
    text-align: left; font: inherit; color: inherit; background: transparent;
    border: 1px solid rgba(127,127,127,.35); border-radius: 8px; padding: 6px 10px; cursor: pointer;
  }
  .farming-ui .farm-pick:hover { border-color: rgba(127,127,127,.75); }
  .farming-ui .farm-pick:focus-visible, .farming-ui .farm-manure:focus-visible { outline: 2px solid #4caf50; outline-offset: 2px; }
  .farming-ui .farm-pick[aria-pressed="true"] { border-color: #4caf50; background: rgba(76,175,80,.14); }
  .farming-ui .farm-tick { width: 1em; color: #4caf50; font-weight: 700; visibility: hidden; }
  .farming-ui .farm-pick[aria-pressed="true"] .farm-tick { visibility: visible; }
  .farming-ui .item-name { font-weight: 600; }
  .farming-ui .item-detail { flex-basis: 100%; padding-left: 1.6em; font-size: .85em; opacity: .75; }
  .farming-ui .farm-manure {
    font: inherit; font-size: .85em; color: inherit; background: transparent; cursor: pointer;
    border: 1px solid rgba(127,127,127,.35); border-radius: 999px; padding: 4px 12px; align-self: center;
  }
  .farming-ui .farm-manure[aria-pressed="true"] { border-color: #a1887f; background: rgba(161,136,127,.25); }
  .farming-ui .above-level .farm-pick { opacity: .55; }
`;

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

function rowLevel(it) {
  return Math.max(lastLevel, it.level);
}

function rowXpText(i) {
  const it = ITEMS[i];
  const xp = itemXp(it, rowLevel(it), { manure: manureOn.has(i) });
  return `${fmt(xp)} xp / ${it.unit}`;
}

function rowHtml(i) {
  const it = ITEMS[i];
  const on = selected.has(i);
  const manure = manureOn.has(i);
  const detail = itemDetail(it, rowLevel(it), manure);
  return `
    <div class="item-row farm-row" data-level="${it.level}" data-name="${it.name.toLowerCase()}">
      <button type="button" class="farm-pick" data-i="${i}" aria-pressed="${on}">
        <span class="farm-tick" aria-hidden="true">✓</span>
        ${iconImg(it)} <span class="item-name">${it.name}</span>
        <span class="item-level">Lv ${it.level}</span>
        <span class="item-xp">${rowXpText(i)}</span>
        ${detail ? `<span class="item-detail">${detail}</span>` : ""}
      </button>
      ${supportsManure(it) ? `
        <button type="button" class="farm-manure" data-i="${i}" aria-pressed="${manure}"
                title="Manure adds 20% to this harvest">Manure</button>` : ""}
    </div>`;
}

function groupsHtml() {
  const idx = visibleIndexes();
  return GROUPS.map((g) => {
    const rows = idx.filter((i) => ITEMS[i].level >= g.min && ITEMS[i].level < g.max);
    if (!rows.length) return "";
    return `
      <details class="group" open>
        <summary>${g.label}</summary>
        ${rows.map(rowHtml).join("")}
      </details>`;
  }).join("");
}

function renderGroups() {
  q(".groups").innerHTML = groupsHtml();
  applyFilter(); applyLevelHint(lastLevel); updateCount(); renderMix();
}

// One delegated listener for row and manure toggles
function onGroupsClick(e) {
  const pick = e.target.closest(".farm-pick");
  const manureBtn = e.target.closest(".farm-manure");
  if (pick) {
    const i = Number(pick.dataset.i);
    const on = !selected.has(i);
    on ? selected.add(i) : selected.delete(i);
    pick.setAttribute("aria-pressed", String(on));
    updateCount(); renderMix();
  } else if (manureBtn) {
    const i = Number(manureBtn.dataset.i);
    const on = !manureOn.has(i);
    on ? manureOn.add(i) : manureOn.delete(i);
    manureBtn.setAttribute("aria-pressed", String(on));
    // refresh this row's xp + detail without collapsing groups
    const row = manureBtn.closest(".farm-row");
    const it = ITEMS[i];
    row.querySelector(".item-xp").textContent = rowXpText(i);
    const det = row.querySelector(".item-detail");
    if (det) det.textContent = itemDetail(it, rowLevel(it), on);
  }
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
  qa(".item-row").forEach((r) => { r.hidden = Boolean(term) && !r.dataset.name.includes(term); });
}

function setVisibleItems(on) {
  qa(".item-row:not([hidden]) .farm-pick").forEach((el) => {
    const i = Number(el.dataset.i);
    on ? selected.add(i) : selected.delete(i);
    el.setAttribute("aria-pressed", String(on));
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

// "Amount per round" inputs for the combined plan
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
const plural = (n, word) => `${word}${n === 1 ? "" : "s"}`;

function seedCell(it, need, level) {
  const s = itemSeeds(it, level);
  if (s.used) return `${fmt(need * s.used)} planted`;
  if (s.gained) return `~${fmt(Math.round(need * s.gained))} gained`;
  return "-";
}

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
      <td>${fmt(need)} ${plural(need, it.unit)}</td>
      <td>${rounds ? fmt(rounds) : "-"}</td>
      <td>${seedCell(it, need, level)}</td>
    </tr>`;
  }).join("");
}

function planHtml(picks, xpNeeded, level, log) {
  const mult = bonusMult(log);
  let perRound = 0, usedPerRound = 0, gainedPerRound = 0;
  picks.forEach((i) => {
    const it = ITEMS[i];
    const n = Math.min(counts.get(i) ?? 1, it.max || Infinity);
    perRound += itemXp(it, level, { manure: manureOn.has(i) }) * n * mult;
    const s = itemSeeds(it, level);
    usedPerRound += s.used * n;
    gainedPerRound += s.gained * n;
  });
  const rounds = perRound > 0 ? Math.ceil(xpNeeded / perRound) : 0;
  const seedLine = usedPerRound || gainedPerRound
    ? `<p>Seeds: you plant <strong>${fmt(rounds * usedPerRound)}</strong> and get about
       <strong>${fmt(Math.round(rounds * gainedPerRound))}</strong> back.</p>`
    : "";
  return `
    <h3>Combined plan</h3>
    <p>${fmt(perRound)} xp per round, <strong>${fmt(rounds)}</strong> rounds
       (${fmt(rounds * perRound)} xp total).</p>
    ${seedLine}`;
}

// Full-cycle seed plan for every crop that has an action selected
function seedPlanHtml(picks, xpNeeded, level, log) {
  const mult = bonusMult(log);
  const crops = [...new Set(picks.map((i) => ITEMS[i]).filter((it) => it.crop)
    .map((it) => `${it.category}|${it.crop}`))];
  if (!crops.length) return "";

  const manureFor = (category, crop, kind) =>
    manureOn.has(ITEMS.findIndex((it) => it.category === category && it.crop === crop && it.kind === kind));

  const rows = [];
  const addRow = (label, cycleXp, toPlant, backPerCycle, minBackPerCycle, patches) => {
    const cycles = cycleXp > 0 ? Math.ceil(xpNeeded / cycleXp) : 0;
    const planted = cycles * toPlant;
    const back = cycles * backPerCycle;
    // First round has to be bought/brought; afterwards seeds come back if a harvest
    // always returns at least what you planted.
    const firstRound = Math.min(cycles, patches) * toPlant;
    const bring = minBackPerCycle >= toPlant
      ? firstRound
      : Math.max(firstRound, Math.ceil(planted - back));
    rows.push(`<tr>
      <td>${label}</td>
      <td>${fmt(cycleXp)}</td>
      <td>${fmt(cycles)}</td>
      <td>${fmt(planted)}</td>
      <td>${back ? `~${fmt(Math.round(back))}` : "0"}</td>
      <td><strong>${fmt(bring)}</strong></td>
    </tr>`);
  };

  crops.forEach((key) => {
    const [category, crop] = key.split("|");
    if (category === "herbs") {
      const c = HERB_CROPS[crop];
      const manure = manureFor("herbs", crop, "herbHarvest");
      const s = seedHarvest("herb", levelsAbove(level, c.level));
      const cycleXp = (c.plant
        + HERB_PICKINGS * herbsPerPick(level, c.level, manure) * c.herb
        + s.expSeeds * c.herb) * mult;
      addRow(`${crop}: plant + herbs + seeds${manure ? " (manure)" : ""}`,
        cycleXp, 1, s.expSeeds, s.minSeeds, LIMITS.herbPatches);
    } else {
      const c = FIBRE_CROPS[crop];
      const manure = manureFor("fibre", crop, "fibreHarvest");
      const s = seedHarvest("fibre", levelsAbove(level, c.level));
      addRow(`${crop}: plant + fibre${manure ? " (manure)" : ""}`,
        (c.plant + fibrePerHarvest(level, c.level, manure) * c.fibre) * mult,
        9, 0, 0, LIMITS.fibrePatches);
      addRow(`${crop}: plant + let it go to seed`,
        (c.plant + s.expSeeds * c.fibre) * mult,
        9, s.expSeeds, s.minSeeds, LIMITS.fibrePatches);
    }
  });

  return `
    <h3>Seed plan: full plantings to reach your target</h3>
    <table class="results">
      <thead><tr><th>Cycle</th><th>XP per planting</th><th>Plantings</th>
        <th>Seeds planted</th><th>Seeds back</th><th>Seeds to bring</th></tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
    <p class="note">Herbs: 1 seed per planting, fibre: 9. "Seeds to bring" is what you need
      before you start; when a harvest always returns at least what you planted, only your
      first round of patches needs seeds.</p>`;
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
      <style>${STYLES}</style>
      <div class="farming-ui">
        <div class="craft-tabs" role="tablist">
          ${CATEGORIES.map((t) => `
            <button type="button" role="tab"
              class="farmTab ${t.id === activeCategory ? "active" : ""}"
              data-cat="${t.id}"
              aria-selected="${t.id === activeCategory}">${t.label}</button>`).join("")}
        </div>
        <div class="ore-actions">
          <input type="search" class="itemFilter" aria-label="Filter actions"
                 placeholder="Filter actions (e.g. moonbloom, seed, milk)..." />
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
        </div>
      </div>`;

    qa(".farmTab").forEach((b) =>
      b.addEventListener("click", () => setActiveCategory(b.dataset.cat))
    );
    q(".groups").addEventListener("click", onGroupsClick);
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));
    renderGroups();
  },

  onLevelChange(level) {
    lastLevel = level;
    if (!root) return;
    renderGroups();
  },

  calculate({ xpNeeded, currentLevel, log }) {
    const picks = [...selected];
    if (picks.length === 0) {
      return `<p class="note">Select at least one action to see how many you need.</p>`;
    }

    const title = `${log?.name ?? "Farming"}${log?.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";
    if (picks.length > 1) html += planHtml(picks, xpNeeded, currentLevel, log);

    html += `
      <h3>${title}: single-action breakdown</h3>
      <table class="results">
        <thead><tr><th>Action</th><th>XP each</th><th>Needed</th><th>Rounds</th><th>Seeds</th></tr></thead>
        <tbody>${singleRows(picks, xpNeeded, currentLevel, log)}</tbody>
      </table>`;

    html += seedPlanHtml(picks, xpNeeded, currentLevel, log);

    html += `
      <p class="note">XP uses your current farming level (lvl ${currentLevel}); yields grow as
      you level, so the real count ends up a little lower. Counts round up, so totals can
      overshoot your target by up to one repeat. Seed harvests show the expected number of
      seeds including the ±15% roll per pick. Manure adds 20% to herb and fibre harvests,
      never to seeds.</p>`;
    return html;
  },
};
