import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

// Potion data transcribed from the Alchemy table screenshots.
// Each recipe = 1 herb + N secondary ingredients, made at the Alchemy table.
// `inputs` is the recipe for ONE potion.
const BASE_ITEMS = [
  // Gathering
  { name: "Red Mushroom", level: 1, xp: 5, inputs: {}, kind: "gather" },

  // Tier I
  { name: "Health Potion I",                level: 1,  xp: 45,  inputs: { "Wildleaf": 1, "Red Mushroom": 1 } },
  { name: "Mana Regen Potion I",            level: 3,  xp: 51,  inputs: { "Wildleaf": 1, "Crystal": 1 } },
  { name: "Anti-venom I (Adder Venom)",     level: 5,  xp: 59,  inputs: { "Wildleaf": 1, "Adder Venom": 1 } },
  { name: "Anti-venom I (Briar Wasp Sting)", level: 5, xp: 59,  inputs: { "Wildleaf": 1, "Briar Wasp Sting": 1 } },
  { name: "Mana Potion I",                  level: 5,  xp: 59,  inputs: { "Wildleaf": 1, "Crystal": 1 } },
  { name: "Strength Potion I",              level: 9,  xp: 78,  inputs: { "Wildleaf": 1, "Goblin Fang": 1 } },
  { name: "Dexterity Potion I",             level: 13, xp: 105, inputs: { "Wildleaf": 1, "Stag Antler": 1 } },
  { name: "Magic Potion I",                 level: 17, xp: 135, inputs: { "Wildleaf": 1, "Hex Bead": 1 } },

  // Tier II
  { name: "Health Potion II",               level: 21, xp: 180, inputs: { "Vervain": 1, "Red Mushroom": 2 } },
  { name: "Mana Regen Potion II",           level: 23, xp: 190, inputs: { "Vervain": 1, "Crystal": 2 } },
  { name: "Anti-venom II (Ettercap Venom)", level: 25, xp: 205, inputs: { "Vervain": 1, "Ettercap Venom": 1 } },
  { name: "Anti-venom II (Fen Viper Venom)", level: 25, xp: 205, inputs: { "Vervain": 1, "Fen Viper Venom": 1 } },
  { name: "Mana Potion II",                 level: 25, xp: 205, inputs: { "Vervain": 1, "Crystal": 2 } },
  { name: "Strength Potion II",             level: 29, xp: 235, inputs: { "Vervain": 1, "Aurach Horn": 1 } },
  { name: "Dexterity Potion II",            level: 33, xp: 270, inputs: { "Vervain": 1, "Ettercap Leg": 1 } },
  { name: "Magic Potion II",                level: 37, xp: 305, inputs: { "Vervain": 1, "Witch's Eye": 1 } },

  // Tier III
  { name: "Health Potion III",              level: 41, xp: 350, inputs: { "Moonbloom": 1, "Red Mushroom": 3 } },
  { name: "Mana Regen Potion III",          level: 43, xp: 365, inputs: { "Moonbloom": 1, "Crystal": 3 } },
  { name: "Anti-venom III",                 level: 45, xp: 380, inputs: { "Moonbloom": 1, "Seep Venom": 1 } },
  { name: "Mana Potion III",                level: 45, xp: 380, inputs: { "Moonbloom": 1, "Crystal": 3 } },
  { name: "Strength Potion III",            level: 49, xp: 415, inputs: { "Moonbloom": 1, "Bear Claw": 1 } },
  { name: "Dexterity Potion III",           level: 53, xp: 455, inputs: { "Moonbloom": 1, "Seep Spider Leg": 1 } },
  { name: "Magic Potion III",               level: 57, xp: 495, inputs: { "Moonbloom": 1, "Swamp Dragon Heart": 1 } },

  // Tier IV
  { name: "Health Potion IV",               level: 61, xp: 540, inputs: { "Embersage": 1, "Red Mushroom": 4 } },
  { name: "Mana Regen Potion IV",           level: 63, xp: 555, inputs: { "Embersage": 1, "Crystal": 4 } },
  { name: "Mana Potion IV",                 level: 65, xp: 570, inputs: { "Embersage": 1, "Crystal": 4 } },
  { name: "Strength Potion IV",             level: 69, xp: 605, inputs: { "Embersage": 1, "Small Dragon Fang": 1 } },
  { name: "Dexterity Potion IV",            level: 73, xp: 640, inputs: { "Embersage": 1, "Stag Antler": 1 } },
  { name: "Magic Potion IV",                level: 77, xp: 680, inputs: { "Embersage": 1, "Green Dragon Heart": 1 } },
];

// Collapsible groups. Gathering is matched by `kind`, the rest by required level
// (min inclusive, max exclusive).
const GROUPS = [
  { kind: "gather", label: "Gathering" },
  { min: 1,  max: 21, label: "Potions lvl 1-21 (Tier I)" },
  { min: 21, max: 41, label: "Potions lvl 21-41 (Tier II)" },
  { min: 41, max: 61, label: "Potions lvl 41-61 (Tier III)" },
  { min: 61, max: 81, label: "Potions lvl 61-81 (Tier IV)" },
];

