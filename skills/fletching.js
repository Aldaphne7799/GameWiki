import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

function iconImg(icon) {
  return `<img class="item-icon" src="${ICON_BASE}${icon}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />`;
}

/* ============ DATA ============ */

// Materials (name + icon). Keys are used in recipe inputs below.
const MAT = {
  feather:        { name: "Feather",          icon: "feather" },
  bowstring:      { name: "Bowstring",        icon: "bowstring" },

  birch_log:      { name: "Birch Log",        icon: "birch_log" },
  oak_log:        { name: "Oak Log",          icon: "oak_log" },
  willow_log:     { name: "Willow Log",       icon: "willow_log" },
  mirkwood_log:   { name: "Mirkwood Log",     icon: "swampwood_log" },
  maple_log:      { name: "Maple Log",        icon: "maple_log" },
  pine_log:       { name: "Pine Log",         icon: "pine_log" },
  moonwood_log:   { name: "Moonwood Log",     icon: "moonwood_log" },

  birch_shaft:    { name: "Birch Arrow Shaft",    icon: "birch_arrow_shaft" },
  oak_shaft:      { name: "Oak Arrow Shaft",      icon: "oak_arrow_shaft" },
  willow_shaft:   { name: "Willow Arrow Shaft",   icon: "willow_arrow_shaft" },
  mirkwood_shaft: { name: "Mirkwood Arrow Shaft", icon: "swampwood_arrow_shaft" },
  maple_shaft:    { name: "Maple Arrow Shaft",    icon: "maple_arrow_shaft" },
  pine_shaft:     { name: "Pine Arrow Shaft",     icon: "pine_arrow_shaft" },
  moonwood_shaft: { name: "Moonwood Arrow Shaft", icon: "moonwood_arrow_shaft" },

  bronze_head:    { name: "Bronze Arrowhead",  icon: "bronze_arrowhead" },
  iron_head:      { name: "Iron Arrowhead",    icon: "iron_arrowhead" },
  steel_head:     { name: "Steel Arrowhead",   icon: "steel_arrowhead" },
  mithril_head:   { name: "Mithril Arrowhead", icon: "mithril_arrowhead" },
  ebony_head:     { name: "Ebony Arrowhead",   icon: "ebony_arrowhead" },
  verdite_head:   { name: "Verdite Arrowhead", icon: "verdite_arrowhead" },
  tyrian_head:    { name: "Tyrian Arrowhead",  icon: "tyrian_arrowhead" },

  birch_unstrung:    { name: "Unstrung Birch Bow",    icon: "unstrung_birch_bow" },
  oak_unstrung:      { name: "Unstrung Oak Bow",      icon: "unstrung_oak_bow" },
  willow_unstrung:   { name: "Unstrung Willow Bow",   icon: "unstrung_willow_bow" },
  mirkwood_unstrung: { name: "Unstrung Mirkwood Bow", icon: "unstrung_swampwood_bow" },
  maple_unstrung:    { name: "Unstrung Maple Bow",    icon: "unstrung_maple_bow" },
  pine_unstrung:     { name: "Unstrung Pine Bow",     icon: "unstrung_pine_bow" },
  moonwood_unstrung: { name: "Unstrung Moonwood Bow", icon: "unstrung_moonwood_bow" },

  birch_stock:    { name: "Birch Crossbow Stock",    icon: "birch_crossbow_stock" },
  oak_stock:      { name: "Oak Crossbow Stock",      icon: "oak_crossbow_stock" },
  willow_stock:   { name: "Willow Crossbow Stock",   icon: "willow_crossbow_stock" },
  mirkwood_stock: { name: "Mirkwood Crossbow Stock", icon: "swampwood_crossbow_stock" },
  maple_stock:    { name: "Maple Crossbow Stock",    icon: "maple_crossbow_stock" },
  pine_stock:     { name: "Pine Crossbow Stock",     icon: "pine_crossbow_stock" },
  moonwood_stock: { name: "Moonwood Crossbow Stock", icon: "moonwood_crossbow_stock" },

  bronze_prod:    { name: "Bronze Crossbow Prod",  icon: "bronze_crossbow_prod" },
  iron_prod:      { name: "Iron Crossbow Prod",    icon: "iron_crossbow_prod" },
  steel_prod:     { name: "Steel Crossbow Prod",   icon: "steel_crossbow_prod" },
  mithril_prod:   { name: "Mithril Crossbow Prod", icon: "mithril_crossbow_prod" },
  ebony_prod:     { name: "Ebony Crossbow Prod",   icon: "ebony_crossbow_prod" },
  verdite_prod:   { name: "Verdite Crossbow Prod", icon: "verdite_crossbow_prod" },
  tyrian_prod:    { name: "Tyrian Crossbow Prod",  icon: "tyrian_crossbow_prod" },
};

