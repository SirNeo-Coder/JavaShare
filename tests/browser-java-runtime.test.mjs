import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source = readFileSync(new URL("../java-runtime/public/runner.js", import.meta.url), "utf8");

function runtime(downloadFails = false, execute) {
  let options, call;
  const listeners = new Set();
  const posts = [], strings = new Map(), parent = { postMessage: (data, origin) => posts.push({ data, origin }) };
  runInNewContext(source, {
    parent, window: { addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback) },
    document: { querySelector: () => ({}), createElement: () => ({}), head: { append: (script) => queueMicrotask(() => downloadFails ? script.onerror() : script.onload()) } },
    cheerpjInit: async (value) => { options = value; },
    cheerpOSAddStringFile: (path, content) => { assert.match(path, /^\/str\/[^/]+$/); strings.set(path, content); },
    cheerpjRunLibrary: async () => ({ CodeShareJava: {
      runSources: async (...args) => { call = args; options.natives.Java_CodeShareJava_running(); return JSON.stringify({ success: true, output: "leftright\n" }); },
      runInteractiveSources: async (...args) => { call = args; options.natives.Java_CodeShareJava_running(); return JSON.stringify(await execute(options.natives)); },
    } }),
  });
  return { posts, strings, get call() { return call; }, receive: (data, source = parent, origin = "https://class.example.test") => Promise.all([...listeners].map((receive) => receive({ source, origin, data }))) };
}
const request = { type: "codeshare-java-run", id: "test-run", stdin: "7\n", mainClass: "app.Main", files: [
  { path: "app/Main.java", content: "main" }, { path: "left/Helper.java", content: "left" }, { path: "right/Helper.java", content: "right" },
] };

test("browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge", async () => {
  const runner = runtime();
  await runner.receive(request, {}); assert.equal(runner.strings.size, 0);
  await runner.receive(request, undefined, "null"); assert.equal(runner.strings.size, 0);
  await runner.receive(request);
  assert.deepEqual([...runner.strings.values()], ["main", "left", "right"]);
  assert.deepEqual(Array.from(runner.call), ["app/Main.java\nleft/Helper.java\nright/Helper.java", "app.Main", "7\n", "/files/test-run", "/str"]);
  assert.deepEqual(JSON.parse(JSON.stringify(runner.posts.at(-1))), { data: { type: "codeshare-java-result", id: "test-run", success: true, output: "leftright\n" }, origin: "https://class.example.test" });
  await runner.receive(request); assert.equal(runner.posts.length, 3, "one frame runs once");
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

const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

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
