// EZ LIFE STYLE TRACKER — app logic (vanilla JS module).
import { GYM, EMERGENCY, PLYO, CORE, BASKETBALL, RECOVERY_ROUTINES, CHECKLIST, QUOTES } from './program.js';
import { blankState, normalizeState, mergeStates, migrateV4, stableString, SCHEMA_VERSION } from './merge.js';
import { MEALS, MEAL_NAMES, UNITS, MACROS, targetFor, sumMacros, scaleMacros, macroProgress, defaultMealForTime, round1 } from './nutrition.js';

// ---------- constants ----------
const KEY = 'ez_tracker_v5';            // current state (schema v5)
const KEY_V4 = 'ez76_tracker_v4';       // legacy state — read for migration, never modified or deleted
const SIDEBAR_KEY = 'ez76_sidebar_collapsed';
const DIRTY_KEY = 'ez_sync_dirty';
const API = '/api/state';
const START = '2026-10-22';             // Day 1 (program start). Streak, consistency, weekly stats and start weight count from here. No end date.
const TARGET_KG = 76, GYM_WEEK_TARGET = 4; // nutrition targets are date-effective: see targetsOn()
const EZTheme = window.EZTheme; // from js/theme.js
const THEMES = Object.fromEntries(EZTheme.THEMES.map(([id, , color]) => [id, color]));
const THEME_NAMES = Object.fromEntries(EZTheme.THEMES.map(([id, name]) => [id, name]));
const TRAINING_TYPES = ['gym', 'plyo', 'core', 'basketball', 'match', 'running'];
const PAGE_TITLES = { dashboard: 'Dashboard', sessions: 'GYM', plyo: 'Plyometrics', core: 'Core', basketball: 'Basketball', running: 'Running', nutrition: 'Nutrition', recovery: 'Recovery', tracking: 'Logs' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = x => String(x ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }

// ---------- local dates (never UTC) ----------
const pad = n => String(n).padStart(2, '0');
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => keyOf(new Date());
const toDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = toDate(k); d.setDate(d.getDate() + n); return keyOf(d); };
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 864e5);
const weekStart = k => addDays(k, -((toDate(k).getDay() + 6) % 7)); // Monday
const weekDays = k => { const s = weekStart(k); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); };
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const dow = k => DOW[toDate(k).getDay()];
const fmtLong = k => toDate(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtDMY = k => toDate(k).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDM = k => toDate(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const weekdayLong = k => toDate(k).toLocaleDateString(undefined, { weekday: 'long' });
const dayNumber = (k = today()) => daysBetween(START, k) + 1;
const startsIn = (n = dayNumber()) => (n === 0 ? 'Starts tomorrow' : `Starts in ${1 - n} days`); // only for n < 1
const maxDate = (a, b) => (a > b ? a : b);
const isDateKey = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
const nowIso = () => new Date().toISOString();
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-${Math.random().toString(36).slice(2, 10)}`);
const fmtNum = (n, d = 0) => Number(n).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
function fmtDuration(min) { const s = Math.round(min * 60), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`; }

// ---------- state ----------
let S = loadState();
let localGen = 0;

function loadState() {
  const raw = lsGet(KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw), s = normalizeState(parsed);
      // v5 → v6 (old one-per-day nutrition → "Daily total (legacy)" food item) happens in normalizeState;
      // save the converted state and queue a sync so other devices / the server get it too.
      if (parsed?.schemaVersion !== SCHEMA_VERSION && (parsed?.activities || []).some(a => a?.type === 'nutrition')) { lsSet(KEY, JSON.stringify(s)); lsSet(DIRTY_KEY, '1'); }
      return s;
    }
    catch (e) { console.error('Stored state unreadable; keeping a copy and rebuilding', e); lsSet(`${KEY}_unreadable_${Date.now()}`, raw); }
  }
  // First run on schema v5: migrate legacy v4 data (the v4 key is left untouched as a fallback copy).
  let s = blankState();
  const v4 = lsGet(KEY_V4);
  if (v4) { try { s = migrateV4(JSON.parse(v4)); } catch (e) { console.error('v4 migration failed', e); } }
  lsSet(KEY, JSON.stringify(s));
  if (s.activities.length || Object.keys(s.checks).length) lsSet(DIRTY_KEY, '1');
  return s;
}

function persist() {
  S.schemaVersion = SCHEMA_VERSION;
  const ok = lsSet(KEY, JSON.stringify(S));
  localGen++;
  lsSet(DIRTY_KEY, '1');
  if (!ok) toast('Could not save on this device (storage full or blocked). Cloud sync will still try.');
  scheduleSync();
}

function addActs(recs) {
  const t = nowIso();
  const made = recs.map(r => ({ id: uid(), createdAt: t, updatedAt: t, ...r }));
  S.activities.push(...made);
  persist();
  return made;
}
function removeActs(ids) {
  const set = new Set(ids), t = nowIso();
  S.activities = S.activities.filter(a => !set.has(a.id));
  ids.forEach(id => { S.deleted[id] = t; });
  persist();
}
function upsertAct(rec) {
  const r = { ...rec, updatedAt: nowIso() };
  const i = S.activities.findIndex(a => a.id === r.id);
  if (i >= 0) S.activities[i] = r; else S.activities.push(r);
  delete S.deleted[r.id];
  persist();
  return r;
}
const actsOn = (date, types) => S.activities.filter(a => a.date === date && (!types || types.includes(a.type)));
const actsIn = (from, to, types) => S.activities.filter(a => a.date >= from && a.date <= to && (!types || types.includes(a.type)));
const byTime = (a, b) => a.date.localeCompare(b.date) || String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
// Daily check-in values (weight, sleep) are one value per date. The canonical record for a date is the
// most recently updated one; older same-date duplicates (e.g. from two offline devices) are never
// deleted automatically — they are only superseded, and replaced when the user changes that day's value.
const byUpdated = (a, b) => String(a.updatedAt || a.createdAt || '').localeCompare(String(b.updatedAt || b.createdAt || '')) || a.id.localeCompare(b.id);
const dailyValue = (type, date) => actsOn(date, [type]).sort(byUpdated).pop() || null;
function canonicalSeries(type, valid) {
  const byDate = new Map();
  for (const a of S.activities) if (a.type === type && valid(a)) { const p = byDate.get(a.date); if (!p || byUpdated(p, a) < 0) byDate.set(a.date, a); }
  return [...byDate.values()].sort(byTime);
}
const weights = () => canonicalSeries('weight', a => Number(a.details?.kg) > 0);
const sleepOn = d => { const a = dailyValue('sleep', d); return a && Number(a.details?.hours) >= 0 ? a : null; };
// Food log: one 'food' activity per item; targets come from S.targets by effective date.
const foodOn = d => actsOn(d, ['food']);
const dayTotals = d => sumMacros(foodOn(d).map(a => a.details || {}));
const targetsOn = d => targetFor(S.targets, d);
const dayProtein = d => dayTotals(d).protein;
const dayCalories = d => dayTotals(d).kcal;
// Checklist auto-ticks come from the day's logs (so they sync with the logs). autoTick() returns the newest matching log's
// timestamp, or '' when nothing on that day qualifies. A manual untick made after that log keeps the item off; a manual tick
// stays on even if the log is later deleted. steps / creatine / tomorrow have no matching log and stay manual.
const AUTO_TYPES = { gym: ['gym'], sport: ['basketball', 'match', 'running'], plyo: ['plyo'], core: ['core'] };
const lastStamp = list => list.reduce((m, a) => { const x = a.updatedAt || a.createdAt || ''; return x > m ? x : m; }, '') || '0';
function autoTick(d, k) {
  if (AUTO_TYPES[k]) { const a = actsOn(d, AUTO_TYPES[k]); return a.length ? lastStamp(a) : ''; }
  if (k === 'protein') { const f = foodOn(d); return f.length && dayProtein(d) >= targetsOn(d).protein ? lastStamp(f) : ''; }
  if (k === 'sleep') { const sl = sleepOn(d); return sl && sl.details.hours >= SLEEP_TARGET ? lastStamp([sl]) : ''; }
  return '';
}
const checked = (d, k) => {
  const m = S.checks[d]?.[k], a = autoTick(d, k);
  if (a && !(m && !m.v && m.t > a)) return true;
  return !!m?.v;
};

// ---------- programs ----------
const KINDS = {
  gym: { list: GYM, type: 'gym', subtype: 'session', mount: '#gymList', label: p => `Session ${p.code}`, name: p => `Session ${p.code} — ${p.name}` },
  emergency: { list: EMERGENCY, type: 'gym', subtype: 'emergency', mount: '#emergencyList', label: p => p.name, name: p => p.name },
  plyo: { list: PLYO, type: 'plyo', mount: '#plyoList', label: p => p.code, name: p => `${p.code} — ${p.name}` },
  core: { list: CORE, type: 'core', mount: '#coreList', label: p => p.code, name: p => `${p.code} — ${p.name}` },
  basketball: { list: BASKETBALL, type: 'basketball', mount: '#bbList', label: p => p.code, name: p => `${p.code} — ${p.name}` },
};
const PAGE_KINDS = { sessions: ['gym', 'emergency'], plyo: ['plyo'], core: ['core'], basketball: ['basketball'] };
const WEEK_TYPES = { sessions: ['gym'], plyo: ['plyo'], core: ['core'], basketball: ['basketball', 'match'], recovery: ['recovery', 'meditation'] };

// YouTube: try the app, fall back to web search results.
export function createYouTubeSearchLink(name) {
  const q = encodeURIComponent(name);
  const web = `https://www.youtube.com/results?search_query=${q}`;
  return {
    web,
    ios: `youtube://www.youtube.com/results?search_query=${q}`,
    android: `intent://www.youtube.com/results?search_query=${q}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(web)};end`,
  };
}
function openYouTube(name) {
  const link = createYouTubeSearchLink(name);
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (/Android/i.test(ua)) { location.href = link.android; return; }
  if (isIOS) {
    let left = false;
    const onHide = () => { if (document.hidden) left = true; };
    document.addEventListener('visibilitychange', onHide);
    location.href = link.ios;
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHide);
      if (!left && !document.hidden) location.href = link.web; // app not installed / not handled
    }, 1400);
    return;
  }
  window.open(link.web, '_blank', 'noopener');
}
const ytLink = name => `<a class="yt" href="${esc(createYouTubeSearchLink(name).web)}" data-yt="${esc(name)}" target="_blank" rel="noopener" title="Search “${esc(name)}” on YouTube"><svg class="i" aria-hidden="true"><use href="#i-play"/></svg>${esc(name)}</a>`;

function exRow(it) {
  return `<label class="ex"><input type="checkbox" data-name="${esc(it.n)}" data-meta="${esc(it.d)}"><span class="ex-main">${ytLink(it.n)}${it.p ? '<span class="pow">POWER</span>' : ''}<span class="ex-d">${esc(it.d)}${it.r ? ` · Rest ${esc(it.r)}` : ''}</span>${it.c ? `<span class="ex-c">${esc(it.c)}</span>` : ''}</span></label>`;
}
const part = (title, items) => `<div class="prog-part"><h4>${esc(title)}</h4>${items.map(exRow).join('')}</div>`;

function progCard(kind, p) {
  const K = KINDS[kind];
  let title, body = '', meta = '', notes = '';
  if (kind === 'gym') {
    title = `SESSION ${p.code} — ${p.name}`;
    meta = `<div class="prog-meta"><span class="chip">${esc(p.focus)}</span><span class="chip grey">~2 hours</span></div><p class="small"><b>Warm-up:</b> ${esc(p.warmup)}</p>`;
    body = p.parts.map(x => part(x.title, x.items)).join('');
  } else if (kind === 'emergency') {
    title = p.name;
    meta = `<p class="small" style="margin-top:12px">${esc(p.summary)}</p>`;
    body = part('Circuit', p.items);
  } else if (kind === 'plyo') {
    title = `${p.code} — ${p.name}`;
    meta = `<div class="prog-meta"><span class="chip">${esc(p.level)}</span><span class="chip grey">${esc(p.time)}</span><span class="chip grey">${esc(p.focus)}</span></div><p class="small"><b>Purpose:</b> ${esc(p.purpose)}</p>`;
    body = part('Exercises', p.items);
    notes = `<div class="prog-notes"><div><b>Progression:</b> ${esc(p.progression)}</div><div><b>Regression:</b> ${esc(p.regression)}</div><div><b>Safety:</b> ${esc(p.safety)}</div></div>`;
  } else if (kind === 'core') {
    title = `${p.code} — ${p.name}`;
    meta = `<div class="prog-meta"><span class="chip grey">5–10 min</span><span class="chip grey">Rest: ${esc(p.rest)}</span></div><p class="small"><b>Purpose:</b> ${esc(p.purpose)}</p>`;
    body = part('Exercises', p.items);
    notes = `<div class="prog-notes"><div><b>Progression:</b> ${esc(p.progression)}</div><div><b>Regression:</b> ${esc(p.regression)}</div></div>`;
  } else {
    title = `${p.code} — ${p.name}`;
    meta = `<div class="prog-meta"><span class="chip grey">${esc(p.time)}</span></div><p class="small"><b>Prescription:</b> ${esc(p.summary)}</p>`;
    body = p.blocks.map(b => part(b.t, b.items)).join('');
  }
  return `<details class="prog" data-kind="${kind}" data-code="${esc(p.code)}" id="card-${kind}-${esc(p.code)}">
<summary><span class="prog-code">${esc(p.code)}</span><span class="prog-title"><b>${esc(title)}</b><span class="prog-status"></span></span><span class="chev" aria-hidden="true"><svg class="i"><use href="#i-down"/></svg></span></summary>
<div class="prog-body">${meta}${body}${notes}
<div class="prog-foot"><span class="lock-msg" aria-live="polite"></span><div class="row"><button type="button" class="btn btn-sm" data-action="select-all">Select all</button><button type="button" class="btn btn-primary" data-action="log-prog">LOG ${esc(K.label(p).toUpperCase())}</button></div></div></div></details>`;
}

function buildPrograms() {
  for (const [kind, K] of Object.entries(KINDS)) $(K.mount).innerHTML = K.list.map(p => progCard(kind, p)).join('');
}

