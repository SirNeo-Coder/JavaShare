import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";

const { api, ApiError } = tsxRequire("../app/apiClient.ts", import.meta.url);

function hangingFetch() {
  return (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      reject(error);
    });
  });
}

// CKB-070: a stalled classroom Wi-Fi connection left the module editor's save/run call pending
// forever, so its readOnly={busy} lock never released. api() must time out instead of hanging.
test("api(): a stalled fetch rejects after the timeout instead of hanging forever", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", hangingFetch());
  const promise = api("/api/classrooms/x/modules/y/progress", { method: "PUT", body: "{}" });
  let settled = false;
  promise.then(() => { settled = true; }, () => { settled = true; });
  await Promise.resolve();
  assert.equal(settled, false, "must not resolve before the timeout fires");
  t.mock.timers.tick(20000);
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof ApiError);
    assert.match(error.message, /timed out/i);
    return true;
  });
});

test("api(): a caller's own abort signal still rejects with the original error, not a timeout message", async (t) => {
  t.mock.method(globalThis, "fetch", hangingFetch());
  const controller = new AbortController();
  const promise = api("/api/auth/me", { signal: controller.signal });
  controller.abort();
  await assert.rejects(promise, /aborted/i);
});

test("api(): a normal response still resolves and parses JSON as before", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.credentials, "include");
    return Response.json({ ok: true });
  });
  assert.deepEqual(await api("/api/health"), { ok: true });
});

for (const [label, status, body, type] of [
  ["HTML 503", 503, "<!DOCTYPE html><html>Service Unavailable</html>", "text/html"],
  ["plain-text 502", 502, "Bad Gateway", "text/plain"],
  ["empty 500", 500, "", "application/json"],
  ["malformed JSON 503", 503, '{"error":', "application/json"],
]) test(`API client: ${label} reports the failed status without exposing the response body`, async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => {
    calls.push(args);
    return new Response(body, { status, headers: { "content-type": type } });
  });
  await assert.rejects(api("/api/classrooms/example/modules/summary"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.message, `CodeShare could not complete the request (${status}). Please try again.`);
    return true;
  });
  assert.equal(calls.length, 1, "failed requests are not automatically retried");
});

test("API client: JSON errors preserve the server message and prerequisite details", async (t) => {
  const moduleAccess = { kind: "prerequisite", moduleId: "earlier-week", week: 1, message: "Complete earlier week first" };
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Complete earlier week first", moduleAccess }, { status: 403 }));
  await assert.rejects(api("/api/classrooms/example/modules/week-two"), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.message, "Complete earlier week first");
    assert.deepEqual(error.moduleAccess, moduleAccess);
    return true;
  });
});

test("API client: successful JSON and 204 responses preserve request options and session events", async (t) => {
  const events = [];
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => events.push(event) };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  const session = { id: "test-session", expiresAt: 1800000900000 };
  const responses = [Response.json({ session }), Response.json({ session }), new Response(null, { status: 204 })];
  const calls = [];
  t.mock.method(globalThis, "fetch", async (...args) => { calls.push(args); return responses.shift(); });
  assert.deepEqual(await api("/api/auth/me"), { session });
  assert.deepEqual(await api("/api/auth/activity", { method: "POST", body: "{}" }), { session });
  assert.equal(await api("/api/auth/logout", { method: "POST" }), null);
  assert.deepEqual(events.map(({ type, detail }) => ({ type, detail })), [
    { type: "codeshare:session", detail: session },
    { type: "codeshare:session", detail: null },
  ]);
  assert.equal(calls[1][1].credentials, "include");
  assert.equal(calls[1][1].method, "POST");
  assert.equal(calls[1][1].body, "{}");
  assert.equal(calls[1][1].headers["Content-Type"], "application/json");
});

test("API client: HTML 401 expires protected sessions but leaves failed login and registration alone", async (t) => {
  const events = [];
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  t.mock.method(globalThis, "fetch", async () => new Response("<!DOCTYPE html>Unauthorized", { status: 401 }));
  for (const path of ["/api/auth/login", "/api/auth/register"]) await assert.rejects(api(path), ApiError);
  assert.deepEqual(events, []);
  await assert.rejects(api("/api/bootstrap"), ApiError);
  assert.deepEqual(events, ["codeshare:session-expired"]);
});

test("API client: malformed successful responses are rejected instead of returning empty data", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response("<!DOCTYPE html>Unexpected page", { status: 200 }));
  await assert.rejects(api("/api/bootstrap"), { message: "CodeShare returned an unreadable response (200). Please try again." });
});

test("API client: network failures remain failures and are not retried", async (t) => {
  const failure = new TypeError("Failed to fetch");
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => { calls++; throw failure; });
  await assert.rejects(api("/api/auth/activity", { method: "POST" }), (error) => error === failure);
  assert.equal(calls, 1);
});