// Attach recipe once; ITEMS indexes stay stable
const ITEMS = BASE_ITEMS.map((it) => ({
  ...it,
  mats: it.inputs,
}));
const ITEM_BY_NAME = Object.fromEntries(ITEMS.map((it) => [it.name, it]));

// ---------- Materials calculation ----------

// Expand `matName` x `qty`. Intermediates the plan already produces (in `produced`)
// are consumed first; only the shortfall expands into raw materials.
// Here the only intermediate is Red Mushroom (gathered, no sub-recipe), so it is
// always treated as a raw material, but the structure matches the crafting module
// and will work if you later add potion-in-potion recipes.
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
let activeType = "health";
let lastLevel = null;

// Ratios (crafts per round) the user has typed, keyed by item index.
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

// Build the group list for the active potion type
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
        <span class="ore-name">${item.name}</span>
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

  // Open the first group by default
  const first = q(".group");
  if (first) first.open = true;

  applyFilter();
  applyLevelHint(lastLevel);

  // New tab = fresh (empty) selection, so refresh counters and the ratio panel
  onSelectionChange();
}

function setActiveType(type) {
  if (type === activeType) return;
  activeType = type;

  qa(".potionTab").forEach((btn) => {
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

// Each selected item has a ratio r (potions per round). One round yields
// sum(r * xpEach) XP. R = smallest whole number of rounds that reaches the target.
function ratioPlanHtml(selected, xpNeeded, currentLevel, log, title) {
  const ratios = selected.map(({ i }) => {
    const el = q(`.ratioInput[data-item="${i}"]`);
    const r = Math.floor(parseFloat(el?.value));
    return Number.isFinite(r) && r > 0 ? r : 0;
  });

  const xpPerRound = selected.reduce(
    (s, { item }, n) => s + ratios[n] * xpWithBonus(item.xp, log.bonus), 0);

  if (xpPerRound <= 0) {
    return `<p class="error" role="alert">Set at least one item to 1 or more per round.</p>`;
  }

  const rounds = Math.ceil(xpNeeded / xpPerRound);
  const planItems = [];
  let totalCrafts = 0;

  let html = `
    <h3>Combined plan (${title})</h3>
    <p class="note">${fmt(rounds)} round${rounds === 1 ? "" : "s"} of the ratio below.</p>
    <table>
      <tr><th>Item</th><th>Per round</th><th>XP each</th><th>Made needed</th><th>XP from item</th><th>Usable?</th></tr>`;

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
      <tr><td colspan="3"><strong>Total made</strong></td>
      <td><strong>${fmt(totalCrafts)}</strong></td><td></td><td></td></tr>
    </table>`;

  html += matsTable(planRawMats(planItems), "Materials needed (combined plan)");
  return html;
}

function singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title) {
  let html = `
    <h3>If you make only one item (${title})</h3>
    <table>
      <tr><th>Item</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ bonus</th><th>Made needed</th><th>Usable?</th></tr>`;

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

export const alchemy = {
  id: "alchemy",
  name: "Alchemy",
  icon: "⚗️",
  active: true,
  taskTitle: "Choose your potions",

    renderTask(container) {
    root = container;
    activeType = "health"; // default tab each time the panel is built
    savedRatios.clear();

    root.innerHTML = `
      <div class="craft-tabs" role="tablist">
        ${POTION_TYPES.map((t) => `
          <button type="button" role="tab"
            class="potionTab craftTab ${t.id === activeType ? "active" : ""}"
            data-type="${t.id}"
            aria-selected="${t.id === activeType}">${t.label}</button>`).join("")}
      </div>
      <div class="ore-actions">
        <input type="search" class="itemFilter" aria-label="Filter potions"
               placeholder="Filter potions (e.g. strength, mana, anti-venom)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
        <span class="selectedCount">0 selected</span>
      </div>
      <div class="groups"></div>
      <div class="mixSection" hidden>
        <h3>Potions per round</h3>
        <p class="note">Set how many of each potion to make per round, e.g. 3 Health
          for every 1 of everything else. Leave everything at 1 for equal amounts.</p>
        <div class="mixInputs"></div>
        <button type="button" class="resetRatiosBtn">Reset all to 1</button>
      </div>`;

    qa(".potionTab").forEach((btn) =>
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
      return `<p class="note">Select at least one potion to see how many you need.</p>`;
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
      <p class="note">Counts round up, so totals can overshoot your target by up
      to one round's worth of XP. Red Mushroom is listed as a raw material; if you
      also plan to gather it (it's in the Health tab), that is XP on top of this
      plan and isn't subtracted from the materials needed.</p>`;

    return html;
  },
};


    
