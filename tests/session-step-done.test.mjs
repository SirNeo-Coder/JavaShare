import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// Class session step count (teacher, 2026-11-11): the Class session bar shows "Step N · done/total done"; hover lists
// who is done and who is not. It re-reads only when the followed page moves or a student finishes a task.
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
fixture.id = `session-step-done-${randomUUID().slice(0, 6)}`;
const [stepOne, stepTwo] = fixture.lessons.map((lesson) => lesson.blocks[0]);

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("session step count: real routes count only this class's passes of the followed step's task; finishing a task tells the class", { skip: !local?.API_URL && "local Supabase is not running" }, async (t) => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://runner.example.test", JWT_SECRET: "session-step-done-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  // Record the server's live messages (broadcast posts to Supabase Realtime) while still sending them.
  const events = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, init) => {
    if (String(url).endsWith("/realtime/v1/api/broadcast")) events.push(...JSON.parse(init.body).messages.map((message) => `${message.topic} ${message.event}`));
    return realFetch(url, init);
  };
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const users = [], cookies = [], classes = [];
  const password = randomUUID();
  try {
    // teacher, Ana (done), Ben (not done; also in the other class), other teacher, Cy (another class, also done)
    for (const [role, name] of [["teacher", "Teacher"], ["student", "Ana Done"], ["student", "Ben Notyet"], ["teacher", "Other"], ["student", "Cy Elsewhere"]]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@step-done.example.test`, password, email_confirm: true, user_metadata: { name } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const [teacher, ana, ben, otherTeacher] = cookies;
    const makeClass = async (cookie, members) => {
      const created = await call("/api/classes", cookie, "POST", { subject: "Java", name: "Step done class" });
      assert.equal(created.status, 201); const id = (await created.json()).id; classes.push(id);
      for (const user of members) assert.equal((await admin.from("classroom_members").insert({ classroom_id: id, user_id: user.id })).error, null);
      const uploaded = await call(`/api/classrooms/${id}/modules`, cookie, "POST", fixture);
      assert.equal(uploaded.status, 201, await uploaded.clone().text());
      return id;
    };
    const classId = await makeClass(teacher, [users[1], users[2]]);
    const elsewhere = await makeClass(otherTeacher, [users[4], users[2]]);
    const count = async (cookie = teacher) => (await call(`/api/classes/${classId}/session/step-progress`, cookie)).json();
    const follow = (lesson, step) => call(`/api/classes/${classId}/session`, teacher, "PUT", { active: true, follow: { moduleId: fixture.id, page: `${lesson.id}:${step.id}`, stepId: step.id } });
    const pass = async (classroomId, user, states) => assert.equal((await admin.from("module_progress").upsert({ classroom_id: classroomId, student_id: user.id, module_id: fixture.id, step_states: states, performance_task: {}, project_files: [] }, { onConflict: "student_id,classroom_id,module_id" })).error, null);

    await t.test("only the class teacher reads it; no session means no count", async () => {
      assert.equal((await call(`/api/classes/${classId}/session/step-progress`, ana)).status, 403);
      assert.equal((await call(`/api/classes/${classId}/session/step-progress`, otherTeacher)).status, 403);
      assert.deepEqual(await count(), { step: null });
      assert.equal((await call(`/api/classes/${classId}/session`, teacher, "PUT", { active: true })).status, 200);
      assert.deepEqual(await count(), { step: null }, "a session with no open worksheet has no step");
    });
    await t.test("the followed step lists every student, sorted by name, as not done yet", async () => {
      assert.equal((await follow(fixture.lessons[0], stepOne)).status, 200);
      assert.deepEqual(await count(), { step: { moduleId: fixture.id, stepId: stepOne.id, number: 1 }, done: [], notDone: ["Ana Done", "Ben Notyet"] });
    });
    await t.test("a pass counts; another class's pass, another step's pass and a failed run do not", async () => {
      await pass(classId, users[1], { [stepOne.id]: "pass" });
      await pass(classId, users[2], { [stepOne.id]: "fail", [stepTwo.id]: "pass" });
      await pass(elsewhere, users[4], { [stepOne.id]: "pass" });
      await pass(elsewhere, users[2], { [stepOne.id]: "pass" }); // Ben is in both classes
      assert.deepEqual(await count(), { step: { moduleId: fixture.id, stepId: stepOne.id, number: 1 }, done: ["Ana Done"], notDone: ["Ben Notyet"] });
    });
    await t.test("an alteration task counts its task pass, never the sample check", async () => {
      const content = structuredClone(fixture);
      content.lessons[0].blocks[0].activity.id = "step-done-task";
      assert.equal((await call(`/api/classrooms/${classId}/modules`, teacher, "POST", content)).status, 201);
      await pass(classId, users[1], { "sample:step-done-task": "pass" });
      await pass(classId, users[2], { "task:step-done-task": "pass" });
      assert.deepEqual((await count()).done, ["Ben Notyet"]);
      assert.equal((await call(`/api/classrooms/${classId}/modules`, teacher, "POST", fixture)).status, 201);
    });
    await t.test("moving on counts the new step; the task page has no count", async () => {
      assert.equal((await follow(fixture.lessons[1], stepTwo)).status, 200);
      assert.deepEqual((await count()).done, []);
      assert.equal((await call(`/api/classes/${classId}/session`, teacher, "PUT", { active: true, follow: { moduleId: fixture.id, page: "task", stepId: stepTwo.id } })).status, 200);
      assert.deepEqual(await count(), { step: null });
    });
    await t.test("a student finishing a task sends class:step-done; a failed run sends nothing", async () => {
      await admin.from("module_progress").delete().eq("classroom_id", classId).eq("student_id", users[2].id);
      assert.equal((await follow(fixture.lessons[0], stepOne)).status, 200);
      const base = `/api/classrooms/${classId}/modules/${fixture.id}/progress`;
      let progress = await (await call(`${base}/activity`, ben, "POST", { stepId: stepOne.id })).json();
      const report = async (output) => (await call(`${base}/browser-result`, ben, "POST", { stepId: stepOne.id, updatedAt: progress.updatedAt, success: true, output })).json();
      events.length = 0;
      const failed = await report("wrong");
      assert.equal(failed.passed, false); progress = failed.progress;
      assert.deepEqual(events.filter((event) => event.endsWith("step-done")), [], "a failed run says nothing");
      const done = await report(stepOne.expectedOutput);
      assert.equal(done.passed, true);
      assert.deepEqual(events.filter((event) => event.endsWith("step-done")), [`class:${classId} class:step-done`]);
      const after = await count();
      assert.deepEqual([after.done, after.notDone], [["Ben Notyet"], ["Ana Done"]], "Ana's earlier pass was a sample check only");
    });
    await t.test("End session ends the count", async () => {
      assert.equal((await call(`/api/classes/${classId}/session`, teacher, "PUT", { active: false })).status, 200);
      assert.deepEqual(await count(), { step: null });
    });
  } finally {
    globalThis.fetch = realFetch;
    for (const id of classes) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});

