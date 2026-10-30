# CKB-086 — Links and frames in a module web page cannot open the project's other pages

- Status: resolved
- First recorded: 2026-10-30
- Last verified: 2026-10-30
- Area: `app/webPreview.ts` (`captureScript`, `projectPath`, `buildPreview` frames), `app/teacherWebPreview.ts`, `app/WebStepRun.tsx` (page window), `app/useOutsideDismiss.ts`
- Search terms: link does not open, about.html not found, clicking a link shows CodeShare inside the page, iframe blank, frame shows nothing, hyperlinks between pages, Week 3 links and frames, page window, Show page

## Symptom

In a module web step or a personal web project, `<a href="about.html">` did not show the student's own `about.html`, and `<iframe src="about.html">` showed nothing. The web-steps handoff listed both as "Cannot yet", which blocked the course's Week 3 (links, frames, forms).

## Root cause

The page runs from `srcdoc` in a sandboxed frame, so a relative link pointed at a CodeShare address, not at a project file. The no-internet policy (`default-src 'none'`) also blocked framed addresses. The preview never had a way to find another project page.

## Durable solution

- Module previews (`buildTeacherPreview(..., projectPages = true)`, used by `useWebPageRun`) add a link listener to the page: a click on anything but a same-page anchor is sent to CodeShare with the page's own path. CodeShare accepts it only from its own frame, resolves it with `projectPath`, and shows that project page in the same window, or a note ("This project has no page named …", "Links outside this project do not open in CodeShare.").
- `<iframe src="page.html">` of a project page becomes `srcdoc` of that page's preview, on one line so line numbers hold. A framed page keeps its links (passed up through its parent page) but does not expand frames again, so pages framing each other cannot loop.
- The checks still use the step's run file only; looking at other pages never changes a result.
- The page window is placed on `document.body`; `useOutsideDismiss` ignores clicks inside `.page-window-overlay`, so the teacher's worksheet drawer stays open.
- The older **New web project** preview (`buildPreview` without `pages`) is unchanged.

## Regression proof

- `tests/web-module-steps.test.mjs`: "project pages: link and frame addresses resolve inside the project; the internet and mailto: stay outside"; "module previews send link clicks to CodeShare and show project pages in frames; the New web project preview is unchanged".
- `tests/web-sample-first.browser.mjs`: "the page window: links and frames open the project's own pages, nothing comes from the internet, and it stays until the run is checked" (offline settings 3042 and Cloudflare runtime 8787).
- Shown failing: with the link listener switched off, the unit test and the browser test (following About never shows about.html) failed; without the drawer guard the browser test failed at "a click in the window keeps the worksheet open". Both passed again once restored.
- Commit: `f2bb36f` on branch `feature/web-page-window` ([PR #76](https://github.com/SirNeo-Coder/JavaShare/pull/76)).

## Recurrence triage

- Playwright (and the Claude browser pane) cannot aim mouse clicks inside the page frame because CodeShare zooms `body` (`--ui-scale`); the test follows links with the keyboard. A real mouse click was checked by hand at 100 % text size.
- Playwright cannot reach a frame inside the sandboxed page; the test reloads the framed page and reads its own report instead.
- Esc closes the window only when CodeShare has the keyboard; after clicking inside the page, the student's page gets the key. **Close** always works.

## History

- 2026-10-30 — Teacher approved a floating page window with links between project pages, frames of project pages, and the same window in the teacher's module preview.
