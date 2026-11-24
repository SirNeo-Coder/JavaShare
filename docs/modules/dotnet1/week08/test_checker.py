"""Regression checks for Resume Week 8 with the teacher's checker (adapted from Resume/Week_07/test_checker.py).
Every claim in the module's tables, practice notes, problem guide and the DLL's Predict/Debug lines that the page text or a
page check can show is run here. A page check has no mouse or keyboard and cannot pick a pseudo-element, so the focus and
pseudo-element claims are run in the same Chromium with a real Tab key and getComputedStyle(element, "::before")."""
import copy, importlib.util, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_08.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
_spec = importlib.util.spec_from_file_location("content_r08", HERE.parent.parent / "revision_tools/resume_w08/content.py")
CONTENT = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(CONTENT)
PT = BASE["performanceTask"]
ALL_FILES = [(s["id"], f) for s in STEPS for f in s["files"]] + [("pt", f) for f in PT["starterFiles"] + PT["exampleFiles"]]
NODE = CONTENT.NODE
DEPS = "/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
CHROME = "/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"
MAROON = "rgb(138, 28, 85)"
def st(sel, prop, value): return {"selector": sel, "style": prop, "value": value}
def ct(sel, n): return {"selector": sel, "count": n}

# Opens `run` from `files` in Chromium (no internet, 1000 x 900 like the checker), presses Tab `tabs` times (or clicks `click`)
# and returns what the probes read: [selector, pseudo-element or null, property] on the first match, or the focused element.
PROBE = r"""
const fs=require('fs'),path=require('path'),os=require('os');const {pathToFileURL}=require('url');
const {chromium}=require(path.join(process.argv[1],'playwright'));
(async()=>{const job=JSON.parse(fs.readFileSync(0,'utf8'));const dir=fs.mkdtempSync(path.join(os.tmpdir(),'w8-'));
for(const [p,c] of Object.entries(job.files)) fs.writeFileSync(path.join(dir,p),c);
const b=await chromium.launch({executablePath:process.argv[2]});const ctx=await b.newContext({offline:true,viewport:{width:1000,height:900}});
const pg=await ctx.newPage();await pg.goto(pathToFileURL(path.join(dir,job.run)).href);
if(job.click) await pg.click(job.click);
for(let i=0;i<(job.tabs||0);i++) await pg.keyboard.press('Tab');
const out=await pg.evaluate(probes=>probes.map(([sel,pseudo,prop])=>{const el=sel==='FOCUSED'?document.activeElement:document.querySelector(sel);
 return el?getComputedStyle(el,pseudo).getPropertyValue(prop):null}),job.probes);
const focused=await pg.evaluate(()=>document.activeElement.tagName.toLowerCase()+(document.activeElement.id?'#'+document.activeElement.id:''));
process.stdout.write(JSON.stringify({out,focused}));await b.close();fs.rmSync(dir,{recursive:true,force:true});})().catch(e=>{console.error(e);process.exit(1)});
"""
def probe(files, run, probes, tabs=0, click=None):
    job = {"files": files, "run": run, "probes": probes, "tabs": tabs, "click": click}
    r = subprocess.run([NODE, "-e", PROBE, DEPS, CHROME], input=json.dumps(job), capture_output=True, text=True, timeout=120)
    if r.returncode: raise AssertionError(r.stderr)
    return json.loads(r.stdout)

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

    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [1, 4, 5, 8, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 4, 5, 8, 9])
        d, _ = self.one_step(1)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        for n in (2, 3):
            self.assertEqual(self.run_check(self.one_step(n)[0], media=False).returncode, 0)  # projects.html and contact.html need no media
    def test_pages_change_only_by_the_goals_and_motto_classes(self):
        start = {f["path"]: f["content"] for f in BASE["starterFiles"]}
        allowed = {CONTENT.I0, CONTENT.I4, CONTENT.I5, CONTENT.P0, CONTENT.C0}
        for s in STEPS:
            for f in s["files"]:
                if f["path"].endswith(".html"): self.assertIn(f["content"], allowed, (s["id"], f["path"]))
        self.assertEqual((CONTENT.I0, CONTENT.P0, CONTENT.C0), (start["index.html"], start["projects.html"], start["contact.html"]))
        self.assertEqual(CONTENT.I5, start["index.html"].replace('<ol type="A"', '<ol class="goals" type="A"').replace("<p>Learn a", '<p class="motto">Learn a'))
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
        self.fails(d, "Style mismatch: .badge float")
    def test_hover_is_not_page_text_and_matches_nothing_without_a_mouse(self):
        # Page-text table row 1, Monday try row 2, Monday practice (a), states table: a check has no mouse or keyboard.
        self.same_output(1, ".skills li:hover {\n  background-color: #fff3c4;\n}\n", "", [ct(".skills li:hover", 0), ct(".skills li", 2)])
        self.same_output(3, "button:hover, button:focus {", "button {", [st("button", "color", "rgb(255, 255, 255)")])  # Tuesday practice (a)
        d, s = self.one_step(4); s["webChecks"] = [ct("a:focus-visible", 0), ct("a:hover", 0), ct("a", 3)]; self.passes(d)
    def test_first_child_follows_the_position_and_its_capitals_are_page_text(self):
        # Step 1 and its task, Monday try rows 1 and 3, DLL Monday Predict, page-text table row 2, Tuesday practice (d).
        self.assertIn("\nSkills\nTYPING DOCUMENTS\nMaking slide presentations\n", STEPS[0]["expectedOutput"])
        self.assertIn("\nSkills\nEDITING SHORT VIDEOS\nTyping documents\nMaking slide presentations\n", STEPS[0]["activity"]["expectedOutput"])
        self.assertIn("\\nSkills\\nTyping documents\\nMAKING SLIDE PRESENTATIONS\\n", self.output_of(1, ".skills li:first-child {", ".skills li:last-child {"))
        self.assertIn("\\nSkills\\nTyping documents\\nMaking slide presentations\\n", self.output_of(1, ".skills li:first-child {\n  font-weight: bold;\n  text-transform: uppercase;\n", ".skills li:first-child {\n  font-weight: bold;\n"))
        self.assertIn("\nDrawing digital posters\nInterests\n", STEPS[8]["activity"]["expectedOutput"])  # Friday task: only the first stays in capitals
    def test_first_letter_text_transform_is_page_text(self):
        # Step 2 and its task, page-text table row 3, elements table row 3, Wednesday practice (c).
        self.assertIn("\nScience poster: Saving water at home\nSolo work\n", STEPS[1]["expectedOutput"])
        self.assertIn("\nPoster for Nutrition Month\nClass work\n", STEPS[1]["activity"]["expectedOutput"])
        self.assertIn("\\nskills\\nTYPING DOCUMENTS\\n", self.output_of(1, ".skills li:hover {", "h2::first-letter {\n  text-transform: lowercase;\n}\n.skills li:hover {"))
    def test_text_from_before_and_after_is_not_page_text(self):
        # Step 5 (same output as Step 4), page-text table row 4, Monday try row 4 (one colon), elements table, Wednesday practice (a),
        # DLL Wednesday Predict (::before to ::after), DLL Friday Predict (another symbol).
        self.assertEqual(STEPS[4]["expectedOutput"], STEPS[3]["expectedOutput"])
        self.same_output(1, ".skills li:hover {", 'h2:before {\n  content: "★ ";\n}\n.skills li:hover {', [])
        self.same_output(5, ".skills li::before {", ".skills li::after {", [])
        self.same_output(5, 'content: "✓ ";', 'content: "★ ";', [])
        out = probe(self.files(5), "index.html", [[".skills li", "::before", "content"], [".skills li", "::before", "color"], [".motto", "::after", "content"],
                                                  ["h2", "::before", "content"]])["out"]
        self.assertEqual(out, ['"✓ "', "rgb(46, 125, 50)", '"”"', "none"])
    def test_a_missing_quote_skips_the_symbol_and_the_next_line(self):
        # Problem guide row 5, Thursday practice (c), DLL Wednesday Debug: no symbol, the next declaration skipped, same output.
        self.same_output(5, 'content: "✓ ";', 'content: "✓ ;', [])
        f = self.files(5); f["styles.css"] = f["styles.css"].replace('content: "✓ ";', 'content: "✓ ;')
        out = probe(f, "index.html", [[".skills li", "::before", "content"], [".skills li", "::before", "color"], [".skills li", "::before", "font-weight"]])["out"]
        self.assertEqual(out, ["none", "rgb(34, 34, 34)", "700"])  # content and colour skipped; the line after them still applies
    def test_a_floated_drop_cap_keeps_the_page_text_and_moves_with_the_new_paragraph(self):
        # Step 6 (same output as Step 2), Wednesday practice (b), (d), its task.
        self.assertEqual(STEPS[5]["expectedOutput"], STEPS[1]["expectedOutput"])
        self.assertIn("\nICT STRAND\nMy favourite projects are below.\nTwo school projects I am proud of.\n", STEPS[5]["activity"]["expectedOutput"])
        f = self.files(6)
        self.assertEqual(probe(f, "projects.html", [["h1 + p", "::first-letter", "float"], ["h1 + p", "::first-letter", "font-size"]])["out"], ["left", "41.6px"])
        sol = {p.name: p.read_text() for p in (HERE / "solutions" / STEPS[5]["id"]).iterdir()}
        self.assertEqual(probe(sol, "projects.html", [["h1 + p", None, "color"]])["out"], ["rgb(51, 51, 51)"])
        self.assertIn("<h1>Projects of Juan Dela Cruz <span class=\"ribbon\">ICT strand</span></h1>\n  <p>My favourite", sol["projects.html"])
    def test_form_states_are_read_by_page_checks(self):
        # Step 3, states table, DLL Tuesday Predict: without required the email box's border turns grey; the output stays.
        self.assertIn("\nYour email\nYour school\nTopic\n", STEPS[2]["activity"]["expectedOutput"])
        self.same_output(3, 'id="email" name="email" required>', 'id="email" name="email">',
                         [ct("input:required", 1), st("#email", "border-top-color", "rgb(85, 85, 85)"), st("#visitor", "border-top-color", MAROON)], "contact.html")
        d, s = self.one_step(3); s["webChecks"] = [ct("input:invalid", 2), ct("input:placeholder-shown", 1), ct("option:checked", 1)]; self.passes(d)
    def test_focus_looks_like_hover_with_the_keyboard(self):
        # Step 3 and Step 4 check-yourself lines, problem guide row 6, DLL Tuesday Debug, Monday Debug.
        f3 = self.files(3)
        r = probe(f3, "contact.html", [["FOCUSED", None, "outline-style"], ["FOCUSED", None, "outline-width"], ["FOCUSED", None, "outline-color"]], click="#visitor")
        self.assertEqual((r["focused"], r["out"]), ("input#visitor", ["solid", "3px", MAROON]))
        tabs = 3 + 5  # nav links, then name, email, topic, message, button
        r = probe(f3, "contact.html", [["FOCUSED", None, "background-color"], ["FOCUSED", None, "color"]], tabs=tabs)
        self.assertEqual((r["focused"], r["out"]), ("button", [MAROON, "rgb(255, 255, 255)"]))
        f3["styles.css"] = f3["styles.css"].replace("button:hover, button:focus {", "button:hover {")
        r = probe(f3, "contact.html", [["FOCUSED", None, "background-color"]], tabs=tabs)
        self.assertEqual(r["focused"], "button"); self.assertNotEqual(r["out"][0], MAROON)  # :hover alone: nothing for the keyboard
        r = probe(self.files(4), "index.html", [["FOCUSED", None, "outline-style"], ["FOCUSED", None, "outline-color"], ["FOCUSED", None, "outline-offset"]], tabs=1)
        self.assertEqual((r["focused"], r["out"]), ("a", ["solid", MAROON, "2px"]))
    def test_nth_child_odd_colours_the_new_third_goal(self):
        # Step 4 and its task, Tuesday Connect question.
        self.assertIn("\nBuild my resume page.\nHelp a classmate with HTML.\nFinish every module task.\nSkills I will learn next\n", STEPS[3]["activity"]["expectedOutput"])
        sol = {p.name: p.read_text() for p in (HERE / "solutions" / STEPS[3]["id"]).iterdir()}
        self.assertEqual(probe(sol, "index.html", [[".goals li:last-child", None, "color"], [".goals li:nth-child(2)", None, "color"]])["out"], [MAROON, "rgb(34, 34, 34)"])
    def test_before_text_takes_the_first_letter(self):
        # Step 7 and its repair, problem guide row 4, DLL Thursday demo.
        self.assertIn("\nScience poster: Saving water at home\nsolo work\n", STEPS[6]["expectedOutput"])
        self.assertEqual(STEPS[6]["activity"]["expectedOutput"], STEPS[1]["expectedOutput"])
        d, s = self.one_step(7)
        self.edit(s, '.badge::before {\n  content: "★ ";', '.badge::after {\n  content: " ★";')
        self.fails(d, "Output differs")
        s["expectedOutput"] = STEPS[6]["activity"]["expectedOutput"]; self.passes(d)
    def test_selector_mistakes_drop_the_whole_rule(self):
        # Step 8 and its repair, problem guide rows 1-3, Thursday practice (a), (b), DLL Thursday Quick check and Predict.
        self.assertIn("\nSkills\nTyping documents\n", STEPS[7]["expectedOutput"]); self.assertEqual(STEPS[7]["activity"]["expectedOutput"], STEPS[4]["expectedOutput"])
        d, s = self.one_step(8); self.edit(s, ".skills li:frist-child {", ".skills li:first-child {")
        self.fails(d, "Style mismatch: .skills li:first-child text-transform")
        s["webChecks"] = [st(".skills li:first-child", "text-transform", "uppercase")]; s["expectedOutput"] = STEPS[7]["activity"]["expectedOutput"]; self.passes(d)
        self.assertIn("\\nSkills\\nTyping documents\\n", self.output_of(1, ".skills li:first-child {", ".skills li :first-child {"))  # a space
        self.assertIn("\\nsolo work\\n", self.output_of(2, ".badge::first-letter {", ".badge::first-letter, .ribbon::frist-letter {"))  # comma list
        self.assertIn("\\nsolo work\\n", self.output_of(2, ".badge::first-letter {", ".badge::frist-letter {"))
        self.same_output(2, ".badge::first-letter {", ".badge:first-letter {", [])  # one colon still works: Solo work
    def test_both_thursday_repairs_change_the_page_text(self):
        for n in (7, 8):
            s = STEPS[n - 1]
            self.assertNotEqual(s["expectedOutput"], s["activity"]["expectedOutput"], s["id"])
    def test_no_page_check_on_a_state_a_pseudo_element_or_a_window_value(self):
        for s in STEPS:
            css = next((f["content"] for f in s["files"] if f["path"] == "styles.css"), "")
            self.assertNotRegex(css, r"first-line|\d%|: auto|position: fixed|url\(", s["id"])
            for c in s.get("webChecks", []):
                self.assertIsNone(re.search(r":(hover|visited|focus|active|link)\b|::|:(before|after|first-letter)\b", c["selector"]), (s["id"], c))
                self.assertIsNone(re.search(r"border(-\w+)?-width|^border(-\w+)?$|outline", c.get("style", "")), (s["id"], c))  # CKB-097
                self.assertNotIn(c.get("style"), ("top", "right", "bottom", "left", "width", "height"), (s["id"], c))
                self.assertIsNone(re.search(r'(^|[\s>+~,])(link|style)(?![\w\-\]])', c["selector"]), (s["id"], c))
                self.assertFalse(c.get("attribute") == "src", (s["id"], c))  # CKB-086, CKB-092
    def test_every_value_in_quotes_each_li_on_its_own_line_no_url(self):
        for sid, f in ALL_FILES:
            if f["path"].endswith(".html"):
                self.assertIsNone(re.search(r'<[a-zA-Z][^>]*\s[\w-]+=[^"\s>]', f["content"]), (sid, f["path"]))  # CKB-094
                for m in re.finditer(r"<iframe\b", f["content"]):
                    self.assertEqual(f["content"][:m.start()].count('"') % 2, 0, (sid, f["path"]))  # CKB-093
            self.assertNotIn("</li><li>", f["content"], (sid, f["path"]))
            self.assertIsNone(re.search(r"url\(|@font-face|first-line", f["content"]), (sid, f["path"]))
    def test_every_contrast_pair_outline_and_border_reaches_its_minimum(self):
        self.assertTrue(all(r >= 4.5 for _, _, _, r in CONTENT.CONTRAST), CONTENT.CONTRAST)
        self.assertTrue(all(r >= 3 for _, r in CONTENT.BORDER_RATIOS), CONTENT.BORDER_RATIOS)
        self.assertAlmostEqual(CONTENT.ratio("#2e7d32", "#ffffff"), 5.13, 2); self.assertAlmostEqual(CONTENT.ratio("#ffffff", "#8a1c55"), 8.83, 2)
        css = next(f["content"] for f in STEPS[8]["files"] if f["path"] == "styles.css")
        for colour in ("#fff3c4", "#8a1c55", "#2e7d32", "#ffffff"):
            self.assertIn(colour, css)
    def test_personal_starter_has_hover_focus_a_structural_pseudo_class_and_a_pseudo_element(self):
        start = {f["path"]: f["content"] for f in PT["starterFiles"]}
        for word in ("a:hover, a:focus {", "a:focus-visible {", "outline: 3px solid #8a1c55;", ".skills li:first-child {", 'h2::before {\n  content: "★ ";'):
            self.assertIn(word, start["styles.css"])
        self.assertEqual(sorted(re.findall(r'src="(images/[^"]+)"', start["index.html"])), sorted(CONTENT.STARTER_BROKEN))
        r = probe(start, "index.html", [["h2", "::before", "content"], [".skills li:first-child", None, "font-weight"]])
        self.assertEqual(r["out"], ['"★ "', "700"])
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(2)
        good = s["expectedOutput"]; s["expectedOutput"] = good.replace("\nSolo work\n", "\nSOLO WORK\n")
        self.fails(d, "Output differs")
        s["expectedOutput"] = good; self.passes(d)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
