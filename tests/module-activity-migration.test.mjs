import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
let container;
try { container = execFileSync("docker", ["ps", "--format", "{{.Names}}"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).split("\n").find((name) => name.startsWith("supabase_db_")); } catch { /* Local integration checks report the unavailable prerequisite. */ }

test("module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers", { skip: !container && "local Supabase Docker database is not running" }, () => {
  const db = `sample_history_${randomUUID().replaceAll("-", "")}`;
  const sql = (query, database = db) => execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-tA"], { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  sql(`create database ${db};`, "postgres");
  try {
    sql(`create table public.module_progress (id int primary key, project_files jsonb, step_states jsonb, performance_task jsonb);
      insert into public.module_progress values (1, '[{"path":"Main.java","content":"student draft"}]', '{"task:old":"pass"}', '{"own":{"files":[{"path":"Main.java","content":"submitted version"}],"status":"pass"}}');`);
    const before = JSON.parse(sql("select to_jsonb(p) from public.module_progress p;"));
    const migration = readFileSync(new URL("../supabase/migrations/20261021000100_module_activity_projects.sql", import.meta.url), "utf8");
    sql(migration); sql(migration);
    const after = JSON.parse(sql("select to_jsonb(p) from public.module_progress p;"));
    assert.deepEqual(after, { ...before, activity_projects: {} });
    assert.deepEqual(JSON.parse(sql("select project_files from public.module_progress where id=1;")), before.project_files, "rolling back to an older reader leaves the old shape intact");
    assert.throws(() => sql("update public.module_progress set activity_projects='[]'::jsonb where id=1;"), /check constraint/);
  } finally { sql(`drop database ${db};`, "postgres"); }
});
