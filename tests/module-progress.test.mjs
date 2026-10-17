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
  const exitSlipId = fixture.lessons[0].exitSlip.id;

  try {
    const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: student.email, password }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];

    // Not a class member yet: tracking progress is refused.
    assert.equal((await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).status, 403);

    await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: student.id });

    const empty = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.deepEqual(empty, { moduleId, stepStates: {}, performanceTask: {} });

    const afterStep = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ stepId: step.id, status: "pass" }) })).json();
    assert.deepEqual(afterStep.stepStates, { [step.id]: "pass" });

    // A later run can flip the same step to fail (the student re-ran and broke it).
    const afterFail = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ stepId: step.id, status: "fail" }) })).json();
    assert.deepEqual(afterFail.stepStates, { [step.id]: "fail" });

    // An exit slip is marked done the same way as a step - through the same route, keyed by the
    // exit slip's own id (CKB-007: one flag per module couldn't tell lessons apart).
    const afterSlip = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ stepId: exitSlipId, status: "pass" }) })).json();
    assert.equal(afterSlip.stepStates[exitSlipId], "pass");

    // CKB-007 regression proof: the module has a second lesson with its own exit slip. Marking
    // lesson 1's exit slip done must not mark lesson 2's - a single module-wide flag couldn't
    // tell them apart.
    const secondExitSlipId = fixture.lessons[1].exitSlip.id;
    assert.notEqual(secondExitSlipId, exitSlipId);
    assert.equal(afterSlip.stepStates[secondExitSlipId], undefined, "a different lesson's exit slip must not be marked done");

    const task = fixture.performanceTask;
    const afterSample = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ variant: "sample", files: task.exampleFiles, status: "pass" }) })).json();
    assert.equal(afterSample.performanceTask.sample.status, "pass");
    assert.equal(afterSample.performanceTask.own, undefined);

    const afterOwn = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ variant: "own", files: [{ path: "Main.java", content: "public class Main { public static void main(String[] a) {} }" }], status: "fail" }) })).json();
    assert.equal(afterOwn.performanceTask.sample.status, "pass", "the sample-code submission must survive submitting the own-version one");
    assert.equal(afterOwn.performanceTask.own.status, "fail");

    const final = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.deepEqual(final.stepStates, { [step.id]: "fail", [exitSlipId]: "pass" });
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

test("module progress: two simultaneous first touches of a module don't 500 (write race)", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-progress-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const { data: student, error: studentError } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-progress-test.example.test`, password, email_confirm: true, user_metadata: { name: "Race Student" } });
  assert.equal(studentError, null);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Write race test class", join_code: `MR${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: student.user.id }).select("id").single();
  const classroomId = classroom.id;
  const moduleId = fixture.id;

  try {
    await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: student.user.id });
    const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: student.user.email, password }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];

    // Two tabs/devices open the same module for the first time at once: both see no row yet and
    // both try to create it. Neither request should 500.
    const [first, second] = await Promise.all([
      call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } }),
      call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } }),
    ]);
    assert.notEqual(first.status, 500, "first concurrent first-touch must not 500");
    assert.notEqual(second.status, 500, "second concurrent first-touch must not 500");
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);

    const { data: rows } = await admin.from("module_progress").select("id").eq("student_id", student.user.id).eq("module_id", moduleId);
    assert.equal(rows.length, 1, "exactly one progress row must exist after the race");
  } finally {
    await admin.from("module_progress").delete().eq("student_id", student.user.id);
    await admin.from("classrooms").delete().eq("id", classroomId);
    await admin.auth.admin.deleteUser(student.user.id);
  }
});