function weekRecord(kind, code, ref = today()) {
  const K = KINDS[kind], ws = weekStart(ref), we = addDays(ws, 6);
  return S.activities.find(a => a.type === K.type && a.code === code && a.date >= ws && a.date <= we && (kind !== 'emergency' || a.subtype === 'emergency') && (kind !== 'gym' || a.subtype !== 'emergency'));
}

function updateLocks(kind) {
  const K = KINDS[kind], nextMon = addDays(weekStart(today()), 7);
  for (const det of $$(`details.prog[data-kind="${kind}"]`)) {
    const p = K.list.find(x => x.code === det.dataset.code);
    const a = weekRecord(kind, det.dataset.code);
    det.classList.toggle('locked', !!a);
    $$('input[type=checkbox]', det).forEach(i => { i.disabled = !!a; });
    $('[data-action="select-all"]', det).disabled = !!a;
    const btn = $('[data-action="log-prog"]', det);
    btn.disabled = !!a;
    $('.prog-status', det).innerHTML = a
      ? `<span class="chip ok" style="margin-top:4px">${ICON('check')}Done ${dow(a.date)} ${esc(fmtDM(a.date))}</span> <span class="chip grey" style="margin-top:4px"><svg class="i" style="width:13px;height:13px"><use href="#i-lock"/></svg>Available Mon ${esc(fmtDM(nextMon))}</span>`
      : '';
    $('.lock-msg', det).textContent = a ? `${K.label(p)} was logged this week (${dow(a.date)}). It unlocks again on Monday ${fmtDM(nextMon)}.` : '';
  }
}

// ---------- labels & record text ----------
function shortLabel(a) {
  switch (a.type) {
    case 'gym': return a.subtype === 'emergency' ? String(a.name || 'Home').replace('Emergency ', '') : `Session ${a.code}`;
    case 'match': return 'Match Day';
    case 'plyo': case 'core': case 'basketball': return a.code || a.name;
    case 'running': return a.details?.distance ? `Run ${fmtNum(a.details.distance, 1)} km` : 'Run';
    case 'food': return a.name || 'Food';
    case 'meditation': return `Meditation${a.details?.minutes ? ` ${a.details.minutes}m` : ''}`;
    case 'recovery': return a.name || 'Recovery';
    case 'rest': return 'Rest';
    case 'weight': return `${fmtNum(a.details?.kg, 1)} kg`;
    case 'sleep': return `Sleep ${fmtNum(a.details?.hours, 1)} h`;
    default: return a.name || a.type;
  }
}
function recordBody(a) {
  const d = a.details || {};
  const items = Array.isArray(d.items) ? d.items : [];
  switch (a.type) {
    case 'gym': case 'plyo': case 'core': case 'basketball':
      return items.length ? items.map(i => `<div class="ck">${ICON('check')}${esc(i.name)}${i.meta ? ` — ${esc(i.meta)}` : ''}</div>`).join('') : (d.text ? `<div>${esc(d.text)}</div>` : '');
    case 'match': return `<div>${d.court === 'full' ? 'Full Court' : 'Half Court'} · ${esc(d.minutes)} min played</div>`;
    case 'running': {
      if (!(d.distance > 0 && d.time > 0)) return `<div>${esc(d.text || '')}</div>`;
      return `<div>${fmtNum(d.distance, 2)} km · ${fmtDuration(d.time)} · Pace ${fmtDuration(d.time / d.distance)}/km</div>${d.notes ? `<div class="ck">${esc(d.notes)}</div>` : ''}`;
    }
    case 'food': return `<div>${esc(macroLine(d))}</div>`;
    case 'meditation': return `<div>${esc(d.minutes)} min</div>`;
    case 'recovery': return `<div>Completed</div>${items.length ? items.map(i => `<div class="ck">${ICON('check')}${esc(i)}</div>`).join('') : ''}`;
    case 'rest': return '<div>Planned rest day</div>';
    case 'weight': return `<div>Weight: ${fmtNum(d.kg, 1)} kg</div>`;
    case 'sleep': return `<div>Sleep: ${fmtNum(d.hours, 1)} hrs</div>`;
    default: return d.text ? `<div>${esc(d.text)}</div>` : '';
  }
}
function recordTitle(a) {
  if (a.type === 'match') return 'Match Day';
  if (a.type === 'meditation') return 'Meditation';
  if (a.type === 'weight') return 'Bodyweight';
  if (a.type === 'sleep') return 'Sleep';
  if (a.type === 'running') return 'Run';
  if (a.type === 'food') return `${a.name || 'Food'}${qtyText(a.details) ? ` · ${qtyText(a.details)}` : ''}`;
  if (a.type === 'rest') return 'Rest Day';
  return a.name || a.type;
}

// ---------- toast + undo ----------
let toastTimer = null, toastUndo = null, toastSwipe = null, toastGen = 0;
const TOAST_MS = 3000; // every toast (incl. UNDO) auto-dismisses after 3 s; swipe sideways or down to dismiss sooner
function toast(msg, undoFn) {
  const el = $('#toast');
  // a leading "✓ " in a message becomes the check icon
  const done = msg.startsWith('✓ ');
  $('#toastIcon').style.display = done ? '' : 'none';
  $('#toastMsg').textContent = done ? msg.slice(2) : msg;
  toastUndo = undoFn || null;
  $('#toastUndo').hidden = !undoFn;
  toastGen++; toastSwipe = null;
  el.classList.remove('dragging'); el.style.transform = el.style.opacity = '';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, TOAST_MS);
}
function hideToast() { clearTimeout(toastTimer); const el = $('#toast'); el.classList.remove('show', 'dragging'); el.style.transform = el.style.opacity = ''; toastUndo = null; toastSwipe = null; }
{
  const el = $('#toast');
  el.addEventListener('pointerdown', e => {
    if (!el.classList.contains('show') || e.target.closest('#toastUndo')) return;
    toastSwipe = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
    clearTimeout(toastTimer); // hold while the finger is down
    el.setPointerCapture?.(e.pointerId);
    el.classList.add('dragging');
  });
  el.addEventListener('pointermove', e => {
    if (!toastSwipe) return;
    const dx = e.clientX - toastSwipe.x, dy = Math.max(0, e.clientY - toastSwipe.y);
    Object.assign(toastSwipe, { dx, dy });
    el.style.transform = `translate(calc(-50% + ${dx}px), ${dy}px)`;
    el.style.opacity = String(Math.max(0.2, 1 - Math.max(Math.abs(dx) / 220, dy / 120)));
  });
  const end = () => {
    if (!toastSwipe) return;
    const { dx, dy } = toastSwipe; toastSwipe = null;
    el.classList.remove('dragging');
    if (Math.abs(dx) > 60 || dy > 40) {
      const gen = toastGen;
      el.style.transform = Math.abs(dx) > 60 ? `translate(calc(-50% + ${dx > 0 ? 120 : -120}vw), 0)` : 'translate(-50%, 140%)';
      el.style.opacity = '0';
      setTimeout(() => { if (gen === toastGen) hideToast(); }, 200);
    } else {
      el.style.transform = el.style.opacity = '';
      toastTimer = setTimeout(hideToast, TOAST_MS);
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}
$('#toastUndo').addEventListener('click', () => { const f = toastUndo; hideToast(); if (f) f(); });

function logged(recs, msg) {
  const made = addActs(recs);
  render();
  toast(msg, () => { removeActs(made.map(r => r.id)); render(); toast('Undone — entry removed'); });
  return made;
}
function updated(prev, next, msg) {
  upsertAct(next);
  render();
  toast(msg, () => { upsertAct(prev); render(); toast('Undone — previous values restored'); });
}
// Several changes from one action (e.g. a daily check-in saving weight + sleep) undone together.
// ops: { add: rec } | { update: prev, next } | { remove: rec }
function applyOps(ops, msg) {
  const done = [];
  for (const op of ops) {
    if (op.add) done.push({ added: addActs([op.add])[0] });
    else if (op.update) { upsertAct(op.next); done.push({ prev: op.update }); }
    else if (op.remove) { removeActs([op.remove.id]); done.push({ removed: op.remove }); }
  }
  render();
  toast(msg, () => {
    for (const d of done.reverse()) {
      if (d.added) removeActs([d.added.id]);
      else if (d.prev) upsertAct(d.prev);
      else if (d.removed) upsertAct(d.removed);
    }
    render();
    toast('Undone — previous values restored');
  });
}

// ---------- sync (Cloudflare KV via /api/state) ----------
let syncTimer = null, syncing = false, syncAgain = false, lastSyncAt = null, syncState = 'idle';
function setSync(state, detail) {
  syncState = state;
  const text = {
    idle: 'Saved locally',
    syncing: 'Syncing…',
    synced: `Synced${lastSyncAt ? ` · ${lastSyncAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}` : ''}`,
    pending: 'Saved locally · Sync pending',
    offline: 'Offline · Saved locally',
    unavailable: 'Saved locally · Cloud unavailable',
  }[state] || state;
  for (const [pill, txt] of [['#syncPill', '#syncText'], ['#syncSide', '#syncSideText']]) {
    $(pill).dataset.sync = state === 'unavailable' ? 'error' : state;
    $(txt).textContent = text;
    $(pill).title = detail ? `${text} — ${detail}` : text;
  }
}
function scheduleSync(delay = 800) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay);
  if (!syncing) setSync(navigator.onLine ? 'pending' : 'offline');
}
async function syncNow() {
  if (syncing) { syncAgain = true; return; }
  if (!navigator.onLine) { setSync('offline'); return; }
  syncing = true;
  const gen = localGen;
  setSync('syncing');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    const res = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(S), cache: 'no-store', signal: ctrl.signal });
    clearTimeout(timer);
    if (res.status === 404 || res.status === 405 || res.status === 503) { setSync('unavailable', `server answered ${res.status}`); return; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || typeof data.state !== 'object') throw new Error('Unexpected response');
    // Merge (never replace): anything added locally while the request was in flight is kept.
    const merged = mergeStates(S, data.state);
    if (stableString(merged) !== stableString(S)) {
      S = merged;
      lsSet(KEY, JSON.stringify(S));
      render();
    }
    if (localGen === gen) lsSet(DIRTY_KEY, '0');
    lastSyncAt = new Date();
    setSync('synced');
  } catch (e) {
    console.warn('Sync failed — data is safe locally and will retry', e);
    setSync(navigator.onLine ? 'pending' : 'offline', String(e.message || e));
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; scheduleSync(300); }
  }
}

// ---------- theme (list + daily rotation live in js/theme.js) ----------
// "auto" = today's date-based theme; picking a theme stores {date, theme} and lasts only for today.
// Picker swatches (each theme's --a1 → --a2 accent pair, as defined in app.css).
const SWATCH = {
  purple: ['#6d3cf5', '#a87bff'], pink: ['#cf2470', '#f472b6'], cyan: ['#067894', '#22c3e6'], sunset: ['#b84f2b', '#eea27a'], arctic: ['#2a72a8', '#7cc8e8'],
  lavender: ['#6f55bd', '#9a86d6'], sage: ['#4b7457', '#6f9477'], sand: ['#86672a', '#a3813f'], clay: ['#a44d2c', '#cf7b56'], dawn: ['#b3505f', '#c8704f'],
  beige: ['#7b6243', '#a88b64'], cream: ['#856418', '#b8933a'], ivory: ['#5a6735', '#8a9a5b'], mint: ['#1d7556', '#3fa784'], sky: ['#2160c4', '#5b95e6'],
  mist: ['#4b5d73', '#7b8ca3'], blush: ['#b03858', '#d9718c'], peach: ['#b94f2a', '#e88b5f'], lilac: ['#7d43a3', '#ad7fcf'], pearl: ['#585c68', '#8e93a0'],
  linen: ['#95583a', '#c58a69'], oat: ['#7a6643', '#ab966e'], stone: ['#5b5850', '#8d887c'], ice: ['#1a7290', '#4fb0cc'], seafoam: ['#127a6f', '#3fb8a8'],
  butter: ['#806600', '#c9a227'], rosequartz: ['#9b4c76', '#c987ab'], chalk: ['#33404d', '#5d6b7a'], porcelain: ['#33509b', '#6a8bd1'], honeydew: ['#4a751d', '#80ab4a'],
};
function buildThemeSelect() {
  $('#themeSelect').innerHTML = `<option value="auto"></option><optgroup label="Themes">${EZTheme.THEMES.map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</optgroup>`;
  $('#tpList').innerHTML = `<li role="option" id="tp-auto" class="tp-daily" data-value="auto"><i></i><span class="tp-name">Daily theme</span><span class="tp-tag" id="tpDailyTag"></span><svg class="i tp-check" aria-hidden="true"><use href="#i-check"/></svg></li><li class="tp-sep" role="presentation"></li>`
    + EZTheme.THEMES.map(([id, name]) => `<li role="option" id="tp-${id}" data-value="${id}"><i style="background:linear-gradient(135deg,${SWATCH[id][0]},${SWATCH[id][1]})"></i><span class="tp-name">${name}</span><span class="tp-tag"></span><svg class="i tp-check" aria-hidden="true"><use href="#i-check"/></svg></li>`).join('');
}
// Visible picker state: the theme in use is highlighted (✓) — in Daily mode that is today's automatic theme.
function updatePicker(theme, mode) {
  const daily = EZTheme.dailyTheme(today()), dName = THEME_NAMES[daily], tName = THEME_NAMES[theme];
  $('#tpFull').textContent = mode === 'auto' ? `Daily · ${dName}` : tName;
  $('#tpShort').textContent = mode === 'auto' ? 'Daily' : tName;
  $('#tpBtn').setAttribute('aria-label', mode === 'auto' ? `Theme: Daily, today ${dName}` : `Theme: ${tName}, chosen for today`);
  $('#tpBtn').dataset.mode = mode;
  $('#tpDailyTag').textContent = dName.toUpperCase();
  for (const li of $$('#tpList li[data-value]')) {
    const v = li.dataset.value, current = v === theme;
    li.classList.toggle('is-current', current);
    li.setAttribute('aria-selected', String(mode === 'auto' ? v === 'auto' : current));
    if (v !== 'auto') li.querySelector('.tp-tag').textContent = v === daily ? 'TODAY' : '';
  }
}
const tpBtn = $('#tpBtn'), tpPop = $('#tpPop'), tpList = $('#tpList');
const tpItems = () => $$('#tpList li[data-value]');
function tpSetActive(li, scroll = true) {
  tpItems().forEach(x => x.classList.toggle('is-active', x === li));
  if (li) { tpList.setAttribute('aria-activedescendant', li.id); if (scroll) li.scrollIntoView({ block: 'nearest' }); }
}
function openPicker(viaKeyboard = false) {
  tpList.classList.toggle('kbd', viaKeyboard);
  tpPop.hidden = false;
  tpBtn.setAttribute('aria-expanded', 'true');
  const cur = $('#tpList li.is-current') || tpItems()[0];
  // open with the theme in use already in view (centred), no manual scrolling needed
  tpList.scrollTop = Math.max(0, cur.offsetTop - tpList.clientHeight / 2 + cur.offsetHeight / 2);
  tpSetActive(cur, false);
  tpList.focus({ preventScroll: true });
}
function closePicker(focusBtn = true) {
  if (tpPop.hidden) return;
  tpPop.hidden = true;
  tpBtn.setAttribute('aria-expanded', 'false');
  if (focusBtn) tpBtn.focus({ preventScroll: true });
}
function pickTheme(value) {
  const sel = $('#themeSelect');
  sel.value = value;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  closePicker();
}
tpBtn.addEventListener('click', () => (tpPop.hidden ? openPicker() : closePicker()));
tpList.addEventListener('click', e => { const li = e.target.closest('li[data-value]'); if (li) pickTheme(li.dataset.value); });
// Mouse hover is pure CSS (:hover); the keyboard marker (.is-active) moves only with the keys and is
// shown only after a key is used (.kbd), so neither ever touches the selected (.is-current) styling.
tpList.addEventListener('keydown', e => {
  const items = tpItems(), i = items.indexOf($('#tpList li.is-active'));
  const go = n => { e.preventDefault(); tpList.classList.add('kbd'); tpSetActive(items[Math.max(0, Math.min(items.length - 1, n))]); };
  if (e.key === 'ArrowDown') go(i + 1);
  else if (e.key === 'ArrowUp') go(i - 1);
  else if (e.key === 'Home') go(0);
  else if (e.key === 'End') go(items.length - 1);
  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[i]) pickTheme(items[i].dataset.value); }
  else if (e.key === 'Escape') { e.preventDefault(); closePicker(); }
  else if (e.key === 'Tab') closePicker(false);
});
tpBtn.addEventListener('keydown', e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openPicker(true); } });
document.addEventListener('pointerdown', e => { if (!tpPop.hidden && !e.target.closest('#themePicker')) closePicker(false); });
function applyTheme() {
  const { theme, mode } = EZTheme.resolve(today());
  document.documentElement.setAttribute('data-theme', theme);
  $('meta[name="theme-color"]').setAttribute('content', THEMES[theme]);
  const sel = $('#themeSelect'), daily = EZTheme.dailyTheme(today());
  sel.options[0].textContent = `Daily · ${THEME_NAMES[daily]}`;
  sel.value = mode === 'auto' ? 'auto' : theme;
  sel.title = mode === 'auto' ? `Today’s theme (${THEME_NAMES[daily]}) — changes daily` : `${THEME_NAMES[theme]} — chosen for today; the daily theme returns tomorrow`;
  updatePicker(theme, mode);
  drawCharts();
}

