"""Builds the printed three-part step pages (source/p9.html onward) from DotNet1_Week_01.threepart.codeshare.json:
each step's numbered sample, discussion, guided example and Your task with expected outputs. Never the answer key.
Usage: python3 build_step_pages.py   (then node render_pdf.cjs)"""
import html, json, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
SRC = HERE / "source"
module = json.loads((HERE / "DotNet1_Week_01.threepart.codeshare.json").read_text())
steps = {b["number"]: (lesson["dayLabel"], b) for lesson in module["lessons"] for b in lesson["blocks"] if b["type"] == "step"}
GROUPS = [[n] for n in range(1, 10)]  # one step per page; every page must print on one sheet
FIRST = 9  # pages 1-8 are the lessons and the exit-slip strips
LAST = FIRST + len(GROUPS) - 1  # the last step page
TOTAL = LAST + 1  # p18: before you submit, the old task pages' other sections (CKB-146), kept as it is

def inline(text):  # the module's small Markdown: `code` and **bold**
    parts = re.split(r"(`[^`]+`)", text)
    out = "".join(f"<code>{html.escape(p[1:-1])}</code>" if p.startswith("`") else html.escape(p) for p in parts)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", out)

def output(text):
    return '<pre class="out">' + "".join(f'<span class="ln">{html.escape(line)}</span>' for line in text.split("\n")) + "</pre>"

def numbered(text):
    return '<pre class="code numbered">' + "".join(f'<span class="cl">{html.escape(line) or " "}</span>' for line in text.rstrip("\n").split("\n")) + "</pre>"

def step_html(number):
    day, s = steps[number]; a = s["activity"]; g = a["guided"]
    bullets = "".join(f"<li>{inline(line[2:])}</li>" for line in g["discussion"].split("\n") if line.startswith("- "))
    return (f'<section class="step3" data-step="{s["id"]}"><h3><span class="day">{day}</span> STEP {number} · {html.escape(s["files"][0]["path"])}</h3>'
            f'<div class="two"><div><p class="small"><b>1 · Sample</b> (run it unchanged)</p>{numbered(s["files"][0]["content"])}</div>'
            f'<div><p class="small"><b>Discussion</b></p><ul class="disc">{bullets}</ul>'
            f'<p class="small"><b>2 · Guided example</b></p><p class="instruction">{inline(g["instruction"])}</p>'
            f'<pre class="code">{html.escape(g["code"])}</pre><p class="small"><b>Expected guided output</b></p>{output(g["expectedOutput"])}'
            f'<p class="small"><b>3 · Your task</b> (no code given: the guided example is your clue)</p><p class="instruction">{inline(a["instruction"])}</p>'
            f'<p class="small"><b>Expected task output</b></p>{output(a["expectedOutput"])}</div></div></section>')

HOW = ('<div class="note"><b>Three parts for every step.</b> In CodeShare, <b>Work in code editor</b> loads the step\'s sample. '
       '<b>1</b> Run it unchanged: <b>Sample verified</b>. Read the discussion with the numbered sample beside it. '
       '<b>2</b> Type the guided example on the line it names and run: <b>Guided example verified</b>. It does not complete the step. '
       '<b>3</b> Do Your task on your own and run: matching the <b>Expected task output</b> shows <b>Completed</b>, saves your progress '
       'and opens the next step. Spaces and line breaks count. In an output box, an indented line continues the line above it.</div>')
TICKS = ('<table class="t ticks3"><tr><th>Check yourself</th><th>Sample verified</th><th>Guided example verified</th>'
         '<th>The line I expect to change (write before running)</th><th>Task output matches</th></tr>'
         + "".join(f'<tr><td>{steps[n][0].title()} Step {n}</td><td>☐</td><td>☐</td><td class="write"></td><td>☐</td></tr>' for n in sorted(steps))
         + "</table>")

for old in SRC.glob("p*.html"):
    if FIRST <= int(old.stem[1:]) <= LAST: old.unlink()
for index, group in enumerate(GROUPS):
    number = FIRST + index
    head = ('<h1>Week 01 step guide</h1><p class="sub">.NET 1 · HTML Fundamentals, Paragraphs and Lists · '
            'Sample, guided example and your task for every step, in CodeShare</p>' + HOW + TICKS) if index == 0 else ""
    (SRC / f"p{number}.html").write_text(
        f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Week 01 step guide</title><link rel="stylesheet" href="tasks.css"></head>'
        f'<body class="w1"><div class="page">{head}{"".join(step_html(n) for n in group)}'
        f'<footer class="foot">.NET 1 · Week 01 · Step guide · Page {number} of {TOTAL} · Keep this page with your module</footer></div></body></html>')
print(f"pages {FIRST}-{LAST} written")
