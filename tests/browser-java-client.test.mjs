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

function liveConsole(t, { oldRunner = false, aborted = false } = {}) {
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  const listeners = new Set(), posts = [], outputs = [], stages = [];
  let frame, send;
  globalThis.window = { location: { origin: "https://class.example.test" }, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const dispatch = (data, source = frame.contentWindow, origin = "https://java.example.test") => {
    for (const listener of [...listeners]) listener({ data, source, origin });
  };
  globalThis.document = { createElement: () => {
    frame = { sandbox: { add() {} }, contentWindow: { postMessage(data, origin) { posts.push({ data, origin }); } }, remove() { this.removed = true; } };
    return frame;
  }, body: { append() { dispatch({ type: "codeshare-java-ready", interactive: !oldRunner }); } } };
  t.mock.timers.enable({ apis: ["setTimeout", "Date"] });
  t.after(() => { globalThis.window = originalWindow; globalThis.document = originalDocument; });
  const controller = new AbortController();
  if (aborted) controller.abort();
  const promise = runJava(files, "", browser, { signal: controller.signal, onOutput: (text) => outputs.push(text), onStatus: (stage) => stages.push(stage), onInput: (callback) => { send = callback; } });
  const id = posts[0]?.data.id;
  return { promise, controller, frame, posts, outputs, stages, dispatch, listeners, get send() { return send; }, event: (type, extra = {}) => dispatch({ type: "codeshare-java-" + type, id, ...extra }) };
}

test("browser Java: startup stages authenticate messages and identify the stalled stage without extending the deadline (CKB-056)", async (t) => {
  const live = liveConsole(t);
  const message = { type: "codeshare-java-status", id: live.posts[0].data.id, stage: "forged" };
  live.dispatch(message, {}); live.dispatch(message, live.frame.contentWindow, "https://evil.example.test");
  live.dispatch({ ...message, id: "old-run" });
  for (const stage of [null, {}, "", "x".repeat(81)]) live.event("status", { stage });
  assert.deepEqual(live.stages, ["Opening Java runner"]);
  t.mock.timers.tick(60000); live.event("status", { stage: "Starting Java 8" });
  t.mock.timers.tick(59000); live.event("status", { stage: "Downloading javac.jar" });
  assert.deepEqual(live.stages, ["Opening Java runner", "Starting Java 8", "Downloading javac.jar"]);
  t.mock.timers.tick(1001);
  const result = await live.promise;
  assert.equal(result.success, false); assert.match(result.output, /120 seconds.*Last stage: Downloading javac.jar/);
  assert.doesNotMatch(result.output, /Check your internet connection/);
  assert.deepEqual(live.outputs, []); assert.equal(live.frame.removed, true); assert.equal(live.listeners.size, 0);
});

test("browser Java: startup feedback never contaminates Java output or accepts stages after execution starts (CKB-056)", async (t) => {
  const live = liveConsole(t);
  live.event("status", { stage: "Compiling project" }); live.event("running");
  live.event("status", { stage: "late stage" });
  live.event("output", { output: "Hello, CodeShare!\n" });
  live.event("result", { success: true, output: "Hello, CodeShare!\n" });
  assert.deepEqual(live.stages, ["Opening Java runner", "Compiling project", "Running Java"]);
  assert.deepEqual(live.outputs, ["Hello, CodeShare!\n"]);
  assert.deepEqual(await live.promise, { mode: "browser", success: true, output: "Hello, CodeShare!\n" });
});

test("interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049)", async (t) => {
  const live = liveConsole(t);
  assert.equal(live.posts[0].data.interactive, true);
  live.event("running");
  live.event("output", { output: "Name? " });
  assert.deepEqual(live.outputs, ["Name? "]);
  live.dispatch({ type: "codeshare-java-input", id: live.posts[0].data.id, inputId: 1 }, {});
  live.dispatch({ type: "codeshare-java-input", id: "old-run", inputId: 1 });
  live.dispatch({ type: "codeshare-java-input", id: live.posts[0].data.id, inputId: 1 }, live.frame.contentWindow, "https://evil.example.test");
  assert.equal(live.send, undefined);
  live.event("input", { inputId: 1 });
  const first = live.send;
  t.mock.timers.tick(60000);
  assert.equal(live.frame.removed, undefined, "typing time does not consume the execution limit");
  live.send("Zoë 🐕");
  assert.equal(live.posts[1].data.line, "Zoë 🐕\n");
  assert.equal(live.posts[1].origin, "https://java.example.test");
  live.event("output", { output: "Name? Hello, Zoë 🐕\nAgain? " });
  live.event("input", { inputId: 2 });
  first("stale");
  assert.equal(live.posts.length, 2, "an earlier answer cannot satisfy the next read");
  live.send("");
  assert.equal(live.posts[2].data.line, "\n");
  assert.equal(live.posts[2].data.inputId, 2);
  live.event("result", { success: true, output: "Name? Hello, Zoë 🐕\nAgain? Done\n" });
  assert.equal((await live.promise).success, true);
  assert.equal(live.send, null); assert.equal(live.frame.removed, true); assert.equal(live.listeners.size, 0);
});

test("interactive Java: the five-second execution budget is cumulative across input waits", async (t) => {
  const live = liveConsole(t);
  live.event("running"); t.mock.timers.tick(3000);
  live.event("input", { inputId: 1 }); t.mock.timers.tick(60000); live.send("one");
  t.mock.timers.tick(1000); live.event("input", { inputId: 2 }); t.mock.timers.tick(60000); live.send("two");
  t.mock.timers.tick(1001);
  assert.match((await live.promise).output, /5 seconds/);
  assert.equal(live.frame.removed, true);
});

test("interactive Java: Stop preserves printed output and removes a waiting run", async (t) => {
  const live = liveConsole(t);
  live.event("running"); live.event("output", { output: "Name? " }); live.event("input", { inputId: 1 });
  const send = live.send;
  live.controller.abort(); send("late answer");
  assert.deepEqual(await live.promise, { mode: "browser", success: false, output: "Name? \nExecution stopped." });
  assert.equal(live.posts.length, 1); assert.equal(live.send, null); assert.equal(live.listeners.size, 0);
});

test("interactive Java: abandoned input stops after two minutes", async (t) => {
  const live = liveConsole(t);
  live.event("running"); live.event("input", { inputId: 1 }); t.mock.timers.tick(120001);
  assert.match((await live.promise).output, /waiting 2 minutes/);
  assert.equal(live.frame.removed, true); assert.equal(live.send, null);
});

test("interactive Java: total submitted input and streamed output stay bounded", async (t) => {
  const live = liveConsole(t);
  live.event("running"); live.event("input", { inputId: 1 }); live.send("x".repeat(6000));
  live.event("input", { inputId: 2 }); live.send("y".repeat(4000));
  assert.match((await live.promise).output, /10,000 characters/);
  assert.equal(live.posts.length, 2);
});

test("interactive Java: streamed output stays bounded", async (t) => {
  const live = liveConsole(t);
  live.event("running"); live.event("output", { output: "x".repeat(70001) });
  assert.match((await live.promise).output, /64 KB/);
});

test("interactive Java: an older runner fails clearly during independent deployments", async (t) => {
  const live = liveConsole(t, { oldRunner: true });
  assert.match((await live.promise).output, /runner is updating/);
  assert.equal(live.posts.length, 0); assert.equal(live.frame.removed, true); assert.equal(live.listeners.size, 0);
});

test("interactive Java: a run cancelled before startup never appends its frame", async (t) => {
  const live = liveConsole(t, { aborted: true });
  assert.match((await live.promise).output, /Execution stopped/);
  assert.equal(live.posts.length, 0); assert.equal(live.frame.removed, true); assert.equal(live.listeners.size, 0);
});
