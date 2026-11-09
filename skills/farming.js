import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ICON_BASE = "https://aldermere.online/assets/wiki/items/";

const HERBS = [
  { id: "wildleaf", name: "Wildleaf", level: 1, plantXp: 10, herbXp: 25 },
  { id: "vervain", name: "Vervain", level: 21, plantXp: 39.5, herbXp: 99 },
  { id: "moonbloom", name: "Moonbloom", level: 41, plantXp: 77.5, herbXp: 195 },
  { id: "embersage", name: "Embersage", level: 61, plantXp: 120, herbXp: 300 },
];

const FIBRES = [
  { id: "hemp", name: "Hemp", level: 11, plantXp: 23, fibreXp: 7 },
  { id: "flax", name: "Flax", level: 21, plantXp: 39.5, fibreXp: 11.75 },
  { id: "stinkreed", name: "Stinkreed", level: 31, plantXp: 58, fibreXp: 17.5 },
  { id: "toetoe", name: "Toetoe", level: 41, plantXp: 77.5, fibreXp: 23.25 },
  { id: "sunthread", name: "Sunthread", level: 61, plantXp: 120, fibreXp: 36 },
];

const LIVESTOCK = [
  { id: "hen", name: "Hen / Rooster", kind: "poultry", level: 1, egg: 15, grow: 10, slaughter: 30 },
  { id: "copperneck", name: "Copperneck Chicken", kind: "poultry", level: 21, egg: 59.25, grow: 39.5, slaughter: 118.5 },
  { id: "goose", name: "Goose / Gander", kind: "poultry", level: 41, egg: 116.25, grow: 77.5, slaughter: 232.5 },
  { id: "stormneck", name: "Stormneck Goose", kind: "poultry", level: 61, egg: 180, grow: 120, slaughter: 360 },

  { id: "sheep", name: "Sheep / Ram", kind: "large", level: 1, wool: 30, milk: 15, grow: 10, slaughter: 30 },
  { id: "merino", name: "Merino Sheep / Ram", kind: "large", level: 81, wool: 480, milk: 240, grow: 160, slaughter: 480 },
  { id: "cow", name: "Cow / Bull", kind: "large", level: 21, milk: 118.5, grow: 39.5, slaughter: 118.5 },
  { id: "blackcow", name: "Black Cow / Bull", kind: "large", level: 41, milk: 232.5, grow: 77.5, slaughter: 232.5 },
  { id: "spottedcow", name: "Spotted Cow / Bull", kind: "large", level: 61, milk: 360, grow: 120, slaughter: 360 },
];

const HERB_YIELDS = [5, 7, 8, 9, 11, 13, 15, 19, 22, 26, 32, 38, 40];
const FIBRE_YIELDS = [45, 63, 72, 81, 99, 117, 135];
const SEED_YIELDS = [27, 27, 27, 27, 36, 36, 36, 36, 45, 45, 45, 45, 54];

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function iconImg(name) {
  return `<img class="item-icon" src="${ICON_BASE}${slug(name)}.webp" alt="" width="24" height="24"
    onerror="this.replaceWith(document.createTextNode('?'))" />`;
}
function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
}
function xp(value, bonus) {
  return xpWithBonus(value, bonus);
}
function herbYield(level, cropLevel) {
  const offset = Math.max(0, Math.floor(level - cropLevel));
  return HERB_YIELDS[Math.min(offset, HERB_YIELDS.length - 1)];
}
function fibreYield(level, cropLevel) {
  const offset = Math.max(0, Math.floor(level - cropLevel));
  return FIBRE_YIELDS[Math.min(offset, FIBRE_YIELDS.length - 1)];
}
function seedYield(level, cropLevel) {
  const offset = Math.max(0, Math.floor(level - cropLevel));
  return SEED_YIELDS[Math.min(offset, SEED_YIELDS.length - 1)];
}
function checked(root, selector) {
  return root.querySelector(selector)?.checked ?? false;
}
function value(root, selector) {
  return root.querySelector(selector)?.value ?? "";
}
function actionRow({ id, label, detail, defaultCount = 0, max, step = 1 }) {
  return `
    <label class="farm-action">
      <span class="farm-action-main">
        <input type="checkbox" class="farm-check" data-action="${id}" />
        <span><strong>${label}</strong>${detail ? `<small>${detail}</small>` : ""}</span>
      </span>
      <span class="farm-action-count">
        <input type="number" class="farm-count" data-action="${id}" min="0" ${max !== undefined ? `max="${max}"` : ""} step="${step}" value="${defaultCount}" aria-label="${label} count" />
        <small>count</small>
      </span>
    </label>`;
}

