import { fmt } from "../xp.js";
import { xpWithBonus } from "../logs.js";

const LOGS = [
  { name: "Birch",     level: 1,  xp: 30    },
  { name: "Oak",       level: 11, xp: 69    },
  { name: "Willow",    level: 21, xp: 118.5 },
  { name: "Swampwood", level: 31, xp: 174   },
  { name: "Maple",     level: 41, xp: 232.5 },
  { name: "Pine",      level: 61, xp: 360   },
  { name: "Moonwood",  level: 81, xp: 480   },
];

// Module-level reference to the container we render into
let root = null;

const q = (sel) => root.querySelector(sel);
const qa = (sel) => [...root.querySelectorAll(sel)];

const selectedLogIndexes = () =>
  qa(".logCheck:checked").map((c) => parseInt(c.value, 10));

function updateMixTotal() {
  const mixTotal = q(".mixTotal");
  const sum = qa(".mixInput").reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const ok = Math.abs(sum - 100) <= 0.05;
  mixTotal.textContent = `Total: ${sum.toFixed(1)}%` + (ok ? " ✅" : " (should be 100%)");
  mixTotal.classList.toggle("error", !ok);
}

// Even split: 100 / number of selected logs, recalculated on every selection change.
function rebuildMixInputs() {
  const mixSection = q(".mixSection");
  const mixInputs = q(".mixInputs");
  const idx = selectedLogIndexes();

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
    row.innerHTML = `<span>${LOGS[i].name}</span>
      <span><input type="number" class="mixInput" data-log="${i}" min="0" max="100" step="0.1" value="${value}" placeholder="0" /> %</span>`;
    mixInputs.appendChild(row);
  });

  qa(".mixInput").forEach((el) => el.addEventListener("input", updateMixTotal));
  updateMixTotal();
}

function setAllLogs(state) {
  qa(".logCheck").forEach((c) => (c.checked = state));
  rebuildMixInputs();
}

export const firemaking = {
  id: "firemaking",
  name: "Firemaking",
  icon: "https://aldermere.online/assets/wiki/skills/alchemy.webp",
  active: true,
  taskTitle: "Choose your logs to burn",

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

    const logGrid = q(".ore-grid");
    LOGS.forEach((tree, i) => {
      const label = document.createElement("label");
      label.className = "ore-item";
      label.innerHTML = `
        <input type="checkbox" class="logCheck" value="${i}" />
        <span class="ore-name">${tree.name}</span>
        <span class="ore-meta">Req. Lv ${tree.level} · ${tree.xp} XP</span>`;
      logGrid.appendChild(label);
    });

    qa(".logCheck").forEach((c) => c.addEventListener("change", rebuildMixInputs));
    q(".selectAllBtn").addEventListener("click", () => setAllLogs(true));
    q(".clearBtn").addEventListener("click", () => setAllLogs(false));
  },

  // Visual hint (not a lock) for logs above the current level
  onLevelChange(level) {
    if (!root) return;
    qa(".ore-item").forEach((label, i) => {
      label.classList.toggle("above-level", level < LOGS[i].level);
    });
  },

  // Returns an HTML string for the results panel
  calculate({ xpNeeded, currentLevel, log }) {
    const selected = selectedLogIndexes().map((i) => ({ tree: LOGS[i], i }));

    if (selected.length === 0) {
      return `<p class="note">Select at least one log in step 3 to see how many you need to burn.</p>`;
    }

    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;
    let html = "";

    if (selected.length > 1) {
      const shares = selected.map(({ i }) => {
        const el = q(`.mixInput[data-log="${i}"]`);
        return parseFloat(el.value) || 0;
      });
      const shareSum = shares.reduce((a, b) => a + b, 0);

      if (Math.abs(shareSum - 100) > 0.05) {
        html += `<p class="error">The XP split must add up to 100% (currently ${shareSum.toFixed(1)}%).</p>`;
      } else {
        let totalLogs = 0;
        html += `
          <h3>Combined plan (${title})</h3>
          <table>
            <tr><th>Log</th><th>Share</th><th>XP from log</th><th>XP each</th><th>Logs needed</th><th>Usable?</th></tr>`;

        selected.forEach(({ tree }, n) => {
          const xpEach = xpWithBonus(tree.xp, log.bonus);
          const xpShare = xpNeeded * (shares[n] / 100);
          const count = shares[n] > 0 ? Math.ceil(xpShare / xpEach) : 0;
          totalLogs += count;
          html += `
            <tr>
              <td>${tree.name}</td>
              <td>${shares[n]}%</td>
              <td>${fmt(xpShare)}</td>
              <td>${fmt(xpEach)}</td>
              <td>${fmt(count)}</td>
              <td>${currentLevel >= tree.level ? "✅" : "❌ Lv " + tree.level}</td>
            </tr>`;
        });

        html += `
            <tr><td colspan="4"><strong>Total logs</strong></td><td><strong>${fmt(totalLogs)}</strong></td><td></td></tr>
          </table>`;
      }
    }

    html += `
      <h3>If you burn only one log (${title})</h3>
      <table>
        <tr><th>Log</th><th>Req. Lv</th><th>Base XP</th><th>XP w/ logs</th><th>Logs needed</th><th>Usable?</th></tr>`;

    selected.forEach(({ tree }) => {
      const xpEach = xpWithBonus(tree.xp, log.bonus);
      html += `
        <tr>
          <td>${tree.name}</td>
          <td>${tree.level}</td>
          <td>${fmt(tree.xp)}</td>
          <td>${fmt(xpEach)}</td>
          <td>${fmt(Math.ceil(xpNeeded / xpEach))}</td>
          <td>${currentLevel >= tree.level ? "✅" : "❌ Lv " + tree.level}</td>
        </tr>`;
    });

    html += `</table>
      <p class="note">Log counts round up, so totals may overshoot your target by a few XP.</p>`;

    return html;
  },
};