const CATEGORIES = ["Shafts", "Unstrung Bows", "Bows", "Arrows", "Crossbow Stocks", "Crossbows"];

// xp = XP per craft. makes = items produced per craft. inputs = [materialKey, qty] per craft.
const RECIPES = [
  // Shafts (1 log -> 20 shafts)
  { name: "Birch Arrow Shaft",    icon: "birch_arrow_shaft",     cat: "Shafts", level: 1,  xp: 10,    makes: 20, inputs: [["birch_log", 1]] },
  { name: "Oak Arrow Shaft",      icon: "oak_arrow_shaft",       cat: "Shafts", level: 10, xp: 13.75, makes: 20, inputs: [["oak_log", 1]] },
  { name: "Willow Arrow Shaft",   icon: "willow_arrow_shaft",    cat: "Shafts", level: 20, xp: 19,    makes: 20, inputs: [["willow_log", 1]] },
  { name: "Mirkwood Arrow Shaft", icon: "swampwood_arrow_shaft", cat: "Shafts", level: 30, xp: 24.25, makes: 20, inputs: [["mirkwood_log", 1]] },
  { name: "Maple Arrow Shaft",    icon: "maple_arrow_shaft",     cat: "Shafts", level: 40, xp: 29.25, makes: 20, inputs: [["maple_log", 1]] },
  { name: "Pine Arrow Shaft",     icon: "pine_arrow_shaft",      cat: "Shafts", level: 60, xp: 35,    makes: 20, inputs: [["pine_log", 1]] },
  { name: "Moonwood Arrow Shaft", icon: "moonwood_arrow_shaft",  cat: "Shafts", level: 80, xp: 40,    makes: 20, inputs: [["moonwood_log", 1]] },

  // Unstrung bows (1 log)
  { name: "Unstrung Birch Bow",    icon: "unstrung_birch_bow",     cat: "Unstrung Bows", level: 1,  xp: 20,  makes: 1, inputs: [["birch_log", 1]] },
  { name: "Unstrung Oak Bow",      icon: "unstrung_oak_bow",       cat: "Unstrung Bows", level: 10, xp: 42,  makes: 1, inputs: [["oak_log", 1]] },
  { name: "Unstrung Willow Bow",   icon: "unstrung_willow_bow",    cat: "Unstrung Bows", level: 20, xp: 75,  makes: 1, inputs: [["willow_log", 1]] },
  { name: "Unstrung Mirkwood Bow", icon: "unstrung_swampwood_bow", cat: "Unstrung Bows", level: 30, xp: 112, makes: 1, inputs: [["mirkwood_log", 1]] },
  { name: "Unstrung Maple Bow",    icon: "unstrung_maple_bow",     cat: "Unstrung Bows", level: 40, xp: 151, makes: 1, inputs: [["maple_log", 1]] },
  { name: "Unstrung Pine Bow",     icon: "unstrung_pine_bow",      cat: "Unstrung Bows", level: 60, xp: 240, makes: 1, inputs: [["pine_log", 1]] },
  { name: "Unstrung Moonwood Bow", icon: "unstrung_moonwood_bow",  cat: "Unstrung Bows", level: 80, xp: 320, makes: 1, inputs: [["moonwood_log", 1]] },

  // Bows (unstrung bow + bowstring)
  { name: "Birch Bow",    icon: "birch_bow",     cat: "Bows", level: 1,  xp: 10,   makes: 1, inputs: [["birch_unstrung", 1], ["bowstring", 1]] },
  { name: "Oak Bow",      icon: "oak_bow",       cat: "Bows", level: 10, xp: 21,   makes: 1, inputs: [["oak_unstrung", 1], ["bowstring", 1]] },
  { name: "Willow Bow",   icon: "willow_bow",    cat: "Bows", level: 20, xp: 37.5, makes: 1, inputs: [["willow_unstrung", 1], ["bowstring", 1]] },
  { name: "Mirkwood Bow", icon: "swampwood_bow", cat: "Bows", level: 30, xp: 56,   makes: 1, inputs: [["mirkwood_unstrung", 1], ["bowstring", 1]] },
  { name: "Maple Bow",    icon: "maple_bow",     cat: "Bows", level: 40, xp: 75.5, makes: 1, inputs: [["maple_unstrung", 1], ["bowstring", 1]] },
  { name: "Pine Bow",     icon: "pine_bow",      cat: "Bows", level: 60, xp: 120,  makes: 1, inputs: [["pine_unstrung", 1], ["bowstring", 1]] },
  { name: "Moonwood Bow", icon: "moonwood_bow",  cat: "Bows", level: 80, xp: 160,  makes: 1, inputs: [["moonwood_unstrung", 1], ["bowstring", 1]] },

  // Arrows (20 shafts + 20 feathers + 20 arrowheads -> 20 arrows)
  { name: "Bronze Arrow",  icon: "bronze_arrow",  cat: "Arrows", level: 1,  xp: 40,  makes: 20, inputs: [["birch_shaft", 20],    ["feather", 20], ["bronze_head", 20]] },
  { name: "Iron Arrow",    icon: "iron_arrow",    cat: "Arrows", level: 10, xp: 84,  makes: 20, inputs: [["oak_shaft", 20],      ["feather", 20], ["iron_head", 20]] },
  { name: "Steel Arrow",   icon: "steel_arrow",   cat: "Arrows", level: 20, xp: 117, makes: 20, inputs: [["willow_shaft", 20],   ["feather", 20], ["steel_head", 20]] },
  { name: "Mithril Arrow", icon: "mithril_arrow", cat: "Arrows", level: 30, xp: 187, makes: 20, inputs: [["mirkwood_shaft", 20], ["feather", 20], ["mithril_head", 20]] },
  { name: "Ebony Arrow",   icon: "ebony_arrow",   cat: "Arrows", level: 40, xp: 226, makes: 20, inputs: [["maple_shaft", 20],    ["feather", 20], ["ebony_head", 20]] },
  { name: "Verdite Arrow", icon: "verdite_arrow", cat: "Arrows", level: 60, xp: 315, makes: 20, inputs: [["pine_shaft", 20],     ["feather", 20], ["verdite_head", 20]] },
  { name: "Tyrian Arrow",  icon: "tyrian_arrow",  cat: "Arrows", level: 80, xp: 395, makes: 20, inputs: [["moonwood_shaft", 20], ["feather", 20], ["tyrian_head", 20]] },

  // Crossbow stocks (2 logs)
  { name: "Birch Crossbow Stock",    icon: "birch_crossbow_stock",     cat: "Crossbow Stocks", level: 1,  xp: 40,  makes: 1, inputs: [["birch_log", 2]] },
  { name: "Oak Crossbow Stock",      icon: "oak_crossbow_stock",       cat: "Crossbow Stocks", level: 10, xp: 84,  makes: 1, inputs: [["oak_log", 2]] },
  { name: "Willow Crossbow Stock",   icon: "willow_crossbow_stock",    cat: "Crossbow Stocks", level: 20, xp: 150, makes: 1, inputs: [["willow_log", 2]] },
  { name: "Mirkwood Crossbow Stock", icon: "swampwood_crossbow_stock", cat: "Crossbow Stocks", level: 30, xp: 224, makes: 1, inputs: [["mirkwood_log", 2]] },
  { name: "Maple Crossbow Stock",    icon: "maple_crossbow_stock",     cat: "Crossbow Stocks", level: 40, xp: 302, makes: 1, inputs: [["maple_log", 2]] },
  { name: "Pine Crossbow Stock",     icon: "pine_crossbow_stock",      cat: "Crossbow Stocks", level: 60, xp: 480, makes: 1, inputs: [["pine_log", 2]] },
  { name: "Moonwood Crossbow Stock", icon: "moonwood_crossbow_stock",  cat: "Crossbow Stocks", level: 80, xp: 640, makes: 1, inputs: [["moonwood_log", 2]] },

  // Crossbows (stock + prod + bowstring)
  { name: "Bronze Crossbow",  icon: "bronze_crossbow",  cat: "Crossbows", level: 1,  xp: 20,  makes: 1, inputs: [["birch_stock", 1],    ["bronze_prod", 1],  ["bowstring", 1]] },
  { name: "Iron Crossbow",    icon: "iron_crossbow",    cat: "Crossbows", level: 10, xp: 42,  makes: 1, inputs: [["oak_stock", 1],      ["iron_prod", 1],    ["bowstring", 1]] },
  { name: "Steel Crossbow",   icon: "steel_crossbow",   cat: "Crossbows", level: 20, xp: 75,  makes: 1, inputs: [["willow_stock", 1],   ["steel_prod", 1],   ["bowstring", 1]] },
  { name: "Mithril Crossbow", icon: "mithril_crossbow", cat: "Crossbows", level: 30, xp: 112, makes: 1, inputs: [["mirkwood_stock", 1], ["mithril_prod", 1], ["bowstring", 1]] },
  { name: "Ebony Crossbow",   icon: "ebony_crossbow",   cat: "Crossbows", level: 40, xp: 151, makes: 1, inputs: [["maple_stock", 1],    ["ebony_prod", 1],   ["bowstring", 1]] },
  { name: "Verdite Crossbow", icon: "verdite_crossbow", cat: "Crossbows", level: 60, xp: 240, makes: 1, inputs: [["pine_stock", 1],     ["verdite_prod", 1], ["bowstring", 1]] },
  { name: "Tyrian Crossbow",  icon: "tyrian_crossbow",  cat: "Crossbows", level: 80, xp: 320, makes: 1, inputs: [["moonwood_stock", 1], ["tyrian_prod", 1], ["bowstring", 1]] },
];

