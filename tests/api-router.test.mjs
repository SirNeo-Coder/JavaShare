// Run with: npm test
// The router checks need nothing; the route checks need local Supabase (skipped otherwise).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { createRouter, HttpError } from "../backend/src/router.ts";

const errors = (error, res) => res.status(500).json({ error: String(error?.message || error) });

test("router: path parameters, query, cookies, and JSON body reach the handler", async () => {
  const api = createRouter(errors);
  api.post("/api/items/:itemId", (req, res) => res.status(201).json({ id: req.params.itemId, view: req.query.view, who: req.cookies.javashare_session, body: req.body }));
  const response = await api.handle(new Request("http://x/api/items/a%20b?view=groups", { method: "POST", headers: { cookie: "other=1; javashare_session=tok%3D", "content-type": "application/json" }, body: '{"n":1}' }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { id: "a b", view: "groups", who: "tok=", body: { n: 1 } });
});

test("router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler", async () => {
  const api = createRouter((error, res) => res.status(418).json({ error: error.message }));
  const allow = (req, _res, next) => { req.user = "teacher"; next(); };
  const deny = (_req, res) => res.status(403).json({ error: "no" });
  api.get("/ok", allow, (req, res) => res.json({ user: req.user }));
  api.get("/denied", deny, () => { throw new Error("must not run"); });
  api.get("/fails", (_req, _res, next) => next(new Error("boom")));
  assert.deepEqual(await (await api.handle(new Request("http://x/ok"))).json(), { user: "teacher" });
  assert.equal((await api.handle(new Request("http://x/denied"))).status, 403);
  const failed = await api.handle(new Request("http://x/fails"));
  assert.equal(failed.status, 418);
  assert.deepEqual(await failed.json(), { error: "boom" });
});

test("router: cookies, 204, unknown routes, bad JSON, and size limits", async () => {
  const api = createRouter(errors);
  api.post("/login", (_req, res) => { res.cookie("javashare_session", "abc", { httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 86400000, path: "/" }); res.json({}); });
  api.post("/logout", (_req, res) => { res.clearCookie("javashare_session", { path: "/" }); res.status(204).end(); });
  api.put("/photo", (req, res) => res.json({ bytes: req.body.length, isBuffer: Buffer.isBuffer(req.body) }));
  api.post("/echo", (req, res) => res.json(req.body ?? null));
  const login = await api.handle(new Request("http://x/login", { method: "POST" }));
  assert.equal(login.headers.get("set-cookie"), "javashare_session=abc; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=None");
  const logout = await api.handle(new Request("http://x/logout", { method: "POST" }));
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get("set-cookie"), /^javashare_session=; Path=\/; Max-Age=0/);
  assert.equal((await api.handle(new Request("http://x/missing"))).status, 404);
  assert.equal((await api.handle(new Request("http://x/echo", { method: "POST", headers: { "content-type": "application/json" }, body: "{oops" }))).status, 400);
  const big = "x".repeat(300 * 1024 + 1);
  assert.equal((await api.handle(new Request("http://x/echo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(big) }))).status, 413);
  const photo = await api.handle(new Request("http://x/photo", { method: "PUT", headers: { "content-type": "image/png" }, body: new Uint8Array([1, 2, 3]) }));
  assert.deepEqual(await photo.json(), { bytes: 3, isBuffer: true });
  assert.equal((await api.handle(new Request("http://x/photo", { method: "PUT", headers: { "content-type": "image/png" }, body: new Uint8Array(2 * 1024 * 1024 + 1) }))).status, 413);
  assert.ok(new HttpError(413, "x") instanceof Error);
});

function localSupabase() {
  try {
    const output = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const env = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
    return env.API_URL ? env : null;
  } catch { return null; }
}
const local = localSupabase();

test("routes: register, stay signed in with the cookie, get a live pass, sign out", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "route-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const email = `route-${Date.now()}@example.test`;
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));
  const registered = await call("/api/auth/register", { method: "POST", body: JSON.stringify({ name: "Route Test", email, password: "route-test-password" }) });
  assert.equal(registered.status, 201);
  const cookie = registered.headers.get("set-cookie").split(";")[0];
  assert.doesNotMatch(registered.headers.get("set-cookie"), /Secure/, "plain http on the classroom network must not get a Secure cookie");
  try {
    const me = await (await call("/api/auth/me", { headers: { cookie } })).json();
    assert.equal(me.user.email, email);
    const pass = await call("/api/realtime/pass", { headers: { cookie } });
    assert.equal(pass.status, 200);
    assert.deepEqual(Object.keys(await pass.json()).sort(), ["anonKey", "expiresAt", "token", "url"]);
    assert.equal((await call("/api/auth/me")).status, 401);
    assert.equal((await call("/api/auth/me", { headers: { cookie: "javashare_session=forged" } })).status, 401);
    assert.equal((await call("/api/auth/logout", { method: "POST", headers: { cookie } })).status, 204);
  } finally {
    await getSupabaseAdmin().auth.admin.deleteUser(JSON.parse(atob(cookie.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).id);
  }
});
