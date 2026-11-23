import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { getWording, onlyWordingChanged, setWording, wordingFields } from "../backend/src/module-wording.ts";

const fixture = courseModule.parse(JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url))));
const step = (module) => module.lessons[0].blocks.find((block) => block.type === "step");
const edit = (change) => { const copy = structuredClone(fixture); change(copy); return copy; };

test("module editor: wording changes pass and everything else is refused", () => {
  assert.equal(onlyWordingChanged(fixture, fixture), true);
  for (const field of wordingFields(fixture)) assert.equal(onlyWordingChanged(fixture, setWording(fixture, field.path, "New wording")), true, field.label);
  const refused = {
    "step id": (m) => { step(m).id = "renamed"; },
    "task id": (m) => { step(m).activity = { ...step(m).activity, id: "new-id" }; },
    "sample code": (m) => { step(m).files[0].content += "\n// changed"; },
    "expected output": (m) => { step(m).expectedOutput += "x"; },
    "liplet points": (m) => { m.lessons[0].exitSlip.questions[0].points += 1; },
    "step part": (m) => { step(m).part = "Another part"; },
    "removed step": (m) => { m.lessons[0].blocks.pop(); },
    "week": (m) => { m.week += 1; },
    "rubric points": (m) => { m.performanceTask.rubric[0].points += 1; },
    "checklist item added": (m) => { m.performanceTask.checklist.push("Extra"); },
  };
  for (const [name, change] of Object.entries(refused)) assert.equal(onlyWordingChanged(fixture, edit(change)), false, name);
});

test("module editor: every wording field in every week file is real text the editor can change", () => {
  const files = readdirSync(new URL("../docs/modules", import.meta.url), { recursive: true }).filter((path) => path.endsWith(".codeshare.json"));
  assert.ok(files.length > 5);
  for (const path of files) {
    const week = courseModule.parse(JSON.parse(readFileSync(new URL(`../docs/modules/${path}`, import.meta.url))));
    const fields = wordingFields(week);
    assert.ok(fields.some((field) => field.label.endsWith("Your task")) || !week.lessons.some((lesson) => lesson.blocks.some((block) => block.activity)), path);
    for (const field of fields) assert.equal(typeof getWording(week, field.path), "string", `${path} ${field.path.join(".")}`);
    assert.equal(onlyWordingChanged(week, fields.reduce((copy, field) => setWording(copy, field.path, `${getWording(copy, field.path)} edited`), week)), true, path);
  }
});

