# CodeShare module file format (`codeshare-module`, version 1)

One file per teaching week, named `<Course>_Week_NN.codeshare.json` (for example `Java2_Week_15.codeshare.json`). It is plain JSON, UTF-8. CodeShare loads it into the course library; students work through its parts at their own pace. **Lessons are never tied to calendar dates inside this file.**

### Top level

| Field | Type | Meaning |
|---|---|---|
| `format` | `"codeshare-module"` | Always this exact text. |
| `version` | `1` | Format version. |
| `course` | `"java-1"` \| `"java-2"` \| `"dotnet-1"` \| `"dotnet-2"` | Which of the four courses. |
| `week` | number | Week number within the course (orders modules in the library). |
| `id` | string | Unique, stable id, e.g. `"java-2-w15"`. Never reused for different content. |
| `title` | string | Module title, e.g. `"Self-Paced Module: Java File Handling"`. |
| `continues` | string | Optional. What it builds on, e.g. `"Week 14 — Collections Framework"`. |
| `previousModuleId` | string | Optional stable id of the preceding module in this class. Its saved project is copied for this student when starting a new module project; the preceding project is never changed. Cannot be this module’s own id. |
| `starterFiles` | File[] | The files students should already have when the week starts (for students who missed last week). |
| `lessons` | Lesson[] | One per class day, in teaching order. |
| `performanceTask` | PerformanceTask | Optional. The Friday task. |

### File

`{ "path": "Vehicle.java", "content": "public abstract class Vehicle { ... }" }` — `path` is a plain file name (folders allowed with `/`); `content` is the exact file text.

### Lesson

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable id, e.g. `"java-2-w15-d1"`. |
| `order` | number | 1, 2, 3 … (position in the week). |
| `dayLabel` | string | The label from the printed module, e.g. `"MONDAY"`. Display only — not a date. |
| `title` | string | Lesson title (same as the DLL title). |
| `hours` | number | Planned hours (e.g. 2 or 3). |
| `objectives` | `{ "cognitive", "affective", "psychomotor" }` | Three strings. |
| `blocks` | Block[] | The lesson content, in reading order. |
| `exitSlip` | ExitSlip | The day's liplet / tear-out strip questions. |

### Block (the `type` field decides the rest)

| `type` | Other fields |
|---|---|
| `"text"` | `markdown` |
| `"definition"` | `term`, `markdown` |
| `"analogy"` | `markdown` |
| `"note"` | `markdown` (used for "Check yourself" and tips) |
| `"table"` | `columns` (string[]), `rows` (string[][]) |
| `"step"` | `id` (e.g. `"java-2-w15-d1-s1"`), `number`, `instruction` (markdown), `language` (`"java"` \| `"html"` \| `"css"` \| `"javascript"` \| `"csharp"`), `files` (File[] — the files the student puts in or replaces), `run` (optional: the file to run, e.g. `"Main.java"` or `"index.html"`), `expectedOutput` (the **real** output, exactly as produced), `checkYourself` (optional markdown), `activity` (optional — see below), `part` (optional string — see "Parts" below), `webChecks`, `mediaChecks`, `includeMediaOutput` (optional, web steps — see "Web module steps" below) |
| `"error"` | `language`, `markdown` (what causes it), `message` (the **real** error text) |
| `"errorGuide"` | `rows`: `[{ "see": "...", "means": "...", "fix": "..." }]` |

`markdown` supports only: `**bold**`, `*italic*`, `` `code` ``, `[text](https://link)`, bullet lists (`- `), and blank lines between paragraphs. No HTML.

### ExitSlip

`{ "id": "java-2-w15-d1-slip", "points": 15, "afterStep": "java-2-w15-d1-s2", "questions": [ { "id": "1.1", "kind": "Define", "points": 5, "prompt": "..." } ] }`

`kind` is one of `Define`, `Explain`, `Connect`, `Identify`, `Choose`, `Point`, `Evaluate`, `Apply`, `Reflect`.

### PerformanceTask

`{ "id": "java-2-w15-pt", "title": "...", "markdown": "...", "steps": ["..."], "checklist": ["..."], "exampleFiles": File[], "starterFiles": File[], "presentationOutline": ["..."], "questionsToPrepare": ["..."], "rubric": [ { "criterion": "...", "points": 10 } ], "totalPoints": 50 }`

