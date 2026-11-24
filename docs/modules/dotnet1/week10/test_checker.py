"""Regression checks for Resume Week 10 with the teacher's checker (adapted from Resume/Week_09/test_checker.py).
Every claim in the module's tables, practice notes, problem guide and the DLL's Predict/Debug lines that the page text or a
page check can show is run here. Week 10's own invariant is that a grid, a resized picture and a media query move boxes but
never change the page text or a page-checked value at any width: see
test_every_sample_and_task_output_is_the_same_at_every_width and test_no_page_check_reads_a_value_that_follows_the_window."""
import copy, importlib.util, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_10.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
_spec = importlib.util.spec_from_file_location("content_r10", HERE.parent.parent / "revision_tools/resume_w10/content.py")
CONTENT = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(CONTENT)
PT = BASE["performanceTask"]
NODE = CONTENT.NODE
DEPS = "/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
CHROME = "/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
BREAK = 900  # the breakpoint of both of Juan's queries and of the template's; a module step's page is narrower, the checker wider
WIDTHS = (696, 760, 800, BREAK - 1, BREAK + 1, 1000)
NARROW, WIDE = 800, 1000
def st(sel, prop, value): return {"selector": sel, "style": prop, "value": value}
def ct(sel, n): return {"selector": sel, "count": n}

