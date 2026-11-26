# CKB-144 — Next.js 16.4.2 had known security problems

- Status: resolved on `fix/next-security-update`
- First recorded: 2026-11-25
- Last verified: 2026-11-25
- Area: `package.json`, `package-lock.json` (Next.js and eslint-config-next)
- Search terms: Next.js security vulnerability, SecurityFatalError, build stops with upgrade recommendation, next upgrade
  --agent=security, npm audit next moderate

## Symptom

`npm run build:all` stopped once with "Your version of Next.js is affected by a known security vulnerability" (it built
on retry). `npm audit` listed `next` 16.0.0–16.4.4 as moderate: two cache leaks across root params with `use cache`
(GHSA-mfr8-8qww-v76h, GHSA-vc7v-qv4w-wrv8) and an SVG rejection bypass in image optimization (GHSA-7qx7-33qx-rqx2).

## Root cause

CodeShare was on Next.js 16.4.2. CodeShare uses neither `use cache` nor `next/image`, so the practical risk was low.

## Durable solution

Teacher approved (2026-11-25): `next` and `eslint-config-next` 16.4.2 -> 16.4.6, the current patch release in the same
series, with a plain `npm install` (only the 12 Next.js packages changed in the lock file). The Cloudflare adapter
(`@opennextjs/cloudflare` 1.20.12) already accepts it. Express's own advisories (proxy-addr critical, body-parser high,
qs moderate) are a separate, later piece of work.

## Regression proof

- `npm audit` no longer lists `next`.
- `npm run build:all` (Next.js 16.4.6), `npm run lint` (0 errors), `npm test` 546/546, `npm run cf:build` (local only).
- Offline classroom (`npm run classroom:offline`): teacher and student sign in, class created, Week 12 uploaded, student
  opens a step, Java runs on the laptop (`mode: local`, success); sign-in page loads in the browser.

## History

- 2026-11-25 — Found from the build notice while doing CKB-143; updated on `fix/next-security-update` (teacher approved).
