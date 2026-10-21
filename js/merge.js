// Shared by the browser app and the Cloudflare Worker (worker.js), so both sides
// merge state with exactly the same rules.
//
// State (schema v6):
//   activities: [{ id, date:'YYYY-MM-DD', type, subtype?, code?, name, details, createdAt, updatedAt }]
//               food log = one activity per item: type 'food', details { meal, qty, unit, kcal, protein, carbs, fat, fibre, ... }
//   savedMeals: [{ id, name, items:[{ name, qty, unit, kcal, protein, carbs, fat, fibre }], createdAt, updatedAt }]
//   targets:    [{ id, effective:'YYYY-MM-DD', kcal, protein, carbs, fat, fibre, updatedAt }] — a target applies from its date on
//   checks:     { 'YYYY-MM-DD': { taskKey: { v:boolean, t:isoTimestamp } } }
//   deleted:    { id: isoTimestamp }   — tombstones (any collection) so deletes/undos propagate across devices
//
// Merge rules (deterministic, never "replace everything"):
//   - activities, savedMeals and targets are unioned by id; for the same id the newer updatedAt wins
//   - a tombstone removes a record unless the record was updated after the delete
//   - checklist ticks merge per date + task; newer timestamp wins
//
// v5 → v6: the old one-per-day 'nutrition' entries become a single food item named
// "Daily total (legacy)" on the same date (deterministic id, same timestamps), and the old
// record is tombstoned. Runs inside normalizeState, so every device and the Worker convert
// identically and an old device can never bring the old record back.

export const SCHEMA_VERSION = 6;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function blankState() {
  return { schemaVersion: SCHEMA_VERSION, activities: [], savedMeals: [], targets: [], checks: {}, deleted: {}, meta: {} };
}

function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
const num = v => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Number(v) : 0);

function legacyFood(a) {
  const d = isObj(a.details) ? a.details : {};
  const stamp = a.updatedAt || a.createdAt || `${a.date}T12:00:00.000Z`;
  return {
    id: `food-legacy-${a.id}`, date: a.date, type: 'food', name: 'Daily total (legacy)',
    createdAt: a.createdAt || stamp, updatedAt: stamp,
    details: { meal: 'other', qty: 1, unit: 'pcs', kcal: num(d.calories), protein: num(d.protein), carbs: num(d.carbs), fat: num(d.fat), fibre: 0, legacy: true, ...(d.notes ? { notes: String(d.notes) } : {}) },
  };
}

export function normalizeState(input) {
  const s = isObj(input) ? input : {};
  const out = blankState();
  out.meta = isObj(s.meta) ? { ...s.meta } : {};
  if (isObj(s.deleted)) for (const [id, t] of Object.entries(s.deleted)) if (typeof t === 'string') out.deleted[id] = t;
  if (Array.isArray(s.activities)) {
    for (const a of s.activities) {
      if (!isObj(a) || typeof a.id !== 'string' || !a.id || !DATE_RE.test(a.date || '') || typeof a.type !== 'string') continue;
      if (a.type === 'nutrition') { // v5 → v6
        const f = legacyFood(a);
        out.activities.push(f);
        if (!out.deleted[a.id] || out.deleted[a.id] < f.updatedAt) out.deleted[a.id] = f.updatedAt;
        continue;
      }
      out.activities.push(a);
    }
  }
  if (Array.isArray(s.savedMeals)) {
    for (const m of s.savedMeals) {
      if (!isObj(m) || typeof m.id !== 'string' || !m.id || typeof m.name !== 'string' || !Array.isArray(m.items)) continue;
      out.savedMeals.push(m);
    }
  }
  if (Array.isArray(s.targets)) {
    for (const t of s.targets) {
      if (!isObj(t) || typeof t.id !== 'string' || !t.id || !DATE_RE.test(t.effective || '')) continue;
      out.targets.push(t);
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
  return out;
}

function unionById(lists, deleted) {
  const byId = new Map();
  for (const x of lists.flat()) {
    const prev = byId.get(x.id);
    if (!prev || String(x.updatedAt || '') > String(prev.updatedAt || '')) byId.set(x.id, x);
  }
  return [...byId.values()].filter(x => !(deleted[x.id] && deleted[x.id] >= String(x.updatedAt || '')));
}

export function mergeStates(a, b) {
  const A = normalizeState(a), B = normalizeState(b);
  const deleted = { ...A.deleted };
  for (const [id, t] of Object.entries(B.deleted)) if (!deleted[id] || t > deleted[id]) deleted[id] = t;

  const activities = unionById([A.activities, B.activities], deleted)
    .sort((x, y) => x.date.localeCompare(y.date) || String(x.createdAt || '').localeCompare(String(y.createdAt || '')) || x.id.localeCompare(y.id));
  const savedMeals = unionById([A.savedMeals, B.savedMeals], deleted)
    .sort((x, y) => String(x.createdAt || '').localeCompare(String(y.createdAt || '')) || x.id.localeCompare(y.id));
  const targets = unionById([A.targets, B.targets], deleted)
    .sort((x, y) => x.effective.localeCompare(y.effective) || x.id.localeCompare(y.id));

  const checks = {};
  for (const src of [A.checks, B.checks]) {
    for (const [date, tasks] of Object.entries(src)) {
      const day = checks[date] || (checks[date] = {});
      for (const [k, v] of Object.entries(tasks)) if (!day[k] || v.t > day[k].t) day[k] = v;
    }
  }
  return { schemaVersion: SCHEMA_VERSION, activities, savedMeals, targets, checks, deleted, meta: { ...B.meta, ...A.meta } };
}

// Deterministic stringify so two equal states compare equal.
export function stableString(s) {
  const n = normalizeState(s);
  const sortObj = o => Object.keys(o).sort().reduce((acc, k) => { acc[k] = isObj(o[k]) ? sortObj(o[k]) : o[k]; return acc; }, {});
  const byId = l => [...l].sort((x, y) => x.id.localeCompare(y.id));
  return JSON.stringify({ activities: n.activities, savedMeals: byId(n.savedMeals), targets: byId(n.targets), checks: sortObj(n.checks), deleted: sortObj(n.deleted) });
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
