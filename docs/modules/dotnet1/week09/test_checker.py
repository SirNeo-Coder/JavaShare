"""Regression checks for Resume Week 9 with the teacher's checker (adapted from Resume/Week_08/test_checker.py).
Every claim in the module's tables, practice notes, problem guide and the DLL's Predict/Debug lines that the page text or a
page check can show is run here. Week 9's own invariant is that a media query moves boxes but never changes the page text or a
page-checked value, so the outputs are proved identical at the page window's width and the checker's: see
test_every_sample_and_task_output_is_the_same_at_every_width and test_no_page_check_reads_a_value_a_media_query_changes."""
import copy, importlib.util, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_09.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
_spec = importlib.util.spec_from_file_location("content_r09", HERE.parent.parent / "revision_tools/resume_w09/content.py")
CONTENT = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(CONTENT)
PT = BASE["performanceTask"]
NODE = CONTENT.NODE
DEPS = "/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
CHROME = "/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
BREAK = 900  # the breakpoint of both media queries; CodeShare's page window is narrower, the checker's viewport is wider
NARROW, WIDE = 800, 1000
def st(sel, prop, value): return {"selector": sel, "style": prop, "value": value}
def ct(sel, n): return {"selector": sel, "count": n}

# Opens `run` from `files` in Chromium (no internet, `width` x 900) and returns the probes
# ([selector, pseudo-element or null, property] on the first match) and the page text the checker would read.
PROBE = r"""
const fs=require('fs'),path=require('path'),os=require('os');const {pathToFileURL}=require('url');
const {chromium}=require(path.join(process.argv[1],'playwright'));
(async()=>{const job=JSON.parse(fs.readFileSync(0,'utf8'));const dir=fs.mkdtempSync(path.join(os.tmpdir(),'w9-'));
for(const [p,c] of Object.entries(job.files)) fs.writeFileSync(path.join(dir,p),c);
const b=await chromium.launch({executablePath:process.argv[2]});
const ctx=await b.newContext({offline:true,viewport:{width:job.width||1000,height:900}});
const pg=await ctx.newPage();await pg.goto(pathToFileURL(path.join(dir,job.run)).href);
const out=await pg.evaluate(probes=>probes.map(([sel,pseudo,prop])=>{const el=document.querySelector(sel);
 return el?getComputedStyle(el,pseudo).getPropertyValue(prop):null}),job.probes||[]);
const text=(await pg.locator('body').innerText()).trim().replace(/\n{2,}/g,'\n');
process.stdout.write(JSON.stringify({out,text}));await b.close();fs.rmSync(dir,{recursive:true,force:true});})()
.catch(e=>{console.error(e);process.exit(1)});
"""
def probe(files, run, probes=(), width=WIDE):
    job = {"files": files, "run": run, "probes": list(probes), "width": width}
    r = subprocess.run([NODE, "-e", PROBE, DEPS, CHROME], input=json.dumps(job), capture_output=True, text=True, timeout=180)
    if r.returncode: raise AssertionError(r.stderr)
    return json.loads(r.stdout)

def answer_files(number):  # a step's files with its task edit applied, as solutions/ holds them
    s = CONTENT.STEPS[number - 1]
    files = dict(s[1] if isinstance(s[1], dict) else {"index.html": s[1]})
    for e in s[6]:
        path, old, new = e if len(e) == 3 else ("index.html", *e)
        files[path] = files[path].replace(old, new)
    return files

