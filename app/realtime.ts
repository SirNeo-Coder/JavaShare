// Live features (typing, cursors, chat signals, live share, who's online) over Supabase Realtime.
// The CodeShare server signs a one-hour pass for the signed-in user (GET /api/realtime/pass);
// private channels "team:<id>" and "class:<id>" are guarded by policies in
// supabase/migrations/20261016000200_realtime_private_channels.sql.
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

type Pass = { token: string; expiresAt: number; url: string; anonKey: string };

let clientPromise: Promise<SupabaseClient> | null = null;
let channelCleanup = Promise.resolve();

// Offline, the server knows local Supabase as 127.0.0.1; classroom devices must use the laptop's address.
export function browserReachableUrl(url: string, pageHostname: string) {
  const parsed = new URL(url);
  if (["127.0.0.1", "localhost", "0.0.0.0"].includes(parsed.hostname) && !["127.0.0.1", "localhost"].includes(pageHostname)) {
    parsed.hostname = pageHostname;
  }
  return parsed.toString().replace(/\/$/, "");
}

async function fetchPass(apiUrl: string): Promise<Pass> {
  const response = await fetch(`${apiUrl}/api/realtime/pass`, { credentials: "include" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error || "Live connection unavailable");
  return body as Pass;
}

function schedulePassRenewal(client: SupabaseClient, apiUrl: string, expiresAt: number) {
  // Renew five minutes before the pass expires; retry in a minute if the server is unreachable.
  const delay = Math.max(60_000, expiresAt - Date.now() - 5 * 60_000);
  setTimeout(async () => {
    try {
      const pass = await fetchPass(apiUrl);
      await client.realtime.setAuth(pass.token);
      schedulePassRenewal(client, apiUrl, pass.expiresAt);
    } catch {
      schedulePassRenewal(client, apiUrl, Date.now() + 6 * 60_000);
    }
  }, delay);
}

export function realtimeClient(apiUrl: string) {
  clientPromise ??= fetchPass(apiUrl).then(async (pass) => {
    const client = createClient(browserReachableUrl(pass.url, window.location.hostname), pass.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await client.realtime.setAuth(pass.token);
    schedulePassRenewal(client, apiUrl, pass.expiresAt);
    return client;
  }).catch((error) => {
    clientPromise = null;
    throw error;
  });
  return clientPromise.then(async (client) => {
    // The SDK reuses a channel with the same topic; finish leaving the previous screen first.
    await channelCleanup;
    return client;
  });
}

export function releaseRealtimeChannels(client: SupabaseClient, channels: RealtimeChannel[]) {
  channelCleanup = channelCleanup.then(async () => {
    await Promise.all(channels.map((channel) => client.removeChannel(channel)));
  }).catch(() => undefined);
  return channelCleanup;
}

export function forgetRealtimeClient() {
  void clientPromise?.then((client) => client.removeAllChannels());
  clientPromise = null;
}

export function privateChannel(client: SupabaseClient, topic: string, presenceKey?: string): RealtimeChannel {
  return client.channel(topic, {
    config: { private: true, broadcast: { self: false }, ...(presenceKey ? { presence: { key: presenceKey } } : {}) },
  });
}

// Runs fn at most once per `ms`, always with the newest call's arguments (the last call is never lost).
export function throttle<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: A | null = null;
  const run = () => {
    timer = null;
    last = Date.now();
    const args = pending!;
    pending = null;
    fn(...args);
  };
  return (...args: A) => {
    pending = args;
    if (timer) return;
    const wait = last + ms - Date.now();
    if (wait <= 0) run();
    else timer = setTimeout(run, wait);
  };
}

// Approved caps (2026-10-16), the same online and offline.
export const LIVE_CAPS = { typingMs: 1000 / 3, cursorMs: 1000 / 4, liveShareMs: 1000 / 2 };
