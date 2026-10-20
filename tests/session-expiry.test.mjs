import assert from "node:assert/strict";
import { test } from "node:test";
import { SignJWT, decodeJwt } from "jose";

process.env.JWT_SECRET = "session-expiry-test-secret";
process.env.SUPABASE_JWT_SECRET = "local-live-session-test-secret";
process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_ANON_KEY = "local-test-anon";
const { handleApi, apiConfig } = await import("../backend/src/routes.ts");
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const minute = 60000;
const start = 1800000000000;
const call = (path, cookie, options = {}) => handleApi(new Request(`http://localhost${path}`, { ...options, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...options.headers } }));
const token = async (role, idleExpiresAt, absoluteExpiresAt = start + 7 * 86400000) => "javashare_session=" + await new SignJWT({ id: "local-test-user", role, email: "test@example.test", name: "Session Test", passwordResetRequired: false, ...(idleExpiresAt === undefined ? {} : { idleExpiresAt }) })
  .setJti("local-test-session").setIssuedAt().setProtectedHeader({ alg: "HS256" }).setExpirationTime(absoluteExpiresAt / 1000).sign(secret);

test("session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: start });
  for (const [role, minutes] of [["student", 15], ["teacher", 120]]) {
    t.mock.timers.setTime(start);
    const cookie = await token(role, start + minutes * minute);
    for (const elapsed of [0, (minutes - 1) * minute, minutes * minute - 1]) {
      t.mock.timers.setTime(start + elapsed);
      const response = await call("/api/auth/me", cookie);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("set-cookie"), null, "reading the session must not renew it");
      assert.equal((await response.json()).session.expiresAt, start + minutes * minute);
    }
    t.mock.timers.setTime(start + minutes * minute);
    assert.equal((await call("/api/auth/me", cookie)).status, 401);
    assert.equal((await call("/api/auth/activity", cookie, { method: "POST", body: '{"elapsedMs":0}' })).status, 401, "expired sign-in cannot renew itself");
    assert.equal((await call("/api/bootstrap", cookie)).status, 401, "classroom data is denied before the database is read");
    t.mock.timers.setTime(start + 5 * 3600000);
    assert.equal((await call("/api/auth/me", cookie)).status, 401, "a five-hour shutdown cannot restore access");
  }
});

test("session: only explicit activity renews the role deadline, accounting for the delayed last gesture", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: start });
  for (const [role, minutes] of [["student", 15], ["teacher", 120]]) {
    t.mock.timers.setTime(start);
    const cookie = await token(role, start + minutes * minute);
    t.mock.timers.setTime(start + (minutes - 1) * minute);
    const renewed = await call("/api/auth/activity", cookie, { method: "POST", body: '{"elapsedMs":30000}' });
    assert.equal(renewed.status, 200);
    const session = (await renewed.json()).session;
    const freshCookie = renewed.headers.get("set-cookie").split(";")[0];
    assert.equal(session.expiresAt, Date.now() - 30000 + minutes * minute);
    assert.equal(session.id, "local-test-session");
    assert.equal(decodeJwt(freshCookie.split("=")[1]).idleExpiresAt, session.expiresAt);
    assert.match(renewed.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
    assert.doesNotMatch(renewed.headers.get("set-cookie"), /Secure/, "offline classroom HTTP keeps working");
    t.mock.timers.setTime(start + minutes * minute);
    assert.equal((await call("/api/auth/me", cookie)).status, 401);
    assert.equal((await call("/api/auth/me", freshCookie)).status, 200);
    t.mock.timers.setTime(session.expiresAt);
    assert.equal((await call("/api/auth/me", freshCookie)).status, 401);
  }
});

test("session: old seven-day cookies, forged cookies and invalid renewal bodies are refused", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: start });
  for (const cookie of [undefined, "javashare_session=forged", await token("student")]) assert.equal((await call("/api/auth/me", cookie)).status, 401);
  const cookie = await token("student", start + 15 * minute);
  for (const body of [{}, { elapsedMs: -1 }, { elapsedMs: 60001 }, { elapsedMs: "0" }]) {
    assert.equal((await call("/api/auth/activity", cookie, { method: "POST", body: JSON.stringify(body) })).status, 400);
  }
});

test("session: activity keeps the seven-day maximum and secure cookie settings", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: start });
  const end = start + 7 * 86400000;
  const cookie = await token("teacher", end);
  t.mock.timers.setTime(end - 10000);
  const renewed = await call("/api/auth/activity", cookie, { method: "POST", body: '{"elapsedMs":0}' });
  assert.equal((await renewed.json()).session.expiresAt, end);
  assert.equal(decodeJwt(renewed.headers.get("set-cookie").split(";")[0].split("=")[1]).exp, end / 1000);
  apiConfig.crossSiteCookies = true;
  try {
    const crossSite = await call("/api/auth/activity", cookie, { method: "POST", body: '{"elapsedMs":0}' });
    assert.match(crossSite.headers.get("set-cookie"), /Secure; SameSite=None/);
  } finally { apiConfig.crossSiteCookies = false; }
  t.mock.timers.setTime(end);
  assert.equal((await call("/api/auth/activity", cookie, { method: "POST", body: '{"elapsedMs":0}' })).status, 401);
});

test("session: live passes cannot outlast inactivity or renew an expired sign-in", async (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: start });
  for (const [role, minutes] of [["student", 15], ["teacher", 120]]) {
    t.mock.timers.setTime(start);
    const cookie = await token(role, start + minutes * minute);
    const response = await call("/api/realtime/pass", cookie);
    assert.equal(response.status, 200);
    const pass = await response.json();
    assert.equal(pass.expiresAt, start + Math.min(minutes, 60) * minute);
    assert.equal(decodeJwt(pass.token).exp * 1000, pass.expiresAt);
    t.mock.timers.setTime(start + minutes * minute);
    assert.equal((await call("/api/realtime/pass", cookie)).status, 401);
  }
});