# Opens `run` from `files` in Chromium (no internet, `width` x 900) and returns the probes
# ([selector, property] on the first match), the page text the checker would read, and whether the page scrolls sideways.
PROBE = r"""
const fs=require('fs'),path=require('path'),os=require('os');const {pathToFileURL}=require('url');
const {chromium}=require(path.join(process.argv[1],'playwright'));
(async()=>{const job=JSON.parse(fs.readFileSync(0,'utf8'));const dir=fs.mkdtempSync(path.join(os.tmpdir(),'w10-'));
for(const [p,c] of Object.entries(job.files)) fs.writeFileSync(path.join(dir,p),c);
for(const name of ['images','audio','video']){const src=path.join(job.media,name);
 if(fs.existsSync(src)) fs.cpSync(src,path.join(dir,name),{recursive:true});}
const b=await chromium.launch({executablePath:process.argv[2]});
const ctx=await b.newContext({offline:true,viewport:{width:job.width||1000,height:900}});
const pg=await ctx.newPage();await pg.goto(pathToFileURL(path.join(dir,job.run)).href);
const out=await pg.evaluate(probes=>probes.map(([sel,prop])=>{const el=document.querySelector(sel);
 return el?getComputedStyle(el).getPropertyValue(prop):null}),job.probes||[]);
const wide=await pg.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
const text=(await pg.locator('body').innerText()).trim().replace(/\n{2,}/g,'\n');
process.stdout.write(JSON.stringify({out,text,wide}));await b.close();fs.rmSync(dir,{recursive:true,force:true});})()
.catch(e=>{console.error(e);process.exit(1)});
"""
def probe(files, run, probes=(), width=WIDE):
    job = {"files": files, "run": run, "probes": list(probes), "width": width, "media": str(HERE / "project_end")}
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
    def files(self, number):
        return {f["path"]: f["content"] for f in STEPS[number - 1]["files"]}

    # ---- the module as a whole ----
    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [1, 3, 4, 7, 8, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 3, 4, 7, 8, 9])
        d, _ = self.one_step(1)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        for n in (2, 5, 6):
            self.assertEqual(self.run_check(self.one_step(n)[0], media=False).returncode, 0)  # projects.html needs no media
    def test_the_banner_is_the_only_new_media_file(self):
        names = sorted(p.name for p in (HERE / "project_end/images").iterdir())
        self.assertIn("juan_banner.svg", names)
        before = sorted(p.name for p in (HERE / "project_start/images").iterdir())
        self.assertEqual(set(names) - set(before), {"juan_banner.svg"})
        banner = (HERE / "project_end/images/juan_banner.svg").read_text()
        self.assertIn('width="900" height="240"', banner)  # really wider than the page window
        for s in STEPS:  # it is on every page from Step 3 on, with its size in the HTML
            page = next((f["content"] for f in s["files"] if f["path"] == "index.html"), "")
            if page: self.assertEqual('images/juan_banner.svg' in page, s["number"] >= 3, s["id"])
    def test_pages_change_only_by_the_banner_the_wrapper_and_the_template_classes(self):
        start = {f["path"]: f["content"] for f in BASE["starterFiles"]}
        allowed = {CONTENT.I0, CONTENT.I1, CONTENT.I2, CONTENT.P0, CONTENT.P1, CONTENT.C0}
        for s in STEPS:
            for f in s["files"]:
                if f["path"].endswith(".html"): self.assertIn(f["content"], allowed, (s["id"], f["path"]))
        self.assertEqual((CONTENT.I0, CONTENT.P0, CONTENT.C0), (start["index.html"], start["projects.html"], start["contact.html"]))
        self.assertEqual(CONTENT.I1, start["index.html"].replace("  <h1>Juan Dela Cruz</h1>\n",
                                                                 "  <h1>Juan Dela Cruz</h1>\n" + CONTENT.BANNER_IMG))
        self.assertIn('<div class="tables">', CONTENT.I2); self.assertIn('class="project-list t-grid"', CONTENT.P1)
    def test_every_step_runs_from_its_own_files_alone(self):
        for s in STEPS:
            names = [f["path"] for f in s["files"]]
            self.assertEqual(names[0], s["run"], s["id"])
            for f in s["files"]:
                for href in re.findall(r'<link[^>]*href="([^"]+)"', f["content"]): self.assertIn(href, names, (s["id"], f["path"]))
                for framed in re.findall(r'<iframe[^>]*src="([^"]+)"', f["content"]): self.assertIn(framed, names, (s["id"], f["path"]))
        for n in range(1, 10):
            with self.subTest(step=n): self.passes(self.one_step(n, starter=False)[0])
    def test_a_step_without_its_stylesheet_fails_on_its_own(self):
        d, s = self.one_step(2, starter=False)
        s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]
        self.fails(d, "Style mismatch: .project-list display")

    # ---- Week 10's invariant: the layout follows the width, the page text and the checked values never do ----
    def test_every_sample_and_task_output_is_the_same_at_every_width(self):
        # The page runs at three widths (CKB-112): a module step below 900px, a personal project above it, the checker at
        # 1000px. A step whose text changed with the width could never pass everywhere. Checked for every sample and answer.
        for n, s in enumerate(STEPS, 1):
            for label, files in (("sample", self.files(n)), ("task", answer_files(n))):
                wide = probe(files, s["run"], width=WIDE)["text"]
                for width in WIDTHS:
                    if width == WIDE: continue
                    with self.subTest(step=n, kind=label, width=width):
                        self.assertEqual(probe(files, s["run"], width=width)["text"], wide)
    def test_no_page_check_reads_a_value_that_follows_the_window(self):
        for s in STEPS:
            for c in s["webChecks"]:
                self.assertFalse(c.get("style", "").startswith("grid-template"), (s["id"], c))  # a track resolves to used px
                self.assertNotIn(c.get("style"), ("width", "height", "flex-direction", "left", "right", "top", "bottom"))
        for n, s in enumerate(STEPS, 1):  # and every style check reads the same value at both widths
            probes = [[c["selector"], c["style"]] for c in s["webChecks"] if "style" in c]
            if not probes: continue
            with self.subTest(step=n):
                self.assertEqual(probe(self.files(n), s["run"], probes, NARROW)["out"],
                                 probe(self.files(n), s["run"], probes, WIDE)["out"])
    def test_a_query_that_changed_the_page_text_would_be_caught(self):
        # Proof the invariant test above has teeth: a query that hides a word makes the narrow text differ from the wide.
        files = dict(self.files(7))
        files["styles.css"] += "\n@media (max-width: 900px) {\n  .motto {\n    display: none;\n  }\n}\n"
        self.assertNotEqual(probe(files, "index.html", width=NARROW)["text"], probe(files, "index.html", width=WIDE)["text"])
    def test_the_tables_query_is_on_below_900px_and_off_above_it(self):
        # Step 7 and the query table: the width is the page's, and a module step's page is already narrow.
        f = self.files(7)
        one = lambda width: probe(f, "index.html", [[".tables", "grid-template-columns"]], width)["out"][0]
        self.assertNotIn(" ", one(NARROW)); self.assertNotIn(" ", one(BREAK))      # one column
        self.assertIn(" ", one(BREAK + 1)); self.assertIn(" ", one(WIDE))          # two columns
    def test_a_media_query_without_its_unit_is_dropped(self):
        # Problem guide row 3, Thursday practice (b), DLL Thursday Predict.
        f = dict(self.files(7))
        f["styles.css"] = f["styles.css"].replace("@media (max-width: 900px) {\n  .tables", "@media (max-width: 900) {\n  .tables")
        self.assertIn(" ", probe(f, "index.html", [[".tables", "grid-template-columns"]], NARROW)["out"][0])  # two columns: dropped

    # ---- grid view ----
    def test_display_grid_makes_the_children_grid_items(self):
        # Grid table rows 1-2, DEFS Monday, DLL Monday quick check: it goes on the container, not on the items.
        f = self.files(1)
        self.assertEqual(probe(f, "index.html", [[".gallery", "display"], [".gallery", "column-gap"]])["out"], ["grid", "12px"])
        self.assertIn("display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 12px;\n}", f["styles.css"])
    def test_a_grid_of_block_items_is_not_page_text(self):
        # Page-text table row 1, Monday try rows 1-3, Monday practice (a)-(c), DLL Monday Predict.
        self.same_output(1, "repeat(2, 1fr)", "repeat(4, 1fr)", [st(".gallery", "display", "grid"), ct(".gallery figure", 4)])
        self.same_output(1, "  gap: 12px;\n", "  gap: 40px;\n", [st(".gallery", "column-gap", "40px")])
        self.same_output(1, "  display: grid;\n", "", [st(".gallery", "display", "block"), ct(".gallery figure", 4)])
    def test_an_invalid_value_drops_only_its_own_declaration(self):
        # Monday try row 4, problem guide row 1, Thursday practice (a), DLL Thursday Predict.
        f = dict(self.files(1))
        f["styles.css"] = f["styles.css"].replace("  display: grid;\n", "  display: gird;\n")
        got = probe(f, "index.html", [[".gallery", "display"], [".gallery", "column-gap"]])
        self.assertEqual(got["out"], ["block", "12px"])  # the gap declaration survives
        self.assertEqual(got["text"], probe(self.files(1), "index.html")["text"])
    def test_grid_properties_on_the_items_do_nothing(self):
        # DEFS Thursday and the Monday point-out: display: grid belongs on the container.
        f = dict(self.files(1))
        f["styles.css"] = f["styles.css"].replace(".gallery {\n  display: grid;\n  grid-template-columns: repeat(2, 1fr);\n  gap: 12px;\n}",
                                                  ".gallery figure {\n  grid-template-columns: repeat(2, 1fr);\n  gap: 12px;\n}")
        got = probe(f, "index.html", [[".gallery", "display"], [".gallery", "column-gap"]])
        self.assertEqual(got["out"], ["block", "normal"])
        self.assertEqual(got["text"], probe(self.files(1), "index.html")["text"])
    def test_auto_fit_changes_the_number_of_columns_but_not_the_page_text(self):
        # Grid table row 3 and Step 2: the cards count their own columns.
        f = self.files(2)
        tracks = [probe(f, "projects.html", [[".project-list", "grid-template-columns"]], w)["out"][0] for w in (696, WIDE)]
        self.assertNotEqual(tracks[0], tracks[1]); self.assertLess(len(tracks[0].split()), len(tracks[1].split()))
        self.assertEqual(probe(f, "projects.html", width=696)["text"], probe(f, "projects.html", width=WIDE)["text"])

    # ---- responsive pictures and video ----
    def test_max_width_keeps_the_banner_inside_the_page(self):
        # Picture table rows 1-2 and 5, DEFS Tuesday, DLL Tuesday Predict, problem guide row 4.
        f = self.files(3)
        got = probe(f, "index.html", [[".banner", "max-width"], [".gallery img", "max-width"]], NARROW)
        self.assertEqual(got["out"], ["100%", "100%"]); self.assertFalse(got["wide"])  # the page does not scroll sideways
        broken = dict(f); broken["styles.css"] = broken["styles.css"].replace(".banner {\n  max-width: 100%;\n  height: auto;\n}",
                                                                             ".banner {\n  height: auto;\n}")
        bad = probe(broken, "index.html", width=NARROW)
        self.assertTrue(bad["wide"])                       # it sticks out
        self.assertEqual(bad["text"], got["text"])         # but a picture has no words
    def test_the_video_and_the_profile_picture_resize_too(self):
        f = self.files(4)
        self.assertEqual(probe(f, "index.html", [["video", "max-width"], [".profile", "max-width"]])["out"], ["100%", "100%"])
        self.assertIn('<video src="video/juan_intro.webm" controls width="320">', f["index.html"])  # the natural size stays
    def test_the_task_outputs_add_the_caption_and_the_description(self):
        self.assertIn("\nBanner drawn for this resume: 900 pixels wide, fitted by CSS\n", STEPS[2]["activity"]["expectedOutput"])
        self.assertIn("The video is 320 pixels wide and shrinks with the page", STEPS[3]["activity"]["expectedOutput"])
        self.assertNotIn("Resume banner drawn for Juan Dela Cruz", STEPS[2]["expectedOutput"])  # alt text is not page text

    # ---- the local template and the cascade ----
    def test_both_stylesheets_apply_and_the_later_one_wins(self):
        # Template table and Step 6: equal strength, so source order decides (16px from the template, 12px from styles.css).
        five = probe(self.files(5), "projects.html", [[".project-list", "display"], [".project-list", "column-gap"]])
        self.assertEqual(five["out"], ["grid", "16px"])
        six = probe(self.files(6), "projects.html", [[".project-list", "display"], [".project-list", "column-gap"]])
        self.assertEqual(six["out"], ["grid", "12px"])
        self.assertEqual(five["text"], six["text"])  # neither changes the page text
        self.assertEqual(self.files(5)["resume-template.css"], self.files(6)["resume-template.css"])  # never edited
        self.assertIn('<link rel="stylesheet" href="resume-template.css">\n  <link rel="stylesheet" href="styles.css">',
                      self.files(5)["projects.html"])
    def test_the_template_card_border_survives_because_nobody_overrode_it(self):
        self.assertEqual(probe(self.files(6), "projects.html", [[".t-card", "border-top-style"], [".t-card", "border-top-color"]])["out"],
                         ["solid", "rgb(85, 85, 85)"])
    def test_a_template_class_with_text_transform_is_page_text(self):
        # Step 5's task and page-text table row 4.
        self.assertIn("\nSEND ME A MESSAGE\n", STEPS[4]["activity"]["expectedOutput"])
        self.assertIn("\nSend me a message\n", STEPS[4]["expectedOutput"])
        self.assertIn(".t-caps {\n  text-transform: uppercase;\n}", CONTENT.TEMPLATE)
    def test_the_template_is_a_local_file_with_nothing_from_the_internet(self):
        self.assertNotRegex(CONTENT.TEMPLATE, r"https?:|url\(|@import")
        for s in STEPS:
            for f in s["files"]:
                self.assertNotRegex(f["content"], r'href="https?:|src="https?:')

    # ---- Thursday: the missing bracket ----
    def test_the_missing_bracket_swallows_every_later_rule(self):
        # Step 8, problem guide row 2, DEFS Thursday, W3C SYNTAX: what is still open at the end is thrown away.
        got = probe(self.files(8), "index.html", [[".gallery", "display"], [".gallery", "column-gap"],
                                                  [".skills li:first-child", "text-transform"], [".banner", "max-width"]], NARROW)
        self.assertEqual(got["out"], ["grid", "normal", "none", "none"])
        self.assertTrue(got["wide"])  # the banner sticks out again
        self.assertIn("\nTyping documents\n", STEPS[7]["expectedOutput"])          # the capitals are gone
        self.assertIn("\nTYPING DOCUMENTS\n", STEPS[7]["activity"]["expectedOutput"])  # and the repair brings them back
        self.assertIn("\nNew \n", STEPS[7]["expectedOutput"])                      # the tag joined its caption's line
        self.assertIn("\nNew\n", STEPS[7]["activity"]["expectedOutput"])
    def test_the_repair_restores_the_step_7_output(self):
        self.assertEqual(STEPS[7]["activity"]["expectedOutput"], STEPS[6]["expectedOutput"])

    # ---- the week's own structure ----
    def test_three_grids_and_two_queries_in_the_finished_stylesheet(self):
        css = next(f["content"] for f in STEPS[8]["files"] if f["path"] == "styles.css")
        self.assertEqual(css.count("display: grid"), 3)  # the gallery, the project cards and the two tables
        self.assertIn("three grids", CONTENT.STEPS[8][3])
        self.assertEqual(css.count("@media"), 2)
        self.assertNotIn("flex-wrap", css)  # the gallery's flex row is gone
        self.assertEqual(css, CONTENT.CSS7)
    def test_the_personal_starter_carries_a_grid_responsive_media_and_one_query(self):
        css = {f["path"]: f["content"] for f in PT["starterFiles"]}["styles.css"]
        self.assertIn("display: grid", css); self.assertIn("max-width: 100%", css)
        self.assertEqual(css.count("@media"), 2)  # Week 9's nav query and this week's gallery query
        self.assertNotRegex(CONTENT.STARTER_NEW, r"url\(")
    def test_the_sample_outputs_that_are_meant_to_match_do_match(self):
        same, as_step = CONTENT.SAME
        self.assertEqual(STEPS[same - 1]["expectedOutput"], STEPS[as_step - 1]["expectedOutput"])
        for n in (4, 5, 6, 7):  # OUTPUT_BASE: these reuse an earlier step's output unchanged
            base = CONTENT.OUTPUT_BASE[n]
            self.assertEqual(STEPS[n - 1]["expectedOutput"], STEPS[base - 1]["expectedOutput"], n)
        self.assertEqual(STEPS[2]["expectedOutput"].replace("images/juan_banner.svg: image decoded\n", ""), STEPS[0]["expectedOutput"])
    def test_no_task_can_be_passed_by_leaving_the_sample_unchanged(self):
        for n, s in enumerate(STEPS, 1):
            with self.subTest(step=n): self.assertNotEqual(s["expectedOutput"], s["activity"]["expectedOutput"])

if __name__ == "__main__":
    unittest.main(verbosity=2)
