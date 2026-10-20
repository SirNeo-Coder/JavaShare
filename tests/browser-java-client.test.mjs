import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";
const { runJava, runnerAddress } = tsxRequire("../app/javaExecution.ts", import.meta.url);
const files = [{ path: "src/Main.java", content: "package oop; public class Main {}" }, { path: "Dog.java", content: "class Dog {}" }];
const browser = { mode: "browser", url: "https://java.example.test/" };

test("browser Java: refuses same origin, insecure, credentialed and path-based runner addresses", () => {
  for (const address of ["https://class.example.test/", "http://remote.example.test/", "https://u:p@java.example.test/", "https://java.example.test/run", "https://java.example.test/?key=x", "https://java.example.test/#x"]) assert.throws(() => runnerAddress(address, "https://class.example.test"));
  assert.equal(runnerAddress(browser.url, "https://class.example.test").origin, "https://java.example.test");
  assert.equal(runnerAddress("http://localhost:3003/", "http://localhost:3001").port, "3003");
});

test("browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout", async (t) => {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  const listeners = new Set();
  let frame, sent;
  globalThis.window = { location: { origin: "https://class.example.test" }, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const dispatch = (data, source = frame.contentWindow, origin = "https://java.example.test") => { for (const listener of [...listeners]) listener({ data, source, origin }); };
  globalThis.document = { createElement: () => {
    frame = { sandbox: { add(...args) { assert.deepEqual(args, ["allow-scripts", "allow-same-origin"]); } }, contentWindow: { postMessage(data, origin) { sent = data; assert.equal(origin, "https://java.example.test"); } }, remove() { this.removed = true; } };
    return frame;
  }, body: { append() { dispatch({ type: "codeshare-java-ready" }); } } };
  t.mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const promise = runJava(files, "7\n", browser);
    await Promise.resolve();
    assert.equal(sent.files.length, 2); assert.equal(sent.files[0].path, "Main.java"); assert.equal(sent.mainClass, "oop.Main"); assert.equal(sent.stdin, "7\n");
    dispatch({ type: "codeshare-java-result", id: sent.id, success: true, output: "forged" }, {});
    dispatch({ type: "codeshare-java-result", id: sent.id, success: true, output: "forged" }, frame.contentWindow, "https://evil.example.test");
    dispatch({ type: "codeshare-java-result", id: "old-run", success: true, output: "forged" });
    assert.equal(frame.removed, undefined);
    dispatch({ type: "codeshare-java-result", id: sent.id, success: true, output: "Dog: 14\n" });
    assert.deepEqual(await promise, { mode: "browser", success: true, output: "Dog: 14\n" }); assert.equal(frame.removed, true); assert.equal(listeners.size, 0);
    const timed = runJava(files, "", browser); await Promise.resolve();
    dispatch({ type: "codeshare-java-running", id: sent.id });
    t.mock.timers.tick(5001);
    assert.equal((await timed).success, false); assert.equal(frame.removed, true); assert.equal(listeners.size, 0);
    const startup = runJava(files, "", browser); await Promise.resolve(); t.mock.timers.tick(120001);
    assert.match((await startup).output, /120 seconds/); assert.equal(listeners.size, 0);
    const large = runJava(files, "", browser); await Promise.resolve();
    dispatch({ type: "codeshare-java-result", id: sent.id, success: true, output: "x".repeat(70001) });
    assert.equal((await large).success, false);
    assert.equal((await runJava([{ path: "Dog.java", content: "" }], "", browser)).success, false);
    await assert.rejects(runJava([{ path: "../Main.java", content: "" }], "", browser));
    await assert.rejects(runJava([files[0], { ...files[0], path: "Main.java" }], "", browser));
  } finally { globalThis.window = originalWindow; globalThis.document = originalDocument; }
});

test("browser Java: offline uses only the existing authenticated laptop endpoint", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => { calls.push({ url, options }); return Response.json({ mode: "local", success: true, output: "laptop" }); });
  assert.equal((await runJava(files, "input", { mode: "local" })).output, "laptop");
  assert.equal(calls[0].url, "/api/execute"); assert.equal(calls[0].options.credentials, "include");
  assert.deepEqual(JSON.parse(calls[0].options.body), { files, stdin: "input" });
});
