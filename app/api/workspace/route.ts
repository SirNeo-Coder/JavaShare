import { env } from "cloudflare:workers";

const DEFAULT_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, JavaShare!");
    }
}`;

function identity(request: Request) {
  return request.headers.get("oai-authenticated-user-email") ?? "local-teacher@javashare.dev";
}

async function ensureSchema() {
  const db = env.DB;
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS classrooms (id TEXT PRIMARY KEY, name TEXT NOT NULL, teacher_email TEXT NOT NULL, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL, name TEXT NOT NULL, created_at INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS workspaces (id TEXT PRIMARY KEY, team_id TEXT NOT NULL UNIQUE, filename TEXT NOT NULL, code TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, team_id TEXT NOT NULL, code TEXT NOT NULL, submitted_by TEXT NOT NULL, submitted_at INTEGER NOT NULL, feedback TEXT)"),
  ]);
}

export async function GET(request: Request) {
  await ensureSchema();
  const teamId = new URL(request.url).searchParams.get("team") ?? "team-orion";
  const result = await env.DB.prepare("SELECT code, version, updated_at, updated_by FROM workspaces WHERE team_id = ?")
    .bind(teamId).first<{ code: string; version: number; updated_at: number; updated_by: string }>();

  if (result) return Response.json(result);

  const now = Date.now();
  await env.DB.prepare("INSERT INTO workspaces (id, team_id, filename, code, version, updated_at, updated_by) VALUES (?, ?, 'Main.java', ?, 1, ?, ?)")
    .bind(crypto.randomUUID(), teamId, DEFAULT_CODE, now, identity(request)).run();
  return Response.json({ code: DEFAULT_CODE, version: 1, updated_at: now, updated_by: identity(request) });
}

export async function PUT(request: Request) {
  await ensureSchema();
  const body = await request.json() as { teamId?: string; code?: string; version?: number };
  if (!body.teamId || typeof body.code !== "string" || body.code.length > 100_000) {
    return Response.json({ error: "Invalid workspace update" }, { status: 400 });
  }

  const now = Date.now();
  const result = await env.DB.prepare("UPDATE workspaces SET code = ?, version = version + 1, updated_at = ?, updated_by = ? WHERE team_id = ? AND version = ?")
    .bind(body.code, now, identity(request), body.teamId, body.version ?? 0).run();

  if (!result.meta.changes) {
    const latest = await env.DB.prepare("SELECT code, version, updated_at, updated_by FROM workspaces WHERE team_id = ?").bind(body.teamId).first();
    return Response.json({ error: "conflict", latest }, { status: 409 });
  }

  return Response.json({ version: (body.version ?? 0) + 1, updated_at: now, updated_by: identity(request) });
}