test("module editor screen: save warning names classes, keeps student work and reminds about PDF and Word; preview hides the answer key", async () => {
  const { require: tsxRequire } = await import("tsx/cjs/api");
  const { saveWarning, studentPreview } = tsxRequire("../app/ModuleEditor.tsx", import.meta.url);
  const warning = saveWarning({ subject: "java", classNames: ["ICT 12-A", "ICT 12-B"] });
  assert.match(warning, /every class in Java: ICT 12-A, ICT 12-B/);
  assert.match(warning, /Students' work, completions and submissions are not changed/);
  assert.match(warning, /printed PDF and Word lesson plan are not updated/);
  const withAnswer = edit((m) => { step(m).activity = { ...step(m).activity, id: "task-a", solution: { lines: "Main.java line 3", note: "why" } }; });
  assert.equal(step(studentPreview(withAnswer)).activity.solution, undefined);
  assert.equal(step(withAnswer).activity.solution.lines, "Main.java line 3", "the draft itself keeps the answer");
});

let local;
try {
  const output = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
} catch { /* Tests report the unavailable local prerequisite. */ }
const needsLocal = { skip: !local?.API_URL && "local Supabase is not running" };

test("module editor: real wording save, refusals, earlier versions and restore leave student work untouched", needsLocal, async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "module-editor-local-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [], classes = [], password = randomUUID();
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const ok = async (response, status = 200) => { assert.equal(response.status, status, await response.clone().text()); return response.json(); };
  try {
    for (const role of ["teacher", "student", "teacher"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `editor-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Editor ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const [teacher, student, other] = await Promise.all(users.map(async (user) => (await call("/api/auth/login", null, "POST", { email: user.email, password })).headers.get("set-cookie").split(";")[0]));
    for (const name of ["Editor A", "Editor B"]) classes.push((await ok(await call("/api/classes", teacher, "POST", { name, subject: "Java" }), 201)).id);
    const [a, b] = classes;
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: b, user_id: users[1].id })).error, null);
    const base = (id) => `/api/classrooms/${id}/modules/${fixture.id}`;
    await ok(await call(`/api/classrooms/${a}/modules`, teacher, "POST", fixture), 201);
    await ok(await call(`${base(b)}/progress`, student));
    const work = { step_states: { [step(fixture).id]: "pass" }, project_files: [{ path: "Main.java", content: "student draft" }], performance_task: { own: { files: [{ path: "Main.java", content: "submitted" }], status: "pass" } } };
    assert.equal((await admin.from("module_progress").update(work).eq("classroom_id", b).eq("student_id", users[1].id)).error, null);
    const progressRow = async () => (await admin.from("module_progress").select("step_states,project_files,performance_task,activity_projects").eq("classroom_id", b).eq("student_id", users[1].id).single()).data;
    const workBefore = await progressRow();

    for (const cookie of [student, other]) assert.ok([403, 404].includes((await call(`${base(a)}/editor`, cookie)).status));
    const opened = await ok(await call(`${base(a)}/editor`, teacher));
    assert.deepEqual(opened.classNames, ["Editor A", "Editor B"]);
    assert.deepEqual(opened.versions, []);
    assert.deepEqual(opened.content, fixture, "the editor and Download module file give the exact saved module");

    const reworded = edit((m) => { step(m).instruction = "Clearer instruction"; m.title = "Reworded title"; });
    for (const cookie of [student, other]) assert.ok([403, 404].includes((await call(`${base(a)}/wording`, cookie, "PUT", { content: reworded, expectedUpdatedAt: opened.updatedAt })).status));
    assert.equal((await call(`${base(a)}/wording`, teacher, "PUT", { content: edit((m) => { step(m).expectedOutput += "x"; }), expectedUpdatedAt: opened.updatedAt })).status, 400);
    assert.equal((await call(`${base(a)}/wording`, teacher, "PUT", { content: edit((m) => { step(m).id = "renamed"; }), expectedUpdatedAt: opened.updatedAt })).status, 400);
    const saved = await ok(await call(`${base(a)}/wording`, teacher, "PUT", { content: reworded, expectedUpdatedAt: opened.updatedAt }));
    assert.notEqual(saved.updatedAt, opened.updatedAt);
    assert.equal((await call(`${base(a)}/wording`, teacher, "PUT", { content: reworded, expectedUpdatedAt: opened.updatedAt })).status, 409, "an out-of-date copy is refused");

    const read = await ok(await call(base(b), student));
    assert.equal(read.title, "Reworded title", "the other class in the subject shows the new wording");
    assert.deepEqual(await progressRow(), workBefore, "student work, completions and submissions are unchanged");

    const afterEdit = await ok(await call(`${base(a)}/editor`, teacher));
    assert.equal(afterEdit.versions.length, 1);
    assert.equal(afterEdit.versions[0].replacedBy, "edit");
    assert.equal(afterEdit.versions[0].title, fixture.title);
    await ok(await call(`/api/classrooms/${a}/modules`, teacher, "POST", { ...reworded, title: "Uploaded again" }), 201);
    const afterUpload = await ok(await call(`${base(a)}/editor`, teacher));
    assert.deepEqual(afterUpload.versions.map((v) => v.replacedBy), ["upload", "edit"], "an upload keeps the old version too");

    const original = afterUpload.versions[1].id;
    assert.equal((await call(`${base(a)}/versions/${original}/restore`, teacher, "POST", { expectedUpdatedAt: opened.updatedAt })).status, 409);
    assert.ok([403, 404].includes((await call(`${base(a)}/versions/${original}/restore`, other, "POST", { expectedUpdatedAt: afterUpload.updatedAt })).status));
    await ok(await call(`${base(a)}/versions/${original}/restore`, teacher, "POST", { expectedUpdatedAt: afterUpload.updatedAt }));
    const restored = await ok(await call(`${base(a)}/editor`, teacher));
    assert.deepEqual(restored.content, fixture, "restore brings back the original module");
    assert.deepEqual(restored.versions.map((v) => v.replacedBy), ["restore", "upload", "edit"]);
    assert.equal(restored.versions[0].title, "Uploaded again", "the replaced version is kept, so a restore can be undone");
    assert.deepEqual(await progressRow(), workBefore);
  } finally {
    await admin.from("subject_module_versions").delete().in("teacher_id", users.map((user) => user.id));
    for (const id of classes) assert.equal((await admin.from("classrooms").delete().eq("id", id)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});

test("module versions migration: only the server can read earlier versions", needsLocal, () => {
  const sql = (query) => execFileSync("docker", ["exec", "-i", "supabase_db_javashare", "psql", "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"], { input: query, encoding: "utf8" }).trim();
  for (const role of ["anon", "authenticated"]) assert.equal(sql(`select has_table_privilege('${role}','subject_module_versions','select');`), "f");
  assert.equal(sql("select relrowsecurity from pg_class where oid='public.subject_module_versions'::regclass;"), "t");
});
