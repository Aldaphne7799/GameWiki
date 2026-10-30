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

// Highest level reached with a given total XP (inverse of totalXpForLevel)
function levelForXp(xp) {
  let level = 1;
  let total = 0;
  while (level < 200) {
    const next = total + stepXp(level);
    if (next > xp) break;
    total = next;
    level++;
  }
  return level;
}

const fmt = (n) => n.toLocaleString("en-US", { maximumFractionDigits: 1 });

/* ============ MINING DATA (verify against your spreadsheet) ============ */

/* ============ DATA ============ */

const SKILLS = [
  { id: "mining",      name: "Mining",      icon: "⛏️", active: true },
  { id: "smithing",    name: "Smithing",    icon: "🔨" },
  { id: "woodcutting", name: "Woodcutting", icon: "🪓" },
  { id: "fletching",   name: "Fletching",   icon: "🏹" },
  { id: "crafting",    name: "Crafting",    icon: "🧵" },
  { id: "alchemy",     name: "Alchemy",     icon: "⚗️" },
  { id: "fishing",     name: "Fishing",     icon: "🎣" },
  { id: "cooking",     name: "Cooking",     icon: "🍳" },
  { id: "firemaking",  name: "Firemaking",  icon: "🔥" },
  { id: "farming",     name: "Farming",     icon: "🌾" },
];

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

/* ============ ELEMENTS ============ */

const $ = (id) => document.getElementById(id);

const skillGrid = $("skillGrid");
const step2 = $("step2");
const step3 = $("step3");
const resultPanel = $("resultPanel");
const resultEl = $("result");

const currentLevelEl = $("currentLevel");
const currentXpEl = $("currentXp");
const targetLevelEl = $("targetLevel");
const targetXpEl = $("targetXp");

const logSelect = $("logSelect");
const oreGrid = $("oreGrid");
const mixSection = $("mixSection");
const mixInputs = $("mixInputs");
const mixTotal = $("mixTotal");

/* ============ STEP 1: SKILL GRID ============ */

SKILLS.forEach((skill) => {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "skill-tile" + (skill.active ? "" : " disabled");
  tile.dataset.skill = skill.id;
  tile.disabled = !skill.active;
  tile.innerHTML = `
    <span class="skill-icon">${skill.icon}</span>
    <span class="skill-name">${skill.name}</span>
    ${skill.active ? "" : '<span class="soon">Coming soon</span>'}`;
  if (skill.active) tile.addEventListener("click", () => selectSkill(skill.id));
  skillGrid.appendChild(tile);
});

function selectSkill(id) {
  document.querySelectorAll(".skill-tile").forEach((t) =>
    t.classList.toggle("selected", t.dataset.skill === id)
  );
  // Mining is the only skill with data for now
  step2.hidden = false;
  step3.hidden = false;
}

/* ============ SYNC LEVEL <-> XP (both directions, both pairs) ============ */

// Level -> XP: start of that level. XP -> Level: highest level reached.
// A flag prevents the two handlers from triggering each other in a loop.
function linkLevelAndXp(levelEl, xpEl, maxLevel) {
  let syncing = false;

  xpEl.addEventListener("input", () => {
    if (syncing) return;
    const raw = xpEl.value.trim();
    if (raw === "") return;
    const xp = parseFloat(raw);
    if (isNaN(xp) || xp < 0) return;
    syncing = true;
    levelEl.value = Math.min(levelForXp(xp), maxLevel);
    syncing = false;
  });

  levelEl.addEventListener("input", () => {
    if (syncing) return;
    const lvl = parseInt(levelEl.value, 10);
    if (isNaN(lvl) || lvl < 1 || lvl > maxLevel) return;
    syncing = true;
    xpEl.value = totalXpForLevel(lvl);
    syncing = false;
  });
}

linkLevelAndXp(currentLevelEl, currentXpEl, 199);
linkLevelAndXp(targetLevelEl, targetXpEl, 200);

[currentXpEl, targetXpEl].forEach((el) =>
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("calcBtn").click();
  })
);

/* ============ STEP 3: LOGS + ORES ============ */

LOGS.forEach((log, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = log.bonus ? `${log.name} (+${log.bonus}%)` : log.name;
  logSelect.appendChild(opt);
});

ORES.forEach((ore, i) => {
  const label = document.createElement("label");
  label.className = "ore-item";
  label.innerHTML = `
    <input type="checkbox" class="oreCheck" value="${i}" />
    <span class="ore-name">${ore.name}</span>
    <span class="ore-meta">Req. Lv ${ore.level} · ${ore.xp} XP</span>`;
  oreGrid.appendChild(label);
});

const selectedOreIndexes = () =>
  [...document.querySelectorAll(".oreCheck:checked")].map((c) => parseInt(c.value, 10));

