var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// js/merge.js
var SCHEMA_VERSION = 6;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function blankState() {
  return { schemaVersion: SCHEMA_VERSION, activities: [], savedMeals: [], targets: [], checks: {}, deleted: {}, meta: {} };
}
__name(blankState, "blankState");
function isObj(x) {
  return x && typeof x === "object" && !Array.isArray(x);
}
__name(isObj, "isObj");
var num = /* @__PURE__ */ __name((v) => Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : 0, "num");
function legacyFood(a) {
  const d = isObj(a.details) ? a.details : {};
  const stamp = a.updatedAt || a.createdAt || `${a.date}T12:00:00.000Z`;
  return {
    id: `food-legacy-${a.id}`,
    date: a.date,
    type: "food",
    name: "Daily total (legacy)",
    createdAt: a.createdAt || stamp,
    updatedAt: stamp,
    details: { meal: "other", qty: 1, unit: "pcs", kcal: num(d.calories), protein: num(d.protein), carbs: num(d.carbs), fat: num(d.fat), fibre: 0, legacy: true, ...d.notes ? { notes: String(d.notes) } : {} }
  };
}
__name(legacyFood, "legacyFood");
function normalizeState(input) {
  const s = isObj(input) ? input : {};
  const out = blankState();
  out.meta = isObj(s.meta) ? { ...s.meta } : {};
  if (isObj(s.deleted)) {
    for (const [id, t] of Object.entries(s.deleted)) if (typeof t === "string") out.deleted[id] = t;
  }
  if (Array.isArray(s.activities)) {
    for (const a of s.activities) {
      if (!isObj(a) || typeof a.id !== "string" || !a.id || !DATE_RE.test(a.date || "") || typeof a.type !== "string") continue;
      if (a.type === "nutrition") {
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
      if (!isObj(m) || typeof m.id !== "string" || !m.id || typeof m.name !== "string" || !Array.isArray(m.items)) continue;
      out.savedMeals.push(m);
    }
  }
  if (Array.isArray(s.targets)) {
    for (const t of s.targets) {
      if (!isObj(t) || typeof t.id !== "string" || !t.id || !DATE_RE.test(t.effective || "")) continue;
      out.targets.push(t);
    }
  }
  if (isObj(s.checks)) {
    for (const [date, tasks] of Object.entries(s.checks)) {
      if (!DATE_RE.test(date) || !isObj(tasks)) continue;
      const day = {};
      for (const [k, v] of Object.entries(tasks)) if (isObj(v) && typeof v.v === "boolean") day[k] = { v: v.v, t: String(v.t || "") };
      out.checks[date] = day;
    }
  }
  return out;
}
__name(normalizeState, "normalizeState");
function unionById(lists, deleted) {
  const byId = /* @__PURE__ */ new Map();
  for (const x of lists.flat()) {
    const prev = byId.get(x.id);
    if (!prev || String(x.updatedAt || "") > String(prev.updatedAt || "")) byId.set(x.id, x);
  }
  return [...byId.values()].filter((x) => !(deleted[x.id] && deleted[x.id] >= String(x.updatedAt || "")));
}
__name(unionById, "unionById");
function mergeStates(a, b) {
  const A = normalizeState(a), B = normalizeState(b);
  const deleted = { ...A.deleted };
  for (const [id, t] of Object.entries(B.deleted)) if (!deleted[id] || t > deleted[id]) deleted[id] = t;
  const activities = unionById([A.activities, B.activities], deleted).sort((x, y) => x.date.localeCompare(y.date) || String(x.createdAt || "").localeCompare(String(y.createdAt || "")) || x.id.localeCompare(y.id));
  const savedMeals = unionById([A.savedMeals, B.savedMeals], deleted).sort((x, y) => String(x.createdAt || "").localeCompare(String(y.createdAt || "")) || x.id.localeCompare(y.id));
  const targets = unionById([A.targets, B.targets], deleted).sort((x, y) => x.effective.localeCompare(y.effective) || x.id.localeCompare(y.id));
  const checks = {};
  for (const src of [A.checks, B.checks]) {
    for (const [date, tasks] of Object.entries(src)) {
      const day = checks[date] || (checks[date] = {});
      for (const [k, v] of Object.entries(tasks)) if (!day[k] || v.t > day[k].t) day[k] = v;
    }
  }
  return { schemaVersion: SCHEMA_VERSION, activities, savedMeals, targets, checks, deleted, meta: { ...B.meta, ...A.meta } };
}
__name(mergeStates, "mergeStates");
function stableString(s) {
  const n = normalizeState(s);
  const sortObj = /* @__PURE__ */ __name((o) => Object.keys(o).sort().reduce((acc, k) => {
    acc[k] = isObj(o[k]) ? sortObj(o[k]) : o[k];
    return acc;
  }, {}), "sortObj");
  const byId = /* @__PURE__ */ __name((l) => [...l].sort((x, y) => x.id.localeCompare(y.id)), "byId");
  return JSON.stringify({ activities: n.activities, savedMeals: byId(n.savedMeals), targets: byId(n.targets), checks: sortObj(n.checks), deleted: sortObj(n.deleted) });
}
__name(stableString, "stableString");

// worker.js
var STATE_KEY = "ez-life-style:state:v5";
var MAX_BODY = 5 * 1024 * 1024;
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
__name(json, "json");
async function readState(env) {
  const raw = await env.EZ_DATA.get(STATE_KEY);
  if (!raw) return normalizeState(null);
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return normalizeState(null);
  }
}
__name(readState, "readState");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/state") {
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    }
    if (!env.EZ_DATA) return json({ error: "Storage is not configured (missing EZ_DATA KV binding)." }, 503);
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== url.host) return json({ error: "Cross-origin requests are not allowed." }, 403);
    try {
      if (request.method === "GET") {
        return json({ schemaVersion: SCHEMA_VERSION, state: await readState(env), serverTime: (/* @__PURE__ */ new Date()).toISOString() });
      }
      if (request.method === "POST") {
        const len = Number(request.headers.get("content-length") || 0);
        if (len > MAX_BODY) return json({ error: "Payload too large" }, 413);
        const text = await request.text();
        if (text.length > MAX_BODY) return json({ error: "Payload too large" }, 413);
        let incoming;
        try {
          incoming = JSON.parse(text);
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const current = await readState(env);
        const merged = mergeStates(current, incoming);
        if (stableString(merged) !== stableString(current)) {
          const body = JSON.stringify(merged);
          await env.EZ_DATA.put(STATE_KEY, body);
          const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          const snapKey = `ez-life-style:snapshot:${day}`;
          if (!await env.EZ_DATA.get(snapKey)) await env.EZ_DATA.put(snapKey, body, { expirationTtl: 60 * 60 * 24 * 60 });
        }
        return json({ schemaVersion: SCHEMA_VERSION, state: merged, serverTime: (/* @__PURE__ */ new Date()).toISOString() });
      }
      return json({ error: "Method not allowed" }, 405);
    } catch (err) {
      return json({ error: "Storage error", detail: String(err && err.message || err) }, 500);
    }
  }
};

// ../../Users/raydi/AppData/Local/Temp/claude/c--ez-athelete-ez-athlete/0f819a78-cc1f-472e-b3a7-c2ba4d2e917a/scratchpad/tools3/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../Users/raydi/AppData/Local/Temp/claude/c--ez-athelete-ez-athlete/0f819a78-cc1f-472e-b3a7-c2ba4d2e917a/scratchpad/tools3/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ks4Gyr/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../Users/raydi/AppData/Local/Temp/claude/c--ez-athelete-ez-athlete/0f819a78-cc1f-472e-b3a7-c2ba4d2e917a/scratchpad/tools3/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ks4Gyr/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
