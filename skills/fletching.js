import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

function iconImg(item) {
  if (!item.icon) return "";
  return `<img class="item-icon" src="${ICON_BASE}${item.icon}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />`;
}

// Icons for raw materials (not crafted with Fletching). Add more as you look them up.
const RAW_ICONS = {
  "Feather": "feather",
  "Bowstring": "bowstring",

  "Birch Log": "birch_log",
  "Oak Log": "oak_log",
  "Willow Log": "willow_log",
  "Mirkwood Log": "swampwood_log",
  "Maple Log": "maple_log",
  "Pine Log": "pine_log",
  "Moonwood Log": "moonwood_log",

  "Bronze Arrowhead": "bronze_arrowhead",
  "Iron Arrowhead": "iron_arrowhead",
  "Steel Arrowhead": "steel_arrowhead",
  "Mithril Arrowhead": "mithril_arrowhead",
  "Ebony Arrowhead": "ebony_arrowhead",
  "Verdite Arrowhead": "verdite_arrowhead",
  "Tyrian Arrowhead": "tyrian_arrowhead",

  "Bronze Crossbow Prod": "bronze_crossbow_prod",
  "Iron Crossbow Prod": "iron_crossbow_prod",
  "Steel Crossbow Prod": "steel_crossbow_prod",
  "Mithril Crossbow Prod": "mithril_crossbow_prod",
  "Ebony Crossbow Prod": "ebony_crossbow_prod",
  "Verdite Crossbow Prod": "verdite_crossbow_prod",
  "Tyrian Crossbow Prod": "tyrian_crossbow_prod",
};

function rawIconImg(name) {
  const icon = RAW_ICONS[name] || ITEM_BY_NAME[name]?.icon;
  if (!icon) return "";
  return iconImg({ icon });
}

// ---------------------------------------------------------------------------
// ITEMS (from the wiki JSON, skill 8 = Fletching)
//   xp    = XP per craft
//   makes = items produced per craft (shafts and arrows make 20)
//   mats  = inputs per craft
//   type  = which tab it shows under
// ---------------------------------------------------------------------------

// Tier table: one row per wood/metal tier. Everything below is generated from it.
const TIERS = [
  { level: 1,  wood: "Birch",    woodIcon: "birch",     metal: "Bronze",  xp: { shaft: 10,    unstrung: 20,  bow: 10,   arrow: 40,  stock: 40,  crossbow: 20 } },
  { level: 10, wood: "Oak",      woodIcon: "oak",       metal: "Iron",    xp: { shaft: 13.75, unstrung: 42,  bow: 21,   arrow: 84,  stock: 84,  crossbow: 42 } },
  { level: 20, wood: "Willow",   woodIcon: "willow",    metal: "Steel",   xp: { shaft: 19,    unstrung: 75,  bow: 37.5, arrow: 117, stock: 150, crossbow: 75 } },
  { level: 30, wood: "Mirkwood", woodIcon: "swampwood", metal: "Mithril", xp: { shaft: 24.25, unstrung: 112, bow: 56,   arrow: 187, stock: 224, crossbow: 112 } },
  { level: 40, wood: "Maple",    woodIcon: "maple",     metal: "Ebony",   xp: { shaft: 29.25, unstrung: 151, bow: 75.5, arrow: 226, stock: 302, crossbow: 151 } },
  { level: 60, wood: "Pine",     woodIcon: "pine",      metal: "Verdite", xp: { shaft: 35,    unstrung: 240, bow: 120,  arrow: 315, stock: 480, crossbow: 240 } },
  { level: 80, wood: "Moonwood", woodIcon: "moonwood",  metal: "Tyrian",  xp: { shaft: 40,    unstrung: 320, bow: 160,  arrow: 395, stock: 640, crossbow: 320 } },
];

