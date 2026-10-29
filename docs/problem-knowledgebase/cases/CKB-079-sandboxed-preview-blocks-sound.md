# CKB-079 — Sound never plays in the module preview (media check says playback failed)

- Status: resolved (Cloudflare runtime browser check)
- First recorded: 2026-10-29
- Last verified: 2026-10-29
- Area: `app/WebStepRun.tsx` module preview frame; `app/webPreview.ts` media test
- Search terms: audio playback failed, chime.wav playback failed, sound does not play, video plays but audio fails, NotAllowedError play() user didn't interact, Week 3 media step fails

## Symptom

Found while testing Slice 3b on Cloudflare's runtime with the teacher's Week 3 media: pictures
decoded and the video played, but every step reported `audio/chime.wav: playback failed`, so Steps
2–4, 6 and 7 crossed. The teacher's course-building checker passes the same file.

## Root cause

Chrome's autoplay rule: inside a sandboxed frame (opaque origin) with no autoplay permission,
`play()` on an `<audio>` element is refused with `NotAllowedError` even when muted. Muted `<video>`
is allowed, which is why video passed. The teacher's checker runs the page as a normal tab, not a
sandboxed frame. The WAV itself is fine (it plays in a normal page with `audio/wav`).

## Durable solution

The module preview frame keeps `sandbox="allow-scripts"` (no `allow-same-origin`) and adds
`allow="autoplay"`, which lets the page's media play; the media test still plays muted.

## Regression proof

- `tests/web-module-steps.browser.mjs`: "Week 3 media (Slice 3b, Cloudflare R2): …" on
  `opennextjs-cloudflare preview` (port 8787, local R2).
- Shown failing before the fix: Steps 2–4, 6, 7 `audio/chime.wav: playback failed`; after the fix
  all six media steps pass. A standalone Chromium probe showed `NotAllowedError` with
  `sandbox="allow-scripts"` and playback with `allow="autoplay"` added.
- Only Chromium was tested.

## Recurrence triage

If sound fails but video and pictures pass, check the preview frame still has `allow="autoplay"`.
If everything fails, check the media files were uploaded and loaded (CKB-074 map, Slice 3b).
