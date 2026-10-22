import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";

const { api, ApiError } = tsxRequire("../app/apiClient.ts", import.meta.url);

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