// ---------- sidebar / drawer ----------
const app = $('#app'), backdrop = $('#backdrop'), menuBtn = $('#menuBtn'), drawerToggle = $('#drawerToggle');
const mobileMQ = matchMedia('(max-width: 959px)');
const DRAWER_MS = 450; // keep in sync with --drawer-t in app.css
function setToggle(open) {
  drawerToggle.classList.toggle('is-open', open);
  drawerToggle.setAttribute('aria-expanded', String(open));
  drawerToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuBtn.setAttribute('aria-expanded', String(open));
}
function openDrawer() {
  app.classList.add('drawer-open');
  backdrop.hidden = false;
  requestAnimationFrame(() => backdrop.classList.add('show'));
  document.body.classList.add('lock');
  setToggle(true);
  setTimeout(() => { if (app.classList.contains('drawer-open')) $('#nav button.active')?.focus({ preventScroll: true }); }, DRAWER_MS);
}
function closeDrawer(focusBack = true) {
  if (!app.classList.contains('drawer-open')) return;
  app.classList.remove('drawer-open');
  backdrop.classList.remove('show');
  setTimeout(() => { if (!app.classList.contains('drawer-open')) backdrop.hidden = true; }, DRAWER_MS + 10);
  document.body.classList.remove('lock');
  setToggle(false);
  if (focusBack) drawerToggle.focus({ preventScroll: true });
}
function setCollapsed(c) {
  app.classList.toggle('collapsed', c);
  lsSet(SIDEBAR_KEY, c ? '1' : '0');
  requestAnimationFrame(drawCharts);
}
mobileMQ.addEventListener?.('change', () => closeDrawer(false));

