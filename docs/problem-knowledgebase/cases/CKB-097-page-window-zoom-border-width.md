# CKB-097 — A border's width reads less than written in the page window (it follows the text-size zoom)

- Status: open; worked around in the teacher's Resume Week 6 content (2026-11-09: no page check reads a border width); app
  fix not approved yet
- First recorded: 2026-11-09
- Last verified: 2026-11-09 (real app on Cloudflare's runtime, port 8787, and CodeShare's own `buildTeacherPreview` in a
  sandboxed `srcdoc` frame inside a zoomed body; Chromium)
- Area: `app/globals.css` (`body { zoom: var(--ui-scale) }`, `--ui-scale` 1.15 by default, 1 to 1.45 from the text-size
  setting in `app/page.tsx` and `app/teacher/page.tsx`); the page window's frame in `app/WebStepRun.tsx` sits inside it
- Search terms: border-bottom-width found 1.73913px, border width 0.869565px, page check border fails in CodeShare but passes
  in the teacher's checker, sample NOT verified Week 6 Step 1, box model page check, zoom, text size, ui-scale

## Symptom

Resume Week 6 Step 1 checked `h2` `border-bottom-width` `2px`. The teacher's checker (a page opened at 100%) read `2px`, but
in CodeShare's page window the same page read `1.73913px`, so the unchanged sample showed **✗ h2 has border-bottom-width:
2px — found 1.73913px** and was never verified (student walk and teacher preview with media, Cloudflare's runtime). The
Week 6 personal subtest read `1.73913px` for its own 2px h2 line too. Padding, margins, widths and every other value matched.

## Root cause

CodeShare zooms its whole screen by the text-size setting (`body { zoom: var(--ui-scale) }`), and the page window's frame is
inside that body, so the student's page is drawn at 115% (or 100–145%). Chromium draws a border in whole screen dots and
rounds the width down, then reports it back in CSS pixels: 2px × 1.15 = 2.3 dots → 2 dots → 2 ÷ 1.15 = 1.73913px. Measured
in the preview frame inside a zoomed body (screen 1× and 2× alike):

| Zoom | 1px border | 2px border | 3px border | padding 0.25em on 24px | margin 1.5em on 24px |
| --- | --- | --- | --- | --- | --- |
| 1 | 1px | 2px | 3px | 6px | 36px |
| 1.15 (default) | 0.869565px | 1.73913px | 2.6087px | 6px | 36px |
| 1.25 | 0.8px | 1.6px | 2.4px | 6px | 36px |
| 1.45 | 0.689655px | 1.37931px | 2.75862px | 6px | 36px |

So a border-width page check depends on each viewer's text-size setting: no single expected value works.

## Durable solution

Content (done): no Resume Week 6 page check reads a border width (`border-*-width`, the `border` shorthands, `outline`);
borders are checked by style and colour. The module says why (p. 3, "Sizes that follow the window or the zoom"); its
practice note and problem guide use `border-bottom-style` `none` for a border with no style. The teacher's
`Resume/Week_06/test_checker.py` (`test_no_page_check_on_a_border_width_ckb_097`) fails if a step checks a border width.

App (not done, needs approval): either draw the page window at 100% whatever the text size (undo the zoom on the frame), or
have page checks compare a border width with a small tolerance. The first changes how pages look to students; the second
changes the check rule. Ask the teacher before choosing.

## Regression proof

- Cloudflare's runtime (8787), `tests/web-module-steps.browser.mjs` with Step 1's `border-bottom-width` check: the media
  subtest failed (`dotnet-1-r06-d1-s1: fail — h2 has border-bottom-width: 2px — found 1.73913px`), the student walk stopped
  (`sample NOT verified — ✗ h2 has border-bottom-width: 2px — found 1.73913px`, 46 of 54 lines), and the Week 6 personal
  subtest failed (`'1.73913px'` against `'2px'`). Without width checks, see the Week 6 results in the web-module-steps
  handoff.
- The content guard was shown failing: with Step 1's `border-bottom-width` check put back in memory,
  `test_no_page_check_on_a_border_width_ckb_097` failed; with the real JSON it passed.

## Recurrence triage

If a box-model page check passes in the teacher's checker but CodeShare finds a slightly smaller width, look for a border
width: CodeShare's page window is zoomed. Check the border's style and colour instead.