`steps` is optional (at most 30 lines of 500 characters): a numbered "How to build it, step by step" guide shown in Projects, in the personal project's Console under **Your performance task**, and on the module's Performance task page. It may use **bold** and `code`. Name copyable samples in bold exactly as CodeShare labels them, e.g. `**Step 4 · Main.java**` or `**Sample code · Main.java**` (a sample identical to an earlier step's file carries that step's label); each named sample gets a **Copy** button at the end of its step. Files without `steps` show no guide and keep the Console's **Code from this module** list.

### Parts

The module viewer groups a module's steps into named, gated parts a student unlocks one at a time (e.g. "Introduction", "File basics", "Reading files" — matching how the discussion actually flows, not necessarily one part per day; a part can cover steps from more than one lesson). Give a step a `part` title to put it in that part; any text/definition/analogy/table/note blocks between it and the previous step join the same part. A step with no `part` falls back to its own lesson as the part — so a module written before this field existed still groups sensibly, one part per lesson, with no changes needed.

### Rules

1. Every `id` is unique across the whole course and **never changes** once published — student progress is recorded against these ids.
2. If content is corrected later, keep the same ids; CodeShare replaces the content and keeps progress.
3. Code and outputs in this file must be **identical** to the printed module.

### Two weekly Java projects (approved workflow, 2026-10-20)

A step's `files`, `instruction`, and `expectedOutput` are the printed sample used for progression.
Older modules may contain a separate `activity`, for example:

```json
"activity": {
  "instruction": "Change Jeepney's capacity to 25 and print it from Main.java.",
  "files": [{ "path": "Main.java", "content": "public class Main { public static void main(String[] args) { Vehicle v = new Jeepney(\"NXA 123\"); System.out.println(\"Capacity: \" + v.getCapacity()); } }" }],
  "expectedOutput": "Capacity: 25",
  "stdin": ""
}
```

Legacy `activity` fields remain accepted for compatibility and teacher reference. Module progress
now uses the step's printed sample: `files`, `instruction`, `expectedOutput`, and optional `stdin`
(default empty). It never checks a different `activity.expectedOutput`. Stored challenge results
remain saved, but the sample's step id controls completion.

Each student has two saved Java projects per module per class, both edited in the main editor:

- **Module project** starts from module supporting `starterFiles` and sample step files. If
  `previousModuleId` is present, copy this student's preceding module project in the same class.
- **Personal performance-task project** starts from module supporting files and performance-task
  `starterFiles`. Copy only the preceding personal draft, falling back to that week's submitted
  own version for legacy records. Never copy from the module project into the personal project.
  A Java personal project may also hold `.txt` data files (2026-11-05, CKB-090); the module
  project stays Java-only apart from the `.txt` files a step supplies.

Current saved files always win and missing supporting files are added. `src/Main.java` and
`Main.java` identify the same source. At most 50 valid Java files compile together. Supply
`previousModuleId` to continue the correct preceding week; without it a new project starts from
its supplied starter files. Preceding weeks and submitted snapshots are never overwritten.

The first part opens automatically. Every sample step in a part must pass before the next part
opens; named parts may span lessons. Compile and run successfully with exact expected output:
normalize CRLF and ignore one final println newline, but never trim spaces or extra blank lines.
Offline Java execution results come from the laptop. Online browser-reported success/output is approved practice evidence, checked against server-owned expected output and the saved version; direct browser pass flags are refused. Earlier passes survive
later failed practice runs. Automatic checking supports Java and web pages (see "Web module steps").

Liplets are handwritten, assessed by the teacher, and never gate progress. The existing completion
percentage counts passed sample steps plus the two performance-task submission records, equally.
The performance task opens after the module steps pass. Personal **Save work** and **Run code**
do not submit or grade it; **Submit this version** records the student's own version explicitly.
Existing sample/own records and assessment remain compatible. Personal input is entered in Console.

Teacher availability switches do not gate students; their old API/data remain compatible. The
weekly live-class restriction still applies. Online multi-file Java uses Java 8 in the browser after [runner setup](online-java-setup.md);
offline mode continues compiling all classes together with laptop javac.