let root = null;
let lastLevel = null;

function q(selector) { return root.querySelector(selector); }
function qa(selector) { return [...root.querySelectorAll(selector)]; }

function renderHerbs() {
  return HERBS.map((crop) => `
    <details class="farm-group">
      <summary>${crop.name} <span class="farm-meta">Lv ${crop.level}</span></summary>
      <div class="farm-crop">
        ${actionRow({
          id: `herb:${crop.id}:harvest`,
          label: `Plant + harvest ${crop.name}`,
          detail: "Plant XP + 3 pickings + about 2 seeds; choose manure for +20% yield",
          max: 3,
        })}
        ${actionRow({
          id: `herb:${crop.id}:seed`,
          label: `Plant ${crop.name} and let it go to seed`,
          detail: "Plant XP + 1 seed per herb patch; manure does not increase seeds",
          max: 3,
        })}
        <div class="farm-options">
          <label><input type="checkbox" class="farm-manure" data-crop="${crop.id}" /> Use manure (+20% harvest yield)</label>
          <label>Harvest level <input type="number" class="farm-level" data-crop="${crop.id}" min="${crop.level}" max="200" value="${lastLevel ?? crop.level}" /></label>
        </div>
      </div>
    </details>`).join("");
}

function renderFibres() {
  return FIBRES.map((crop) => `
    <details class="farm-group">
      <summary>${crop.name} <span class="farm-meta">Lv ${crop.level}</span></summary>
      <div class="farm-crop">
        ${actionRow({
          id: `fibre:${crop.id}:harvest`,
          label: `Plant + harvest ${crop.name}`,
          detail: "Plant XP + fibre yield (one fibre harvest per patch)",
          max: 4,
        })}
        ${actionRow({
          id: `fibre:${crop.id}:seed`,
          label: `Plant ${crop.name} and let it go to seed`,
          detail: "Plant XP + 9 seeds per fibre patch; manure does not increase seeds",
          max: 4,
        })}
        <div class="farm-options">
          <label><input type="checkbox" class="farm-manure" data-crop="${crop.id}" /> Use manure (+20% fibre yield)</label>
          <label>Harvest level <input type="number" class="farm-level" data-crop="${crop.id}" min="${crop.level}" max="200" value="${lastLevel ?? crop.level}" /></label>
        </div>
      </div>
    </details>`).join("");
}

