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
  var THEMES = [
    ['purple', 'Purple', '#6d3cf5'], ['pink', 'Pink', '#cf2470'], ['cyan', 'Cyan', '#0782a3'], ['midnight', 'Midnight', '#0b1120'],
    ['sunset', 'Sunset', '#cf5a33'], ['arctic', 'Arctic', '#2f7fb8'], ['forest', 'Forest', '#0b120e'], ['ember', 'Ember', '#110c0a'],
    ['lavender', 'Lavender', '#6f55bd'], ['ocean', 'Ocean', '#07131a'], ['rose', 'Rose', '#130c11'],
    ['graphite', 'Graphite', '#111214'], ['coffee', 'Coffee', '#14100d'], ['wine', 'Wine', '#140a0e'], ['moss', 'Moss', '#10120b'],
    ['sage', 'Sage', '#4f7a5b'], ['sand', 'Sand', '#8a6a2c'], ['clay', 'Clay', '#a44d2c'], ['plum', 'Plum', '#120c16'],
    ['berry', 'Berry', '#170a12'], ['copper', 'Copper', '#120f0d'], ['slate', 'Slate', '#121820'], ['storm', 'Storm', '#1a1d22'],
    ['aurora', 'Aurora', '#0a0f1a'], ['dusk', 'Dusk', '#121226'], ['dawn', 'Dawn', '#b3505f'], ['desert', 'Desert', '#a8591c'],
    ['moonlight', 'Moonlight', '#080b12'], ['evergreen', 'Evergreen', '#061210'], ['crimson', 'Crimson', '#111012'], ['steel', 'Steel', '#0c1117'],
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
