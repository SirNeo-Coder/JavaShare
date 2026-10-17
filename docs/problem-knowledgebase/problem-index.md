# Problem index

Search symptoms, user wording, features, and test language here first.

| Case | Symptom and search terms | Root-cause class | Status | Evidence |
| --- | --- | --- | --- | --- |
| [CKB-001](cases/CKB-001-login-subtitle-still-says-java.md) | login card says "Collaborative Java classroom" after rename, old name, JavaShare leftover, sign-in screen text | missed literal during rename | resolved, checked on screen | `ee95ef2` (PR #1) |
| [CKB-002](cases/CKB-002-web-preview-wrong-line-numbers.md) | web preview console wrong line number, error points to wrong line, line off by one, after stylesheet or script tag | line-mapping logic claimed an empty line early | resolved, unit tests failed before fix | `5ca6334` (PR #2) |
| [CKB-003](cases/CKB-003-web-project-says-java-files.md) | sidebar says "3 Java file(s)" for a web project, Repository count wrong language | hard-coded Java wording | resolved, checked on screen | `02bb903` (PR #2) |
| [CKB-004](cases/CKB-004-preview-hint-wraps.md) | "Press Run to see your page here" split onto three lines, preview hint broken, empty preview text | CSS grid turned text pieces into separate cells | resolved, checked on screen | `02bb903` (PR #2) |
| [CKB-005](cases/CKB-005-java-enabled-label-in-demo-mode.md) | Group status says "Java execution enabled" / "Teacher computer" while Run code says demo execution mode, online Java label wrong | hard-coded status text | investigating, not fixed | seen on Cloudflare preview 2026-10-17 |
| [CKB-006](cases/CKB-006-server-live-signals-lost-on-cloudflare.md) | chat not arriving on Cloudflare, classroom chat missing, activity or live share not appearing live online, works offline | unawaited fetch cancelled after the Worker replies | resolved, test failed before fix; teacher re-tested on the preview | `cloudflare-c2` |
