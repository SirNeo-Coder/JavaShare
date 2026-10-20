# Week 13: exception handling

Upload `Java2_Week_13.codeshare.json` after Week 12 in the same class. Its stable module id is
`java-2-w13`, with `previousModuleId: "java-2-w12"`. Week 14 already points to this id.
Use the sample-first app and its history migration; see
[setup](../../module-sample-first-setup.md). The original PDF and ILAW DOCX remain unchanged.

The five parts follow the printed Monday–Friday sequence. Each of the thirteen activities
first verifies a complete unchanged sample, then offers a small alteration and its complete
expected output. A successful alteration saves **Completed** and unlocks the next activity.
Liplets remain handwritten work and do not gate progress.

| Digital step | Topic / printed source | Small alteration |
| --- | --- | --- |
| 1 | Step 1 array boundaries, runnable safe version | Remove the Bus entry |
| 2 | Step 2 caught array-index error | Correct the loop bound |
| 3 | Step 3 division by zero | Set four riders |
| 4 | Step 4 null and number-format catches | Use numeric input |
| 5 | Steps 5, 5b, 5c checked-exception handling | Choose the available driver list |
| 6 | Step 6 Scanner and finally | Add three pesos to the fare |
| 7 | Step 7 throwing setter | Supply a valid passenger count |
| 8 | Step 8 throws and combined handling | Accept eight passengers |
| 9 | Step 9 custom exception classes | Change an exception message |
| 10 | Step 10 capacity fields | Change Bus capacity |
| 11 | Step 11 board and quoteFare, normal case | Board four passengers |
| 12 | Step 12 overload, invalid distance and finally | Board three more passengers |
| 13 | Added Friday review | Catch a zero-distance quote |

The current runner blocks disk APIs, including imports from `java.io`. The original
`FileNotFoundException`/real-file example is retained as reading material. Its required runnable
practice uses an in-memory driver list and checked `Exception` instead. This teaches catch and
throws without claiming students practised disk access. Scanner's ordinary input activity keeps
its fixed JSON input. Friendly messages are explicit strings, avoiding JVM-specific wording.
Compiler-error and deliberately crashing examples are reading experiments rather than required
failed sample runs. This adaptation was approved before authorship.

Vehicle classes begin with Week 12's abstract family. The final six supporting classes are
identical to Week 14's starter family, including OverloadException, InvalidDistanceException,
capacity, board and quoteFare. Validation rolls through both weeks and runs Week 14's first
ArrayList sample using the resulting classes. Each new sample supplies a complete working
snapshot; reopening an already started step restores its saved draft.

The personal project continues the student's own Week 12 theme independently. New personal
starters contain Main.java guidance only; module-level `starterFiles` is empty. The grocery
exception example illustrates exception handling, while the student keeps their own OOP family.
Module runs never submit or grade the personal version.

All thirteen samples and thirteen alterations are checked with real laptop Java and browser
Java 8. See [verification](../../verification/week12-week13-modules.md) for commands, named tests
and unverified areas. File persistence, later weeks and the generation prompt/playbook are
separate work.
