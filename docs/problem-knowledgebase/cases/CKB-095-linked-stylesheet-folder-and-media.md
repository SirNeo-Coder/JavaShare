# CKB-095 — A linked stylesheet is found from the top folder and loses its media condition

- Status: open; latent (no Resume week has pages in a subfolder or a `media` attribute on a link line); app fix not approved yet
- First recorded: 2026-11-09 (CodeRabbit on PR #87)
- Last verified: 2026-11-09 (CodeShare's own `buildTeacherPreview` in a sandboxed `srcdoc` frame against a page opened as a
  file, as the teacher's checker does; Chromium)
- Area: `app/webPreview.ts` (`buildPreview`: the `<link…>` match that inlines a project stylesheet)
- Search terms: stylesheet in a subfolder, pages/styles.css, ../styles.css, relative path, media="print", print
  stylesheet applied on screen, style checks differ from the teacher's checker, link rel=stylesheet

## Symptom

Two ways a linked stylesheet behaves differently in CodeShare than in a browser (the teacher's checker):

- A page in a subfolder: `pages/contact.html` with `<link rel="stylesheet" href="styles.css">` and the file
  `pages/styles.css`. A browser applies `pages/styles.css`; CodeShare applies nothing (h1 `rgb(0, 0, 0)` instead of
  `rgb(19, 48, 92)`), or, if the project also has a top-level `styles.css`, applies that one instead.
  `href="../styles.css"` also gives no style in CodeShare.
- A link with a condition: `<link rel="stylesheet" href="styles.css" media="print">`. A browser uses it only for printing;
  CodeShare applies it on screen too, so a `display: none` in it hid a heading in CodeShare that the checker still showed
  ("Hidden on print"): the page text differs.

## Root cause

`buildPreview` looks the stylesheet up with `byPath.get(normalize(href))`: `normalize` only trims a leading `./` or `/`,
so the address is read from the project's top folder, not from the page's folder (frames already use
`projectPath(entry.path, src)` for this). It then replaces the link with a plain `<style>` element and keeps none of the
link's other attributes, so `media` is lost. The `<script src>` match reads its address the same way (not checked).

## Durable solution

Content (done): Resume weeks keep every page and `styles.css` in the project's top folder and put no `media` on a link line
(`docs/course-format.md`, "CSS in page text and page checks"; the rolling weekly prompt says so from Week 5).

App (not done, needs approval): resolve the link's `href` with `projectPath(entry.path, href)` and copy a `media` attribute
onto the `<style>` element, with `buildPreview` unit tests for a page in a subfolder and for `media="print"`.

## Regression proof

- `buildTeacherPreview` against the page opened as a file (2026-11-09): subfolder page → CodeShare h1 `rgb(0, 0, 0)`,
  checker `rgb(19, 48, 92)`; with a different top-level `styles.css` → CodeShare `rgb(46, 125, 50)` (the wrong file);
  `../styles.css` → CodeShare `rgb(0, 0, 0)`; `media="print"` → CodeShare page text lost "Hidden on print", checker kept it.
- No automated test yet (app fix not approved).

## Recurrence triage

If a page's styles differ between CodeShare and a browser, check whether the page or its stylesheet is in a subfolder, and
whether the link line has a `media` attribute.
