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

Current saved files always win and missing supporting files are added. `src/Main.java` and
`Main.java` identify the same source. At most 50 valid Java files compile together. Supply
`previousModuleId` to continue the correct preceding week; without it a new project starts from
its supplied starter files. Preceding weeks and submitted snapshots are never overwritten.

The first part opens automatically. Every sample step in a part must pass before the next part
opens; named parts may span lessons. Compile and run successfully with exact expected output:
normalize CRLF and ignore one final println newline, but never trim spaces or extra blank lines.
The server verifies results; browser-supplied pass flags are refused. Earlier passes survive
later failed practice runs. Automatic checking supports Java only.

Liplets are handwritten, assessed by the teacher, and never gate progress. The existing completion
percentage counts passed sample steps plus the two performance-task submission records, equally.
The performance task opens after the module steps pass. Personal **Save work** and **Run code**
do not submit or grade it; **Submit this version** records the student's own version explicitly.
Existing sample/own records and assessment remain compatible. Personal input is entered in Console.

Teacher availability switches do not gate students; their old API/data remain compatible. The
weekly live-class restriction still applies. Online multi-file Java is the next planned step;
offline mode continues compiling all classes together with laptop javac.
