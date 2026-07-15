import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const action = process.argv[2] ?? "dev";

const child = spawn(process.execPath, [resolve("node_modules/vinext/dist/cli.js"), action], {
  stdio: action === "dev" ? ["inherit", "pipe", "pipe"] : "inherit",
  env: {
    ...process.env,
    WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
  },
});

let browserOpened = false;

function openInChrome(url) {
  if (browserOpened) return;
  browserOpened = true;

  let command;
  let args;

  if (process.platform === "win32") {
    const chromePaths = [
      resolve(process.env.PROGRAMFILES ?? "", "Google/Chrome/Application/chrome.exe"),
      resolve(process.env["PROGRAMFILES(X86)"] ?? "", "Google/Chrome/Application/chrome.exe"),
      resolve(process.env.LOCALAPPDATA ?? "", "Google/Chrome/Application/chrome.exe"),
    ];
    const chrome = chromePaths.find(existsSync);
    command = chrome ?? "cmd.exe";
    args = chrome ? [url] : ["/c", "start", "", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = ["-a", "Google Chrome", url];
  } else {
    command = "google-chrome";
    args = [url];
  }

  const browser = spawn(command, args, { detached: true, stdio: "ignore" });
  browser.unref();
}

if (action === "dev") {
  const handleOutput = (chunk, destination) => {
    const text = chunk.toString();
    destination.write(text);
    const match = text.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/?/);
    if (match) openInChrome(match[0]);
  };

  child.stdout.on("data", (chunk) => handleOutput(chunk, process.stdout));
  child.stderr.on("data", (chunk) => handleOutput(chunk, process.stderr));

  // Vinext normally uses port 3000. This also covers terminals that split or
  // decorate the printed URL in a way that prevents output detection.
  setTimeout(() => openInChrome("http://localhost:3000/"), 5000);
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(`Unable to start vinext: ${error.message}`);
  process.exit(1);
});
