import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";
const { api } = tsxRequire("../app/apiClient.ts", import.meta.url);

function hangingFetch() {
  return (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      reject(error);
    });
  });
}

// CKB-058: a stalled classroom Wi-Fi connection left the module editor's save/run call pending
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
  await assert.rejects(promise, /timed out/i);
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
