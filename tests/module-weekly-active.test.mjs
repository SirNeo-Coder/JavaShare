// Run with: npm test (route checks need local Supabase, skipped otherwise)
// New feature, no prior CKB: a teacher picks one uploaded module as "this week's" for a class
// (docs/knowledgebase/workflow-state.md). While a live activity is running, a student's module
// catalog locks to just that pick - everything else is refused server-side, not just hidden.
// Also covers the student's one shared per-module project (project_files), which has no prior CKB.
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

test("module weekly active + shared project: pick, lock, and project file round-trip", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-weekly-active-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const createUser = async (name) => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-weekly-active-test.example.test`, password, email_confirm: true, user_metadata: { name } });
    assert.equal(error, null);
    return data.user;
  };
  const teacher = await createUser("Weekly Active Teacher");
  const student = await createUser("Weekly Active Student");
  await admin.from("profiles").update({ role: "teacher" }).eq("id", teacher.id);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Weekly active test class", join_code: `WA${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher.id }).select("id").single();
  const classroomId = classroom.id;
  await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: student.id });

  // Two modules in the class: moduleA is picked as this week's; moduleB is not.
  const moduleA = fixture;
  const moduleB = { ...fixture, id: "java-2-w99-other", title: "Another module" };
  const openLessonIds = (module) => module.lessons.map((lesson) => lesson.id);
  await admin.from("course_modules").insert([
    { classroom_id: classroomId, module_id: moduleA.id, content: moduleA, created_by: teacher.id, open_lesson_ids: openLessonIds(moduleA), performance_task_open: true },
    { classroom_id: classroomId, module_id: moduleB.id, content: moduleB, created_by: teacher.id, open_lesson_ids: openLessonIds(moduleB), performance_task_open: true },
  ]);

  try {
    const login = async (user) => (await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) })).headers.get("set-cookie").split(";")[0];
    const teacherCookie = await login(teacher);
    const studentCookie = await login(student);

    // A student cannot pick the week's module.
    assert.equal((await call(`/api/classrooms/${classroomId}/active-module`, { method: "PATCH", headers: { cookie: studentCookie }, body: JSON.stringify({ moduleId: moduleA.id }) })).status, 403);

    // A module id that doesn't belong to this classroom is rejected, not silently accepted.
    const bogus = await call(`/api/classrooms/${classroomId}/active-module`, { method: "PATCH", headers: { cookie: teacherCookie }, body: JSON.stringify({ moduleId: "not-a-real-module" }) });
    assert.equal(bogus.status, 404);

    const picked = await call(`/api/classrooms/${classroomId}/active-module`, { method: "PATCH", headers: { cookie: teacherCookie }, body: JSON.stringify({ moduleId: moduleA.id }) });
    assert.equal(picked.status, 200);
    assert.deepEqual(await picked.json(), { activeModuleId: moduleA.id });

    // The catalog reflects the pick. No live activity yet, so nothing is locked for the student.
    const listBeforeLive = await (await call(`/api/classrooms/${classroomId}/modules`, { headers: { cookie: studentCookie } })).json();
    const byId = (list, id) => list.find((module) => module.moduleId === id);
    assert.equal(byId(listBeforeLive, moduleA.id).isActive, true);
    assert.equal(byId(listBeforeLive, moduleA.id).locked, false);
    assert.equal(byId(listBeforeLive, moduleB.id).isActive, false);
    assert.equal(byId(listBeforeLive, moduleB.id).locked, false, "nothing is locked while no activity is live");
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleB.id}`, { headers: { cookie: studentCookie } })).status, 200, "non-active module is still reachable with no live activity");

    // Start a live activity for the class (mirrors createSupabaseActivity's effect on classrooms).
    const { data: activity } = await admin.from("activities").insert({ classroom_id: classroomId, created_by: teacher.id, title: "Live class", mode: "individual" }).select("id").single();
    await admin.from("classrooms").update({ current_activity_id: activity.id }).eq("id", classroomId);

    // Now locked in the catalog too, matching the hard server-side block below.
    const listDuringLive = await (await call(`/api/classrooms/${classroomId}/modules`, { headers: { cookie: studentCookie } })).json();
    assert.equal(byId(listDuringLive, moduleB.id).locked, true);
    assert.equal(byId(listDuringLive, moduleA.id).locked, false, "the active pick itself is never locked");

    // The non-active module is hard-blocked for the student, not just hidden - content, progress,
    // and every write route a student can hit while reading/working on a module.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleB.id}`, { headers: { cookie: studentCookie } })).status, 403, "GET module content must be blocked during live class");
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleB.id}/progress`, { headers: { cookie: studentCookie } })).status, 403, "GET progress must be blocked during live class");
    const stepB = moduleB.lessons[0].blocks[0];
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleB.id}/progress/step`, { method: "PUT", headers: { cookie: studentCookie }, body: JSON.stringify({ stepId: stepB.id, status: "pass" }) })).status, 403, "PUT step must be blocked during live class");
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleB.id}/progress/project`, { method: "PUT", headers: { cookie: studentCookie }, body: JSON.stringify({ files: [{ path: "Main.java", content: "x" }] }) })).status, 403, "PUT project must be blocked during live class");

    // The active pick (moduleA) stays fully reachable during live class.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleA.id}`, { headers: { cookie: studentCookie } })).status, 200);

    // Teachers previewing are never locked, regardless of what's live.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleB.id}`, { headers: { cookie: teacherCookie } })).status, 200, "a teacher's preview must never be locked");

    // The student's one shared project for moduleA: starts empty, round-trips a full save, and a
    // second save replaces rather than merges (it's the student's one working copy, not a map).
    const emptyProgress = await (await call(`/api/classrooms/${classroomId}/modules/${moduleA.id}/progress`, { headers: { cookie: studentCookie } })).json();
    assert.deepEqual(emptyProgress.projectFiles, []);
    const firstSave = await (await call(`/api/classrooms/${classroomId}/modules/${moduleA.id}/progress/project`, { method: "PUT", headers: { cookie: studentCookie }, body: JSON.stringify({ files: [{ path: "Main.java", content: "class Main {}" }] }) })).json();
    assert.deepEqual(firstSave.projectFiles, [{ path: "Main.java", content: "class Main {}" }]);
    const secondSave = await (await call(`/api/classrooms/${classroomId}/modules/${moduleA.id}/progress/project`, { method: "PUT", headers: { cookie: studentCookie }, body: JSON.stringify({ files: [{ path: "Main.java", content: "class Main { void run() {} }" }, { path: "Helper.java", content: "class Helper {}" }] }) })).json();
    assert.deepEqual(secondSave.projectFiles, [{ path: "Main.java", content: "class Main { void run() {} }" }, { path: "Helper.java", content: "class Helper {}" }], "a later save must replace the working copy, not merge into it");

    // End the live activity, then delete the active module - the classroom's pick must clear
    // itself (active_module_id is plain text, not a foreign key, so nothing does this for free).
    await admin.from("classrooms").update({ current_activity_id: null }).eq("id", classroomId);
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleA.id}`, { method: "DELETE", headers: { cookie: teacherCookie } })).status, 200);
    const { data: afterDelete } = await admin.from("classrooms").select("active_module_id").eq("id", classroomId).single();
    assert.equal(afterDelete.active_module_id, null, "deleting the active module must clear the classroom's pick");
  } finally {
    await admin.from("module_progress").delete().eq("student_id", student.id);
    await admin.from("activities").delete().eq("classroom_id", classroomId);
    await admin.from("classrooms").delete().eq("id", classroomId);
    await admin.auth.admin.deleteUser(student.id);
    await admin.auth.admin.deleteUser(teacher.id);
  }
});
