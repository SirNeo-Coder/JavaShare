import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
import { moduleAccessBlock } from "../backend/src/module-prerequisites.ts";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const contents = [12, 13, 14].map((week) => {
  const content = structuredClone(fixture);
  content.id = `prerequisite-week-${week}`; content.week = week;
  if (week > 12) content.previousModuleId = `prerequisite-week-${week - 1}`;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `week-${week}-task-${index}`; });
  return content;
});
const steps = (content) => content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const passed = (content) => Object.fromEntries(steps(content).map((step) => [activityStateId(step), "pass"]));
const modules = new Map(contents.map((content) => [content.id, content]));
const quiet = { current_activity_id: null, active_module_id: null };
const access = (content, states = new Map(), classroom = quiet, available = modules) => moduleAccessBlock(content, available, states, classroom);

test("module prerequisites: oldest unfinished ancestor blocks later weeks even when the immediate predecessor passed", () => {
  const [first, second, third] = contents;
  assert.equal(access(first), undefined);
  assert.deepEqual(access(third), { kind: "prerequisite", message: "Complete Week 12 before starting Week 14.", moduleId: first.id, week: 12 });
  assert.equal(access(third, new Map([[second.id, passed(second)]])).moduleId, first.id);
  const state = new Map([[first.id, passed(first)]]);
  assert.equal(access(second, state), undefined);
  assert.equal(access(third, state).moduleId, second.id);
  state.set(second.id, passed(second));
  assert.equal(access(third, state), undefined, "no performance submission or paper liplet is required");
});

test("module prerequisites: sample verification, failed tasks and superseded ids cannot unlock a later module", () => {
  const [first, second] = contents;
  const state = Object.fromEntries(steps(first).flatMap((step) => [[step.id, "pass"], [sampleStateId(step), "pass"], [`task:${step.activity.id}-old`, "pass"]]));
  assert.equal(access(second, new Map([[first.id, state]])).kind, "prerequisite");
  assert.equal(access(second, new Map([[first.id, { ...passed(first), [activityStateId(steps(first)[0])]: "fail" }]])).kind, "prerequisite");
  const legacy = { ...first, lessons: fixture.lessons };
  assert.equal(access(second, new Map([[first.id, passed(legacy)]]), quiet, new Map([[first.id, legacy], [second.id, second]])), undefined);
});

test("module prerequisites: missing and cyclic links give teacher repair messages without looping", () => {
  assert.equal(access(contents[2], new Map(), quiet, new Map([[contents[2].id, contents[2]]])).kind, "missing");
  const cyclic = new Map(modules); cyclic.set(contents[0].id, { ...contents[0], previousModuleId: contents[2].id });
  assert.equal(access(contents[2], new Map(), quiet, cyclic).kind, "invalid");
});

test("module prerequisites: live class permits the weekly chain but still blocks unrelated modules", () => {
  const live = { current_activity_id: "live", active_module_id: contents[2].id };
  assert.equal(access(contents[0], new Map(), live), undefined);
  assert.equal(access(contents[1], new Map(), live).moduleId, contents[0].id);
  assert.equal(access(contents[2], new Map(), live).moduleId, contents[0].id);
  assert.equal(access({ ...contents[0], id: "unrelated" }, new Map(), live).kind, "live");
  assert.equal(access(contents[0], new Map(), { ...live, active_module_id: null }).kind, "live");
});

