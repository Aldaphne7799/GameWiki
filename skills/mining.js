import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const ORES = [
  { name: "Copper",             level: 1,  xp: 10   },
  { name: "Tin",                level: 1,  xp: 10   },
  { name: "Crystal",            level: 6,  xp: 17.5 },
  { name: "Iron",               level: 11, xp: 23   },
  { name: "Coal",               level: 21, xp: 38.5 },
  { name: "Mithril",            level: 31, xp: 56.5 },
  { name: "Ebony",              level: 41, xp: 77.5 },
  { name: "Great Crystal Vein", level: 51, xp: 98   },
  { name: "Verdite",            level: 61, xp: 120  },
  { name: "Tyrian",             level: 81, xp: 160  },
];

// Module-level reference to the container we render into
let root = null;

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedOreIndexes = () =>
  qa(".oreCheck:checked").map((c) => parseInt(c.value, 10));

function updateMixTotal() {
  const mixTotal = q(".mixTotal");
  const sum = qa(".mixInput").reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const ok = Math.abs(sum - 100) <= 0.05;
  mixTotal.textContent = `Total: ${sum.toFixed(1)}%` + (ok ? " ✅" : " (should be 100%)");
  mixTotal.classList.toggle("error", !ok);
}

// Even split: 100 / number of selected ores, recalculated on every selection change.
function rebuildMixInputs() {
  const mixSection = q(".mixSection");
  const mixInputs = q(".mixInputs");
  const idx = selectedOreIndexes();

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
    row.innerHTML = `<span>${ORES[i].name}</span>
      <span><input type="number" class="mixInput" data-ore="${i}" min="0" max="100" step="0.1" value="${value}" placeholder="0" /> %</span>`;
    mixInputs.appendChild(row);
  });

  qa(".mixInput").forEach((el) => el.addEventListener("input", updateMixTotal));
  updateMixTotal();
}

function setAllOres(state) {
  qa(".oreCheck").forEach((c) => (c.checked = state));
  rebuildMixInputs();
}

export const mining = {
  id: "mining",
  name: "Mining",
  icon: "⛏️",
  active: true,
  taskTitle: "Choose your ores",

  renderTask(container) {
    root = container;
    root.innerHTML = `
      <div class="ore-actions">
        <button type="button" class="selectAllBtn">Select all</button>
        <button type="button" class="clearBtn">Clear</button>
      </div>
      <div class="ore-grid"></div>
      <div class="mixSection" hidden>
        <h3>XP split</h3>
        <div class="mixInputs"></div>
        <div class="mixTotal"></div>
      </div>`;

    const oreGrid = q(".ore-grid");
    ORES.forEach((ore, i) => {
      const label = document.createElement("label");
      label.className = "ore-item";
      label.innerHTML = `
        <input type="checkbox" class="oreCheck" value="${i}" />
        <span class="ore-name">${ore.name}</span>
        <span class="ore-meta">Req. Lv ${ore.level} · ${ore.xp} XP</span>`;
      oreGrid.appendChild(label);
    });

    qa(".oreCheck").forEach((c) => c.addEventListener("change", rebuildMixInputs));
    q(".selectAllBtn").addEventListener("click", () => setAllOres(true));
    q(".clearBtn").addEventListener("click", () => setAllOres(false));
  },

  // Visual hint (not a lock) for ores above the current level
  onLevelChange(level) {
    if (!root) return;
    qa(".ore-item").forEach((label, i) => {
      label.classList.toggle("above-level", level < ORES[i].level);
    });
  },

  // Returns an HTML string for the results panel
  calculate({ xpNeeded, currentLevel, log }) {
    const selected = selectedOreIndexes().map((i) => ({ ore: ORES[i], i }));

    if (selected.length === 0) {
      return `<p class="note">Select at least one ore in step 3 to see how many you need.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";

    if (selected.length > 1) {
      const shares = selected.map(({ i }) => {
        const el = q(`.mixInput[data-ore="${i}"]`);
        return parseFloat(el.value) || 0;
      });
      const shareSum = shares.reduce((a, b) => a + b, 0);

      if (Math.abs(shareSum - 100) > 0.05) {
        html += `<p class="error">The XP split must add up to 100% (currently ${shareSum.toFixed(1)}%).</p>`;
      } else {
        let totalOres = 0;
        html += `
          <h3>Combined plan (${title})</h3>
          <table>
            <tr><th>Ore</th><th>Share</th><th>XP from ore</th><th>XP each</th><th>Ores needed</th><th>Usable?</th></tr>`;

        selected.forEach(({ ore }, n) => {
          const xpEach = xpWithBonus(ore.xp, log.bonus);
          const xpShare = xpNeeded * (shares[n] / 100);
          const count = shares[n] > 0 ? Math.ceil(xpShare / xpEach) : 0;
          totalOres += count;
          html += `
            <tr>
              <td>${ore.name}</td>
              <td>${shares[n]}%</td>
              <td>${fmt(xpShare)}</td>
              <td>${fmt(xpEach)}</td>
              <td>${fmt(count)}</td>
              <td>${currentLevel >= ore.level ? "✅" : "❌ Lv " + ore.level}</td>
            </tr>`;
        });

        html += `
            <tr><td colspan="4"><strong>Total ores</strong></td><td><strong>${fmt(totalOres)}</strong></td><td></td></tr>
          </table>`;
      }
    }

    html += `
      <h3>If you mine only one ore (${title})</h3>
      <table>
        <tr><th>Ore</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ logs</th><th>Ores needed</th><th>Usable?</th></tr>`;

    selected.forEach(({ ore }) => {
      const xpEach = xpWithBonus(ore.xp, log.bonus);
      html += `
        <tr>
          <td>${ore.name}</td>
          <td>${ore.level}</td>
          <td>${fmt(ore.xp)}</td>
          <td>${fmt(xpEach)}</td>
          <td>${fmt(Math.ceil(xpNeeded / xpEach))}</td>
          <td>${currentLevel >= ore.level ? "✅" : "❌ Lv " + ore.level}</td>
        </tr>`;
    });

    html += `</table>
      <p class="note">Ore counts round up, so totals may overshoot your target by a few XP.</p>`;

    return html;
  },
};
