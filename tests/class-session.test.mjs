import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
const { ModuleContent } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);

// Class session (teacher, 2026-11-10): Enter classroom starts it; students follow the teacher's worksheet page and
// may read that module through it, past their own locks; End session or 30 idle minutes end it.
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const [first, second] = [1, 2].map((week) => {
  const content = structuredClone(fixture);
  content.id = `class-session-week-${week}-${randomUUID().slice(0, 6)}`; content.week = 50 + week;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `session-${week}-task-${index}`; });
  return content;
});
second.previousModuleId = first.id;
const [stepOne, stepTwo] = second.lessons.map((lesson) => lesson.blocks[0]);
// A lesson with discussion text between two steps: on step one's page, owned by the (locked) step after it.
const third = structuredClone(second);
third.id = `class-session-week-3-${randomUUID().slice(0, 6)}`; third.week = 53; third.previousModuleId = first.id;
const extra = structuredClone(third.lessons[0].blocks[0]);
extra.id = `${extra.id}-extra`; extra.number = 2; extra.activity.id = `${extra.activity.id}-extra`;
third.lessons[0].blocks.push({ type: "text", markdown: "Talk about step one together." }, extra);

test("class session: a followed worksheet shows the teacher's page and offers no page buttons", () => {
  const render = (followPage) => renderToStaticMarkup(createElement(ModuleContent, { module: second, classroomId: "class", role: "teacher", worksheet: true, followPage }));
  const shown = (html) => [...html.matchAll(/<article[^>]*class="worksheet-paper"([^>]*)aria-label="([^"]*)"/g)].filter((match) => !/hidden/.test(match[1])).map((match) => match[2]);
  const free = render(undefined);
  assert.equal(shown(free).length, 1);
  assert.doesNotMatch(free, /<button[^>]*disabled=""[^>]*>Next page/, "without a session the pages turn freely");
  const pages = [...free.matchAll(/aria-label="Part pages">(.*?)<\/nav>/g)];
  assert.ok(pages.length, "the worksheet has part pages");
  const followed = render(`${second.lessons[1].id}:${stepTwo.id}`);
  assert.match(shown(followed)[0], /Step 1$/);
  assert.notEqual(shown(followed)[0], shown(free)[0], "the student sees the teacher's page, not their own first page");
  assert.match(followed, /<button[^>]*disabled=""[^>]*>Next page/);
  assert.match(followed, /<button[^>]*disabled=""[^>]*>← Previous page/);
  assert.doesNotMatch(followed.match(/aria-label="Module parts"(.*?)<\/nav>/)[1], /<button(?![^>]*disabled="")/, "part buttons are disabled");
});

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("class session: real routes start, follow, renew, expire and end a session; reading opens, writing keeps its locks", { skip: !local?.API_URL && "local Supabase is not running" }, async (t) => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://runner.example.test", JWT_SECRET: "class-session-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const users = [], cookies = [], classes = [];
  const password = randomUUID();
  try {
    // teacher, member student, other teacher, student outside the class
    for (const role of ["teacher", "student", "teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@class-session.example.test`, password, email_confirm: true, user_metadata: { name: `Session ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const [teacher, student, otherTeacher, outsider] = cookies;
    const created = await call("/api/classes", teacher, "POST", { subject: "Java", name: "Class session class" });
    assert.equal(created.status, 201); const classId = (await created.json()).id; classes.push(classId);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id })).error, null);
    for (const content of [first, second, third]) { const uploaded = await call(`/api/classrooms/${classId}/modules`, teacher, "POST", content); assert.equal(uploaded.status, 201, await uploaded.clone().text()); }
    const session = `/api/classes/${classId}/session`;
    const moduleUrl = `/api/classrooms/${classId}/modules/${second.id}`;
    const put = (cookie, body) => call(session, cookie, "PUT", body);
    const read = async (cookie = student) => (await call(session, cookie)).json();
    const row = async () => (await admin.from("classrooms").select("session_started_at,session_seen_at,session_module_id,session_page,session_step_id,shared_module_id").eq("id", classId).single()).data;
    const summary = async () => (await (await call("/api/bootstrap", student)).json()).classrooms.find((item) => item.id === classId);
    const follow = (lesson, step) => ({ moduleId: second.id, page: `${lesson.id}:${step.id}`, stepId: step.id });
    const steps = (module) => module.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");

    await t.test("no session at first; the student cannot open the later week", async () => {
      assert.deepEqual(await read(), { active: false });
      assert.equal((await summary()).hasSession, false);
      assert.equal((await call(moduleUrl, student)).status, 403);
    });
    await t.test("only the class teacher starts it; a page report alone never starts one (CKB-103)", async () => {
      assert.equal((await put(student, { active: true })).status, 403);
      assert.equal((await put(otherTeacher, { active: true })).status, 403);
      const late = await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) });
      assert.equal(late.status, 200); assert.equal((await late.json()).active, false);
      assert.deepEqual(await read(), { active: false });
    });
    await t.test("Enter classroom starts it: the class list pulls students in, nothing is followed yet", async () => {
      assert.equal((await put(teacher, { active: true })).status, 200);
      const state = await read();
      assert.equal(state.active, true); assert.equal(state.follow, null);
      assert.ok(state.endsAt > Date.now() + 29 * 60000);
      const item = await summary();
      assert.equal(item.hasSession, true); assert.match(item.liveSessionId, /^session:/);
      assert.equal((await call(session, outsider)).status, 403);
      assert.equal((await call(moduleUrl, student)).status, 403, "an unfollowed module keeps its lock");
      assert.equal((await put(teacher, { active: true, follow: { moduleId: second.id, page: "x", stepId: "missing-step" } })).status, 404);
      assert.equal((await put(teacher, { active: true, follow: { moduleId: "missing-module", page: "x", stepId: null } })).status, 404);
      const started = (await row()).session_started_at;
      assert.equal((await put(teacher, { active: true })).status, 200);
      assert.equal((await row()).session_started_at, started, "entering again keeps the same session, so students are not pulled twice");
    });
    await t.test("the followed page opens the module through that step only, past prerequisites", async () => {
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) })).status, 200);
      assert.deepEqual((await read()).follow, follow(second.lessons[0], stepOne));
      const response = await call(moduleUrl, student);
      assert.equal(response.status, 200, await response.clone().text());
      const [one, two] = steps(await response.json());
      assert.equal(one.locked, undefined); assert.equal(one.instruction, stepOne.instruction);
      assert.equal(two.locked, true, "the teacher's later page stays withheld");
      assert.equal((await call(`${moduleUrl}/progress`, student)).status, 200);
      assert.equal((await call(`/api/classrooms/${classId}/modules/${first.id}`, student)).status, 200, "the student's own earlier week is unaffected");
      const { data } = await admin.from("module_progress").select("module_id").eq("classroom_id", classId).eq("student_id", users[1].id).eq("module_id", second.id);
      assert.deepEqual(data, [], "following only reads: no progress is started for the followed week");
    });
    await t.test("moving on opens the next step; leaving out follow keeps the page", async () => {
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[1], stepTwo) })).status, 200);
      assert.equal((await put(teacher, { active: true })).status, 200);
      assert.deepEqual((await read()).follow, follow(second.lessons[1], stepTwo));
      const [one, two] = steps(await (await call(moduleUrl, student)).json());
      assert.equal(one.locked, undefined); assert.equal(two.locked, undefined);
    });
    await t.test("the task page shows the task text for reading; submitting it stays refused (CKB-106)", async () => {
      const lastStep = steps(second).at(-1);
      assert.equal((await put(teacher, { active: true, follow: { moduleId: second.id, page: "task", stepId: lastStep.id } })).status, 200);
      const view = await (await call(moduleUrl, student)).json();
      assert.equal(view.performanceTask?.title, second.performanceTask.title);
      assert.equal(view.closedPerformanceTask, undefined);
      assert.equal(view.availability.performanceTaskOpen, false, "the student's own task access is unchanged");
      const submit = await call(`${moduleUrl}/progress/performance-task`, student, "PUT", { variant: "own", files: [{ path: "Main.java", content: "class Main {}" }], status: "pass" });
      assert.equal(submit.status, 403);
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[1], stepTwo) })).status, 200);
    });
    await t.test("a followed step's page keeps its discussion text; the next step stays locked (CKB-106)", async () => {
      const [lesson] = third.lessons;
      assert.equal((await put(teacher, { active: true, follow: { ...follow(lesson, lesson.blocks[0]), moduleId: third.id } })).status, 200);
      const view = await (await call(`/api/classrooms/${classId}/modules/${third.id}`, student)).json();
      assert.equal(view.lessons[0].blocks[1].markdown, "Talk about step one together.");
      assert.equal(view.lessons[0].blocks[2].locked, true);
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[1], stepTwo) })).status, 200);
    });
    await t.test("following never opens writing: recording progress keeps its prerequisite lock", async () => {
      const response = await call(`${moduleUrl}/progress/step`, student, "PUT", { stepId: second.lessons[0].exitSlip.id, status: "pass" });
      assert.equal(response.status, 403);
      assert.ok((await response.json()).moduleAccess, "the normal prerequisite message");
    });
    await t.test("closing the worksheet stops following and restores the lock", async () => {
      assert.equal((await put(teacher, { active: true, follow: null })).status, 200);
      assert.equal((await read()).follow, null);
      assert.equal((await call(moduleUrl, student)).status, 403);
    });
    await t.test("the teacher's interaction renews it; a student's does not", async () => {
      const old = new Date(Date.now() - 29 * 60000).toISOString();
      assert.equal((await admin.from("classrooms").update({ session_seen_at: old }).eq("id", classId)).error, null);
      assert.equal((await call("/api/auth/activity", student, "POST", { elapsedMs: 0 })).status, 200);
      assert.equal(Date.parse((await row()).session_seen_at), Date.parse(old));
      assert.equal((await call("/api/auth/activity", teacher, "POST", { elapsedMs: 0 })).status, 200);
      assert.ok(Date.parse((await row()).session_seen_at) > Date.now() - 60000);
    });
    await t.test("30 minutes without the teacher ends it on the next read, with the shared step", async () => {
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) })).status, 200);
      assert.equal((await call(`/api/classes/${classId}/shared-step`, teacher, "PUT", { share: { moduleId: second.id, stepId: stepOne.id } })).status, 200);
      assert.equal((await admin.from("classrooms").update({ session_seen_at: new Date(Date.now() - 31 * 60000).toISOString() }).eq("id", classId)).error, null);
      assert.equal((await summary()).hasSession, false, "the class list no longer pulls students in");
      assert.deepEqual(await read(), { active: false });
      assert.deepEqual(await row(), { session_started_at: null, session_seen_at: null, session_module_id: null, session_page: null, session_step_id: null, shared_module_id: null });
      assert.equal((await call(moduleUrl, student)).status, 403);
      assert.equal((await call("/api/auth/activity", teacher, "POST", { elapsedMs: 0 })).status, 200);
      assert.deepEqual(await read(), { active: false }, "an ended session is not renewed");
    });
    await t.test("End session ends it and the shared step at once", async () => {
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) })).status, 200);
      assert.equal((await call(`/api/classes/${classId}/shared-step`, teacher, "PUT", { share: { moduleId: second.id, stepId: stepOne.id } })).status, 200);
      assert.equal((await put(student, { active: false })).status, 403);
      assert.equal((await put(teacher, { active: false })).status, 200);
      assert.deepEqual(await read(), { active: false });
      assert.deepEqual(await (await call(`/api/classes/${classId}/shared-step`, student)).json(), { active: false });
      assert.equal((await call(moduleUrl, student)).status, 403);
    });
    await t.test("requests at the same moment: End session stays ended; re-entering never restores a closed page (CKB-104)", async () => {
      // Timing: each round sends two requests together; the server may run them in either order.
      let revived = 0, reopened = 0;
      for (let round = 0; round < 30; round++) {
        assert.equal((await put(teacher, { active: true })).status, 200);
        assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) })).status, 200);
        await Promise.all([put(teacher, { active: true, follow: null }), put(teacher, { active: false })]);
        if ((await row()).session_seen_at) revived++;
        assert.equal((await put(teacher, { active: true })).status, 200);
        assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) })).status, 200);
        await Promise.all([put(teacher, { active: true, follow: null }), put(teacher, { active: true })]);
        if ((await row()).session_module_id) reopened++;
      }
      assert.equal(revived, 0, `End session came back to life in ${revived} of 30 rounds`);
      assert.equal(reopened, 0, `re-entering restored the closed page in ${reopened} of 30 rounds`);
      assert.equal((await put(teacher, { active: false })).status, 200);
    });
    await t.test("a followed module deleted during the session does not block Enter classroom (CKB-103)", async () => {
      assert.equal((await put(teacher, { active: true })).status, 200);
      assert.equal((await put(teacher, { active: true, follow: follow(second.lessons[0], stepOne) })).status, 200);
      assert.equal((await call(moduleUrl, teacher, "DELETE")).status, 200);
      const entered = await put(teacher, { active: true });
      assert.equal(entered.status, 200, await entered.clone().text());
      assert.equal((await read()).active, true);
    });
  } finally {
    for (const id of classes) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
