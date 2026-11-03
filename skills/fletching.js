import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

// Names, levels and XP are transcribed directly from the screenshot.
// Items prefixed "20 x" are stackable batches (e.g. 20 arrow shafts): the XP shown
// is for the whole batch, so the "ores needed" style count is "items needed".
const ITEMS = [
  { name: "20 x Birch Arrow Shaft",       level: 1,  xp: 10   },
  { name: "Birch Bow",                    level: 1,  xp: 10   },
  { name: "Bronze Crossbow",              level: 1,  xp: 20   },
  { name: "Unstrung Birch Bow",           level: 1,  xp: 20   },
  { name: "20 x Bronze Arrow",            level: 1,  xp: 40   },
  { name: "Birch Crossbow Stock",         level: 1,  xp: 40   },
  { name: "20 x Oak Arrow Shaft",         level: 11, xp: 15   },
  { name: "Oak Bow",                      level: 11, xp: 23   },
  { name: "Iron Crossbow",                level: 11, xp: 46   },
  { name: "Unstrung Oak Bow",             level: 11, xp: 46   },
  { name: "20 x Iron Arrow",              level: 11, xp: 92   },
  { name: "Oak Crossbow Stock",           level: 11, xp: 92   },
  { name: "20 x Willow Arrow Shaft",      level: 21, xp: 20   },
  { name: "Willow Bow",                   level: 21, xp: 39.5 },
  { name: "Steel Crossbow",               level: 21, xp: 79   },
  { name: "Unstrung Willow Bow",          level: 21, xp: 79   },
  { name: "20 x Steel Arrow",             level: 21, xp: 125  },
  { name: "Willow Crossbow Stock",        level: 21, xp: 158  },
  { name: "20 x Swampwood Arrow Shaft",   level: 31, xp: 25   },
  { name: "Swampwood Bow",                level: 31, xp: 58   },
  { name: "Mithril Crossbow",             level: 31, xp: 116  },
  { name: "Unstrung Swampwood Bow",       level: 31, xp: 116  },
  { name: "20 x Mithril Arrow",           level: 31, xp: 195  },
  { name: "Swampwood Crossbow Stock",     level: 31, xp: 232  },
  { name: "20 x Maple Arrow Shaft",       level: 41, xp: 30   },
  { name: "Maple Bow",                    level: 41, xp: 77.5 },
  { name: "Ebony Crossbow",               level: 41, xp: 155  },
  { name: "Unstrung Maple Bow",           level: 41, xp: 155  },
  { name: "20 x Ebony Arrow",             level: 41, xp: 234  },
  { name: "Maple Crossbow Stock",         level: 41, xp: 310  },
  { name: "20 x Pine Arrow Shaft",        level: 61, xp: 35   },
  { name: "Pine Bow",                     level: 61, xp: 120  },
  { name: "Verdite Crossbow",             level: 61, xp: 240  },
  { name: "Unstrung Pine Bow",            level: 61, xp: 240  },
  { name: "20 x Verdite Arrow",           level: 61, xp: 319  },
  { name: "Pine Crossbow Stock",          level: 61, xp: 480  },
  { name: "20 x Moonwood Arrow Shaft",    level: 81, xp: 40   },
  { name: "Moonwood Bow",                 level: 81, xp: 160  },
  { name: "Tyrian Crossbow",              level: 81, xp: 320  },
  { name: "Unstrung Moonwood Bow",        level: 81, xp: 320  },
  { name: "20 x Tyrian Arrow",            level: 81, xp: 399  },
  { name: "Moonwood Crossbow Stock",      level: 81, xp: 640  },
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

export const fletching = {
  id: "fletching",
  name: "Fletching",
  icon: "🏹",
  active: true,
  taskTitle: "Choose your items",

  renderTask(container) {
    root = container;
    root.innerHTML = `
      <div class="ore-actions">
        <input type="search" class="itemFilter" placeholder="Filter items (e.g. maple, crossbow, arrow)..." />
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
      </div>
      <div class="ore-grid"></div>
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
    q(".itemFilter").addEventListener("input", applyFilter);
    q(".selectAllBtn").addEventListener("click", () => setVisibleItems(true));
    q(".clearBtn").addEventListener("click", () => setVisibleItems(false));
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
      <p class="note">Craft counts round up, so totals may overshoot your target by a few XP.
      Items marked "20 x" are batches: one craft produces 20 and the XP shown is per batch.</p>`;

    return html;
  },
};

