const FEED_URL = 'https://play.aldermere.online/hiscores/hiscores.json';
const CACHE_MS = 60_000;
let cache = null, cacheTime = 0;
let lookupSkillId = null;

const input  = document.getElementById('playerName');
const status = document.getElementById('lookupStatus');
const label  = document.getElementById('lookupLabel');

async function getFeed() {
  if (cache && Date.now() - cacheTime < CACHE_MS) return cache;
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`Couldn't load highscores (${res.status}).`);
  cache = await res.json();
  cacheTime = Date.now();
  return cache;
}

function findPlayer(feed, name) {
  const target = name.trim().toLowerCase();
  const list = Array.isArray(feed) ? feed
             : Array.isArray(feed.players) ? feed.players
             : null;
  if (list) return list.find(p => String(p.name).toLowerCase() === target);
  const key = Object.keys(feed).find(k => k.toLowerCase() === target);
  return key ? feed[key] : undefined;
}

function setStatus(msg, isError = false) {
  status.textContent = msg;
  status.classList.toggle('error', isError);
}

// Called from calculator.js whenever a skill tile is clicked
export function openLookup(skillId, skillName) {
  lookupSkillId = skillId;
  label.textContent = `Character name (${skillName || skillId})`;
  setStatus('');
  input.focus();
  input.select();
}

function applyToCalculator(level, xp) {
  const lvlEl = document.getElementById('currentLevel');
  const xpEl  = document.getElementById('currentXp');
  // Set XP and fire "input" so your existing sync + hint handlers run
  xpEl.value = xp;
  xpEl.dispatchEvent(new Event('input', { bubbles: true }));
  // Set level afterwards so the exact hiscores level is shown
  lvlEl.value = level;
  lvlEl.dispatchEvent(new Event('input', { bubbles: true }));
}

async function runLookup() {
  const name = input.value.trim();
  if (!name || !lookupSkillId) return;
  setStatus('Loading…');
  try {
    const feed = await getFeed();
    const player = findPlayer(feed, name);
    if (!player) throw new Error(`No player found named "${name}".`);

    const entry = player.skills?.[lookupSkillId];
    if (!entry) throw new Error(`No ${lookupSkillId} data for ${player.name}.`);
    const [level, xp] = entry;

    applyToCalculator(level, xp);
    setStatus(`${player.name}: ${lookupSkillId} level ${level}, ${xp.toLocaleString()} XP`);
  } catch (err) {
    setStatus(err.message, true);
  }
}

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') runLookup();
});