class CheckerTests(unittest.TestCase):
    def run_check(self, data, execute=True, media=True):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "module.json"; p.write_text(json.dumps(data))
            extra = (["--run"] if execute else []) + (["--media-root", str(HERE / "project_end")] if media else [])
            return subprocess.run([sys.executable, str(HERE / "check_codeshare.py"), str(p)] + extra, capture_output=True, text=True, timeout=300)
    def one_step(self, number, starter=True):  # the module cut down to the lesson and step with this number
        d = copy.deepcopy(BASE)
        if not starter: d["starterFiles"] = []  # like View module details: the step's own files only
        for lesson in d["lessons"]:
            for b in lesson["blocks"]:
                if b["type"] == "step" and b["number"] == number:
                    lesson["blocks"] = [b]; lesson["exitSlip"]["afterStep"] = b["id"]; d["lessons"] = [lesson]
                    return d, b
    def edit(self, step, old, new, path="styles.css"):
        f = next(f for f in step["files"] if f["path"] == path)
        self.assertEqual(f["content"].count(old), 1, old)
        f["content"] = f["content"].replace(old, new)
    def passes(self, d):
        r = self.run_check(d); self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
    def fails(self, d, text):
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn(text, r.stdout)
    def same_output(self, number, old, new, checks, path="styles.css"):  # the edit changes no page text; its page checks read `checks`
        d, s = self.one_step(number); self.edit(s, old, new, path); s["webChecks"] = checks; self.passes(d)
    def output_of(self, number, old, new, path="styles.css"):  # the page text after an edit, read from the checker's failure
        d, s = self.one_step(number); self.edit(s, old, new, path); s["webChecks"] = []; s["expectedOutput"] = "?"
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0)
        return r.stdout
    def files(self, number):
        return {f["path"]: f["content"] for f in STEPS[number - 1]["files"]}

    # ---- the module as a whole ----
    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [1, 3, 4, 5, 8, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 3, 4, 5, 8, 9])
        d, _ = self.one_step(1)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        for n in (2, 6, 7):
            self.assertEqual(self.run_check(self.one_step(n)[0], media=False).returncode, 0)  # projects.html and contact.html need no media
    def test_pages_change_only_by_the_project_list_class(self):
        start = {f["path"]: f["content"] for f in BASE["starterFiles"]}
        allowed = {CONTENT.I0, CONTENT.P0, CONTENT.P1, CONTENT.C0}
        for s in STEPS:
            for f in s["files"]:
                if f["path"].endswith(".html"): self.assertIn(f["content"], allowed, (s["id"], f["path"]))
        self.assertEqual((CONTENT.I0, CONTENT.P0, CONTENT.C0), (start["index.html"], start["projects.html"], start["contact.html"]))
        intro = "  <p>Two school projects I am proud of.</p>\n"  # "  <ul>\n" alone also matches inside the nav's "    <ul>\n"
        self.assertEqual(CONTENT.P1, start["projects.html"].replace(intro + "  <ul>\n", intro + '  <ul class="project-list">\n'))
    def test_every_step_runs_from_its_own_files_alone(self):
        for s in STEPS:
            names = [f["path"] for f in s["files"]]
            self.assertEqual(names[0], s["run"], s["id"])
            for f in s["files"]:
                if 'href="styles.css"' in f["content"]: self.assertIn("styles.css", names, (s["id"], f["path"]))
                for framed in re.findall(r'<iframe[^>]*src="([^"]+)"', f["content"]): self.assertIn(framed, names, (s["id"], f["path"]))
        for n in range(1, 10):
            with self.subTest(step=n): self.passes(self.one_step(n, starter=False)[0])
    def test_a_step_without_its_stylesheet_fails_on_its_own(self):
        d, s = self.one_step(2, starter=False)
        s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]
        self.fails(d, "Style mismatch: .project-list display")

    # ---- Week 9's invariant: a media query moves boxes, it never changes the page text or a checked value ----
    def test_every_sample_and_task_output_is_the_same_at_every_width(self):
        # The page window is narrower than the 900px breakpoint and the checker's viewport is wider, so a step whose text
        # changed with the width could never pass in both. Checked for every sample and every task answer.
        for n, s in enumerate(STEPS, 1):
            for label, files in (("sample", self.files(n)), ("task", answer_files(n))):
                wide = probe(files, s["run"], width=WIDE)["text"]
                for narrow in (760, NARROW, BREAK - 1):
                    with self.subTest(step=n, kind=label, width=narrow):
                        self.assertEqual(probe(files, s["run"], width=narrow)["text"], wide)
    def test_no_page_check_reads_a_value_a_media_query_changes(self):
        queried = {sel for sel in ("nav ul", ".project-list")}
        for n, s in enumerate(STEPS, 1):
            css = next((f["content"] for f in s["files"] if f["path"] == "styles.css"), "")
            for c in s["webChecks"]:
                if c.get("selector") in queried and "@media" in css:
                    self.assertNotEqual(c.get("style"), "flex-direction", (s["id"], c))
        # and the same check read at both widths gives the same answer for every step
        for n, s in enumerate(STEPS, 1):
            probes = [[c["selector"], None, c["style"]] for c in s["webChecks"] if "style" in c]
            if not probes: continue
            with self.subTest(step=n):
                self.assertEqual(probe(self.files(n), s["run"], probes, NARROW)["out"],
                                 probe(self.files(n), s["run"], probes, WIDE)["out"])
    def test_a_query_that_changed_the_page_text_would_be_caught(self):
        # Proof the invariant test above has teeth: a query that hides a word makes the narrow text differ from the wide.
        files = dict(self.files(5))
        files["styles.css"] += "\n@media (max-width: 900px) {\n  .motto {\n    display: none;\n  }\n}\n"
        self.assertNotEqual(probe(files, "index.html", width=NARROW)["text"], probe(files, "index.html", width=WIDE)["text"])
    def test_the_breakpoint_is_on_below_900px_and_off_above_it(self):
        # Query table rows 1 and 4: the width is the page's, and the class sees the narrow layout in the page window.
        f = self.files(5)
        self.assertEqual(probe(f, "index.html", [["nav ul", None, "flex-direction"]], NARROW)["out"], ["column"])
        self.assertEqual(probe(f, "index.html", [["nav ul", None, "flex-direction"]], BREAK)["out"], ["column"])
        self.assertEqual(probe(f, "index.html", [["nav ul", None, "flex-direction"]], BREAK + 1)["out"], ["row"])
        g = self.files(6)
        self.assertEqual(probe(g, "projects.html", [[".project-list", None, "flex-direction"]], NARROW)["out"], ["row"])
        self.assertEqual(probe(g, "projects.html", [[".project-list", None, "flex-direction"]], WIDE)["out"], ["column"])
    def test_a_media_query_without_its_unit_is_dropped(self):
        # Problem guide row 3, query table row 3, Wednesday practice (c), Thursday practice (b), DLL Wednesday Debug.
        f = dict(self.files(5))
        f["styles.css"] = f["styles.css"].replace("(max-width: 900px)", "(max-width: 900)")
        self.assertEqual(probe(f, "index.html", [["nav ul", None, "flex-direction"]], NARROW)["out"], ["row"])
        self.assertEqual(probe(f, "index.html", [["nav ul", None, "flex-direction"]], WIDE)["out"], ["row"])

    # ---- flex containers and flex items ----
    def test_display_flex_makes_the_children_flex_items(self):
        # Property table rows 1-2, DEFS Monday, DLL Monday quick check: it goes on the container, not on the items.
        f = self.files(1)
        self.assertEqual(probe(f, "index.html", [[".skills", None, "display"], [".skills", None, "flex-direction"]])["out"],
                         ["flex", "column"])
        self.assertIn("display: flex;\n  flex-direction: column;\n  gap: 0.5em;\n}", f["styles.css"])
    def test_a_flex_column_of_block_items_is_not_page_text(self):
        # Page-text table row 1, Monday try rows 1 and 3, Monday practice (a) and (c), DLL Monday Predict.
        self.assertIn("\nSkills\nTYPING DOCUMENTS\nMaking slide presentations\n", STEPS[0]["expectedOutput"])
        self.same_output(1, "  flex-direction: column;\n", "  flex-direction: row;\n",
                         [st(".skills", "flex-direction", "row"), st(".skills", "display", "flex")])
        self.same_output(1, "  display: flex;\n  flex-direction: column;\n  gap: 0.5em;\n", "",
                         [st(".skills", "display", "block"), ct(".skills li", 2)])
    def test_gap_is_not_page_text_and_does_nothing_without_a_flex_container(self):
        # Page-text table row 4, Monday try row 2, problem guide row 1, Thursday practice (a), DLL Monday Debug.
        self.same_output(1, "  gap: 0.5em;\n", "  gap: 2em;\n", [st(".skills", "row-gap", "32px")])
        f = dict(self.files(1))
        f["styles.css"] = f["styles.css"].replace("  display: flex;\n  flex-direction: column;\n", "")
        got = probe(f, "index.html", [[".skills", None, "display"], [".skills", None, "row-gap"]])
        self.assertEqual(got["out"][0], "block")  # no flex container, so the gap has nothing to space
        self.assertEqual(got["text"], probe(self.files(1), "index.html")["text"])
    def test_flex_on_the_nav_list_puts_each_item_on_its_own_line(self):
        # Step 4's whole point, page-text table row 2, DLL Tuesday Predict and exit ticket.
        self.assertIn("\nHOME PROJECTS CONTACT\n", STEPS[2]["expectedOutput"])   # Step 3: still inline-block
        self.assertIn("\nHOME\nPROJECTS\nCONTACT\n", STEPS[3]["expectedOutput"])  # Step 4: flex items
        self.assertIn("\nHOME\nPROJECTS\nCONTACT\nSKILLS\n", STEPS[3]["activity"]["expectedOutput"])
    def test_display_inline_runs_the_items_together_and_is_page_text(self):
        # Step 8 (broken on purpose) and its repair, page-text table row 5, Monday try row 4, problem guide row 2.
        self.assertIn("\nSkills\nTYPING DOCUMENTS Making slide presentations\nInterests\n", STEPS[7]["expectedOutput"])
        self.assertIn("\nSkills\nTYPING DOCUMENTS\nMaking slide presentations\nInterests\n", STEPS[7]["activity"]["expectedOutput"])
        self.assertEqual(probe(self.files(8), "index.html", [[".skills", None, "display"], [".skills li", None, "display"]])["out"],
                         ["block", "inline"])
    def test_float_is_ignored_on_a_flex_item(self):
        # Float table rows 4-5, W3C FLEXBOX, DEFS Tuesday, Tuesday practice (d).
        plain = self.files(3)
        f = dict(plain)
        f["styles.css"] = f["styles.css"].replace(".gallery figure {\n  width: 170px;", ".gallery figure {\n  float: left;\n  width: 170px;")
        got = probe(f, "index.html", [[".gallery figure", None, "float"]])
        # The declaration still computes to left; what the spec suppresses is its effect, so the page is laid out identically.
        self.assertEqual(got["out"], ["left"])
        self.assertEqual(got["text"], probe(plain, "index.html")["text"])
        # Step 3's own sample reads float: none because the declaration was removed with the rest of the float layout.
        self.assertEqual(probe(plain, "index.html", [[".gallery figure", None, "float"]])["out"], ["none"])
    def test_flex_wrap_lets_the_row_break(self):
        # Property table row 5, problem guide row 5, DLL Tuesday Predict, Step 3's task (a fifth figure wraps).
        self.assertEqual(probe(self.files(3), "index.html", [[".gallery", None, "flex-wrap"]])["out"], ["wrap"])
        self.same_output(3, "  flex-wrap: wrap;\n", "  flex-wrap: nowrap;\n", [st(".gallery", "flex-wrap", "nowrap")])
        self.assertIn("\nTree planting: our second batch\n", STEPS[2]["activity"]["expectedOutput"])
    def test_the_form_and_the_project_cards_are_flex_containers(self):
        # Steps 2 and 7, and their tasks adding one more flex item.
        self.assertEqual(probe(self.files(2), "projects.html", [[".project-list", None, "display"], [".project-list", None, "flex-direction"]])["out"],
                         ["flex", "column"])
        self.assertEqual(probe(self.files(7), "contact.html", [["form", None, "display"], ["form", None, "flex-direction"]])["out"],
                         ["flex", "column"])
        self.assertIn("\nWeb page about our barangay\nSolo work\n", STEPS[1]["activity"]["expectedOutput"])
        self.assertIn("\nYour class\n", STEPS[6]["activity"]["expectedOutput"])

    # ---- the week's own structure ----
    def test_five_flex_containers_and_two_queries_in_the_finished_stylesheet(self):
        css = next(f["content"] for f in STEPS[8]["files"] if f["path"] == "styles.css")
        self.assertEqual(css.count("display: flex"), 5)  # the skills, the project cards, the gallery, the nav bar and the form
        self.assertIn("five flex containers", CONTENT.STEPS[8][3])  # Step 9 names them all
        self.assertEqual(css.count("@media"), 2)
        self.assertNotIn("float: left", css.split(".profile")[0])  # the gallery's float is gone; Juan's picture keeps its own
        self.assertEqual(css, CONTENT.CSS7)
    def test_the_personal_starter_carries_flexbox_and_one_query(self):
        css = {f["path"]: f["content"] for f in PT["starterFiles"]}["styles.css"]
        self.assertEqual(css.count("@media"), 1); self.assertIn("display: flex", css)
        self.assertNotRegex(css, r"url\(|\d%")
    def test_the_sample_outputs_that_are_meant_to_match_do_match(self):
        same, as_step = CONTENT.SAME
        self.assertEqual(STEPS[same - 1]["expectedOutput"], STEPS[as_step - 1]["expectedOutput"])
        for n in (3, 5):  # OUTPUT_BASE: these reuse an earlier step's output unchanged
            base = CONTENT.OUTPUT_BASE[n]
            self.assertEqual(STEPS[n - 1]["expectedOutput"], STEPS[base - 1]["expectedOutput"], n)
        # Step 6 differs from Step 2 in the nav bar only: Step 4 turned it into a flex row (the step says so).
        drop_nav = lambda t: t.replace("HOME\nPROJECTS\nCONTACT\n", "").replace("HOME PROJECTS CONTACT\n", "")
        self.assertNotEqual(STEPS[5]["expectedOutput"], STEPS[1]["expectedOutput"])
        self.assertEqual(drop_nav(STEPS[5]["expectedOutput"]), drop_nav(STEPS[1]["expectedOutput"]))
        self.assertIn("Only the nav bar reads differently", CONTENT.STEPS[5][4])
    def test_no_task_can_be_passed_by_leaving_the_sample_unchanged(self):
        for n, s in enumerate(STEPS, 1):
            with self.subTest(step=n): self.assertNotEqual(s["expectedOutput"], s["activity"]["expectedOutput"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
