import assert from "node:assert/strict";
import { test } from "node:test";
import { SignJWT } from "jose";
import { listenForLiveClasses, pendingLiveClasses, retainLiveDismissals } from "../app/liveClasses.ts";
import { forgetRealtimeClient, privateChannel, realtimeClient, releaseRealtimeChannels } from "../app/realtime.ts";

const classA = { id: "A", name: "Class A", subject: "Java", liveSessionId: "activity:one" };
const classB = { id: "B", name: "Class B", subject: "Web", liveSessionId: "share:two" };

test("live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again", () => {
  const classrooms = [classA, classB, { id: "idle", liveSessionId: null }];
  assert.deepEqual(pendingLiveClasses(classrooms, {}), [classA, classB]);
  assert.deepEqual(pendingLiveClasses(classrooms, { A: classA.liveSessionId }), [classB]);
  assert.deepEqual(pendingLiveClasses(classrooms, { A: classA.liveSessionId, B: classB.liveSessionId }), []);
  const restartedA = { ...classA, liveSessionId: "activity:new" };
  assert.deepEqual(pendingLiveClasses([restartedA, classB], { A: classA.liveSessionId, B: classB.liveSessionId }), [restartedA]);
});

test("live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again", () => {
  const dismissed = { A: classA.liveSessionId, B: classB.liveSessionId, removed: "activity:gone" };
  const retained = retainLiveDismissals([classA, { ...classB, liveSessionId: null }], dismissed);
  assert.deepEqual(retained, { A: classA.liveSessionId });
  assert.deepEqual(pendingLiveClasses([classA, classB], retained), [classB]);
  assert.deepEqual(retainLiveDismissals([{ ...classA, liveSessionId: "activity:new" }], dismissed), {});
});

test("live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events", async () => {
  const channels = [];
  const removed = [];
  const client = {
    channel(topic, options) {
      const channel = {
        topic, options, handlers: {},
        on(kind, { event }, handler) { assert.equal(kind, "broadcast"); this.handlers[event] = handler; return this; },
        subscribe(handler) { this.statusChanged = handler; return this; },
        track() { assert.fail("landing must not announce presence"); },
        send() { assert.fail("landing must not broadcast"); },
      };
      channels.push(channel);
      return channel;
    },
    async removeChannel(channel) { removed.push(channel); return "ok"; },
  };
  let refreshes = 0;
  const availability = [];
  const stop = await listenForLiveClasses(client, ["A", "B", "A"], () => refreshes++, (value) => availability.push(value));
  assert.deepEqual(channels.map((c) => c.topic), ["class:A", "class:B"]);
  for (const channel of channels) {
    assert.equal(channel.options.config.private, true);
    assert.equal(channel.options.config.presence, undefined);
    assert.deepEqual(Object.keys(channel.handlers), ["class:activity-deployed", "class:activity-ended", "class:live-share"]);
    channel.statusChanged("SUBSCRIBED");
  }
  assert.equal(refreshes, 2, "joining recovers an announcement sent before subscription");
  assert.deepEqual(availability, [true]);
  for (const handler of Object.values(channels[0].handlers)) handler();
  assert.equal(refreshes, 5);
  channels[0].statusChanged("CHANNEL_ERROR");
  channels[0].statusChanged("SUBSCRIBED");
  assert.equal(refreshes, 6);
  assert.deepEqual(availability, [true, false, true]);
  await stop();
  assert.deepEqual(removed, channels);
  channels[0].handlers["class:activity-deployed"]();
  channels[1].statusChanged("SUBSCRIBED");
  assert.equal(refreshes, 6, "late callbacks after leaving must not update another screen");
  assert.deepEqual(availability, [true, false, true]);
});

test("live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics", async (t) => {
  // No socket is opened: use the installed SDK's real topic-reuse behavior and delay removal.
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { hostname: "localhost" } } });
  t.after(() => { if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow); else delete globalThis.window; });
  const token = await new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("1h").sign(new TextEncoder().encode("local-unit-test-secret"));
  t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ token, expiresAt: Date.now() + 3600000, url: "http://127.0.0.1:54321", anonKey: "unit-test-anon" }), { headers: { "content-type": "application/json" } }));
  const client = await realtimeClient("");
  const oldChannel = await privateChannel(client, "class:handoff");
  assert.equal(await privateChannel(client, "class:handoff"), oldChannel, "the installed SDK really does reuse an existing topic");
  let finishRemoval;
  const removalGate = new Promise((resolve) => { finishRemoval = resolve; });
  const removeChannel = client.removeChannel.bind(client);
  t.mock.method(client, "removeChannel", async (channel) => { await removalGate; return removeChannel(channel); });
  const leaving = releaseRealtimeChannels(client, [oldChannel]);
  let entered = false;
  // Getting a client is no longer gated on any topic's teardown (only resubscribing the SAME
  // topic is); "entered" must track the channel itself, not just reaching the .then callback.
  const entering = realtimeClient("")
    .then((nextClient) => privateChannel(nextClient, "class:handoff"))
    .then((channel) => { entered = true; return channel; });
  try {
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(entered, false, "a new screen must wait for the old subscription to leave");
    finishRemoval();
    await leaving;
    assert.notEqual(await entering, oldChannel, "the new screen needs a fresh channel, not the one being removed");
  } finally {
    finishRemoval();
    await leaving;
    await entering;
    await client.removeAllChannels();
    forgetRealtimeClient();
  }
});