const { default: Notice } = tsxRequire("../app/ModuleAccessNotice.tsx", import.meta.url);
const { default: Card } = tsxRequire("../app/ModuleCatalogCard.tsx", import.meta.url);
test("module prerequisites: banner names the earliest week and offers Continue; missing modules offer no dead button", () => {
  const block = access(contents[2]);
  const html = renderToStaticMarkup(createElement(Notice, { block, onContinue() {} }));
  assert.match(html, /role="alert"/); assert.match(html, /Complete Week 12 before starting Week 14/); assert.match(html, /Continue Week 12/);
  const missing = access(contents[2], new Map(), quiet, new Map());
  const absent = renderToStaticMarkup(createElement(Notice, { block: missing, onContinue() {} }));
  assert.match(absent, /teacher needs to upload/); assert.doesNotMatch(absent, /<button/);
  const card = renderToStaticMarkup(createElement(Card, { module: { ...contents[2], moduleAccess: block }, percent: 0, role: "student", onOpen() {} }));
  assert.match(card, /Complete Week 12/); assert.doesNotMatch(card, /disabled=/, "blocked cards open their explanation");
});

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("module prerequisites: real routes reject every later-module entry, isolate students/classes and preserve saved work", { skip: !local?.API_URL && "local Supabase is not running" }, async (t) => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://runner.example.test", JWT_SECRET: "prerequisite-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const users = [], classes = [], cookies = [];
  const password = randomUUID();
  try {
    for (const role of ["teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@prerequisite.example.test`, password, email_confirm: true, user_metadata: { name: `Prerequisite ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    for (let index = 0; index < 2; index++) {
      const response = await call("/api/classes", cookies[0], "POST", { name: `Prerequisite class ${index}` });
      assert.equal(response.status, 201); classes.push((await response.json()).id);
      assert.equal((await admin.from("classroom_members").insert(users.slice(1).map((user) => ({ classroom_id: classes[index], user_id: user.id })))).error, null);
      for (const content of contents) assert.equal((await call(`/api/classrooms/${classes[index]}/modules`, cookies[0], "POST", content)).status, 201);
    }
    const base = (id = contents[2].id, classId = classes[0]) => `/api/classrooms/${classId}/modules/${id}`;
    const files = [{ path: "Main.java", content: "saved later work" }];
    const snapshot = { files, status: "pass", submittedAt: new Date().toISOString() };
    const saved = { student_id: users[1].id, classroom_id: classes[0], module_id: contents[2].id, project_files: files, performance_task: { project: { files }, own: snapshot }, activity_projects: { drafts: { old: files } }, step_states: passed(contents[2]) };
    assert.equal((await admin.from("module_progress").insert(saved)).error, null);
    const readSaved = async () => (await admin.from("module_progress").select("*").eq("student_id", users[1].id).eq("classroom_id", classes[0]).eq("module_id", contents[2].id).single()).data;
    const before = await readSaved();
    const stepId = steps(contents[2])[0].id;
    const updatedAt = before.updated_at;
    const entries = [
      ["content", "", "GET"], ["progress", "/progress", "GET"],
      ["module project", "/progress/project", "PUT", { files, updatedAt, stepId }],
      ["paper record", "/progress/step", "PUT", { stepId: contents[2].lessons[0].exitSlip.id, status: "pass" }],
      ["activity", "/progress/activity", "POST", { stepId }],
      ["laptop run", "/progress/run", "POST", { stepId, files, updatedAt }],
      ["browser result", "/progress/browser-result", "POST", { stepId, updatedAt, success: true, output: "Capacity: 25" }],
      ["personal open", "/progress/performance-project", "POST", {}],
      ["personal save", "/progress/performance-project", "PUT", { files, updatedAt }],
      ["submission", "/progress/performance-task", "PUT", { files, variant: "own", status: "pass", updatedAt }],
    ];
    for (const [name, suffix, method, body] of entries) await t.test(`blocks ${name} before prerequisites`, async () => {
      const response = await call(base() + suffix, cookies[1], method, body);
      assert.equal(response.status, 403, await response.clone().text());
      assert.equal((await response.json()).moduleAccess?.moduleId, contents[0].id);
    });
    assert.deepEqual(await readSaved(), before, "denied reads/writes never alter later files, completions, history or submissions");
    await t.test("live class catch-up, ordered unlock, teacher preview and student/class isolation", async () => {
      assert.equal((await call(base(), cookies[0])).status, 200);
      const activity = await admin.from("activities").insert({ classroom_id: classes[0], created_by: users[0].id, title: "Live prerequisite class", mode: "individual" }).select("id").single();
      assert.equal(activity.error, null);
      await admin.from("classrooms").update({ current_activity_id: activity.data.id, active_module_id: contents[2].id }).eq("id", classes[0]);
      assert.equal((await call(base(contents[0].id), cookies[1])).status, 200);
      const list = await (await call(`/api/classrooms/${classes[0]}/modules`, cookies[1])).json();
      assert.equal(list.find((item) => item.moduleId === contents[0].id).locked, false);
      assert.equal(list.find((item) => item.moduleId === contents[2].id).moduleAccess.moduleId, contents[0].id);
      for (const content of contents.slice(0, 2)) {
        assert.equal((await admin.from("module_progress").upsert({ classroom_id: classes[0], student_id: users[1].id, module_id: content.id, step_states: passed(content) }, { onConflict: "student_id,classroom_id,module_id" })).error, null);
        const response = await call(base(), cookies[1]);
        assert.equal(response.status, content.week === 12 ? 403 : 200);
        if (content.week === 12) assert.equal((await response.json()).moduleAccess.moduleId, contents[1].id);
      }
      assert.equal((await call(base(contents[1].id), cookies[1])).status, 200);
      assert.equal((await call(base(), cookies[2])).status, 403);
      assert.equal((await call(base(contents[2].id, classes[1]), cookies[1])).status, 403);
      const opened = await call(base() + "/progress/performance-project", cookies[1], "POST", {});
      assert.equal(opened.status, 200); const view = await opened.json();
      assert.equal(view.performanceProjectFiles.find((file) => file.path === "Main.java").content, files[0].content); assert.deepEqual(view.performanceTask.own, snapshot);
      assert.deepEqual(view.projectFiles, files);
      await admin.from("course_modules").delete().eq("classroom_id", classes[0]).eq("module_id", contents[0].id);
      const missing = await call(base(), cookies[1]); assert.equal(missing.status, 403);
      assert.equal((await missing.json()).moduleAccess.kind, "missing", "old passes cannot substitute for a missing uploaded prerequisite");
      assert.equal((await call(base(), cookies[0])).status, 200);
    });
  } finally {
    for (const id of classes) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
