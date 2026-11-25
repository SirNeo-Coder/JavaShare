"""Builds the printed three-part step pages (source/p9.html onward) from DotNet1_Week_02.threepart.codeshare.json:
each step's sample lines that the discussion and guided example name (real line numbers, "…" between parts; Week 2
samples run to 119 lines, teacher's option A, 2026-11-25), discussion, guided example and Your task, with the two
expected outputs side by side. Never the answer key.
Usage: python3 build_step_pages.py   (then node render_pdf.cjs)"""
import html, json, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
SRC = HERE / "source"
module = json.loads((HERE / "DotNet1_Week_02.threepart.codeshare.json").read_text())
steps = {b["number"]: (lesson["dayLabel"], b) for lesson in module["lessons"] for b in lesson["blocks"] if b["type"] == "step"}
GROUPS = [[n] for n in range(1, 10)]  # one step per page; every page must print on one sheet
FIRST = 9  # pages 1-8 are the lessons and the exit-slip strips
LAST = FIRST + len(GROUPS) - 1

def inline(text):  # the module's small Markdown: `code` and **bold**
    parts = re.split(r"(`[^`]+`)", text)
    out = "".join(f"<code>{html.escape(p[1:-1])}</code>" if p.startswith("`") else html.escape(p) for p in parts)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", out)

def output(text):
    return '<pre class="out">' + "".join(f'<span class="ln">{html.escape(line)}</span>' for line in text.split("\n")) + "</pre>"

def shown_lines(step):  # every line the discussion or guided example names, one line either side; small gaps filled
    g = step["activity"]["guided"]
    named = {int(n) for n in re.findall(r"Look at line (\d+)\.", g["discussion"])}
    for a, b in re.findall(r"\*\*lines? (\d+)(?: (?:to|and) (\d+))?\*\*", g["instruction"]):
        named |= set(range(int(a), int(b or a) + 1))
    total = len(step["files"][0]["content"].rstrip("\n").split("\n"))
    keep = sorted({n + d for n in named for d in (-1, 0, 1) if 1 <= n + d <= total})
    filled = []
    for n in keep:
        if filled and 1 < n - filled[-1] <= 3: filled += range(filled[-1] + 1, n)
        filled.append(n)
    return filled

def numbered(step):
    lines = step["files"][0]["content"].rstrip("\n").split("\n"); out, last = [], 0
    for n in shown_lines(step):
        if n > last + 1: out.append('<span class="gap">…</span>')
        out.append(f'<span class="cl" data-n="{n}">{html.escape(lines[n - 1]) or " "}</span>'); last = n
    if last < len(lines): out.append('<span class="gap">…</span>')
    return '<pre class="code numbered">' + "".join(out) + "</pre>"

def step_html(number):
    day, s = steps[number]; a = s["activity"]; g = a["guided"]
    bullets = "".join(f"<li>{inline(line[2:])}</li>" for line in g["discussion"].split("\n") if line.startswith("- "))
    return (f'<section class="step3" data-step="{s["id"]}"><h3><span class="day">{day}</span> STEP {number} · {html.escape(s["files"][0]["path"])}</h3>'
            f'<div class="two"><div><p class="small"><b>1 · Sample</b> (run it unchanged; the lines discussed, with their numbers)</p>{numbered(s)}</div>'
            f'<div><p class="small"><b>Discussion</b></p><ul class="disc">{bullets}</ul></div></div>'
            f'<p class="small"><b>2 · Guided example</b></p><p class="instruction">{inline(g["instruction"])}</p><pre class="code">{html.escape(g["code"])}</pre>'
            f'<p class="small"><b>3 · Your task</b> (no code given: the guided example is your clue)</p><p class="instruction">{inline(a["instruction"])}</p>'
            f'<div class="outs"><div><p class="small"><b>Expected guided output</b></p>{output(g["expectedOutput"])}</div>'
            f'<div><p class="small"><b>Expected task output</b></p>{output(a["expectedOutput"])}</div></div></section>')

HOW = ('<div class="note"><b>Three parts for every step.</b> In CodeShare, <b>Work in code editor</b> loads the step\'s sample. '
       '<b>1</b> Run it unchanged: <b>Sample verified</b>. Read the discussion beside the sample lines it names (CodeShare\'s editor numbers the whole file). '
       '<b>2</b> Type the guided example on the line it names and run: <b>Guided example verified</b>. It does not complete the step. '
       '<b>3</b> Do Your task on your own, starting from the guided code, and run: matching the <b>Expected task output</b> shows <b>Completed</b>, saves your progress '
       'and opens the next step. Spaces and line breaks count. In an output box, an indented line continues the line above it.</div>')
TICKS = ('<table class="t ticks3"><tr><th>Check yourself</th><th>Sample verified</th><th>Guided example verified</th>'
         '<th>The line I expect to change (write before running)</th><th>Task output matches</th></tr>'
         + "".join(f'<tr><td>{steps[n][0].title()} Step {n}</td><td>☐</td><td>☐</td><td class="write"></td><td>☐</td></tr>' for n in sorted(steps))
         + "</table>")

for old in SRC.glob("p*.html"):
    if int(old.stem[1:]) >= FIRST: old.unlink()
for index, group in enumerate(GROUPS):
    number = FIRST + index
    head = ('<h1>Week 02 step guide</h1><p class="sub">.NET 1 · Multimedia and Tables · '
            'Sample, guided example and your task for every step, in CodeShare</p>' + HOW + TICKS) if index == 0 else ""
    (SRC / f"p{number}.html").write_text(
        f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Week 02 step guide</title><link rel="stylesheet" href="tasks.css"></head>'
        f'<body class="w1"><div class="page">{head}{"".join(step_html(n) for n in group)}'
        f'<footer class="foot">.NET 1 · Week 02 · Step guide · Page {number} of {LAST} · Keep this page with your module</footer></div></body></html>')
print(f"pages {FIRST}-{LAST} written")
