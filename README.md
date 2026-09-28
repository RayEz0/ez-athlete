# EZ LIFE STYLE TRACKER

Personal athletic training, basketball, nutrition, recovery and daily-progress tracker.
Vanilla HTML/CSS/JS PWA served from the repo root by a Cloudflare Worker.

## Files
- `index.html`, `app.css` — the app shell and styles
- `js/program.js` — all training content (Gym A–J, Emergency 1–5, P1–P15, C1–C15, BB1–BB14)
- `js/app.js` — app logic (state, logging, undo, weekly eligibility, rendering, sync)
- `js/merge.js` — state schema v5, v4→v5 migration, deterministic merge (shared with the Worker)
- `worker.js` — `/api/state` sync endpoint backed by Workers KV (`EZ_DATA` binding)
- `sw.js`, `manifest.json`, icons — PWA

## Deploy
Push to GitHub; Cloudflare runs `npx wrangler deploy`. There is no build step and no `package.json`.
The KV namespace is created automatically on the first deploy (no `id` in `wrangler.jsonc`).

## Data
- Local copy: `localStorage["ez_tracker_v5"]`. The old `ez76_tracker_v4` key is migrated once and left untouched.
- Cloud copy: one KV document, merged by record id + timestamps (deletes are tombstones), plus a rolling daily snapshot kept for 60 days.
- **No login:** anyone with the site URL can read and change the synced data through `/api/state`.
- Export a full JSON backup from the sidebar or the Logs page.
