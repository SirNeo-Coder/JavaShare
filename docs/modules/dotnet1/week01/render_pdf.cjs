// Prints source/p1.html … pN.html with Chromium at 8.5 × 13 in (612 × 936 pt) and joins them into the module PDF.
// Usage: node render_pdf.cjs [out.pdf]   (needs pdfunite; Playwright from CODEX_NODE_MODULES, as check_web_steps.cjs)
const fs = require('fs'), path = require('path'), os = require('os'), {execFileSync} = require('child_process');
const {pathToFileURL} = require('url');
const deps = process.env.CODEX_NODE_MODULES || '/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium} = require(path.join(deps, 'playwright'));
(async () => {
  const out = path.resolve(process.argv[2] || path.join(__dirname, 'DotNet1_HTML_Fundamentals_Lists_Module.pdf'));
  const pages = fs.readdirSync(path.join(__dirname, 'source')).filter((name) => /^p\d+\.html$/.test(name))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'w01-pdf-'));
  const browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_PATH || '/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome'});
  try {
    const context = await browser.newContext({offline: true});
    await context.route(/^https?:/, (route) => route.abort());
    const parts = [];
    for (const name of pages) {
      const page = await context.newPage();
      await page.goto(pathToFileURL(path.join(__dirname, 'source', name)).href);
      const part = path.join(temp, name.replace('.html', '.pdf'));
      await page.pdf({path: part, preferCSSPageSize: true, printBackground: true});
      const count = Number(execFileSync('pdfinfo', [part], {encoding: 'utf8'}).match(/Pages:\s+(\d+)/)[1]);
      if (count !== 1) throw Error(`${name} prints on ${count} pages; it must fit on one`);
      parts.push(part); await page.close();
    }
    execFileSync('pdfunite', [...parts, out]);
    console.log(`${out}: ${parts.length} pages`);
  } finally { await browser.close(); fs.rmSync(temp, {recursive: true, force: true}); }
})().catch((e) => { console.error(e.message); process.exit(1); });
