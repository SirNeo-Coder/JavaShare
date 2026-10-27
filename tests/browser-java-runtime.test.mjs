import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source = readFileSync(new URL("../java-runtime/public/runner.js", import.meta.url), "utf8");

function runtime(downloadFails = false, execute, download = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([80, 75, 0, 255]).buffer }), deleteDatabase) {
  let options, call, classpath;
  const listeners = new Set();
  const posts = [], downloads = [], dbDeletes = [], strings = new Map(), parent = { postMessage: (data, origin) => posts.push({ data, origin }) };
  runInNewContext(source, {
    parent, window: { addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback) },
    document: { querySelector: () => ({}), createElement: () => ({}), head: { append: (script) => queueMicrotask(() => downloadFails ? script.onerror() : script.onload()) } },
    cheerpjInit: async (value) => { assert.ok(options === undefined, "the stale filesystem must be cleared before Java starts"); options = value; },
    fetch: async (...args) => { downloads.push(args); return download(...args); },
    cheerpOSAddStringFile: (path, content) => { assert.match(path, /^\/str\/[^/]+$/); strings.set(path, content); },
    cheerpjRunLibrary: async (path) => { classpath = path; return { CodeShareJava: {
      runSources: async (...args) => { call = args; options.natives.Java_CodeShareJava_running(); return JSON.stringify({ success: true, output: "leftright\n" }); },
      runInteractiveSources: async (...args) => { call = args; options.natives.Java_CodeShareJava_running(); return JSON.stringify(await execute(options.natives)); },
    } }; },
    indexedDB: { deleteDatabase: (name) => {
      dbDeletes.push(name);
      const request = {};
      if (deleteDatabase !== "hang") queueMicrotask(() => deleteDatabase === "blocked" ? request.onblocked?.() : deleteDatabase === "error" ? request.onerror?.() : request.onsuccess?.());
      return request;
    } },
    setTimeout, clearTimeout,
  });
  return { posts, strings, downloads, dbDeletes, get classpath() { return classpath; }, get call() { return call; }, receive: (data, source = parent, origin = "https://class.example.test") => Promise.all([...listeners].map((receive) => receive({ source, origin, data }))) };
}
const request = { type: "codeshare-java-run", id: "test-run", stdin: "7\n", mainClass: "app.Main", files: [
  { path: "app/Main.java", content: "main" }, { path: "left/Helper.java", content: "left" }, { path: "right/Helper.java", content: "right" },
] };

test("browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge", async () => {
  const runner = runtime();
  await runner.receive(request, {}); assert.equal(runner.strings.size, 0);
  await runner.receive(request, undefined, "null"); assert.equal(runner.strings.size, 0);
  await runner.receive(request);
  assert.deepEqual([...runner.strings.values()].filter((value) => typeof value === "string"), ["main", "left", "right"]);
  assert.deepEqual(Array.from(runner.call), ["app/Main.java\nleft/Helper.java\nright/Helper.java", "app.Main", "7\n", "/files/test-run", "/str"]);
  assert.deepEqual(JSON.parse(JSON.stringify(runner.posts.at(-1))), { data: { type: "codeshare-java-result", id: "test-run", success: true, output: "leftright\n" }, origin: "https://class.example.test" });
  const count = runner.posts.length;
  await runner.receive(request); assert.equal(runner.posts.length, count, "one frame runs once");
});

test("browser runtime: clears CheerpJ's persistent filesystem before every run, including a stuck delete (CKB-072)", async () => {
  for (const mode of ["success", "blocked", "error"]) {
    const runner = runtime(false, undefined, undefined, mode);
    await runner.receive(request);
    assert.deepEqual(runner.dbDeletes, ["cjFS_/files/"]);
    assert.equal(runner.posts.at(-1).data.success, true, `mode ${mode} must still let the run start`);
  }
});

test("browser runtime: a delete that never fires any event cannot hang the run past its own fallback", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const runner = runtime(false, undefined, undefined, "hang");
  const running = runner.receive(request);
  await settle();
  assert.equal(runner.posts.some(({ data }) => data.type === "codeshare-java-result"), false, "Java has not finished while the clear is still pending");
  t.mock.timers.tick(2000);
  await running;
  assert.equal(runner.posts.at(-1).data.success, true);
});

