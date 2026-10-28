"use client";

import { useEffect, useRef, useState } from "react";
import { matchesActivityOutput } from "../backend/src/module-activities";
import { buildPreview, webRunResult, type ConsoleMessage, type PageMessage, type PreviewFile } from "./webPreview";

export type WebRunResult = ReturnType<typeof webRunResult>;

const WRAPPER = "codeshare-run.html";

// Runs a web module step in the sandboxed preview (no allow-same-origin). The page reports its text and
// console lines by postMessage; only messages from this hook's own frame are accepted.
export function useWebPageRun() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [page, setPage] = useState<{ html: string; run: number } | null>(null);
  const pending = useRef<{ lines: string[]; errors: string[]; finish: (loaded?: PageMessage) => void } | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const current = pending.current, message = event.data as ConsoleMessage | PageMessage;
      if (!current || event.source !== frame.current?.contentWindow) return;
      if (message?.codeshare === "console" && typeof message.text === "string") {
        if (message.uncaught) current.errors.push(message.text);
        else if (message.kind !== "alert") current.lines.push(message.text);
      }
      if (message?.codeshare === "page" && typeof message.title === "string" && typeof message.text === "string") current.finish(message);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  // A .js run file compares console lines on an empty page; anything else compares the page text.
  const run = (files: PreviewFile[], runPath = "index.html") => new Promise<WebRunResult>((resolve) => {
    const mode = runPath.endsWith(".js") ? "console" : "page";
    const preview = mode === "console"
      ? buildPreview([...files, { path: WRAPPER, content: `<!doctype html><html><head></head><body><script src="${runPath.replace(/[^\w./-]/g, "")}"></script></body></html>` }], WRAPPER)
      : buildPreview(files, runPath);
    if (!preview.html) { resolve({ mode, success: false, output: "", error: preview.warnings[0] }); return; }
    const timer = setTimeout(() => pending.current?.finish(), 5000);
    pending.current = { lines: [], errors: [], finish: (page) => {
      clearTimeout(timer);
      const { lines, errors } = pending.current!;
      pending.current = null;
      resolve(webRunResult(mode, { lines, errors, page }));
    } };
    setPage((current) => ({ html: preview.html, run: (current?.run ?? 0) + 1 }));
  });

  // Keep the new page on screen: a frame that never draws cannot report its page text.
  const view = page ? <iframe key={page.run} ref={(element) => { frame.current = element; element?.scrollIntoView({ block: "nearest" }); }} title="Web page preview" sandbox="allow-scripts" srcDoc={page.html} /> : null;
  return { run, view };
}

// One line per check, so later checks (page elements, media) add lines without a redesign.
export function WebCheckList({ result, expected, teacherChecked = false }: { result: WebRunResult | null; expected: string; teacherChecked?: boolean }) {
  if (teacherChecked) return <div className="web-checks" role="status"><p>Checked by your teacher for now</p></div>;
  if (!result) return null;
  const checks = [{ label: result.mode === "console" ? "Console output matches" : "Page text matches", passed: matchesActivityOutput(result, expected) }];
  return <div className="web-checks" role="status">
    <ul>{checks.map((check) => <li key={check.label} className={check.passed ? "passed" : "failed"}><span aria-hidden="true">{check.passed ? "✓" : "✗"}</span> {check.label}</li>)}</ul>
    {result.error && <p role="alert">{result.error}</p>}
    {checks.some((check) => !check.passed) && <div className="web-check-compare">
      <div><b>Required output</b><pre>{expected}</pre></div>
      <div><b>Your output</b><pre aria-label="Your output">{result.output}</pre></div>
    </div>}
  </div>;
}
