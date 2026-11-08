import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

// Names, levels and XP are transcribed directly from the screenshot.
// Items prefixed "20 x" are stackable batches (e.g. 20 arrow shafts): the XP shown
// is for the whole batch, so counts are "crafts" (batches), not single items.
//
// Recipes are generated per tier by recipeFor(). A material whose name matches
// another entry in ITEMS (stock, unstrung bow, shaft batch) is an intermediate:
// the plan's own output is consumed first, and only the shortfall expands to raws.
// Crossbow Prods, Arrowtips, Feathers and Bowstrings are not in ITEMS, so they
// are treated as raw materials you supply yourself.

// Wood tier pairs with the metal tier of the same level.
const TIERS = {
  1:  { wood: "Birch",     metal: "Bronze" },
  11: { wood: "Oak",       metal: "Iron" },
  21: { wood: "Willow",    metal: "Steel" },
  31: { wood: "Swampwood", metal: "Mithril" },
  41: { wood: "Maple",     metal: "Ebony" },
  61: { wood: "Pine",      metal: "Verdite" },
  81: { wood: "Moonwood",  metal: "Tyrian" },
};

const BASE_ITEMS = [
  // Level 1-11
  { name: "20 x Birch Arrow Shaft",       level: 1,  xp: 10   },
  { name: "Birch Bow",                    level: 1,  xp: 10   },
  { name: "Bronze Crossbow",              level: 1,  xp: 20   },
  { name: "Unstrung Birch Bow",           level: 1,  xp: 20   },
  { name: "20 x Bronze Arrow",            level: 1,  xp: 40   },
  { name: "Birch Crossbow Stock",         level: 1,  xp: 40   },

  // Level 11-21
  { name: "20 x Oak Arrow Shaft",         level: 11, xp: 15   },
  { name: "Oak Bow",                      level: 11, xp: 23   },
  { name: "Iron Crossbow",                level: 11, xp: 46   },
  { name: "Unstrung Oak Bow",             level: 11, xp: 46   },
  { name: "20 x Iron Arrow",              level: 11, xp: 92   },
  { name: "Oak Crossbow Stock",           level: 11, xp: 92   },
  
  // Level 21-31
  { name: "20 x Willow Arrow Shaft",      level: 21, xp: 20   },
  { name: "Willow Bow",                   level: 21, xp: 39.5 },
  { name: "Steel Crossbow",               level: 21, xp: 79   },
  { name: "Unstrung Willow Bow",          level: 21, xp: 79   },
  { name: "20 x Steel Arrow",             level: 21, xp: 125  },
  { name: "Willow Crossbow Stock",        level: 21, xp: 158  },

  // Level 31-41
  { name: "20 x Swampwood Arrow Shaft",   level: 31, xp: 25   },
  { name: "Swampwood Bow",                level: 31, xp: 58   },
  { name: "Mithril Crossbow",             level: 31, xp: 116  },
  { name: "Unstrung Swampwood Bow",       level: 31, xp: 116  },
  { name: "20 x Mithril Arrow",           level: 31, xp: 195  },
  { name: "Swampwood Crossbow Stock",     level: 31, xp: 232  },

  // Level 41-61
  { name: "20 x Maple Arrow Shaft",       level: 41, xp: 30   },
  { name: "Maple Bow",                    level: 41, xp: 77.5 },
  { name: "Ebony Crossbow",               level: 41, xp: 155  },
  { name: "Unstrung Maple Bow",           level: 41, xp: 155  },
  { name: "20 x Ebony Arrow",             level: 41, xp: 234  },
  { name: "Maple Crossbow Stock",         level: 41, xp: 310  },

  // Level 61-81
  { name: "20 x Pine Arrow Shaft",        level: 61, xp: 35   },
  { name: "Pine Bow",                     level: 61, xp: 120  },
  { name: "Verdite Crossbow",             level: 61, xp: 240  },
  { name: "Unstrung Pine Bow",            level: 61, xp: 240  },
  { name: "20 x Verdite Arrow",           level: 61, xp: 319  },
  { name: "Pine Crossbow Stock",          level: 61, xp: 480  },

  // Level 81-101
  { name: "20 x Moonwood Arrow Shaft",    level: 81, xp: 40   },
  { name: "Moonwood Bow",                 level: 81, xp: 160  },
  { name: "Tyrian Crossbow",              level: 81, xp: 320  },
  { name: "Unstrung Moonwood Bow",        level: 81, xp: 320  },
  { name: "20 x Tyrian Arrow",            level: 81, xp: 399  },
  { name: "Moonwood Crossbow Stock",      level: 81, xp: 640  },
];

