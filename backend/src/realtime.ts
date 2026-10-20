import { SignJWT } from "jose";

// Sends a live message to everyone on a private channel ("team:<id>" or "class:<id>").
// Uses the service-role key, so it bypasses the channel policies. Callers must await it before
// replying: Cloudflare stops unfinished work once the reply is sent (CKB-006). It never throws,
// because a missed live signal must not fail the save or request that caused it.
export async function broadcast(topic: string, event: string, payload: unknown = {}) {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return;
  await fetch(`${url.replace(/\/$/, "")}/realtime/v1/api/broadcast`, {
    method: "POST",
    signal: AbortSignal.timeout(3000),
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic, event, payload, private: true }] }),
  }).then((response) => {
    if (!response.ok) console.error(`Realtime broadcast ${event} to ${topic} failed: ${response.status}`);
  }).catch((error) => console.error(`Realtime broadcast ${event} to ${topic} failed:`, error instanceof Error ? error.message : error));
}

// Live access cannot outlast the current sign-in's inactivity deadline.
export async function realtimePass(userId: string, sessionExpiresAt: number) {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!secret || !url || !anonKey) return null;
  const expiresAt = Math.floor(Math.min(Date.now() + 3600000, sessionExpiresAt) / 1000) * 1000;
  const token = await new SignJWT({ role: "authenticated" }).setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId).setAudience("authenticated").setIssuedAt().setExpirationTime(expiresAt / 1000)
    .sign(new TextEncoder().encode(secret));
  return { token, expiresAt, url, anonKey };
}
