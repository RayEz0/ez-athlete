// Shared by the browser app and the Cloudflare Worker (worker.js), so both sides
// merge state with exactly the same rules.
//
// State (schema v5):
//   activities: [{ id, date:'YYYY-MM-DD', type, subtype?, code?, name, details, createdAt, updatedAt }]
//   checks:     { 'YYYY-MM-DD': { taskKey: { v:boolean, t:isoTimestamp } } }
//   deleted:    { activityId: isoTimestamp }   — tombstones so deletes/undos propagate across devices
//
// Merge rules (deterministic, never "replace everything"):
//   - activities are unioned by id; for the same id the newer updatedAt wins
//   - a tombstone removes an activity unless the activity was updated after the delete
//   - checklist ticks merge per date + task; newer timestamp wins

export const SCHEMA_VERSION = 5;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function blankState() {
  return { schemaVersion: SCHEMA_VERSION, activities: [], checks: {}, deleted: {}, meta: {} };
}

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

export function normalizeState(input) {
  const s = isObj(input) ? input : {};
  const out = blankState();
  out.meta = isObj(s.meta) ? { ...s.meta } : {};
  if (Array.isArray(s.activities)) {
    for (const a of s.activities) {
      if (!isObj(a) || typeof a.id !== 'string' || !a.id || !DATE_RE.test(a.date || '') || typeof a.type !== 'string') continue;
      out.activities.push(a);
    }
  }
  if (isObj(s.checks)) {
    for (const [date, tasks] of Object.entries(s.checks)) {
      if (!DATE_RE.test(date) || !isObj(tasks)) continue;
      const day = {};
      for (const [k, v] of Object.entries(tasks)) if (isObj(v) && typeof v.v === 'boolean') day[k] = { v: v.v, t: String(v.t || '') };
      out.checks[date] = day;
    }
  }
  if (isObj(s.deleted)) for (const [id, t] of Object.entries(s.deleted)) if (typeof t === 'string') out.deleted[id] = t;
  return out;
}

export function mergeStates(a, b) {
  const A = normalizeState(a), B = normalizeState(b);
  const deleted = { ...A.deleted };
  for (const [id, t] of Object.entries(B.deleted)) if (!deleted[id] || t > deleted[id]) deleted[id] = t;

  const byId = new Map();
  for (const x of [...A.activities, ...B.activities]) {
    const prev = byId.get(x.id);
    if (!prev || String(x.updatedAt || '') > String(prev.updatedAt || '')) byId.set(x.id, x);
  }
  const activities = [...byId.values()]
    .filter(x => !(deleted[x.id] && deleted[x.id] >= String(x.updatedAt || '')))
    .sort((x, y) => x.date.localeCompare(y.date) || String(x.createdAt || '').localeCompare(String(y.createdAt || '')) || x.id.localeCompare(y.id));

  const checks = {};
  for (const src of [A.checks, B.checks]) {
    for (const [date, tasks] of Object.entries(src)) {
      const day = checks[date] || (checks[date] = {});
      for (const [k, v] of Object.entries(tasks)) if (!day[k] || v.t > day[k].t) day[k] = v;
    }
  }
  return { schemaVersion: SCHEMA_VERSION, activities, checks, deleted, meta: { ...B.meta, ...A.meta } };
}

// Deterministic stringify so two equal states compare equal.
export function stableString(s) {
  const n = normalizeState(s);
  const sortObj = o => Object.keys(o).sort().reduce((acc, k) => { acc[k] = isObj(o[k]) ? sortObj(o[k]) : o[k]; return acc; }, {});
  return JSON.stringify({ activities: n.activities, checks: sortObj(n.checks), deleted: sortObj(n.deleted) });
}

// ---- v4 → v5 migration -------------------------------------------------------
// v4 shape: { daily:{date:{checks:{}}}, gym:[{date,session,exercises}], activities:[{id,date,type,details,...}], weights:[{id,date,value}] }
// IDs and timestamps are derived from the old data so that two devices migrating the
// same v4 records produce identical v5 records (no duplicates after sync).

const OLD_GYM_NAMES = { A: 'Acceleration + Trap Bar', B: 'Upper Power + Front-Leg Strength', C: 'Deceleration + Posterior Chain', D: 'Vertical Power + Full Body', E: 'Capacity + Weak Links (Optional)' };

