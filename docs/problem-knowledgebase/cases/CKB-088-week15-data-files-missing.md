# CKB-088 — Week 15 samples cannot find fleet.txt online

- Status: resolved locally (online); offline Week 15 still blocked by the laptop runner's file rule
- First recorded: 2026-10-30
- Last verified: 2026-10-30
- Area: online Java (`app/javaExecution.ts`, `java-runtime/public/runner.js`, `vendor/java/CodeShareJava.java`), Java module projects (`backend/src/routes.ts`, `backend/src/supabase-repository.ts`, `backend/src/course-module-schema.ts`, `backend/src/file-paths.ts`), Week 15 content
- Search terms: Cannot read: fleet.txt (No such file or directory), First line empty, Commas in the file: 0, Sample not verified, Week 15 task two, Activity Two Step 3, Java File Handling, fares.txt missing, open fleet.txt in Notepad, data file, .txt file in Java project

## Symptom

A student opened Week 15 (Self-Paced Module: Java File Handling), Step 3, online. Running the
unchanged sample showed **Sample not verified** with Actual output
`Cannot read: fleet.txt (No such file or directory)`, `First line: ` and `Commas in the file: 0`
instead of the expected first fleet line and `12`. The file tabs showed only `.java` files.

## Root cause

The Week 15 lessons were written for a desktop folder: Step 1 makes `fleet.txt`, Step 3a tells the
student to type four lines into it with Notepad, and later steps keep reading files earlier steps
left behind. CodeShare runs each step alone in an empty folder (CheerpJ's filesystem is cleared
before every run, CKB-072), and the Java runners accepted only `.java` files. When the module was
converted, `fleet.txt` and `fares.txt` were moved out of the step files into
`docs/modules/week15/supporting-files/` and a test fixture, so their contents appeared nowhere a
student could see them. Real Java in an empty folder gives exactly the output the student saw.

Seven steps failed this way: 3, 4, 6, 9 (`fleet.txt`), 5 (`fares.txt`), 8 (`trip_log.txt` from
Step 7) and 10 (`fleet_backup.txt` from Step 9). The existing curriculum test hid it because it ran
every step in one shared desktop folder and copied the data files in.

## Durable solution

- A Java project may carry `.txt` data files (`javaProjectPath` in `backend/src/file-paths.ts`:
  a valid Java path, or a safe `.txt` name with no `..`, leading `/` or hidden names). The same rule
  is used by upload (`course-module-schema.ts`), the Java file routes (`routes.ts` `javaPath`),
  opening a step (`supabase-repository.ts`), `runJava` and the runner page.
- The browser bridge (`vendor/java/CodeShareJava.java`, rebuilt into
  `java-runtime/public/codeshare-runner.jar`) writes each `.txt` file at the same relative path
  the student's program opens (`new FileReader("fleet.txt")`) and never compiles it. The laptop
  runner writes it beside the sources and compiles only `.java` files.
- Week 15 steps 3, 4, 5, 6, 8, 9 and 10 supply their data files in the step's own files, with the
  contents a desktop run of the earlier steps would leave. Steps 3a and 5a now say the file is
  already in the file tabs. Task requirements and expected outputs are unchanged, so activity ids
  are unchanged.
- Offline Week 15 still cannot run: the laptop runner refuses any program using `java.io` (a
  safety rule). The teacher chose online only for now (2026-10-30).

## Regression proof

- `tests/week15-week21-modules.test.mjs`: `Week 15: each sample and alteration runs alone from its
  own step files, as CodeShare runs it (CKB-088)` — every step in a fresh empty folder through the
  real bridge JAR. With the Week 15 JSON from `main` it failed for Steps 3, 4, 5, 6, 8, 9 and 10;
  restored, 11/11 passed.
- `tests/java-data-files.test.mjs` (6 tests: path rule, upload, bridge, runner page, laptop runner,
  and opening + completing a step with `fleet.txt` through the real routes on local Supabase).
  With the runner, bridge, routes, schema and laptop runner from `main`, 5 failed and the path-rule
  test passed; restored, 6/6 passed.
- `tests/browser-java-client.test.mjs`: `browser Java: sends a step's .txt data file with its
  sources and refuses unsafe names (CKB-088)` — failed with `main`'s `runJava`, passed restored.
- Command: `node --test tests/week15-week21-modules.test.mjs tests/java-data-files.test.mjs tests/browser-java-client.test.mjs`
- Live: the real runner page and real CheerpJ 4.3 (loaded from `cjrtnc.leaningtech.com`) ran all
  ten Week 15 samples from their step files. Nine matched; Step 8 did not, because of CKB-089.
- Real app, local online mode (`next dev` with `JAVA_RUNNER_URL` set to the local runner page,
  real CheerpJ, local Supabase, disposable student; Week 15 uploaded without `previousModuleId` and
  Steps 1–2 marked done): Step 3 showed the `fleet.txt` tab with the four lines; **Run code** on the
  unchanged sample gave **Sample verified**; the alteration gave **Completed — saved to CodeShare**,
  and the server copy held Main.java and an unchanged `fleet.txt`. Test data deleted afterwards.
- Not run: the hosted site (Cloudflare) or the full Week 12–15 prerequisite chain.
- Branch: `fix/week15-data-files`

## Recurrence triage

If a sample that opens a file fails online with `No such file or directory`, check whether the
step's own `files` include that file. Each step runs alone: never rely on a file an earlier step
made. If the file is present and the content is wrong after writing, suspect CheerpJ (CKB-073,
CKB-089) and compare with real Java.

## History

- 2026-10-30 — Teacher reported Week 15 Step 3 failing online with a screenshot. Diagnosed with
  real Java (empty folder reproduces the screenshot exactly). Teacher approved the data-file plan
  and online only for now. Built on `fix/week15-data-files`; live CheerpJ probe found CKB-089.
