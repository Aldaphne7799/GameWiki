// lookup.js: fetches the hiscores feed and fills the calculator for a character.

const FEED_URL = 'https://play.aldermere.online/hiscores/hiscores.json';
// If the browser reports a CORS error, switch to the proxy instead:
// const FEED_URL = '/api/hiscores';

const CACHE_MS = 60_000;

let cache = null;        // { feed, index }
let cacheTime = 0;
let lookupSkillId = null;
let busy = false;

const form   = document.getElementById('lookupForm');
const input  = document.getElementById('playerName');
const status = document.getElementById('lookupStatus');
const label  = document.getElementById('lookupLabel');
const button = document.getElementById('lookupBtn');

const ready = Boolean(form && input && status && label);
if (!ready) {
  console.warn('lookup.js: lookup bar elements not found; lookup disabled.');
}

// Surface otherwise-invisible errors on phones (no DevTools).
if (ready) {
  window.addEventListener('error', e => setStatus(`JS error: ${e.message}`, true));
  window.addEventListener('unhandledrejection', e =>
    setStatus(`Error: ${e.reason?.message || e.reason}`, true)
  );
}

function toPlayerList(feed) {
  if (Array.isArray(feed)) return feed;
  if (Array.isArray(feed?.players)) return feed.players;
  // Object keyed by name: { "Alice": {...}, "Bob": {...} }
  return Object.entries(feed).map(([name, p]) => ({ name, ...p }));
}

function buildIndex(feed) {
  const map = new Map();
  for (const p of toPlayerList(feed)) {
    if (p?.name != null) map.set(String(p.name).toLowerCase(), p);
  }
  return map;
}

async function getIndex() {
  if (cache && Date.now() - cacheTime < CACHE_MS) return cache.index;
  try {
    const res = await fetch(FEED_URL);
    if (!res.ok) throw new Error(`Couldn't load highscores (${res.status}).`);
    const feed = await res.json();
    cache = { feed, index: buildIndex(feed) };
    cacheTime = Date.now();
  } catch (err) {
    if (cache) return cache.index; // fall back to stale data
    throw err;
  }
  return cache.index;
}

function setStatus(msg, isError = false) {
  if (!status) return;
  status.textContent = msg;
  status.classList.toggle('error', isError);
}

// Called from calculator.js whenever a skill tile is clicked.
export function openLookup(skillId, skillName) {
  if (!ready) return;
  lookupSkillId = skillId;
  label.textContent = `Character name (${skillName || skillId})`;
  setStatus('');
  input.focus();
  input.select();
}

function applyToCalculator(level, xp) {
  const lvlEl = document.getElementById('currentLevel');
  const xpEl  = document.getElementById('currentXp');
  if (!lvlEl || !xpEl) throw new Error('Calculator fields not found.');

  // Order matters: calculator.js links level <-> XP, and a level "input" event
  // resets the XP field to the floor of that level. Set the level first, then
  // write the real XP afterwards so it isn't overwritten.
  lvlEl.value = level;
  lvlEl.dispatchEvent(new Event('input', { bubbles: true }));

  xpEl.value = xp;
  xpEl.dispatchEvent(new Event('input', { bubbles: true }));
}

async function runLookup() {
  const name = input.value.trim();
  if (!name || !lookupSkillId || busy) return;

  busy = true;
  if (button) button.disabled = true;
  setStatus('Loading…');
  try {
    const index = await getIndex();
    const player = index.get(name.toLowerCase());
    if (!player) throw new Error(`No player found named "${name}".`);

    const entry = player.skills?.[lookupSkillId];
    if (!Array.isArray(entry)) {
      throw new Error(`No ${lookupSkillId} data for ${player.name}.`);
    }

    const [level, xp] = entry;
    applyToCalculator(level, xp);
    setStatus(
      `${player.name}: ${lookupSkillId} level ${level}, ${Number(xp).toLocaleString()} XP`
    );
  } catch (err) {
    setStatus(err.message || 'Lookup failed.', true);
  } finally {
    busy = false;
    if (button) button.disabled = false;
  }
}

// A real <form> submit works with every mobile keyboard's Go/Search key.
form?.addEventListener('submit', e => {
  e.preventDefault();  // stop page reload
  runLookup();
  input.blur();        // dismiss keyboard so results are visible on phones
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter') runLookup();
});



input.addEventListener('keydown', e => {
  if (e.key === 'Enter') runLookup();
});
