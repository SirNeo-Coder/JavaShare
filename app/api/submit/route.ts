import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as { teamId?: string; code?: string };
  if (!body.teamId || typeof body.code !== "string" || body.code.length > 100_000) {
    return Response.json({ error: "Invalid submission" }, { status: 400 });
  }
  const user = request.headers.get("oai-authenticated-user-email") ?? "local-teacher@javashare.dev";
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, code TEXT NOT NULL, submitted_by TEXT NOT NULL, submitted_at INTEGER NOT NULL, feedback TEXT)").run();
  const submittedAt = Date.now();
  await env.DB.prepare("INSERT INTO submissions (id, team_id, code, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), body.teamId, body.code, user, submittedAt).run();
  return Response.json({ submittedAt, submittedBy: user });
}
