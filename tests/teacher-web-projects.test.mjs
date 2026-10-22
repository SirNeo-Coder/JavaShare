import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { buildTeacherPreview } from "../app/teacherWebPreview.ts";
import { buildPreview, originOf } from "../app/webPreview.ts";

function localSupabase() {
  try {
    const output = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
  } catch { return null; }
}
const local = localSupabase();
const needsLocal = { skip: !local?.API_URL && "local Supabase is not running" };

async function withClass(action) {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "teacher-web-project-test-secret" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [], classes = [], cookies = [];
  const password = randomUUID();
  const call = (path, init = {}) => handleApi(new Request(`http://127.0.0.1:3000${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers } }));
  try {
    for (const role of ["teacher", "teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@teacher-web.example.test`, password, email_confirm: true, user_metadata: { name: `Web ${role}` } });
      assert.equal(error, null); users.push(data.user);
      if (role === "teacher") assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", { method: "POST", body: JSON.stringify({ email: data.user.email, password }) });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    for (const label of ["A", "B"]) {
      const response = await call("/api/classes", { method: "POST", headers: { cookie: cookies[0] }, body: JSON.stringify({ name: `Web class ${label}`, subject: "Net MVC" }) });
      assert.equal(response.status, 201); classes.push(await response.json());
    }
    for (const [classIndex, userIndex] of [[0, 2], [0, 3], [1, 2]]) {
      assert.equal((await call("/api/classes/join", { method: "POST", headers: { cookie: cookies[userIndex] }, body: JSON.stringify({ joinCode: classes[classIndex].joinCode }) })).status, 200);
    }
    const request = (classId, studentId, suffix = "", cookie = cookies[0], method = "GET") => call(`/api/classes/${classId}/students/${studentId}/web-projects${suffix}`, { method, headers: cookie ? { cookie } : {} });
    const createProject = async (classId, studentIndex, title) => {
      const response = await call(`/api/classes/${classId}/web-projects`, { method: "POST", headers: { cookie: cookies[studentIndex] }, body: JSON.stringify({ title }) });
      assert.equal(response.status, 201); return response.json();
    };
    await action({ admin, call, users, classes, cookies, request, createProject });
  } finally {
    for (const classroom of classes) assert.equal((await admin.from("classrooms").delete().eq("id", classroom.id)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
}

test("teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand", needsLocal, async () => {
  await withClass(async ({ admin, users, classes: [a, b], request, createProject }) => {
    const first = await createProject(a.id, 2, "Student A portfolio");
    const second = await createProject(a.id, 2, "Student A game");
    const otherStudent = await createProject(a.id, 3, "Student B site");
    const otherClass = await createProject(b.id, 2, "Class B site");
    const list = await (await request(a.id, users[2].id)).json();
    assert.deepEqual(new Set(list.projects.map((p) => p.id)), new Set([first.project.id, second.project.id]));
    assert.ok(list.projects.every((p) => !p.files && !p.content), "list must not download all project code");
    const detail = await request(a.id, users[2].id, `/${first.project.id}`);
    assert.equal(detail.status, 200);
    const fetched = await detail.json();
    assert.equal(fetched.project.title, first.project.title);
    assert.deepEqual(fetched.files.map((f) => f.path), ["index.html", "script.js", "style.css"]);
    assert.equal(fetched.files.find((f) => f.path === "index.html").content, first.files.find((f) => f.path === "index.html").content);
    assert.equal((await request(a.id, users[2].id, `/${otherStudent.project.id}`)).status, 404);
    assert.equal((await request(a.id, users[2].id, `/${otherClass.project.id}`)).status, 404);
    assert.equal((await request(b.id, users[2].id, `/${first.project.id}`)).status, 404);
    const { data: javaProject, error } = await admin.from("projects").select("id").eq("team_id", (await admin.from("teams").select("id").eq("classroom_id", a.id).eq("owner_id", users[2].id).single()).data.id).eq("language", "java").single();
    assert.equal(error, null);
    assert.equal((await request(a.id, users[2].id, `/${javaProject.id}`)).status, 404);
    // Even a web-language activity project is outside the personal-project list.
    const { data: activity, error: activityError } = await admin.from("activities").insert({ classroom_id: a.id, created_by: users[0].id, title: "Activity", description: "", starter_code: "", mode: "individual" }).select("id").single();
    assert.equal(activityError, null);
    assert.equal((await admin.from("projects").update({ activity_id: activity.id }).eq("id", second.project.id)).error, null);
    assert.deepEqual((await (await request(a.id, users[2].id)).json()).projects.map((p) => p.id), [first.project.id]);
    assert.equal((await request(a.id, users[2].id, `/${second.project.id}`)).status, 404);
  });
});

test("teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused", needsLocal, async () => {
  await withClass(async ({ admin, users, classes: [a, b], cookies, request, createProject }) => {
    const created = await createProject(a.id, 2, "Private student site");
    // Being a class member does not make a different teacher the class's owner.
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: a.id, user_id: users[1].id })).error, null);
    for (const suffix of ["", `/${created.project.id}`]) {
      assert.equal((await request(a.id, users[2].id, suffix, null)).status, 401);
      for (const cookie of [cookies[1], cookies[2], cookies[3]]) assert.equal((await request(a.id, users[2].id, suffix, cookie)).status, 403);
      assert.equal((await request(a.id, randomUUID(), suffix)).status, 404);
      assert.equal((await request(b.id, users[3].id, suffix)).status, 404);
      assert.equal((await request(a.id, users[0].id, suffix)).status, 404);
    }
    assert.equal((await request(a.id, users[2].id, `/${randomUUID()}`)).status, 404);
    assert.equal((await request(a.id, "invalid")).status, 400);
    assert.equal((await request(a.id, users[2].id, "/invalid")).status, 400);
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) assert.equal((await request(a.id, users[2].id, `/${created.project.id}`, cookies[0], method)).status, 404);
    assert.equal((await admin.from("classroom_members").delete().eq("classroom_id", a.id).eq("user_id", users[2].id)).error, null);
    assert.equal((await request(a.id, users[2].id)).status, 404, "a lingering personal team does not replace current membership");
    assert.equal((await request(a.id, users[2].id, `/${created.project.id}`)).status, 404);
  });
});

