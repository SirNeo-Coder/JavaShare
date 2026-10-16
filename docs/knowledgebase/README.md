# CodeShare knowledge base

A compact map of CodeShare: where behaviour lives and how the parts fit. It points to files rather than copying code.

## Snapshot

- Written: 2026-10-16
- Base commit: `af1c6f1` (branch `web-workspace`, PR #2)
- Scope: `app/`, `backend/src/`, `supabase/`, `scripts/`, `tests/`, root config
- Not indexed: `node_modules/`, `.next/`, `backend/dist/`, `logs/`, `supabase/.temp/`

## Fast lookup

| Need | Read first |
| --- | --- |
| What CodeShare is, its parts, hosting, online and offline modes | [architecture.md](architecture.md) |
| Find the files for a feature | [feature-index.md](feature-index.md) |
| Tables and how they link | [data-model.md](data-model.md) |
| Server addresses and live (Socket.IO) events | [backend.md](backend.md) |
| Pages and screen parts | [frontend.md](frontend.md) |
| Sign-in, the secret key, who can see what, the web preview sandbox | [security-and-scoping.md](security-and-scoping.md) |
| Commands, settings, migrations, running each mode | [operations.md](operations.md) |
| What teachers and students can do today | [workflow-state.md](workflow-state.md) |
| Course-module file format (stage two) | [../course-format.md](../course-format.md) |
| Has this problem happened before? | [../problem-knowledgebase/README.md](../problem-knowledgebase/README.md) |
| Where the current stage stands | [../handoffs/stage-one.md](../handoffs/stage-one.md) |

## Usage rule

Open one or two pages, then check the files they cite. The code wins if a page is out of date; fix the page.
