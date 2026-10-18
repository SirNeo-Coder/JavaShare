// Run with: npm test (route checks need local Supabase, skipped otherwise)
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

test("landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "landing-pages-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const createUser = async (name) => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@landing-pages-test.example.test`, password, email_confirm: true, user_metadata: { name } });
    assert.equal(error, null);
    return data.user;
  };
  const teacher = await createUser("Landing Teacher");
  const studentA = await createUser("Landing Student A");
  const studentB = await createUser("Landing Student B");
  const outsider = await createUser("Landing Outsider");
  await admin.from("profiles").update({ role: "teacher" }).in("id", [teacher.id, outsider.id]);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Landing test class", subject: "AP Computer Science", join_code: `LP${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher.id }).select("id").single();
  const classroomId = classroom.id;
  await admin.from("classroom_members").insert([
    { classroom_id: classroomId, user_id: teacher.id },
    { classroom_id: classroomId, user_id: studentA.id },
    { classroom_id: classroomId, user_id: studentB.id },
  ]);
  const moduleId = fixture.id;
  const step = fixture.lessons[0].blocks[0];
  await admin.from("course_modules").upsert({ classroom_id: classroomId, module_id: moduleId, content: fixture, created_by: teacher.id, open_lesson_ids: fixture.lessons.map((lesson) => lesson.id), performance_task_open: true });

  try {
    const login = async (user) => (await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) })).headers.get("set-cookie").split(";")[0];
    const teacherCookie = await login(teacher);
    const studentACookie = await login(studentA);
    const outsiderCookie = await login(outsider);

    // Bootstrap exposes "is this classroom in session" for the landing page's auto-skip and
    // "Live now" badge - a plain boolean off current_activity_id/live_share_project_id.
    const bootstrap = await (await call("/api/bootstrap", { headers: { cookie: studentACookie } })).json();
    assert.equal(bootstrap.classrooms[0].hasActivity, false);
    assert.equal(bootstrap.classrooms[0].hasLiveShare, false);
    assert.equal(bootstrap.classrooms[0].liveSessionId, null);

    // Student roster for one classroom: teacher-only, excludes the teacher themselves.
    assert.equal((await call(`/api/classes/${classroomId}/students`, { headers: { cookie: studentACookie } })).status, 403, "a student cannot list the roster");
    assert.equal((await call(`/api/classes/${classroomId}/students`, { headers: { cookie: outsiderCookie } })).status, 403, "a teacher of a different class cannot list this roster");
    const roster = await (await call(`/api/classes/${classroomId}/students`, { headers: { cookie: teacherCookie } })).json();
    const rosterIds = roster.students.map((student) => student.id);
    assert.ok(rosterIds.includes(studentA.id) && rosterIds.includes(studentB.id));
    assert.ok(!rosterIds.includes(teacher.id), "the teacher is a classroom member too, but must not appear in their own roster");

    // A student's own module summary: before touching anything, it's "not-started" and flagged
    // as the latest (only) module, at 0%.
    const ownBefore = await (await call(`/api/classrooms/${classroomId}/modules/summary`, { headers: { cookie: studentACookie } })).json();
    assert.equal(ownBefore.length, 1);
    assert.equal(ownBefore[0].moduleId, moduleId);
    assert.equal(ownBefore[0].percent, 0);
    assert.equal(ownBefore[0].status, "not-started");
    assert.equal(ownBefore[0].isLatest, true);

    // Route-ordering regression: "/modules/summary" is a static route registered before the
    // dynamic "/modules/:moduleId" one (routes.ts) specifically so this request can't be matched
    // as a request for a module literally named "summary" - if it were, this would 404 with
    // "Module not found" instead of returning the summary list above.
    const summaryAgain = await call(`/api/classrooms/${classroomId}/modules/summary`, { headers: { cookie: studentACookie } });
    assert.equal(summaryAgain.status, 200);

    // A teacher has no module progress of their own.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/summary`, { headers: { cookie: teacherCookie } })).status, 403);

    // The teacher's view of a specific student's progress, before and after that student passes
    // one step - this is the same percent calculation the student's own landing card shows, just
    // computed for someone else by a teacher-only route.
    const beforeStep = await (await call(`/api/classes/${classroomId}/students/${studentA.id}/modules-summary`, { headers: { cookie: teacherCookie } })).json();
    assert.equal(beforeStep[0].percent, 0);

    await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie: studentACookie }, body: JSON.stringify({ stepId: step.id, status: "pass" }) });

    const afterStep = await (await call(`/api/classes/${classroomId}/students/${studentA.id}/modules-summary`, { headers: { cookie: teacherCookie } })).json();
    assert.ok(afterStep[0].percent > 0, "the teacher's view must reflect the student's step just passed");
    assert.equal(afterStep[0].status, "in-progress");

    // Student B never touched anything - the teacher's per-student scoping must not leak
    // student A's progress onto student B (the same bug class as CKB-010, one classroom away).
    const studentBSummary = await (await call(`/api/classes/${classroomId}/students/${studentB.id}/modules-summary`, { headers: { cookie: teacherCookie } })).json();
    assert.equal(studentBSummary[0].percent, 0, "student B's own progress must stay at 0% even though student A just passed a step");

    // A student cannot use the teacher-view route, even to look at their own progress.
    assert.equal((await call(`/api/classes/${classroomId}/students/${studentA.id}/modules-summary`, { headers: { cookie: studentACookie } })).status, 403);

    // A teacher cannot ask about a student who isn't in this classroom.
    assert.equal((await call(`/api/classes/${classroomId}/students/${outsider.id}/modules-summary`, { headers: { cookie: teacherCookie } })).status, 404);
  } finally {
    await admin.from("course_modules").delete().eq("classroom_id", classroomId);
    await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of [teacher, studentA, studentB, outsider]) await admin.auth.admin.deleteUser(user.id);
  }
});

