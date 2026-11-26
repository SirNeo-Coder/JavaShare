# CKB-146 — .NET 1 printed step guide dropped the self-check, get-ready and starter sections

- Status: resolved: Week 3 on `content/dotnet1-week03-print`, Weeks 1 and 2 on `content/dotnet1-restore-print-sections`
- First recorded: 2026-11-25
- Last verified: 2026-11-25
- Area: printed modules, `docs/modules/dotnet1/week0N/build_step_pages.py` (step guide, pages 9 onward)
- Search terms: PDF step guide, self-check missing, Get ready for Week, starter pages missing, presentation notes,
  Before you add your picture, page 10 sections lost, printed module lost sections

## Symptom

Found while building the Week 3 PDF. The old task pages 9–11 also held non-task sections, and the step-guide builder
deleted those pages and wrote only step pages:

- Week 1 PDF lost: My Resume self-check, My presentation notes (Friday), Get ready for Week 2.
- Week 2 PDF lost: Before you add your picture, My Resume self-check, Get ready for Week 3.
- Week 3 would have lost: Before you add your pages, My Resume self-check, Get ready for Week 4, and the starter pages
  for a student with no Week 2 work, which page 6 points to.

Neither report mentioned it; no check compared the old pages' sections with the new ones.

## Root cause

`build_step_pages.py` (Week 1, copied for Week 2) deletes every page from 9 onward and rebuilds only the steps, assuming
pages 9–11 held only tasks.

## Durable solution

Week 3 (teacher, 2026-11-25): the four sections stay unchanged on page 18 ("Week 03: before you submit"), page 6 points
to page 18, and the builder rebuilds only pages 9–17. Weeks 1 and 2 (teacher, 2026-11-25): the same, page 18 "Week 0N:
before you submit" holds their lost sections copied unchanged from the old pages, footers "of 18", builders rebuild only
pages 9–17. The prompt now says to list and keep such sections first.

## Regression proof

`tests/dotnet1-week03-three-part.test.mjs` ("the printed step pages…") checks page 18 keeps all four sections and page 6
points there; `tests/dotnet1-week01-three-part.test.mjs` and `tests/dotnet1-week02-three-part.test.mjs` ("page 18 keeps the
old task pages' other sections") check page 18 and every footer. Shown failing with Week 1's page 18 removed and with
Week 2's old footers, then passing.