/* ============ STATE ============ */

let root = null;
let lastLevel = 1;
const state = { category: "Arrows", selected: new Set() }; // selected = recipe indexes

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedIndexes = () => [...state.selected].sort((a, b) => a - b);
const getMixMode = () => q('input[name="fletchMixMode"]:checked')?.value || "split";
const usable = (r, level) => (level >= r.level ? "✅" : "❌ Lv " + r.level);

/* ============ MATERIALS ============ */

// Adds the materials for `crafts` crafts of recipe `r` into `acc` (a { key: qty } map).
function addMaterials(acc, r, crafts) {
  for (const [key, qty] of r.inputs) acc[key] = (acc[key] || 0) + qty * crafts;
  return acc;
}

function materialsList(acc) {
  const entries = Object.entries(acc).filter(([, n]) => n > 0);
  if (!entries.length) return "–";
  return entries
    .map(([key, n]) => `${iconImg(MAT[key].icon)} ${fmt(n)} × ${MAT[key].name}`)
    .join("<br>");
}

/* ============ UI ============ */

function renderRecipeGrid() {
  const grid = q(".recipe-grid");
  grid.innerHTML = "";
  RECIPES.forEach((r, i) => {
    if (r.cat !== state.category) return;
    const label = document.createElement("label");
    label.className = "ore-item";
    label.classList.toggle("above-level", lastLevel < r.level);
    const per = r.makes > 1 ? ` (makes ${r.makes})` : "";
    label.innerHTML = `
      <input type="checkbox" class="recipeCheck" value="${i}" ${state.selected.has(i) ? "checked" : ""} />
      <span class="ore-name">${iconImg(r.icon)} ${r.name}</span>
      <span class="ore-meta">Req. Lv ${r.level} · ${r.xp} XP per craft${per}</span>`;
    grid.appendChild(label);
  });

  qa(".recipeCheck").forEach((c) =>
    c.addEventListener("change", () => {
      const i = parseInt(c.value, 10);
      c.checked ? state.selected.add(i) : state.selected.delete(i);
      rebuildMixInputs();
    })
  );
}