### Small alteration tasks and rolling projects (approved 2026-10-20)

Keep the printed sample in the step's `files`, `instruction`, `expectedOutput`, and optional
`stdin`. Add a separately identified `activity` for the student alteration:

```json
"activity": {
  "id": "java-2-w14-d1-s1-alter-v1",
  "instruction": "Change the removal from index 1 to index 3. Keep the other output lines.",
  "files": [],
  "expectedOutput": "the complete, verified output after the alteration",
  "stdin": ""
}
```

### Teacher-only answer key (approved 2026-11-11, simplified 2026-11-12)

A task may also carry the answer, for the teacher only. You write the changed lines yourself;
CodeShare works nothing out and compares nothing:

```json
"activity": {
  "id": "java-2-w14-d1-s1-alter-v1",
  "instruction": "Change the removal from index 1 to index 3. Keep the other output lines.",
  "expectedOutput": "the complete, verified output after the alteration",
  "solution": {
    "lines": "Main.java, line 8 \u2014 replace the removal:\n            numbers.remove(3);",
    "note": "Why it answers the task, in plain English: what the changed line does and how that produces the expected output."
  }
}
```

`lines` is plain text (at most 5000 characters), shown exactly as written in a collapsed
**Answer key (teacher only)** panel directly under **Your task** and **Expected task output**, with
`note` under it as **Why this answers the task**. Name the file and the line numbers in `lines`
yourself; CodeShare neither checks nor renumbers them. It needs the task's own
`activity.id`, or the upload is refused: without an id the worksheet would never show the panel.
CodeShare removes `solution` from every student view, open or locked step alike, and it is not a
progress id. Keep the complete solved files in your own week folder as before; the panel is for
explaining in class, not for running.

Deploy the app change before uploading a module that carries answers: an older server has no rule
to remove them, so it would send a step's answer to students. If the site is ever put back to an
older version, upload those modules again without `solution` first.

A nonempty stable `activity.id` opts into task checking and one-step-at-a-time unlocking.
It must be unique across the module's lesson, sample, slip and task ids, including generated
progress keys. Completion is stored under `task:<activity.id>`; old sample and legacy
`<step id>:activity` records remain stored but cannot complete this new task. Change the task id
when changing what a task requires. Keep published module, lesson and sample step ids.

The worksheet shows Sample code, Sample output, Your task and Expected task output. The main
editor checks the task's output/input, not the sample's. Only successful execution with matching
output completes it. Compiler-error and crash examples remain demonstrations; give students a
successful alteration to check. Make required outputs predictable: do not require HashSet order,
a particular stack trace or elapsed thread timing. Older JSON without explicit task ids keeps
its existing sample checks and part access.

Opening a task combines supporting classes, sample files and any task starter files, then keeps
previous-week and current saved files in preference to templates. Students make the stated code
changes themselves; opening a later task never replaces an existing Main.java. Task `files` can
add missing supporting classes, but must not contain the solved alteration.

Use `previousModuleId` for the preceding module in this class. A missing previous project falls
back to starter files. Once this week's project exists, opening it again never recopy-overwrites
it. Module and personal projects roll forward separately; previous weeks and submitted snapshots
are unchanged. No new table, column or migration.

The first revised example is [Week 14](modules/week14/README.md). New
[Week 12](modules/week12/README.md) and [Week 13](modules/week13/README.md) JSON now supply the
preceding chain `java-2-w12` → `java-2-w13` → `java-2-w14`. Upload them in order in the same class.
Deploy the app change before uploading a task-enabled file.
The old playbook checker validates sample runs only; updating the generation prompt/playbook and
its checker is a later stage.

## Optional sample-first workflow

Set module-level `"sampleFirst": true` to require sample verification before each explicitly
identified alteration (`activity.id`). Existing files omitting this field keep their prior behavior.
The main editor loads each step's `files` on first opening and adds supporting starter/rolling
classes. Reopening a started step resumes its saved draft; existing completions stay completed.
The unchanged supplied sample must run with its own `stdin` and `expectedOutput` before alteration
editing opens. This saves `sample:<activity.id>` evidence only. The alteration then checks its own
input/output and completes only after successful execution. Sample evidence never opens the next
step or counts toward task completion. Samples are not silently reloaded over saved edits.

