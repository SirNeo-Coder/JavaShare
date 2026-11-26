"""Builds the printed three-part step pages (source/p9.html to p17.html) from DotNet1_Week_03.threepart.codeshare.json:
each step's sample lines that the discussion and guided example name, per page (index.html, projects.html,
contact.html), with the page name above each excerpt (real line numbers, "…" between parts; samples run to 120 lines,
teacher's option A, 2026-11-25), discussion, guided example and Your task, with the two expected outputs side by side.
Never the answer key. p18.html (before you submit, starter pages) is kept as it is (teacher, 2026-11-25).
Usage: python3 build_step_pages.py   (then node render_pdf.cjs)"""
import difflib, html, json, re
from pathlib import Path
HERE = Path(__file__).resolve().parent
SRC = HERE / "source"
module = json.loads((HERE / "DotNet1_Week_03.threepart.codeshare.json").read_text())
steps = {b["number"]: (lesson["dayLabel"], b) for lesson in module["lessons"] for b in lesson["blocks"] if b["type"] == "step"}
GROUPS = [[n] for n in range(1, 10)]  # one step per page; every page must print on one sheet
FIRST = 9  # pages 1-8 are the lessons and the exit-slip strips
LAST = FIRST + len(GROUPS) - 1  # the last step page
TOTAL = LAST + 1  # p18: before you submit

def inline(text):  # the module's small Markdown: `code` and **bold**
    parts = re.split(r"(`[^`]+`)", text)
    out = "".join(f"<code>{html.escape(p[1:-1])}</code>" if p.startswith("`") else html.escape(p) for p in parts)
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", out)

def output(text):
    return '<pre class="out">' + "".join(f'<span class="ln">{html.escape(line)}</span>' for line in text.split("\n")) + "</pre>"

LONG = 30  # Steps 1 and 9 (index.html, 56 output lines): print only the lines that differ (teacher, 2026-11-25)

def changed(sample, text):  # [(first line number in text, lines)] that differ from the sample's output
    a, b = sample.split("\n"), text.split("\n")
    return [(j1 + 1, b[j1:j2]) for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if op != "equal" and j2 > j1]

def expected(title, step, text):
    if len(step["expectedOutput"].split("\n")) <= LONG:
        return f'<p class="small"><b>{title}</b></p>{output(text)}'
    parts = "".join(f'<p class="small at">{"Line" if len(lines) == 1 else "Lines"} {n}{"" if len(lines) == 1 else "–%d" % (n + len(lines) - 1)}</p>'
                    f'<pre class="out" data-output-part="{step["id"]}" data-from="{n}">' + "".join(f'<span class="ln">{html.escape(l)}</span>' for l in lines) + "</pre>"
                    for n, lines in changed(step["expectedOutput"], text))
    return f'<p class="small"><b>{title}</b>: only the lines that differ from the sample\'s output; every other line is the same (CodeShare shows it in full).</p>{parts}'

def named_lines(step):  # {page: line numbers} the discussion or guided example names
    g = step["activity"]["guided"]; named = {}
    for n, page in re.findall(r"Look at line (\d+) of ([\w.]+)\.", g["discussion"]): named.setdefault(page, set()).add(int(n))
    for a, b, page in re.findall(r"\*\*lines? (\d+)(?: (?:to|and) (\d+))? of ([\w.]+)\*\*", g["instruction"]):
        named.setdefault(page, set()).update(range(int(a), int(b or a) + 1))
    return named

def content(step, page): return next(f["content"] for f in step["files"] if f["path"] == page)

def shown_lines(step, page):  # one line either side of every named line; small gaps filled
    named = named_lines(step)[page]
    total = len(content(step, page).rstrip("\n").split("\n"))
    keep = sorted({n + d for n in named for d in (-1, 0, 1) if 1 <= n + d <= total})
    filled = []
    for n in keep:
        if filled and 1 < n - filled[-1] <= 3: filled += range(filled[-1] + 1, n)
        filled.append(n)
    return filled