// ---------- navigation ----------
// line icons from the inline SVG sprite in index.html (no emoji / glyph icons)
const ICON = (n, cls = 'i i-sm') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
let currentPage = 'dashboard';
function showPage(id, { scroll = true } = {}) {
  if (!PAGE_TITLES[id]) id = 'dashboard';
  currentPage = id;
  $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
  $$('#nav button[data-page]').forEach(b => { b.classList.toggle('active', b.dataset.page === id); b.setAttribute('aria-current', b.dataset.page === id ? 'page' : 'false'); });
  $$('#tabbar [data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === id); if (b.dataset.tab === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  $('#topTitle').textContent = PAGE_TITLES[id];
  document.title = id === 'dashboard' ? 'EZ LIFE STYLE TRACKER' : `${PAGE_TITLES[id]} · EZ LIFE STYLE TRACKER`;
  // "#/page" rather than "#page": a hash equal to a section id makes the browser jump to that section on load.
  try { history.replaceState(null, '', `#/${id}`); } catch { /* file:// or sandbox */ }
  if (scroll) window.scrollTo(0, 0);
  render();
}

// ---------- rendering ----------
function render() {
  renderChrome();
  ({
    dashboard: renderDashboard,
    sessions: () => { renderWeek('sessions'); updateLocks('gym'); updateLocks('emergency'); },
    plyo: () => { renderWeek('plyo'); updateLocks('plyo'); },
    core: () => { renderWeek('core'); updateLocks('core'); },
    basketball: () => { renderWeek('basketball'); updateLocks('basketball'); },
    running: renderRunning,
    nutrition: renderNutrition,
    recovery: renderRecovery,
    tracking: renderLogs,
  })[currentPage]?.();
}

function renderChrome() {
  const t = today(), n = dayNumber(t);
  $('#sideDate').textContent = toDate(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  $('#sideDay').textContent = n >= 1 ? `DAY ${n}` : startsIn(n).toUpperCase();
  for (const id of ['runDate', 'medDate']) {
    const el = $(`#${id}`);
    el.max = t;
    if (!el.value || el.dataset.auto === '1') { el.value = t; el.dataset.auto = '1'; }
  }
  // the protein target shown everywhere follows the target that applies today
  const pt = targetsOn(t).protein;
  $('#heroProtein').textContent = `${fmtNum(pt)} g`;
  const pl = $('#checklist [data-task="protein"] ~ .t');
  if (pl) pl.textContent = `${fmtNum(pt)} g protein`;
}

function renderWeek(page) {
  const el = $(`[data-week="${page}"]`);
  if (!el) return;
  const t = today(), days = weekDays(t), types = WEEK_TYPES[page];
  let count = 0;
  const cells = days.map(d => {
    const acts = actsOn(d, types).sort(byTime);
    const rest = actsOn(d, ['rest']).length > 0;
    count += acts.length;
    let cls, st;
    if (acts.length) { cls = 'done'; st = [...new Set(acts.map(shortLabel))].join(' + '); }
    else if (rest) { cls = 'rest'; st = 'Rest'; }
    else if (d > t) { cls = 'future'; st = '—'; }
    else if (d === t) { cls = ''; st = 'Today'; }
    else if (page === 'recovery' || d < START) { cls = ''; st = '—'; }
    else { cls = 'missed'; st = 'Missed'; }
    return `<div class="wd ${cls}${d === t ? ' today' : ''}"><div class="dn">${dow(d)}</div><div class="dd">${esc(fmtDM(d))}</div><div class="st">${esc(st)}</div></div>`;
  }).join('');
  const restToday = actsOn(t, ['rest'])[0];
  el.innerHTML = `<div class="card-h"><h2>THIS WEEK</h2><span class="chip grey">${esc(fmtDM(days[0]))} – ${esc(fmtDM(days[6]))} · resets Monday</span></div>
    <div class="week-strip">${cells}</div>
    <div class="week-foot"><span class="small">${count} logged this week · history is permanent</span>
    ${restToday ? `<button type="button" class="btn btn-sm" data-action="remove-rest" data-id="${esc(restToday.id)}">${ICON('check')}Rest day logged · Remove</button>`
    : `<button type="button" class="btn btn-sm btn-ghost" data-action="log-rest"><svg class="i"><use href="#i-moon"/></svg>LOG REST DAY (today)</button>`}</div>`;
}

// Sequential suggestion: continue after the last logged code, skipping anything done this week.
function nextUp(kind) {
  const K = KINDS[kind];
  const last = S.activities.filter(a => a.type === K.type && (kind !== 'gym' || a.subtype !== 'emergency')).sort(byTime).pop();
  const start = last ? K.list.findIndex(p => p.code === last.code) + 1 : 0;
  for (let i = 0; i < K.list.length; i++) {
    const p = K.list[(start + i) % K.list.length];
    if (!weekRecord(kind, p.code)) return p;
  }
  return null;
}

function renderDashboard() {
  const t = today(), n = dayNumber(t);
  $('#heroDate').textContent = fmtLong(t);
  $('#dashDate').textContent = fmtLong(t);
  $('#heroDayNum').textContent = n >= 1 ? n : '—';
  $('#heroDaySub').textContent = n >= 1 ? fmtDMY(t) : `${startsIn(n)} · ${fmtDMY(START)}`;
  renderWeightCard();
  renderCheckin();
  renderScorecard();
  renderMission();
  renderChecklist();
  renderSleepCard();
  renderNutritionCard();
  renderRecoveryCard();
  const q = QUOTES[(((n - 1) % QUOTES.length) + QUOTES.length) % QUOTES.length];
  $('#dailyQuote').textContent = q[1];
  $('#quoteAuthor').textContent = `— ${q[0]}`;
  renderFocus();
}

function renderWeightCard() {
  const w = weights(), t = today();
  const cur = w[w.length - 1], start = w.find(x => x.date >= START);
  $('#wCurrent').innerHTML = cur ? `${fmtNum(cur.details.kg, 1)}<small>kg</small>` : '—';
  $('#wStart').innerHTML = start ? `${fmtNum(start.details.kg, 1)}<small>kg</small>` : '—';
  const ch = $('#wChange');
  if (cur && start && cur !== start) {
    const diff = cur.details.kg - start.details.kg;
    ch.innerHTML = `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${fmtNum(Math.abs(diff), 1)}<small>kg</small>`;
    ch.className = `v ${diff < 0 ? 'good' : diff > 0 ? 'bad' : ''}`;
  } else { ch.textContent = '—'; ch.className = 'v'; }
  const ref = [...w].reverse().find(x => x.date <= addDays(t, -7));
  const wk = $('#wWeekly');
  if (cur && ref && cur !== ref) {
    const d = cur.details.kg - ref.details.kg;
    wk.textContent = `${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtNum(Math.abs(d), 1)} kg`;
    wk.className = d < 0 ? 'good' : d > 0 ? 'bad' : '';
  } else { wk.textContent = '—'; wk.className = ''; }
  $('#wToGo').textContent = cur ? (cur.details.kg > TARGET_KG ? `${fmtNum(cur.details.kg - TARGET_KG, 1)} kg to target` : 'Target reached') : 'Log your first weigh-in';
  const chip = $('#wTrendChip');
  chip.textContent = cur ? `Last: ${fmtDM(cur.date)}` : 'No entries yet';
  drawWeightChart();
}

function renderCheckin() {
  const t = today(), w = dailyValue('weight', t), sl = sleepOn(t), last = weights().pop(), p = dayProtein(t);
  $('#checkinDate').textContent = fmtLong(t);
  $('#ciWeight').innerHTML = w ? `${fmtNum(w.details.kg, 1)}<small>kg</small>` : last ? `${fmtNum(last.details.kg, 1)}<small>kg</small>` : '—';
  $('#ciWeightSub').innerHTML = w ? `${ICON('check')}Logged today` : last ? `Last: ${esc(fmtDM(last.date))} · not logged today` : 'Not logged yet';
  $('#ciProtein').innerHTML = `${fmtNum(p)}<small>g</small>`;
  const pt = targetsOn(t).protein;
  $('#ciProteinSub').innerHTML = p >= pt ? `${ICON('check')}Target hit` : `target ${fmtNum(pt)} g`;
  $('#ciSleep').innerHTML = sl ? `<span class="${SLEEP_CLS[sleepClass(sl.details.hours)]}">${fmtNum(sl.details.hours, 1)}<small>h</small></span>` : '—';
  $('#ciSleepSub').innerHTML = sl ? (sl.details.hours >= SLEEP_TARGET ? `${ICON('check')}8 h target met` : 'Below 8 h target') : 'Not logged today · target 8 h';
  $('#ciWeightIn').placeholder = w ? `Today: ${fmtNum(w.details.kg, 1)}` : 'e.g. 84.0';
  $('#ciSleepIn').placeholder = sl ? `Today: ${fmtNum(sl.details.hours, 1)}` : 'e.g. 7.5';
}

// Resolves with the confirmed new weight, or null when the user cancels.
function askChangeWeight(currentKg, proposedKg) {
  const dlg = $('#weightDialog'), input = $('#wdInput'), msg = $('#wdMsg');
  $('#wdText').textContent = `Today’s weight is ${fmtNum(currentKg, 1)} kg.`;
  input.value = proposedKg; msg.textContent = ''; input.removeAttribute('aria-invalid');
  return new Promise(resolve => {
    const onClose = () => {
      dlg.removeEventListener('close', onClose);
      resolve(dlg.returnValue === 'change' ? Math.round(parseFloat(input.value) * 10) / 10 : null);
    };
    dlg.addEventListener('close', onClose);
    dlg.returnValue = '';
    dlg.showModal();
  });
}
$('#wdChange').addEventListener('click', e => {
  const v = parseFloat($('#wdInput').value);
  if (!(v >= 30 && v <= 250)) { e.preventDefault(); $('#wdInput').setAttribute('aria-invalid', 'true'); $('#wdMsg').textContent = 'Enter a weight between 30 and 250 kg.'; }
});

function scoreRow(label, val, pct) {
  return `<div class="score-row"><span class="lbl">${label}</span><span class="val">${val}</span>${pct == null ? '' : `<div class="bar"><i style="width:${Math.min(100, Math.max(0, pct))}%"></i></div>`}</div>`;
}
function renderScorecard() {
  const t = today(), days = weekDays(t), ws = days[0], we = days[6], from = maxDate(ws, START);
  const c = types => actsIn(from, we, types).length;
  const gym = c(['gym']);
  const runs = actsIn(from, we, ['running']);
  const km = runs.reduce((s, a) => s + (Number(a.details?.distance) || 0), 0);
  const upTo = days.filter(d => d <= t && d >= START);
  const proteinDays = upTo.filter(d => dayProtein(d) >= targetsOn(d).protein || checked(d, 'protein')).length;
  const stepDays = upTo.filter(d => checked(d, 'steps')).length;
  const sleepDays = upTo.filter(d => checked(d, 'sleep') || (sleepOn(d)?.details.hours ?? 0) >= SLEEP_TARGET).length;
  const w = weights().filter(x => x.date >= START), inWeek = w.filter(x => x.date >= ws && x.date <= we), before = w.filter(x => x.date < ws).pop();
  let wTxt = '—';
  if (inWeek.length) {
    const base = before || inWeek[0], last = inWeek[inWeek.length - 1];
    if (base !== last) { const d = last.details.kg - base.details.kg; wTxt = `<span class="${d < 0 ? 'good' : d > 0 ? 'bad' : ''}">${d > 0 ? '+' : d < 0 ? '−' : ''}${fmtNum(Math.abs(d), 1)} kg</span>`; }
  }
  $('#weekCard').innerHTML = `<div class="card-h"><h2>This week</h2><span class="chip grey">${esc(fmtDM(ws))} – ${esc(fmtDM(we))}</span></div>
  <div class="score">
    ${scoreRow('Core', c(['core']))}
    ${scoreRow('Gym', `${gym} / ${GYM_WEEK_TARGET}`, gym / GYM_WEEK_TARGET * 100)}
    ${scoreRow('Plyometrics', c(['plyo']))}
    ${scoreRow('Basketball', c(['basketball', 'match']))}
    ${scoreRow('Running', `${runs.length}${km ? ` · ${fmtNum(km, 1)} km` : ''}`)}
    <div class="score-sep"></div>
    ${scoreRow('Protein target', `${proteinDays} / 7`, proteinDays / 7 * 100)}
    ${scoreRow('10k steps', `${stepDays} / 7`, stepDays / 7 * 100)}
    ${scoreRow('Sleep 8h+', `${sleepDays} / 7`, sleepDays / 7 * 100)}
    <div class="score-sep"></div>
    ${scoreRow('Weight', wTxt)}
  </div>`;
}

function missionItem(icon, done, title, sub, page, openId) {
  return `<div class="mission-item${done ? ' done' : ''}"><span class="dot"><svg class="i"><use href="#${done ? 'i-check' : icon}"/></svg></span><span class="txt"><b>${esc(title)}</b><span>${esc(sub)}</span></span>${done ? '' : `<button type="button" class="btn btn-sm" data-action="goto" data-page="${page}"${openId ? ` data-open="${esc(openId)}"` : ''}>Open</button>`}</div>`;
}
function renderMission() {
  const t = today();
  const row = (kind, types, icon, page, word) => {
    const done = actsOn(t, types);
    if (done.length) return missionItem(icon, true, `${word}: ${[...new Set(done.map(shortLabel))].join(' + ')}`, 'Logged today', page);
    const nx = nextUp(kind);
    if (!nx) return missionItem(icon, false, `${word}: everything done this week`, 'Rest, or pick another option', page);
    return missionItem(icon, false, `${word}: ${KINDS[kind].name(nx)}`, 'Next up — available this week', page, `card-${kind}-${nx.code}`);
  };
  $('#missionCard').innerHTML = `<div class="card-h"><div><div class="eyebrow">Today’s mission</div><h2>Win the day in three parts</h2></div><span class="chip">TRAIN · FUEL · RECOVER</span></div>
  <div class="mission">
    ${row('core', ['core'], 'i-core', 'core', 'Core')}
    ${row('gym', ['gym'], 'i-gym', 'sessions', 'Gym')}
    ${row('plyo', ['plyo'], 'i-bolt', 'plyo', 'Plyo')}
    ${row('basketball', ['basketball', 'match'], 'i-ball', 'basketball', 'Basketball')}
  </div>
  <div class="tri"><div><b>TRAIN</b><p>Complete the next sequential gym session, basketball/run work and today’s plyo dose.</p></div><div><b>FUEL</b><p>Hit your protein target, stay inside the calorie plan and keep hydration high.</p></div><div><b>RECOVER</b><p>Protect sleep, do your morning core and finish with mobility or meditation when needed.</p></div></div>
  <p class="small" style="margin-top:12px"><b>Morning routine:</b> Wake → freshen up → 5–8 min easy mobility/stretching → today’s Core routine → water → breakfast. Keep the core work crisp; it is a daily activation habit, not a max-effort ab session.</p>`;
}

function buildChecklist() {
  $('#checklist').innerHTML = CHECKLIST.map(([k, label]) => `<li><label><input type="checkbox" data-task="${k}"><span class="box"><svg class="i"><use href="#i-check"/></svg></span><span class="t">${esc(label)}</span><span class="auto" data-auto="${k}" hidden>LOGGED</span></label></li>`).join('');
}
function renderChecklist() {
  const t = today();
  let n = 0;
  for (const cb of $$('#checklist input[data-task]')) {
    cb.checked = checked(t, cb.dataset.task);
    if (cb.checked) n++;
    $(`[data-auto="${cb.dataset.task}"]`).hidden = !(cb.checked && autoTick(t, cb.dataset.task));
  }
  $('#checkRing').style.setProperty('--p', Math.round(n / CHECKLIST.length * 100));
  $('#checkRingTxt').textContent = `${n}/${CHECKLIST.length}`;
}

// ---------- sleep tracker (target 8 h; classification by duration only) ----------
const SLEEP_TARGET = 8, SLEEP_WINDOW = 30;
export const sleepClass = h => (h >= SLEEP_TARGET ? 'good' : h >= 7 ? 'mid' : 'low'); // 8+ green · 7–7.99 yellow · <7 red
const SLEEP_CLS = { good: 's-good', mid: 's-mid', low: 's-low' };
const sleeps = () => canonicalSeries('sleep', a => Number(a.details?.hours) >= 0);
function sleepWindow() { const t = today(), from = addDays(t, -(SLEEP_WINDOW - 1)); return { from, t, list: sleeps().filter(a => a.date >= from && a.date <= t) }; }
function renderSleepCard() {
  const { list } = sleepWindow(), last = sleeps().pop();
  const hours = list.map(a => Number(a.details.hours));
  const count = k => hours.filter(h => sleepClass(h) === k).length;
  $('#sLatest').innerHTML = last ? `<span class="${SLEEP_CLS[sleepClass(last.details.hours)]}">${fmtNum(last.details.hours, 1)}<small>h</small></span>` : '—';
  $('#sLatest').title = last ? `${fmtDMY(last.date)}` : '';
  const avg = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null;
  $('#sAvg').innerHTML = avg == null ? '—' : `<span class="${SLEEP_CLS[sleepClass(Math.round(avg * 10) / 10)]}">${fmtNum(avg, 1)}<small>h</small></span>`;
  $('#sCount').textContent = String(hours.length);
  $('#sGood').textContent = count('good'); $('#sMid').textContent = count('mid'); $('#sLow').textContent = count('low');
  drawSleepChart();
}

// Dashboard nutrition card: 5 activity rings + legend; the whole card opens today's food log.
function renderNutritionCard() {
  const t = today(), tot = dayTotals(t), tg = targetsOn(t), has = foodOn(t).length;
  const pr = macroProgress(tot.kcal, tg.kcal, 'kcal');
  $('#nutritionCard').setAttribute('aria-label', `Nutrition today: ${fmtNum(tot.kcal)} of ${fmtNum(tg.kcal)} kcal, ${fmtNum(tot.protein)} of ${fmtNum(tg.protein)} g protein. Open food log.`);
  $('#nutritionCard').innerHTML = `<div class="card-h"><h2><svg class="i"><use href="#i-food"/></svg>Nutrition</h2><span class="chip ${has ? 'ok' : 'grey'}">${has ? `${has} item${has === 1 ? '' : 's'}` : 'Not logged'}</span></div>
  <div class="nut-rings">${activityRings(tot, tg)}${ringLegend(tot, tg)}</div>
  <div class="nut-card-foot"><span class="nut-card-left${pr.over ? ' over' : ''}">${esc(pr.text)}</span><span class="nut-card-go">${has ? 'Open food log' : 'Log today’s food'}${ICON('right')}</span></div>`;
}

function renderRecoveryCard() {
  const t = today(), days = weekDays(t);
  const rec = actsOn(t, ['recovery', 'meditation']).sort(byTime);
  const weekCount = actsIn(days[0], days[6], ['recovery', 'meditation']).length;
  const sleep = checked(t, 'sleep');
  $('#recoveryCard').innerHTML = `<div class="card-h"><h2><svg class="i"><use href="#i-heart"/></svg>Recovery</h2><span class="chip ${rec.length ? 'ok' : 'grey'}">${rec.length ? `${rec.length} today` : 'None today'}</span></div>
  <div class="kpis"><div class="kpi"><div class="k">Sleep 8h+</div><div class="v" style="font-size:17px">${sleep ? `${ICON('check')}Yes` : 'Not ticked'}</div></div><div class="kpi"><div class="k">This week</div><div class="v" style="font-size:17px">${weekCount} session${weekCount === 1 ? '' : 's'}</div></div></div>
  ${rec.length ? `<div class="today-list" style="margin-top:12px">${rec.map(a => `<span class="act-chip"><i></i>${esc(shortLabel(a))}</span>`).join('')}</div>` : ''}
  <button type="button" class="btn btn-ghost btn-block" style="margin-top:14px" data-action="goto" data-page="recovery">Open recovery</button>`;
}

function qualifies(d) { return actsOn(d, [...TRAINING_TYPES, 'rest']).length > 0; }
function renderFocus() {
  const t = today(), days = weekDays(t);
  let streak = 0, d = qualifies(t) ? t : addDays(t, -1);
  while (d >= START && qualifies(d) && streak < 3650) { streak++; d = addDays(d, -1); }
  const first = S.activities.filter(a => TRAINING_TYPES.includes(a.type) && a.date >= START && a.date <= t).map(a => a.date).sort()[0];
  let consistency = '—';
  if (first) {
    const span = Math.min(28, daysBetween(first, t) + 1);
    let hit = 0;
    for (let i = 0; i < span; i++) if (actsOn(addDays(t, -i), TRAINING_TYPES).length) hit++;
    consistency = `${Math.round(hit / span * 100)}%`;
  }
  // food items count once per day here (a day's food log = one "nutrition" log)
  const wFrom = maxDate(days[0], START);
  const weekFoodDays = new Set(actsIn(wFrom, days[6], ['food']).map(a => a.date)).size;
  const weekActs = actsIn(wFrom, days[6]).filter(a => a.type !== 'weight' && a.type !== 'food').length + weekFoodDays;
  const nx = nextUp('gym');
  const checkDays = days.filter(x => x <= t && x >= START);
  const avg = checkDays.length ? Math.round(checkDays.reduce((s, x) => s + CHECKLIST.filter(([k]) => checked(x, k)).length, 0) / (checkDays.length * CHECKLIST.length) * 100) : 0;
  $('#focusCard').innerHTML = `<div class="card-h"><div><div class="eyebrow">Athletic focus</div><h2>Consistency is the program</h2></div><span class="chip">Checklist this week: ${avg}%</span></div>
  <div class="focus-kpis">
    <div class="kpi accent"><div class="k">Current streak</div><div class="v">${streak}<small>day${streak === 1 ? '' : 's'}</small></div></div>
    <div class="kpi"><div class="k">28-day consistency</div><div class="v">${consistency}</div></div>
    <div class="kpi"><div class="k">Logged this week</div><div class="v">${weekActs}</div></div>
    <div class="kpi"><div class="k">Next gym session</div><div class="v" style="font-size:17px">${nx ? `Session ${esc(nx.code)}` : 'Week complete'}</div></div>
  </div>`;
}

// ---------- charts (Canvas, no library) ----------
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function prepCanvas(c) {
  const rect = c.getBoundingClientRect();
  if (!rect.width) return null; // hidden page — draw when shown
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.round(rect.width * dpr); c.height = Math.round(rect.height * dpr);
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  return { ctx, w: rect.width, h: rect.height };
}
function drawCharts() { if (currentPage === 'dashboard') { drawWeightChart(); drawSleepChart(); } if (currentPage === 'running') drawRunChart(); }

function drawSleepChart() {
  const c = $('#sleepChart'), p = c && prepCanvas(c);
  if (!p) return;
  const { ctx, w, h } = p, { from, list } = sleepWindow();
  const muted = cssVar('--muted') || '#94a3b8';
  ctx.font = '11px system-ui, sans-serif';
  if (!list.length) { ctx.fillStyle = muted; ctx.font = '12px system-ui, sans-serif'; ctx.fillText('Log sleep to see your trend.', 4, h / 2); return; }
  const hi = Math.max(10, ...list.map(a => a.details.hours + 0.5));
  const pad = { l: 4, r: 4, t: 8, b: 16 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const slot = iw / SLEEP_WINDOW, bw = Math.max(3, Math.min(14, slot * 0.62));
  const Y = v => pad.t + ih * (1 - v / hi);
  const color = { good: cssVar('--sleep-good'), mid: cssVar('--sleep-mid'), low: cssVar('--sleep-low') };
  for (const a of list) {
    const hrs = a.details.hours, x = pad.l + slot * (daysBetween(from, a.date) + 0.5) - bw / 2, y = Y(hrs), bh = Math.max(2, h - pad.b - y);
    ctx.fillStyle = color[sleepClass(hrs)];
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, [Math.min(4, bw / 2), Math.min(4, bw / 2), 0, 0]); else ctx.rect(x, y, bw, bh);
    ctx.fill();
  }
  // neutral 8 h reference line, drawn over the bars so it stays visible
  ctx.setLineDash([4, 4]); ctx.strokeStyle = muted; ctx.globalAlpha = 0.8; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, Y(SLEEP_TARGET)); ctx.lineTo(w - pad.r, Y(SLEEP_TARGET)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  ctx.fillStyle = muted;
  ctx.fillText('8 h target', pad.l + 2, Y(SLEEP_TARGET) - 4);
  ctx.fillText(fmtDM(from), pad.l, h - 3);
  const tl = 'Today', tw = ctx.measureText(tl).width;
  ctx.fillText(tl, w - pad.r - tw, h - 3);
}

function drawWeightChart() {
  const c = $('#weightChart'), p = c && prepCanvas(c);
  if (!p) return;
  const { ctx, w, h } = p, pts = weights().slice(-60);
  ctx.font = '12px system-ui, sans-serif';
  if (!pts.length) { ctx.fillStyle = '#94a3b8'; ctx.fillText('Log weight to see your trend.', 4, h / 2); return; }
  const vals = pts.map(x => x.details.kg);
  const lo = Math.min(TARGET_KG, ...vals) - 0.8, hi = Math.max(TARGET_KG, ...vals) + 0.8;
  const pad = { l: 4, r: 4, t: 10, b: 14 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const X = i => pts.length === 1 ? pad.l + iw / 2 : pad.l + iw * i / (pts.length - 1);
  const Y = v => pad.t + ih * (1 - (v - lo) / (hi - lo));
  ctx.setLineDash([4, 4]); ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, Y(TARGET_KG)); ctx.lineTo(w - pad.r, Y(TARGET_KG)); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#94a3b8'; ctx.fillText('76 kg target', pad.l + 2, Y(TARGET_KG) - 4);
  const a1 = cssVar('--a1') || '#6d3cf5', a2 = cssVar('--a2') || '#a87bff';
  const grad = ctx.createLinearGradient(0, pad.t, 0, h);
  grad.addColorStop(0, a2 + '55'); grad.addColorStop(1, a2 + '00');
  if (pts.length > 1) {
    ctx.beginPath(); pts.forEach((x, i) => (i ? ctx.lineTo(X(i), Y(x.details.kg)) : ctx.moveTo(X(i), Y(x.details.kg))));
    ctx.lineTo(X(pts.length - 1), h - pad.b); ctx.lineTo(X(0), h - pad.b); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    const lg = ctx.createLinearGradient(0, 0, w, 0); lg.addColorStop(0, a1); lg.addColorStop(1, a2);
    ctx.beginPath(); pts.forEach((x, i) => (i ? ctx.lineTo(X(i), Y(x.details.kg)) : ctx.moveTo(X(i), Y(x.details.kg))));
    ctx.strokeStyle = lg; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();
  }
  const last = pts.length - 1;
  ctx.fillStyle = a1; ctx.beginPath(); ctx.arc(X(last), Y(vals[last]), 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cssVar('--surface') || '#fff'; ctx.beginPath(); ctx.arc(X(last), Y(vals[last]), 2, 0, Math.PI * 2); ctx.fill();
}

function runs() { return S.activities.filter(a => a.type === 'running').sort(byTime); }
function drawRunChart() {
  const c = $('#runChart'), p = c && prepCanvas(c);
  if (!p) return;
  const { ctx, w, h } = p, arr = runs().filter(x => x.details?.time > 0);
  ctx.font = '12px system-ui, sans-serif';
  if (!arr.length) { ctx.fillStyle = cssVar('--muted') || '#667085'; ctx.fillText('Log a run to see your progression.', 20, 35); return; }
  const pad = { l: 44, r: 18, t: 18, b: 34 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const maxT = Math.max(...arr.map(x => x.details.time)) * 1.12;
  ctx.strokeStyle = cssVar('--line') || '#e4e8f0'; ctx.lineWidth = 1; ctx.fillStyle = '#94a3b8';
  for (let i = 0; i <= 3; i++) {
    const y = pad.t + ih * i / 3;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    ctx.fillText(`${Math.round(maxT * (1 - i / 3))}m`, 6, y + 4);
  }
  ctx.fillStyle = cssVar('--muted') || '#667085'; ctx.fillText('time ↑', 6, 12); ctx.fillText('runs →', w - 60, h - 8);
  const a1 = cssVar('--a1') || '#6d3cf5';
  const X = i => arr.length === 1 ? pad.l + iw / 2 : pad.l + iw * i / (arr.length - 1);
  const Y = v => pad.t + ih * (1 - v / maxT);
  ctx.strokeStyle = a1; ctx.lineWidth = 2; ctx.beginPath();
  arr.forEach((x, i) => (i ? ctx.lineTo(X(i), Y(x.details.time)) : ctx.moveTo(X(i), Y(x.details.time))));
  ctx.stroke();
  ctx.fillStyle = a1;
  arr.forEach((x, i) => { ctx.beginPath(); ctx.arc(X(i), Y(x.details.time), 4, 0, Math.PI * 2); ctx.fill(); });
}

// ---------- running ----------
function renderRunning() {
  const arr = runs().slice().reverse();
  const km = arr.reduce((s, a) => s + (Number(a.details?.distance) || 0), 0);
  $('#runTotals').textContent = arr.length ? `${arr.length} run${arr.length === 1 ? '' : 's'} · ${fmtNum(km, 1)} km` : 'No runs yet';
  $('#runHistory').innerHTML = arr.length ? arr.map(a => histItem(a, `${fmtDM(a.date)} ${toDate(a.date).getFullYear()}`)).join('') : '<div class="empty">No runs logged yet.</div>';
  updatePace();
  requestAnimationFrame(drawRunChart);
}
function updatePace() {
  const d = parseFloat($('#runDistance').value), t = parseFloat($('#runTime').value);
  $('#pacePreview').textContent = d > 0 && t > 0 ? `Pace: ${fmtDuration(t / d)} /km` : 'Pace: —';
}
function histItem(a, title) {
  return `<div class="hist-item"><div class="m"><b>${esc(title)}</b><span>${recordBody(a).replace(/<\/?div[^>]*>/g, ' ')}</span></div><button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${esc(a.id)}" aria-label="Delete ${esc(recordTitle(a))} from ${esc(fmtDMY(a.date))}">Delete</button></div>`;
}

// ---------- nutrition: food log, saved meals, targets ----------
// Food items are 'food' activities (sync / undo / delete like every other log). Saved meals and
// target history live in S.savedMeals / S.targets and merge the same way (js/merge.js).
const fmtMacro = (k, v) => fmtNum(v, k === 'kcal' || Number.isInteger(round1(v)) ? 0 : 1);
function qtyText(d) {
  const q = Number(d?.qty);
  if (!(q > 0)) return '';
  const unit = d.unit === 'serving' ? (q === 1 ? 'serving' : 'servings') : (d.unit || '');
  return `${fmtNum(q, Number.isInteger(q) ? 0 : 1)} ${unit}`.trim();
}
function macroLine(d) {
  return `${fmtNum(d.kcal || 0)} kcal · P ${fmtMacro('protein', d.protein || 0)} g · C ${fmtMacro('carbs', d.carbs || 0)} g · F ${fmtMacro('fat', d.fat || 0)} g${Number(d.fibre) ? ` · Fibre ${fmtMacro('fibre', d.fibre)} g` : ''}`;
}
function macroRow(k, tot, tg) {
  const [, label, unit] = MACROS.find(m => m[0] === k);
  const pr = macroProgress(tot[k], tg[k], unit);
  return `<div class="macro${pr.over ? ' over' : ''}" data-macro="${k}"><div class="macro-top"><span class="lbl">${label}</span><span class="val">${fmtMacro(k, tot[k])} / ${fmtNum(tg[k])} ${unit} · <b>${pr.pct}%</b></span></div><div class="bar"><i style="width:${pr.bar}%"></i></div><div class="macro-sub">${esc(pr.text)}</div></div>`;
}
// Apple Activity-style rings, outer → inner: Calories (theme accent), Protein, Carbs, Fat, Fibre
// (fixed colours in every theme). Over 100% the ring keeps going round with a darker,
// shadowed tail (shown up to 200%).
const RING_KEYS = ['kcal', 'protein', 'carbs', 'fat', 'fibre'];
function activityRings(tot, tg) {
  const W = 13, GAP = 3, R0 = 92;
  const label = RING_KEYS.map(k => { const [, l, u] = MACROS.find(m => m[0] === k); return `${l} ${fmtMacro(k, tot[k])} of ${fmtNum(tg[k])} ${u}`; }).join(', ');
  const rings = RING_KEYS.map((k, i) => {
    const r = R0 - i * (W + GAP), C = 2 * Math.PI * r, p = tg[k] > 0 ? tot[k] / tg[k] : 0;
    const base = Math.min(1, p), lap = Math.max(0, Math.min(1, p - 1));
    const arc = (len, cls) => `<circle class="ar-fill${cls}" cx="100" cy="100" r="${r}" stroke-dasharray="${(len * C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 100 100)"/>`;
    return `<g class="ar ar-${k}${p > 1 ? ' ar-over' : ''}" data-ring="${k}" data-pct="${Math.round(p * 100)}" style="--c:${C.toFixed(1)}"><circle class="ar-track" cx="100" cy="100" r="${r}"/>${base > 0 ? arc(base, '') : ''}${lap > 0 ? arc(lap, ' ar-lap') : ''}</g>`;
  }).join('');
  return `<div class="arings" role="img" aria-label="${esc(label)}"><svg viewBox="0 0 200 200" aria-hidden="true">${rings}</svg></div>`;
}
// Legend next to the rings: coloured dot + name + "eaten / target unit".
function ringLegend(tot, tg) {
  return `<ul class="alegend">${RING_KEYS.map(k => { const [, l, u] = MACROS.find(m => m[0] === k); return `<li class="al-${k}" data-macro="${k}"><i aria-hidden="true"></i><span>${l}</span><b>${fmtMacro(k, tot[k])} / ${fmtNum(tg[k])} ${u}</b></li>`; }).join('')}</ul>`;
}

let nutDay = null;      // selected day on the Nutrition page; null = follow today
let quickMeal = null;   // meal the quick-add buttons add to
const nutDate = () => (nutDay && nutDay < today() ? nutDay : today());
const mealOf = a => (MEAL_NAMES[a.details?.meal] ? a.details.meal : 'other');
const savedById = id => S.savedMeals.find(m => m.id === id);
const savedUses = () => { const c = {}; for (const a of S.activities) if (a.type === 'food' && a.details?.savedMealId) c[a.details.savedMealId] = (c[a.details.savedMealId] || 0) + 1; return c; };
const opts = (list, value) => list.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('');

// Saved meals / targets: same id + updatedAt + tombstone rules as activities.
function upsertIn(coll, rec) {
  const r = { ...rec, updatedAt: nowIso() };
  const i = S[coll].findIndex(x => x.id === r.id);
  if (i >= 0) S[coll][i] = r; else S[coll].push(r);
  delete S.deleted[r.id];
  persist();
  return r;
}
function removeIn(coll, id) {
  S[coll] = S[coll].filter(x => x.id !== id);
  S.deleted[id] = nowIso();
  persist();
}

function renderNutrition() {
  const d = nutDate(), t = today(), items = foodOn(d), tot = dayTotals(d), tg = targetsOn(d);
  const inp = $('#nutDay');
  inp.max = t; inp.value = d;
  $('.nut-next').disabled = d >= t;
  $('#nutTodayBtn').disabled = d === t;
  const kp = macroProgress(tot.kcal, tg.kcal, 'kcal');
  $('#nutTotals').innerHTML = `<div class="card-h"><div><div class="eyebrow">${d === t ? 'Today' : esc(weekdayLong(d))}</div><h2>${esc(fmtDMY(d))}</h2></div><span class="chip ${items.length ? 'ok' : 'grey'}">${items.length ? `${items.length} item${items.length === 1 ? '' : 's'}` : 'Nothing logged'}</span></div>
  <div class="nut-rings nut-rings-lg">${activityRings(tot, tg)}<div>${ringLegend(tot, tg)}<div class="nut-card-left${kp.over ? ' over' : ''}">${esc(kp.text)}</div></div></div>
  <div class="macros">${['protein', 'carbs', 'fat', 'fibre'].map(k => macroRow(k, tot, tg)).join('')}</div>
  <p class="small" style="margin-top:12px">Targets ${tg.effective ? `effective from ${esc(fmtDMY(tg.effective))}` : `(defaults, effective from ${esc(fmtDMY(START))})`} · change them under <b>Targets</b> below.</p>`;
  renderMealBreakdown(items, tot);
  renderNutWeek(d);
  renderQuickAdd(d);
  renderMeals(d, items);
  renderSavedList();
  renderTargetsPanel();
}

// Per-meal breakdown: kcal and % share of the day; tap a row to jump to that meal's section.
function renderMealBreakdown(items, tot) {
  $('#nutBreak').innerHTML = `<div class="card-h"><h2>Meals</h2><span class="chip grey">share of ${fmtNum(tot.kcal)} kcal</span></div>
  <div class="mbreak">${MEALS.map(([k, l]) => {
    const kc = sumMacros(items.filter(a => mealOf(a) === k).map(a => a.details || {})).kcal;
    const share = tot.kcal > 0 ? Math.round(kc / tot.kcal * 100) : 0;
    return `<button type="button" class="mb-row${kc ? '' : ' is-empty'}" data-action="nut-jump" data-meal="${k}" aria-label="${esc(l)}: ${fmtNum(kc)} kcal, ${share}% of the day. Jump to ${esc(l)}">
      <span class="mb-name">${esc(l)}</span><span class="mb-val">${fmtNum(kc)} kcal · ${share}%</span><span class="bar"><i style="width:${share}%"></i></span></button>`;
  }).join('')}</div>`;
}
function renderNutWeek(d) {
  const days = weekDays(d).filter(x => x <= today() && x >= START);
  const logged = days.filter(x => foodOn(x).length);
  const sum = logged.reduce((s, x) => { const tt = dayTotals(x); s.kcal += tt.kcal; s.protein += tt.protein; return s; }, { kcal: 0, protein: 0 });
  const hit = logged.filter(x => dayProtein(x) >= targetsOn(x).protein).length;
  const n = logged.length;
  $('#nutWeek').innerHTML = `<div class="card-h"><h2>This week</h2><span class="chip grey">${esc(fmtDM(weekStart(d)))} – ${esc(fmtDM(addDays(weekStart(d), 6)))}</span></div>
  <div class="kpis kpis-3">
    <div class="kpi"><div class="k">Avg calories</div><div class="v">${n ? fmtNum(sum.kcal / n) : '—'}<small>kcal</small></div></div>
    <div class="kpi"><div class="k">Avg protein</div><div class="v">${n ? fmtNum(sum.protein / n) : '—'}<small>g</small></div></div>
    <div class="kpi accent"><div class="k">Protein hit</div><div class="v">${hit}<small>/ ${n} day${n === 1 ? '' : 's'}</small></div></div>
  </div>
  <p class="small" style="margin-top:10px">${n ? `Averages over the ${n} day${n === 1 ? '' : 's'} with food logged this week.` : 'No food logged this week yet.'}</p>`;
}

function renderQuickAdd(d) {
  const uses = savedUses();
  const top = [...S.savedMeals].sort((a, b) => (uses[b.id] || 0) - (uses[a.id] || 0) || a.name.localeCompare(b.name)).slice(0, 6);
  if (!quickMeal) quickMeal = defaultMealForTime();
  $('#nutQuick').innerHTML = top.length
    ? `<div class="card-h"><h2>Quick add</h2><label class="quick-to"><span class="small">Add to</span><select class="input input-sm" id="quickMeal" aria-label="Add quick items to meal">${opts(MEALS, quickMeal)}</select></label></div>
       <div class="quick-chips">${top.map(m => { const tt = sumMacros(m.items); return `<button type="button" class="quick-chip" data-action="quick-add" data-id="${esc(m.id)}"><b>${esc(m.name)}</b><span>${fmtNum(tt.kcal)} kcal · P ${fmtMacro('protein', tt.protein)} g</span></button>`; }).join('')}</div>
       <p class="small" style="margin-top:8px">One tap adds 1 serving to ${esc(fmtDMY(d))}. Use “+ Saved meal” in a meal for other servings.</p>`
    : `<div class="card-h"><h2>Quick add</h2></div><p class="small">Create saved meals (below) and your most-used ones appear here as one-tap buttons.</p>`;
}

function foodRow(a) {
  const d = a.details || {}, meal = mealOf(a);
  return `<li class="food-item">
    <div class="fi-main"><b>${esc(a.name || 'Food')}</b>${d.legacy ? ' <span class="chip grey">legacy</span>' : ''}${qtyText(d) ? ` <span class="small">${esc(qtyText(d))}</span>` : ''}<div class="small">${esc(macroLine(d))}</div></div>
    <div class="fi-actions">
      <button type="button" class="btn btn-sm" data-action="food-edit" data-id="${esc(a.id)}" aria-label="Edit ${esc(a.name)}">Edit</button>
      <select class="input input-sm" data-move="${esc(a.id)}" aria-label="Move ${esc(a.name)} to another meal"><option value="">Move…</option>${MEALS.filter(([k]) => k !== meal).map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('')}</select>
      <button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${esc(a.id)}" aria-label="Delete ${esc(a.name)}">Delete</button>
    </div></li>`;
}
function renderMeals(d, items) {
  const noSaved = !S.savedMeals.length;
  $('#nutMeals').innerHTML = MEALS.map(([key, label]) => {
    const list = items.filter(a => mealOf(a) === key).sort(byTime), sub = sumMacros(list.map(a => a.details || {}));
    return `<section class="card meal${list.length ? '' : ' is-empty'}" data-meal="${key}" aria-label="${esc(label)}">
      <div class="meal-h"><h3>${esc(label)}</h3><span class="meal-sub">${list.length ? `${fmtNum(sub.kcal)} kcal · P ${fmtMacro('protein', sub.protein)} g · C ${fmtMacro('carbs', sub.carbs)} · F ${fmtMacro('fat', sub.fat)}` : ''}</span></div>
      ${list.length ? `<ul class="food-list">${list.map(foodRow).join('')}</ul>` : ''}
      <div class="meal-actions"><button type="button" class="btn btn-sm btn-ghost" data-action="food-add" data-meal="${key}">${ICON('plus')}Add food</button><button type="button" class="btn btn-sm" data-action="saved-add" data-meal="${key}"${noSaved ? ' disabled title="Create a saved meal first"' : ''}>${ICON('plus')}Saved meal</button></div>
    </section>`;
  }).join('');
}

function renderSavedList() {
  const uses = savedUses(), list = [...S.savedMeals].sort((a, b) => a.name.localeCompare(b.name));
  $('#savedCount').textContent = list.length ? `· ${list.length}` : '';
  $('#savedList').innerHTML = list.length ? list.map(m => {
    const tt = sumMacros(m.items);
    return `<div class="hist-item saved-item"><div class="m"><b>${esc(m.name)}</b><span>${m.items.length} ingredient${m.items.length === 1 ? '' : 's'} · ${esc(macroLine(tt))}${uses[m.id] ? ` · used ${uses[m.id]}×` : ''}</span></div>
      <div class="row" style="gap:6px"><button type="button" class="btn btn-sm btn-ghost" data-action="saved-add" data-saved="${esc(m.id)}">Add</button><button type="button" class="btn btn-sm" data-action="saved-edit" data-id="${esc(m.id)}">Edit</button><button type="button" class="btn btn-sm btn-danger" data-action="saved-del" data-id="${esc(m.id)}" aria-label="Delete saved meal ${esc(m.name)}">Delete</button></div></div>`;
  }).join('') : '<div class="empty">No saved meals yet.</div>';
}

function renderTargetsPanel() {
  const t = today(), tg = targetsOn(t);
  $('#targetsSummary').textContent = `· ${fmtNum(tg.kcal)} kcal · ${fmtNum(tg.protein)} g protein`;
  const form = $('form[data-form="targets"]');
  if (!form.contains(document.activeElement)) {
    $('#tgKcal').value = tg.kcal; $('#tgProtein').value = tg.protein; $('#tgCarbs').value = tg.carbs; $('#tgFat').value = tg.fat; $('#tgFibre').value = tg.fibre;
    if (!$('#tgFrom').value) $('#tgFrom').value = t;
  }
  const hist = [...S.targets].sort((a, b) => b.effective.localeCompare(a.effective));
  $('#targetsHistory').innerHTML = hist.length
    ? hist.map(x => `<div class="hist-item"><div class="m"><b>From ${esc(fmtDMY(x.effective))}</b><span>${fmtNum(x.kcal)} kcal · P ${fmtNum(x.protein)} g · C ${fmtNum(x.carbs)} g · F ${fmtNum(x.fat)} g · Fibre ${fmtNum(x.fibre)} g</span></div><button type="button" class="btn btn-sm btn-danger" data-action="target-del" data-id="${esc(x.id)}" aria-label="Remove targets from ${esc(fmtDMY(x.effective))}">Remove</button></div>`).join('')
    : `<div class="small">Using the defaults from ${esc(fmtDMY(START))}: 2,200 kcal · 160 g protein · 245 g carbs · 65 g fat · 35 g fibre.</div>`;
}

// --- dialogs ---
let foodEditId = null, savedEditId = null;
function openFoodDialog({ meal, id } = {}) {
  const a = id ? S.activities.find(x => x.id === id) : null, d = a?.details || {};
  foodEditId = a ? a.id : null;
  $('#fdTitle').textContent = a ? 'Edit food' : `Add food · ${MEAL_NAMES[meal] || 'Other'}`;
  $('#fdSubmit').textContent = a ? 'SAVE' : 'ADD';
  $('#fdMeal').innerHTML = opts(MEALS, a ? mealOf(a) : (meal || 'other'));
  $('#fdUnit').innerHTML = opts(UNITS.map(u => [u, u]), d.unit || 'g');
  $('#fdName').value = a ? (a.name || '') : '';
  $('#fdQty').value = a ? (d.qty ?? '') : '';
  for (const [k, id2] of [['kcal', 'fdKcal'], ['protein', 'fdProtein'], ['carbs', 'fdCarbs'], ['fat', 'fdFat'], ['fibre', 'fdFibre']]) $(`#${id2}`).value = a ? (d[k] ?? '') : '';
  clearErr($('#foodDialog form'), $('#fdMsg'));
  $('#foodDialog').showModal();
  $('#fdName').focus();
}
function readNum(el, { min = 0, max = 10000, required = false } = {}) {
  const raw = el.value.trim();
  if (raw === '') return required ? NaN : 0;
  const v = Number(raw);
  return Number.isFinite(v) && v >= min && v <= max ? round1(v) : NaN;
}

function servingsValue() {
  const r = $('input[name="serv"]:checked')?.value;
  return r === 'custom' ? Number($('#saCustom').value) : Number(r);
}
function updateSavedPreview() {
  $('#saCustom').hidden = $('input[name="serv"]:checked')?.value !== 'custom';
  const m = savedById($('#saMeal').value), s = servingsValue();
  $('#saPreview').textContent = m && s > 0 ? `${fmtNum(s, Number.isInteger(s) ? 0 : 2)} × ${m.name} = ${macroLine(scaleMacros(sumMacros(m.items), s))}` : 'Choose a saved meal and servings.';
}
function openSavedAdd({ meal, savedId } = {}) {
  if (!S.savedMeals.length) { toast('Create a saved meal first'); return; }
  const list = [...S.savedMeals].sort((a, b) => a.name.localeCompare(b.name));
  $('#saMeal').innerHTML = opts(list.map(m => [m.id, `${m.name} · ${fmtNum(sumMacros(m.items).kcal)} kcal`]), savedId || list[0].id);
  $('#saTo').innerHTML = opts(MEALS, meal || quickMeal || defaultMealForTime());
  $('#sv1').checked = true; $('#saCustom').value = '';
  clearErr($('#savedAddDialog form'), $('#saMsg'));
  updateSavedPreview();
  $('#savedAddDialog').showModal();
}
function logSavedMeal(savedId, meal, servings) {
  const m = savedById(savedId);
  if (!m) return;
  // copy the values: later edits to the saved meal never change this log
  const scaled = scaleMacros(sumMacros(m.items), servings);
  const ingredients = m.items.map(i => ({ name: i.name, qty: round1(Number(i.qty || 0) * servings), unit: i.unit, ...scaleMacros(i, servings) }));
  logged([{ date: nutDate(), type: 'food', name: m.name, details: { meal, qty: servings, unit: 'serving', ...scaled, savedMealId: m.id, servings, ingredients } }],
    `✓ ${m.name}${servings !== 1 ? ` ×${fmtNum(servings, Number.isInteger(servings) ? 0 : 2)}` : ''} added to ${MEAL_NAMES[meal]}`);
}

function smRowHtml(it = {}) {
  const f = (k, label, extra = '') => `<label class="sm-f"><span>${label}</span><input class="input input-sm" data-f="${k}" type="number" inputmode="decimal" min="0" step="any" value="${esc(it[k] ?? '')}" ${extra}></label>`;
  return `<div class="sm-row">
    <label class="sm-f sm-name"><span>Ingredient</span><input class="input input-sm" data-f="name" maxlength="80" value="${esc(it.name || '')}" placeholder="e.g. Rolled oats"></label>
    ${f('qty', 'Qty')}
    <label class="sm-f"><span>Unit</span><select class="input input-sm" data-f="unit">${opts(UNITS.filter(u => u !== 'serving').map(u => [u, u]), it.unit || 'g')}</select></label>
    ${f('kcal', 'kcal')}${f('protein', 'P g')}${f('carbs', 'C g')}${f('fat', 'F g')}${f('fibre', 'Fibre g')}
    <button type="button" class="btn btn-sm btn-danger sm-del" data-action="sm-del-row" aria-label="Remove ingredient">${ICON('x')}</button>
  </div>`;
}
function readSmRows() {
  return $$('#smRows .sm-row').map(row => {
    const g = k => row.querySelector(`[data-f="${k}"]`);
    const it = { name: g('name').value.trim(), unit: g('unit').value };
    for (const k of ['qty', 'kcal', 'protein', 'carbs', 'fat', 'fibre']) it[k] = readNum(g(k), { max: k === 'kcal' ? 10000 : k === 'qty' ? 100000 : 1000 });
    return { row, it };
  });
}
function updateSmTotals() {
  const rows = readSmRows().map(r => r.it).filter(i => i.name);
  $('#smTotals').textContent = rows.length ? `Meal total: ${macroLine(sumMacros(rows.map(i => Object.fromEntries(Object.entries(i).map(([k, v]) => [k, Number.isNaN(v) ? 0 : v])))))}` : 'Add at least one ingredient.';
}
function openSavedMeal(id) {
  const m = id ? savedById(id) : null;
  savedEditId = m ? m.id : null;
  $('#smTitle').textContent = m ? 'Edit saved meal' : 'New saved meal';
  $('#smName').value = m ? m.name : '';
  $('#smRows').innerHTML = (m && m.items.length ? m.items : [{}]).map(smRowHtml).join('');
  clearErr($('#savedMealDialog form'), $('#smMsg'));
  updateSmTotals();
  $('#savedMealDialog').showModal();
  $('#smName').focus();
}

// ---------- recovery ----------
function renderRecovery() {
  renderWeek('recovery');
  const rec = actsOn(today(), ['recovery', 'meditation']).sort(byTime);
  $('#recToday').innerHTML = rec.length ? rec.map(a => histItem(a, recordTitle(a))).join('') : '<div class="empty">No recovery logged today.</div>';
}

// ---------- logs ----------
let logLimit = 21;
const openDays = new Set();
const LOG_SECTIONS = [
  // training order everywhere: Core → Gym → Plyometrics → Basketball → Running
  ['DAILY CHECK-IN', ['weight', 'sleep']], ['CORE', ['core']], ['GYM', ['gym']], ['PLYOMETRICS', ['plyo']], ['BASKETBALL', ['basketball', 'match']], ['RUNNING', ['running']],
  ['NUTRITION', ['food']], ['RECOVERY', ['recovery', 'meditation']], ['REST', ['rest']],
];
const logRec = (a, note = '') => `<div class="log-rec"><div class="m"><b>${esc(recordTitle(a))}${note ? ` <span class="small">${note}</span>` : ''}</b>${recordBody(a)}</div><button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${esc(a.id)}" aria-label="Delete ${esc(recordTitle(a))}">Delete</button></div>`;
// Logs: nutrition for a day = totals vs that day's targets + items by meal, or "Missed".
function nutritionLogSection(d, list) {
  if (!list.length) return d >= START && d < today() ? '<div class="log-sec"><h4>NUTRITION · MISSED</h4><div class="small">No food logged on this day.</div></div>' : '';
  const tot = sumMacros(list.map(a => a.details || {})), tg = targetsOn(d);
  const totals = MACROS.map(([k, label, unit]) => `${label} ${fmtMacro(k, tot[k])} / ${fmtNum(tg[k])}${unit === 'kcal' ? ' kcal' : ' g'}`).join(' · ');
  const byMeal = MEALS.map(([k, l]) => [l, list.filter(a => mealOf(a) === k)]).filter(([, l]) => l.length);
  return `<div class="log-sec"><h4>NUTRITION · LOGGED</h4><div class="log-tot">${esc(totals)}</div>${byMeal.map(([l, items]) => `<div class="log-meal">${esc(l)} · ${fmtNum(sumMacros(items.map(a => a.details || {})).kcal)} kcal</div>${items.sort(byTime).map(a => logRec(a)).join('')}`).join('')}</div>`;
}
function logDates() {
  const t = today(), set = new Set();
  S.activities.forEach(a => set.add(a.date));
  Object.entries(S.checks).forEach(([d, v]) => { if (Object.values(v).some(x => x.v)) set.add(d); });
  let earliest = [...set].filter(d => d <= t).sort()[0] || t;
  if (START <= t && START < earliest) earliest = START;
  const out = [];
  for (let d = t; d >= earliest; d = addDays(d, -1)) out.push(d);
  return { past: out, future: [...set].filter(d => d > t).sort() };
}
function dayStatus(d) {
  const t = today(), acts = actsOn(d), rest = acts.some(a => a.type === 'rest'), n = acts.filter(a => a.type !== 'rest').length;
  const chips = [];
  if (n) chips.push(`<span class="chip ok">${n} logged</span>`);
  if (rest) chips.push('<span class="chip" style="background:#f0f9ff;color:#0369a1">Rest</span>');
  if (!n && !rest) chips.push(d === t ? '<span class="chip">Today</span>' : d > t ? '<span class="chip grey">Future</span>' : d >= START ? '<span class="chip bad">Missed</span>' : '<span class="chip grey">No entry</span>');
  return chips.join(' ');
}
function dayBody(d) {
  const acts = actsOn(d).sort(byTime);
  let html = '';
  for (const [title, types] of LOG_SECTIONS) {
    const list = acts.filter(a => types.includes(a.type));
    if (title === 'NUTRITION') { html += nutritionLogSection(d, list); continue; }
    if (!list.length) continue;
    if (title === 'DAILY CHECK-IN') {
      // One canonical value per day; older same-day duplicates are shown (not hidden or deleted) as superseded.
      const canon = ['weight', 'sleep'].map(ty => dailyValue(ty, d)).filter(Boolean);
      const extra = list.filter(a => !canon.includes(a));
      html += `<div class="log-sec"><h4>${title}</h4>${canon.map(a => logRec(a)).join('')}${extra.map(a => logRec(a, '· superseded same-day entry')).join('')}</div>`;
      continue;
    }
    html += `<div class="log-sec"><h4>${title}</h4>${list.map(a => logRec(a)).join('')}</div>`;
  }
  const other = acts.filter(a => !LOG_SECTIONS.some(([, ts]) => ts.includes(a.type)));
  if (other.length) html += `<div class="log-sec"><h4>OTHER</h4>${other.map(a => `<div class="log-rec"><div class="m"><b>${esc(recordTitle(a))}</b>${recordBody(a)}</div><button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${esc(a.id)}">Delete</button></div>`).join('')}</div>`;
  const ticks = CHECKLIST.filter(([k]) => checked(d, k));
  html += `<div class="log-sec"><h4>CHECKLIST · ${ticks.length} / ${CHECKLIST.length}</h4>${ticks.length ? ticks.map(([, l]) => `<div class="log-rec"><div class="m"><div class="ck">${ICON('check')}${esc(l)}</div></div></div>`).join('') : '<div class="small">Nothing ticked.</div>'}</div>`;
  if (!acts.length) html = `<div class="empty" style="margin:12px 0">${d >= START && d < today() ? 'Missed — nothing was logged on this day.' : 'Nothing logged on this day.'}</div>` + html;
  return html;
}
function dayCard(d) {
  const t = today(), open = openDays.has(d);
  return `<details class="day" data-date="${d}"${open ? ' open' : ''}><summary><span class="day-date"><b>${d === t ? 'Today · ' : ''}${esc(weekdayLong(d))}</b><strong>${esc(fmtDMY(d))}</strong></span><span class="row" style="gap:6px">${dayStatus(d)}</span><span class="chev" aria-hidden="true"><svg class="i"><use href="#i-down"/></svg></span></summary><div class="day-body">${open ? dayBody(d) : ''}</div></details>`;
}
function renderLogs() {
  const t = today();
  if (!openDays.size) openDays.add(t);
  const { past, future } = logDates();
  const shown = past.slice(0, logLimit);
  $('#logList').innerHTML = `<div class="log-today-head"><span class="eyebrow">Today</span><strong>${esc(fmtDMY(t).toUpperCase())}</strong></div>`
    + shown.map(dayCard).join('')
    + (future.length ? `<h3 style="margin:22px 0 10px">Future-dated entries</h3>${future.map(dayCard).join('')}` : '');
  $('#logMore').hidden = past.length <= logLimit;
}

// ---------- actions ----------
function busy(btn, ms = 800) {
  if (!btn) return false;
  if (btn.dataset.busy === '1') return true;
  btn.dataset.busy = '1';
  setTimeout(() => { delete btn.dataset.busy; }, ms);
  return false;
}

function logProgram(det) {
  const kind = det.dataset.kind, K = KINDS[kind], p = K.list.find(x => x.code === det.dataset.code);
  const msg = $('.lock-msg', det);
  if (weekRecord(kind, p.code)) { updateLocks(kind); return; }
  const items = $$('input[type=checkbox]:checked', det).map(i => ({ name: i.dataset.name, meta: i.dataset.meta }));
  if (!items.length) { msg.textContent = 'Tick the exercises you actually completed first.'; return; }
  // No timed guard needed: the weekly lock applied by this log blocks a double-click duplicate.
  msg.textContent = '';
  logged([{ date: today(), type: K.type, ...(K.subtype ? { subtype: K.subtype } : {}), code: p.code, name: K.name(p), details: { items } }], `✓ ${K.label(p).toUpperCase()} LOGGED`);
  $$('input[type=checkbox]', det).forEach(i => { i.checked = false; });
  $('[data-action="select-all"]', det).textContent = 'Select all';
}

function logRest(btn) {
  const t = today();
  if (actsOn(t, ['rest']).length) return;
  if (busy(btn)) return;
  logged([{ date: t, type: 'rest', name: 'Rest Day', details: {} }], '✓ REST DAY LOGGED');
}

function deleteRecord(id, { ask = true } = {}) {
  const a = S.activities.find(x => x.id === id);
  if (!a) return;
  if (ask && !confirm(`Delete “${recordTitle(a)}” from ${fmtDMY(a.date)}?`)) return;
  const copy = { ...a };
  removeActs([id]);
  render();
  toast('Entry deleted', () => { upsertAct(copy); render(); toast('Restored'); });
}

function validDate(v) { return isDateKey(v) && v <= today(); }
function fieldErr(input, msgEl, text) { if (input) input.setAttribute('aria-invalid', 'true'); msgEl.textContent = text; if (input) input.focus(); return false; }
function clearErr(form, msgEl) { $$('[aria-invalid]', form).forEach(i => i.removeAttribute('aria-invalid')); msgEl.textContent = ''; }

const FORMS = {
  // Daily check-in: one weight and one sleep value per date (new values update the day's record).
  async checkin(form, btn) {
    const msg = $('#checkinMsg'), wEl = $('#ciWeightIn'), sEl = $('#ciSleepIn'); clearErr(form, msg);
    const wRaw = wEl.value.trim(), sRaw = sEl.value.trim();
    const wv = wRaw === '' ? null : parseFloat(wRaw), sv = sRaw === '' ? null : parseFloat(sRaw);
    if (wv == null && sv == null) return fieldErr(wEl, msg, 'Enter today’s weight and/or sleep.');
    if (wv != null && !(wv >= 30 && wv <= 250)) return fieldErr(wEl, msg, 'Enter a weight between 30 and 250 kg.');
    if (sv != null && !(sv >= 0 && sv <= 24)) return fieldErr(sEl, msg, 'Sleep must be between 0 and 24 hours.');
    if (busy(btn, 1500)) return;
    const t = today(), ops = [], done = [];
    if (wv != null) {
      const kg = Math.round(wv * 10) / 10, ex = dailyValue('weight', t);
      if (!ex) { ops.push({ add: { date: t, type: 'weight', name: 'Weight', details: { kg } } }); done.push(`Weight ${fmtNum(kg, 1)} kg`); }
      else {
        const nk = await askChangeWeight(ex.details.kg, kg);
        if (nk == null) done.push('weight unchanged');
        else {
          ops.push({ update: { ...ex }, next: { ...ex, details: { ...ex.details, kg: nk } } });
          // Replacing the day's weight also retires any older same-day duplicates (restored by Undo).
          actsOn(t, ['weight']).filter(a => a.id !== ex.id).forEach(a => ops.push({ remove: a }));
          done.push(`Weight changed to ${fmtNum(nk, 1)} kg`);
        }
      }
    }
    if (sv != null) {
      const hours = Math.round(sv * 100) / 100, ex = dailyValue('sleep', t);
      if (!ex) { ops.push({ add: { date: t, type: 'sleep', name: 'Sleep', details: { hours } } }); done.push(`Sleep ${fmtNum(hours, 1)} h`); }
      else if (ex.details?.hours !== hours) { ops.push({ update: { ...ex }, next: { ...ex, details: { ...ex.details, hours } } }); done.push(`Sleep updated to ${fmtNum(hours, 1)} h`); }
    }
    delete btn?.dataset.busy;
    if (!ops.length) { msg.textContent = done.includes('weight unchanged') ? 'Kept today’s existing weight.' : 'Nothing changed.'; return; }
    applyOps(ops, `✓ ${done.filter(x => x !== 'weight unchanged').join(' · ')}`);
    wEl.value = ''; sEl.value = '';
    if (done.includes('weight unchanged')) msg.textContent = 'Kept today’s existing weight.';
  },
  match(form, btn) {
    const msg = $('#matchMsg'); clearErr(form, msg);
    const court = $('input[name="court"]:checked', form)?.value;
    const minInput = $('#matchMinutes'), mins = Number(minInput.value);
    if (!court) return fieldErr(null, msg, 'Choose Half Court or Full Court.');
    if (!(Number.isFinite(mins) && mins >= 1 && mins <= 600)) return fieldErr(minInput, msg, 'Enter minutes played (1–600).');
    if (busy(btn)) return;
    logged([{ date: today(), type: 'match', code: 'MATCH', name: 'Match Day', details: { court, minutes: Math.round(mins) } }], `✓ MATCH DAY LOGGED · ${court === 'full' ? 'Full' : 'Half'} court`);
    form.reset();
  },
  run(form, btn) {
    const msg = $('#runMsg'); clearErr(form, msg);
    const dateEl = $('#runDate'), distEl = $('#runDistance'), timeEl = $('#runTime');
    const date = dateEl.value, dist = parseFloat(distEl.value), time = parseFloat(timeEl.value), notes = $('#runNotes').value.trim().slice(0, 200);
    if (!validDate(date)) return fieldErr(dateEl, msg, 'Pick a valid date (not in the future).');
    if (!(dist >= 0.1 && dist <= 100)) return fieldErr(distEl, msg, 'Distance must be 0.1–100 km.');
    if (!(time >= 1 && time <= 1000)) return fieldErr(timeEl, msg, 'Time must be 1–1000 minutes.');
    if (time / dist < 2) return fieldErr(timeEl, msg, 'That pace is faster than 2:00/km — check distance and time.');
    if (busy(btn)) return;
    logged([{ date, type: 'running', name: 'Run', details: { distance: Math.round(dist * 100) / 100, time: Math.round(time * 10) / 10, notes } }], `✓ RUN LOGGED · ${fmtNum(dist, 2)} km`);
    distEl.value = ''; timeEl.value = ''; $('#runNotes').value = '';
    updatePace();
  },
  food(form) {
    const msg = $('#fdMsg'); clearErr(form, msg);
    const name = $('#fdName').value.trim(), meal = $('#fdMeal').value, unit = $('#fdUnit').value;
    if (!name) return fieldErr($('#fdName'), msg, 'Enter the food name.');
    const qty = readNum($('#fdQty'), { min: 0, max: 100000, required: true });
    if (!(qty > 0)) return fieldErr($('#fdQty'), msg, 'Enter a quantity above 0.');
    const v = {};
    for (const [k, id, max, req] of [['kcal', 'fdKcal', 10000, true], ['protein', 'fdProtein', 1000], ['carbs', 'fdCarbs', 1000], ['fat', 'fdFat', 1000], ['fibre', 'fdFibre', 1000]]) {
      v[k] = readNum($(`#${id}`), { max, required: req });
      if (Number.isNaN(v[k])) return fieldErr($(`#${id}`), msg, k === 'kcal' ? 'Enter calories (0 is fine for supplements), up to 10,000.' : `${k[0].toUpperCase() + k.slice(1)} must be 0–${max} g.`);
    }
    // no timed guard here: closing the dialog is what prevents a double submit
    const details = { meal, qty, unit, ...v };
    $('#foodDialog').close();
    const a = foodEditId && S.activities.find(x => x.id === foodEditId);
    if (a) updated({ ...a }, { ...a, name, details: { ...a.details, ...details } }, `✓ ${name} updated`);
    else logged([{ date: nutDate(), type: 'food', name, details }], `✓ ${name} added to ${MEAL_NAMES[meal]}`);
  },
  'saved-add'(form) {
    const msg = $('#saMsg'); clearErr(form, msg);
    const s = servingsValue();
    if (!(s >= 0.1 && s <= 20)) return fieldErr($('#saCustom').hidden ? null : $('#saCustom'), msg, 'Servings must be between 0.1 and 20.');
    $('#savedAddDialog').close();
    logSavedMeal($('#saMeal').value, $('#saTo').value, Math.round(s * 100) / 100);
  },
  'saved-meal'(form) {
    const msg = $('#smMsg'); clearErr(form, msg);
    const name = $('#smName').value.trim();
    if (!name) return fieldErr($('#smName'), msg, 'Give the saved meal a name.');
    const rows = readSmRows().filter(({ row, it }) => it.name || [...row.querySelectorAll('input[type=number]')].some(i => i.value !== ''));
    if (!rows.length) return fieldErr(null, msg, 'Add at least one ingredient.');
    const items = [];
    for (const { row, it } of rows) {
      if (!it.name) return fieldErr(row.querySelector('[data-f="name"]'), msg, 'Every ingredient needs a name.');
      for (const k of ['qty', 'kcal', 'protein', 'carbs', 'fat', 'fibre']) if (Number.isNaN(it[k])) return fieldErr(row.querySelector(`[data-f="${k}"]`), msg, `Check ${it.name}: numbers must be 0 or more.`);
      items.push(it);
    }
    $('#savedMealDialog').close();
    const prev = savedEditId && savedById(savedEditId);
    if (prev) {
      const copy = { ...prev };
      upsertIn('savedMeals', { ...prev, name, items });
      render();
      toast(`✓ ${name} saved`, () => { upsertIn('savedMeals', copy); render(); toast('Undone — previous version restored'); });
    } else {
      const rec = upsertIn('savedMeals', { id: `sm-${uid()}`, name, items, createdAt: nowIso() });
      render();
      toast(`✓ ${name} created`, () => { removeIn('savedMeals', rec.id); render(); toast('Undone — saved meal removed'); });
    }
  },
  targets(form, btn) {
    const msg = $('#tgMsg'); clearErr(form, msg);
    const from = $('#tgFrom').value;
    if (!isDateKey(from)) return fieldErr($('#tgFrom'), msg, 'Pick the date these targets start.');
    const v = {};
    for (const [k, id, min, max] of [['kcal', 'tgKcal', 500, 10000], ['protein', 'tgProtein', 0, 600], ['carbs', 'tgCarbs', 0, 1500], ['fat', 'tgFat', 0, 500], ['fibre', 'tgFibre', 0, 200]]) {
      v[k] = readNum($(`#${id}`), { min, max, required: true });
      if (Number.isNaN(v[k])) return fieldErr($(`#${id}`), msg, `${k === 'kcal' ? 'Calories' : k[0].toUpperCase() + k.slice(1)} must be ${min}–${max}.`);
    }
    if (busy(btn)) return;
    const id = `tgt-${from}`, prev = S.targets.find(x => x.id === id);
    const copy = prev ? { ...prev } : null;
    upsertIn('targets', { id, effective: from, ...v });
    document.activeElement?.blur();
    render();
    toast(`✓ Targets saved from ${fmtDMY(from)}`, () => { if (copy) upsertIn('targets', copy); else removeIn('targets', id); render(); toast('Undone — targets restored'); });
  },
  meditation(form, btn) {
    const msg = $('#medMsg'); clearErr(form, msg);
    const dateEl = $('#medDate'), mEl = $('#medMinutes'), date = dateEl.value, mins = Number(mEl.value);
    if (!validDate(date)) return fieldErr(dateEl, msg, 'Pick a valid date (not in the future).');
    if (!(Number.isFinite(mins) && mins >= 1 && mins <= 300)) return fieldErr(mEl, msg, 'Enter 1–300 minutes.');
    if (busy(btn)) return;
    logged([{ date, type: 'meditation', name: 'Meditation', details: { minutes: Math.round(mins) } }], `✓ MEDITATION LOGGED · ${Math.round(mins)} min`);
    mEl.value = '';
  },
};

function logRecovery(code, btn) {
  const r = RECOVERY_ROUTINES.find(x => x.code === code), t = today();
  if (!r) return;
  if (actsOn(t, ['recovery']).some(a => a.code === code)) { toast(`${r.name} is already logged today`); return; }
  if (busy(btn)) return;
  logged([{ date: t, type: 'recovery', code, name: r.name, details: { items: r.items } }], `✓ ${r.name.toUpperCase()} LOGGED`);
}

function exportData() {
  let legacy = null;
  try { legacy = JSON.parse(lsGet(KEY_V4) || 'null'); } catch { legacy = null; }
  const payload = { app: 'EZ LIFE STYLE TRACKER', schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), state: S, legacyV4: legacy };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ez-life-style-tracker-backup-${today()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- events (delegated; no inline handlers) ----------
document.addEventListener('click', e => {
  const yt = e.target.closest('a.yt');
  if (yt) { e.preventDefault(); e.stopPropagation(); openYouTube(yt.dataset.yt); return; }
  const navBtn = e.target.closest('#nav button[data-page]');
  if (navBtn) { showPage(navBtn.dataset.page); if (mobileMQ.matches) closeDrawer(false); return; }
  const tabBtn = e.target.closest('#tabbar [data-tab]');
  if (tabBtn) { showPage(tabBtn.dataset.tab); return; }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const act = el.dataset.action;
  if (act === 'open-drawer') { if (mobileMQ.matches) openDrawer(); else setCollapsed(false); }
  else if (act === 'close-drawer') closeDrawer();
  else if (act === 'toggle-drawer') { if (app.classList.contains('drawer-open')) closeDrawer(); else openDrawer(); }
  else if (act === 'focus-checkin') { $('#checkinCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => $(el.dataset.field === 'sleep' ? '#ciSleepIn' : '#ciWeightIn').focus({ preventScroll: true }), 350); }
  else if (act === 'collapse') setCollapsed(true);
  else if (act === 'export') exportData();
  else if (act === 'log-prog') logProgram(el.closest('details.prog'));
  else if (act === 'select-all') {
    const det = el.closest('details.prog'), boxes = $$('input[type=checkbox]:not(:disabled)', det), all = boxes.every(b => b.checked);
    boxes.forEach(b => { b.checked = !all; });
    el.textContent = all ? 'Select all' : 'Clear all';
  }
  else if (act === 'log-rest') logRest(el);
  else if (act === 'remove-rest') deleteRecord(el.dataset.id, { ask: false });
  else if (act === 'delete') deleteRecord(el.dataset.id);
  else if (act === 'log-recovery') logRecovery(el.dataset.code, el);
  else if (act === 'goto') {
    showPage(el.dataset.page);
    const target = el.dataset.open && document.getElementById(el.dataset.open);
    if (target) { target.open = true; setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
  }
  else if (act === 'jump-today') { openDays.add(today()); logLimit = Math.max(logLimit, 21); renderLogs(); $(`details.day[data-date="${today()}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (act === 'log-more') { logLimit += 30; renderLogs(); }
  // nutrition
  else if (act === 'open-nutrition') { e.preventDefault(); nutDay = null; showPage('nutrition'); }
  else if (act === 'nut-jump') {
    const sec = $(`#nutMeals .meal[data-meal="${el.dataset.meal}"]`);
    if (sec) { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); sec.classList.remove('flash'); void sec.offsetWidth; sec.classList.add('flash'); }
  }
  else if (act === 'nut-step') { const d = addDays(nutDate(), Number(el.dataset.step)); nutDay = d < today() ? d : null; renderNutrition(); }
  else if (act === 'nut-today') { nutDay = null; renderNutrition(); }
  else if (act === 'food-add') openFoodDialog({ meal: el.dataset.meal || defaultMealForTime() });
  else if (act === 'food-edit') openFoodDialog({ id: el.dataset.id });
  else if (act === 'saved-add') openSavedAdd({ meal: el.dataset.meal, savedId: el.dataset.saved });
  else if (act === 'quick-add') { if (!busy(el)) logSavedMeal(el.dataset.id, quickMeal || defaultMealForTime(), 1); }
  else if (act === 'saved-new') openSavedMeal(null);
  else if (act === 'saved-edit') openSavedMeal(el.dataset.id);
  else if (act === 'saved-del') {
    const m = savedById(el.dataset.id);
    if (m && confirm(`Delete saved meal “${m.name}”? Past logs that used it are not affected.`)) {
      const copy = { ...m };
      removeIn('savedMeals', m.id); render();
      toast(`Saved meal deleted`, () => { upsertIn('savedMeals', copy); render(); toast('Restored'); });
    }
  }
  else if (act === 'target-del') {
    const x = S.targets.find(t => t.id === el.dataset.id);
    if (x) { const copy = { ...x }; removeIn('targets', x.id); render(); toast(`Targets from ${fmtDMY(x.effective)} removed`, () => { upsertIn('targets', copy); render(); toast('Restored'); }); }
  }
  else if (act === 'sm-add-row') { $('#smRows').insertAdjacentHTML('beforeend', smRowHtml()); $('#smRows .sm-row:last-child [data-f="name"]').focus(); updateSmTotals(); }
  else if (act === 'sm-del-row') { const rows = $$('#smRows .sm-row'); if (rows.length > 1) el.closest('.sm-row').remove(); else el.closest('.sm-row').querySelectorAll('input').forEach(i => { i.value = ''; }); updateSmTotals(); }
  else if (act === 'dialog-close') el.closest('dialog')?.close();
});

document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  FORMS[form.dataset.form]?.(form, e.submitter || $('button[type=submit]', form));
});

$('#checklist').addEventListener('change', e => {
  const cb = e.target.closest('input[data-task]');
  if (!cb) return;
  const t = today();
  (S.checks[t] ||= {})[cb.dataset.task] = { v: cb.checked, t: nowIso() };
  persist();
  renderChecklist();
  if (currentPage === 'dashboard') { renderScorecard(); renderRecoveryCard(); renderFocus(); }
});

// Lazily build a Logs day body when it is opened.
$('#logList').addEventListener('toggle', e => {
  const det = e.target;
  if (!det.matches?.('details.day')) return;
  const d = det.dataset.date;
  if (det.open) { openDays.add(d); const body = $('.day-body', det); if (!body.innerHTML) body.innerHTML = dayBody(d); }
  else openDays.delete(d);
}, true);

$('#themeSelect').addEventListener('change', e => {
  if (e.target.value === 'auto') EZTheme.clearManual(); else EZTheme.setManual(e.target.value, today());
  applyTheme();
});
$('#runDistance').addEventListener('input', updatePace);
$('#runTime').addEventListener('input', updatePace);
for (const id of ['runDate', 'medDate']) $(`#${id}`).addEventListener('change', e => { e.target.dataset.auto = e.target.value === today() ? '1' : '0'; });
// nutrition page wiring
$('#nutDay').addEventListener('change', e => { const v = e.target.value; nutDay = isDateKey(v) && v < today() ? v : null; renderNutrition(); });
$('#nutMeals').addEventListener('change', e => {
  const sel = e.target.closest('select[data-move]');
  if (!sel || !sel.value) return;
  const a = S.activities.find(x => x.id === sel.dataset.move);
  if (a) updated({ ...a }, { ...a, details: { ...a.details, meal: sel.value } }, `✓ ${a.name} moved to ${MEAL_NAMES[sel.value]}`);
});
$('#nutQuick').addEventListener('change', e => { if (e.target.id === 'quickMeal') quickMeal = e.target.value; });
$('#savedAddDialog').addEventListener('change', updateSavedPreview);
$('#saCustom').addEventListener('input', updateSavedPreview);
$('#smRows').addEventListener('input', updateSmTotals);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && app.classList.contains('drawer-open')) closeDrawer(); });

// iOS-style large titles: the small top-bar title fades in once the page's large title scrolls away.
const syncBarTitle = () => document.body.classList.toggle('scrolled', window.scrollY > 56);
window.addEventListener('scroll', syncBarTitle, { passive: true });

let resizeTimer = null;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawCharts, 150); });