export function migrateV4(v4) {
  const out = blankState();
  if (!isObj(v4)) return out;
  const stamp = d => `${d}T12:00:00.000Z`;
  const add = rec => { if (DATE_RE.test(rec.date || '')) out.activities.push({ ...rec, createdAt: rec.createdAt || stamp(rec.date), updatedAt: rec.updatedAt || stamp(rec.date) }); };

  for (const g of Array.isArray(v4.gym) ? v4.gym : []) {
    if (!isObj(g)) continue;
    const code = String(g.session || '?');
    add({ id: `v4-gym-${g.date}-${code}`, date: g.date, type: 'gym', subtype: 'session', code,
      name: `Session ${code}` + (OLD_GYM_NAMES[code] ? ` — ${OLD_GYM_NAMES[code]}` : ''),
      details: { items: (Array.isArray(g.exercises) ? g.exercises : []).map(e => ({ name: String(e?.name || ''), meta: String(e?.meta || '') })) } });
  }

  for (const a of Array.isArray(v4.activities) ? v4.activities : []) {
    if (!isObj(a)) continue;
    const id = `v4-${String(a.id ?? `${a.date}-${a.type}-${a.details}`)}`;
    const text = String(a.details || '');
    const base = { id, date: a.date };
    if (a.type === 'run') {
      const dist = Number(a.distance), time = Number(a.time);
      const notes = text.split(' · ').slice(3).join(' · ');
      add({ ...base, type: 'running', name: 'Run', details: { distance: dist > 0 ? dist : null, time: time > 0 ? time : null, notes, text } });
    } else if (a.type === 'nutrition') {
      const num = re => { const m = text.match(re); return m ? Number(m[1]) : null; };
      const notes = text.split(' · ').slice(4).join(' · ');
      add({ ...base, type: 'nutrition', name: 'Nutrition', details: { calories: num(/(\d+(?:\.\d+)?)\s*kcal/), protein: num(/P\s*(\d+(?:\.\d+)?)g/), carbs: num(/C\s*(\d+(?:\.\d+)?)g/), fat: num(/F\s*(\d+(?:\.\d+)?)g/), notes } });
    } else if (a.type === 'recovery' && /^Meditation/i.test(text)) {
      const m = text.match(/(\d+(?:\.\d+)?)\s*min/);
      add({ ...base, type: 'meditation', name: 'Meditation', details: { minutes: m ? Number(m[1]) : null } });
    } else if (a.type === 'gym') {
      const m = text.match(/Emergency Home (\d+)/);
      add({ ...base, type: 'gym', subtype: 'emergency', code: m ? `H${m[1]}` : 'H?', name: m ? `Emergency Home ${m[1]}` : 'Emergency workout', details: { text } });
    } else if (['plyo', 'core', 'basketball'].includes(a.type)) {
      const m = text.match(/^(BB\d+|P\d+|C\d+)\s*·\s*([^—]+?)\s*—\s*(.*)$/);
      add({ ...base, type: a.type, code: m ? m[1] : undefined, name: m ? `${m[1]} — ${m[2]}` : text.slice(0, 60), details: { text: m ? m[3] : text } });
    } else {
      add({ ...base, type: String(a.type || 'other'), name: String(a.type || 'Activity'), details: { text } });
    }
  }

  for (const w of Array.isArray(v4.weights) ? v4.weights : []) {
    if (!isObj(w) || !(Number(w.value) > 0)) continue;
    add({ id: `v4-w-${String(w.id ?? `${w.date}-${w.value}`)}`, date: w.date, type: 'weight', name: 'Weight', details: { kg: Number(w.value) } });
  }

  if (isObj(v4.daily)) {
    for (const [date, day] of Object.entries(v4.daily)) {
      if (!DATE_RE.test(date) || !isObj(day?.checks)) continue;
      const tasks = {};
      for (const [k, v] of Object.entries(day.checks)) tasks[k] = { v: !!v, t: `${date}T00:00:00.000Z` };
      if (Object.keys(tasks).length) out.checks[date] = tasks;
    }
  }
  out.meta.migratedFromV4 = true;
  return normalizeState(out);
}