// Direct ingredients PER CRAFT, built from the tier + item name.
function recipeFor(item) {
  const { wood, metal } = TIERS[item.level];
  const n = item.name;

  if (n.endsWith("Arrow Shaft"))    return { [`${wood} Logs`]: 1 };   // 1 log per batch of 20
  if (n.startsWith("Unstrung"))     return { [`${wood} Logs`]: 1 };   // 1 log
  if (n.endsWith("Crossbow Stock")) return { [`${wood} Logs`]: 2 };   // 2 logs

  // Crossbow = stock + prod + string
  if (n.endsWith("Crossbow")) {
    return {
      [`${wood} Crossbow Stock`]: 1,
      [`${metal} Crossbow Prod`]: 1,
      "Bowstring": 1,
    };
  }

  // Arrow batch = 1 batch of shafts + 20 tips + 20 feathers
  if (n.endsWith("Arrow")) {
    return {
      [`20 x ${wood} Arrow Shaft`]: 1,
      [`${metal} Arrowtips`]: 20,
      "Feather": 20,
    };
  }

  // Strung bow = unstrung bow + string
  if (n.endsWith("Bow")) {
    return { [`Unstrung ${wood} Bow`]: 1, "Bowstring": 1 };
  }

  return {};
}

const ITEMS = BASE_ITEMS.map((it) => ({ ...it, mats: recipeFor(it) }));
const ITEM_BY_NAME = Object.fromEntries(ITEMS.map((it) => [it.name, it]));

// ---------- Materials calculation ----------

// Expand `matName` x `qty`. Intermediates the plan already produces (in `produced`)
// are consumed first; only the shortfall is expanded into raw materials.
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

// `planItems` = [{ item, count }] for the whole plan. Returns raw material totals.
//
// Why this doesn't double count: every planned item's own ingredients are expanded
// exactly once here (the loop below). When a consumer needs an intermediate that is
// also in the plan, addRawMats takes it from `produced` instead of expanding it again.
// Only the shortfall (intermediates you did NOT plan enough of) expands to raws.
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

// Module-level state for the single rendered instance
let root = null;
let lastLevel = null;

// Percentages the user has typed, keyed by item index. Preserved across rebuilds
// so ticking another item doesn't wipe a tuned split.
const savedShares = new Map();

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedIndexes = () =>
  qa(".itemCheck:checked").map((c) => parseInt(c.value, 10));

// "xp" = split by XP percentage, "equal" = same craft count for every item (game style)
const splitMode = () => q('input[name="splitMode"]:checked')?.value ?? "xp";

function updateSelectedCount() {
  const el = q(".selectedCount");
  if (el) el.textContent = `${selectedIndexes().length} selected`;
}

function updateMixTotal() {
  const mixTotal = q(".mixTotal");
  const sum = qa(".mixInput").reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const ok = Math.abs(sum - 100) <= 0.05;
  mixTotal.textContent = `Total: ${sum.toFixed(1)}%` + (ok ? " ✅" : " (should be 100%)");
  mixTotal.classList.toggle("error", !ok);
}

