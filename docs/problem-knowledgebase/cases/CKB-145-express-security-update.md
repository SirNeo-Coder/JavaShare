# CKB-145 — Express 5.2.1 brought in libraries with known security problems

- Status: resolved on `fix/express-security-update`
- First recorded: 2026-11-25
- Last verified: 2026-11-25
- Area: `backend/package.json`, `package-lock.json` (Express and its body-parser, proxy-addr, qs)
- Search terms: express vulnerability, proxy-addr critical, body-parser high, qs moderate, npm audit backend, Render server

## Symptom

`npm audit` (seen while doing CKB-144) listed, through `express` 5.2.1: proxy-addr 2.0.7 critical (IP spoofing via an
IPv4-mapped IPv6 trust subnet, GHSA-jqcg-44mw-7w3h), body-parser 2.3.0 high (denial of service via trailing bytes after a
compressed request body, GHSA-27r3-jxmh-p828) and qs 6.15.3 moderate (three denial-of-service and limit-bypass advisories).

## Root cause

Express is used only by the old standalone Render server, `backend/src/server.ts`; offline classroom mode and Cloudflare
run the routes through Next.js. On Render: `express.raw` reads every body and unpacks compressed ones (the body-parser
case); `trust proxy` is never set (proxy-addr) and Express 5 does not parse web addresses with qs by default, so those two
were low practical risk.

## Durable solution

Teacher approved (2026-11-25), keeping Render for now: `express` `^5.1.0` -> `^5.3.0` in `backend/package.json`; the lock
file now holds express 5.3.0, body-parser 2.4.0, proxy-addr 2.0.8 and qs 6.17.1 (with Express 5.3's own content-type 2.1.0,
content-disposition 2.0.1 and ipaddr.js 1.9.1). Render rebuilds by itself after merge (`render.yaml` deploys on commit).

## Regression proof

- `npm audit`: express, body-parser, proxy-addr and qs no longer listed; no critical left (before 1).
- `npm run build:all`, `npm run lint` (0 errors), `npm test` 546/546.
- The Express server (`backend/dist/server.js`) on the laptop against local Supabase: health, teacher sign-in, a JSON POST
  and a compressed JSON POST work; a compressed body followed by 64 KB of junk is refused with 400 at once.
- Not a regression proof: with body-parser 2.3.0 put back, that junk-bytes request was refused the same way, so the check
  does not reproduce the published problem. The evidence is the fixed version numbers and the audit result.
- Offline classroom (`npm run classroom:offline`): sign-in, class, Week 12 upload, module step, laptop Java run pass.

## History

- 2026-11-25 — Found by `npm audit` during CKB-144; updated on `fix/express-security-update` (teacher approved).
