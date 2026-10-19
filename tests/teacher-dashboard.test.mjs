// These checks use the real shared HTTP routes and disposable local Supabase data.
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

test("teacher dashboard", { skip: !local && "local Supabase is not running" }, async (t) => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "teacher-dashboard-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));
  const password = randomUUID();
  const users = [];
  const classes = [];
  const insert = async (table, rows) => { const result = await admin.from(table).insert(rows); assert.equal(result.error, null, `${table}: ${result.error?.message}`); };
  const createUser = async (name, role = "student") => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@teacher-dashboard.example.test`, password, email_confirm: true, user_metadata: { name } });
    assert.equal(error, null);
    users.push(data.user);
    if (role === "teacher") assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    return data.user;
  };
  const createClass = async (teacherId, name) => {
    const { data, error } = await admin.from("classrooms").insert({ teacher_id: teacherId, name, join_code: randomUUID().slice(0, 8).toUpperCase() }).select("id").single();
    assert.equal(error, null); classes.push(data.id); return data.id;
  };
  const cookieFor = async (user) => {
    const response = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) });
    assert.equal(response.status, 200); return response.headers.get("set-cookie").split(";")[0];
  };
  try {
    const teacher = await createUser("Dashboard Teacher", "teacher");
    const otherTeacher = await createUser("Other Teacher", "teacher");
    const full = await createUser("A Complete Student");
    const partial = await createUser("B Partial Student");
    const untouched = await createUser("C Untouched Student");
    const former = await createUser("Former Student");
    const classA = await createClass(teacher.id, "Dashboard class A");
    const classB = await createClass(teacher.id, "Dashboard class B");
    const emptyClass = await createClass(teacher.id, "Empty class");
    await insert("classroom_members", [teacher, full, partial, untouched].map((user) => ({ classroom_id: classA, user_id: user.id })));
    await insert("classroom_members", [{ classroom_id: classB, user_id: partial.id }]);
    const second = { ...fixture, id: `${fixture.id}-second`, title: "Earlier module", week: 1 };
    delete second.performanceTask;
    await insert("course_modules", [
      { classroom_id: classA, module_id: fixture.id, content: fixture, created_by: teacher.id, open_lesson_ids: [], performance_task_open: false },
      { classroom_id: classA, module_id: second.id, content: second, created_by: teacher.id, open_lesson_ids: [], performance_task_open: false },
      { classroom_id: classB, module_id: fixture.id, content: fixture, created_by: teacher.id, open_lesson_ids: [], performance_task_open: false },
    ]);
    const allSteps = Object.fromEntries(fixture.lessons.flatMap((lesson) => [...lesson.blocks.filter((block) => block.type === "step").map((step) => [step.id, "pass"]), [lesson.exitSlip.id, "pass"]]));
    const entry = { files: [{ path: "Main.java", content: "DO_NOT_EXPOSE_STUDENT_SOURCE" }], status: "pass", submittedAt: new Date().toISOString() };
    const tasks = { sample: entry, own: { ...entry, status: "fail" } };
    await insert("module_progress", [
      { student_id: full.id, classroom_id: classA, module_id: fixture.id, step_states: allSteps, performance_task: tasks },
      { student_id: full.id, classroom_id: classA, module_id: second.id, step_states: {}, performance_task: tasks },
      { student_id: partial.id, classroom_id: classA, module_id: fixture.id, step_states: { [fixture.lessons[0].blocks[0].id]: "pass" }, performance_task: {} },
      { student_id: former.id, classroom_id: classA, module_id: fixture.id, step_states: allSteps, performance_task: tasks },
      { student_id: partial.id, classroom_id: classB, module_id: fixture.id, step_states: allSteps, performance_task: tasks },
      { student_id: full.id, classroom_id: classA, module_id: "deleted-module", step_states: allSteps, performance_task: tasks },
    ]);
    const teacherCookie = await cookieFor(teacher);
    const studentCookie = await cookieFor(partial);
    const otherCookie = await cookieFor(otherTeacher);
    const path = `/api/classes/${classA}/module-progress`;
    const read = async (classroomId = classA) => {
      const response = await call(`/api/classes/${classroomId}/module-progress`, { headers: { cookie: teacherCookie } });
      assert.equal(response.status, 200); return response.json();
    };

    await t.test("refuses signed-out users, students, foreign teachers, and invalid class IDs", async () => {
      assert.equal((await call(path)).status, 401);
      assert.equal((await call(path, { headers: { cookie: studentCookie } })).status, 403);
      assert.equal((await call(path, { headers: { cookie: otherCookie } })).status, 403);
      assert.equal((await call("/api/classes/not-a-uuid/module-progress", { headers: { cookie: teacherCookie } })).status, 400);
    });
    await t.test("counts saved completion and both submissions, including closed lessons, without exposing source", async () => {
      const data = await read();
      assert.deepEqual(data.totals, { students: 3, modules: 2, averagePercent: 20, completedModules: 1, notStartedStudents: 1, submissions: 2 });
      assert.deepEqual(data.modules.map((module) => module.moduleId), [second.id, fixture.id], "module cards follow week order");
      const courseSummary = data.modules.find((module) => module.moduleId === fixture.id);
      assert.deepEqual({ lessons: courseSummary.lessons, steps: courseSummary.steps, completed: courseSummary.completedStudents, average: courseSummary.averagePercent, submissions: courseSummary.submissions }, { lessons: 2, steps: 2, completed: 1, average: 39, submissions: 2 });
      assert.equal(data.modules.find((module) => module.moduleId === second.id).submissions, 0, "removed task slots cannot count as submissions");
      assert.equal(data.students.find((student) => student.id === full.id).averagePercent, 50);
      assert.equal(data.students.find((student) => student.id === partial.id).averagePercent, 9);
      assert.equal(data.students.find((student) => student.id === untouched.id).averagePercent, 0);
      assert.doesNotMatch(JSON.stringify(data), /DO_NOT_EXPOSE_STUDENT_SOURCE|step_states|performance_task|project_files/);
      const own = await (await call(`/api/classrooms/${classA}/modules/summary`, { headers: { cookie: studentCookie } })).json();
      assert.equal(data.students.find((student) => student.id === partial.id).modules.find((module) => module.moduleId === fixture.id).percent, own.find((module) => module.moduleId === fixture.id).percent, "dashboard and student use the same calculation");
    });
    await t.test("keeps the same student's progress separate between classes and excludes former members", async () => {
      const data = await read();
      assert.ok(!data.students.some((student) => student.id === former.id));
      assert.ok(!data.students.some((student) => student.id === teacher.id));
      const studentA = data.students.find((student) => student.id === partial.id);
      assert.equal(studentA.modules.find((module) => module.moduleId === fixture.id).percent, 17);
      const otherClass = await read(classB);
      assert.equal(otherClass.students[0].modules[0].percent, 100);
      assert.equal(otherClass.totals.students, 1);
      assert.equal(otherClass.totals.submissions, 2);
    });
    await t.test("returns finite zero totals for empty classes and modules with no students", async () => {
      const empty = await read(emptyClass);
      assert.deepEqual(empty, { students: [], modules: [], totals: { students: 0, modules: 0, averagePercent: 0, completedModules: 0, notStartedStudents: 0, submissions: 0 } });
      await insert("course_modules", { classroom_id: emptyClass, module_id: fixture.id, content: fixture, created_by: teacher.id });
      const moduleOnly = await read(emptyClass);
      assert.equal(moduleOnly.modules[0].averagePercent, 0);
      assert.equal(moduleOnly.modules[0].completedStudents, 0);
      assert.equal(moduleOnly.totals.averagePercent, 0);
    });
    await t.test("rounded 100% averages do not label unfinished students or modules Finished (CKB-041)", async () => {
      const roundingClass = await createClass(teacher.id, "Rounding class");
      await insert("classroom_members", [full, partial].map((user) => ({ classroom_id: roundingClass, user_id: user.id })));
      const large = structuredClone(fixture);
      delete large.performanceTask;
      large.lessons[0].blocks = Array.from({ length: 100 }, (_, index) => ({ ...fixture.lessons[0].blocks[0], id: `rounding-step-${index}`, number: index + 1 }));
      large.lessons[1].blocks = [];
      const states = Object.fromEntries(large.lessons.flatMap((lesson) => [...lesson.blocks.map((step) => [step.id, "pass"]), [lesson.exitSlip.id, "pass"]]));
      await insert("course_modules", [
        { classroom_id: roundingClass, module_id: large.id, content: large, created_by: teacher.id },
        { classroom_id: roundingClass, module_id: second.id, content: second, created_by: teacher.id },
      ]);
      await insert("module_progress", [
        { classroom_id: roundingClass, student_id: full.id, module_id: large.id, step_states: { ...states, "rounding-step-0": "fail" }, performance_task: {} },
        { classroom_id: roundingClass, student_id: full.id, module_id: second.id, step_states: allSteps, performance_task: {} },
        { classroom_id: roundingClass, student_id: partial.id, module_id: large.id, step_states: states, performance_task: {} },
      ]);
      const data = await read(roundingClass);
      const student = data.students.find((item) => item.id === full.id);
      assert.equal(student.averagePercent, 100);
      assert.equal(student.completedModules, 1);
      assert.equal(student.status, "in-progress");
      const courseSummary = data.modules.find((item) => item.moduleId === large.id);
      assert.equal(courseSummary.averagePercent, 100);
      assert.equal(courseSummary.completedStudents, 1);
      assert.equal(courseSummary.status, "in-progress");
    });
    await t.test("rounded 0% averages retain In progress when a student has completed an item (CKB-041)", async () => {
      const lowClass = await createClass(teacher.id, "Small progress class");
      await insert("classroom_members", { classroom_id: lowClass, user_id: untouched.id });
      const large = structuredClone(fixture);
      delete large.performanceTask;
      large.lessons[0].blocks = Array.from({ length: 100 }, (_, index) => ({ ...fixture.lessons[0].blocks[0], id: `small-step-${index}`, number: index + 1 }));
      large.lessons[1].blocks = [];
      await insert("course_modules", [large, second, { ...second, id: "third-module" }].map((content) => ({ classroom_id: lowClass, module_id: content.id, content, created_by: teacher.id })));
      await insert("module_progress", { classroom_id: lowClass, student_id: untouched.id, module_id: large.id, step_states: { "small-step-0": "pass" }, performance_task: {} });
      const data = await read(lowClass);
      assert.equal(data.students[0].averagePercent, 0);
      assert.equal(data.students[0].status, "in-progress");
      assert.equal(data.totals.notStartedStudents, 0);
    });
    await t.test("reads every progress page instead of silently truncating a full year", async () => {
      const before = await read();
      await insert("module_progress", Array.from({ length: 501 }, (_, index) => ({ student_id: full.id, classroom_id: classA, module_id: `a-removed-${index}`, step_states: {}, performance_task: {} })));
      const after = await read();
      assert.deepEqual(after.totals, before.totals);
      assert.equal(after.students.find((student) => student.id === full.id).modules.find((module) => module.moduleId === fixture.id).percent, 100);
    });
    await t.test("a new read reflects saved results without changing student progress", async () => {
      const before = await read();
      await admin.from("module_progress").update({ step_states: {} }).eq("classroom_id", classA).eq("student_id", partial.id);
      const after = await read();
      assert.equal(before.totals.averagePercent, 20);
      assert.equal(after.totals.averagePercent, 17);
      assert.equal(after.totals.notStartedStudents, 2);
      const { data: rows } = await admin.from("module_progress").select("student_id").eq("classroom_id", classA).eq("student_id", untouched.id);
      assert.deepEqual(rows, [], "reading the dashboard must not create student progress");
    });
  } finally {
    if (classes.length) await admin.from("classrooms").delete().in("id", classes);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
