# Week 15 three-part report

File: `docs/modules/week15/Java2_Week_15.threepart.codeshare.json` (built 2026-11-15, branch `feature/guided-example`).

## Read this first

- **Upload this file only to a separate test class. Never upload it to your current class.** Every own task has a
  new id, so your current students' Week 15 completions would no longer count, and Week 16 would lock for them.
- Upload it only after the guided-example app change is live. An older server does not know `guided`.
- **Step 1 (CKB-123, fixed by #120):** the old task (create fleet.txt twice) could never pass online. Since #120 the
  current Step 1 task makes trips.txt, which is exactly this file's Step 1 guided example.
- Steps 7 and 8 already had `-v2` ids, so their new ids end in `-v3`.

## How each step was checked

- **Discussion line numbers:** every "Look at line N." and every other line number was compared with that step's
  `Main.java`. Each method or object is named with where it comes from. "As you remember from ..." is used only for
  Week 12 (Four Pillars, polymorphism), Week 13 (checked exceptions, `throws`, `Integer.parseInt`, `Scanner` with
  `System.in`), Week 14 (`List`/`ArrayList`) and earlier Week 15 steps, each found in those modules first.
- **Guided result:** the guided code was run (step files and data files copied into a temporary folder outside the
  app) with laptop Java and with the online runner (CheerpJ). The output had to match the guided expected output
  exactly. Every guided example is the current task (as fixed by #120), with its tested answer and output.
- **Own task result:** the answer was run the same two ways. Its output is the task's expected output, and it differs
  from the guided output on every step.
- Upload rules: passed. A real upload into a throwaway local class: passed. Students receive the guided code but never
  the answer key. Nothing else changed: with the tasks removed, the file is identical to
  `Java2_Week_15.codeshare.json` (sample code and output, step and lesson ids, exit slips, performance task).

| Step | New task id | Discussion lines checked | Guided result | Own task answer | Own task result | Status |
|---|---|---|---|---|---|---|
| 1 | `java-2-w15-d1-s1-alter-v2` | 6, 8, 10, 9, 11, 17 | PASSED | Main.java, lines 12-13 — the two lines added after line 11 ("Created now?"), inside the try, with fares.txt in place of trips.txt:<br>            File fares = new File("fares.txt");<br>            System.out.println("Created fares.txt? " + fares.createNewFile()); | PASSED | OK: the guided example is now the current task (#120); the own task makes fares.txt instead. |
| 2 | `java-2-w15-d1-s2-alter-v2` | 7, 11, 20, 24, 26 | PASSED | Main.java, lines 26-29 — replace line 26 with the guided lines, but with the saved names first:<br>        String[] left = folder.list();<br>        System.out.println("Delete trips.txt? " + trips.delete());<br>        System.out.println("Delete the folder? " + folder.delete());<br>        System.out.println("Left inside: " + Arrays.toString(left)); | PASSED | OK |
| 3 | `java-2-w15-d2-s3-alter-v2` | 9, 10, 12, 14, 18, 26 | PASSED | Main.java, line 7 — the counter:<br>        int spaces = 0;<br><br>Main.java, lines 14-15 — look for a space instead of a comma:<br>                } else if (ch == ' ') {<br>                    spaces++;<br><br>Main.java, line 26 — the label:<br>        System.out.println("Spaces in the file: " + spaces);<br><br>(Line 13 stays as in the sample: no newlines++ there.) | PASSED | OK |
| 4 | `java-2-w15-d2-s4-alter-v2` | 9, 10, 11, 16, 21, 26, 35 | PASSED | Main.java, lines 26-29 — replace line 26 with these four lines (the guided lines with "Jeepney" in place of "Bus"):<br>                    String[] part = line.split(",");<br>                    if (part[0].equals("Jeepney")) {<br>                        fleet.add(toVehicle(line));<br>                    } | PASSED | OK |
| 5 | `java-2-w15-d3-s5-alter-v2` | 9, 10, 11, 12, 14, 20 | PASSED | Main.java, lines 11-15 — replace lines 11-12 with these lines (the guided lines with 20.00 in place of 13.00):<br>                double fare = sc.nextDouble();<br>                if (fare > 20.00) {<br>                    total = total + fare;<br>                    count++;<br>                } | PASSED | OK |
| 6 | `java-2-w15-d3-s6-alter-v2` | 9, 10, 14, 15, 27, 30 | PASSED | Main.java, lines 14-15 — replace line 14 with these two lines (the guided lines with "Jeepney"):<br>            String[] part = line.split(",");<br>            if (part[0].equals("Jeepney")) { | PASSED | OK |
| 7 | `java-2-w15-d4-s7-alter-v3` | 8, 22, 23, 24, 27, 32 | PASSED | Main.java, lines 24-27 — delete them, as in the guided example. Then, right after the TRC 456 write (line 28 before the delete), add:<br>            out.write("NYB 321 left Sangandaan\n"); | PASSED | NEEDS TEACHER REVIEW: Merging two writers has no exact twin. Closest: add a third trip to the same writer. Please check that it is the change you want. |
| 8 | `java-2-w15-d4-s8-alter-v3` | 8, 22, 32, 33, 34, 39 | PASSED | Main.java, line 33 — move  out.write(old);  from before the two new trips to after them:<br>            out.write("BUS 789 left Caloocan\n");<br>            out.write("NYB 321 left Sangandaan\n");<br>            out.write(old); | PASSED | OK |
| 9 | `java-2-w15-d4-s9-alter-v2` | 10, 22, 24, 33, 52, 57, 67 | PASSED | Main.java, line 52 — replace the extra vehicle with a Jeepney:<br>        fleet.add(new Jeepney("NXC 654", "Mang Lito", "Malabon-Divisoria")); | PASSED | OK |
| 10 | `java-2-w15-d4-s10-alter-v2` | 10, 16, 17, 18, 26, 34 | PASSED | Main.java, lines 17-20 — replace lines 17-18 with these lines (the guided lines with "Tricycle"):<br>                if (part[0].equals("Tricycle")) {<br>                    count++;<br>                    report.write(count + ". " + part[1] + " (" + part[0] + ") - " + part[2] + "\n");<br>                } | PASSED | OK |
