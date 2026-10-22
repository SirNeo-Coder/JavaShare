import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("completion-only modules: read-only preparation, small summaries and guarded successful checkpoints", { skip: !local?.API_URL && "local Supabase is not running" }, async (t) => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://java.example.test/", JWT_SECRET: "completion-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [], classes = [], cookies = [];
  const password = randomUUID();
  const call = (path, cookie = cookies[1], method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const content = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
  content.sampleFirst = true;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity = { ...(lesson.blocks[0].activity ?? { instruction: "Print a different number", files: lesson.blocks[0].files, expectedOutput: "changed" }), id: `completion-${index}` }; });
  const step = content.lessons[0].blocks[0], next = content.lessons[1].blocks[0], key = activityStateId(step);
  let base, progress, sample, payload;
  try {
    for (const role of ["teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `complete-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Completion ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    for (const subject of ["java", null]) {
      const { data, error } = await admin.from("classrooms").insert({ name: "Disposable completion class", join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id, module_subject: subject }).select("id").single();
      assert.equal(error, null); classes.push(data.id);
    }
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classes[0], user_id: users[1].id })).error, null);
    base = `/api/classrooms/${classes[0]}/modules/${content.id}`;
    assert.equal((await call(`/api/classrooms/${classes[0]}/modules`, cookies[0], "POST", content)).status, 201);
    const saved = async () => (await admin.from("module_progress").select("*").eq("classroom_id", classes[0]).eq("student_id", users[1].id).eq("module_id", content.id).single()).data;

    await t.test("summaries contain only required metadata, keep legacy scope and refuse browser roles", async () => {
      let response = await admin.rpc("codeshare_module_summaries", { p_classroom_id: classes[0] });
      assert.equal(response.error, null); assert.equal(response.data.length, 1);
      assert.deepEqual(response.data[0].content.requiredActivityIds, [key, activityStateId(next)]);
      assert.equal(response.data[0].content.hasPerformanceTask, true);
      assert.doesNotMatch(JSON.stringify(response.data), /public class|expectedOutput|instruction|starterFiles/);
      assert.equal((await admin.from("course_modules").insert({ classroom_id: classes[1], module_id: content.id, content: { ...content, title: "Legacy copy" }, created_by: users[0].id })).error, null);
      response = await admin.rpc("codeshare_module_summaries", { p_classroom_id: classes[1] });
      assert.equal(response.data[0].content.title, "Legacy copy");
      const anon = createClient(local.API_URL, local.ANON_KEY, { auth: { persistSession: false } });
      assert.ok((await anon.rpc("codeshare_module_summaries", { p_classroom_id: classes[0] })).error);
      assert.ok((await anon.rpc("codeshare_complete_module_activity", { p_classroom_id: classes[0], p_student_id: users[1].id, p_module_id: content.id, p_progress_version: new Date().toISOString(), p_module_version: new Date().toISOString(), p_files: [], p_states: {}, p_projects: {} })).error);
      await anon.auth.signInWithPassword({ email: users[1].email, password });
      assert.ok((await anon.rpc("codeshare_module_summaries", { p_classroom_id: classes[0] })).error);
      await anon.auth.signOut();
    });

    await t.test("opening a step prepares local files without saving project code or draft history", async (context) => {
      let selectedReads = 0;
      const fetch = globalThis.fetch;
      context.mock.method(globalThis, "fetch", (input, init) => {
        const url = new URL(typeof input === "string" ? input : input.url ?? input.href);
        if (url.pathname.endsWith("/subject_modules")) {
          assert.ok(url.searchParams.has("module_id"), "never download the whole module library to check access");
          selectedReads++;
        }
        return fetch(input, init);
      });
      const response = await call(`${base}/progress/activity?stepId=${step.id}`);
      assert.equal(response.status, 200); progress = await response.json();
      sample = { files: progress.projectFiles, success: true, output: step.expectedOutput };
      const row = await saved();
      assert.deepEqual(row.project_files, []); assert.deepEqual(row.activity_projects, {});
      assert.equal(row.updated_at, progress.updatedAt);
      assert.ok(progress.moduleVersion);
      assert.equal(selectedReads, 1, "read selected module once per preparation");
      const repeat = await (await call(`${base}/progress/activity?stepId=${step.id}`)).json();
      assert.equal(repeat.updatedAt, progress.updatedAt);
      payload = { stepId: step.id, completionId: randomUUID(), moduleVersion: progress.moduleVersion, updatedAt: progress.updatedAt, files: progress.projectFiles.map((file) => ({ ...file, content: file.path === "Jeepney.java" ? file.content.replace("return 20", "return 25") : file.content })), success: true, output: step.activity.expectedOutput, sample };
    });

    await t.test("failed output, sample-only evidence, changed samples and direct flags cannot save code or complete", async () => {
      for (const invalid of [{ ...payload, output: step.expectedOutput }, { ...payload, success: false }, { ...payload, sample: undefined }, { ...payload, sample: { ...sample, files: sample.files.map((file) => ({ ...file, content: file.content + "// changed" })) } }, { stepId: step.id, pass: true }]) {
        const response = await call(`${base}/progress/complete`, cookies[1], "POST", invalid);
        assert.equal(response.status, 400, await response.text());
        assert.deepEqual((await saved()).project_files, []);
        assert.deepEqual((await saved()).step_states, {});
      }
      assert.equal((await call(`${base}/progress/complete`, cookies[2], "POST", payload)).status, 403);
      assert.equal((await call(`${base}/progress/complete`, cookies[0], "POST", payload)).status, 403);
      assert.equal((await call(`${base}/progress/complete`, "", "POST", payload)).status, 401);
      assert.equal((await call(`${base}/progress/complete`, cookies[1], "POST", { ...payload, stepId: next.id })).status, 403);
    });

    await t.test("a successful checkpoint saves exact files, sample verification and completion together once", async () => {
      const response = await call(`${base}/progress/complete`, cookies[1], "POST", payload);
      assert.equal(response.status, 200, await response.clone().text());
      const result = await response.json();
      assert.equal(result.passed, true); assert.equal(result.progress.stepStates[key], "pass");
      assert.equal(result.progress.stepStates[sampleStateId(step)], "pass");
      assert.deepEqual(result.progress.projectFiles, payload.files);
      const replay = await call(`${base}/progress/complete`, cookies[1], "POST", payload);
      assert.equal(replay.status, 200); assert.equal((await replay.json()).progress.updatedAt, result.progress.updatedAt);
      const failed = await call(`${base}/progress/complete`, cookies[1], "POST", { ...payload, completionId: randomUUID(), updatedAt: result.progress.updatedAt, success: false });
      assert.equal(failed.status, 400); assert.equal((await saved()).updated_at, result.progress.updatedAt);
      assert.deepEqual((await saved()).performance_task, {});
      assert.equal((await call(`${base}/progress/activity?stepId=${next.id}`)).status, 200);
    });

    await t.test("legacy samples and intentional-error verification keep distinct completion rules", async () => {
      const legacy = structuredClone(content); legacy.id += "-legacy"; legacy.sampleFirst = false;
      delete legacy.lessons[0].blocks[0].activity;
      assert.equal((await call(`/api/classrooms/${classes[0]}/modules`, cookies[0], "POST", legacy)).status, 201);
      const legacyBase = `/api/classrooms/${classes[0]}/modules/${legacy.id}`;
      const legacyProgress = await (await call(`${legacyBase}/progress/activity?stepId=${step.id}`)).json();
      let response = await call(`${legacyBase}/progress/complete`, cookies[1], "POST", { ...payload, completionId: randomUUID(), moduleVersion: legacyProgress.moduleVersion, updatedAt: legacyProgress.updatedAt,
        files: legacyProgress.projectFiles, output: step.expectedOutput, sample: undefined });
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal((await response.json()).progress.stepStates[step.id], "pass");
      const errorModule = structuredClone(content); errorModule.id += "-error";
      errorModule.lessons[0].blocks[0].expectedError = "java.lang.ArithmeticException";
      assert.equal((await call(`/api/classrooms/${classes[0]}/modules`, cookies[0], "POST", errorModule)).status, 201);
      const errorBase = `/api/classrooms/${classes[0]}/modules/${errorModule.id}`;
      const errorProgress = await (await call(`${errorBase}/progress/activity?stepId=${step.id}`)).json();
      const errorPayload = { ...payload, completionId: randomUUID(), moduleVersion: errorProgress.moduleVersion, updatedAt: errorProgress.updatedAt,
        sample: { files: errorProgress.projectFiles, success: false, output: "java.lang.ArithmeticException: / by zero" } };
      assert.equal((await call(`${errorBase}/progress/complete`, cookies[1], "POST", { ...errorPayload, sample: { ...errorPayload.sample, output: "Execution stopped." } })).status, 400);
      response = await call(`${errorBase}/progress/complete`, cookies[1], "POST", errorPayload);
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal((await response.json()).progress.stepStates[sampleStateId(step)], "pass");
    });

    await t.test("module updates, stale projects and live restrictions keep existing successful work intact", async () => {
      const before = await saved();
      assert.equal((await call(`${base}/progress/complete`, cookies[1], "POST", { ...payload, completionId: randomUUID() })).status, 409);
      const corrected = structuredClone(content); corrected.title += " revised";
      assert.equal((await call(`/api/classrooms/${classes[0]}/modules`, cookies[0], "POST", corrected)).status, 201);
      assert.equal((await call(`${base}/progress/complete`, cookies[1], "POST", payload)).status, 409);
      assert.deepEqual((await saved()).project_files, before.project_files);
      const { data: live, error } = await admin.from("activities").insert({ classroom_id: classes[0], created_by: users[0].id, title: "Other live week", mode: "individual" }).select("id").single();
      assert.equal(error, null);
      await admin.from("classrooms").update({ current_activity_id: live.id, active_module_id: "another-week" }).eq("id", classes[0]);
      assert.equal((await call(`${base}/progress/complete`, cookies[1], "POST", payload)).status, 403);
    });
  } finally {
    for (const id of classes) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
