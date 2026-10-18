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

test("course modules: teacher uploads, class members read, only the teacher may upload or delete", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "course-modules-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const createUser = async (name) => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@course-modules-test.example.test`, password, email_confirm: true, user_metadata: { name } });
    assert.equal(error, null);
    return data.user;
  };
  const teacher = await createUser("Course Modules Teacher");
  const student = await createUser("Course Modules Student");
  const outsider = await createUser("Course Modules Outsider");
  await admin.from("profiles").update({ role: "teacher" }).eq("id", teacher.id);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Course modules test class", join_code: `CM${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher.id }).select("id").single();
  const classroomId = classroom.id;
  await admin.from("classroom_members").insert([{ classroom_id: classroomId, user_id: teacher.id }, { classroom_id: classroomId, user_id: student.id }]);

  try {
    const login = async (user) => (await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) })).headers.get("set-cookie").split(";")[0];
    const teacherCookie = await login(teacher);
    const studentCookie = await login(student);
    const outsiderCookie = await login(outsider);

    // A student cannot upload a module.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: studentCookie }, body: JSON.stringify(fixture) })).status, 403);

    // A malformed file is rejected with a plain-English error, not a 500.
    const broken = { ...fixture, course: "not-a-real-course" };
    const rejected = await call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify(broken) });
    assert.equal(rejected.status, 400);
    assert.match((await rejected.json()).error, /doesn't match the expected format/);

    const uploaded = await call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify(fixture) });
    assert.equal(uploaded.status, 201);
    const summary = await uploaded.json();
    assert.deepEqual(summary, { moduleId: fixture.id, title: fixture.title, week: fixture.week, course: fixture.course, updatedAt: summary.updatedAt, isActive: false, locked: false });

    // An outsider (not in the class) sees nothing.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules`, { headers: { cookie: outsiderCookie } })).status, 403);

    // The student (a class member) can list and read it.
    const list = await (await call(`/api/classrooms/${classroomId}/modules`, { headers: { cookie: studentCookie } })).json();
    assert.deepEqual(list.map((module) => module.moduleId), [fixture.id]);
    // New uploads start closed; the teacher still previews the unchanged file.
    const closed = await (await call(`/api/classrooms/${classroomId}/modules/${fixture.id}`, { headers: { cookie: studentCookie } })).json();
    assert.ok(closed.lessons.every((lesson) => lesson.closed && lesson.blocks.length === 0));
    const preview = await (await call(`/api/classrooms/${classroomId}/modules/${fixture.id}`, { headers: { cookie: teacherCookie } })).json();
    const { availability, ...source } = preview;
    assert.deepEqual(source, fixture);
    assert.deepEqual(availability, { openLessonIds: [], performanceTaskOpen: false });

    // Re-uploading the same module id replaces its content and keeps a single row (rule 2).
    const reuploaded = { ...fixture, title: "Corrected title" };
    await call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: teacherCookie }, body: JSON.stringify(reuploaded) });
    const afterReupload = await (await call(`/api/classrooms/${classroomId}/modules`, { headers: { cookie: studentCookie } })).json();
    assert.equal(afterReupload.length, 1);
    assert.equal(afterReupload[0].title, "Corrected title");

    // A student cannot delete a module.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${fixture.id}`, { method: "DELETE", headers: { cookie: studentCookie } })).status, 403);
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${fixture.id}`, { method: "DELETE", headers: { cookie: teacherCookie } })).status, 200);
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${fixture.id}`, { headers: { cookie: studentCookie } })).status, 404);
  } finally {
    await admin.from("course_modules").delete().eq("classroom_id", classroomId);
    await admin.from("classrooms").delete().eq("id", classroomId);
    await admin.auth.admin.deleteUser(teacher.id);
    await admin.auth.admin.deleteUser(student.id);
    await admin.auth.admin.deleteUser(outsider.id);
  }
});