For an intentional Java runtime-error demonstration, add a step-level `expectedError` containing
the fully qualified exception type, for example `"java.util.ConcurrentModificationException"`.
The check requires an unsuccessful run with that exception as the first error line, allowing JVM
stack-frame differences and the browser's absent thread prefix. It is a verified demonstration,
never a completed alteration. All ordinary samples and alterations require successful execution.
Use deterministic sample output; platform-specific exception messages should be printed explicitly
and unordered collection iteration must be checked on each supported runner before publishing.
Do not change a task's requirement without a new stable activity id; sample-key collisions are
rejected at upload, alongside existing step/task/lesson/exit-slip collisions.

## Resume and exercise quality (2026-10-21)

The student worksheet and Module project action choose the next unfinished step from server-saved
completion. Sample verification or a failed task attempt does not advance this position. Completed
module steps lead to the performance-task page; teacher previews still begin at Overview.

An alteration must use the lesson's behavior to produce changed output: for example swap objects,
reject invalid state, change a calculation or exercise a different catch path. Renaming printed text
alone is insufficient. Supply the complete expected output while keeping sample code unsolved.
Weeks 12/13 revised requirements use new `-v2` activity identities so earlier `-v1` passes remain
stored without passing a different exercise. No original module, lesson or step identity is renamed.

## Later weekly review copies 2026-10-22

[Weeks 15–21](modules/week15-week21.md) add alteration metadata and matching appendices while
preserving original sample code and outputs. Include complete per-step supporting sources so a
previous alteration cannot corrupt the next baseline. Existing named demo launchers receive a
small Main.java forwarding file for the current classroom runner. Text backups are retained
in the package supporting-files folder, outside both step and starter project arrays.

**Data files in Java steps (2026-10-30, CKB-088).** A `java` step's `files` may include `.txt`
data files that its program reads, such as Week 15's `fleet.txt`. Each run starts in an empty
folder holding only the step's own files, so every step supplies each data file it opens, even one
an earlier step made. The file appears as a tab in the student's editor; Run code puts it where
`new FileReader("fleet.txt")` looks and does not compile it. Names use letters, digits, `_`, `-`
and `/` folders only. Offline, the laptop runner still blocks programs that use `java.io`, so these
steps run online only for now. CheerpJ ignores append mode (CKB-089), so module code must not
use it: Week 15 adds to a file by reading the old lines and writing them back before the new ones.

Reading/presentation-only lessons may use their existing lesson id as the required
exitSlip.afterStep descriptive anchor; it is not a code-completion or handwritten-liplet gate.
Week 20 has no invented executable steps. See the linked package's file, timing and GUI limits
before classroom rollout. The schema, application and original files are unchanged.

## Web module steps (approved 2026-10-28)

A step whose `files` all end in `.html`, `.css` or `.js` is a web step; `.java` files make a Java step.
There is no separate module field. Web steps use the same parts, `sampleFirst`, `activity.id` and
`task:<id>` rules as Java. The page runs in the student's own browser, in the existing sandboxed
preview (no `allow-same-origin`), online **and offline**: the browser's result is approved practice
evidence, checked by the server against its own expected output and the saved version. A bare
"passed" flag is never accepted. Java steps keep their existing runners.

- **What is compared.** When `run` names an `.html` file (default `index.html`), the output is
  `"Tab title: " + document.title + "\nVisible page text:\n" + body.innerText` trimmed, with every
  run of two or more line breaks replaced by one. When `run` names a `.js` file, the script runs on
  an empty page and the output is its `console.log/info/warn/error` lines joined with line breaks
  (`alert` is not included). Comparison is the Java rule: Windows line endings and one final line
  break are ignored; spaces and other blank lines count.
- **Successful run.** The page must raise no uncaught error (including an unhandled promise
  rejection). `expectedError` and Program input do not apply to web steps.
- **Result.** A checklist with one line per check (**Page text matches** or **Console output
  matches**), ticked or crossed; a cross shows **Required output** and **Your output** side by side.
