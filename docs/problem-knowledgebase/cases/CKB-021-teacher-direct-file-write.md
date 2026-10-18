# CKB-021 — Existing file-save API lets the class teacher overwrite a student file

- Status: investigating
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: backend/src/supabase-repository.ts (accessibleProject, fileContext, saveSupabaseFile)
- Search terms: teacher direct save student file, read-only UI writable API, teacher PUT file, student source overwritten by teacher

## Symptom

Found while checking the approved teacher web-project viewer. A class teacher's direct
`PUT /api/files/:fileId` with a disposable student's file id/version returned 200 and changed
its saved content, despite the existing teacher source editor being read-only. This was a
local test only, not a reported live incident. The disposable content was restored afterward.

## Root cause

`accessibleProject` checks whether the teacher can access the student's team. `fileContext`
and `saveSupabaseFile` then permit the write without distinguishing read access from write
access for the class teacher. Personal workspaces skip the group-lock checks. This path already
existed before item 5 (same source in base commit `ae234a6`); the new viewer does not add it.

## Durable solution

Not implemented. Needs its own proposal/approval for existing file-write permissions, including
which teacher operations should remain allowed and review of other project mutations. The
approved item-5 viewer adds only GET routes, read-only source fields, and no save controls.
Do not mistake that UI restriction for a global server-side write prohibition.

## Regression proof

- Local direct-request reproduction against the production app with disposable fixtures:
  logged in as the class teacher; retained the file's original content/version; PUT replacement
  content through the existing `/api/files/:fileId`; observed 200 and the replacement in the
  local database; restored the original content. No permission setting changed.
- Temporary verification command: `sg docker -c 'node /tmp/codeshare-teacher-web-actions.mjs direct-write-check'`.
- **Unresolved:** no fix and therefore no failing-before/passing-after regression test yet.
  Do not add a permanent test requiring the unsafe 200 behavior.
- The new viewer's tests separately prove its GET routes never save and reject write methods;
  those tests do not claim to cover or repair this older endpoint.
- Record commit: pending item-5 implementation commit on `codex/teacher-web-projects`.

## Recurrence triage

Distinguish a teacher editing their own demo workspace (allowed) from a direct write to a
student's personal file. Check the saved file/version and request identity; a student save
or a group teammate's authorized save is a different path. A visible read-only field alone
does not establish server enforcement.

## History

- 2026-10-18 — Detected and reproduced locally during teacher web-project verification.
  Recorded separately without expanding item 5 into a permission rewrite. No hosted data changed.
