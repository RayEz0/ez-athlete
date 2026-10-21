// EZ LIFE STYLE TRACKER — nutrition helpers (pure functions, no DOM).
// Food items are activities of type 'food' (see js/merge.js for the state shape).

export const MEALS = [
  ['breakfast', 'Breakfast'], ['morning-snack', 'Morning snack'], ['lunch', 'Lunch'], ['evening-snack', 'Evening snack'],
  ['dinner', 'Dinner'], ['post-game', 'Post-game'], ['other', 'Other'],
];
export const MEAL_NAMES = Object.fromEntries(MEALS);
export const UNITS = ['g', 'mL', 'pcs', 'scoop', 'serving'];
// [key, label, unit, decimals]
export const MACROS = [['kcal', 'Calories', 'kcal', 0], ['protein', 'Protein', 'g', 0], ['carbs', 'Carbs', 'g', 0], ['fat', 'Fat', 'g', 0], ['fibre', 'Fibre', 'g', 0]];
export const MACRO_KEYS = MACROS.map(m => m[0]);
export const DEFAULT_TARGETS = { kcal: 2200, protein: 160, carbs: 245, fat: 65, fibre: 35 };

const n = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
export const round1 = v => Math.round(n(v) * 10) / 10;

// Targets that applied on `date`: the latest entry whose effective date is on/before it.
export function targetFor(targets, date) {
  let best = null;
  for (const t of targets || []) {
    if (t.effective > date) continue;
    if (!best || t.effective > best.effective || (t.effective === best.effective && String(t.updatedAt || '') > String(best.updatedAt || ''))) best = t;
  }
  const out = { ...DEFAULT_TARGETS, effective: best ? best.effective : null };
  if (best) for (const k of MACRO_KEYS) if (Number(best[k]) >= 0 && best[k] !== null && best[k] !== '') out[k] = Number(best[k]);
  return out;
}

export function sumMacros(list) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
  for (const x of list || []) for (const k of MACRO_KEYS) t[k] += n(x && x[k]);
  for (const k of MACRO_KEYS) t[k] = round1(t[k]);
  return t;
}

export function scaleMacros(m, factor) {
  const o = {};
  for (const k of MACRO_KEYS) o[k] = round1(n(m[k]) * factor);
  return o;
}

// Progress for one macro: percent (uncapped), bar width (capped) and a never-negative message.
export function macroProgress(consumed, target, unit = 'g') {
  const c = n(consumed), t = n(target);
  const pct = t > 0 ? Math.round(c / t * 100) : 0;
  const diff = round1(t - c);
  const fmt = v => (unit === 'kcal' ? Math.round(v).toLocaleString() : (Math.round(v * 10) / 10).toLocaleString());
  const text = diff > 0 ? `${fmt(diff)} ${unit} remaining` : diff < 0 ? `${fmt(-diff)} ${unit} over target` : 'Target reached';
  return { pct, bar: Math.max(0, Math.min(100, pct)), text, over: diff < 0 };
}

// Sensible default meal for "now".
export function defaultMealForTime(d = new Date()) {
  const m = d.getHours() * 60 + d.getMinutes();
  if (m < 10 * 60 + 30) return 'breakfast';
  if (m < 12 * 60) return 'morning-snack';
  if (m < 15 * 60 + 30) return 'lunch';
  if (m < 18 * 60 + 30) return 'evening-snack';
  if (m < 22 * 60 + 30) return 'dinner';
  return 'other';
}
