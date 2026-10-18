import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));
function localSupabase() {
  try {
    const output = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const env = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
    return env.API_URL ? env : null;
  } catch { return null; }
}
const local = localSupabase();
const needsLocal = { skip: !local && "local Supabase is not running" };

async function withClass(action) {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-availability-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [];
  const classrooms = [];
  const password = randomUUID();
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));
  try {
    for (const role of ["teacher", "student", "teacher"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@availability.example.test`, password, email_confirm: true, user_metadata: { name: `Availability ${role}` } });
      assert.equal(error, null);
      users.push(data.user);
      if (role === "teacher") assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    for (const suffix of ["A", "B"]) {
      const { data, error } = await admin.from("classrooms").insert({ name: `Availability ${suffix}`, join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id }).select("id").single();
      assert.equal(error, null); classrooms.push(data.id);
      assert.equal((await admin.from("classroom_members").insert([{ classroom_id: data.id, user_id: users[0].id }, { classroom_id: data.id, user_id: users[1].id }])).error, null);
    }
    const cookies = [];
    for (const user of users) {
      const response = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const [teacherCookie, studentCookie, outsiderCookie] = cookies;
    const request = (classroomId, suffix = "", { cookie = studentCookie, method = "GET", body } = {}) => call(`/api/classrooms/${classroomId}/modules/${fixture.id}${suffix}`, { method, headers: { cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const upload = (classroomId, content = fixture) => call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify(content) });
    await action({ admin, users, classrooms, request, call, upload, teacherCookie, studentCookie, outsiderCookie });
  } finally {
    for (const id of classrooms) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
}

test("module availability: unknown modules and step ids cannot create progress (CKB-018)", needsLocal, async () => {
  await withClass(async ({ admin, classrooms: [id], request, upload }) => {
    assert.equal((await request(id, "/progress")).status, 404);
    assert.equal((await request(id, "/progress/step", { method: "PUT", body: { stepId: "invented", status: "pass" } })).status, 404);
    await upload(id);
    assert.equal((await request(id, "/progress/step", { method: "PUT", body: { stepId: "invented", status: "pass" } })).status, 400);
    const { data: progress, error } = await admin.from("module_progress").select("id").eq("classroom_id", id);
    assert.equal(error, null); assert.deepEqual(progress, [], "invalid requests must not create progress rows");
  });
});

test("module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns", needsLocal, () => {
  const schema = `availability_test_${randomUUID().replaceAll("-", "")}`;
  const sql = readFileSync(new URL("../supabase/migrations/20261018000500_module_availability.sql", import.meta.url), "utf8").replaceAll("public.course_modules", `${schema}.course_modules`);
  const quote = (value) => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  const psql = (query) => execFileSync("docker", ["exec", "-i", "supabase_db_javashare", "psql", "-U", "postgres", "-d", "postgres", "-qAt", "-v", "ON_ERROR_STOP=1"], { input: `set client_min_messages=warning;\n${query}`, encoding: "utf8" }).trim();
  const noTask = structuredClone(fixture); delete noTask.performanceTask;
  const work = { step_states: { [fixture.lessons[0].blocks[0].id]: "pass" }, performance_task: { sample: { files: [{ path: "Main.java", content: "saved work" }], status: "pass" } } };
  try {
    psql(`create schema ${schema}; create table ${schema}.course_modules(id integer primary key, content jsonb not null, extra text); create table ${schema}.module_progress(work jsonb); insert into ${schema}.course_modules values (1,${quote(fixture)},'keep'),(2,${quote(noTask)},'keep'); insert into ${schema}.module_progress values (${quote(work)});`);
    psql(sql);
    let rows = JSON.parse(psql(`select json_agg(m order by id) from ${schema}.course_modules m;`));
    assert.deepEqual(rows[0].content, fixture);
    assert.deepEqual(rows[1].content, noTask);
    assert.equal(rows[0].extra, "keep");
    assert.deepEqual(rows[0].open_lesson_ids, fixture.lessons.map((lesson) => lesson.id));
    assert.equal(rows[0].performance_task_open, true);
    assert.equal(rows[1].performance_task_open, false);
    assert.deepEqual(JSON.parse(psql(`select work from ${schema}.module_progress;`)), work);
    psql(`insert into ${schema}.course_modules(id,content) values (3,${quote(fixture)}); update ${schema}.course_modules set open_lesson_ids='{}',performance_task_open=false where id=1;`);
    psql(sql);
    rows = JSON.parse(psql(`select json_agg(m order by id) from ${schema}.course_modules m;`));
    assert.deepEqual(rows[0].open_lesson_ids, [], "rerunning must not reopen a teacher's closed lesson");
    assert.equal(rows[0].performance_task_open, false);
    assert.deepEqual(rows[2].open_lesson_ids, [], "new modules must start closed");
    assert.equal(rows[2].performance_task_open, false);
    assert.deepEqual(rows[0].content, fixture);
    assert.deepEqual(JSON.parse(psql(`select work from ${schema}.module_progress;`)), work);
  } finally { psql(`drop schema if exists ${schema} cascade;`); }
});

test("module availability: new modules withhold closed content and reject direct progress writes; only the class teacher can open them", needsLocal, async () => {
  await withClass(async ({ classrooms: [id], request, upload, teacherCookie, studentCookie, outsiderCookie }) => {
    assert.equal((await upload(id)).status, 201);
    const preview = await (await request(id, "", { cookie: teacherCookie })).json();
    assert.deepEqual(preview.availability, { openLessonIds: [], performanceTaskOpen: false });
    assert.deepEqual(preview.lessons, fixture.lessons, "teacher preview must keep all content");
    const closed = await (await request(id)).json();
    assert.equal(closed.lessons.length, fixture.lessons.length);
    assert.ok(closed.lessons.every((lesson) => lesson.closed && lesson.blocks.length === 0 && lesson.exitSlip.questions.length === 0));
    assert.equal(closed.performanceTask, undefined);
    assert.equal(closed.starterFiles, undefined);
    assert.deepEqual(closed.closedPerformanceTask, { title: fixture.performanceTask.title });
    const closedJson = JSON.stringify(closed);
    assert.ok(!closedJson.includes(fixture.lessons[0].blocks[0].instruction));
    assert.ok(!closedJson.includes(fixture.lessons[0].blocks[0].files[0].content));
    assert.ok(!closedJson.includes(fixture.performanceTask.markdown));
    for (const stepId of [fixture.lessons[0].blocks[0].id, fixture.lessons[0].exitSlip.id]) {
      assert.equal((await request(id, "/progress/step", { method: "PUT", body: { stepId, status: "pass" } })).status, 403);
    }
    assert.equal((await request(id, "/progress/performance-task", { method: "PUT", body: { variant: "sample", files: fixture.performanceTask.exampleFiles, status: "pass" } })).status, 403);
    const change = { target: "lesson", lessonId: fixture.lessons[0].id, open: true };
    for (const cookie of [studentCookie, outsiderCookie]) assert.equal((await request(id, "/availability", { cookie, method: "PATCH", body: change })).status, 403);
    assert.equal((await request(id, "/availability", { cookie: teacherCookie, method: "PATCH", body: { ...change, lessonId: "invented" } })).status, 400);
    assert.equal((await request(id, "/availability", { cookie: teacherCookie, method: "PATCH", body: { ...change, open: "yes" } })).status, 400);
    assert.equal((await request(id, "/availability", { cookie: teacherCookie, method: "PATCH", body: change })).status, 200);
    const opened = await (await request(id)).json();
    assert.deepEqual(opened.lessons[0], fixture.lessons[0]);
    assert.equal(opened.lessons[1].closed, true);
  });
});

test("module availability: closing and reopening preserves work and the full-module meter; reupload preserves settings and new lessons start closed", needsLocal, async () => {
  await withClass(async ({ classrooms: [id], request, upload, teacherCookie }) => {
    await upload(id);
    const change = (body) => request(id, "/availability", { cookie: teacherCookie, method: "PATCH", body });
    assert.equal((await change({ target: "lesson", lessonId: fixture.lessons[0].id, open: true })).status, 200);
    const stepResponse = await request(id, "/progress/step", { method: "PUT", body: { stepId: fixture.lessons[0].blocks[0].id, status: "pass" } });
    assert.equal(stepResponse.status, 200);
    assert.equal((await stepResponse.json()).percent, 17, "one of six requirements, including closed content");
    await change({ target: "lesson", lessonId: fixture.lessons[0].id, open: false });
    const closedProgress = await (await request(id, "/progress")).json();
    assert.equal(closedProgress.percent, 17);
    assert.equal(closedProgress.stepStates[fixture.lessons[0].blocks[0].id], "pass");
    assert.equal((await request(id, "/progress/step", { method: "PUT", body: { stepId: fixture.lessons[0].blocks[0].id, status: "fail" } })).status, 403, "a previously loaded lesson cannot save after closing");
    await change({ target: "lesson", lessonId: fixture.lessons[0].id, open: true });
    await change({ target: "performance-task", open: true });
    const taskResponse = await request(id, "/progress/performance-task", { method: "PUT", body: { variant: "sample", files: fixture.performanceTask.exampleFiles, status: "pass" } });
    assert.equal(taskResponse.status, 200); assert.equal((await taskResponse.json()).percent, 33);
    await change({ target: "performance-task", open: false });
    assert.equal((await request(id, "/progress/performance-task", { method: "PUT", body: { variant: "own", files: fixture.performanceTask.starterFiles, status: "pass" } })).status, 403);
    const correction = structuredClone(fixture); correction.title = "Corrected module";
    const newLesson = structuredClone(fixture.lessons[1]); newLesson.id = "new-lesson"; newLesson.exitSlip.id = "new-slip"; newLesson.blocks[0].id = "new-step"; newLesson.exitSlip.afterStep = "new-step";
    correction.lessons.push(newLesson);
    assert.equal((await upload(id, correction)).status, 201);
    const reuploaded = await (await request(id, "", { cookie: teacherCookie })).json();
    assert.deepEqual(reuploaded.availability, { openLessonIds: [fixture.lessons[0].id], performanceTaskOpen: false });
    const studentView = await (await request(id)).json();
    assert.equal(studentView.lessons[2].closed, true);
    const afterCorrection = await (await request(id, "/progress")).json();
    assert.equal(afterCorrection.stepStates[fixture.lessons[0].blocks[0].id], "pass");
    assert.equal(afterCorrection.performanceTask.sample.status, "pass");
    // Two completed items out of eight after the teacher adds another lesson, not a loss of work.
    assert.equal(afterCorrection.percent, 25);
  });
});

test("module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes", needsLocal, async () => {
  await withClass(async ({ classrooms: [a, b], request, upload, teacherCookie }) => {
    await upload(a); await upload(b);
    const changes = fixture.lessons.map((lesson) => request(a, "/availability", { cookie: teacherCookie, method: "PATCH", body: { target: "lesson", lessonId: lesson.id, open: true } }));
    const responses = await Promise.all(changes);
    assert.ok(responses.every((response) => response.status === 200));
    const inA = await (await request(a, "", { cookie: teacherCookie })).json();
    assert.deepEqual([...inA.availability.openLessonIds].sort(), fixture.lessons.map((lesson) => lesson.id).sort());
    assert.deepEqual((await (await request(b, "", { cookie: teacherCookie })).json()).availability.openLessonIds, []);
    assert.ok((await (await request(b)).json()).lessons.every((lesson) => lesson.closed));
  });
});

test("module availability: modules without a performance task reject its switch and submission", needsLocal, async () => {
  await withClass(async ({ classrooms: [id], request, upload, teacherCookie }) => {
    const content = structuredClone(fixture); delete content.performanceTask;
    await upload(id, content);
    assert.equal((await request(id, "/availability", { cookie: teacherCookie, method: "PATCH", body: { target: "performance-task", open: true } })).status, 400);
    assert.equal((await request(id, "/progress/performance-task", { method: "PUT", body: { variant: "sample", files: [{ path: "Main.java", content: "test" }], status: "pass" } })).status, 404);
    const view = await (await request(id)).json();
    assert.equal(view.performanceTask, undefined); assert.equal(view.closedPerformanceTask, undefined);
  });
});
