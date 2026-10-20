import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
import { activityAccess, activityStateId, matchesActivityOutput, mergeProjectFiles } from "../backend/src/module-activities.ts";
import { courseModule } from "../backend/src/course-module-schema.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const first = fixture.lessons[0].blocks[0];
const second = fixture.lessons[1].blocks[0];
const firstStateId = activityStateId(first);
const secondStateId = activityStateId(second);
let local;
try {
  local = Object.fromEntries(execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
} catch { local = null; }
const needsLocal = { skip: !local?.API_URL && "local Supabase is not running" };

test("module activities: legacy challenge JSON remains readable while progress follows the sample", () => {
  const result = courseModule.parse(fixture);
  assert.equal(result.lessons[0].blocks[0].expectedOutput, "Capacity: 20");
  assert.equal(result.lessons[0].blocks[0].activity.expectedOutput, "Capacity: 25");
  for (const brokenPath of ["../Escape.java", "My File.java"]) {
    const broken = structuredClone(fixture);
    broken.lessons[0].blocks[0].activity.files[0].path = brokenPath;
    assert.equal(courseModule.safeParse(broken).success, false);
  }
  const badStarter = structuredClone(fixture); badStarter.starterFiles[0].path = "Broken File.java";
  assert.equal(courseModule.safeParse(badStarter).success, false);
  const self = { ...fixture, previousModuleId: fixture.id };
  assert.equal(courseModule.safeParse(self).success, false);
});

test("module activities: parts spanning lessons require every task and never require a paper liplet", () => {
  const content = structuredClone(fixture);
  content.lessons[0].blocks[0].part = "OOP";
  content.lessons[1].blocks[0].part = "OOP";
  const third = structuredClone(content.lessons[1]); third.id = "third"; third.blocks[0].id = "third-step"; third.blocks[0].part = "Collections";
  content.lessons.push(third);
  assert.equal(activityAccess(content, { [`${first.id}:activity`]: "pass", [`${second.id}:activity`]: "pass" }).parts[0].done, false, "legacy challenge passes cannot bypass the sample checks");
  const partial = activityAccess(content, { [firstStateId]: "pass", [content.lessons[0].exitSlip.id]: "pass" });
  assert.equal(partial.parts.length, 2);
  assert.equal(partial.parts[1].open, false);
  const done = activityAccess(content, { [firstStateId]: "pass", [secondStateId]: "pass" });
  assert.equal(done.parts[1].open, true);
  assert.equal(done.performanceTaskOpen, false);
  assert.equal(activityAccess(content, { [firstStateId]: "pass", [secondStateId]: "pass", "third-step": "pass" }).performanceTaskOpen, true);
});

test("module activities: matching text cannot pass a failed process; internal whitespace still matters", () => {
  assert.equal(matchesActivityOutput({ success: false, output: "Capacity: 25" }, "Capacity: 25"), false);
  assert.equal(matchesActivityOutput({ success: true, output: "Capacity: 25\r\n" }, "Capacity: 25\n"), true);
  for (const output of ["  Capacity: 25\n", "Capacity: 25 \n", "Capacity: 25\n\n"]) {
    assert.equal(matchesActivityOutput({ success: true, output }, "Capacity: 25"), false, "spaces and extra blank lines must match exactly");
  }
  assert.equal(matchesActivityOutput({ success: true, output: "Capacity:25" }, "Capacity: 25"), false);
});

test("module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038)", () => {
  const files = mergeProjectFiles(fixture.starterFiles, first.files, [{ path: "src/Main.java", content: "student's existing Main" }]);
  assert.equal(files.length, 3);
  assert.equal(files.find((file) => file.path.endsWith("Main.java")).content, "student's existing Main");
  assert.ok(files.some((file) => file.path === "Vehicle.java"));
});

async function withClass(action) {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "true", JWT_SECRET: "module-activities-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [];
  let classroomId;
  const password = randomUUID();
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));
  try {
    for (const role of ["teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@module-activity.example.test`, password, email_confirm: true, user_metadata: { name: `Activity ${role}` } });
      assert.equal(error, null); users.push(data.user);
      await admin.from("profiles").update({ role }).eq("id", data.user.id);
    }
    const created = await admin.from("classrooms").insert({ name: "Module activity test", join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id }).select("id").single();
    assert.equal(created.error, null); classroomId = created.data.id;
    assert.equal((await admin.from("classroom_members").insert(users.map((user) => ({ classroom_id: classroomId, user_id: user.id })))).error, null);
    const cookies = [];
    for (const user of users) {
      const response = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: user.email, password }) });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const request = (suffix = "", body, cookie = cookies[1], moduleId = fixture.id) => call(`/api/classrooms/${classroomId}/modules/${moduleId}${suffix}`, { method: body === undefined ? "GET" : "POST", headers: { cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const upload = async (module = fixture) => {
      const response = await call(`/api/classrooms/${classroomId}/modules`, { method: "POST", headers: { cookie: cookies[0] }, body: JSON.stringify(module) });
      assert.equal(response.status, 201, await response.text());
    };
    const prepare = async (stepId = first.id, cookie = cookies[1], moduleId = fixture.id) => {
      const response = await request("/progress/activity", { stepId }, cookie, moduleId);
      assert.equal(response.status, 200, await response.clone().text()); return response.json();
    };
    const run = async (files, stepId = first.id, updatedAt) => {
      // The real classroom runner deliberately rate-limits repeat clicks.
      await delay(1550);
      const current = updatedAt ?? (await (await request("/progress")).json()).updatedAt;
      return request("/progress/run", { stepId, files, updatedAt: current });
    };
    await upload();
    await action({ admin, users, classroomId, cookies, call, request, upload, prepare, run });
  } finally {
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
}

test("module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038)", needsLocal, async () => {
  await withClass(async ({ request, prepare, run, cookies, call, classroomId }) => {
    let view = await (await request()).json();
    assert.equal(view.lessons[0].closed, false);
    assert.equal(view.lessons[1].closed, true);
    assert.ok(!JSON.stringify(view).includes(second.activity.instruction));
    assert.equal((await request("/progress/activity", { stepId: second.id })).status, 403);
    assert.equal((await request("/progress/activity", { stepId: first.id }, cookies[0])).status, 403);
    const forged = await call(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress/step`, { method: "PUT", headers: { cookie: cookies[1] }, body: JSON.stringify({ stepId: first.id, status: "pass" }) });
    assert.equal(forged.status, 403);
    const prepared = await prepare();
    assert.equal(prepared.projectFiles.length, 3, "Main and both supporting classes are in one project");
    const wrong = prepared.projectFiles.map((file) => file.path === "Jeepney.java" ? { ...file, content: file.content.replace("return 20", "return 25") } : file);
    let response = await run(wrong);
    assert.equal(response.status, 200, await response.clone().text());
    let result = await response.json();
    assert.equal(result.passed, false, "the old challenge output must not satisfy the module sample");
    assert.equal(result.progress.percent, 0);
    const solution = prepared.projectFiles;
    response = await run(solution);
    assert.equal(response.status, 200, await response.clone().text()); result = await response.json();
    assert.equal(result.passed, true); assert.equal(result.output.trim(), "Capacity: 20");
    assert.equal(result.progress.percent, 25);
    assert.equal(result.progress.stepStates[firstStateId], "pass");
    assert.equal(result.progress.stepStates[fixture.lessons[0].exitSlip.id], undefined);
    view = await (await request()).json();
    assert.equal(view.lessons[1].closed, false);
    assert.equal((await (await request("", undefined, cookies[2])).json()).lessons[1].closed, true);
    const reopened = await prepare(second.id);
    assert.deepEqual(reopened.projectFiles, solution, "opening the next activity preserves the student's evolving project");
    const final = solution.map((file) => file.path.endsWith("Main.java") ? { ...file, content: 'public class Main { public static void main(String[] args) { for (int i = 3; i >= 1; i--) System.out.println(i); } }' } : file);
    result = await (await run(final, second.id)).json();
    assert.equal(result.passed, true); assert.equal(result.progress.percent, 50);
    assert.ok((await (await request()).json()).performanceTask);
  });
});

test("module activities: compile errors and a crash after the right output cannot pass", needsLocal, async () => {
  await withClass(async ({ prepare, run, request }) => {
    const prepared = await prepare();
    const broken = prepared.projectFiles.filter((file) => file.path === "Main.java");
    let response = await run(broken); let result = await response.json();
    assert.equal(result.success, false); assert.equal(result.passed, false); assert.match(result.output, /cannot find symbol/);
    const crash = [{ path: "Main.java", content: 'public class Main { public static void main(String[] args) { System.out.println("Capacity: 20"); throw new IllegalStateException("crash"); } }' }];
    response = await run(crash); result = await response.json();
    assert.equal(result.success, false); assert.equal(result.passed, false);
    assert.equal((await (await request()).json()).lessons[1].closed, true);
  });
});

test("module activities: prior project is copied only for its owner/class and later saves never replace it", needsLocal, async () => {
  await withClass(async ({ admin, users, classroomId, upload, prepare, request, cookies, call }) => {
    const previous = "previous-module";
    const priorFiles = [{ path: "src/Main.java", content: "student's previous Main" }, { path: "Vehicle.java", content: "student's previous Vehicle" }];
    assert.equal((await admin.from("module_progress").insert({ classroom_id: classroomId, student_id: users[1].id, module_id: previous, project_files: priorFiles })).error, null);
    await upload({ ...fixture, previousModuleId: previous });
    let prepared = await prepare();
    assert.equal(prepared.projectFiles.find((file) => file.path.endsWith("Main.java")).content, priorFiles[0].content);
    assert.equal(prepared.projectFiles.find((file) => file.path === "Vehicle.java").content, priorFiles[1].content);
    assert.ok(prepared.projectFiles.some((file) => file.path === "Jeepney.java"));
    const other = await prepare(first.id, cookies[2]);
    assert.ok(!JSON.stringify(other.projectFiles).includes("student's previous"));
    const otherModule = { ...fixture, id: "separate-module", previousModuleId: undefined }; await upload(otherModule);
    assert.ok(!JSON.stringify((await prepare(first.id, cookies[1], otherModule.id)).projectFiles).includes("student's previous"));
    const save = (updatedAt, content) => call(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress/project`, { method: "PUT", headers: { cookie: cookies[1] }, body: JSON.stringify({ files: [{ path: "Main.java", content }], updatedAt }) });
    assert.equal((await save(prepared.updatedAt, "new edit")).status, 200);
    assert.equal((await save(prepared.updatedAt, "stale overwrite")).status, 409);
    prepared = await prepare();
    assert.equal(prepared.projectFiles.find((file) => file.path.endsWith("Main.java")).content, "new edit");
    const { data } = await admin.from("module_progress").select("project_files").eq("classroom_id", classroomId).eq("student_id", users[1].id).eq("module_id", previous).single();
    assert.deepEqual(data.project_files, priorFiles);
    const response = await request("/progress/run", { stepId: first.id, files: [{ path: "../Escape.java", content: "x" }], updatedAt: prepared.updatedAt });
    assert.equal(response.status, 400);
  });
});

test("module activities: JSON supplies fixed program input and demo execution cannot award a pass", needsLocal, async () => {
  await withClass(async ({ upload, prepare, request, admin, users, classroomId }) => {
    const content = structuredClone(fixture);
    content.lessons[0].blocks[0].stdin = "7\n";
    content.lessons[0].blocks[0].expectedOutput = "14";
    await upload(content);
    const files = [{ path: "Main.java", content: 'import java.util.Scanner; public class Main { public static void main(String[] args) { System.out.println(new Scanner(System.in).nextInt() * 2); } }' }];
    let prepared = await prepare();
    const { runSupabaseModuleActivity } = await import("../backend/src/supabase-repository.ts");
    const profile = await admin.from("profiles").select("*").eq("id", users[1].id).single();
    await assert.rejects(runSupabaseModuleActivity({ ...profile.data, id: users[1].id, role: "student" }, classroomId, fixture.id, first.id, files, prepared.updatedAt,
      async () => ({ mode: "demo", success: true, output: "14" })), (error) => error.status === 503);
    const empty = await (await request("/progress")).json();
    assert.equal(empty.stepStates[firstStateId], undefined);
    prepared = await prepare();
    const response = await request("/progress/run", { stepId: first.id, files, updatedAt: prepared.updatedAt, stdin: "999", expectedOutput: "1998" });
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.equal(result.passed, true); assert.equal(result.output.trim(), "14");
  });
});


test("weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress", needsLocal, async () => {
  await withClass(async ({ admin, users, classroomId, upload, prepare, request, cookies, call }) => {
    const previous = "previous-module";
    const moduleFiles = [{ path: "Main.java", content: "previous module Main" }];
    const personalFiles = [{ path: "Main.java", content: "previous personal Main" }, { path: "Own.java", content: "previous personal class" }];
    const snapshot = { files: personalFiles, status: "pass", submittedAt: new Date().toISOString() };
    assert.equal((await admin.from("module_progress").insert({ classroom_id: classroomId, student_id: users[1].id, module_id: previous,
      project_files: moduleFiles, performance_task: { own: snapshot } })).error, null);
    await upload({ ...fixture, previousModuleId: previous });
    const base = `/api/classrooms/${classroomId}/modules/${fixture.id}/progress`;
    const personal = (body, method = "POST", cookie = cookies[1]) => call(`${base}/performance-project`, {
      method, headers: { cookie }, body: JSON.stringify(body ?? {}),
    });
    assert.equal((await personal()).status, 403, "task stays locked until module samples pass");
    const prepared = await prepare();
    assert.equal(prepared.projectFiles.find((file) => file.path.endsWith("Main.java")).content, "previous module Main");
    const passed = { [first.id]: "pass", [second.id]: "pass" };
    assert.equal((await admin.from("module_progress").update({ step_states: passed }).eq("classroom_id", classroomId).eq("module_id", fixture.id).eq("student_id", users[1].id)).error, null);
    let response = await personal();
    assert.equal(response.status, 200, await response.clone().text());
    let view = await response.json();
    assert.equal(view.performanceProjectFiles.find((file) => file.path.endsWith("Main.java")).content, "previous personal Main");
    assert.ok(view.performanceProjectFiles.some((file) => file.path === "Own.java"));
    assert.deepEqual(view.projectFiles, prepared.projectFiles);
    assert.equal(view.percent, 50, "preparing a draft is not a submission");
    assert.equal(view.performanceTask.own, undefined);
    assert.equal((await personal({}, "POST", cookies[0])).status, 403);
    assert.equal((await personal({}, "POST", cookies[2])).status, 403);
    assert.equal((await personal({ files: [{ path: "../Escape.java", content: "x" }], updatedAt: view.updatedAt }, "PUT")).status, 400);
    assert.equal((await personal({ files: [{ path: "Main.java", content: "x" }, { path: "src/Main.java", content: "x" }], updatedAt: view.updatedAt }, "PUT")).status, 400);
    const ownFiles = [{ path: "app/Main.java", content: 'package app; public class Main { public static void main(String[] args) { System.out.println(new Own().name()); } }' },
      { path: "app/Own.java", content: 'package app; public class Own { public String name() { return "Personal OOP"; } }' }];
    const beforeSave = view.updatedAt;
    response = await personal({ files: ownFiles, updatedAt: view.updatedAt }, "PUT");
    assert.equal(response.status, 200, await response.clone().text()); view = await response.json();
    assert.equal((await personal({ files: personalFiles, updatedAt: beforeSave }, "PUT")).status, 409);
    const executed = await call("/api/execute", { method: "POST", headers: { cookie: cookies[1] }, body: JSON.stringify({ files: ownFiles }) });
    const result = await executed.json(); assert.equal(result.success, true); assert.equal(result.output, "Personal OOP\n");
    const afterRun = await (await request("/progress")).json();
    assert.deepEqual(afterRun.stepStates, passed); assert.equal(afterRun.percent, 50);
    assert.deepEqual(afterRun.performanceProjectFiles, ownFiles);
    assert.deepEqual(afterRun.projectFiles, prepared.projectFiles);
    assert.equal((await call(`${base}/performance-task`, { method: "PUT", headers: { cookie: cookies[1] }, body: JSON.stringify({ variant: "own", files: personalFiles, status: "pass", updatedAt: beforeSave }) })).status, 409, "a stale tab cannot replace the submission");
    const submitted = await call(`${base}/performance-task`, { method: "PUT", headers: { cookie: cookies[1] }, body: JSON.stringify({ variant: "own", files: ownFiles, status: "pass" }) });
    assert.equal(submitted.status, 200);
    response = await personal({ files: [{ path: "Main.java", content: "later personal edit" }], updatedAt: (await submitted.json()).updatedAt }, "PUT");
    assert.equal(response.status, 200); view = await response.json();
    assert.deepEqual(view.performanceTask.own.files, ownFiles, "editing a draft never changes an earlier submission");
    view = await (await personal()).json();
    assert.equal(view.performanceProjectFiles.find((file) => file.path === "Main.java").content, "later personal edit", "reopening preserves edits");
    const prior = await admin.from("module_progress").select("project_files,performance_task").eq("classroom_id", classroomId).eq("student_id", users[1].id).eq("module_id", previous).single();
    assert.deepEqual(prior.data.project_files, moduleFiles); assert.deepEqual(prior.data.performance_task.own, snapshot);
    // Next week's two projects inherit only their corresponding previous track.
    const next = { ...fixture, id: "next-week", previousModuleId: fixture.id }; await upload(next);
    const nextModule = await prepare(first.id, cookies[1], next.id);
    assert.equal(nextModule.projectFiles.find((file) => file.path.endsWith("Main.java")).content, "previous module Main");
    await admin.from("module_progress").update({ step_states: passed }).eq("classroom_id", classroomId).eq("module_id", next.id).eq("student_id", users[1].id);
    response = await request("/progress/performance-project", {}, cookies[1], next.id);
    assert.equal(response.status, 200); view = await response.json();
    assert.equal(view.performanceProjectFiles.find((file) => file.path === "Main.java").content, "later personal edit");
    // Same module id in a different class must never find this student's prior project.
    const otherClass = await admin.from("classrooms").insert({ name: "Other weekly class", join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id }).select("id").single();
    assert.equal(otherClass.error, null);
    try {
      await admin.from("classroom_members").insert({ classroom_id: otherClass.data.id, user_id: users[1].id });
      await admin.from("course_modules").insert({ classroom_id: otherClass.data.id, module_id: fixture.id, content: { ...fixture, previousModuleId: previous }, created_by: users[0].id });
      await admin.from("module_progress").insert({ classroom_id: otherClass.data.id, student_id: users[1].id, module_id: fixture.id, step_states: passed });
      response = await call(`/api/classrooms/${otherClass.data.id}/modules/${fixture.id}/progress/performance-project`, { method: "POST", headers: { cookie: cookies[1] } });
      assert.equal(response.status, 200); view = await response.json();
      assert.ok(!JSON.stringify(view.performanceProjectFiles).includes("previous personal"));
    } finally { await admin.from("classrooms").delete().eq("id", otherClass.data.id); }
  });
});


test("module activities: offline ignores online runner address and refuses browser progress", needsLocal, async () => {
  await withClass(async ({ call, request, cookies, prepare }) => {
    process.env.JAVA_RUNNER_URL = "https://java.example.test/";
    try {
      const response = await call("/api/java-runner", { headers: { cookie: cookies[1] } });
      assert.deepEqual(await response.json(), { mode: "local" });
      const progress = await prepare();
      assert.equal((await request("/progress/browser-result", { stepId: first.id, updatedAt: progress.updatedAt, success: true, output: first.expectedOutput })).status, 403);
    } finally { delete process.env.JAVA_RUNNER_URL; }
  });
});