// Another tab on this device saved → reload from storage.
window.addEventListener('storage', e => {
  if (e.key !== KEY || !e.newValue) return;
  try { S = mergeStates(S, JSON.parse(e.newValue)); render(); } catch { /* ignore */ }
});

window.addEventListener('online', () => syncNow());
window.addEventListener('offline', () => setSync('offline'));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { checkDayChange(); syncNow(); }
  else if (lsGet(DIRTY_KEY) === '1' && navigator.onLine) {
    const body = JSON.stringify(S);
    if (body.length < 60000) fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
  }
});

// Midnight rollover: new day → fresh checklist, new DAY number, weekly eligibility recalculated.
let lastDay = today();
function checkDayChange() {
  const t = today();
  if (t === lastDay) return;
  lastDay = t;
  openDays.clear();
  applyTheme(); // new day → yesterday's manual choice expires, today's daily theme applies
  render();
}
setInterval(checkDayChange, 30000);
setInterval(() => { if (lsGet(DIRTY_KEY) === '1' || document.visibilityState === 'visible') syncNow(); }, 120000);

// ---------- boot ----------
buildPrograms();
buildChecklist();
buildThemeSelect();
applyTheme();
if (lsGet(SIDEBAR_KEY) === '1' && !mobileMQ.matches) app.classList.add('collapsed');
showPage((location.hash || '').replace(/^#\/?/, '') || 'dashboard', { scroll: false });
setSync(navigator.onLine ? (lsGet(DIRTY_KEY) === '1' ? 'pending' : 'idle') : 'offline');
syncNow();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {}));
}

// Exposed for debugging/tests only.
window.EZ = { get state() { return S; }, syncNow, today, weekStart, dayNumber };