test("module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-progress-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const { data: teacher, error: teacherError } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-progress-test.example.test`, password, email_confirm: true, user_metadata: { name: "Scoping Teacher" } });
  assert.equal(teacherError, null);
  await admin.from("profiles").update({ role: "teacher" }).eq("id", teacher.user.id);
  const { data: student, error: studentError } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-progress-test.example.test`, password, email_confirm: true, user_metadata: { name: "Scoping Student" } });
  assert.equal(studentError, null);

  // The same module id, uploaded to two different classrooms - a teacher reusing one week's
  // module across two sections of the same course. A student who is a member of both must get
  // independent progress in each, since course_modules is correctly scoped per classroom too.
  const moduleId = fixture.id;
  const { data: classroomA } = await admin.from("classrooms").insert({ name: "Scoping test class A", join_code: `SA${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher.user.id }).select("id").single();
  const { data: classroomB } = await admin.from("classrooms").insert({ name: "Scoping test class B", join_code: `SB${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher.user.id }).select("id").single();

  try {
    await admin.from("course_modules").insert([
      { classroom_id: classroomA.id, module_id: moduleId, content: fixture, created_by: teacher.user.id },
      { classroom_id: classroomB.id, module_id: moduleId, content: fixture, created_by: teacher.user.id },
    ]);
    await admin.from("classroom_members").insert([
      { classroom_id: classroomA.id, user_id: student.user.id },
      { classroom_id: classroomB.id, user_id: student.user.id },
    ]);
    const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: student.user.email, password }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];
    const step = fixture.lessons[0].blocks[0];

    await call(`/api/classrooms/${classroomA.id}/modules/${moduleId}/progress/step`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ stepId: step.id, status: "pass" }) });

    // Classroom B's copy of this module is a fresh start for this student - marking a step done
    // in classroom A must not make classroom B's module look already-completed.
    const progressInB = await (await call(`/api/classrooms/${classroomB.id}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.deepEqual(progressInB.stepStates, {}, "classroom B's progress must not see classroom A's step state");

    const progressInA = await (await call(`/api/classrooms/${classroomA.id}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.deepEqual(progressInA.stepStates, { [step.id]: "pass" }, "classroom A's own progress must be unaffected");
  } finally {
    await admin.from("module_progress").delete().eq("student_id", student.user.id);
    await admin.from("course_modules").delete().eq("module_id", moduleId).in("classroom_id", [classroomA.id, classroomB.id]);
    await admin.from("classrooms").delete().in("id", [classroomA.id, classroomB.id]);
    await admin.auth.admin.deleteUser(student.user.id);
    await admin.auth.admin.deleteUser(teacher.user.id);
  }
});

test("module progress: two simultaneous performance-task submissions don't lose one (write race)", { skip: !local && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-progress-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));

  const admin = getSupabaseAdmin();
  const password = randomUUID();
  const { data: student, error: studentError } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-progress-test.example.test`, password, email_confirm: true, user_metadata: { name: "Race Student 2" } });
  assert.equal(studentError, null);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Write race test class 2", join_code: `MR2${Date.now()}`.slice(0, 11).toUpperCase(), teacher_id: student.user.id }).select("id").single();
  const classroomId = classroom.id;
  const moduleId = fixture.id;
  const task = fixture.performanceTask;

  try {
    await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: student.user.id });
    const login = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: student.user.email, password }) });
    const cookie = login.headers.get("set-cookie").split(";")[0];

    // Force the row to already exist, so both submissions below race on the same read-merge-write
    // instead of also racing on first-touch creation (that race is covered by the test above).
    await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } });

    // The student submits the sample-code run and their own version at nearly the same time
    // (e.g. two browser tabs, or a slow network making two "Run" clicks overlap). Both submissions
    // must be kept - a read-then-overwrite of the whole performance_task column can silently drop
    // whichever one loses the race.
    const [sampleResponse, ownResponse] = await Promise.all([
      call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ variant: "sample", files: task.exampleFiles, status: "pass" }) }),
      call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", headers: { cookie }, body: JSON.stringify({ variant: "own", files: [{ path: "Main.java", content: "public class Main { public static void main(String[] a) {} }" }], status: "fail" }) }),
    ]);
    assert.equal(sampleResponse.status, 200);
    assert.equal(ownResponse.status, 200);

    const final = await (await call(`/api/classrooms/${classroomId}/modules/${moduleId}/progress`, { headers: { cookie } })).json();
    assert.equal(final.performanceTask.sample?.status, "pass", "the sample submission must not be lost to the race");
    assert.equal(final.performanceTask.own?.status, "fail", "the own-version submission must not be lost to the race");
  } finally {
    await admin.from("module_progress").delete().eq("student_id", student.user.id);
    await admin.from("classrooms").delete().eq("id", classroomId);
    await admin.auth.admin.deleteUser(student.user.id);
  }
});