function renderLivestock() {
  const poultry = LIVESTOCK.filter((a) => a.kind === "poultry");
  const large = LIVESTOCK.filter((a) => a.kind === "large");
  const renderBreed = (animal) => `
    <details class="farm-group">
      <summary>${animal.name} <span class="farm-meta">Lv ${animal.level}</span></summary>
      <div class="farm-crop">
        ${animal.egg !== undefined ? actionRow({
          id: `livestock:${animal.id}:eggs`,
          label: `Collect ${animal.name} eggs`,
          detail: "Enter grown females; XP per egg. Up to 3 days can accumulate.",
          max: 32,
        }) : ""}
        ${animal.wool !== undefined ? actionRow({
          id: `livestock:${animal.id}:wool`,
          label: `Shear ${animal.name}`,
          detail: "Enter sheep to shear; males and females both produce wool (every 2 days)",
          max: 16,
        }) : ""}
        ${animal.milk !== undefined ? actionRow({
          id: `livestock:${animal.id}:milk`,
          label: `${animal.name} milk`,
          detail: "Enter grown females only; milk is collected every 2 days",
          max: 16,
        }) : ""}
        ${actionRow({
          id: `livestock:${animal.id}:grow`,
          label: `${animal.name} young grow up`,
          detail: `Enter young that grow up (${fmt(animal.grow)} XP each)`,
          max: animal.kind === "poultry" ? 32 : 16,
        })}
        ${actionRow({
          id: `livestock:${animal.id}:slaughter`,
          label: `Slaughter grown ${animal.name}`,
          detail: `Enter grown animals slaughtered (${fmt(animal.slaughter)} XP each); young give no XP`,
          max: animal.kind === "poultry" ? 32 : 16,
        })}
      </div>
    </details>`;
  return `
    <h4>Poultry coop <span class="farm-meta">max 32 · one breed at a time</span></h4>
    <div class="farm-note">Choose only one poultry breed in this coop. Egg collection is based on the number of grown females, not roosters or young.</div>
    ${poultry.map(renderBreed).join("")}
    <h4>Sheep / cow coop <span class="farm-meta">max 16 · one breed at a time</span></h4>
    <div class="farm-note">Choose only one sheep or cow breed in this coop. Sheep wool is produced by both sexes; milk is produced by females only.</div>
    ${large.map(renderBreed).join("")}
    <div class="farm-options farm-shared">
      ${actionRow({ id: "livestock:muck", label: "Muck out the pens", detail: "5 XP per muck level; enter the total muck levels cleared" })}
      <label>Days of eggs to collect <input type="number" class="egg-days" min="1" max="3" value="1" /></label>
      <label>Poultry currently housed <input type="number" class="poultry-occupancy" min="0" max="32" value="0" /></label>
      <label>Sheep / cows currently housed <input type="number" class="large-occupancy" min="0" max="16" value="0" /></label>
      <label>Number of muck levels cleared <input type="number" class="muck-count" min="0" value="0" /></label>
    </div>`;
}

function selectedActions() {
  return qa(".farm-check:checked").map((el) => el.dataset.action);
}
function setLevelHints(level) {
  qa(".farm-level").forEach((el) => {
    if (level !== null) el.value = Math.max(Number(el.min), level);
  });
}

function calculateHerb(action, crop, bonus) {
  const count = num(q(`[data-action="${action}"].farm-count`)?.value);
  if (!count) return null;
  const level = num(q(`[data-crop="${crop.id}"].farm-level`)?.value, crop.level);
  const manure = checked(root, `.farm-manure[data-crop="${crop.id}"]`);
  if (action.endsWith(":seed")) {
    return { label: `${crop.name} · seed`, count, base: crop.plantXp + crop.herbXp, detail: `${fmt(count)} plantings × (plant ${fmt(crop.plantXp)} + 1 seed × ${fmt(crop.herbXp)})` };
  }
  const perPick = herbYield(level, crop.level) * (manure ? 1.2 : 1);
  const perPlant = crop.plantXp + (3 * perPick * crop.herbXp) + (2 * crop.herbXp);
  return { label: `${crop.name} · harvest`, count, base: perPlant, detail: `${fmt(count)} plantings × (plant ${fmt(crop.plantXp)} + 3 × ${fmt(perPick)} herbs × ${fmt(crop.herbXp)} XP + 2 seeds)` };
}

function calculateFibre(action, crop, bonus) {
  const count = num(q(`[data-action="${action}"].farm-count`)?.value);
  if (!count) return null;
  const level = num(q(`[data-crop="${crop.id}"].farm-level`)?.value, crop.level);
  const manure = checked(root, `.farm-manure[data-crop="${crop.id}"]`);
  if (action.endsWith(":seed")) {
    const seeds = seedYield(level, crop.level);
    return { label: `${crop.name} · seeds`, count, base: crop.plantXp + (9 * seeds * crop.fibreXp), detail: `${fmt(count)} plantings × (plant ${fmt(crop.plantXp)} + 9 × ${fmt(seeds)} seeds × ${fmt(crop.fibreXp)} XP)` };
  }
  const yieldCount = fibreYield(level, crop.level) * (manure ? 1.2 : 1);
  return { label: `${crop.name} · fibre`, count, base: crop.plantXp + (yieldCount * crop.fibreXp), detail: `${fmt(count)} plantings × (plant ${fmt(crop.plantXp)} + ${fmt(yieldCount)} fibre × ${fmt(crop.fibreXp)} XP)` };
}

