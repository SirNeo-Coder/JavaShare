// Production UI and local database. Online runner responses are controlled; offline uses real javac.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["127.0.0.1", "localhost"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const sampleCode = 'public class Main { public static void main(String[] args) { int zero = 0; System.out.println(1 / zero); } }';
const taskCode = (value) => `public class Main { public static void main(String[] args) { System.out.println(${value}); } }`;

for (const mode of ["online", "offline"]) test(`module draft recovery ${mode}`, { timeout: 120000 }, async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = [];
  let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `draft-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Draft ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const baseURL = mode === "online" ? "http://localhost:3040" : "http://localhost:3042";
    const teacher = await browser.newContext({ baseURL });
    const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Disposable draft recovery" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
    fixture.id = `recovery-${mode}`; fixture.sampleFirst = true; fixture.starterFiles = [];
    const step = fixture.lessons[0].blocks[0];
    step.files = [{ path: "Main.java", content: sampleCode }]; step.expectedOutput = ""; step.expectedError = "java.lang.ArithmeticException";
    step.activity = { id: "recovery-v1", instruction: "Replace division by zero with printing seven.", files: [], expectedOutput: "7", stdin: "" };
    const modulePath = `/api/classrooms/${classroomId}/modules/${fixture.id}`;
    assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: fixture })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    assert.equal((await (await context.request.get("/api/java-runner")).json()).mode, mode === "offline" ? "local" : "browser");
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    if (mode === "online") await page.route("http://localhost:3041/", (route) => route.fulfill({ contentType: "text/html", body: `<script>
      addEventListener('message', event => { const data = event.data; if (data.type !== 'codeshare-java-run') return;
        const code = data.files.find(file => file.path === 'Main.java').content;
        const error = code.includes('1 / zero');
        parent.postMessage({ type: 'codeshare-java-result', id: data.id, success: !error,
          output: error ? 'java.lang.ArithmeticException: / by zero' : code.includes('println(8)') ? '8' : '7' }, event.origin);
      }); parent.postMessage({type:'codeshare-java-ready'}, '*');
    </script>` }));
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const feedback = page.locator(".module-run-feedback");
    const open = async () => {
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').click();
      await page.locator("#classroom-modules .module-catalog-card").first().getByRole("button").first().click();
      await page.locator(".student-module-project").waitFor();
      await page.getByRole("button", { name: "Close module worksheet", exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('.actionbar button:last-child')?.disabled);
    };
    const run = async () => {
      if (mode === "offline") await new Promise((resolve) => setTimeout(resolve, 1600));
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction(() => !document.querySelector(".java-run-progress"));
    };
    const deviceKey = ["activity", users[1].id, classroomId, fixture.id, step.id].join(":");
    const savedDraft = () => page.evaluate((key) => new Promise((resolve, reject) => {
      const request = indexedDB.open("codeshare-module-device-v1", 1);
      request.onsuccess = () => { const db = request.result; const read = db.transaction("records").objectStore("records").get(key);
        read.onsuccess = () => { resolve(read.result); db.close(); }; read.onerror = () => reject(read.error); };
      request.onerror = () => reject(request.error);
    }), deviceKey);
    const save = async () => { await page.getByRole("button", { name: "Save work", exact: true }).click(); await page.waitForFunction(() => !document.querySelector('.actionbar button:last-child')?.disabled); };

    await t.test("expected-error verification and unfinished code survive reopening", async () => {
      await open(); await run();
      assert.match(await feedback.textContent(), /Expected error observed/);
      assert.equal(await editor.getAttribute("readonly"), null);
      await editor.fill(taskCode(7) + "\n// unfinished work"); await save();
      assert.match((await savedDraft()).files[0].content, /unfinished work/);
      await open();
      assert.match(await editor.inputValue(), /unfinished work/);
      assert.equal(await editor.getAttribute("readonly"), null);
    });

    if (mode === "online") {
      await t.test("rejected completion stays pending through reload and unlocks only after retry acceptance", async () => {
        await page.route("**/progress/complete", (route) => route.fulfill({ status: 503, json: { error: "Simulated unavailable sync" } }));
        await run();
        assert.match(await feedback.textContent(), /Passed locally — awaiting sync/);
        assert.doesNotMatch(await feedback.textContent(), /Completed|next activity unlocked/);
        const pendingId = (await savedDraft()).pending.completionId;
        assert.equal((await (await context.request.get(`${modulePath}/progress`)).json()).stepStates["task:recovery-v1"], undefined);
        await open();
        assert.match(await feedback.textContent(), /Passed locally — awaiting sync/);
        assert.equal((await savedDraft()).pending.completionId, pendingId);
        await page.unroute("**/progress/complete");
        await page.evaluate(() => window.dispatchEvent(new Event("online")));
        await feedback.filter({ hasText: "Completed — next activity unlocked" }).waitFor();
        assert.equal((await savedDraft()).pending, undefined);
        assert.equal((await (await context.request.get(`${modulePath}/progress`)).json()).stepStates["task:recovery-v1"], "pass");
      });

      await t.test("teacher correction refreshes cached instructions and archives stale code and pending evidence", async () => {
        await page.route("**/progress/complete", (route) => route.fulfill({ status: 503, json: { error: "Simulated unavailable sync" } }));
        await editor.fill(taskCode(7) + "\n// preserve this earlier version"); await run();
        assert.ok((await savedDraft()).pending);
        step.files[0].content += "\n// corrected sample";
        step.activity.id = "recovery-v2"; step.activity.expectedOutput = "8"; step.activity.instruction = "Print eight instead.";
        assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: fixture })).status(), 201);
        await page.unroute("**/progress/complete");
        await open();
        assert.match(await editor.inputValue(), /corrected sample/);
        assert.equal(await editor.getAttribute("readonly"), "");
        await page.getByText("Work saved before lesson changes", { exact: true }).click();
        assert.match(await page.locator(".module-before-sample").last().textContent(), /preserve this earlier version/);
        const recovered = await savedDraft();
        assert.equal(recovered.stateId, "task:recovery-v2"); assert.equal(recovered.sample, undefined); assert.equal(recovered.pending, undefined);
        assert.equal((await (await context.request.get(`${modulePath}/progress`)).json()).stepStates["task:recovery-v2"], undefined);
        await run(); assert.match(await feedback.textContent(), /Expected error observed/);
        await editor.fill(taskCode(8)); await run();
        assert.match(await feedback.textContent(), /Completed — next activity unlocked/);
      });
    } else await t.test("laptop Java completes the restored alteration without losing its code", async () => {
      await run(); assert.match(await feedback.textContent(), /Completed — next activity unlocked/);
      const progress = await (await context.request.get(`${modulePath}/progress`)).json();
      assert.equal(progress.stepStates["task:recovery-v1"], "pass");
      assert.match(progress.projectFiles[0].content, /unfinished work/);
      assert.equal(await page.locator("iframe").count(), 0);
    });
  } finally {
    await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
