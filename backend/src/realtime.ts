import jwt from "jsonwebtoken";

// Sends a live message to everyone on a private channel ("team:<id>" or "class:<id>").
// Uses the service-role key, so it bypasses the channel policies; never awaited by callers
// because a missed live signal must not fail the save or request that caused it.
export function broadcast(topic: string, event: string, payload: unknown = {}) {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return;
  void fetch(`${url.replace(/\/$/, "")}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ topic, event, payload, private: true }] }),
  }).then((response) => {
    if (!response.ok) console.error(`Realtime broadcast ${event} to ${topic} failed: ${response.status}`);
  }).catch((error) => console.error(`Realtime broadcast ${event} to ${topic} failed:`, error instanceof Error ? error.message : error));
}

// A one-hour pass that lets the browser join only the live channels its policies allow.
export function realtimePass(userId: string) {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!secret || !url || !anonKey) return null;
  const expiresIn = 3600;
  const token = jwt.sign({ sub: userId, role: "authenticated", aud: "authenticated" }, secret, { expiresIn });
  return { token, expiresAt: Date.now() + expiresIn * 1000, url, anonKey };
}