const ITEMS = [];
TIERS.forEach((t) => {
  const W = t.wood, w = t.woodIcon, M = t.metal, m = M.toLowerCase();
  const log = `${W} Log`;
  const shaft = `${W} Arrow Shaft`;
  const unstrung = `Unstrung ${W} Bow`;
  const stock = `${W} Crossbow Stock`;

  ITEMS.push(
    // Arrows tab
    { type: "arrows",    name: shaft,             icon: `${w}_arrow_shaft`,      level: t.level, xp: t.xp.shaft,    makes: 20, mats: { [log]: 1 } },
    { type: "arrows",    name: `${M} Arrow`,      icon: `${m}_arrow`,            level: t.level, xp: t.xp.arrow,    makes: 20, mats: { [shaft]: 20, "Feather": 20, [`${M} Arrowhead`]: 20 } },
    // Bows tab
    { type: "bows",      name: unstrung,          icon: `unstrung_${w}_bow`,     level: t.level, xp: t.xp.unstrung, makes: 1,  mats: { [log]: 1 } },
    { type: "bows",      name: `${W} Bow`,        icon: `${w}_bow`,              level: t.level, xp: t.xp.bow,      makes: 1,  mats: { [unstrung]: 1, "Bowstring": 1 } },
    // Crossbows tab
    { type: "crossbows", name: stock,             icon: `${w}_crossbow_stock`,   level: t.level, xp: t.xp.stock,    makes: 1,  mats: { [log]: 2 } },
    { type: "crossbows", name: `${M} Crossbow`,   icon: `${m}_crossbow`,         level: t.level, xp: t.xp.crossbow, makes: 1,  mats: { [stock]: 1, [`${M} Crossbow Prod`]: 1, "Bowstring": 1 } },
  );
});

// Icon fixes, if any break: "Item Name": "icon_name"
const ICON_OVERRIDES = {};
ITEMS.forEach((it) => { if (ICON_OVERRIDES[it.name]) it.icon = ICON_OVERRIDES[it.name]; });

const ITEM_BY_NAME = Object.fromEntries(ITEMS.map((it) => [it.name, it]));

// Collapsible groups, by required level (min inclusive, max exclusive). Edit freely.
const GROUPS = [
  { min: 1,  max: 10,  label: "Fletch lvl 1-10" },
  { min: 10, max: 20,  label: "Fletch lvl 10-20" },
  { min: 20, max: 30,  label: "Fletch lvl 20-30" },
  { min: 30, max: 40,  label: "Fletch lvl 30-40" },
  { min: 40, max: 60,  label: "Fletch lvl 40-60" },
  { min: 60, max: 80,  label: "Fletch lvl 60-80" },
  { min: 80, max: 999, label: "Fletch lvl 80+" },
];

const CRAFT_TYPES = [
  { id: "arrows",    label: "Arrows" },
  { id: "bows",      label: "Bows" },
  { id: "crossbows", label: "Crossbows" },
];

// ---------- Materials calculation ----------

// Expand `matName` x `qty`. Intermediates the plan already produces (shafts, unstrung
// bows, stocks) are consumed first; only the shortfall expands into raw materials.
// An intermediate that makes 20 per craft needs ceil(shortfall / 20) extra crafts.
function addRawMats(totals, produced, matName, qty) {
  const sub = ITEM_BY_NAME[matName];
  if (sub && Object.keys(sub.mats).length) {
    const available = produced[matName] || 0;
    const used = Math.min(available, qty);
    produced[matName] = available - used;
    const shortfall = qty - used;
    if (shortfall > 0) {
      const crafts = Math.ceil(shortfall / sub.makes);
      // Leftovers from rounding up (e.g. 20 shafts per craft) stay available
      produced[matName] += crafts * sub.makes - shortfall;
      for (const [m, perCraft] of Object.entries(sub.mats)) {
        addRawMats(totals, produced, m, perCraft * crafts);
      }
    }
  } else {
    totals[matName] = (totals[matName] || 0) + qty;
  }
}

// `planItems` = [{ item, count }] where count = crafts. Returns raw material totals.
function planRawMats(planItems) {
  const totals = {};
  const produced = {};
  planItems.forEach(({ item, count }) => {
    produced[item.name] = (produced[item.name] || 0) + count * item.makes;
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
          <td>${rawIconImg(mat)}${mat}</td>
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

let root = null;
let activeType = "arrows";
let lastLevel = null;

// Crafts-per-round ratios the user typed, keyed by item index.
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

function rebuildRatioInputs() {
  updateSelectedCount();

  const mixSection = q(".mixSection");
  const mixInputs = q(".mixInputs");
  const idx = selectedIndexes();

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
    row.innerHTML = `<span>${iconImg(ITEMS[i])}${ITEMS[i].name}</span>
      <span><input type="number" class="ratioInput" data-item="${i}" min="0" step="1" value="${value}" placeholder="0" /> crafts</span>`;
    mixInputs.appendChild(row);
  });
}

function onSelectionChange() {
  updateGroupCounts();
  rebuildRatioInputs();
}

function setVisibleItems(state) {
  qa(".item-row").forEach((label) => {
    if (label.hidden) return;
    label.querySelector(".itemCheck").checked = state;
  });
  onSelectionChange();
}

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
  qa(".item-row").forEach((label) => {
    const item = ITEMS[parseInt(label.dataset.index, 10)];
    label.classList.toggle("above-level", level < item.level);
  });
}

