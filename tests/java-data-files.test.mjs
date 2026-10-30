// Java projects may carry .txt data files the program reads, e.g. Week 15's fleet.txt (CKB-088).
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { javaProjectPath } from "../backend/src/file-paths.ts";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { executeLocallyResult } from "../backend/src/java-runner.ts";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";

const fleet = "Jeepney,NXA 123,Mang Ramon,Monumento-Divisoria\nBus,BUS 789,Aling Rosa,50\n";
const reader = 'import java.io.*; public class Main { public static void main(String[] args) throws IOException { try (BufferedReader in = new BufferedReader(new FileReader("fleet.txt"))) { System.out.println("First: " + in.readLine()); } } }';

test("data files: a Java project accepts safe .txt names only", () => {
  for (const path of ["fleet.txt", "records/trips.txt", "fleet_backup.txt", "Main.java", "src/app/Main.java"]) assert.equal(javaProjectPath(path), true, path);
  for (const path of ["../fleet.txt", "/fleet.txt", ".hidden.txt", "My File.txt", "fleet.csv", "index.html", `${"a".repeat(157)}.txt`]) assert.equal(javaProjectPath(path), false, path);
});

test("data files: a java step may supply a .txt file at upload, never an unsafe name", () => {
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));
  const step = fixture.lessons[0].blocks.find((block) => block.type === "step");
  step.files.push({ path: "fleet.txt", content: fleet });
  assert.equal(courseModule.safeParse(fixture).success, true);
  step.files.at(-1).path = "../fleet.txt";
  assert.equal(courseModule.safeParse(fixture).success, false);
});

test("data files: the browser bridge puts fleet.txt where the program reads it and does not compile it", () => {
  const jar = resolve("java-runtime/public/codeshare-runner.jar");
  const base = mkdtempSync(join(tmpdir(), "codeshare-data-file-"));
  try {
    const files = [["Main.java", reader], ["fleet.txt", fleet]];
    files.forEach(([, content], index) => writeFileSync(join(base, `codeshare-${index}`), content));
    const result = JSON.parse(execFileSync("java", ["-cp", jar, "CodeShareJava", files.map(([path]) => path).join("\n"), "Main", "", join(base, "run-1"), base], { cwd: base, encoding: "utf8", timeout: 15000 }));
    assert.deepEqual(result, { success: true, output: "First: Jeepney,NXA 123,Mang Ramon,Monumento-Divisoria\n" });
  } finally { rmSync(base, { recursive: true, force: true }); }
});

test("data files: the online runner page passes .txt files to the bridge and refuses unsafe names", async () => {
  const source = readFileSync(new URL("../java-runtime/public/runner.js", import.meta.url), "utf8");
  for (const [path, accepted] of [["fleet.txt", true], ["../fleet.txt", false]]) {
    let call;
    const listeners = new Set(), posts = [], parent = { postMessage: (data) => posts.push(data) };
    runInNewContext(source, {
      parent, window: { addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback) },
      document: { querySelector: () => ({}), createElement: () => ({}), head: { append: (script) => queueMicrotask(() => script.onload()) } },
      cheerpjInit: async () => {}, fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }), cheerpOSAddStringFile: () => {},
      cheerpjRunLibrary: async () => ({ CodeShareJava: { runSources: async (...args) => { call = args; return JSON.stringify({ success: true, output: "" }); } } }),
      indexedDB: { deleteDatabase: () => { const request = {}; queueMicrotask(() => request.onsuccess?.()); return request; } }, setTimeout, clearTimeout,
    });
    await Promise.all([...listeners].map((receive) => receive({ source: parent, origin: "https://class.example.test", data: { type: "codeshare-java-run", id: "data", stdin: "", mainClass: "Main",
      files: [{ path: "Main.java", content: reader }, { path, content: fleet }] } })));
    if (accepted) assert.equal(call[0], "Main.java\nfleet.txt");
    else { assert.equal(call, undefined); assert.match(posts.at(-1).output, /Invalid Java project/); }
  }
});

test("data files: the laptop runner keeps a .txt file out of compilation", async () => {
  const result = await executeLocallyResult([{ path: "Main.java", content: 'public class Main { public static void main(String[] args) { System.out.println("ok"); } }' }, { path: "fleet.txt", content: fleet }], "");
  assert.deepEqual(result, { success: true, output: "ok\n" });
});

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("data files: a step's fleet.txt opens with the step and its online completion is saved", { skip: !local?.API_URL && "local Supabase is not running" }, async () => {
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "false", JAVA_RUNNER_URL: "https://java.example.test/", JWT_SECRET: "data-files-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [], cookies = [], password = randomUUID();
  let classroomId;
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const content = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
  content.id = `java-2-data-files-${randomUUID().slice(0, 8)}`;
  content.sampleFirst = true;
  const step = content.lessons[0].blocks[0];
  step.files = [{ path: "Main.java", content: reader }, { path: "fleet.txt", content: fleet }];
  step.expectedOutput = "First: Jeepney,NXA 123,Mang Ramon,Monumento-Divisoria";
  step.activity = { id: "data-files-task", instruction: "Print the second line instead.", files: [], expectedOutput: "Second: Bus,BUS 789,Aling Rosa,50", stdin: "" };
  try {
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `data-files-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Data files ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const created = await admin.from("classrooms").insert({ name: "Disposable data-file class", join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id, module_subject: "java" }).select("id").single();
    assert.equal(created.error, null); classroomId = created.data.id;
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    const upload = await call(`/api/classrooms/${classroomId}/modules`, cookies[0], "POST", content);
    assert.equal(upload.status, 201, await upload.text());
    const base = `/api/classrooms/${classroomId}/modules/${content.id}`;
    const opened = await call(`${base}/progress/activity?stepId=${step.id}`, cookies[1]);
    assert.equal(opened.status, 200, await opened.clone().text());
    const progress = await opened.json();
    assert.equal(progress.projectFiles.find((file) => file.path === "fleet.txt")?.content, fleet, "the student's editor receives the supplied data file");
    const changed = progress.projectFiles.map((file) => file.path === "Main.java" ? { ...file, content: reader.replace('System.out.println("First: " + in.readLine());', 'in.readLine(); System.out.println("Second: " + in.readLine());') } : file);
    const response = await call(`${base}/progress/complete`, cookies[1], "POST", { stepId: step.id, completionId: randomUUID(), moduleVersion: progress.moduleVersion, updatedAt: progress.updatedAt,
      files: changed, success: true, output: step.activity.expectedOutput, sample: { files: progress.projectFiles, success: true, output: step.expectedOutput } });
    assert.equal(response.status, 200, await response.clone().text());
    const result = await response.json();
    assert.equal(result.progress.stepStates[activityStateId(step)], "pass");
    assert.equal(result.progress.stepStates[sampleStateId(step)], "pass");
    assert.deepEqual(result.progress.projectFiles, changed, "Main.java and fleet.txt are saved together");
  } finally {
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
