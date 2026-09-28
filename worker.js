// EZ LIFE STYLE TRACKER — Cloudflare Worker sync endpoint.
//
// Only /api/* reaches this code (see run_worker_first in wrangler.jsonc); every other
// request is served straight from the static files at the repo root (index.html etc.).
//
// Storage: one JSON document in Workers KV (binding EZ_DATA). Clients POST their full
// local state; the server MERGES it with what is stored (js/merge.js — union by id,
// newest update wins, tombstones for deletes) and returns the merged result. A client
// can therefore never wipe newer server data by sending a stale copy.
//
// SECURITY LIMITATION (intentional, per project decision): there is no login. Anyone who
// knows this site's URL can read and modify the tracker data through /api/state. The
// Origin check below only stops other websites from writing via a visitor's browser; it
// is not access control. Do not store anything sensitive here.

import { mergeStates, normalizeState, stableString, SCHEMA_VERSION } from './js/merge.js';

const STATE_KEY = 'ez-life-style:state:v5';
const MAX_BODY = 5 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function readState(env) {
  const raw = await env.EZ_DATA.get(STATE_KEY);
  if (!raw) return normalizeState(null);
  try { return normalizeState(JSON.parse(raw)); } catch { return normalizeState(null); }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/state') {
      if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
      return env.ASSETS.fetch(request);
    }
    if (!env.EZ_DATA) return json({ error: 'Storage is not configured (missing EZ_DATA KV binding).' }, 503);

    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== url.host) return json({ error: 'Cross-origin requests are not allowed.' }, 403);

    try {
      if (request.method === 'GET') {
        return json({ schemaVersion: SCHEMA_VERSION, state: await readState(env), serverTime: new Date().toISOString() });
      }
      if (request.method === 'POST') {
        const len = Number(request.headers.get('content-length') || 0);
        if (len > MAX_BODY) return json({ error: 'Payload too large' }, 413);
        const text = await request.text();
        if (text.length > MAX_BODY) return json({ error: 'Payload too large' }, 413);
        let incoming;
        try { incoming = JSON.parse(text); } catch { return json({ error: 'Invalid JSON' }, 400); }

        const current = await readState(env);
        const merged = mergeStates(current, incoming);
        if (stableString(merged) !== stableString(current)) {
          const body = JSON.stringify(merged);
          await env.EZ_DATA.put(STATE_KEY, body);
          // One rolling daily snapshot (kept 60 days) as a safety net against bad writes.
          const day = new Date().toISOString().slice(0, 10);
          const snapKey = `ez-life-style:snapshot:${day}`;
          if (!(await env.EZ_DATA.get(snapKey))) await env.EZ_DATA.put(snapKey, body, { expirationTtl: 60 * 60 * 24 * 60 });
        }
        return json({ schemaVersion: SCHEMA_VERSION, state: merged, serverTime: new Date().toISOString() });
      }
      return json({ error: 'Method not allowed' }, 405);
    } catch (err) {
      return json({ error: 'Storage error', detail: String(err && err.message || err) }, 500);
    }
  },
};
