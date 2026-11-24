# check_codeshare.py - check a CodeShare module file before handing it over.
# Usage: python3 check_codeshare.py Java2_Week_15.codeshare.json [--run]
# Without --run: checks the structure only.
# With --run: also rebuilds the student's folder step by step (starterFiles, then each
# step's files in order) and compiles and runs every Java step that names a "run" file,
# comparing the real output with expectedOutput.
import json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

COURSES = {"java-1", "java-2", "dotnet-1", "dotnet-2"}
LANGS = {"java", "html", "css", "javascript", "csharp"}
KINDS = {"Define", "Explain", "Connect", "Identify", "Choose", "Point", "Evaluate", "Apply", "Reflect"}
BLOCK_FIELDS = {
    "text": ["markdown"], "definition": ["term", "markdown"], "analogy": ["markdown"],
    "note": ["markdown"], "table": ["columns", "rows"],
    "step": ["id", "number", "instruction", "language", "files", "expectedOutput"],
    "error": ["language", "markdown", "message"], "errorGuide": ["rows"],
}
HTML = re.compile(r"</?[a-zA-Z][^>]*>|&[a-z]+;|&#\d+;")
problems, ids = [], set()

def bad(where, msg): problems.append("%s: %s" % (where, msg))

def need(obj, fields, where):
    for f in fields:
        if f not in obj or obj[f] in (None, "", []):
            bad(where, "missing '%s'" % f)

def use_id(i, where):
    if not isinstance(i, str) or not i: bad(where, "missing id"); return
    if i in ids: bad(where, "duplicate id '%s'" % i)
    ids.add(i)

def no_html(text, where):
    if isinstance(text, str) and HTML.search(text): bad(where, "contains HTML: %r" % HTML.search(text).group(0))

def check_files(files, where):
    if not isinstance(files, list): bad(where, "files must be a list"); return
    for k, f in enumerate(files):
        need(f, ["path", "content"], "%s file %d" % (where, k + 1))

data = json.load(open(sys.argv[1], encoding="utf-8"))
if data.get("format") != "codeshare-module": bad("top", "format must be 'codeshare-module'")
if data.get("version") != 1: bad("top", "version must be 1")
if data.get("course") not in COURSES: bad("top", "course must be one of %s" % sorted(COURSES))
need(data, ["week", "id", "title", "lessons"], "top")
use_id(data.get("id"), "top")
check_files(data.get("starterFiles", []), "starterFiles")

steps = {}
known = {f.get("path") for f in data.get("starterFiles", []) if isinstance(f, dict)}
for li, les in enumerate(data.get("lessons", []), 1):
    w = "lesson %d" % li
    need(les, ["id", "order", "dayLabel", "title", "objectives", "blocks", "exitSlip"], w)
    use_id(les.get("id"), w)
    need(les.get("objectives", {}), ["cognitive", "affective", "psychomotor"], w + " objectives")
    for bi, b in enumerate(les.get("blocks", []), 1):
        bw = "%s block %d (%s)" % (w, bi, b.get("type"))
        if b.get("type") not in BLOCK_FIELDS: bad(bw, "unknown block type"); continue
        need(b, BLOCK_FIELDS[b["type"]], bw)
        for key in ("markdown", "instruction", "checkYourself", "term"): no_html(b.get(key), bw)
        if b["type"] == "step":
            use_id(b.get("id"), bw)
            if b.get("language") not in LANGS: bad(bw, "language must be one of %s" % sorted(LANGS))
            check_files(b.get("files"), bw)
            known.update(f.get("path") for f in b.get("files", []) if isinstance(f, dict))
            if b.get("run") and b["run"] not in known:
                bad(bw, "run file '%s' is not in starterFiles or any step so far" % b["run"])
            steps[b.get("id")] = b
        if b["type"] == "table":
            n = len(b.get("columns", []))
            for ri, row in enumerate(b.get("rows", []), 1):
                if len(row) != n: bad(bw, "row %d has %d cells, expected %d" % (ri, len(row), n))
    slip = les.get("exitSlip") or {}
    sw = w + " exitSlip"
    need(slip, ["id", "points", "questions"], sw)
    use_id(slip.get("id"), sw)
    if slip.get("afterStep") and slip["afterStep"] not in steps: bad(sw, "afterStep '%s' is not an earlier step id" % slip["afterStep"])
    total = 0
    for qi, q in enumerate(slip.get("questions", []), 1):
        need(q, ["id", "kind", "points", "prompt"], "%s question %d" % (sw, qi))
        if q.get("kind") not in KINDS: bad("%s question %d" % (sw, qi), "unknown kind '%s'" % q.get("kind"))
        no_html(q.get("prompt"), "%s question %d" % (sw, qi))
        total += q.get("points", 0) or 0
    if slip.get("points") != total: bad(sw, "points is %s but questions add up to %s" % (slip.get("points"), total))

