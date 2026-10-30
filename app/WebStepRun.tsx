"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { matchesActivityOutput, mediaCheckLines, webCheckLines, type MediaCheck, type WebCheck } from "../backend/src/module-activities";
import { embedMedia, projectPath, webRunResult, type ConsoleMessage, type PageMessage, type PreviewFile } from "./webPreview";
import { buildTeacherPreview } from "./teacherWebPreview";

export type WebRunResult = ReturnType<typeof webRunResult>;

const WRAPPER = "codeshare-run.html";

type OpenMessage = { codeshare: "open"; from: string; href: string };
type ShownPage = { html: string; run: number; path: string; files: PreviewFile[]; note?: string };

// A clicked link shows that page of the project in the window, or a note saying why it cannot.
function openLink(page: ShownPage, from: string, href: string): ShownPage {
  const path = projectPath(from, href);
  if (path === null) return { ...page, note: "Links outside this project do not open in CodeShare." };
  if (!path.endsWith(".html") || !page.files.some((file) => file.path === path)) return { ...page, note: `This project has no page named ${path}.` };
  return { html: buildTeacherPreview(page.files, path, [], false, true).html, run: page.run + 1, path, files: page.files };
}

// Runs a web module step in the sandboxed preview (no allow-same-origin) and shows the page in a floating
// window (2026-10-30). The page reports its text and console lines by postMessage; only messages from this
// hook's own frame are accepted. Links and frames open the project's own pages, never the internet.
// busy: the screen's own run flag, true until its check, device save and completion sync finish.
export function useWebPageRun(busy: boolean) {
  const frame = useRef<HTMLIFrameElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [page, setPage] = useState<ShownPage | null>(null);
  const [open, setOpen] = useState(false);
  const pending = useRef<{ lines: string[]; errors: string[]; finish: (loaded?: PageMessage) => void } | null>(null);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const current = pending.current, message = event.data as ConsoleMessage | PageMessage | OpenMessage;
      if (event.source !== frame.current?.contentWindow) return;
      if (message?.codeshare === "open") {
        if (!current && typeof message.from === "string" && typeof message.href === "string") setPage((shownPage) => shownPage && openLink(shownPage, message.from, message.href));
        return;
      }
      if (!current) return;
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
  // media: a media step's module media files (path -> data: URL) and its includeMediaOutput.
  const run = (files: PreviewFile[], runPath = "index.html", checks: WebCheck[] = [], media?: { files: Record<string, string>; include: boolean }) => new Promise<WebRunResult>((resolve) => {
    const mode = runPath.endsWith(".js") ? "console" : "page";
    if (media) files = embedMedia(files, media.files);
    // The no-internet policy matches the course-building checker, which also blocks the internet.
    const preview = mode === "console"
      ? buildTeacherPreview([...files, { path: WRAPPER, content: `<!doctype html><html><head></head><body><script src="${runPath.replace(/[^\w./-]/g, "")}"></script></body></html>` }], WRAPPER, checks, Boolean(media))
      : buildTeacherPreview(files, runPath, checks, Boolean(media), true);
    if (!preview.html) { resolve({ mode, success: false, output: "", checks: [], media: [], error: preview.warnings[0] }); return; }
    const timer = setTimeout(() => pending.current?.finish(), 5000);
    pending.current = { lines: [], errors: [], finish: (page) => {
      clearTimeout(timer);
      const { lines, errors } = pending.current!;
      pending.current = null;
      resolve(webRunResult(mode, { lines, errors, page }, media?.include));
    } };
    setPage((current) => ({ html: preview.html, run: (current?.run ?? 0) + 1, path: runPath, files }));
    setOpen(true);
  });

  // The window closes with Close, Esc or a click beside it, but only once the run has been checked and synced.
  // Close gets focus a frame later, after the RUN CODE box has handed focus back.
  const shown = Boolean(page && open && !busy);
  useEffect(() => {
    if (!shown) return;
    const focus = requestAnimationFrame(() => closeButton.current?.focus());
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); } };
    document.addEventListener("keydown", close, true);
    return () => { cancelAnimationFrame(focus); document.removeEventListener("keydown", close, true); };
  }, [shown]);

  // The window is placed on document.body, so a drawer's transform cannot shrink it.
  // Keep the page on screen while it runs: a frame that never draws cannot report its page text (CKB-075).
  // allow="autoplay": Chrome refuses even muted sound in a sandboxed frame without it, so the media test
  // could never hear audio play (CKB-079). The frame stays sandboxed without allow-same-origin.
  const pageWindow = (results: ReactNode) => page && open ? createPortal(<div className="page-window-overlay" onMouseDown={(event) => { if (!busy && event.target === event.currentTarget) setOpen(false); }}>
    <section className="page-window" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header><div><span className="eyebrow">YOUR PAGE</span><h2 id={titleId}>{page.path}</h2></div>
        <button ref={closeButton} type="button" disabled={busy} onClick={() => setOpen(false)}>Close</button></header>
      {page.note && <p className="page-window-note" role="status">{page.note}</p>}
      <div className="module-web-preview"><iframe key={page.run} ref={frame} title="Web page preview" sandbox="allow-scripts" allow="autoplay" srcDoc={page.html} /></div>
      {results && <div className="page-window-results">{results}</div>}
    </section>
  </div>, document.body) : null;
  return { run, opened: Boolean(page && open), show: page && !open ? () => setOpen(true) : undefined, pageWindow };
}

// One line per check: the output, each page-element check, then each picture, sound or video on a media step.
export function WebCheckList({ result, expected, teacherChecked = false, webChecks, mediaChecks }: {
  result: WebRunResult | null; expected: string; teacherChecked?: boolean; webChecks?: WebCheck[]; mediaChecks?: MediaCheck[];
}) {
  if (teacherChecked) return <div className="web-checks" role="status"><p>Checked by your teacher for now</p></div>;
  if (!result) return null;
  const outputPassed = matchesActivityOutput(result, expected);
  const checks = [{ label: result.mode === "console" ? "Console output matches" : "Page text matches", passed: outputPassed, found: "" }, ...webCheckLines(webChecks, result.checks), ...(mediaChecks ? mediaCheckLines(mediaChecks, result.media) : [])];
  return <div className="web-checks" role="status">
    <ul>{checks.map((check, index) => <li key={index} className={check.passed ? "passed" : "failed"}><span aria-hidden="true">{check.passed ? "✓" : "✗"}</span> {check.label}{check.found && ` — found ${check.found}`}</li>)}</ul>
    {result.error && <p role="alert">{result.error}</p>}
    {!outputPassed && <div className="web-check-compare">
      <div><b>Required output</b><pre>{expected}</pre></div>
      <div><b>Your output</b><pre aria-label="Your output">{result.output}</pre></div>
    </div>}
  </div>;
}