// Even split: 100 / number of selected items. If the user has already typed values for
// every currently selected item and they still add up to 100, keep them instead.
function rebuildMixInputs() {
  updateSelectedCount();

  const mixSection = q(".mixSection");
  const mixInputs = q(".mixInputs");
  const idx = selectedIndexes();

  // Remember whatever is currently typed before wiping the rows
  qa(".mixInput").forEach((el) => {
    savedShares.set(parseInt(el.dataset.item, 10), parseFloat(el.value) || 0);
  });

  mixInputs.innerHTML = "";

  // Equal-crafts mode needs no percentages
  if (idx.length < 2 || splitMode() === "equal") {
    mixSection.hidden = true;
    return;
  }
  mixSection.hidden = false;

  const hasAllSaved = idx.every((i) => savedShares.has(i));
  const savedSum = idx.reduce((s, i) => s + (savedShares.get(i) || 0), 0);
  const keepSaved = hasAllSaved && Math.abs(savedSum - 100) <= 0.05;

  // Even split; last row takes the rounding remainder
  const even = Math.round((100 / idx.length) * 10) / 10;

  idx.forEach((i, n) => {
    let value;
    if (keepSaved) {
      value = savedShares.get(i);
    } else {
      value = n === idx.length - 1
        ? Math.round((100 - even * (idx.length - 1)) * 10) / 10
        : even;
    }

    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `<span>${ITEMS[i].name}</span>
      <span><input type="number" class="mixInput" data-item="${i}" min="0" max="100" step="0.1" value="${value}" placeholder="0" /> %</span>`;
    mixInputs.appendChild(row);
  });

  qa(".mixInput").forEach((el) => el.addEventListener("input", updateMixTotal));
  updateMixTotal();
}

// Select all / clear only affect items currently visible (respects the filter box)
function setVisibleItems(state) {
  qa(".item-row").forEach((label) => {
    if (label.hidden) return;
    label.querySelector(".itemCheck").checked = state;
  });
  rebuildMixInputs();
}

function applyFilter() {
  const term = q(".itemFilter").value.trim().toLowerCase();
  qa(".item-row").forEach((label) => {
    const name = ITEMS[parseInt(label.dataset.index, 10)].name.toLowerCase();
    label.hidden = term !== "" && !name.includes(term);
  });
}

function applyLevelHint(level) {
  qa(".item-row").forEach((label) => {
    const item = ITEMS[parseInt(label.dataset.index, 10)];
    label.classList.toggle("above-level", level < item.level);
  });
}

// ---------- Result builders ----------

function usableCell(currentLevel, item) {
  return currentLevel >= item.level ? "✅" : "❌ Lv " + item.level;
}

// Same craft count N for every selected item (matches the in-game combo plan).
// N is the smallest whole number where combined XP reaches the target.
function equalPlanHtml(selected, xpNeeded, currentLevel, log, title) {
  const xpPerRound = selected.reduce(
    (s, { item }) => s + xpWithBonus(item.xp, log.bonus), 0);
  const N = Math.ceil(xpNeeded / xpPerRound);

  const planItems = [];
  let html = `
    <h3>Combined plan (${title}), equal crafts</h3>
    <table>
      <tr><th>Item</th><th>XP each</th><th>Crafts needed</th><th>XP from item</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    planItems.push({ item, count: N });
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(N)}</td>
        <td>${fmt(xpEach * N)}</td>
        <td>${usableCell(currentLevel, item)}</td>
      </tr>`;
  });

  html += `
      <tr><td colspan="2"><strong>Total crafts</strong></td>
      <td><strong>${fmt(N * selected.length)}</strong></td><td></td><td></td></tr>
    </table>`;

  html += matsTable(planRawMats(planItems), "Materials needed (combined plan)");
  return html;
}

