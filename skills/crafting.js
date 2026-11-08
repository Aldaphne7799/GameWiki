import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

// Names, levels and XP are transcribed directly from the screenshots.
// XP values use dots here (the source used decimal commas).
// Bowstring appears once per tier, so the tier level is appended to keep names unique.
const ITEMS = [
  // Level 1-11
  { name: "Bowstring (Lv 1)",       level: 1,  xp: 5 },
  { name: "Leather",                level: 1,  xp: 5 },
  { name: "Wool Cloth",             level: 3,  xp: 5 },
  { name: "Leather Helm",           level: 3,  xp: 10 },
  { name: "Wool Facemask",          level: 3,  xp: 10 },
  { name: "Wool Hat",               level: 3,  xp: 10 },
  { name: "Leather Boots",          level: 5,  xp: 10 },
  { name: "Wool Boots",             level: 5,  xp: 10 },
  { name: "Leather Gloves",         level: 6,  xp: 10 },
  { name: "Wool Gloves",            level: 6,  xp: 10 },
  { name: "Leather Legs",           level: 8,  xp: 15 },
  { name: "Leather Quiver",         level: 8,  xp: 15 },
  { name: "Wool Cape",              level: 8,  xp: 15 },
  { name: "Wool Robe Bottom",       level: 8,  xp: 15 },
  { name: "Leather Body",           level: 10, xp: 25 },
  { name: "Wool Robe Top",          level: 10, xp: 25 },

  // Level 11-21
  { name: "Bowstring (Lv 11)",      level: 11, xp: 11.5 },
  { name: "Hard Leather",           level: 11, xp: 11.5 },
  { name: "Hemp Cloth",             level: 11, xp: 11.5 },
  { name: "Hard Leather Helm",      level: 13, xp: 23 },
  { name: "Hemp Facemask",          level: 13, xp: 23 },
  { name: "Hemp Hat",               level: 13, xp: 23 },
  { name: "Hard Leather Boots",     level: 15, xp: 23 },
  { name: "Hemp Boots",             level: 15, xp: 23 },
  { name: "Hard Leather Gloves",    level: 16, xp: 23 },
  { name: "Hemp Gloves",            level: 16, xp: 23 },
  { name: "Hard Leather Legs",      level: 18, xp: 34.5 },
  { name: "Hard Leather Quiver",    level: 18, xp: 34.5 },
  { name: "Hemp Cape",              level: 18, xp: 34.5 },
  { name: "Hemp Robe Bottom",       level: 18, xp: 34.5 },
  { name: "Hard Leather Body",      level: 20, xp: 57.5 },
  { name: "Hemp Robe Top",          level: 20, xp: 57.5 },

  // Level 21-31
  { name: "Bowstring (Lv 21)",      level: 21, xp: 19.75 },
  { name: "Troll Leather",          level: 21, xp: 19.75 },
  { name: "Flax Cloth",             level: 21, xp: 19.75 },
  { name: "Troll Hide Helm",        level: 23, xp: 39.5 },
  { name: "Flax Facemask",          level: 23, xp: 39.5 },
  { name: "Flax Hat",               level: 23, xp: 39.5 },
  { name: "Troll Hide Boots",       level: 25, xp: 39.5 },
  { name: "Flax Boots",             level: 25, xp: 39.5 },
  { name: "Troll Hide Gloves",      level: 26, xp: 39.5 },
  { name: "Flax Gloves",            level: 26, xp: 39.5 },
  { name: "Troll Hide Legs",        level: 28, xp: 59.25 },
  { name: "Troll Hide Quiver",      level: 28, xp: 59.25 },
  { name: "Flax Cape",              level: 28, xp: 59.25 },
  { name: "Flax Robe Bottom",       level: 28, xp: 59.25 },
  { name: "Troll Hide Body",        level: 30, xp: 98.75 },
  { name: "Flax Robe Top",          level: 30, xp: 98.75 },

  // Level 31-41
  { name: "Bowstring (Lv 31)",      level: 31, xp: 29 },
  { name: "Bear Leather",           level: 31, xp: 29 },
  { name: "Stinkreed Cloth",        level: 31, xp: 29 },
  { name: "Bear Hide Helm",         level: 33, xp: 58 },
  { name: "Stinkreed Facemask",     level: 33, xp: 58 },
  { name: "Stinkreed Hat",          level: 33, xp: 58 },
  { name: "Bear Hide Boots",        level: 35, xp: 58 },
  { name: "Stinkreed Boots",        level: 35, xp: 58 },
  { name: "Bear Hide Gloves",       level: 36, xp: 58 },
  { name: "Stinkreed Gloves",       level: 36, xp: 58 },
  { name: "Bear Hide Legs",         level: 38, xp: 87 },
  { name: "Bear Hide Quiver",       level: 38, xp: 87 },
  { name: "Stinkreed Cape",         level: 38, xp: 87 },
  { name: "Stinkreed Robe Bottom",  level: 38, xp: 87 },
  { name: "Bear Hide Body",         level: 40, xp: 145 },
  { name: "Stinkreed Robe Top",     level: 40, xp: 145 },

  // Level 41-61
  { name: "Bowstring (Lv 41)",      level: 41, xp: 38.75 },
  { name: "Swamp D'hide Leather",   level: 41, xp: 38.75 },
  { name: "Toetoe Cloth",           level: 41, xp: 38.75 },
  { name: "Swamp D'hide Helm",      level: 43, xp: 77.5 },
  { name: "Toetoe Facemask",        level: 43, xp: 77.5 },
  { name: "Toetoe Hat",             level: 43, xp: 77.5 },
  { name: "Swamp D'hide Boots",     level: 46, xp: 77.5 },
  { name: "Toetoe Boots",           level: 46, xp: 77.5 },
  { name: "Swamp D'hide Gloves",    level: 49, xp: 77.5 },
  { name: "Toetoe Gloves",          level: 49, xp: 77.5 },
  { name: "Swamp D'hide Legs",      level: 53, xp: 116.25 },
  { name: "Swamp D'hide Quiver",    level: 53, xp: 116.25 },
  { name: "Toetoe Cape",            level: 53, xp: 116.25 },
  { name: "Toetoe Robe Bottom",     level: 53, xp: 116.25 },
  { name: "Swamp D'hide Body",      level: 57, xp: 193.75 },
  { name: "Toetoe Robe Top",        level: 57, xp: 193.75 },

  // Level 61-81
  { name: "Bowstring (Lv 61)",      level: 61, xp: 60 },
  { name: "Green D'hide Leather",   level: 61, xp: 60 },
  { name: "Sunthread Cloth",        level: 61, xp: 60 },
  { name: "Green D'hide Helm",      level: 63, xp: 120 },
  { name: "Sunthread Facemask",     level: 63, xp: 120 },
  { name: "Sunthread Hat",          level: 63, xp: 120 },
  { name: "Green D'hide Boots",     level: 66, xp: 120 },
  { name: "Sunthread Boots",        level: 66, xp: 120 },
  { name: "Green D'hide Gloves",    level: 69, xp: 120 },
  { name: "Sunthread Gloves",       level: 69, xp: 120 },
  { name: "Green D'hide Legs",      level: 73, xp: 180 },
  { name: "Green D'hide Quiver",    level: 73, xp: 180 },
  { name: "Sunthread Cape",         level: 73, xp: 180 },
  { name: "Sunthread Robe Bottom",  level: 73, xp: 180 },
  { name: "Green D'hide Body",      level: 77, xp: 300 },
  { name: "Sunthread Robe Top",     level: 77, xp: 300 },
];

