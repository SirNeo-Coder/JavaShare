import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { activityStateId } from "../backend/src/module-activities.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const first = fixture.lessons[0].blocks[0];
const second = fixture.lessons[1].blocks[0];
const firstStateId = activityStateId(first);
let local;
try {
  local = Object.fromEntries(execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
} catch { local = null; }
const needsLocal = { skip: !local?.API_URL && "local Supabase is not running" };

async function withClass(action) {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://java.example.test/", JWT_SECRET: "module-activities-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [];
  let classroomId;
  const password = randomUUID();
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));
  try {
    for (const role of ["teacher", "student", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-activity.example.test`, password, email_confirm: true, user_metadata: { name: `Activity ${role}` } });
      assert.equal(error, null); users.push(data.user);
      await admin.from("profiles").update({ role }).eq("id", data.user.id);
    }
    const created = await admin.from("classrooms").insert({ name: "Module activity test", join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id }).select("id").single();
    assert.equal(created.error, null); classroomId = created.data.id;
    assert.equal((await admin.from("classroom_members").insert(users.slice(0, 3).map((user) => ({ classroom_id: classroomId, user_id: user.id })))).error, null);
    const cookies = [];
    for (const user of users) {
      const response = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const request = (suffix = "", body, cookie = cookies[1], moduleId = fixture.id) => call(`/api/classrooms/${classroomId}/modules/${moduleId}${suffix}`, { method: body === undefined ? "GET" : "POST", headers: { cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const upload = async (module = fixture) => {
      const response = await call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: cookies[0] }, body: JSON.stringify(module) });
      assert.equal(response.status, 201, await response.text());
    };
    const prepare = async (stepId = first.id, cookie = cookies[1], moduleId = fixture.id) => {
      const response = await request("/progress/activity", { stepId }, cookie, moduleId);
      assert.equal(response.status, 200, await response.clone().text()); return response.json();
    };
    await upload();
    await action({ admin, users, classroomId, cookies, call, request, upload, prepare });
  } finally {
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
}

test("online module tasks: browser results check the task target and cannot reuse a sample pass", needsLocal, async () => {
  await withClass(async ({ upload, prepare, request }) => {
    const content = structuredClone(fixture);
    content.lessons[0].blocks[0].activity.id = "browser-alteration";
    await upload(content);
    let progress = await prepare();
    const report = (output, success = true) => request("/progress/browser-result", { stepId: first.id, updatedAt: progress.updatedAt, output, success, expectedOutput: output });
    let result = await (await report(first.expectedOutput)).json();
    assert.equal(result.passed, false); progress = result.progress;
    result = await (await report(first.activity.expectedOutput, false)).json();
    assert.equal(result.passed, false); progress = result.progress;
    result = await (await report(first.activity.expectedOutput)).json();
    assert.equal(result.passed, true);
    assert.equal(result.progress.stepStates["task:browser-alteration"], "pass");
    assert.equal(result.progress.stepStates[first.id], undefined);
    assert.equal((await (await request()).json()).lessons[1].closed, false);
  });
});

test("online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access", needsLocal, async () => {
  await withClass(async ({ call, request, prepare, cookies, classroomId, admin, users }) => {
    assert.equal((await call("/api/java-runner")).status, 401);
    assert.deepEqual(await (await call("/api/java-runner", { headers: { cookie: cookies[1] } })).json(), { mode: "browser", url: "https://java.example.test/" });
    const progress = await prepare();
    const report = (patch = {}, cookie = cookies[1]) => request("/progress/browser-result", { stepId: first.id, updatedAt: progress.updatedAt, success: true, output: first.expectedOutput, ...patch }, cookie);
    assert.equal((await report({}, cookies[0])).status, 403);
    assert.equal((await report({}, cookies[3])).status, 403, "students outside the class cannot report results");
    assert.equal((await report({}, cookies[2])).status, 409, "another student's version is not this student's version");
    assert.equal((await report({ stepId: second.id })).status, 403);
    assert.equal((await report({ updatedAt: "2000-01-01T00:00:00Z" })).status, 409);
    assert.equal((await report({ success: "yes" })).status, 400);
    assert.equal((await report({ output: "x".repeat(70001) })).status, 400);
    let result = await (await report({ success: false })).json();
    assert.equal(result.passed, false); assert.equal(result.progress.percent, 0);
    progress.updatedAt = result.progress.updatedAt;
    result = await (await report({ output: first.expectedOutput + " " })).json();
    assert.equal(result.passed, false); progress.updatedAt = result.progress.updatedAt;
    const forged = await call(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress/step`, { method: "PUT", headers: { cookie: cookies[1] }, body: JSON.stringify({ stepId: first.id, status: "pass" }) });
    assert.equal(forged.status, 403);
    result = await (await report()).json();
    assert.equal(result.passed, true); assert.equal(result.progress.percent, 25);
    assert.equal((await (await request()).json()).lessons[1].closed, false);
    assert.equal((await (await request("", undefined, cookies[2])).json()).lessons[1].closed, true);
    progress.updatedAt = result.progress.updatedAt;
    result = await (await report({ success: false, output: "bad" })).json();
    assert.equal(result.passed, false); assert.equal(result.progress.stepStates[firstStateId], "pass", "a later bad run preserves earlier completion");
    const saved = await call(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress/project`, { method: "PUT", headers: { cookie: cookies[1] }, body: JSON.stringify({ files: progress.projectFiles, updatedAt: result.progress.updatedAt }) });
    assert.equal(saved.status, 200);
    assert.equal((await report()).status, 409, "a result from before a save is stale");
    await call(`/api/classrooms/${classroomId}/active-module`, { method: "PUT", headers: { cookie: cookies[0] }, body: JSON.stringify({ moduleId: fixture.id }) });
    assert.equal((await request("/progress/browser-result", { stepId: "missing", updatedAt: (await saved.json()).updatedAt, success: true, output: "" })).status, 404);
    const live = await admin.from("activities").insert({ classroom_id: classroomId, created_by: users[0].id, title: "Online live-lock check", mode: "individual" }).select("id").single();
    assert.equal(live.error, null);
    assert.equal((await admin.from("classrooms").update({ current_activity_id: live.data.id, active_module_id: "different-week" }).eq("id", classroomId)).error, null);
    assert.equal((await report()).status, 403, "online reports cannot bypass the live-week lock");
  });
});

test("online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available", needsLocal, async () => {
  await withClass(async ({ call, cookies }) => {
    const config = () => call("/api/java-runner", { headers: { cookie: cookies[1] } });
    delete process.env.JAVA_RUNNER_URL; delete process.env.JUDGE0_URL;
    assert.equal((await config()).status, 503);
    process.env.JUDGE0_URL = "https://judge.example.test";
    assert.deepEqual(await (await config()).json(), { mode: "judge0" });
    delete process.env.JUDGE0_URL;
    for (const url of ["not-an-address", "http://remote.example.test/", "http://127.0.0.1:3000/", "https://user:pass@java.example.test/", "https://java.example.test/subpath"]) {
      process.env.JAVA_RUNNER_URL = url; assert.equal((await config()).status, 503);
    }
    process.env.JAVA_RUNNER_URL = "http://localhost:3003/";
    assert.equal((await config()).status, 200);
  });
});