test("class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "landing-pages-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const createUser = async (name) => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@landing-pages-test.example.test`, password, email_confirm: true, user_metadata: { name } });
    assert.equal(error, null);
    return data.user;
  };
  const teacher = await createUser("Class List Teacher");
  const student = await createUser("Class List Student");
  await admin.from("profiles").update({ role: "teacher" }).eq("id", teacher.id);
  const login = async (user) => (await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) })).headers.get("set-cookie").split(";")[0];
  const teacherCookie = await login(teacher);
  const studentCookie = await login(student);

  let classroomAId, classroomBId, activityId;
  try {
    // A student may not create a class.
    assert.equal((await call("/api/classes", { method: "POST", headers: { cookie: studentCookie }, body: JSON.stringify({ name: "Nope" }) })).status, 403);

    const createA = await call("/api/classes", { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify({ name: "Second Period", subject: "AP CS A" }) });
    assert.equal(createA.status, 201);
    const classroomA = await createA.json();
    classroomAId = classroomA.id;
    assert.equal(classroomA.name, "Second Period");
    assert.match(classroomA.joinCode, /^[0-9A-F]{6}$/, "a generated join code must satisfy the DB's upper(join_code) check");

    const createB = await call("/api/classes", { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify({ name: "Third Period" }) });
    const classroomB = await createB.json();
    classroomBId = classroomB.id;
    assert.notEqual(classroomA.joinCode, classroomB.joinCode);

    // The light list (no classroomId) shows both new classes, with no workspace data attached.
    const list = await (await call("/api/bootstrap", { headers: { cookie: teacherCookie } })).json();
    const listedIds = list.classrooms.map((item) => item.id);
    assert.ok(listedIds.includes(classroomAId) && listedIds.includes(classroomBId));
    assert.deepEqual(list.teams, []);

    // A student joins class A only.
    await call("/api/classes/join", { method: "POST", headers: { cookie: studentCookie }, body: JSON.stringify({ joinCode: classroomA.joinCode }) });
    const studentList = await (await call("/api/bootstrap", { headers: { cookie: studentCookie } })).json();
    assert.deepEqual(studentList.classrooms.map((item) => item.id), [classroomAId]);

    // Give class A a running activity - the scoping regression: entering A must see it, entering
    // B must not, and B's own teacher-demo workspace must not show up when A is the one entered.
    const { data: activity } = await admin.from("activities").insert({ classroom_id: classroomAId, title: "A's activity", mode: "individual", created_by: teacher.id }).select("id").single();
    activityId = activity.id;
    await admin.from("classrooms").update({ current_activity_id: activityId }).eq("id", classroomAId);

    const enteredA = await (await call(`/api/bootstrap?classroomId=${classroomAId}`, { headers: { cookie: teacherCookie } })).json();
    assert.equal(enteredA.currentActivity?.title, "A's activity");
    assert.equal(enteredA.teams.filter((team) => team.isTeacherWorkspace).length, 1, "only class A's own teacher-demo workspace must appear when A is entered");

    const enteredB = await (await call(`/api/bootstrap?classroomId=${classroomBId}`, { headers: { cookie: teacherCookie } })).json();
    assert.equal(enteredB.currentActivity, null, "class B's workspace must not see class A's running activity");
    assert.equal(enteredB.teams.filter((team) => team.isTeacherWorkspace).length, 1, "class B's bootstrap must not also pull in class A's teacher-demo workspace");

    // Invitations use the class's own active session, not the first classroom or a join code.
    const activityList = await (await call("/api/bootstrap", { headers: { cookie: studentCookie } })).json();
    assert.equal(activityList.classrooms[0].liveSessionId, `activity:${activityId}`);
    assert.equal(activityList.classrooms[0].hasActivity, true);
    assert.equal(activityList.classrooms[0].joinCode, undefined, "students must not receive teacher-only join codes");
    const demoProjectId = enteredA.teams.find((team) => team.isTeacherWorkspace).project.id;
    await admin.from("classrooms").update({ current_activity_id: null, live_share_project_id: demoProjectId }).eq("id", classroomAId);
    const shareList = await (await call("/api/bootstrap", { headers: { cookie: studentCookie } })).json();
    assert.equal(shareList.classrooms[0].liveSessionId, `share:${demoProjectId}`);
    assert.equal(shareList.classrooms[0].hasLiveShare, true);
    await call(`/api/classes/${classroomAId}/live-share`, { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify({ projectId: null }) });
    const endedList = await (await call("/api/bootstrap", { headers: { cookie: studentCookie } })).json();
    assert.equal(endedList.classrooms[0].liveSessionId, null);
    assert.equal(endedList.classrooms[0].hasLiveShare, false);

    // A classroomId the caller can't access (here, the student was never added to B) is refused.
    assert.equal((await call(`/api/bootstrap?classroomId=${classroomBId}`, { headers: { cookie: studentCookie } })).status, 403);
  } finally {
    if (activityId) await admin.from("classrooms").update({ current_activity_id: null }).eq("id", classroomAId);
    if (activityId) await admin.from("activities").delete().eq("id", activityId);
    if (classroomAId) await admin.from("classrooms").delete().eq("id", classroomAId);
    if (classroomBId) await admin.from("classrooms").delete().eq("id", classroomBId);
    for (const user of [teacher, student]) await admin.auth.admin.deleteUser(user.id);
  }
});
