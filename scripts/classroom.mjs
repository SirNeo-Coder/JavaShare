import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";

function preferredLanAddress() {
  const candidates = Object.entries(networkInterfaces()).flatMap(([name, addresses]) =>
    (addresses ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => ({ name, address: address.address })),
  );
  const score = ({ name, address }) => {
    if (/wsl|vethernet|hyper-v|docker|vmware|virtualbox|bluetooth/i.test(name)) return 100;
    if (/wi-?fi|wireless/i.test(name)) return 0;
    if (/ethernet/i.test(name)) return 1;
    if (address.startsWith("192.168.")) return 2;
    if (address.startsWith("10.")) return 3;
    if (address.startsWith("172.")) return 4;
    return 10;
  };
  candidates.sort((left, right) => score(left) - score(right));
  return candidates[0]?.address ?? "127.0.0.1";
}

const lanAddress = preferredLanAddress();
const services = new Map();
const logDirectory = resolve("logs");
mkdirSync(logDirectory, { recursive: true });
const logPath = resolve(logDirectory, "classroom.log");
const logFile = createWriteStream(logPath, { flags: "a" });

function log(message, stream = process.stdout) {
  const line = `[${new Date().toISOString()}] ${message}`;
  stream.write(`${line}\n`);
  logFile.write(`${line}\n`);
}

function relay(prefix, chunk, stream) {
  const output = chunk.toString();
  stream.write(output);
  for (const line of output.split(/\r?\n/).filter(Boolean)) logFile.write(`[${new Date().toISOString()}] [${prefix}] ${line}\n`);
}

function start(name, command, args, cwd = process.cwd(), nodeEnv = "production") {
  const service = services.get(name) ?? { name, command, args, cwd, nodeEnv, child: null, restartTimer: null, healthFailures: 0 };
  services.set(name, service);
  service.command = command;
  service.args = args;
  service.cwd = cwd;
  service.nodeEnv = nodeEnv;
  const child = spawn(command, args, { cwd, stdio: ["inherit", "pipe", "pipe"], env: { ...process.env, NODE_ENV: nodeEnv } });
  service.child = child;
  child.stdout.on("data", (chunk) => relay(name, chunk, process.stdout));
  child.stderr.on("data", (chunk) => relay(name, chunk, process.stderr));
  child.on("error", (error) => log(`${name} failed to start: ${error.stack || error.message}`, process.stderr));
  child.on("exit", (code, signal) => {
    if (service.child === child) service.child = null;
    if (stopping) return;
    log(`${name} stopped unexpectedly (exit code: ${code ?? "none"}, signal: ${signal ?? "none"})`, process.stderr);
    log(`Restarting ${name} in 2 seconds…`, process.stderr);
    service.restartTimer = setTimeout(() => {
      service.restartTimer = null;
      if (!stopping) start(service.name, service.command, service.args, service.cwd, service.nodeEnv);
    }, 2000);
  });
  return child;
}

let stopping = false;
let healthTimer;
function stop() {
  stopping = true;
  if (healthTimer) clearInterval(healthTimer);
  for (const service of services.values()) {
    if (service.restartTimer) clearTimeout(service.restartTimer);
    if (service.child && service.child.exitCode === null) service.child.kill("SIGTERM");
  }
}

process.on("uncaughtException", (error) => {
  log(`Classroom launcher crashed: ${error.stack || error.message}`, process.stderr);
  stop();
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  log(`Unhandled launcher rejection: ${reason instanceof Error ? reason.stack || reason.message : String(reason)}`, process.stderr);
  stop();
  process.exit(1);
});

async function waitForUrl(url, serviceName) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The backend process is still starting.
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`JavaShare ${serviceName} did not become ready within 30 seconds`);
}

async function urlIsReady(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

let checkingHealth = false;
async function checkServiceHealth() {
  if (checkingHealth || stopping) return;
  checkingHealth = true;
  try {
    for (const [name, url] of [["backend", "http://127.0.0.1:4000/api/health"], ["frontend", "http://127.0.0.1:3000"]]) {
      const service = services.get(name);
      if (!service?.child || service.child.exitCode !== null) continue;
      if (await urlIsReady(url)) {
        if (service.healthFailures > 0) log(`${name} health check recovered`);
        service.healthFailures = 0;
        continue;
      }
      service.healthFailures += 1;
      log(`${name} health check failed (${service.healthFailures}/3)`, process.stderr);
      if (service.healthFailures >= 3) {
        service.healthFailures = 0;
        log(`${name} is unresponsive; restarting it now`, process.stderr);
        service.child.kill("SIGTERM");
      }
    }
  } finally {
    checkingHealth = false;
  }
}

function openClassroom(url) {
  if (process.platform !== "win32") return;

  const chromeLocations = [
    resolve(process.env.PROGRAMFILES ?? "", "Google/Chrome/Application/chrome.exe"),
    resolve(process.env["PROGRAMFILES(X86)"] ?? "", "Google/Chrome/Application/chrome.exe"),
    resolve(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
  ];
  const chrome = chromeLocations.find(existsSync);
  const browser = chrome
    ? spawn(chrome, ["--new-window", url], { detached: true, stdio: "ignore", windowsHide: false })
    : spawn("cmd.exe", ["/d", "/s", "/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true });
  browser.unref();
}

log("Starting JavaShare classroom mode");
const existingBackend = await urlIsReady("http://127.0.0.1:4000/api/health");
const existingFrontend = await urlIsReady("http://127.0.0.1:3000");
if (existingBackend && existingFrontend) {
  log("JavaShare is already running; reusing the existing classroom instance");
  console.log(`Teacher and students open: http://${lanAddress}:3000`);
  console.log(`Persistent log:            ${logPath}`);
  await new Promise((resolveClosed) => logFile.end(resolveClosed));
} else if (existingBackend || existingFrontend) {
  const occupied = [existingFrontend ? "3000 (frontend)" : "", existingBackend ? "4000 (backend)" : ""].filter(Boolean).join(" and ");
  throw new Error(`A partial JavaShare instance is still using port ${occupied}. Close the previous classroom process, then run npm run classroom again.`);
} else {
  // The LAN backend uses HTTP, so keep development cookie settings (Secure=false).
  start("backend", process.execPath, [resolve("backend/dist/server.js")], resolve("backend"), "development");
  await waitForUrl("http://127.0.0.1:4000/api/health", "backend");
  start("frontend", process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "0.0.0.0", "--port", "3000"]);
  await waitForUrl("http://127.0.0.1:3000", "frontend");
  healthTimer = setInterval(() => { void checkServiceHealth(); }, 10000);
  openClassroom("http://127.0.0.1:3000");

  process.on("SIGINT", () => { stop(); process.exit(0); });
  process.on("SIGTERM", () => { stop(); process.exit(0); });

  console.log("");
  console.log("JavaShare classroom mode (no development hot reload)");
  console.log(`Teacher and students open: http://${lanAddress}:3000`);
  console.log(`Health check:              http://${lanAddress}:3000/api/health`);
  console.log("Automatic recovery:        monitoring every 10 seconds");
  console.log(`Persistent log:            ${logPath}`);
  console.log("");
}
