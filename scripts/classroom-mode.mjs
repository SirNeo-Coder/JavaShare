import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { resolve } from "node:path";

const mode = process.argv[2];
const checkOnly = process.argv.includes("--check");
const buildOnly = process.argv.includes("--build-only");
if (mode !== "online" && mode !== "offline") {
  console.error("Usage: node scripts/classroom-mode.mjs <online|offline>");
  process.exit(1);
}

const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";
const npx = isWindows ? "npx.cmd" : "npx";
const profilePath = resolve("backend", `.env.${mode}`);
const examplePath = `${profilePath}.example`;

if (existsSync(profilePath)) {
  loadEnvFile(profilePath);
} else if (mode === "online" && existsSync(resolve("backend", ".env"))) {
  console.warn(`Using backend/.env because ${profilePath} does not exist yet.`);
  console.warn(`For permanent separation, copy ${examplePath} to ${profilePath}.`);
  loadEnvFile(resolve("backend", ".env"));
} else if (mode === "offline") {
  process.env.JWT_SECRET ||= "local-javashare-development-secret";
  process.env.FRONTEND_URL ||= "http://localhost:3000";
  process.env.LOCAL_JAVA_EXECUTION ||= "true";
} else {
  console.error(`Missing ${profilePath}`);
  console.error(`Copy ${examplePath} to ${profilePath}, then fill in the private values.`);
  process.exit(1);
}

function run(command, args, capture = false) {
  const executable = isWindows ? (process.env.ComSpec || "cmd.exe") : command;
  const commandArgs = isWindows ? ["/d", "/s", "/c", command, ...args] : args;
  const result = spawnSync(executable, commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return capture ? result.stdout : "";
}

function parseEnvOutput(output) {
  const values = new Map();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|(.*))$/);
    if (match) values.set(match[1], match[2] ?? match[3]?.trim() ?? "");
  }
  return values;
}

if (mode === "offline") {
  process.env.DATABASE_MODE = "supabase-local";
  console.log("Starting local Supabase through Docker...");
  run(npx, ["supabase", "start"]);
  const local = parseEnvOutput(run(npx, ["supabase", "status", "-o", "env"], true));
  process.env.SUPABASE_URL = local.get("API_URL") || local.get("SUPABASE_URL") || "";
  process.env.SUPABASE_ANON_KEY = local.get("ANON_KEY") || local.get("PUBLISHABLE_KEY") || "";
  process.env.SUPABASE_SERVICE_ROLE_KEY = local.get("SERVICE_ROLE_KEY") || local.get("SECRET_KEY") || "";
} else {
  process.env.DATABASE_MODE = "supabase-online";
}

const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required ${mode} setting${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
  process.exit(1);
}
if (checkOnly) {
  console.log(`Supabase ${mode} mode configuration is ready.`);
  process.exit(0);
}

console.log(`Building JavaShare for Supabase ${mode} mode...`);
run(npm, ["run", "build:all"]);
if (buildOnly) {
  console.log(`Supabase ${mode} mode build is ready.`);
  process.exit(0);
}
await import("./classroom.mjs");