function updateMixTotal() {
  const el = q(".mixTotal");
  const sum = qa(".mixInput").reduce((s, x) => s + (parseFloat(x.value) || 0), 0);
  const ok = Math.abs(sum - 100) <= 0.05;
  el.textContent = `Total: ${sum.toFixed(1)}%` + (ok ? " ✅" : " (should be 100%)");
  el.classList.toggle("error", !ok);
}

function applyMixMode() {
  const isSplit = getMixMode() === "split";
  q(".mixInputs").hidden = !isSplit;
  q(".mixTotal").hidden = !isSplit;
  q(".mixHint").textContent = isSplit
    ? "Set what share of the XP each recipe should provide."
    : "Makes the same number of crafts of each selected recipe.";
}

function rebuildMixInputs() {
  const section = q(".mixSection");
  const inputs = q(".mixInputs");
  const idx = selectedIndexes();
  inputs.innerHTML = "";

  q(".selectedCount").textContent = idx.length
    ? `${idx.length} recipe${idx.length > 1 ? "s" : ""} selected (across all categories)`
    : "";

  if (idx.length < 2) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  const even = Math.round((100 / idx.length) * 10) / 10;
  idx.forEach((i, n) => {
    const value = n === idx.length - 1
      ? Math.round((100 - even * (idx.length - 1)) * 10) / 10
      : even;
    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `<span>${iconImg(RECIPES[i].icon)} ${RECIPES[i].name}</span>
      <span><input type="number" class="mixInput" data-recipe="${i}" min="0" max="100" step="0.1" value="${value}" /> %</span>`;
    inputs.appendChild(row);
  });

  qa(".mixInput").forEach((el) => el.addEventListener("input", updateMixTotal));
  updateMixTotal();
  applyMixMode();
}

