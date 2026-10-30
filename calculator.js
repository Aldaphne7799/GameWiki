/* ============ XP CURVE (your original, unchanged) ============ */

// XP needed to go from level n to n+1
function stepXp(n) {
  return Math.floor(100 + 3 * n + 0.5 * n ** 2 + 0.5 * n ** 3);
}

// Total XP required to reach a level (level 1 = 0 XP)
function totalXpForLevel(level) {
  let total = 0;
  for (let n = 1; n < level; n++) total += stepXp(n);
  return total;
}

const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

/* ============ MINING DATA (verify against your spreadsheet) ============ */

const ORES = [
  { name: "Copper",             level: 1,  xp: 10   },
  { name: "Tin",                level: 1,  xp: 10   },
  { name: "Crystal",            level: 8,  xp: 17.5 },
  { name: "Iron",               level: 11, xp: 23   },
  { name: "Coal",               level: 21, xp: 38.5 },
  { name: "Mithril",            level: 31, xp: 56.5 },
  { name: "Ebony",              level: 41, xp: 77.5 },
  { name: "Great Crystal Vein", level: 51, xp: 98   },
  { name: "Verdite",            level: 61, xp: 120  },
  { name: "Tyrian",             level: 81, xp: 160  },
];

const LOGS = [
  { name: "No Logs",           bonus: 0   },
  { name: "Birch",          bonus: 0.5 },
  { name: "Oak",            bonus: 1   },
  { name: "Willow",         bonus: 1.5 },
  { name: "Swampwood",      bonus: 2   },
  { name: "Maple",          bonus: 2.5 },
  { name: "Pine",           bonus: 3   },
  { name: "Moonwood",       bonus: 3.5 },
];

// base × (1 + bonus%), rounded to nearest 0.1 (so 10.05 -> 10.1)
function xpWithBonus(baseXp, bonusPercent) {
  const raw = baseXp * (1 + bonusPercent / 100);
  return Math.round(raw * 10 + 1e-9) / 10;
}

/* ============ UI SETUP ============ */

const logSelect = document.getElementById("logSelect");
LOGS.forEach((log, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = log.bonus ? `${log.name} (+${log.bonus}%)` : log.name;
  logSelect.appendChild(opt);
});

const oreGrid = document.getElementById("oreGrid");
ORES.forEach((ore, i) => {
  const label = document.createElement("label");
  label.className = "ore-item";
  label.innerHTML = `
    <input type="checkbox" class="oreCheck" value="${i}" />
    ${ore.name} <span class="note">(Lv ${ore.level}, ${ore.xp} xp)</span>`;
  oreGrid.appendChild(label);
});

const mixSection = document.getElementById("mixSection");
const mixInputs = document.getElementById("mixInputs");
const mixTotal = document.getElementById("mixTotal");

function selectedOreIndexes() {
  return [...document.querySelectorAll(".oreCheck:checked")].map((c) => parseInt(c.value, 10));
}

function updateMixTotal() {
  const sum = [...document.querySelectorAll(".mixInput")]
    .reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  mixTotal.textContent =
    `Total: ${sum.toFixed(1)}%` + (Math.abs(sum - 100) > 0.05 ? " (should be 100%)" : " ✅");
}

function rebuildMixInputs() {
  const idx = selectedOreIndexes();
  mixInputs.innerHTML = "";

  if (idx.length < 2) {
    mixSection.style.display = "none";
    return;
  }

  mixSection.style.display = "block";
  const even = Math.round((100 / idx.length) * 10) / 10;

  idx.forEach((i, n) => {
    // last ore takes the remainder so the total is exactly 100
    const value = n === idx.length - 1
      ? Math.round((100 - even * (idx.length - 1)) * 10) / 10
      : even;
    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `${ORES[i].name}
      <input type="number" class="mixInput" data-ore="${i}" min="0" max="100" step="0.1" value="${value}" /> %`;
    mixInputs.appendChild(row);
  });

  mixInputs.querySelectorAll(".mixInput").forEach((el) =>
    el.addEventListener("input", updateMixTotal)
  );
  updateMixTotal();
}

document.querySelectorAll(".oreCheck").forEach((c) =>
  c.addEventListener("change", rebuildMixInputs)
);

const setAllOres = (state) => {
  document.querySelectorAll(".oreCheck").forEach((c) => (c.checked = state));
  rebuildMixInputs();
};

document.getElementById("selectAllBtn").addEventListener("click", () => setAllOres(true));
document.getElementById("clearBtn").addEventListener("click", () => setAllOres(false));

/* ============ CALCULATE ============ */

document.getElementById("calcBtn").addEventListener("click", () => {
  const currentLevelInput = parseInt(document.getElementById("currentLevel").value, 10);
  const currentXpInput = parseFloat(document.getElementById("currentXp").value);
  const target = parseInt(document.getElementById("targetLevel").value, 10);
  const targetXpInput = parseFloat(document.getElementById("targetXp").value);
  const xpPerAction = parseFloat(document.getElementById("xpPerAction").value) || 0;
  const out = document.getElementById("result");

  const usingCurrentXp = !isNaN(currentXpInput) && currentXpInput >= 0 &&
    document.getElementById("currentXp").value.trim() !== "";
  const usingTargetXp = !isNaN(targetXpInput) && targetXpInput > 0;

  // Starting XP and the level it corresponds to
  let startXp, current;
  if (usingCurrentXp) {
    startXp = currentXpInput;
    current = levelForXp(startXp);          // used for the "Usable?" checks
  } else {
    if (!currentLevelInput || currentLevelInput < 1 || currentLevelInput > 199) {
      out.textContent = "Enter a valid current level (1-199), or a Current XP value.";
      return;
    }
    current = currentLevelInput;
    startXp = totalXpForLevel(current);
  }

  // Target XP
  let targetXp;
  if (usingTargetXp) {
    targetXp = targetXpInput;
  } else {
    if (!target || target > 200 || target < 2) {
      out.textContent = "Enter a valid target level (2-200), or a Target XP value.";
      return;
    }
    targetXp = totalXpForLevel(target);
  }

  const xpNeeded = targetXp - startXp;
  if (xpNeeded <= 0) {
    out.textContent = "Your target is not higher than your current XP.";
    return;
  }

  let html = `<p><strong>XP needed:</strong> ${fmt(xpNeeded)}</p>`;

  // Generic XP per action (original feature)
  if (xpPerAction > 0) {
    html += `<p><strong>Actions needed:</strong> ${fmt(Math.ceil(xpNeeded / xpPerAction))}</p>`;
  }

  // Mining: combined plan + per-ore comparison
  const selected = selectedOreIndexes().map((i) => ({ ore: ORES[i], i }));
  if (selected.length > 0) {
    const log = LOGS[logSelect.value];
    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;

    // Combined plan (only when 2+ ores are selected)
    if (selected.length > 1) {
      const shares = selected.map(({ i }) => {
        const el = document.querySelector(`.mixInput[data-ore="${i}"]`);
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
              <td>${current >= ore.level ? "✅" : "❌ Lv " + ore.level}</td>
            </tr>`;
        });

        html += `
            <tr><td colspan="4"><strong>Total ores</strong></td><td><strong>${fmt(totalOres)}</strong></td><td></td></tr>
          </table>`;
      }
    }

    // Single-ore comparison
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
          <td>${current >= ore.level ? "✅" : "❌ Lv " + ore.level}</td>
        </tr>`;
    });

    html += `</table>
      <p class="note">Ore counts round up, so totals may overshoot your target by a few XP.</p>`;
  }

  out.innerHTML = html;
});

