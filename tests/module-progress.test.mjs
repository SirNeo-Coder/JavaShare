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

test("module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-progress-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  // Set up a classroom and student directly (not through /api/auth/register), so this test
  // never races other test files for "first account ever becomes teacher with join code JAVA101".
  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const createUser = async (name) => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-progress-test.example.test`, password, email_confirm: true, user_metadata: { name } });
    assert.equal(error, null);
    return data.user;
  };
  const teacher = await createUser("Module Progress Teacher");
  const student = await createUser("Module Progress Student");
  await admin.from("profiles").update({ role: "teacher" }).eq("id", teacher.id);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Module progress test class", join_code: `MP${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher.id }).select("id").single();
  const classroomId = classroom.id;
  const moduleId = fixture.id;
  const step = fixture.lessons[0].blocks[0];

  try {
    const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: student.email, password }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];

    // Not a class member yet: tracking progress is refused.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).status, 403);

    await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: student.id });

    const empty = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.deepEqual(empty, { moduleId, stepStates: {}, exitSlipDone: false, performanceTask: {} });

    const afterStep = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ stepId: step.id, status: "pass" }) })).json();
    assert.deepEqual(afterStep.stepStates, { [step.id]: "pass" });

    // A later run can flip the same step to fail (the student re-ran and broke it).
    const afterFail = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ stepId: step.id, status: "fail" }) })).json();
    assert.deepEqual(afterFail.stepStates, { [step.id]: "fail" });

    const afterSlip = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/exit-slip`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ done: true }) })).json();
    assert.equal(afterSlip.exitSlipDone, true);

    const task = fixture.performanceTask;
    const afterSample = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ variant: "sample", files: task.exampleFiles, status: "pass" }) })).json();
    assert.equal(afterSample.performanceTask.sample.status, "pass");
    assert.equal(afterSample.performanceTask.own, undefined);

    const afterOwn = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ variant: "own", files: [{ path: "Main.java", content: "public class Main { public static void main(String[] a) {} }" }], status: "fail" }) })).json();
    assert.equal(afterOwn.performanceTask.sample.status, "pass", "the sample-code submission must survive submitting the own-version one");
    assert.equal(afterOwn.performanceTask.own.status, "fail");

    const final = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.deepEqual(final.stepStates, { [step.id]: "fail" });
    assert.equal(final.exitSlipDone, true);
    assert.equal(final.performanceTask.sample.status, "pass");
    assert.equal(final.performanceTask.own.status, "fail");

    // A teacher has no module progress of their own.
    const teacherLogin = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: teacher.email, password }) });
    const teacherCookie = teacherLogin.headers.get("set-cookie").split(";")[0];
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie: teacherCookie } })).status, 403);
  } finally {
    await admin.from("module_progress").delete().eq("student_id", student.id);
    await admin.from("classrooms").delete().eq("id", classroomId);
    await admin.auth.admin.deleteUser(student.id);
    await admin.auth.admin.deleteUser(teacher.id);
  }
});
