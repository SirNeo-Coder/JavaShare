# Resume Week 8 verification

.NET 1 · Week 8 · Pseudo-classes and pseudo-elements · built 2026-11-10 to 2026-11-11 for Ireneo D. Seraspe Jr., Cielito Zamora
Senior High School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run locally
(local Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 8) and the teacher's answers of 2026-11-10 ("Keep them (Recommended)", "Hover only on skills
  (Recommended)", "Yes, add it (Recommended)", then "approved"): Juan's Week 2 picture, sound and video and his Week 7 gallery stay
  on index.html, so only the steps that run index.html (1, 4, 5, 8 and 9) are media steps (offline the teacher presses Mark done on
  those five); Steps 2, 3, 6 and 7 run projects.html or contact.html and are checked automatically online and offline. Skill items
  get hover only (no tabindex: plain text is not made focusable); links, the button and form boxes get focus. A Week 8
  personal-project subtest is added to CodeShare's browser test.
- 2026-11-11: the teacher approved fixing CKB-107 (a browser-test click made stale by the folding worksheet header, PR #93) in this PR.
- Guide Quarter 2, competency 7 (course map, Week 08), with the guide Quarter 2 content and performance standards in the DLL.
  Friday: one step, Juan's finished site, no new HTML or CSS. Both Thursday repairs change the page text.
- Juan Dela Cruz and every detail about him are made up. No new media this week: Week 2's picture, sound and video and Week 7's
  four gallery pictures are reused (copied into `project_end/`).
- Only fonts and colours already on the computer; nothing named in CSS `url()`, nothing in `content` but short symbols. Every
  attribute value is in quotes (CKB-094); pages and styles.css in the top folder, no `media` on a link line (CKB-095); no broken
  quote before an iframe (CKB-093); no `src` page check (CKB-086, CKB-092); no border or outline width page-checked (CKB-097); no
  `::first-line` anywhere (it follows the window's width).

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_08.codeshare.json` | Module `dotnet-1-r08`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r07`, starter = Juan's four Week 7 files, 5 lessons, 9 steps (Steps 1, 4, 5, 8, 9 media steps, `includeMediaOutput`), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points) with the Week 7 starter pages and a starter styles.css with hover, focus, `:first-child` and `h2::before`. |
| `DotNet1_Pseudo_Classes_Elements_Module.pdf` | 13 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–13 (p. 10: plan your states; p. 11: Week 9 note; p. 12: "before you add your states", self-check, Juan's colour pairs with outlines and borders, Check yourself table; p. 13: presentation notes, colour chart, starter stylesheet). |
| `DotNet1_ILAW_Week_08.docx` | DLL from Resume Week 7's DLL; 7 pages when rendered; guide Quarter 2 standards. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r08`), p9–p13 (`revision_tools/build_tasks.py r08`), `style.css`, `tasks.css`. |
| `solutions/<step id>/` | The answer to each task, as the files that step lists (never in the JSON). |
| `project_start/` | = `Resume/Week_07/project_end/`. |
| `project_end/` | Juan's finished Week 8 site (index.html as in Step 5, projects.html and contact.html as in Week 7, styles.css as in Step 6) and the seven media files. `Resume/project/` is the same. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_07/`. |
| `test_checker.py` | Week 8 checker tests (23). |

Teacher's tools changed (originals in `revision_tools/before_revision/before_r08/`): `resume_w01/build.py` (usage line only),
`tasks.py` (loads r08), `build_tasks.py` (r08 task pages: five pages, body class `r7`, plan-your-states table, Week 9 note, "before you
add your states", self-check, Juan's colour pairs, presentation notes), `render_r01.sh` (`WEEK=08`), `run_checks.sh` (Resume Week 8
section). New: `resume_w08/content.py` (the one source; it computes every contrast ratio, outlines and borders included). Course map:
Week 08 "CodeShare readiness" line and the CodeShare bullet of "Checks and decisions to retain" (original in
`before_revision/DotNet1_Course_Map_before-r08.md`). Handover: original in `before_revision/DotNet1_Handover_2026-11-10_before-r08.md`.

Weeks 5–7 task pages rebuilt with the changed tools into their real folders and compared: Week 7 identical; Weeks 5–6 differ only by
the unused `.r7` rule in `source/tasks.css` that Week 7 already recorded. The originals were put back, so no Week 1–7 file changed.

## Steps and tasks

| Step | Run page · files | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- | --- |
| 1 (Mon, media) | index · index, styles.css | `.skills li:hover` light yellow; `.skills li:first-child` bold capitals | new first skill "Editing short videos" | the capitals move: `:first-child` follows the position |
| 2 (Mon) | projects · projects, contact, styles.css | `.badge` loses `uppercase`; `.badge::first-letter { text-transform: uppercase; }` → Solo work | a third project, badge written "class work" | it shows Class work: a pseudo-element changes letters |
| 3 (Tue) | contact · contact, styles.css | `input:required` maroon border; `:focus` outline on boxes; `button:hover, button:focus` white on maroon | a required "Your school" box | its border comes from `:required` by itself |
| 4 (Tue, media) | index · index, styles.css | `a:focus-visible` 3px maroon outline; `class="goals"`; `.goals li:nth-child(odd)` maroon | goal "Finish every module task." | the new third goal is maroon by itself (odd) |
| 5 (Wed, media) | index · index, styles.css | skills bullets → none, `.skills li::before` green ✓; `class="motto"`, quotation marks from `::before`/`::after` | a fourth motto line | the closing mark moves after it |
| 6 (Wed) | projects · projects, contact, styles.css | `h1 + p::first-letter` floated maroon drop cap (output = Step 2) | a new paragraph right after the h1 | the drop cap moves to it |
| 7 (Thu) | projects · projects, contact, styles.css | `.badge::before { content: "★ "; }` takes the first letter → solo work | `::after` with `" ★"` → Solo work | hardest combination; changes page text |
| 8 (Thu, media) | index · index, styles.css | `.skills li:frist-child` → whole rule dropped, Typing documents | spell it → TYPING DOCUMENTS | misspelt pseudo-class; changes page text |
| 9 (Fri, media) | index · all four files | Juan's finished site (output = Step 5) | a new last skill "Drawing digital posters" | the tick and hover come by themselves; only the first skill stays in capitals |

## How it came out (real runs, Chromium, no internet; CodeShare's `buildTeacherPreview` in a sandboxed frame 800 px wide inside `body { zoom: 1.15 }` with its no-internet policy, and the teacher's checker at 1000 × 900: the same page text and the same page-check values in all 32 cases, except `::first-line`)

- Pseudo-elements and page text: text from `::before`/`::after` `content` is not page text (h2 stars, skill ticks, motto quotes,
  `attr()`, even with `display: block`). `text-transform` on `::first-letter` is page text (`.badge::first-letter` → Solo work;
  `h2::first-letter { text-transform: lowercase }` → skills). A floated drop cap leaves the page text unchanged. `::first-line`
  gives different page text in the two (the first line wraps at a different width: "…IN THE ICT STRAND." against "…IN THE ICT."),
  so it is never used.
- `::before` text becomes the first letter: with `.badge::before { content: "★ "; }` the capital moves to the star and the page
  text reads solo work; moving the star to `::after` brings Solo work back (MDN ::first-letter says the same).
- Page checks: structural pseudo-classes (`:first-child`, `:last-child`, `:nth-child(odd/even)`, `:not()`, `:first-of-type`) and form
  states (`:required` 2, `:invalid` 2, `:placeholder-shown` 1, `option:checked` 1) give the same counts and computed styles in both.
  `:hover`, `:focus`, `:focus-visible` match nothing (count 0): a check has no mouse or keyboard. A page check cannot pick a
  pseudo-element (`querySelectorAll` throws in CodeShare; the teacher's checker would wait 30 s).
- Broken selectors: `:frist-child`, `::frist-letter`, one bad selector in a comma list (`.badge::first-letter, .ribbon::frist-letter`)
  and a space before the colon (`.skills li :first-child`, `.badge ::first-letter`) each drop or empty the whole rule, so the
  capitals go. One colon still works (`h2:before`, `.badge:first-letter`; CodeRabbit on PR #92 was right). A missing quote in
  `content` drops that declaration and the next one (no star; the `::before` colour falls back to the li's) but no later rule, so the
  page text does not change: it is in the problem guide, not a repair.
- Keyboard and mouse (Playwright, real Tab key, in the teacher's checker's browser): a click in Your name gives a solid 3px maroon
  outline; Tab to Send message gives white on maroon, as under the mouse; with `button:hover` alone the focused button stays grey;
  the first Tab on index.html gives the link a solid maroon outline 2px outside it. In CodeShare's page window the personal subtest
  focused a nav link: it took the student's nav hover colour.
- Personal project: in CodeShare online (8787) and offline (3042), the `h2::before` star is drawn
  (`getComputedStyle(h2, "::before").content` = `"★ "`) and is not in the page text; `.top li:first-child` reads uppercase; a
  focused link shows the hover colour. The module and JSON say pseudo-elements work the same online and offline.

## Readable contrast (W3C WCAG 2.2: 4.5:1 normal text, 3:1 large text; 3:1 outlines and borders, non-text contrast)

Computed in `revision_tools/resume_w08/content.py`; the build stops if any pair is below its minimum. Printed values are rounded down.

| Text or outline on background | Colours | Ratio |
| --- | --- | --- |
| Juan's name (h1, large), white on the gradient | #ffffff on #13305c → #8a1c55 | 8.8 (lowest point) |
| Skill under the mouse | #222222 on #fff3c4 | 14.2 |
| Link under the mouse or keyboard | #13305c on #fff3c4 | 11.7 |
| Button under the mouse or keyboard | #ffffff on #8a1c55 | 8.8 |
| Tick before each skill | #2e7d32 on #ffffff | 5.1 |
| Odd goals, drop cap | #8a1c55 on #ffffff | 8.8 |
| Captions and body text / paragraphs and labels | #222222 / #333333 on #ffffff | 15.9 / 12.6 |
| Badges on their gradient | #222222 on #fff3c4 → #ffe08a | 12.3 (lowest point) |
| Nav links | #ffffff on #13305c | 13.0 |
| Focus outline, required border (3:1) | #8a1c55 on #ffffff | 8.8 |
| Picture border, badge border (3:1) | #555555, #b45309 on #ffffff | 7.4, 5.0 |

## References (each opened 2026-11-10 with a web fetch; each says what the DLL cites it for)

MDN Pseudo-classes and pseudo-elements (Learn); MDN Pseudo-classes; MDN Pseudo-elements; MDN :first-child; MDN ::first-letter; MDN
:hover; MDN :focus; MDN :focus-visible; MDN :required; MDN :nth-child(); MDN ::before; MDN ::after; MDN content; W3C CSS
Pseudo-Elements Level 4; MDN Selector list; MDN Debugging CSS; W3C WAI Understanding Focus Visible; W3C WAI Understanding Non-text
Contrast; W3C WAI Understanding Contrast (Minimum); Common Sense Education Privacy & Safety (no login). MDN's selector pages now live
under `/Web/CSS/Reference/Selectors/`. W3C Selectors Level 4 was opened but its error-handling section did not come through, so it is
not cited.

## Checks run

2026-11-11, `bash revision_tools/run_checks.sh` from the Net Files folder: every section of every week passed (old Weeks 1–3,
Resume Weeks 1–8, printed module vs JSON `ALL MATCH`).

**Resume Week 8 samples** (`check_codeshare.py DotNet1_Week_08.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r08-d1-s1
PASS dotnet-1-r08-d1-s2
PASS dotnet-1-r08-d2-s3
PASS dotnet-1-r08-d2-s4
PASS dotnet-1-r08-d3-s5
PASS dotnet-1-r08-d3-s6
PASS dotnet-1-r08-d4-s7
PASS dotnet-1-r08-d4-s8
PASS dotnet-1-r08-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 8 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**

```text
9 problem(s):
- dotnet-1-r08-d1-s1: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r08-d1-s2: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r08-d2-s3: Output differs: 'Tab title: Contact Juan Dela Cruz\nVisible page tex
- dotnet-1-r08-d2-s4: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r08-d3-s5: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r08-d3-s6: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r08-d4-s7: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r08-d4-s8: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r08-d5-s9: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
```

**`test_checker.py`** (`python3 test_checker.py -v`; rules on their own through the teacher's checker, plus a real Tab key and
`getComputedStyle(…, "::before")` in the same Chromium; not the real app)

```text
test_a_floated_drop_cap_keeps_the_page_text_and_moves_with_the_new_paragraph ... ok
test_a_missing_quote_skips_the_symbol_and_the_next_line ... ok
test_a_step_without_its_stylesheet_fails_on_its_own ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_before_text_takes_the_first_letter ... ok
test_both_thursday_repairs_change_the_page_text ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_duplicate_id_rejected ... ok
test_every_contrast_pair_outline_and_border_reaches_its_minimum ... ok
test_every_step_runs_from_its_own_files_alone ... ok
test_every_value_in_quotes_each_li_on_its_own_line_no_url ... ok
test_first_child_follows_the_position_and_its_capitals_are_page_text ... ok
test_first_letter_text_transform_is_page_text ... ok
test_focus_looks_like_hover_with_the_keyboard ... ok
test_form_states_are_read_by_page_checks ... ok
test_hover_is_not_page_text_and_matches_nothing_without_a_mouse ... ok
test_no_page_check_on_a_state_a_pseudo_element_or_a_window_value ... ok
test_nth_child_odd_colours_the_new_third_goal ... ok
test_only_the_index_html_steps_are_media_steps ... ok
test_pages_change_only_by_the_goals_and_motto_classes ... ok
test_personal_starter_has_hover_focus_a_structural_pseudo_class_and_a_pseudo_element ... ok
test_selector_mistakes_drop_the_whole_rule ... ok
test_text_from_before_and_after_is_not_page_text ... ok
Ran 23 tests
OK
```

Break-and-restore proofs (2026-11-11): a `.skills li:hover` count check added to Step 1's page checks made
`test_no_page_check_on_a_state_a_pseudo_element_or_a_window_value` fail (`':hover' … is not None`), and it passed again once the JSON
was restored (byte-identical); the Step 7 answer with the star still in `::before` made the answers check report
`dotnet-1-r08-d4-s7: Output differs`, and `OK` again once restored.

**Printed module vs JSON** (`consistency.py`): `printed task box matches JSON: True` for all 9 Week 8 tasks; `week r08 printed sample
code and outputs (pp. 1-8) match JSON: True (13 codes, 1 whole outputs, 6 output parts, 3 same-as lines)`; `ALL MATCH`.

**Pages**: module 13 pages, each source page one page of 612 × 936 pt (`WEEK=08 bash render_r01.sh`); every page looked at. DLL 7 pages
(LibreOffice), every page looked at; no Week 7 text left apart from the deliberate recall on Monday. Search for "VS Code", "Visual
Studio", "Chrome", "Ctrl+O" and "folder" in the DLL, module and JSON: no hits.

## CodeShare (the real app, local)

`tests/web-module-steps.browser.mjs` (branch `docs/net-resume-week-08`), `node --test --test-reporter=spec`:

- First run on Cloudflare's runtime: the student walk stopped at Week 1 Step 4. Since PR #93 the worksheet's step tabs fold away while
  the worksheet scrolls down, and the test's click landed on the header (CKB-107, test only; students scroll up and the tabs unfold,
  CKB-101). The teacher approved the one-line fix (click the tab with `dispatchEvent`), shown failing with the old line and passing with
  the new one.
- Cloudflare's runtime on this laptop (`npx opennextjs-cloudflare build`, preview on 8787, local Supabase and local R2): 14 passed,
  5 skipped (old-format subtests), 0 failed. Every built week's media uploaded first; 72/72 steps "sample verified, task completed";
  no server errors. Week 8:

```text
dotnet-1-r08-d1-s1: sample verified, task completed
dotnet-1-r08-d1-s2: sample verified, task completed
dotnet-1-r08-d2-s3: sample verified, task completed
dotnet-1-r08-d2-s4: sample verified, task completed
dotnet-1-r08-d3-s5: sample verified, task completed
dotnet-1-r08-d3-s6: sample verified, task completed
dotnet-1-r08-d4-s7: sample verified, task completed
dotnet-1-r08-d4-s8: sample verified, task completed
dotnet-1-r08-d5-s9: sample verified, task completed
```

- Offline settings (`next start` on 3042, laptop mode, no R2): 13 passed, 6 skipped, 0 failed. Week 8:

```text
dotnet-1-r08-d1-s1: teacher-checked (no media storage on this server), marked done
dotnet-1-r08-d1-s2: sample verified, task completed
dotnet-1-r08-d2-s3: sample verified, task completed
dotnet-1-r08-d2-s4: teacher-checked (no media storage on this server), marked done
dotnet-1-r08-d3-s5: teacher-checked (no media storage on this server), marked done
dotnet-1-r08-d3-s6: sample verified, task completed
dotnet-1-r08-d4-s7: sample verified, task completed
dotnet-1-r08-d4-s8: teacher-checked (no media storage on this server), marked done
dotnet-1-r08-d5-s9: teacher-checked (no media storage on this server), marked done
```

- New Week 8 personal subtest: passed on both (the star drawn by `::before` and missing from the page text; the first list item in
  capitals; a focused nav link in the nav hover colour, and, after CodeRabbit on PR #96, a focused ordinary link in this week's
  light yellow `a:focus` colour; removing that rule makes the subtest fail with `rgba(0, 0, 0, 0)`). Re-run after the teacher merged
  main into the branch (2026-11-11): 8787 14 passed, 5 skipped, 0 failed, 72/72 steps; 3042 13 passed, 6 skipped, 0 failed. Its first run expected yellow for the focused link; the first link is a nav
  link, which the student's Week 6 `nav a:focus` makes maroon, so the expectation was corrected. Proofs on 3042: a copy of the subtest
  whose stylesheet writes `h2::befor` failed (`'none'` instead of `'"★ "'`); a copy of the weeks whose Step 7 answer keeps the star in
  `::before` stopped the walk (`dotnet-1-r08-d4-s7: task NOT completed — ✗ Page text matches; line 8: required "Solo work", page gave
  "solo work"`).
- `npm test` 448/448; `npm run lint` 0 errors (8 old warnings in app files); `npm run build:all` OK.

## Not verified

- The hosted site, classroom laptops and Wi-Fi, phones, Firefox and Safari (only Chromium was run).
- The real upload of Week 8 and its seven media files under Media files (the teacher does this).
- How hover feels on a touch screen (MDN: `:hover` may never match there), and screen readers reading or skipping `content` text.
- The Tab key inside CodeShare's page window was not pressed by a test (the subtest focused the link from the page itself); the real Tab
  key was run in the teacher's checker's browser only.