/* ============ PLANS ============ */

function renderSplitPlan({ selected, xpNeeded, currentLevel, bonus, title }) {
  const shares = selected.map(({ i }) => parseFloat(q(`.mixInput[data-recipe="${i}"]`)?.value) || 0);
  const shareSum = shares.reduce((a, b) => a + b, 0);
  if (Math.abs(shareSum - 100) > 0.05) {
    return `<p class="error">The XP split must add up to 100% (currently ${shareSum.toFixed(1)}%).</p>`;
  }

  const mats = {};
  let totalCrafts = 0;
  let html = `
    <h3>Combined plan – XP split (${title})</h3>
    <table>
      <tr><th>Recipe</th><th>Share</th><th>XP from recipe</th><th>XP per craft</th><th>Crafts</th><th>Items made</th><th>Usable?</th></tr>`;

  selected.forEach(({ r }, n) => {
    const xpEach = xpWithBonus(r.xp, bonus);
    const xpShare = xpNeeded * (shares[n] / 100);
    const crafts = shares[n] > 0 ? Math.ceil(xpShare / xpEach) : 0;
    totalCrafts += crafts;
    addMaterials(mats, r, crafts);
    html += `
      <tr>
        <td>${iconImg(r.icon)} ${r.name}</td>
        <td>${shares[n]}%</td>
        <td>${fmt(xpShare)}</td>
        <td>${fmt(xpEach)}</td>
        <td>${fmt(crafts)}</td>
        <td>${fmt(crafts * r.makes)}</td>
        <td>${usable(r, currentLevel)}</td>
      </tr>`;
  });

  html += `
      <tr><td colspan="4"><strong>Total crafts</strong></td><td><strong>${fmt(totalCrafts)}</strong></td><td colspan="2"></td></tr>
    </table>
    <h3>Materials for this plan</h3>
    <p>${materialsList(mats)}</p>`;
  return html;
}

function renderEqualPlan({ selected, xpNeeded, currentLevel, bonus, title }) {
  const xpEachList = selected.map(({ r }) => xpWithBonus(r.xp, bonus));
  const xpPerSet = xpEachList.reduce((a, b) => a + b, 0);
  const countEach = xpPerSet > 0 ? Math.ceil(xpNeeded / xpPerSet) : 0;

  const mats = {};
  let html = `
    <h3>Combined plan – equal amounts (${title})</h3>
    <p class="note">Do <strong>${fmt(countEach)}</strong> crafts of each recipe.</p>
    <table>
      <tr><th>Recipe</th><th>Crafts</th><th>Items made</th><th>XP per craft</th><th>XP from recipe</th><th>Usable?</th></tr>`;

  selected.forEach(({ r }, n) => {
    addMaterials(mats, r, countEach);
    html += `
      <tr>
        <td>${iconImg(r.icon)} ${r.name}</td>
        <td>${fmt(countEach)}</td>
        <td>${fmt(countEach * r.makes)}</td>
        <td>${fmt(xpEachList[n])}</td>
        <td>${fmt(countEach * xpEachList[n])}</td>
        <td>${usable(r, currentLevel)}</td>
      </tr>`;
  });

  html += `
      <tr>
        <td><strong>Total</strong></td>
        <td><strong>${fmt(countEach * selected.length)}</strong></td>
        <td colspan="2"></td>
        <td><strong>${fmt(countEach * xpPerSet)}</strong></td>
        <td></td>
      </tr>
    </table>
    <h3>Materials for this plan</h3>
    <p>${materialsList(mats)}</p>`;
  return html;
}

