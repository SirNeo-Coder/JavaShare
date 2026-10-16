# CodeShare module file format (`codeshare-module`, version 1)

One file per teaching week, named `<Course>_Week_NN.codeshare.json` (for example `Java2_Week_15.codeshare.json`). It is plain JSON, UTF-8. CodeShare loads it into the course library; the teacher then decides which lessons open, when, and for which section. **Lessons are never tied to calendar dates inside this file.**

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
| `"step"` | `id` (e.g. `"java-2-w15-d1-s1"`), `number`, `instruction` (markdown), `language` (`"java"` \| `"html"` \| `"css"` \| `"javascript"` \| `"csharp"`), `files` (File[] — the files the student puts in or replaces), `run` (optional: the file to run, e.g. `"Main.java"` or `"index.html"`), `expectedOutput` (the **real** output, exactly as produced), `checkYourself` (optional markdown) |
| `"error"` | `language`, `markdown` (what causes it), `message` (the **real** error text) |
| `"errorGuide"` | `rows`: `[{ "see": "...", "means": "...", "fix": "..." }]` |

`markdown` supports only: `**bold**`, `*italic*`, `` `code` ``, `[text](https://link)`, bullet lists (`- `), and blank lines between paragraphs. No HTML.

### ExitSlip

`{ "id": "java-2-w15-d1-slip", "points": 15, "afterStep": "java-2-w15-d1-s2", "questions": [ { "id": "1.1", "kind": "Define", "points": 5, "prompt": "..." } ] }`

`kind` is one of `Define`, `Explain`, `Connect`, `Identify`, `Choose`, `Point`, `Evaluate`, `Apply`, `Reflect`.

### PerformanceTask

`{ "id": "java-2-w15-pt", "title": "...", "markdown": "...", "checklist": ["..."], "exampleFiles": File[], "starterFiles": File[], "presentationOutline": ["..."], "questionsToPrepare": ["..."], "rubric": [ { "criterion": "...", "points": 10 } ], "totalPoints": 50 }`

### Rules

1. Every `id` is unique across the whole course and **never changes** once published — student progress is recorded against these ids.
2. If content is corrected later, keep the same ids; CodeShare replaces the content and keeps progress.
3. Code and outputs in this file must be **identical** to the printed module.