- **No internet.** The page runs under the same no-internet rule as the teacher viewer, like the
  course-building checker: links, scripts, pictures, fonts and `fetch` to other sites do not load.
  Pictures and fonts can only be embedded in the file (`data:`).
- **Project files.** Web paths keep their folders (`src/app.js` is not merged with `app.js`). Module
  `.txt` starter files are kept in the student's module project as reference files only.
- **Pictures, sound and video.** A step whose expected output contains a `Media checks:` section
  cannot be checked automatically yet. Students see **Checked by your teacher for now**; the teacher
  opens **Students → student → module** and presses **Mark done** under **Checked by you**, which
  records the same pass as an automatic check. `includeMediaOutput: true` without such a section is
  checked automatically.
- **Page-element checks (2026-10-29).** `webChecks: [{ "selector", "count"?, "attribute"?, "value"?,
  "style"? }]` are checked like the teacher's course-building checker: `count` is the number of
  elements matching the CSS `selector`; `attribute` + `value` is the first match's attribute;
  `style` + `value` is the first match's computed style (`getComputedStyle`). A missing element, an
  unusable selector, or an `attribute`/`style` without `value` fails; a check with none of
  `count`/`attribute`/`style` is ignored. Each check adds one checklist line (for example
  **Page has 1 h1**, **html has lang="en"**, **ol has list-style-type: decimal**); a cross shows what
  was found. The step's own sample must pass every check as well as the output; alteration tasks
  (`activity.id`) are not held to them. The page reports what it found and the server compares it
  with the stored checks. Steps already completed stay completed.
- **Pictures, sound and video (2026-10-29).** A step whose expected output contains `Media checks:`
  is a media step. Its files live outside the JSON: the teacher adds them once per module under
  **View module details → Media files** (Cloudflare R2, one shared copy for the teacher's classes in
  that subject; `images/`, `audio/` or `video/` by type, 5 MB each, names of letters, numbers, `-`
  and `_`). Until a module has media files, and always offline, its media steps show **Checked by
  your teacher for now** and the teacher presses **Mark done**. With media files, CodeShare puts
  each file the HTML names (`src` on `img`, `audio`, `video`, `source`) into the page, then tests
  every picture, sound and video like the course-building checker: pictures must decode; sound and
  video must load and play (muted). Each gives a line `<src>: image decoded` / `image failed to
  decode` / `playback advanced` / `playback failed`; `includeMediaOutput: true` appends them after
  `Media checks:`. `mediaChecks: [{ "src", "state": "loaded" | "broken" }]`: every element must load
  unless listed `broken`, and every listed `src` must be on the page. Not covered: sound or video
  made by JavaScript, pictures from CSS `url()`. The media line names the `src` written on `img`,
  `audio` or `video` itself; a `video` that names its file only in a `source` reports `null`, so put
  `src` on the element. Do not page-check (`webChecks`) the `src` of an uploaded file: online it is
  embedded as `data:` and the check fails (CKB-092); its media line already names the `src`.
- **Tables in page text (checked 2026-11-06).** A `caption` is one line; each `tr` is one line with a
  tab between its cells; a `colspan` or `rowspan` cell leaves fewer cells on a line; an empty cell
  still adds its tab. Words inside a `tr` but outside `td`/`th` move above the table. Page checks
  cover `scope`, `colspan` and `rowspan`; tasks change visible text.
