import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { activityStateId } from "../backend/src/module-activities.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url)));
let local;
try {
  const output = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
} catch { /* Tests report the unavailable local prerequisite. */ }
const needsLocal = { skip: !local?.API_URL && "local Supabase is not running" };

test("subject modules: one subject per class, one upload per teacher/subject, separate student work", needsLocal, async (t) => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", JWT_SECRET: "subject-sharing-local-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [], classes = [];
  const password = randomUUID();
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const ok = async (response, status = 200) => { assert.equal(response.status, status, await response.clone().text()); return response.json(); };
  const modulePath = (id, tail = "") => `/api/classrooms/${id}/modules${tail}`;
  let teacherCookie, studentCookie, otherCookie, a, b, mvc, other, legacy;
  const net = { ...fixture, id: fixture.id, course: "dotnet-2", title: "MVC subject module" };
  try {
    for (const role of ["teacher", "student", "teacher"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `subject-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Subject ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    [teacherCookie, studentCookie, otherCookie] = await Promise.all(users.map(async (user) => {
      const response = await call("/api/auth/login", null, "POST", { email: user.email, password });
      assert.equal(response.status, 200); return response.headers.get("set-cookie").split(";")[0];
    }));
    const create = async (subject, cookie = teacherCookie) => {
      const row = await ok(await call("/api/classes", cookie, "POST", { name: `Subject ${subject}`, subject }), 201);
      classes.push(row.id); return row.id;
    };
    await t.test("class creation requires exactly Java or Net MVC and an assigned class cannot switch subjects", async () => {
      for (const subject of [undefined, "Java and Net MVC", "Other"]) assert.equal((await call("/api/classes", teacherCookie, "POST", { name: "Invalid subject", subject })).status, 400);
      a = await create("Java"); b = await create("Java"); mvc = await create("Net MVC"); other = await create("Java", otherCookie);
      assert.equal((await call(`/api/classrooms/${a}/module-subject`, teacherCookie, "PATCH", { subject: "net-mvc" })).status, 409);
      const { data } = await admin.from("classrooms").select("module_subject").eq("id", a).single();
      assert.equal(data.module_subject, "java");
      assert.equal((await admin.from("classroom_members").insert([a, b, mvc].map((id) => ({ classroom_id: id, user_id: users[1].id })))).error, null);
    });
    await t.test("upload once reaches same-subject classes, excludes the other subject and another teacher, and includes later classes", async () => {
      await ok(await call(modulePath(a), teacherCookie, "POST", fixture), 201);
      const list = await ok(await call(modulePath(b), studentCookie));
      assert.deepEqual(list.map((row) => row.moduleId), [fixture.id]);
      assert.deepEqual(await ok(await call(modulePath(mvc), studentCookie)), []);
      assert.deepEqual(await ok(await call(modulePath(other), otherCookie)), []);
      const later = await create("Java");
      assert.equal((await ok(await call(modulePath(later), teacherCookie)))[0].title, fixture.title);
      assert.equal((await call(modulePath(a), teacherCookie, "POST", net)).status, 400);
      assert.equal((await call(modulePath(mvc), teacherCookie, "POST", fixture)).status, 400);
      await ok(await call(modulePath(mvc), teacherCookie, "POST", net), 201);
      assert.equal((await ok(await call(modulePath(mvc, `/${net.id}`), teacherCookie))).title, net.title);
    });
    await t.test("members read only their classes; students and another teacher cannot choose subjects, share, upload or delete", async () => {
      assert.equal((await call(modulePath(other), studentCookie)).status, 403);
      for (const cookie of [studentCookie, otherCookie]) {
        assert.equal((await call(`/api/classrooms/${a}/module-sharing`, cookie)).status, 403);
        assert.equal((await call(`/api/classrooms/${a}/module-subject`, cookie, "PATCH", { subject: "java" })).status, 403);
        assert.equal((await call(modulePath(a, `/${fixture.id}/share`), cookie, "POST", {})).status, 403);
        assert.equal((await call(modulePath(a), cookie, "POST", fixture)).status, 403);
        assert.equal((await call(modulePath(a, `/${fixture.id}`), cookie, "DELETE")).status, 403);
      }
    });
    await t.test("shared corrections refresh list, reader, student summary and dashboard without mixing progress, drafts or submissions", async () => {
      for (const id of [a, b]) await ok(await call(modulePath(id, `/${fixture.id}/progress`), studentCookie));
      const work = { step_states: { [fixture.lessons[0].blocks[0].id]: "pass" }, project_files: [{ path: "Main.java", content: "class A draft" }], performance_task: { own: { files: [{ path: "Main.java", content: "class A snapshot" }], status: "pass" }, project: { files: [{ path: "Main.java", content: "class A personal" }] } }, activity_projects: { beforeSampleFiles: [{ path: "Main.java", content: "backup" }] } };
      assert.equal((await admin.from("module_progress").update(work).eq("classroom_id", a).eq("student_id", users[1].id)).error, null);
      const correction = { ...fixture, title: "Shared Java correction" };
      await ok(await call(modulePath(b), teacherCookie, "POST", correction), 201);
      for (const id of [a, b]) {
        assert.equal((await ok(await call(modulePath(id), studentCookie)))[0].title, correction.title);
        assert.equal((await ok(await call(modulePath(id, `/${fixture.id}`), teacherCookie))).title, correction.title);
        assert.equal((await ok(await call(modulePath(id, "/summary"), studentCookie)))[0].title, correction.title);
        assert.equal((await ok(await call(`/api/classes/${id}/module-progress`, teacherCookie))).modules[0].title, correction.title);
      }
      const { data } = await admin.from("module_progress").select("step_states,project_files,performance_task,activity_projects").eq("classroom_id", a).eq("student_id", users[1].id).single();
      assert.deepEqual(data, work);
      const inB = await ok(await call(modulePath(b, `/${fixture.id}/progress`), studentCookie));
      assert.deepEqual(inB.stepStates, {}); assert.deepEqual(inB.projectFiles, []); assert.deepEqual(inB.performanceTask, {});
      assert.equal((await ok(await call(modulePath(mvc), teacherCookie)))[0].title, net.title);
    });
    await t.test("shared-only prerequisites unlock per class and never reuse another class's completion", async () => {
      const before = { ...fixture, id: "shared-before", week: 1 };
      const after = { ...fixture, id: "shared-after", week: 2, previousModuleId: before.id };
      try {
        for (const content of [before, after]) await ok(await call(modulePath(a), teacherCookie, "POST", content), 201);
        const { count, error } = await admin.from("course_modules").select("id", { count: "exact", head: true }).in("classroom_id", [a, b]);
        assert.equal(error, null); assert.equal(count, 0, "both classes use only the shared library");
        const list = await ok(await call(modulePath(b), studentCookie));
        assert.equal(list.find((row) => row.moduleId === after.id).moduleAccess.kind, "prerequisite");
        assert.equal(list.find((row) => row.moduleId === after.id).moduleAccess.moduleId, before.id);
        assert.equal((await call(modulePath(a, `/${after.id}`), studentCookie)).status, 403);
        assert.equal((await call(modulePath(b, `/${after.id}/progress/activity`), studentCookie, "POST", { stepId: after.lessons[0].blocks[0].id })).status, 403);
        const passes = Object.fromEntries(before.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step").map((step) => [activityStateId(step), "pass"]));
        assert.equal((await admin.from("module_progress").insert({ classroom_id: a, student_id: users[1].id, module_id: before.id, step_states: passes })).error, null);
        assert.equal((await call(modulePath(a, `/${after.id}`), studentCookie)).status, 200);
        assert.equal((await call(modulePath(b, `/${after.id}`), studentCookie)).status, 403);
        assert.equal((await ok(await call(modulePath(a), studentCookie))).find((row) => row.moduleId === after.id).moduleAccess, undefined);
      } finally {
        for (const content of [after, before]) await ok(await call(modulePath(a, `/${content.id}`), teacherCookie, "DELETE"));
        assert.equal((await admin.from("module_progress").delete().eq("classroom_id", a).eq("student_id", users[1].id).in("module_id", [before.id, after.id])).error, null);
      }
    });
    await t.test("old uploads stay readable before subject selection and remain backed up; conflicting sharing needs the selected current version", async () => {
      const { data, error } = await admin.from("classrooms").insert({ name: "Legacy uploads", subject: "Old class label", teacher_id: users[0].id, join_code: randomUUID().slice(0, 8).toUpperCase() }).select("id").single();
      assert.equal(error, null); legacy = data.id; classes.push(legacy);
      assert.equal((await admin.from("classroom_members").insert({ classroom_id: legacy, user_id: users[0].id })).error, null);
      const saved = [{ classroom_id: legacy, module_id: fixture.id, content: fixture, created_by: users[0].id }, { classroom_id: legacy, module_id: "legacy-mvc", content: { ...net, id: "legacy-mvc" }, created_by: users[0].id }];
      assert.equal((await admin.from("course_modules").insert(saved)).error, null);
      assert.equal((await ok(await call(modulePath(legacy), teacherCookie))).length, 2);
      assert.equal((await call(modulePath(legacy), teacherCookie, "POST", fixture)).status, 400);
      assert.equal((await call(modulePath(legacy, `/${fixture.id}/share`), teacherCookie, "POST", {})).status, 400);
      await ok(await call(`/api/classrooms/${legacy}/module-subject`, teacherCookie, "PATCH", { subject: "java" }));
      assert.equal((await ok(await call(modulePath(legacy), teacherCookie))).length, 1, "only shared Java content is served after selection");
      const bootstrap = await ok(await call("/api/bootstrap", teacherCookie));
      assert.equal(bootstrap.classrooms.find((row) => row.id === legacy).subject, "Java", "the class list displays its selected subject");
      const { data: originalLabel } = await admin.from("classrooms").select("subject").eq("id", legacy).single();
      assert.equal(originalLabel.subject, "Old class label", "the original stored label is preserved");
      assert.equal((await call(modulePath(legacy, "/legacy-mvc"), teacherCookie)).status, 404);
      const sharing = await ok(await call(`/api/classrooms/${legacy}/module-sharing`, teacherCookie));
      const javaCopy = sharing.savedUploads.find((row) => row.moduleId === fixture.id);
      assert.equal(javaCopy.sameContent, false); assert.equal(javaCopy.matchesSubject, true);
      assert.equal(sharing.savedUploads.find((row) => row.moduleId === "legacy-mvc").matchesSubject, false);
      assert.equal((await call(modulePath(legacy, `/${fixture.id}/share`), teacherCookie, "POST", {})).status, 409);
      assert.equal((await call(modulePath(legacy, "/legacy-mvc/share"), teacherCookie, "POST", {})).status, 400);
      await ok(await call(modulePath(legacy, `/${fixture.id}/share`), teacherCookie, "POST", { expectedUpdatedAt: javaCopy.sharedUpdatedAt }));
      assert.equal((await call(modulePath(legacy, `/${fixture.id}/share`), teacherCookie, "POST", { expectedUpdatedAt: javaCopy.sharedUpdatedAt })).status, 409, "stale confirmation cannot overwrite a newer shared version");
      assert.equal((await ok(await call(modulePath(b), teacherCookie)))[0].title, fixture.title);
      const { data: originals } = await admin.from("course_modules").select("module_id,content").eq("classroom_id", legacy).order("module_id");
      assert.equal(originals.length, 2); assert.deepEqual(originals.find((row) => row.module_id === fixture.id).content, fixture);
      assert.equal((await call(modulePath(legacy, "/missing/share"), teacherCookie, "POST", {})).status, 404);
      assert.equal((await admin.from("course_modules").insert({ classroom_id: legacy, module_id: "invalid-copy", content: {}, created_by: users[0].id })).error, null);
      assert.equal((await call(modulePath(legacy, "/invalid-copy/share"), teacherCookie, "POST", {})).status, 400);
      assert.equal((await admin.from("course_modules").delete().eq("classroom_id", legacy).eq("module_id", "invalid-copy")).error, null);
      // A nonconflicting saved upload can be shared without replacing another version.
      const extra = { ...fixture, id: "extra-java", title: "Extra Java" };
      assert.equal((await admin.from("course_modules").insert({ classroom_id: legacy, module_id: extra.id, content: extra, created_by: users[0].id })).error, null);
      await ok(await call(modulePath(legacy, "/extra-java/share"), teacherCookie, "POST", {}));
      assert.equal((await ok(await call(modulePath(a), teacherCookie))).length, 2);
    });
    await t.test("shared deletion removes access and weekly picks across that subject while preserving backups, student work and the other subject", async () => {
      for (const id of [a, b, mvc]) await ok(await call(`/api/classrooms/${id}/active-module`, teacherCookie, "PATCH", { moduleId: fixture.id }));
      await ok(await call(modulePath(a, `/${fixture.id}`), teacherCookie, "DELETE"));
      assert.equal((await call(modulePath(b, `/${fixture.id}`), studentCookie)).status, 404);
      const { data: picks } = await admin.from("classrooms").select("id,active_module_id").in("id", [a, b, mvc]);
      assert.equal(picks.find((row) => row.id === a).active_module_id, null); assert.equal(picks.find((row) => row.id === b).active_module_id, null); assert.equal(picks.find((row) => row.id === mvc).active_module_id, fixture.id);
      const { data: work } = await admin.from("module_progress").select("project_files,performance_task").eq("classroom_id", a).eq("student_id", users[1].id).single();
      assert.equal(work.project_files[0].content, "class A draft"); assert.equal(work.performance_task.own.files[0].content, "class A snapshot");
      const { count } = await admin.from("course_modules").select("id", { count: "exact", head: true }).eq("classroom_id", legacy);
      assert.equal(count, 3);
      assert.equal((await ok(await call(modulePath(mvc), teacherCookie)))[0].title, net.title);
    });
  } finally {
    for (const id of classes) assert.equal((await admin.from("classrooms").delete().eq("id", id)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});

test("subject library migration: preserves old uploads and student work, repeats safely, and restricts subjects and direct access", needsLocal, () => {
  const db = `subject_library_${randomUUID().replaceAll("-", "")}`;
  const sql = (query, database = db) => execFileSync("docker", ["exec", "-i", "supabase_db_javashare", "psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-qAt"], { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  sql(`create database ${db};`, "postgres");
  try {
    sql(`create table profiles(id uuid primary key); create table classrooms(id int primary key, subject text); create table course_modules(content jsonb); create table module_progress(work jsonb);
      create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
      insert into classrooms values(1, 'Original class subject'); insert into course_modules values('{"id":"original"}'); insert into module_progress values('{"draft":"keep","submission":"keep","pass":true}');`);
    const before = sql("select json_build_array((select json_agg(t) from classrooms t),(select json_agg(t) from course_modules t),(select json_agg(t) from module_progress t));");
    const migration = readFileSync(new URL("../supabase/migrations/20261022000100_subject_module_library.sql", import.meta.url), "utf8");
    sql(migration); sql(migration);
    assert.equal(sql("select json_build_array((select json_agg(t) from (select id,subject from classrooms) t),(select json_agg(t) from course_modules t),(select json_agg(t) from module_progress t));"), before);
    assert.equal(sql("select module_subject is null from classrooms;"), "t");
    assert.throws(() => sql("update classrooms set module_subject='both';"), /check constraint/);
    sql("insert into profiles values('00000000-0000-0000-0000-000000000001');");
    assert.throws(() => sql(`insert into subject_modules(teacher_id,subject,module_id,content) values('00000000-0000-0000-0000-000000000001','java','x','{"id":"x","course":"dotnet-2"}');`), /check constraint/);
    for (const role of ["anon", "authenticated"]) assert.equal(sql(`select has_table_privilege('${role}','subject_modules','select');`), "f");
    assert.equal(sql("select relrowsecurity from pg_class where oid='subject_modules'::regclass;"), "t");
  } finally { sql(`drop database ${db};`, "postgres"); }
});
