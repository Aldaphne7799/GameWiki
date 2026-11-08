// lookup.js: fetches the hiscores feed and fills the calculator for a character.
// Once a character has been looked up, switching skills auto-updates level/XP.

const FEED_URL = 'https://play.aldermere.online/hiscores/hiscores.json';
// If the browser reports a CORS error, switch to the proxy instead:
// const FEED_URL = '/api/hiscores';

const CACHE_MS = 60_000;
const STORAGE_KEY = 'lookup:lastPlayer';

let cache = null;          // { feed, index }
let cacheTime = 0;
let lookupSkillId = null;
let lookupSkillName = null;
let activePlayerName = null; // name of the last successfully looked-up character
let busy = false;
let requestToken = 0;        // guards against out-of-order async results

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

/* ---------- Feed handling ---------- */

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

/* ---------- UI helpers ---------- */

function setStatus(msg, isError = false) {
  if (!status) return;
  status.textContent = msg;
  status.classList.toggle('error', isError);
}

function setBusy(isBusy) {
  busy = isBusy;
  if (button) button.disabled = isBusy;
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

function saveLastPlayer(name) {
  try { localStorage.setItem(STORAGE_KEY, name); } catch { /* storage blocked */ }
}

function loadLastPlayer() {
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

/* ---------- Core lookup ---------- */

/**
 * Looks up `name` for the current skill and fills the calculator.
 * `auto` = true when triggered by a skill swap (quieter, keeps focus).
 */
async function performLookup(name, { auto = false } = {}) {
  if (!name || !lookupSkillId) return;

  const token = ++requestToken; // newer requests invalidate older ones
  const skillId = lookupSkillId;

  setBusy(true);
  setStatus(auto ? `Updating ${lookupSkillName || skillId}…` : 'Loading…');

  try {
    const index = await getIndex();
    const player = index.get(name.toLowerCase());
    if (!player) throw new Error(`No player found named "${name}".`);

    const entry = player.skills?.[skillId];
    if (!Array.isArray(entry)) {
      throw new Error(`No ${skillId} data for ${player.name}.`);
    }

    // If the user swapped skills again while we were loading, drop this result.
    if (token !== requestToken) return;

    const [level, xp] = entry;
    applyToCalculator(level, xp);

    activePlayerName = player.name;
    input.value = player.name;
    saveLastPlayer(player.name);

    setStatus(
      `${player.name}: ${skillId} level ${level}, ${Number(xp).toLocaleString()} XP`
    );
  } catch (err) {
    if (token !== requestToken) return;
    setStatus(err.message || 'Lookup failed.', true);
  } finally {
    if (token === requestToken) setBusy(false);
  }
}

/* ---------- Public API (called from calculator.js) ---------- */

// Called whenever a skill tile is clicked.
export function openLookup(skillId, skillName) {
  if (!ready) return;

  lookupSkillId = skillId;
  lookupSkillName = skillName || skillId;
  label.textContent = `Character name (${lookupSkillName})`;

  // A character was already looked up: auto-fill this skill, no typing needed.
  if (activePlayerName) {
    performLookup(activePlayerName, { auto: true });
    return;
  }

  // First time: prefill the last-used name (if any) and wait for the user.
  setStatus('');
  const remembered = loadLastPlayer();
  if (remembered && !input.value) input.value = remembered;
  input.focus();
  input.select();
}

/* ---------- Events ---------- */

// A real <form> submit works with every mobile keyboard's Go/Search key.
// (This also covers Enter on desktop, so no separate keydown handler is needed.)
form?.addEventListener('submit', e => {
  e.preventDefault(); // stop page reload
  performLookup(input.value.trim());
  input.blur();       // dismiss keyboard so results are visible on phones
});

// If the user edits the name, stop auto-updating for the old character
// until they press Look up again with the new name.
input?.addEventListener('input', () => {
  if (activePlayerName && input.value.trim().toLowerCase() !== activePlayerName.toLowerCase()) {
    activePlayerName = null;
  }
});




input.addEventListener('keydown', e => {
  if (e.key === 'Enter') runLookup();
});
