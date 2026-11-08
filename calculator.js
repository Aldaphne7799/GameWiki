import { totalXpForLevel, levelForXp, fmt } from "./xp.js";
import { LOGS } from "./logs.js";
import { SKILLS } from "./skills/index.js";
import { openLookup } from "./lookup.js";

/* ============ ELEMENTS ============ */

const $ = (id) => document.getElementById(id);

const skillGrid = $("skillGrid");
const step2 = $("step2");
const step3 = $("step3");
const step3Title = $("step3Title");
const skillTask = $("skillTask");
const resultPanel = $("resultPanel");
const resultEl = $("result");

const currentLevelEl = $("currentLevel");
const currentXpEl = $("currentXp");
const targetLevelEl = $("targetLevel");
const targetXpEl = $("targetXp");

const logSelect = $("logSelect");

let activeSkill = null;

/* ============ STEP 1: SKILL GRID ============ */

SKILLS.forEach((skill) => {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "skill-tile" + (skill.active ? "" : " disabled");
  tile.dataset.skill = skill.id;
  tile.disabled = !skill.active;
    // If the icon looks like an image address or file path, draw a picture;
  // otherwise treat it as an emoji/text.
  const isImage = /^(https?:\/\/|\/|\.\/|\.\.\/)/.test(skill.icon);
  const iconHtml = isImage
    ? `<img src="${skill.icon}" alt="" width="40" height="40"
         onerror="this.replaceWith(document.createTextNode('?'))" />`
    : skill.icon;

  tile.innerHTML = `
    <span class="skill-icon">${iconHtml}</span>
    <span class="skill-name">${skill.name}</span>
    ${skill.active ? "" : '<span class="soon">Coming soon</span>'}`;

  if (skill.active) tile.addEventListener("click", () => selectSkill(skill.id));
  skillGrid.appendChild(tile);
});

function selectSkill(id) {
  const skill = SKILLS.find((s) => s.id === id);
  if (!skill || !skill.active) return;

  document.querySelectorAll(".skill-tile").forEach((t) =>
    t.classList.toggle("selected", t.dataset.skill === id)
  );

  // Only re-render if the skill actually changed (preserves ore selection on re-click)
  if (activeSkill !== skill) {
    activeSkill = skill;
    step3Title.textContent = `3. ${skill.taskTitle}`;
    skillTask.innerHTML = "";
    skill.renderTask(skillTask);
    notifyLevelChange();
  }

  step2.hidden = false;
  step3.hidden = false;

  // Show the character lookup for this skill (must come after step2 is visible
  // so the name box can receive focus)
  openLookup(skill.id, skill.name);
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

  // Keep existing XP if it already falls within this level
  const xp = parseFloat(xpEl.value);
  if (!isNaN(xp) && levelForXp(xp) === lvl) return;

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

/* ============ LEVEL CHANGE -> ACTIVE SKILL HINTS ============ */

function notifyLevelChange() {
  if (!activeSkill) return;
  const lvl = parseInt(currentLevelEl.value, 10) || 1;
  activeSkill.onLevelChange(lvl);
}
currentLevelEl.addEventListener("input", notifyLevelChange);
currentXpEl.addEventListener("input", notifyLevelChange);

/* ============ LOGS (global bonus, applies to all skills) ============ */

LOGS.forEach((log, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = log.bonus ? `${log.name} (+${log.bonus}%)` : log.name;
  logSelect.appendChild(opt);
});

/* ============ CALCULATE ============ */

$("calcBtn").addEventListener("click", () => {
  const showError = (msg) => {
    resultPanel.hidden = false;
    resultEl.innerHTML = `<p class="error">${msg}</p>`;
  };

  if (!activeSkill) return showError("Pick a skill first.");

  const currentLevelInput = parseInt(currentLevelEl.value, 10);
  const currentXpInput = parseFloat(currentXpEl.value);
  const target = parseInt(targetLevelEl.value, 10);
  const targetXpInput = parseFloat(targetXpEl.value);

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
  const summary = `
    <div class="projected">
      <div class="proj-end"><span class="proj-num">${current}</span><span class="proj-label">Start</span></div>
      <div class="proj-mid">
        <span class="proj-xp">+${fmt(xpNeeded)} XP</span>
        <span class="proj-levels">+${endLevel - current} levels</span>
      </div>
      <div class="proj-end"><span class="proj-num">${endLevel}</span><span class="proj-label">End</span></div>
    </div>`;

  const log = LOGS[parseInt(logSelect.value, 10) || 0];
  const skillHtml = activeSkill.calculate({ xpNeeded, currentLevel: current, startXp, log });

  resultEl.innerHTML = summary + skillHtml;
  resultPanel.hidden = false;
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});