// Each item gets a chosen percentage of the XP; craft counts differ per item.
function sharePlanHtml(selected, xpNeeded, currentLevel, log, title) {
  const shares = selected.map(({ i }) => {
    const el = q(`.mixInput[data-item="${i}"]`);
    return parseFloat(el?.value) || 0;
  });
  const shareSum = shares.reduce((a, b) => a + b, 0);

  if (Math.abs(shareSum - 100) > 0.05) {
    return `<p class="error" role="alert">The XP split must add up to 100% (currently ${shareSum.toFixed(1)}%).</p>`;
  }

  let totalItems = 0;
  const planItems = [];

  let html = `
    <h3>Combined plan (${title})</h3>
    <table>
      <tr><th>Item</th><th>Share</th><th>XP from item</th><th>XP each</th><th>Crafts needed</th><th>Usable?</th></tr>`;

  selected.forEach(({ item }, n) => {
    const xpEach = xpWithBonus(item.xp, log.bonus);
    const xpShare = xpNeeded * (shares[n] / 100);
    const count = shares[n] > 0 ? Math.ceil(xpShare / xpEach) : 0;
    totalItems += count;
    planItems.push({ item, count });
    html += `
      <tr>
        <td>${item.name}</td>
        <td>${shares[n]}%</td>
        <td>${fmt(xpShare)}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(count)}</td>
        <td>${usableCell(currentLevel, item)}</td>
      </tr>`;
  });

  html += `
      <tr><td colspan="4"><strong>Total crafts</strong></td><td><strong>${fmt(totalItems)}</strong></td><td></td></tr>
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

export const fletching = {
  id: "fletching",
  name: "Fletching",
  icon: "🏹",
  active: true,
  taskTitle: "Choose your items",

  renderTask(container) {
    root = container;
    savedShares.clear();

    root.innerHTML = `
      <div class="ore-actions">
        <input type="search" class="itemFilter" aria-label="Filter items"
               placeholder="Filter items (e.g. maple, crossbow, arrow)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
        <span class="selectedCount">0 selected</span>
      </div>
      <div class="ore-grid"></div>
      <div class="modeRow">
        <label><input type="radio" name="splitMode" value="xp" checked /> Split by XP %</label>
        <label><input type="radio" name="splitMode" value="equal" /> Equal crafts (like the game)</label>
      </div>
      <div class="mixSection" hidden>
        <h3>XP split</h3>
        <div class="mixInputs"></div>
        <div class="mixTotal"></div>
      </div>`;

    const grid = q(".ore-grid");
    ITEMS.forEach((item, i) => {
      const label = document.createElement("label");
      label.className = "ore-item item-row";
      label.dataset.index = i;
      label.innerHTML = `
        <input type="checkbox" class="itemCheck" value="${i}" />
        <span class="ore-name">${item.name}</span>
        <span class="ore-meta">Req. Lv ${item.level} · ${item.xp} XP</span>`;
      grid.appendChild(label);
    });

    qa(".itemCheck").forEach((c) => c.addEventListener("change", rebuildMixInputs));
    qa('input[name="splitMode"]').forEach((r) => r.addEventListener("change", rebuildMixInputs));
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));

    // Apply the level hint right away if the level is already known
    if (lastLevel !== null) applyLevelHint(lastLevel);
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
      return `<p class="note">Select at least one item in step 3 to see how many you need.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";

    // ----- Combined plan (2+ items) -----
    if (selected.length > 1) {
      html += splitMode() === "equal"
        ? equalPlanHtml(selected, xpNeeded, currentLevel, log, title)
        : sharePlanHtml(selected, xpNeeded, currentLevel, log, title);
    }

    // ----- Single-item breakdown -----
    html += singleBreakdownHtml(selected, xpNeeded, currentLevel, log, title);

    html += `
      <p class="note">Craft counts round up, so totals can overshoot your target by up to
      one craft's worth of XP per item. Items marked "20 x" are batches: one craft
      produces 20 and the XP shown is per batch.</p>`;

    return html;
  },
};
