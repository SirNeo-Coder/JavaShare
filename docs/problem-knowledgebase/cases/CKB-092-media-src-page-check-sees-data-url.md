# CKB-092 — A page check on a media file's src fails online once the teacher uploads the file

- Status: open; worked around in the teacher's Resume Week 2 content (2026-11-06); app fix proposed, not approved yet
- First recorded: 2026-11-06
- Last verified: 2026-11-06 (Cloudflare's runtime on this laptop, port 8787, local R2)
- Area: `app/webPreview.ts` (`embedMedia`, the capture script's `probe`); `webChecks` with `attribute: "src"` (or a selector such as `img[src=…]`) on `img`, `audio`, `video`, `source`
- Search terms: sample NOT verified, img has src="images/juan_profile.svg" — found data:image/svg+xml;base64, page check src fails online, passes in the teacher's checker, Media files uploaded, Resume Week 2 Step 1

## Symptom

Resume Week 2 Step 1 had the page check `{ "selector": "img", "attribute": "src", "value": "images/juan_profile.svg" }`.
The teacher's checker passed it. On Cloudflare's runtime, after the teacher added the week's media under **Media files**, the
teacher preview and the student's run both showed `✗ img has src="images/juan_profile.svg" — found data:image/svg+xml;base64,…`,
so the sample was never verified and the whole week stayed locked. Steps 3 and 4 (`audio`/`video` src checks) failed the same way.

## Root cause

To show uploaded media in the no-internet preview, `embedMedia` rewrites each matching `src` to a `data:` URL and keeps the
written path in `data-codeshare-src`. The media report reads `data-codeshare-src`, but the page-check probe reads the
attribute it is given (`getAttribute("src")`), so it sees the `data:` URL. The teacher's checker serves real files and sees
the written path. Before media are uploaded (and offline) nothing is rewritten, so the check passes there: the failure only
appears online with media.

## Durable solution

Content (done): a web step does not page-check the `src` of a file the teacher uploads; its `Media checks:` line already names
the exact `src`. Resume Week 2 Steps 1, 3 and 4 dropped those checks; Step 7 keeps its checks of the deliberately wrong names
(never uploaded, so never rewritten).
App (proposed, needs approval): in the capture script's `probe`, read `data-codeshare-src` when the attribute asked for is `src`
and the element has it, so page checks see the written path everywhere. A unit test of `buildPreview` with embedded media
would show the probe reporting the written path.

## Regression proof

- `tests/web-module-steps.browser.mjs` on Cloudflare's runtime (8787): with the `src` page checks, `Week 2 media` failed at
  `dotnet-1-r02-d1-s1` and the student walk stopped there ("sample NOT verified"); without them, 18/18 steps "sample verified,
  task completed" and every Week 2 media sample passed with its media lines.

Same kind of rewrite, read in `app/webPreview.ts` but not run (2026-11-06): an `iframe` showing a project page has its `src`
replaced by `srcdoc`, and `<link rel="stylesheet">`/`<script src>` of project files are inlined, so page checks on those
attributes would also fail online. Week 3 (links, frames) must check this with a real CodeShare run first.

## Recurrence triage

If a media step passes in the teacher's checker and offline but shows a cross on a `src` page check online, look for a
`webChecks` entry (or `[src=…]` selector) naming an uploaded media file.