function renderGroups() {
  const groupsEl = q(".groups");
  groupsEl.innerHTML = "";

  GROUPS.forEach((grp) => {
    const indexes = [];
    ITEMS.forEach((item, i) => {
      if (item.type !== activeType) return;
      if (item.level < grp.min || item.level >= grp.max) return;
      indexes.push(i);
    });

    if (indexes.length === 0) return;

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
      const per = item.makes > 1 ? ` · makes ${item.makes}` : "";
      const label = document.createElement("label");
      label.className = "ore-item item-row";
      label.dataset.index = i;
      label.innerHTML = `
        <input type="checkbox" class="itemCheck" value="${i}" />
        <span class="ore-name">${iconImg(item)}${item.name}</span>
        <span class="ore-meta">Req. Lv ${item.level} · ${item.xp} XP${per}</span>`;
      grid.appendChild(label);
    });

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

  const first = q(".group");
  if (first) first.open = true;

  applyFilter();
  applyLevelHint(lastLevel);
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

  renderGroups();
}

// ---------- Result builders ----------

function usableCell(currentLevel, item) {
  return currentLevel >= item.level ? "✅" : "❌ Lv " + item.level;
}

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
      <tr><th>Item</th><th>Per round</th><th>XP each</th><th>Crafts needed</th><th>Items made</th><th>XP from item</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }, n) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const count = ratios[n] * rounds;
    totalCrafts += count;
    planItems.push({ item, count });
    html += `
      <tr>
        <td>${iconImg(item)}${item.name}</td>
        <td>${ratios[n]}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(count)}</td>
        <td>${fmt(count * item.makes)}</td>
        <td>${fmt(xpEach * count)}</td>
        <td>${usableCell(currentLevel, item)}</td>
      </tr>`;
  });

  html += `
      <tr><td colspan="3"><strong>Total crafts</strong></td>
      <td><strong>${fmt(totalCrafts)}</strong></td><td></td><td></td><td></td></tr>
    </table>`;

  html += matsTable(planRawMats(planItems), "Materials needed (combined plan)");
  return html;
}

function singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title) {
  let html = `
    <h3>If you fletch only one item (${title})</h3>
    <table>
      <tr><th>Item</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ logs</th><th>Crafts needed</th><th>Items made</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const crafts = Math.ceil(xpNeeded / xpEach);
    html += `
      <tr>
        <td>${iconImg(item)}${item.name}</td>
        <td>${item.level}</td>
        <td>${fmt(item.xp)}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(crafts)}</td>
        <td>${fmt(crafts * item.makes)}</td>
        <td>${usableCell(currentLevel, item)}</td>
      </tr>`;
  });

  html += `</table>`;

  if (selected.length === 1) {
    const { item } = selected[0];
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const count = Math.ceil(xpNeeded / xpEach);
    html += matsTable(planRawMats([{ item, count }]), `Materials needed (${item.name})`);
  }

  return html;
}

// ---------- Skill definition ----------

export const fletching = {
  id: "fletching",
  name: "Fletching",
  icon: "https://aldermere.online/assets/wiki/skills/fletching.webp",
  active: true,
  taskTitle: "Choose your items",

  renderTask(container) {
    root = container;
    activeType = "arrows";
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
               placeholder="Filter items (e.g. shaft, maple, tyrian)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
        <span class="selectedCount">0 selected</span>
      </div>
      <div class="groups"></div>
      <div class="mixSection" hidden>
        <h3>Crafts per round</h3>
        <p class="note">Set how many of each item to craft per round. Leave everything
          at 1 for equal crafts. One shaft craft makes 20 shafts, enough for one arrow craft.</p>
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

  onLevelChange(level) {
    lastLevel = level;
    if (!root) return;
    applyLevelHint(level);
  },

  // After inserting the returned HTML into the page, call wireMatsInputs(resultsElement).
  calculate({ xpNeeded, currentLevel, log }) {
    const selected = selectedIndexes().map((i) => ({ item: ITEMS[i], i }));

    if (selected.length === 0) {
      return `<p class="note">Select at least one item to see how many you need.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";

    if (selected.length > 1) {
      html += ratioPlanHtml(selected, xpNeeded, currentLevel, log, title);
    }

    html += singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title);

    html += `
      <p class="note">Craft counts round up, so totals can overshoot your target by up
      to one round's worth of XP. Materials include the shafts, unstrung bows and stocks
      you fletch yourself; if you plan those crafts too, they are counted first.
      Bowstrings, arrowheads and crossbow prods come from Crafting and Smithing.</p>`;

    return html;
  },
};