test("teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh", needsLocal, async () => {
  await withClass(async ({ admin, call, users, classes: [a], cookies, request, createProject }) => {
    assert.deepEqual(await (await request(a.id, users[2].id)).json(), { projects: [] });
    const created = await createProject(a.id, 2, "Saved page");
    const file = created.files.find((item) => item.path === "index.html");
    const before = await admin.from("code_files").select("*").eq("project_id", created.project.id).order("id");
    assert.equal(before.error, null);
    await request(a.id, users[2].id); await request(a.id, users[2].id, `/${created.project.id}`); await request(a.id, users[2].id, `/${created.project.id}`);
    assert.deepEqual((await admin.from("code_files").select("*").eq("project_id", created.project.id).order("id")).data, before.data);
    assert.equal((await call(`/api/files/${file.id}`, { method: "PUT", headers: { cookie: cookies[2] }, body: JSON.stringify({ version: file.version, content: "<h1>Saved correction</h1>" }) })).status, 200);
    const refreshed = await (await request(a.id, users[2].id, `/${created.project.id}`)).json();
    assert.equal(refreshed.files.find((item) => item.id === file.id).content, "<h1>Saved correction</h1>");
    assert.equal(refreshed.files.find((item) => item.id === file.id).version, file.version + 1);
    assert.equal((await admin.from("code_files").delete().eq("project_id", created.project.id)).error, null);
    assert.deepEqual((await (await request(a.id, users[2].id, `/${created.project.id}`)).json()).files, []);
    assert.equal((await admin.from("projects").delete().eq("id", created.project.id)).error, null);
    assert.equal((await request(a.id, users[2].id, `/${created.project.id}`)).status, 404);
    assert.equal((await admin.from("teams").delete().eq("classroom_id", a.id).eq("owner_id", users[2].id)).error, null);
    assert.deepEqual(await (await request(a.id, users[2].id)).json(), { projects: [] });
    assert.equal((await request(a.id, users[2].id, `/${created.project.id}`)).status, 404);
  });
});

test("teacher web preview: blocks network resources before student code while preserving the doctype and console line map", () => {
  const files = [
    { path: "index.html", content: '<!DOCTYPE html>\n<head>\n<link rel="stylesheet" href="style.css">\n</head>\n<body>\n<script src="script.js"></script>\n<img src="https://example.test/tracker.png">\n</body>' },
    { path: "style.css", content: "body { color: red; }" },
    { path: "script.js", content: 'console.log("hello");\nmissing();' },
  ];
  const teacher = buildTeacherPreview(files), student = buildPreview(files);
  assert.match(teacher.html, /^<!DOCTYPE html><meta http-equiv="Content-Security-Policy"/);
  assert.match(teacher.html, /default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'/);
  assert.match(teacher.html, /base-uri 'none'; form-action 'none'/);
  assert.ok(teacher.html.indexOf('Content-Security-Policy') < teacher.html.indexOf('codeshare:'));
  assert.deepEqual(teacher.lineMap, student.lineMap);
  const errorLine = teacher.html.slice(0, teacher.html.indexOf("missing();")).split("\n").length;
  assert.deepEqual(originOf(teacher, errorLine), { file: "script.js", line: 2 });
  assert.ok(!student.html.includes('Content-Security-Policy'), "student renderer is unchanged by the teacher-only wrapper");
});

test("teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student", () => {
  const preview = buildTeacherPreview([{ path: "index.html", content: "<script>eval(\"1\")</script>" }]);
  assert.match(preview.html, /script-src 'unsafe-inline' 'unsafe-eval'/, "script-src must allow eval, matching the student's unrestricted preview");
});

test("teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning", () => {
  const preview = buildTeacherPreview([{ path: "index.html", content: '<p>Hi</p>\n<script>missing()</script>' }]);
  assert.match(preview.html, /^<meta http-equiv="Content-Security-Policy"/);
  const errorLine = preview.html.slice(0, preview.html.indexOf("missing()")).split("\n").length;
  assert.deepEqual(originOf(preview, errorLine), { file: "index.html", line: 2 });
  assert.deepEqual(buildTeacherPreview([{ path: "style.css", content: "" }]), buildPreview([{ path: "style.css", content: "" }]));
});