function calculateLivestock(bonus) {
  const rows = [];
  const selected = selectedActions();
  for (const animal of LIVESTOCK) {
    const actions = [
      ["eggs", animal.egg],
      ["wool", animal.wool],
      ["milk", animal.milk],
      ["grow", animal.grow],
      ["slaughter", animal.slaughter],
    ];
    for (const [action, rate] of actions) {
      const id = `livestock:${animal.id}:${action}`;
      if (!selected.includes(id) || rate === undefined) continue;
      let count = num(q(`[data-action="${id}"].farm-count`)?.value);
      if (action === "eggs") {
        const days = Math.min(3, Math.max(1, num(q(".egg-days")?.value, 1)));
        const females = count;
        count = females * days;
      }
      rows.push({
        label: `${animal.name} · ${action}`,
        count,
        base: rate,
        detail: action === "eggs"
          ? `${fmt(count)} eggs (${fmt(num(q(`[data-action="${id}"].farm-count`)?.value))} grown females × ${fmt(Math.min(3, Math.max(1, num(q(".egg-days")?.value, 1)))} days)`
          : `${fmt(count)} × ${fmt(rate)} XP`,
      });
    }
  }

  if (selected.includes("livestock:muck")) {
    const muck = num(q(".muck-count")?.value);
    if (muck) rows.push({ label: "Muck out", count: muck, base: 5, detail: `${fmt(muck)} muck levels × 5 XP` });
  }
  return rows;
}

function validateLivestockSelection() {
  const selected = selectedActions();
  const selectedBreeds = LIVESTOCK.filter((animal) =>
    selected.some((id) => id.startsWith(`livestock:${animal.id}:`)));
  const poultry = selectedBreeds.filter((a) => a.kind === "poultry");
  const large = selectedBreeds.filter((a) => a.kind === "large");
  const errors = [];
  if (poultry.length > 1) errors.push("The poultry coop can contain only one breed at a time.");
  if (large.length > 1) errors.push("The sheep / cow coop can contain only one breed at a time.");
  if (num(q(".poultry-occupancy")?.value) > 32) errors.push("The poultry coop limit is 32 birds.");
  if (num(q(".large-occupancy")?.value) > 16) errors.push("The sheep / cow coop limit is 16 animals.");

  const herbPlantings = selected.filter((id) => id.startsWith("herb:"))
    .reduce((sum, id) => sum + num(q(`[data-action="${id}"].farm-count`)?.value), 0);
  const fibrePlantings = selected.filter((id) => id.startsWith("fibre:"))
    .reduce((sum, id) => sum + num(q(`[data-action="${id}"].farm-count`)?.value), 0);
  if (herbPlantings > 3) errors.push("You can plan up to 3 herb patch plantings in total.");
  if (fibrePlantings > 4) errors.push("You can plan up to 4 fibre patch plantings in total.");
  return errors;
}