// Collapsible groups, by required level (inclusive). Edit freely.
const GROUPS = [
  { min: 1,  max: 10, label: "Crafts lvl 1-10" },
  { min: 11, max: 20, label: "Crafts lvl 11-20" },
  { min: 21, max: 30, label: "Crafts lvl 21-30" },
  { min: 31, max: 40, label: "Crafts lvl 31-40" },
  { min: 41, max: 60, label: "Crafts lvl 41-60" },
  { min: 61, max: 80, label: "Crafts lvl 61-80" },
];

// Module-level reference to the container we render into
let root = null;

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedIndexes = () =>
  qa(".itemCheck:checked").map((c) => parseInt(c.value, 10));

function updateMixTotal() {
  const mixTotal = q(".mixTotal");
  const sum = qa(".mixInput").reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const ok = Math.abs(sum - 100) <= 0.05;
  mixTotal.textContent = `Total: ${sum.toFixed(1)}%` + (ok ? " ✅" : " (should be 100%)");
  mixTotal.classList.toggle("error", !ok);
}

// Even split: 100 / number of selected items, recalculated on every selection change.
function rebuildMixInputs() {
  const mixSection = q(".mixSection");
  const mixInputs = q(".mixInputs");
  const idx = selectedIndexes();

  mixInputs.innerHTML = "";

  if (idx.length < 2) {
    mixSection.hidden = true;
    return;
  }
  mixSection.hidden = false;

  // Even split; last row takes the rounding remainder
  const even = Math.round((100 / idx.length) * 10) / 10;

  idx.forEach((i, n) => {
    const value = n === idx.length - 1
      ? Math.round((100 - even * (idx.length - 1)) * 10) / 10
      : even;

    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `<span>${ITEMS[i].name}</span>
      <span><input type="number" class="mixInput" data-item="${i}" min="0" max="100" step="0.1" value="${value}" placeholder="0" /> %</span>`;
    mixInputs.appendChild(row);
  });

  qa(".mixInput").forEach((el) => el.addEventListener("input", updateMixTotal));
  updateMixTotal();
}