pt = data.get("performanceTask")
if pt:
    need(pt, ["id", "title", "markdown", "rubric", "totalPoints"], "performanceTask")
    use_id(pt.get("id"), "performanceTask")
    no_html(pt.get("markdown"), "performanceTask")
    s = sum(r.get("points", 0) for r in pt.get("rubric", []))
    if s != pt.get("totalPoints"): bad("performanceTask", "rubric adds up to %s, totalPoints is %s" % (s, pt.get("totalPoints")))

if "--run" in sys.argv:
    folder = tempfile.mkdtemp()
    def put(files):
        for f in files:
            p = os.path.abspath(os.path.join(folder, f["path"]))
            if not p.startswith(os.path.abspath(folder) + os.sep): raise ValueError("Unsafe file path")
            os.makedirs(os.path.dirname(p), exist_ok=True)
            open(p, "w", encoding="utf-8").write(f["content"])
    put(data.get("starterFiles", []))
    for les in data.get("lessons", []):
        for b in les.get("blocks", []):
            if b.get("type") != "step": continue
            put(b.get("files", []))
            if b.get("language") == "csharp":
                bad(b["id"], "C# execution is unsupported; not silently skipped")
            if b.get("language") != "java": continue
            if not b.get("run"):
                bad(b["id"], "Java step needs a run file"); continue
            for c in os.listdir(folder):
                if c.endswith(".class"): os.remove(os.path.join(folder, c))
            srcs = [f for f in os.listdir(folder) if f.endswith(".java")]
            comp = subprocess.run(["javac", "-encoding", "UTF-8"] + srcs, cwd=folder, capture_output=True, text=True)
            if comp.returncode != 0:
                bad(b["id"], "does not compile:\n" + comp.stderr.strip()); continue
            res = subprocess.run(["java", b["run"][:-5]], cwd=folder, capture_output=True, text=True, timeout=20)
            # drop notices some computers' Java prints on its own (not part of the program's output)
            got = "\n".join(l for l in (res.stdout + res.stderr).splitlines() if not l.startswith("Picked up JAVA_TOOL_OPTIONS")).rstrip()
            if res.returncode != 0:
                bad(b["id"], "Java process failed")
            if got == b.get("expectedOutput", "").rstrip() and res.returncode == 0:
                print("PASS " + b["id"])
            if got != b.get("expectedOutput", "").rstrip():
                bad(b["id"], "output differs from expectedOutput.\n--- real output ---\n%s\n--- expectedOutput ---\n%s" % (got, b.get("expectedOutput", "").rstrip()))
    shutil.rmtree(folder)

if "--run" in sys.argv and any(b.get("language") in {"html", "css", "javascript"} for l in data.get("lessons", []) for b in l.get("blocks", []) if b.get("type") == "step"):
    node = os.environ.get("NODE_BINARY") or shutil.which("node")
    if not node:
        bad("web", "Node.js unavailable; cannot execute web steps")
    else:
        try:
            if "--media-root" in sys.argv:
                data["mediaRoot"] = str(Path(sys.argv[sys.argv.index("--media-root") + 1]).resolve())
            result = subprocess.run([node, str(Path(__file__).with_name("check_web_steps.cjs"))], input=json.dumps(data), capture_output=True, text=True, timeout=120)
            if result.returncode: bad("web", result.stderr.strip())
            else:
                for row in json.loads(result.stdout):
                    if row["pass"]: print("PASS " + row["id"])
                    else: bad(row["id"], row.get("error") or "Output differs: " + repr(row["output"]))
        except (subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
            bad("web", str(exc))

if problems:
    print("%d problem(s):" % len(problems)); print("\n".join("- " + p for p in problems)); sys.exit(1)
print("OK: %d lessons, %d steps, %d ids, no problems found." % (len(data.get("lessons", [])), len(steps), len(ids)))