function buildResults({ xpNeeded, currentLevel, log }) {
  const bonus = log?.bonus ?? 0;
  const selected = selectedActions();
  if (!selected.length) return `<p class="note">Select one or more farming actions and enter the quantities you plan to do.</p>`;

  const errors = validateLivestockSelection();
  const rows = [];
  for (const crop of HERBS) {
    for (const action of [`herb:${crop.id}:harvest`, `herb:${crop.id}:seed`]) {
      if (selected.includes(action)) {
        const row = calculateHerb(action, crop, bonus);
        if (row) rows.push(row);
      }
    }
  }
  for (const crop of FIBRES) {
    for (const action of [`fibre:${crop.id}:harvest`, `fibre:${crop.id}:seed`]) {
      if (selected.includes(action)) {
        const row = calculateFibre(action, crop, bonus);
        if (row) rows.push(row);
      }
    }
  }
  rows.push(...calculateLivestock(bonus));

  const total = rows.reduce((sum, row) => sum + xp(row.base, bonus) * row.count, 0);
  const remaining = Math.max(0, num(xpNeeded) - total);
  let html = `<h3>Farming XP plan</h3>`;
  if (errors.length) {
    html += `<div class="error" role="alert">${errors.map((e) => `<p>${e}</p>`).join("")}</div>`;
  }
  if (!rows.length) return html + `<p class="note">Enter a quantity greater than 0 for at least one selected action.</p>`;
  html += `<table class="farm-results">
    <tr><th>Action</th><th>Count</th><th>XP each</th><th>Total XP</th></tr>
    ${rows.map((row) => {
      const each = xp(row.base, bonus);
      return `<tr><td>${row.label}<small>${row.detail}</small></td><td>${fmt(row.count)}</td><td>${fmt(each)}</td><td>${fmt(each * row.count)}</td></tr>`;
    }).join("")}
    <tr><td colspan="3"><strong>Combined Farming XP</strong></td><td><strong>${fmt(total)}</strong></td></tr>
    <tr><td colspan="3">XP remaining to target</td><td>${fmt(remaining)}</td></tr>
  </table>`;
  html += `<p class="note">Harvest quantities are estimates from the supplied yield table. Herb plantings count toward the 3 herb patches; fibre plantings count toward the 4 fibre patches. Seeds are an alternative to harvesting, not an additional yield. Manure increases harvest yield by about 20%, but does not increase seed yield.</p>`;
  if (total >= xpNeeded) html += `<p class="success">Your selected actions meet or exceed the XP target.</p>`;
  else html += `<p class="note">At the entered quantities, you need ${fmt(remaining)} more XP to reach the target.</p>`;
  return html;
}

export const farming = {
  id: "farming",
  name: "Farming",
  icon: "https://aldermere.online/assets/wiki/skills/crafting.webp",
  active: true,
  taskTitle: "Choose your farming actions",

  renderTask(container) {
    root = container;
    root.innerHTML = `
      <div class="farm-intro">
        <p>Build a combined plan by selecting multiple actions and entering your own quantities.</p>
        <p><strong>Available plots:</strong> 3 herb patches · 4 fibre patches</p>
        <p><strong>Livestock:</strong> 1 poultry coop (32 max) · 1 sheep/cow coop (16 max). Breeds cannot be mixed within a coop.</p>
      </div>
      <div class="farm-category">
        <h3>Herbs <span class="farm-meta">3 patches</span></h3>
        ${renderHerbs()}
      </div>
      <div class="farm-category">
        <h3>Fibres <span class="farm-meta">4 patches</span></h3>
        ${renderFibres()}
      </div>
      <div class="farm-category">
        <h3>Livestock</h3>
        ${renderLivestock()}
      </div>
      <div class="farm-actions">
        <button type="button" class="farm-select-all">Select all actions</button>
        <button type="button" class="farm-clear">Clear selections</button>
        <span class="farm-selected">0 selected</span>
      </div>`;

    qa(".farm-check").forEach((check) => check.addEventListener("change", updateSelected));
    qa(".farm-count").forEach((input) => input.addEventListener("input", () => {
      const check = q(`.farm-check[data-action="${input.dataset.action}"]`);
      if (num(input.value) > 0 && check) check.checked = true;
      updateSelected();
    }));
    q(".farm-select-all").addEventListener("click", () => {
      qa(".farm-check").forEach((check) => { check.checked = true; });
      updateSelected();
    });
    q(".farm-clear").addEventListener("click", () => {
      qa(".farm-check").forEach((check) => { check.checked = false; });
      updateSelected();
    });
    if (lastLevel !== null) setLevelHints(lastLevel);
    updateSelected();
  },

  onLevelChange(level) {
    lastLevel = level;
    if (root) setLevelHints(level);
  },

  calculate(args) {
    return buildResults(args);
  },
};

function updateSelected() {
  const el = q(".farm-selected");
  if (el) el.textContent = `${selectedActions().length} selected`;
}

