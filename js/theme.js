// EZ LIFE STYLE TRACKER — theme list + deterministic daily theme rotation.
// Classic script loaded in <head> so the right theme is applied before first paint.
//
// Rotation: the local calendar date → day number → position in a 31-day cycle. Each cycle is a
// fixed shuffle of all themes (seeded PRNG, seed = cycle number), so every theme appears once per
// cycle, the order changes from cycle to cycle, and it never depends on the device, install date or
// random numbers. Same date ⇒ same theme on every device. If a cycle would start with the theme that
// ended the previous cycle, its first two entries are swapped, so consecutive days always differ.
//
// Manual choice: stored with the date it was made ({date, theme}) and honoured only for that local
// date; the next day the automatic rotation resumes.
(function () {
  // [id, name, page background — used for the browser/status-bar colour]. Light themes only.
  var THEMES = [
    ['purple', 'Purple', '#f3f5fa'], ['pink', 'Pink', '#f3f5fa'], ['cyan', 'Cyan', '#f3f5fa'], ['sunset', 'Sunset', '#faf6f2'], ['arctic', 'Arctic', '#eef4f9'],
    ['lavender', 'Lavender', '#f6f3fb'], ['sage', 'Sage', '#eef2ec'], ['sand', 'Sand', '#f5f0e6'], ['clay', 'Clay', '#f7efe9'], ['dawn', 'Dawn', '#fcf2ef'],
    ['beige', 'Beige', '#f7f4ee'], ['cream', 'Cream', '#fbf8f1'], ['ivory', 'Ivory', '#fafaf4'], ['mint', 'Mint', '#f1f8f4'], ['sky', 'Sky', '#f1f6fc'],
    ['mist', 'Mist', '#f2f4f7'], ['blush', 'Blush', '#fbf3f4'], ['peach', 'Peach', '#fdf5ef'], ['lilac', 'Lilac', '#f8f4fb'], ['pearl', 'Pearl', '#f6f6f4'],
    ['linen', 'Linen', '#faf6f0'], ['oat', 'Oat', '#f6f2ea'], ['stone', 'Stone', '#f3f2ef'], ['ice', 'Ice', '#f0f7fa'], ['seafoam', 'Seafoam', '#eff9f6'],
    ['butter', 'Butter', '#fcf9ec'], ['rosequartz', 'Rose Quartz', '#fbf3f5'], ['chalk', 'Chalk', '#f7f7f5'], ['porcelain', 'Porcelain', '#f3f6fa'], ['honeydew', 'Honeydew', '#f4f9ee'],
  ];

  var IDS = THEMES.map(function (t) { return t[0]; });
  var MANUAL_KEY = 'ez_theme_manual';
  var ANCHOR = Date.UTC(2026, 0, 1); // day 0 of the rotation

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function localKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  // Day number of a *local calendar date* string (Date.UTC only does the arithmetic, so no timezone shift).
  function dayIndex(key) { var p = key.split('-'); return Math.round((Date.UTC(+p[0], +p[1] - 1, +p[2]) - ANCHOR) / 864e5); }
  function prng(seed) { // mulberry32 — deterministic, identical on every device
    return function () {
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function cycleOrder(c) {
    var ids = IDS.slice(), r = prng(0x5EED1 + c * 7919);
    for (var i = ids.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = ids[i]; ids[i] = ids[j]; ids[j] = t; }
    return ids;
  }
  function dailyTheme(key) {
    var n = dayIndex(key || localKey()), N = IDS.length, c = Math.floor(n / N), pos = n - c * N;
    var seq = cycleOrder(c);
    if (pos < 2) { // cycle boundary: never repeat the previous day's theme
      var prevLast = cycleOrder(c - 1)[N - 1];
      if (seq[0] === prevLast) { var t = seq[0]; seq[0] = seq[1]; seq[1] = t; }
    }
    return seq[pos];
  }
  function readManual() {
    try { var m = JSON.parse(localStorage.getItem(MANUAL_KEY) || 'null'); return m && typeof m === 'object' ? m : null; } catch (e) { return null; }
  }
  function resolve(key) {
    key = key || localKey();
    var m = readManual();
    if (m && m.date === key && IDS.indexOf(m.theme) >= 0) return { theme: m.theme, mode: 'manual' };
    return { theme: dailyTheme(key), mode: 'auto' };
  }
  function setManual(theme, key) { try { localStorage.setItem(MANUAL_KEY, JSON.stringify({ date: key || localKey(), theme: theme })); } catch (e) {} }
  function clearManual() { try { localStorage.removeItem(MANUAL_KEY); } catch (e) {} }

  window.EZTheme = { THEMES: THEMES, IDS: IDS, localKey: localKey, dailyTheme: dailyTheme, resolve: resolve, setManual: setManual, clearManual: clearManual };
  try { document.documentElement.setAttribute('data-theme', resolve().theme); } catch (e) {}
})();