/* ============ SKILL DEFINITION ============ */

export const fletching = {
  id: "fletching",
  name: "Fletching",
  icon: "https://aldermere.online/assets/wiki/skills/fletching.webp",
  active: true,
  taskTitle: "Choose what to fletch",

  renderTask(container) {
    root = container;
    root.innerHTML = `
      <div class="ore-actions">
        <label>Category:
          <select class="catSelect">
            ${CATEGORIES.map((c) => `<option value="${c}" ${c === state.category ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </label>
        <button type="button" class="selectAllBtn">Select all in category</button>
        <button type="button" class="clearBtn">Clear all</button>
      </div>
      <div class="ore-grid recipe-grid"></div>
      <p class="note selectedCount"></p>
      <div class="mixSection" hidden>
        <h3>Mix mode</h3>
        <div class="mixModes">
          <label><input type="radio" name="fletchMixMode" value="split" checked /> Equal XP split</label>
          <label><input type="radio" name="fletchMixMode" value="equal" /> Equal amounts</label>
        </div>
        <p class="note mixHint"></p>
        <div class="mixInputs"></div>
        <div class="mixTotal"></div>
      </div>
      <p class="note">XP is per craft. Shafts and arrows make 20 items per craft.
        You can pick recipes from several categories; switching category keeps your picks.</p>`;

    q(".catSelect").addEventListener("change", (e) => {
      state.category = e.target.value;
      renderRecipeGrid();
    });
    q(".selectAllBtn").addEventListener("click", () => {
      RECIPES.forEach((r, i) => r.cat === state.category && state.selected.add(i));
      renderRecipeGrid();
      rebuildMixInputs();
    });
    q(".clearBtn").addEventListener("click", () => {
      state.selected.clear();
      renderRecipeGrid();
      rebuildMixInputs();
    });
    qa('input[name="fletchMixMode"]').forEach((r) => r.addEventListener("change", applyMixMode));

    renderRecipeGrid();
    rebuildMixInputs();
    applyMixMode();
  },

  // Visual hint (not a lock) for recipes above the current level
  onLevelChange(level) {
    lastLevel = level;
    if (!root) return;
    qa(".recipeCheck").forEach((c) => {
      const r = RECIPES[parseInt(c.value, 10)];
      c.closest(".ore-item").classList.toggle("above-level", level < r.level);
    });
  },

  calculate({ xpNeeded, currentLevel, log }) {
    const selected = selectedIndexes().map((i) => ({ r: RECIPES[i], i }));
    if (selected.length === 0) {
      return `<p class="note">Select at least one recipe to see how many crafts you need.</p>`;
    }

    const bonus = log?.bonus ?? 0;
    const title = `${log?.name ?? "No bonus"}${bonus ? ` +${bonus}%` : ""}`;
    const ctx = { selected, xpNeeded, currentLevel, bonus, title };
    let html = "";

    if (selected.length > 1) {
      html += getMixMode() === "equal" ? renderEqualPlan(ctx) : renderSplitPlan(ctx);
    }

    html += `
      <h3>If you make only one recipe (${title})</h3>
      <table>
        <tr><th>Recipe</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ bonus</th><th>Crafts</th><th>Items made</th><th>Materials</th><th>Usable?</th></tr>`;

    selected.forEach(({ r }) => {
      const xpEach = xpWithBonus(r.xp, bonus);
      const crafts = Math.ceil(xpNeeded / xpEach);
      html += `
        <tr>
          <td>${iconImg(r.icon)} ${r.name}</td>
          <td>${r.level}</td>
          <td>${fmt(r.xp)}</td>
          <td>${fmt(xpEach)}</td>
          <td>${fmt(crafts)}</td>
          <td>${fmt(crafts * r.makes)}</td>
          <td>${materialsList(addMaterials({}, r, crafts))}</td>
          <td>${usable(r, currentLevel)}</td>
        </tr>`;
    });

    html += `</table>
      <p class="note">Craft counts round up, so totals may overshoot your target by a few XP.
        Bowstrings, arrowheads and crossbow prods are made with other skills.</p>`;
    return html;
  },
};