test("browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)", async () => {
  const runner = runtime(); await runner.receive(request);
  assert.deepEqual(runner.downloads, [["/javac.jar"], ["/codeshare-runner.jar"]], "ordinary downloads need no Range header");
  assert.equal(runner.classpath, "/str/javac.jar:/str/codeshare-runner.jar");
  for (const path of runner.classpath.split(":")) assert.deepEqual(Array.from(runner.strings.get(path)), [80, 75, 0, 255]);
  assert.equal(runner.posts.at(-1).data.success, true);
  assert.deepEqual(runner.posts.filter(({ data }) => data.type === "codeshare-java-status").map(({ data }) => data.stage),
    ["Loading Java 8", "Starting Java 8", "Downloading javac.jar", "Downloading codeshare-runner.jar", "Starting Java compiler", "Compiling project"]);
});

test("browser runtime: missing compiler assets report the filename and stage without starting Java (CKB-056)", async () => {
  for (const missing of ["/javac.jar", "/codeshare-runner.jar"]) {
    const runner = runtime(false, undefined, async (url) => url === missing ? { ok: false, status: 404 } : { ok: true, arrayBuffer: async () => new ArrayBuffer(0) });
    await runner.receive(request);
    const result = runner.posts.at(-1).data;
    assert.equal(result.success, false); assert.match(result.output, /HTTP 404/);
    assert.ok(result.output.includes(`during Downloading ${missing.slice(1)}`));
    assert.equal(runner.classpath, undefined); assert.equal(runner.call, undefined);
  }
});

test("browser runtime: failed compiler downloads report their stage and do not compile (CKB-056)", async () => {
  const runner = runtime(false, undefined, async () => { throw new Error("network disconnected"); });
  await runner.receive(request);
  assert.equal(runner.posts.at(-1).data.success, false);
  assert.match(runner.posts.at(-1).data.output, /during Downloading javac.jar.*network disconnected/);
  assert.equal(runner.classpath, undefined);
});

test("browser runtime: invalid sources and download failure report failure instead of progress", async () => {
  for (const files of [[], [{ path: "../Main.java", content: "bad" }]]) {
    const runner = runtime(); await runner.receive({ ...request, files });
    assert.equal(runner.posts.at(-1).data.success, false); assert.equal(runner.strings.size, 0);
  }
  const runner = runtime(true); await runner.receive(request);
  assert.equal(runner.posts.at(-1).data.success, false); assert.match(runner.posts.at(-1).data.output, /internet connection/);
});

test("browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)", () => {
  const headers = readFileSync(new URL("../java-runtime/public/_headers", import.meta.url), "utf8");
  assert.match(headers, /frame-src https:\/\/cjrtnc\.leaningtech\.com;/);
  assert.match(headers, /connect-src 'self' https:\/\/cjrtnc\.leaningtech\.com;/);
  assert.match(headers, /base-uri 'none'; form-action 'none'/);
});

const settle = async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); };

test("browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)", async () => {
  const answers = [];
  const runner = runtime(false, async (natives) => {
    natives.Java_CodeShareJava_output(null, "Name? ");
    answers.push(await natives.Java_CodeShareJava_readInput());
    natives.Java_CodeShareJava_output(null, "Name? Hello\nAgain? ");
    answers.push(await natives.Java_CodeShareJava_readInput());
    return { success: true, output: "Done" };
  });
  const running = runner.receive({ ...request, interactive: true, stdin: "" });
  await settle();
  assert.equal(runner.posts.at(-1).data.type, "codeshare-java-input");
  assert.equal(runner.posts.at(-1).data.inputId, 1);
  const reply = { type: "codeshare-java-input", id: request.id, inputId: 1, line: "Zoë 🐕\n" };
  await runner.receive(reply, {}); await runner.receive(reply, undefined, "https://evil.example.test");
  await runner.receive({ ...reply, id: "old-run" }); await runner.receive({ ...reply, inputId: 2 });
  assert.deepEqual(answers, []);
  await runner.receive(reply); await settle();
  assert.deepEqual(answers, ["Zoë 🐕\n"]);
  assert.equal(runner.posts.at(-1).data.inputId, 2);
  await runner.receive(reply); assert.equal(answers.length, 1);
  await runner.receive({ ...reply, inputId: 2, line: "\n" }); await running;
  assert.deepEqual(answers, ["Zoë 🐕\n", "\n"]);
  assert.equal(runner.posts.at(-1).data.success, true);
  assert.ok(runner.posts.findIndex(({ data }) => data.type === "codeshare-java-output") < runner.posts.length - 1);
});

test("browser runtime: live input cannot exceed the existing total input limit", async () => {
  const runner = runtime(false, async (natives) => ({ success: false, output: String(await natives.Java_CodeShareJava_readInput()) }));
  const running = runner.receive({ ...request, interactive: true }); await settle();
  await runner.receive({ type: "codeshare-java-input", id: request.id, inputId: 1, line: "x".repeat(10000) });
  await running;
  assert.equal(runner.posts.at(-1).data.output, "null");
});