- **Links, frames and forms in page text (checked 2026-11-06).** Link text is page text; `href` is not
  (a page check such as `a[href="projects.html"]` gives the same count in CodeShare and the teacher's checker).
  A framed page's text is not part of the run file's page text. CodeShare shows a project page in an
  `iframe` through `srcdoc`, so its `src` reads nothing online and offline: check frames by count,
  `title`, `width` and `height`, never `src`. Labels, `button` words and every `option` of a `select`
  are page text; typed values, `placeholder`, `textarea` text and the `value` of `input type="submit"`
  are not. A label and its box on one line leave a trailing space, so put `<br>` after each label.
  A step may set `run` to another page (`projects.html`); checks read that page only. A missing quote
  before an `iframe` gives different page text in CodeShare (CKB-093): keep samples free of it.
- **CSS in page text and page checks (checked 2026-11-08, Resume Week 4).** Colours, fonts, sizes and
  backgrounds are not page text: check them with `style` + `value` page checks, which read the same
  computed values in CodeShare and the teacher's checker (`rgb(19, 48, 92)`, `Georgia, serif`, `12px`,
  `700`, `italic`). `text-transform` changes the page text (`uppercase`, `capitalize`, `none`), also on a
  `button`, but not on a `select`'s `option`s; `display: none` and `visibility: hidden` remove it.
  CodeShare puts a linked stylesheet into the page as a `style` element, so never page-check `link` or
  `style` elements (their counts differ). A wrong, wrongly capitalised or missing stylesheet leaves the
  page unstyled with no error, in both. An `href` without quotes is not inlined in CodeShare although a
  browser loads it (CKB-094): write every value in quotes. CodeShare finds a linked stylesheet from the
  project's top folder, not from the page's own folder, and drops a `media` condition such as
  `media="print"` (CKB-095): keep pages and stylesheets in the top folder and put no `media` on a link line. Which rule wins (same in both): inline beats
  an ID, an ID beats a class, a class beats an element; between equal rules the later one wins, also
  between a `style` element and the link line. A missing semicolon skips that declaration and the next; a
  missing colon skips one; a missing `}` after a style rule (such as an `h2` rule) stops every later rule,
  but a missing `}` after an `@media` block keeps the later rules inside that block, where they still apply
  under its condition (a missing last `}` changes nothing); a misspelt or wrongly capitalised class or id, or a missing dot, matches nothing. A step's
  `files` include its run page and every file that page needs (its stylesheet, a framed page), even
  when unchanged: **View module details** runs a step's own files only.
- **Text, font, colour, gradient and opacity (checked 2026-11-09, Resume Week 5).** None of them is page text;
  page checks read computed values, the same in CodeShare and the teacher's checker: a `font-family` list as written
  with double quotes (`'Courier New'` reads `"Courier New", monospace`); `em`, `rem` and a unitless `line-height` in px
  (`1.1em` of 16px reads `17.6px`, `line-height: 1.5` reads `24px`); `white` and `#ffffff` read `rgb(255, 255, 255)`;
  `text-decoration` reads `underline` or `none`; `text-align` reads `start` when not set. A gradient is page-checked with
  `background-image` (`linear-gradient(to right, rgb(19, 48, 92), rgb(138, 28, 85))`; `to bottom` is left out;
  `radial-gradient(circle, …)` as written), never with the `background` shorthand (a long string). Linear and radial
  gradients show in the page window (they need no `url()`). `opacity` reads `0.75`; text at `opacity: 0` or in a
  `transparent` colour stays in the page text; `font-variant: small-caps` does not change it; `capitalize` changes
  labels and buttons, not `option`s. A missing comma between gradient colours, a misspelt direction (`to rigth`) or a
  colour without `#` drops only that declaration (the page text stays the same); a missing `)` in a gradient makes the
  rest of the stylesheet part of that value, so every later rule stops (a later `text-transform` disappears from the
  page text). A task is checked by its page text only, so a repair whose only effect is a style cannot be proven by
  a run: Thursday repairs must change the page text (teacher, 2026-11-09; CodeRabbit on PR #87).
- **Box model, lists and links (checked 2026-11-09, Resume Week 6).** None of them is page text except `display`;
  page checks read computed values, the same in CodeShare's page window and the teacher's checker. Sizes read in px
  (`padding-bottom: 0.25em` on a 24px `h2` reads `6px`, `margin-top: 1.5em` reads `36px`, `0.25em` on 12px text `3px`). A
  side's border is checked by its style and colour longhands (`border-bottom-style` `solid`, `border-bottom-color`
  `rgb(…)`); never page-check a border width: CodeShare's page window follows the text-size zoom (1.15 at first), so 2px
  reads `1.73913px` there but `2px` in the teacher's checker (CKB-097). `border` reads `""` when the four sides differ and
  `padding` reads `0px 0px 6px`: page-check longhands. A border with no style reads style `none` (it does not show).
  `width: 300px` reads `300px` with or without `box-sizing: border-box` (only the box on screen is 310px without it), so
  check `box-sizing` itself; a `select` is `border-box` by default. A `%` width or an `auto` margin turns into px from the
  window, and the page window is not the checker's 1000 px window (392 px against 492 px for `width: 50%`): never
  page-check them. Two top and bottom margins that meet become one, the larger (20px and 30px leave 30px). List items
  are blocks: a nav made of `li`s shows one link per line until `display: inline` or `inline-block` puts them on one line
  (`display: flex` gives one per line again); `li` tags typed with no space between them run the words together
  (`HOMEPROJECTSCONTACT`). `list-style-type` and `list-style-position` read as written and beat a list's `type` attribute;
  markers are never page text. A link's plain style reads (`color`, `text-decoration` `underline`/`none`); `a:visited`
  and `a:hover` match nothing in a check (`querySelectorAll` hides visited links, a check has no mouse), and a style check
  on `a:hover` makes the teacher's checker wait 30 seconds: never page-check a link state. `padding: 10` (no unit),
  `1.5 em`, a misspelt property and a negative padding each drop only that declaration (a negative margin works); a
  missing `;` skips that declaration and the next one (`display` too); a missing `}` after a rule stops every later rule.
