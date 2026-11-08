# CKB-093 — A missing quote before an iframe pastes the framed page into the broken text

- Status: open; worked around in the teacher's Resume Week 3 content (2026-11-06); app fix not proposed in detail or approved yet
- First recorded: 2026-11-06
- Last verified: 2026-11-06 (CodeShare's own `buildTeacherPreview` in a sandboxed `srcdoc` frame, Chromium, as the page window runs it; not through the full app screen)
- Area: `app/webPreview.ts` (`buildPreview`: the `<iframe…>` rewrite to `srcdoc`, found with a regular expression); `app/teacherWebPreview.ts`
- Search terms: missing quote, href="contact.html>, iframe, extra text in the page, page text differs from the teacher's checker, Uncaught SyntaxError: Unexpected token '&', Resume Week 3, links and frames, page window

## Symptom

A page whose link lost its closing quote before an iframe of a project page, for example
`<a href="contact.html>Contact</a> … <iframe src="contact.html" …>`, gives different page text in CodeShare and in the
teacher's checker. The teacher's checker (a real browser opening the files) shows only the text before the quote:
`Home | Projects |`. CodeShare shows that line, then the framed page's text (`Home | Projects | Contact`, `Contact Juan`,
…), then a stray `" title="Contact form of Juan Dela Cruz" width="420" height="320">` line, and reports
`Uncaught SyntaxError: Unexpected token '&'`, so the run fails with an uncaught error instead of a plain mismatch.

## Root cause

`buildPreview` finds `<iframe…>` tags with a regular expression over the source text, not with the browser's HTML parser.
Text swallowed by an unclosed attribute value still contains `<iframe src="contact.html" …>`, so the tag is rewritten to
`srcdoc="…framed page…"`. The `srcdoc="` quote then closes the broken `href` value, and the rest of the framed page (whose
`"` became `&quot;`, but whose `<` were left as they are) is read as the outer page's own HTML: its text shows, and its
capture script runs with `&quot;` where quotes should be, which throws the SyntaxError. A real browser never sees an iframe
there, so the teacher's checker shows nothing of it.

Not checked: the same regular expression also inlines `<link rel="stylesheet">` and `<script src>`; text swallowed before
them is likely affected the same way.

## Durable solution

Content (done): no sample or starter page has a broken quote before an iframe. Resume Week 3's link repair (Step 7) breaks a
quote on `contact.html`, which has no iframe; `Resume/Week_03/test_checker.py`
(`test_no_broken_quote_before_an_iframe_ckb_093`) fails if any step, starter or example page has an odd number of `"`
before an `<iframe`.

App (not done, needs approval): rewrite iframes only where the browser would see a real iframe, for example by checking that
the match is not inside an open quoted attribute value before rewriting. A unit test of `buildPreview` with a broken quote
before an iframe would show the page text matching the teacher's checker.

## Regression proof

- Shown with CodeShare's own `buildTeacherPreview(files, "projects.html", [], false, true)` in a sandboxed `srcdoc` frame
  (2026-11-06): the page text and the uncaught error above, while the teacher's checker gave `Home | Projects |` only.
  With the quote repaired both gave the same page text.
- The content guard was shown failing: with `<h2 title="oops>` added before Step 5's iframe in a copy of the JSON, the
  guard test failed (`AssertionError: 1 != 0 : ('dotnet-1-r03-d3-s5', 'projects.html')`); with the real JSON it passed.

## Recurrence triage

If a student's page shows another page's words and an "Uncaught SyntaxError" after a run, look for a missing quote earlier
in the page than an `<iframe>`.
