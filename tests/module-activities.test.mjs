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

test("module activities: JSON keeps the printed sample separate from the student's challenge", () => {
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
  assert.equal(activityAccess(content, { [first.id]: "pass", [second.id]: "pass" }).performanceTaskOpen, false, "old worked-example passes cannot complete new challenges");
  const partial = activityAccess(content, { [firstStateId]: "pass", [content.lessons[0].exitSlip.id]: "pass" });
  assert.equal(partial.parts.length, 2);
  assert.equal(partial.parts[1].open, false);
  const done = activityAccess(content, { [firstStateId]: "pass", [secondStateId]: "pass" });
  assert.equal(done.parts[1].open, true);
  assert.equal(done.performanceTaskOpen, false);
  assert.equal(activityAccess(content, { [firstStateId]: "pass", [secondStateId]: "pass", "third-step:activity": "pass" }).performanceTaskOpen, true);
});

test("module activities: matching text cannot pass a failed process; internal whitespace still matters", () => {
  assert.equal(matchesActivityOutput({ success: false, output: "Capacity: 25" }, "Capacity: 25"), false);
  assert.equal(matchesActivityOutput({ success: true, output: "  Capacity: 25\r\n" }, "Capacity: 25\n"), true);
  assert.equal(matchesActivityOutput({ success: true, output: "Capacity:25" }, "Capacity: 25"), false);
});

test("module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038)", () => {
  const files = mergeProjectFiles(fixture.starterFiles, first.activity.files, [{ path: "src/Main.java", content: "student's existing Main" }]);
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
    let response = await run(prepared.projectFiles);
    assert.equal(response.status, 200, await response.clone().text());
    let result = await response.json();
    assert.equal(result.passed, false, "the supplied worked example must not satisfy the different challenge");
    assert.equal(result.progress.percent, 0);
    const solution = prepared.projectFiles.map((file) => file.path === "Jeepney.java" ? { ...file, content: file.content.replace("return 20", "return 25") } : file);
    response = await run(solution);
    assert.equal(response.status, 200, await response.clone().text()); result = await response.json();
    assert.equal(result.passed, true); assert.equal(result.output.trim(), "Capacity: 25");
    assert.equal(result.progress.percent, 25);
    assert.equal(result.progress.stepStates[firstStateId], "pass");
    assert.equal(result.progress.stepStates[fixture.lessons[0].exitSlip.id], undefined);
    view = await (await request()).json();
    assert.equal(view.lessons[1].closed, false);
    assert.equal((await (await request("", undefined, cookies[2])).json()).lessons[1].closed, true);
    const reopened = await prepare(second.id);
    assert.deepEqual(reopened.projectFiles, solution, "opening the next activity preserves the student's evolving project");
    const final = solution.map((file) => file.path.endsWith("Main.java") ? { ...file, content: 'public class Main { public static void main(String[] args) { Vehicle v = new Jeepney("NXA 123"); System.out.println(v.getPlate() + ": " + v.getCapacity()); } }' } : file);
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
    const crash = [{ path: "Main.java", content: 'public class Main { public static void main(String[] args) { System.out.println("Capacity: 25"); throw new IllegalStateException("crash"); } }' }];
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
    content.lessons[0].blocks[0].activity.stdin = "7\n";
    content.lessons[0].blocks[0].activity.expectedOutput = "14";
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
