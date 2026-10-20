import assert from "node:assert/strict";
import { test } from "node:test";
import { setImmediate } from "node:timers";
import { require as tsxRequire } from "tsx/cjs/api";
const { watchSessionActivity } = tsxRequire("../app/sessionActivity.ts", import.meta.url);
const { api } = tsxRequire("../app/apiClient.ts", import.meta.url);
const start = 1800000000000, minute = 60000;
const flush = () => new Promise(setImmediate);

async function browser(t, minutes = 15) {
  t.mock.timers.enable({ apis: ["Date", "setTimeout"], now: start });
  const previous = { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage };
  const surface = () => {
    const listeners = new Map();
    return { listeners, addEventListener(name, fn) { if (!listeners.has(name)) listeners.set(name, new Set()); listeners.get(name).add(fn); }, removeEventListener(name, fn) { listeners.get(name)?.delete(fn); }, dispatchEvent(event) { for (const fn of [...(listeners.get(event.type) || [])]) fn(event); } };
  };
  const window = globalThis.window = { ...surface(), location: { pathname: "/" } };
  const document = globalThis.document = { ...surface(), visibilityState: "visible" };
  const values = new Map();
  globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  let current = { id: "session-a", expiresAt: start + minutes * minute, absoluteExpiresAt: start + 7 * 86400000 };
  const calls = [], warnings = []; let expired = 0, failRenewal = false;
  t.mock.method(globalThis, "fetch", async (path, init) => {
    calls.push({ path, init });
    if (path === "/api/auth/me") return Response.json({ session: current });
    if (path === "/api/auth/activity") {
      if (failRenewal) throw new Error("connection unavailable");
      current = { ...current, expiresAt: Date.now() - JSON.parse(init.body).elapsedMs + minutes * minute };
      return Response.json({ session: current });
    }
    if (path === "/api/auth/login") return Response.json({ error: "Wrong password" }, { status: 401 });
    if (path === "/api/refused") return Response.json({ error: "Session expired" }, { status: 401 });
    return Response.json({ ok: true });
  });
  const stop = watchSessionActivity((warning) => warnings.push(warning), () => expired++);
  t.after(() => { stop(); Object.assign(globalThis, previous); });
  await flush();
  const dispatch = (type, extra = {}) => window.dispatchEvent({ type, isTrusted: true, ...extra });
  return { calls, warnings, window, document, values, stop, dispatch, get expired() { return expired; }, set failRenewal(value) { failRenewal = value; }, activity: () => calls.filter((call) => call.path === "/api/auth/activity"), storage(value) {
    const newValue = value ? JSON.stringify(value) : null;
    if (newValue) values.set("javashare-session-activity", newValue); else values.delete("javashare-session-activity");
    dispatch("storage", { key: "javashare-session-activity", newValue });
  } };
}

test("idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen", async (t) => {
  const b = await browser(t);
  t.mock.timers.tick(14 * minute);
  await api("/api/bootstrap"); await api("/api/realtime/pass");
  assert.equal(b.warnings.at(-1), true); assert.equal(b.expired, 0); assert.equal(b.activity().length, 0);
  t.mock.timers.tick(minute);
  assert.equal(b.expired, 1); assert.equal(b.values.size, 0);
});

test("idle browser: real gestures renew at most once per minute and preserve the last gesture time", async (t) => {
  const b = await browser(t);
  b.dispatch("pointerdown"); await flush();
  assert.equal(b.activity().length, 1);
  t.mock.timers.tick(59000); b.dispatch("keydown"); b.dispatch("input"); await flush();
  assert.equal(b.activity().length, 1);
  t.mock.timers.tick(1000); await flush();
  assert.equal(b.activity().length, 2);
  assert.equal(JSON.parse(b.activity()[1].init.body).elapsedMs, 1000);
  const saved = JSON.parse(b.values.get("javashare-session-activity"));
  assert.equal(saved.expiresAt, start + 59000 + 15 * minute);
  b.dispatch("pointermove", { isTrusted: false });
  b.document.visibilityState = "hidden"; b.dispatch("keydown");
  t.mock.timers.tick(14 * minute); await flush();
  assert.equal(b.activity().length, 2); assert.equal(b.expired, 0);
  t.mock.timers.tick(59000);
  assert.equal(b.expired, 1);
});

test("idle browser: continuing during the warning clears it and starts a fresh idle period", async (t) => {
  const b = await browser(t);
  t.mock.timers.tick(14 * minute);
  assert.equal(b.warnings.at(-1), true);
  b.dispatch("keydown"); await flush();
  assert.equal(b.warnings.at(-1), false);
  t.mock.timers.tick(minute);
  assert.equal(b.expired, 0);
});

test("idle browser: a delayed background timer cannot report an old gesture as recent activity", async (t) => {
  const b = await browser(t);
  b.dispatch("pointerdown"); await flush();
  t.mock.timers.tick(59000); b.dispatch("keydown");
  t.mock.timers.setTime(start + 3 * minute);
  t.mock.timers.tick(1000); await flush();
  assert.equal(b.activity().length, 1);
});

test("idle browser: a five-hour suspension expires before the returning gesture can renew", async (t) => {
  const b = await browser(t, 120);
  t.mock.timers.setTime(start + 5 * 3600000);
  b.dispatch("keydown"); await flush();
  assert.equal(b.expired, 1); assert.equal(b.activity().length, 0);
});

test("idle browser: another tab's renewal is shared, and sign-out clears all tabs", async (t) => {
  const b = await browser(t);
  b.storage({ id: "session-a", expiresAt: start + 30 * minute, absoluteExpiresAt: start + 7 * 86400000 });
  t.mock.timers.tick(15 * minute);
  assert.equal(b.expired, 0); assert.equal(b.activity().length, 0);
  b.storage(null);
  assert.equal(b.expired, 1);
});

test("idle browser: suspended timer reads a newer deadline even before its storage event arrives", async (t) => {
  const b = await browser(t);
  b.values.set("javashare-session-activity", JSON.stringify({ id: "session-a", expiresAt: start + 30 * minute, absoluteExpiresAt: start + 7 * 86400000 }));
  t.mock.timers.tick(15 * minute);
  assert.equal(b.expired, 0);
  t.mock.timers.tick(15 * minute);
  assert.equal(b.expired, 1);
});

test("idle browser: changing accounts reloads old data without deleting the new session", async (t) => {
  const b = await browser(t);
  b.storage({ id: "session-b", expiresAt: start + 120 * minute, absoluteExpiresAt: start + 7 * 86400000 });
  assert.equal(b.expired, 1);
  assert.equal(JSON.parse(b.values.get("javashare-session-activity")).id, "session-b");
});

test("idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers", async (t) => {
  const b = await browser(t);
  b.failRenewal = true;
  t.mock.timers.tick(10 * minute); b.dispatch("keydown"); await flush();
  t.mock.timers.tick(5 * minute);
  assert.equal(b.expired, 1);
  b.stop();
  assert.ok([...b.window.listeners.values(), ...b.document.listeners.values()].every((set) => set.size === 0));
  t.mock.timers.tick(120 * minute);
  assert.equal(b.expired, 1);
});

test("idle browser: wrong login password leaves the session alone; a protected 401 signs it out", async (t) => {
  const b = await browser(t);
  await assert.rejects(api("/api/auth/login", { method: "POST" }));
  assert.equal(b.expired, 0);
  await assert.rejects(api("/api/refused"));
  assert.equal(b.expired, 1);
});
