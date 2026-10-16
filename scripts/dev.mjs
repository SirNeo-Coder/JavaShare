import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { networkInterfaces } from "node:os";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

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
// Development mode: one Next.js dev server for the pages and the /api routes.
// Server settings come from backend/.env (the same file the old standalone server used).
if (existsSync(resolve("backend", ".env"))) loadEnvFile(resolve("backend", ".env"));
process.env.CODESHARE_LAPTOP = "true";
const children = [];

const frontend = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "dev", "--hostname", "0.0.0.0"], {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});
children.push(frontend);

let opened = false;
function openBrowser(url) {
  if (opened) return;
  opened = true;
  if (process.platform === "win32") {
    const paths = [resolve(process.env.PROGRAMFILES ?? "", "Google/Chrome/Application/chrome.exe"), resolve(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe")];
    const chrome = paths.find(existsSync);
    const browser = chrome ? spawn(chrome, [url], { detached: true, stdio: "ignore" }) : spawn("cmd.exe", ["/c", "start", "", url], { detached: true, stdio: "ignore" });
    browser.unref();
  }
}

function relay(chunk, destination) {
  const output = chunk.toString();
  destination.write(output);
  const match = output.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/?/);
  if (match) openBrowser(match[0]);
}
frontend.stdout.on("data", (chunk) => relay(chunk, process.stdout));
frontend.stderr.on("data", (chunk) => relay(chunk, process.stderr));

function stop() { for (const child of children) child.kill("SIGTERM"); }
process.on("SIGINT", () => { stop(); process.exit(0); });
process.on("SIGTERM", () => { stop(); process.exit(0); });
frontend.on("exit", (code) => { stop(); process.exit(code ?? 0); });

console.log(`CodeShare on the network: http://${lanAddress}:3000`);
