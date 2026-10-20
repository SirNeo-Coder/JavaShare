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
| `"step"` | `id` (e.g. `"java-2-w15-d1-s1"`), `number`, `instruction` (markdown), `language` (`"java"` \| `"html"` \| `"css"` \| `"javascript"` \| `"csharp"`), `files` (File[] — the files the student puts in or replaces), `run` (optional: the file to run, e.g. `"Main.java"` or `"index.html"`), `expectedOutput` (the **real** output, exactly as produced), `checkYourself` (optional markdown), `activity` (optional — see below), `part` (optional string — see "Parts" below) |
| `"error"` | `language`, `markdown` (what causes it), `message` (the **real** error text) |
| `"errorGuide"` | `rows`: `[{ "see": "...", "means": "...", "fix": "..." }]` |

`markdown` supports only: `**bold**`, `*italic*`, `` `code` ``, `[text](https://link)`, bullet lists (`- `), and blank lines between paragraphs. No HTML.

### ExitSlip

`{ "id": "java-2-w15-d1-slip", "points": 15, "afterStep": "java-2-w15-d1-s2", "questions": [ { "id": "1.1", "kind": "Define", "points": 5, "prompt": "..." } ] }`

`kind` is one of `Define`, `Explain`, `Connect`, `Identify`, `Choose`, `Point`, `Evaluate`, `Apply`, `Reflect`.

### PerformanceTask

`{ "id": "java-2-w15-pt", "title": "...", "markdown": "...", "checklist": ["..."], "exampleFiles": File[], "starterFiles": File[], "presentationOutline": ["..."], "questionsToPrepare": ["..."], "rubric": [ { "criterion": "...", "points": 10 } ], "totalPoints": 50 }`

### Parts

The module viewer groups a module's steps into named, gated parts a student unlocks one at a time (e.g. "Introduction", "File basics", "Reading files" — matching how the discussion actually flows, not necessarily one part per day; a part can cover steps from more than one lesson). Give a step a `part` title to put it in that part; any text/definition/analogy/table/note blocks between it and the previous step join the same part. A step with no `part` falls back to its own lesson as the part — so a module written before this field existed still groups sensibly, one part per lesson, with no changes needed.

### Rules

1. Every `id` is unique across the whole course and **never changes** once published — student progress is recorded against these ids.
2. If content is corrected later, keep the same ids; CodeShare replaces the content and keeps progress.
3. Code and outputs in this file must be **identical** to the printed module.

### Student activities (approved workflow, 2026-10-20)

A step's `files`, `instruction`, and `expectedOutput` remain its printed worked example. Add an
`activity` to give the student a different challenge without altering the printed sample:

```json
"activity": {
  "instruction": "Change Jeepney's capacity to 25 and print it from Main.java.",
  "files": [{ "path": "Main.java", "content": "public class Main { public static void main(String[] args) { Vehicle v = new Jeepney(\"NXA 123\"); System.out.println(\"Capacity: \" + v.getCapacity()); } }" }],
  "expectedOutput": "Capacity: 25",
  "stdin": ""
}
```

`instruction` and `expectedOutput` are required. `files` defaults to an empty array (continue the
existing project); `stdin` defaults to an empty string and supplies fixed input for the check.
A new activity has its own saved completion key, so a pass earned on the old sample does not
complete a newly added challenge. Older steps without `activity` use their original sample files, instructions and expected output.
CodeShare does not invent a new exercise for an old JSON file. Automatic checking currently
supports Java only; other languages remain readable but cannot automatically pass an activity.

Students use the main classroom code editor, **Run code**, and **Save work**. Each student has one
saved project per module per class. Start with module `starterFiles`, then activity files (or old
step files), then this student's preceding project when `previousModuleId` is supplied. Later
sources win by filename; `src/Main.java` and `Main.java` identify the same source. Existing files
in the current project always win, so opening another activity never replaces student edits.
Missing supporting files may be added. At most 50 valid Java files can compile together.

The first part opens automatically. All steps in a part must pass before the next part opens;
named parts can span lessons. A pass requires successful compilation, successful execution, and
matching expected output (CRLF line endings normalized; whitespace trimmed only at the ends).
The server runs and checks the saved sources; a browser-supplied `pass` cannot complete a step.
Earlier passes remain available for review even if a later exploratory run fails.

Liplets are handwritten and submitted to the teacher; they do not block progress or enter the
completion percentage. The percentage counts passed steps and the two performance-task
submissions, equally. The performance task opens after all lesson activities pass; its existing
submission and assessment workflow is retained. This change implements lesson activities first.

Teacher **Open to students** switches are removed from the viewer. Their old stored values and
API remain for compatibility, but do not control student progression. Existing progress ids,
saved files and submissions are preserved. The existing live-class weekly module restriction
still applies. Online Java support is unchanged: the current hosted fallback cannot compile
multiple files; offline classroom mode uses the teacher laptop's JDK.

Complete example: [student-activity.codeshare.json](../tests/fixtures/student-activity.codeshare.json).
