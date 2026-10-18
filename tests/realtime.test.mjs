// Run with: npm test
// The policy checks need local Supabase running (npx supabase start); they are skipped otherwise.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { browserReachableUrl, throttle } from "../app/realtime.ts";

test("offline: classroom devices reach local Supabase through the laptop's address", () => {
  assert.equal(browserReachableUrl("http://127.0.0.1:54321", "192.168.0.113"), "http://192.168.0.113:54321");
  assert.equal(browserReachableUrl("http://127.0.0.1:54321", "localhost"), "http://127.0.0.1:54321");
  assert.equal(browserReachableUrl("https://abc.supabase.co", "codeshare.example.org"), "https://abc.supabase.co");
});

test("throttle sends at most once per interval and never drops the newest value", async () => {
  const sent = [];
  const send = throttle((value) => sent.push(value), 50);
  send(1); send(2); send(3);
  assert.deepEqual(sent, [1]);
  await new Promise((resolve) => setTimeout(resolve, 80));
  assert.deepEqual(sent, [1, 3]);
});

function localSupabase() {
  try {
    const output = execFileSync("npx", ["supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const env = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
    return env.API_URL && env.JWT_SECRET ? env : null;
  } catch {
    return null;
  }
}

const local = localSupabase();
const pass = (sub) => new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(sub).setAudience("authenticated").setExpirationTime("10m").sign(new TextEncoder().encode(local.JWT_SECRET));
test("channel rules: members join, outsiders are refused, only the teacher broadcasts to the class", { skip: !local && "local Supabase is not running" }, async () => {
  const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const password = randomUUID();
  const made = [];
  const user = async (name) => {
    const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@realtime-test.example.test`, password, email_confirm: true, user_metadata: { name } });
    if (error) throw error;
    made.push(data.user.id);
    return data.user.id;
  };
  const [teacher, student, outsider] = [await user("Policy Teacher"), await user("Policy Student"), await user("Policy Outsider")];
  await admin.from("profiles").update({ role: "teacher" }).eq("id", teacher);
  const { data: classroom } = await admin.from("classrooms").insert({ name: "Policy test", join_code: `P${Date.now()}`.slice(0, 12).toUpperCase(), teacher_id: teacher }).select("id").single();
  await admin.from("classroom_members").insert([{ classroom_id: classroom.id, user_id: teacher }, { classroom_id: classroom.id, user_id: student }]);
  const { data: team } = await admin.from("teams").insert({ classroom_id: classroom.id, owner_id: student, slug: `student-${student}`, name: "Policy team" }).select("id").single();
  await admin.from("team_members").insert({ team_id: team.id, user_id: student });
  const clients = [];
  const join = (sub, topic) => new Promise(async (resolve) => {
    const client = createClient(local.API_URL, local.ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    clients.push(client);
    client.realtime.setAuth(await pass(sub));
    const channel = client.channel(topic, { config: { private: true, broadcast: { self: false } } });
    const received = [];
    channel.on("broadcast", { event: "*" }, (message) => received.push(message.event));
    channel.subscribe((status) => { if (status !== "JOINING") resolve({ channel, status, received }); });
    setTimeout(() => resolve({ channel, status: "TIMEOUT", received }), 8000);
  });
  try {
    const studentTeam = await join(student, `team:${team.id}`);
    const studentClass = await join(student, `class:${classroom.id}`);
    const teacherTeam = await join(teacher, `team:${team.id}`);
    const teacherClass = await join(teacher, `class:${classroom.id}`);
    assert.equal(studentTeam.status, "SUBSCRIBED");
    assert.equal(studentClass.status, "SUBSCRIBED");
    assert.equal(teacherTeam.status, "SUBSCRIBED");
    assert.equal((await join(outsider, `team:${team.id}`)).status, "CHANNEL_ERROR");
    assert.equal((await join(outsider, `class:${classroom.id}`)).status, "CHANNEL_ERROR");
    await teacherClass.channel.send({ type: "broadcast", event: "teacher-to-class", payload: {} });
    await studentClass.channel.send({ type: "broadcast", event: "student-to-class", payload: {} });
    await studentTeam.channel.send({ type: "broadcast", event: "student-to-team", payload: {} });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    assert.deepEqual(studentClass.received, ["teacher-to-class"]);
    assert.deepEqual(teacherClass.received, [], "a student must not broadcast on the class channel");
    assert.deepEqual(teacherTeam.received, ["student-to-team"]);
  } finally {
    for (const client of clients) await client.removeAllChannels();
    await admin.from("classrooms").delete().eq("id", classroom.id);
    for (const id of made) await admin.auth.admin.deleteUser(id);
  }
});

test("browser pass cannot read tables directly", { skip: !local && "local Supabase is not running" }, async () => {
  const token = await pass(randomUUID());
  const response = await fetch(`${local.API_URL}/rest/v1/profiles?select=id&limit=1`, { headers: { apikey: local.ANON_KEY, Authorization: `Bearer ${token}` } });
  const body = await response.json();
  assert.equal(response.status, 403, "expected permission denied for direct table access");
  assert.equal(body.code, "42501");
});