// Refresh the "(selected/total)" counter in every group header
function updateGroupCounts() {
  qa(".group").forEach((g) => {
    const boxes = [...g.querySelectorAll(".itemCheck")];
    const checked = boxes.filter((b) => b.checked).length;
    g.querySelector(".group-count").textContent = `(${checked}/${boxes.length})`;
  });
}

function onSelectionChange() {
  updateGroupCounts();
  rebuildMixInputs();
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

export const crafting = {
  id: "crafting",
  name: "Crafting",
  icon: "🧵",
  active: true,
  taskTitle: "Choose your items",

  renderTask(container) {
    root = container;
    root.innerHTML = `
      <div class="ore-actions">
        <input type="search" class="itemFilter" placeholder="Filter items (e.g. boots, hemp, d'hide)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
      </div>
      <div class="groups"></div>
      <div class="mixSection" hidden>
        <h3>XP split</h3>
        <div class="mixInputs"></div>
        <div class="mixTotal"></div>
      </div>`;

    const groupsEl = q(".groups");

    GROUPS.forEach((grp) => {
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

      ITEMS.forEach((item, i) => {
        if (item.level < grp.min || item.level > grp.max) return;

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
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));

    // Open the first group by default so the panel isn't just a column of headers
    const first = q(".group");
    if (first) first.open = true;

    updateGroupCounts();
  },

  // Visual hint (not a lock) for items above the current level
  onLevelChange(level) {
    if (!root) return;
    qa(".item-row").forEach((label) => {
      const item = ITEMS[parseInt(label.dataset.index, 10)];
      label.classList.toggle("above-level", level < item.level);
    });
  },

  // Returns an HTML string for the results panel
  calculate({ xpNeeded, currentLevel, log }) {
    const selected = selectedIndexes().map((i) => ({ item: ITEMS[i], i }));

    if (selected.length === 0) {
      return `<p class="note">Select at least one item in step 3 to see how many you need.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";

    if (selected.length > 1) {
      const shares = selected.map(({ i }) => {
        const el = q(`.mixInput[data-item="${i}"]`);
        return parseFloat(el.value) || 0;
      });
      const shareSum = shares.reduce((a, b) => a + b, 0);

      if (Math.abs(shareSum - 100) > 0.05) {
        html += `<p class="error">The XP split must add up to 100% (currently ${shareSum.toFixed(1)}%).</p>`;
      } else {
        let totalItems = 0;
        html += `
          <h3>Combined plan (${title})</h3>
          <table>
            <tr><th>Item</th><th>Share</th><th>XP from item</th><th>XP each</th><th>Crafts needed</th><th>Usable?</th></tr>`;

        selected.forEach(({ item }, n) => {
          const xpEach = xpWithBonus(item.xp, log.bonus);
          const xpShare = xpNeeded * (shares[n] / 100);
          const count = shares[n] > 0 ? Math.ceil(xpShare / xpEach) : 0;
          totalItems += count;
          html += `
            <tr>
              <td>${item.name}</td>
              <td>${shares[n]}%</td>
              <td>${fmt(xpShare)}</td>
              <td>${fmt(xpEach)}</td>
              <td>${fmt(count)}</td>
              <td>${currentLevel >= item.level ? "✅" : "❌ Lv " + item.level}</td>
            </tr>`;
        });

        html += `
            <tr><td colspan="4"><strong>Total crafts</strong></td><td><strong>${fmt(totalItems)}</strong></td><td></td></tr>
          </table>`;
      }
    }

    html += `
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
          <td>${currentLevel >= item.level ? "✅" : "❌ Lv " + item.level}</td>
        </tr>`;
    });

    html += `</table>
      <p class="note">Craft counts round up, so totals may overshoot your target by a few XP.</p>`;

    return html;
  },
};