def numbered(step, page):
    lines = content(step, page).rstrip("\n").split("\n"); out, last = [], 0
    for n in shown_lines(step, page):
        if n > last + 1: out.append('<span class="gap">…</span>')
        out.append(f'<span class="cl" data-n="{n}">{html.escape(lines[n - 1]) or " "}</span>'); last = n
    if last < len(lines): out.append('<span class="gap">…</span>')
    return f'<p class="small file" data-file="{html.escape(page)}"><b>{html.escape(page)}</b></p><pre class="code numbered" data-file="{html.escape(page)}">' + "".join(out) + "</pre>"

def samples(step):  # the run page first, then the other pages in the step's order
    pages = [f["path"] for f in step["files"] if f["path"] in named_lines(step)]
    return "".join(numbered(step, page) for page in sorted(pages, key=lambda page: page != step["run"]))

def step_html(number):
    day, s = steps[number]; a = s["activity"]; g = a["guided"]
    bullets = "".join(f"<li>{inline(line[2:])}</li>" for line in g["discussion"].split("\n") if line.startswith("- "))
    return (f'<section class="step3" data-step="{s["id"]}"><h3><span class="day">{day}</span> STEP {number} · {html.escape(s["run"])}</h3>'
            f'<div class="two"><div><p class="small"><b>1 · Sample</b> (run it unchanged; the lines discussed, with their numbers)</p>{samples(s)}</div>'
            f'<div><p class="small"><b>Discussion</b></p><ul class="disc">{bullets}</ul></div></div>'
            f'<p class="small"><b>2 · Guided example</b></p><p class="instruction">{inline(g["instruction"])}</p><pre class="code">{html.escape(g["code"])}</pre>'
            f'<p class="small"><b>3 · Your task</b> (no code given: the guided example is your clue)</p><p class="instruction">{inline(a["instruction"])}</p>'
            f'<div class="outs"><div>{expected("Expected guided output", s, g["expectedOutput"])}</div>'
            f'<div>{expected("Expected task output", s, a["expectedOutput"])}</div></div></section>')

HOW = ('<div class="note"><b>Three parts for every step.</b> In CodeShare, <b>Work in code editor</b> loads the step\'s sample. '
       '<b>1</b> Run it unchanged: <b>Sample verified</b>. Read the discussion beside the sample lines it names; each excerpt names its page (CodeShare\'s editor numbers each whole page). '
       '<b>2</b> Type the guided example on the line and page it names and run: <b>Guided example verified</b>. It does not complete the step. '
       '<b>3</b> Do Your task on your own, starting from the guided code, and run: matching the <b>Expected task output</b> shows <b>Completed</b>, saves your progress '
       'and opens the next step. Spaces and line breaks count. In an output box, an indented line continues the line above it.</div>')
TICKS = ('<table class="t ticks3"><tr><th>Check yourself</th><th>Sample verified</th><th>Guided example verified</th>'
         '<th>The line I expect to change (write before running)</th><th>Task output matches</th></tr>'
         + "".join(f'<tr><td>{steps[n][0].title()} Step {n}</td><td>☐</td><td>☐</td><td class="write"></td><td>☐</td></tr>' for n in sorted(steps))
         + "</table>")

for old in SRC.glob("p*.html"):
    if FIRST <= int(old.stem[1:]) <= LAST: old.unlink()
for index, group in enumerate(GROUPS):
    number = FIRST + index
    head = ('<h1>Week 03 step guide</h1><p class="sub">.NET 1 · Links, Frames and Forms · '
            'Sample, guided example and your task for every step, in CodeShare</p>' + HOW + TICKS) if index == 0 else ""
    (SRC / f"p{number}.html").write_text(
        f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Week 03 step guide</title><link rel="stylesheet" href="tasks.css"></head>'
        f'<body class="w1"><div class="page">{head}{"".join(step_html(n) for n in group)}'
        f'<footer class="foot">.NET 1 · Week 03 · Step guide · Page {number} of {TOTAL} · Keep this page with your module</footer></div></body></html>')
last = SRC / f"p{TOTAL}.html"; last.write_text(re.sub(r'<table class="t ticks3">.*?</table>', "", last.read_text()))
print(f"pages {FIRST}-{LAST} written")