- **Position, z-index, float and galleries (checked 2026-11-10, Resume Week 7).** `position`, `top`/`right`/`bottom`/`left`,
  `z-index`, `float` and `clear` are not page text; page checks read computed values, the same in CodeShare's page window
  (zoom 1.15, about 800 px wide) and the teacher's checker. Offsets you set read as written in px (`top: 8px` reads `8px`;
  `top: 1em` on a 32px `h1` reads `32px`), even on a static box, and `z-index` reads as written on a static box too (`2`), where
  it does nothing. A side you did not set on an absolute box reads a px value that follows the window (`left` 851 px in the
  checker against 651 px in CodeShare on one test page); `fixed` offsets and `sticky` places follow the window and scrolling:
  never page-check them. `position: absolute`, `fixed` and `float` make a box a block, so its words get their own line in
  the page text (`PROJECTS OF JUAN DELA CRUZ` then `ICT STRAND`); `relative`, `sticky` and static keep them in their line. A
  missing `;` after `position: absolute` skips `top` too and puts the words back in the line; an unknown value (`float:
  rigth`, `float: center`) is skipped. A positioned box with no positioned ancestor is placed from the page (Juan's ribbon
  over the nav); a sticky nav needs a `z-index` above later positioned boxes, or they slide over it when the page window
  scrolls. Galleries: `figcaption` is page text, `alt` is not; floated `figure`s give one caption per line, while
  `inline-block` figures leave a line holding only a space between captions, and a tag that is not positioned leaves a
  trailing space after its word: use `float` and positioned tags. In today's Chromium a missing `}` makes the later rules
  nested rules of the broken one, so a later rule can still match inside it: do not rely on it to stop a rule inside a
  figure. A personal gallery offline (no media files) still runs successfully; each picture shows its alt text and a small
  broken-picture icon.
