# Problem knowledge base

CodeShare's memory of what went wrong: the symptom, the real cause, the fix, and the test that proves it. The regular knowledge base (`../knowledgebase/`) maps what the app is; this one maps past problems.

Bug ids use the prefix **CKB** (CodeShare Knowledge Base): `CKB-001`, `CKB-002`, and so on.

## Before working on a prompt

1. Turn the symptom into a few feature and behaviour words.
2. Run `npm run kb:search -- "<words>"` or read [problem-index.md](problem-index.md).
3. Before editing code, tell the teacher whether a prior case matched.
4. For a match, name the case and summarize its symptom, cause, solution, and regression test.
5. Open only the best-matching case, then do targeted read-only checks of the code and tests.
6. Present the files, steps, checks, risks, and open choices.
7. Stop and wait for the teacher's explicit approval.
8. Only after approval, change code and run the agreed checks.

When a case matches:

```text
Prior debugging match: CKB-NNN — Case title
Previous cause: ...
Previous solution/test: ...
Current approach: verify whether this is the same cause before editing.
```

When nothing matches:

```text
Prior debugging search: no matching case found.
Current approach: diagnose this as a new problem before editing.
```

Then the proposal:

```text
Pre-change proposal
- Goal: ...
- Likely cause/findings: ...
- Files: ...
- Steps: ...
- Checks: ...
- Risks/open choices: ...
- Level of change: workflow change or adjustment?

May I proceed with these changes?
```

Never apply an old fix blindly. Case records are leads; the current code and tests decide.

## After working on a prompt

- **Same cause as an existing case:** update that case's History and evidence.
- **New cause:** copy [case-template.md](case-template.md) to `cases/CKB-NNN-short-name.md` and add a row to the index.
- **Any code-changing or diagnostic prompt:** add a short, cleaned-up line to `prompt-map/YYYY-MM.md`.
- **Long test evidence** (runner output, screenshots) goes in `../verification/CKB-NNN-*.md`.
- Record what was verified, not just what was tried.
- Never record secrets, keys, passwords, tokens, student data, or full prompts.

## Coverage

Started on 2026-10-16 during stage one. CKB-001 to CKB-004 were reconstructed from that session's work. There is no earlier JavaShare history to import.
