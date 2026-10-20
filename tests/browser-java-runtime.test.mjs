import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const source = readFileSync(new URL("../java-runtime/public/runner.js", import.meta.url), "utf8");

function runtime(downloadFails = false) {
  let receive, options, call;
  const posts = [], strings = new Map(), parent = { postMessage: (data, origin) => posts.push({ data, origin }) };
  runInNewContext(source, {
    parent, window: { addEventListener: (_, callback) => { receive = callback; } },
    document: { querySelector: () => ({}), createElement: () => ({}), head: { append: (script) => queueMicrotask(() => downloadFails ? script.onerror() : script.onload()) } },
    cheerpjInit: async (value) => { options = value; },
    cheerpOSAddStringFile: (path, content) => { assert.match(path, /^\/str\/[^/]+$/); strings.set(path, content); },
    cheerpjRunLibrary: async () => ({ CodeShareJava: { runSources: async (...args) => { call = args; options.natives.Java_CodeShareJava_running(); return JSON.stringify({ success: true, output: "leftright\n" }); } } }),
  });
  return { posts, strings, get call() { return call; }, receive: (data, source = parent, origin = "https://class.example.test") => receive({ source, origin, data }) };
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
