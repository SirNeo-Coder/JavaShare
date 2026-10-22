# Re-upload the corrected Week 18–21 Java links

The correction changes only `previousModuleId` in four JSON files. Module ids, activity ids,
lessons, code and expected outputs are unchanged. No new migration or app behavior is required
for this repair. These instructions assume the existing shared-library app is already in use.

## Teacher steps

1. Open one of **your Java classes → Curriculum**. Confirm the class uses **Java modules**.
   This is your shared Java library: an upload here updates all your Java classes, including
   ones created later. It does not update Net MVC or another teacher's library.
2. Use **Add module** to select each corrected file below, in order. The filenames need not
   change. Keep the `id` inside each file exactly as supplied. Do not delete the old modules
   first or create replacement ids; upload with the existing id updates its shared content.

   | Week | Corrected file | Existing module id | Correct predecessor |
   | --- | --- | --- | --- |
   | 18 | [Java2_Week_18.codeshare.json](modules/week18/Java2_Week_18.codeshare.json) | `java-2-w18-module` | `java-2-w17-module` |
   | 19 | [Java2_Week_19.codeshare.json](modules/week19/Java2_Week_19.codeshare.json) | `java-2-w19-module` | `java-2-w18-module` |
   | 20 | [Java2_Week_20.codeshare.json](modules/week20/Java2_Week_20.codeshare.json) | `java-2-w20-module` | `java-2-w19-module` |
   | 21 | [Java2_Week_21.codeshare.json](modules/week21/Java2_Week_21.codeshare.json) | `java-2-w21-module` | `java-2-w20-module` |

3. Confirm Weeks 12–17 are already in this same library. Upload only genuinely missing earlier
   modules, using their existing files/ids. Week 17's id stays `java-2-w17-module`; it does not
   need a correction. The full chain is:

   ```text
   java-2-w12 → java-2-w13 → java-2-w14 → java-2-w15 → java-2-w16
     → java-2-w17-module → java-2-w18-module → java-2-w19-module
     → java-2-w20-module → java-2-w21-module
   ```

4. **Refresh** Curriculum in another Java class. Students should save any current edits,
   then refresh/reopen **Modules**. Existing open pages do not receive a live content replacement.
5. A student with unfinished earlier tasks should see **Complete Week N before starting Week M**
   and **Continue Week N**. Once every required earlier task passes, the correct next week opens.
   Sample verification alone is insufficient. Personal submissions and paper liplets remain
   separate. Week 20 remains written work; it does not gain invented Java tasks.
6. Check an existing student's saved Module project, personal draft, completions and submitted
   versions. Their ids/class records are unchanged; the upload does not copy over or reset them.
   Existing later work remains saved even if the corrected full chain requires earlier tasks
   before it can be reopened. Already-created projects are not recopied from a preceding week.
7. Hosted and offline libraries are independent. Repeat the same four uploads in the offline
   classroom when needed; uploading online does not transfer the files to the laptop database.

Do not restore an older saved class upload over these corrections through **Replace shared version**:
those backup JSON copies may still contain the old links. Use these corrected files with **Add module**.
The assistant has not uploaded anything to your hosted library.

## Limits

This repairs prerequisite references, not curriculum runtime support. Week 15 classroom disk APIs
remain blocked; original Week 16 timing/order assumptions and visible/browser GUI support retain
their existing limits. The earlier Week 17 feedback timeout did not recur in this repair's local
browser run; its cause is still undiagnosed and no feedback/runner change was made.

[Named verification results](verification/curriculum-prerequisite-links.md).
