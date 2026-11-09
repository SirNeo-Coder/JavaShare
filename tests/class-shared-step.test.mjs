import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
const { moduleProjectForClass } = tsxRequire("../app/moduleActivityState.ts", import.meta.url);
const { default: StudentModuleActivity } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);

// Share with class (teacher, 2026-11-10): every member gets the teacher's step fresh, whatever their progress.
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const [first, second] = [1, 2].map((week) => {
  const content = structuredClone(fixture);
  content.id = `shared-step-week-${week}-${randomUUID().slice(0, 6)}`; content.week = 40 + week;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `shared-${week}-task-${index}`; });
  return content;
});
second.previousModuleId = first.id;
const sharedStep = second.lessons[1].blocks[0];
const activity = (shared) => ({ kind: "preview", shared, classroomId: "class", moduleId: second.id, moduleTitle: "Week 42 · Step 1", stepId: sharedStep.id, stateId: "", studentId: "student",
  instruction: sharedStep.instruction, expectedOutput: sharedStep.expectedOutput, stdin: "",
  progress: { moduleId: second.id, projectFiles: sharedStep.files, performanceProjectFiles: [], stepStates: {}, performanceTask: {}, updatedAt: "", percent: 0 } });

test("class step: a student's shared step opens for any role, is labelled, and never offers Save work", () => {
  assert.equal(moduleProjectForClass(activity(true), "class", "student").shared, true);
  assert.equal(moduleProjectForClass({ ...activity(false), kind: "review" }, "class", "student"), null, "reviews stay teacher-only");
  const html = renderToStaticMarkup(createElement(StudentModuleActivity, { activity: activity(true), ref: { current: null }, onChecked() {}, onClose() {} }));
  assert.match(html, /Class step · Week 42 · Step 1/);
  assert.match(html, /Your teacher shared this step with the class/);
  assert.doesNotMatch(html, /Save work|Submit this version|Share with class/);
  const teacher = (shared) => renderToStaticMarkup(createElement(StudentModuleActivity, { activity: activity(false), ref: { current: null }, onChecked() {}, onClose() {}, share: { shared, async toggle() {} } }));
  assert.match(teacher(false), />Share with class</);
  assert.match(teacher(true), />Stop sharing</);
});

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("class step: real routes share one step with every member past prerequisites, sample only, nothing saved", { skip: !local?.API_URL && "local Supabase is not running" }, async (t) => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://runner.example.test", JWT_SECRET: "shared-step-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const users = [], cookies = [], classes = [];
  const password = randomUUID();
  try {
    // teacher, member student, other teacher, student outside the class
    for (const role of ["teacher", "student", "teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@shared-step.example.test`, password, email_confirm: true, user_metadata: { name: `Shared ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const [teacher, student, otherTeacher, outsider] = cookies;
    const created = await call("/api/classes", teacher, "POST", { subject: "Java", name: "Shared step class" });
    assert.equal(created.status, 201); const classId = (await created.json()).id; classes.push(classId);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id })).error, null);
    for (const content of [first, second]) assert.equal((await call(`/api/classrooms/${classId}/modules`, teacher, "POST", content)).status, 201);
    const shared = `/api/classes/${classId}/shared-step`;
    const media = `/api/classrooms/${classId}/modules/${second.id}/media`;
    const share = (cookie, body) => call(shared, cookie, "PUT", { share: body });

    await t.test("nothing is shared at first; the student cannot open the later week", async () => {
      assert.deepEqual(await (await call(shared, student)).json(), { active: false });
      assert.equal((await call(`/api/classrooms/${classId}/modules/${second.id}`, student)).status, 403);
      assert.equal((await call(media, student)).status, 403);
    });
    await t.test("only the class teacher can share, and only a real step", async () => {
      assert.equal((await share(student, { moduleId: second.id, stepId: sharedStep.id })).status, 403);
      assert.equal((await share(otherTeacher, { moduleId: second.id, stepId: sharedStep.id })).status, 403);
      assert.equal((await share(teacher, { moduleId: second.id, stepId: "missing-step" })).status, 404);
      assert.equal((await share(teacher, { moduleId: "missing-module", stepId: sharedStep.id })).status, 404);
      assert.deepEqual(await (await call(shared, student)).json(), { active: false });
    });
    await t.test("a shared step reaches the student despite prerequisites: sample and starter files, never the task", async () => {
      const response = await share(teacher, { moduleId: second.id, stepId: sharedStep.id });
      assert.equal(response.status, 200, await response.clone().text());
      const payload = await (await call(shared, student)).json();
      assert.equal(payload.active, true);
      assert.equal(payload.moduleId, second.id); assert.equal(payload.week, 42);
      assert.equal(payload.step.id, sharedStep.id);
      assert.deepEqual(payload.step.files, sharedStep.files);
      assert.deepEqual(payload.starterFiles, second.starterFiles);
      assert.equal(payload.step.activity, undefined, "the task stays out of the shared step");
      assert.equal((await call(`/api/classrooms/${classId}/modules/${second.id}`, student)).status, 403, "the rest of the module stays locked");
      assert.notEqual((await call(media, student)).status, 403, "the shared module's media is readable");
      assert.equal((await call(shared, outsider)).status, 403);
    });
    await t.test("stopping ends the share and its media access; no student progress was written", async () => {
      assert.equal((await share(teacher, null)).status, 200);
      assert.deepEqual(await (await call(shared, student)).json(), { active: false });
      assert.equal((await call(media, student)).status, 403);
      const { data } = await admin.from("module_progress").select("module_id").eq("classroom_id", classId).eq("student_id", users[1].id);
      assert.deepEqual(data, []);
    });
  } finally {
    for (const id of classes) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