// Visual hint (not a lock) for ores above the current level
function updateLevelHints() {
  const lvl = parseInt(currentLevelEl.value, 10) || 1;
  document.querySelectorAll(".ore-item").forEach((label, i) => {
    label.classList.toggle("above-level", lvl < ORES[i].level);
  });
}
currentLevelEl.addEventListener("input", updateLevelHints);
currentXpEl.addEventListener("input", updateLevelHints);
updateLevelHints();

/* ============ MANUAL PERCENTAGE SPLIT ============ */

function updateMixTotal() {
  const sum = [...document.querySelectorAll(".mixInput")]
    .reduce((s, el) => s + (parseFloat(el.value) || 0), 0);
  const ok = Math.abs(sum - 100) <= 0.05;
  mixTotal.textContent = `Total: ${sum.toFixed(1)}%` + (ok ? " ✅" : " (should be 100%)");
  mixTotal.classList.toggle("error", !ok);
}

// Keeps values the player already typed; only adds/removes rows.
// When a row has no value yet, the whole split is reset to an even suggestion.
function rebuildMixInputs() {
  const idx = selectedOreIndexes();

  // Remember what the player has typed so far
  const previous = {};
  document.querySelectorAll(".mixInput").forEach((el) => {
    previous[el.dataset.ore] = el.value;
  });

  mixInputs.innerHTML = "";

  if (idx.length < 2) {
    mixSection.hidden = true;
    return;
  }
  mixSection.hidden = false;

  const hasNew = idx.some((i) => previous[i] === undefined);
  const even = Math.round((100 / idx.length) * 10) / 10;

  idx.forEach((i, n) => {
    let value;
    if (hasNew && Object.keys(previous).length === 0) {
      // First time the split appears: even suggestion (last row takes the remainder)
      value = n === idx.length - 1
        ? Math.round((100 - even * (idx.length - 1)) * 10) / 10
        : even;
    } else {
      // Keep the player's number; brand new rows start empty
      value = previous[i] !== undefined ? previous[i] : "";
    }

    const row = document.createElement("label");
    row.className = "mix-row";
    row.innerHTML = `<span>${ORES[i].name}</span>
      <span><input type="number" class="mixInput" data-ore="${i}" min="0" max="100" step="0.1" value="${value}" placeholder="0" /> %</span>`;
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
$("selectAllBtn").addEventListener("click", () => setAllOres(true));
$("clearBtn").addEventListener("click", () => setAllOres(false));

/* ============ CALCULATE ============ */

$("calcBtn").addEventListener("click", () => {
  const currentLevelInput = parseInt(currentLevelEl.value, 10);
  const currentXpInput = parseFloat(currentXpEl.value);
  const target = parseInt(targetLevelEl.value, 10);
  const targetXpInput = parseFloat(targetXpEl.value);

  const showError = (msg) => {
    resultPanel.hidden = false;
    resultEl.innerHTML = `<p class="error">${msg}</p>`;
  };

  const usingCurrentXp = currentXpEl.value.trim() !== "" &&
    !isNaN(currentXpInput) && currentXpInput >= 0;
  const usingTargetXp = targetXpEl.value.trim() !== "" &&
    !isNaN(targetXpInput) && targetXpInput > 0;

  let startXp, current;
  if (usingCurrentXp) {
    startXp = currentXpInput;
    current = levelForXp(startXp);
  } else {
    if (!currentLevelInput || currentLevelInput < 1 || currentLevelInput > 199) {
      return showError("Enter a valid current level (1-199), or a Current XP value.");
    }
    current = currentLevelInput;
    startXp = totalXpForLevel(current);
  }

  let targetXp, endLevel;
  if (usingTargetXp) {
    targetXp = targetXpInput;
    endLevel = levelForXp(targetXp);
  } else {
    if (!target || target > 200 || target < 2) {
      return showError("Enter a valid target level (2-200), or a Target XP value.");
    }
    targetXp = totalXpForLevel(target);
    endLevel = target;
  }

  const xpNeeded = targetXp - startXp;
  if (xpNeeded <= 0) {
    return showError("Your target is not higher than your current XP.");
  }

  // Summary bar (start -> end)
  let html = `
    <div class="projected">
      <div class="proj-end"><span class="proj-num">${current}</span><span class="proj-label">Start</span></div>
      <div class="proj-mid">
        <span class="proj-xp">+${fmt(xpNeeded)} XP</span>
        <span class="proj-levels">+${endLevel - current} levels</span>
      </div>
      <div class="proj-end"><span class="proj-num">${endLevel}</span><span class="proj-label">End</span></div>
    </div>`;

  const selected = selectedOreIndexes().map((i) => ({ ore: ORES[i], i }));

  if (selected.length > 0) {
    const log = LOGS[logSelect.value];
    const title = `${log.name}${log.bonus ? ` +${log.bonus}%` : ""}`;

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
  } else {
    html += `<p class="note">Select at least one ore in step 3 to see how many you need.</p>`;
  }

  resultEl.innerHTML = html;
  resultPanel.hidden = false;
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});