- **Pseudo-classes and pseudo-elements (checked 2026-11-11, Resume Week 8).** Structural pseudo-classes (`:first-child`,
  `:last-child`, `:nth-child(odd)`, `:not()`, `:first-of-type`) and form states (`:required`, `:invalid`, `:placeholder-shown`,
  `option:checked`) give the same counts and computed styles in CodeShare's page window and the teacher's checker, so page checks
  may use them; every check selector must match at least one element. `:hover`, `:focus` and `:focus-visible` match nothing in a
  check (no mouse or keyboard; the teacher's checker waits 30 s on a style check that matches nothing): never page-check them. A
  page check cannot pick a pseudo-element (`::before`, `::after`, `::first-letter`). Text from `content` on `::before`/`::after` is
  not page text; `text-transform` on `::first-letter` is (a badge written `solo work` reads `Solo work`), and a floated drop cap
  leaves the page text as it was. Text from `::before` becomes the first letter, so `::first-letter` then styles that symbol.
  `::first-line` follows where the line wraps, which differs between the page window and the checker: never use it in a checked
  page. A misspelt pseudo-class or pseudo-element, one bad selector in a comma list, or a space before the colon drops or empties
  the whole rule; one colon (`:before`, `:first-letter`) still works; a missing quote in `content` drops that declaration and the
  next one only. In a personal run the pseudo-element is drawn online and offline and its text stays out of the page text.
- **Flexbox and media queries (checked 2026-11-11, Resume Week 9).** `display`, `flex-direction`, `flex-wrap`, `row-gap` and
  `column-gap` give the same computed values in CodeShare's page window and the teacher's checker **as long as no media query
  changes them at one of those widths** — the places run at different widths (below), so a property a query sets is not
  comparable between them. Page checks may use these properties only where their value is the same at every width: Week 9
  checks `display` and `flex-wrap` on the queried `nav ul` and `.project-list`, never `flex-direction`.
  Making a box a flex container changes the page text only when it changes whether its children are boxes of their own: a column
  of block-level items (`li`, `p`) reads exactly as before, while `display: flex` on a `nav ul` whose `li` were `inline-block`
  splits one line of links into one line per link. `display: inline` on list items with no flex container above them runs them
  together onto one line, which is page text. `gap` is never page text. It needs a container that lays its children out — flex, grid or multicolumn — so it does nothing
  on an ordinary block, which is what deleting `display: flex` leaves behind (Week 10 uses the same `gap` with `display: grid`).
  `float` on a flex item still computes to `left` but has no effect (W3C: it creates no floating and does not take the item
  out-of-flow), so adding or removing it changes neither the layout nor the page text; a flex row needs no `clear: both` after it.
  **The page runs at different widths in different places, so a media query can be on in one and off in another** (all three
  measured in the app by the Week 9 personal subtest of `tests/web-module-steps.browser.mjs`): on a **module step** the preview
  shares its row with the checks panel, so it is narrower than 900 px and a `max-width: 900px` query is already on; in a
  **personal project** there is no checks panel, so the preview fills the page window (`width:min(1180px,100%)`), which on a
  maximized laptop is wider than 900 px and leaves that query off — but because of the `100%`, a narrow browser window takes it
  back below the breakpoint (measured 776 px at an 820 px viewport), so a personal preview is **not** always on the wide side;
  and the **teacher's checker** runs at 1000 px, above it. The page window itself cannot be dragged, but it follows the browser
  window, so resizing the browser moves a query's condition while you watch: narrow the window if the query is off, widen it if
  it is already on.
  A checked page must therefore keep its page text and every page-checked value identical at every width — never put anything
  inside a query that adds, removes or re-letters a word, and never page-check a property a query changes (Week 9 checks
  `display` and `flex-wrap`, never `flex-direction`, on the queried `nav ul` and `.project-list`). A length in a media feature
  needs its unit: `(max-width: 900)` drops the whole query at every width. `Resume/Week_09/test_checker.py` runs every sample
  and task answer at 760, 800, 899 and 1000 px and fails if any output differs.
- **Personal performance-task project (2026-10-29).** When every `performanceTask.starterFiles`
  path ends in `.html`, `.css` or `.js`, the personal project is a web project: it keeps web files and
  `.txt` backups (Java files are refused), runs `index.html` in the same no-internet preview, and has
  no Program input. A run succeeds when the page finishes loading with no uncaught error; there is
  no expected output. The browser sends the files it ran and the page text; the server accepts this
  online and offline only for the exact saved files, and **Submit this version** still needs that
  successful run. Java performance tasks are unchanged.
- **Sample first and alteration tasks (Java workflow, 2026-10-29).** Net MVC weeks use
  `"sampleFirst": true`, an `activity` with its own `id` (`<step id>-alter-v1`) on every step, and
  `previousModuleId`, like the Java weeks. A web step's sample opens read-only; its unchanged run must
  give the step's `expectedOutput` and pass its `webChecks` (and media lines on a media step) to show
  **Sample verified**. The task is then checked by `activity.expectedOutput` only (plus media lines on a
  media step); `webChecks` do not apply to it, so a task must change the visible page text or the
  console lines. Task answers are not in the file: the teacher keeps them in
  `<week folder>/solutions/<step id>/`, and `tests/web-module-steps.browser.mjs` runs them.
