// The workspace header must keep Present this code / Lesson library visible while a class session
// or a shared step adds boxes to it (CKB-118), and End session / Stop sharing usable at every width (CKB-120). Lays out the header markup from app/page.tsx with the real stylesheet.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || 'playwright');

const box = (title, note, button) => `<div class="presence"><span><b>${title}</b><small>${note}</small></span>${button ? `<button type="button" class="secondary">${button}</button>` : ''}</div>`;
const page = (extra) => `<div class="app-shell"><section class="workspace classroom-workspace"><section class="main-area">
<div class="workspace-mode"><span>TEACHER WORKSPACE</span><b>Lesson demonstration</b></div>
<div class="team-header"><div class="team-heading"><span class="team-icon blue">L</span><div><h1>Live Classroom</h1><p>Live Lesson Code · src/Main.java</p></div></div>
${extra}${box('Lesson demonstration', 'Persistent teacher workspace')}
<div class="team-buttons"><button class="secondary present-code">Present this code</button><button class="secondary">Lesson library</button></div></div>
<div class="content-grid"><section class="editor-card"><div class="workspace-card-heading"><b>Code editor</b></div><div class="file-tabs"></div><div></div><div></div></section><aside class="right-panel"></aside></div>
<footer class="actionbar"></footer></section></section></div>`;
// Class session box with the step count (SessionStepDone, CKB-108), the widest real header.
const stepCount = '<div class="session-step-done"><button type="button">Step 12 · <b>17/32</b> done</button><div role="tooltip"><b>Done (17)</b></div></div>';
const sessionWithCount = `<div class="presence"><span><b>Class session</b><small>Students follow your worksheet</small></span>${stepCount}<button type="button" class="secondary">End session</button></div>`;
const extras = {
  'no session': '',
  'class session': box('Class session', 'Students follow your worksheet', 'End session'),
  'class session and shared step': box('Class session', 'Students follow your worksheet', 'End session') + box('Shared with class', 'Week 15 · Step 2', 'Stop sharing'),
  'class session with step count': sessionWithCount,
  'step count and shared step': sessionWithCount + box('Shared with class', 'Week 15 · Step 2', 'Stop sharing'),
};

test('workspace header: buttons stay inside the header at every width', async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const tab = await browser.newPage();
    for (const [name, extra] of Object.entries(extras)) for (const width of [1600, 1200, 1000, 950, 901, 800, 600, 420]) {
      await t.test(`workspace header: ${name} at ${width}px`, async () => {
        await tab.setViewportSize({ width, height: 800 });
        await tab.setContent(page(extra));
        await tab.addStyleTag({ content: readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8') });
        const m = await tab.evaluate(() => {
          const r = (s) => document.querySelector(s).getBoundingClientRect();
          const header = document.querySelector('.team-header');
          const clickable = (b) => { const box = b.getBoundingClientRect(); return box.width > 0 && b.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); };
          return { buttons: r('.team-buttons').bottom, headerBottom: r('.team-header').bottom, grid: r('.content-grid').top, sideways: header.scrollWidth > header.clientWidth,
            headerButtons: [...document.querySelectorAll('.presence button, .team-buttons button')].map((b) => [b.textContent, clickable(b)]) };
        });
        assert.ok(m.buttons <= m.headerBottom + 0.5, `buttons end at ${m.buttons}, header ends at ${m.headerBottom}`);
        assert.ok(m.buttons <= m.grid + 0.5, `buttons end at ${m.buttons}, Code editor starts at ${m.grid}`);
        assert.equal(m.sideways, false, 'header must not scroll sideways');
        assert.equal(m.headerButtons.filter(([label]) => /Present this code|Lesson library/.test(label)).length, 2, 'both primary header buttons rendered');
        for (const [label, ok] of m.headerButtons) assert.ok(ok, `${label} must be visible and clickable (CKB-118, CKB-120)`);
      });
    }
  } finally { await browser.close(); }
});
