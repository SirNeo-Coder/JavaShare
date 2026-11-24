"""Regression checks for Resume Week 6 with the teacher's checker (adapted from Resume/Week_05/test_checker.py).
Every claim in the module's tables, practice notes, problem guide and the DLL's Predict/Debug lines is run here."""
import copy, importlib.util, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_06.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
_spec = importlib.util.spec_from_file_location("content_r06", HERE.parent.parent / "revision_tools/resume_w06/content.py")
CONTENT = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(CONTENT)
NAVY, MAROON, WHITE, BLUE, DARK = "rgb(19, 48, 92)", "rgb(138, 28, 85)", "rgb(255, 255, 255)", "rgb(0, 0, 238)", "rgb(34, 34, 34)"
PT = BASE["performanceTask"]
ALL_FILES = [(s["id"], f) for s in STEPS for f in s["files"]] + [("pt", f) for f in PT["starterFiles"] + PT["exampleFiles"]]
def st(sel, prop, value): return {"selector": sel, "style": prop, "value": value}

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

    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [1, 5, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 5, 9])
        d, _ = self.one_step(5)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        d, _ = self.one_step(4)
        self.assertEqual(self.run_check(d, media=False).returncode, 0)  # contact.html needs no media
    def test_pages_change_only_by_the_nav_list_two_list_classes_and_one_link(self):
        start = {f["path"]: f["content"] for f in BASE["starterFiles"]}
        allowed = {CONTENT.I2, CONTENT.I5, CONTENT.P2, CONTENT.P6, CONTENT.C2, CONTENT.I0}
        for s in STEPS:
            for f in s["files"]:
                if f["path"].endswith(".html"): self.assertIn(f["content"], allowed, (s["id"], f["path"]))
        self.assertEqual(CONTENT.I0, start["index.html"])
        for page, old in ((CONTENT.P2, start["projects.html"]), (CONTENT.C2, start["contact.html"]), (CONTENT.I2, start["index.html"])):
            self.assertEqual(page, old.replace(CONTENT.OLDNAV, CONTENT.NEWNAV))
    def test_every_step_runs_from_its_own_files_alone(self):
        # Teacher, 2026-11-08 (CodeRabbit on PR #86): a step lists its run page and every file that page needs.
        for s in STEPS:
            names = [f["path"] for f in s["files"]]
            self.assertEqual(names[0], s["run"], s["id"])
            for f in s["files"]:
                if 'href="styles.css"' in f["content"]: self.assertIn("styles.css", names, (s["id"], f["path"]))
                for framed in re.findall(r'<iframe[^>]*src="([^"]+)"', f["content"]): self.assertIn(framed, names, (s["id"], f["path"]))
        for n in range(1, 10):
            with self.subTest(step=n): self.passes(self.one_step(n, starter=False)[0])
    def test_a_step_without_its_stylesheet_fails_on_its_own(self):
        d, s = self.one_step(3, starter=False)
        s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]
        self.fails(d, "Style mismatch: nav li display")
    def test_box_values_read_in_px_and_border_longhands(self):
        # Monday: layers table, try table and practice note (h2 font-size 24px).
        d, s = self.one_step(1)
        s["webChecks"] = [st("h2", "font-size", "24px"), st("h2", "border-bottom", "2px solid " + MAROON), st("h2", "border", ""),
                          st("h2", "padding", "0px 0px 6px"), st("h2", "border-top-style", "none")]
        self.passes(d)
        for old, new, check in [("2px solid", "2px dashed", st("h2", "border-bottom-style", "dashed")),
                                ("2px solid #8a1c55", "2px #8a1c55", st("h2", "border-bottom-style", "none")),  # practice (d), problem guide row 2
                                ("padding-bottom: 0.25em", "padding-bottom: 1em", st("h2", "padding-bottom", "24px")),
                                ("margin-top: 1.5em", "margin-top: 0", st("h2", "margin-top", "0px")),
                                ("padding-bottom: 0.25em", "padding-bottom: 0.5em", st("h2", "padding-bottom", "12px")),
                                ("margin-top: 1.5em", "margin-top: 1em", st("h2", "margin-top", "24px")),
                                ("2px solid #8a1c55", "3px dotted #8a1c55", st("h2", "border-bottom-style", "dotted"))]:
            d, s = self.one_step(1); self.edit(s, old, new); s["webChecks"] = [check]
            with self.subTest(new=new): self.passes(d)  # the same page text every time
    def test_sides_table_and_the_frames_default_border(self):
        d, s = self.one_step(3)
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] += "p {\n  margin: 1em 0;\n}\n"
        s["webChecks"] = [st(".badge", "padding", "3px 6px"), st(".badge", "border-top-color", "rgb(180, 83, 9)"), st("p", "margin-top", "16px"),
                          st("p", "margin-left", "0px"), st("iframe", "border", "2px solid " + NAVY), st("iframe", "width", "420px")]
        self.passes(d)
        d, s = self.one_step(2)  # before Step 3: the browser's own frame border
        s["webChecks"] = [st("iframe", "border-top-style", "inset"), st("iframe", "border-top-width", "2px")]; self.passes(d)
    def test_box_sizing_is_read_itself_because_the_width_reads_300px_either_way(self):
        d, s = self.one_step(4)
        self.edit(s, "  box-sizing: border-box;\n", "")  # DLL Tuesday Predict: the boxes grow to 310px, the width check still reads 300px
        s["webChecks"] = [st("input", "width", "300px"), st("input", "box-sizing", "content-box"), st("textarea", "box-sizing", "content-box"),
                          st("select", "box-sizing", "border-box")]  # a select is border-box by default
        self.passes(d)
    def test_nav_list_page_text_blocks_inline_inline_block_and_no_spaces(self):
        self.assertIn("\nHOME\nPROJECTS\nCONTACT\n", STEPS[1]["expectedOutput"])
        self.assertIn("\nHOME PROJECTS CONTACT\n", STEPS[1]["activity"]["expectedOutput"])
        self.assertIn("\nHOME PROJECTS CONTACT\n", STEPS[2]["expectedOutput"])
        one_line = STEPS[2]["expectedOutput"]
        d, s = self.one_step(3)  # DLL Wednesday Predict: display: block puts the nav on three lines
        self.edit(s, "display: inline-block;", "display: block;")
        s["webChecks"] = []; s["expectedOutput"] = one_line.replace("HOME PROJECTS CONTACT", "HOME\nPROJECTS\nCONTACT"); self.passes(d)
        d, s = self.one_step(3)  # practice (d) and problem guide: li tags with no space between them
        f = next(f for f in s["files"] if f["path"] == "projects.html"); f["content"] = f["content"].replace("</li>\n      <li>", "</li><li>")
        s["webChecks"] = []; s["expectedOutput"] = one_line.replace("HOME PROJECTS CONTACT", "HOMEPROJECTSCONTACT"); self.passes(d)
    def test_list_styles_are_not_page_text_and_beat_the_type_attribute(self):
        d, s = self.one_step(5)
        self.edit(s, "list-style-type: square;", "list-style-type: decimal;")  # Wednesday practice (a)
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] += "ol[type] {\n  list-style-type: lower-roman;\n}\n"
        s["webChecks"] = [st(".skills", "list-style-type", "decimal"), st("ol[type]", "list-style-type", "lower-roman"), st("ul ul", "list-style-type", "circle")]
        self.passes(d)  # the same page text
    def test_link_styles_plain_state_only(self):
        d, s = self.one_step(6)
        s["webChecks"] = [{"selector": "a:link", "count": 4}, {"selector": "a:visited", "count": 0}, {"selector": "a:hover", "count": 0},
                          st("p a", "text-decoration", "underline"), st("nav a", "text-decoration", "none"), st("p a", "background-color", "rgba(0, 0, 0, 0)")]
        self.passes(d)
        d, s = self.one_step(2)  # before Step 6: browser blue, underlined
        s["webChecks"] = [st("nav a", "color", BLUE), st("nav a", "text-decoration-line", "underline")]; self.passes(d)
    def test_no_page_check_on_a_link_state(self):
        # querySelectorAll never matches :visited, a check has no mouse, and a style check on a:hover makes the checker wait 30 s.
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertIsNone(re.search(r":(hover|visited|focus|active)\b", c["selector"]), (s["id"], c))
    def test_no_page_check_on_a_border_width_ckb_097(self):
        # CodeShare's page window follows the text-size zoom (1.15 at first, 1 to 1.45) and a border is drawn in whole screen
        # dots: 2px reads 1.73913px there, but 2px in the teacher's checker. Check a border's style and colour, never its width.
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertIsNone(re.search(r"border(-\w+)?-width|^border(-\w+)?$|outline", c.get("style", "")), (s["id"], c))
    def test_no_page_check_on_a_value_that_follows_the_window(self):
        # %, auto margins and widths that fill the window resolve from the window size; CodeShare's page window is not 1000 px wide.
        for s in STEPS:
            css = next((f["content"] for f in s["files"] if f["path"] == "styles.css"), "")
            for c in s.get("webChecks", []):
                if c.get("style") in ("width", "height", "max-width"):  # an unset width fills the window
                    self.assertIn("%s: %s;" % (c["style"], c["value"]), css, (s["id"], c))
            self.assertNotRegex(css, r"\d%|margin: [^;]*auto", s["id"])
    def test_spacing_mistakes_drop_only_that_declaration(self):
        # Thursday practice, problem guide row 1 and DLL Thursday: no unit, misspelt, space before the unit, negative padding.
        for old, new, checks in [("  padding: 0.25em 0.5em;\n  border: 1px", "  padding: 10;\n  border: 1px", [st(".badge", "padding-top", "0px"), st(".badge", "border-top-width", "1px")]),
                                 ("  margin-right: 0.5em;\n", "  margn-right: 0.5em;\n", [st("nav li", "margin-right", "0px"), st("nav li", "display", "inline-block")]),
                                 ("  margin-top: 1.5em;\n", "  margin-top: 1.5 em;\n", [st("h2", "margin-top", "19.92px"), st("h2", "padding-bottom", "6px")]),
                                 ("  padding-bottom: 0.25em;\n", "  pading-bottom: 0.25em;\n", [st("h2", "padding-bottom", "0px")]),
                                 ("  padding-bottom: 0.25em;\n", "  padding-bottom: -5px;\n", [st("h2", "padding-bottom", "0px")]),
                                 ("  margin-top: 1.5em;\n", "  margin-top: -5px;\n", [st("h2", "margin-top", "-5px")])]:
            d, s = self.one_step(6); self.edit(s, old, new); s["webChecks"] = checks
            with self.subTest(new=new): self.passes(d)  # the output is the same
    def test_two_margins_that_meet_are_both_kept_in_their_own_checks(self):
        # The gap (30px, not 50px) was measured on screen (Verification.md); each box still reports its own margin.
        d, s = self.one_step(3)
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] += "ul {\n  margin-bottom: 20px;\n}\nh2 {\n  margin-top: 30px;\n}\n"
        s["webChecks"] = [st("body > ul", "margin-bottom", "20px"), st("h2", "margin-top", "30px")]; self.passes(d)
    def test_a_missing_semicolon_skips_display_too(self):
        d, s = self.one_step(7)
        self.edit(s, "  margin-right: 0.5em\n", "  margin-right: 0.5em;\n")
        self.fails(d, "Style mismatch: nav li display: inline-block")
        s["webChecks"] = [st("nav li", "display", "inline-block"), st("nav li", "margin-right", "8px")]
        s["expectedOutput"] = STEPS[6]["activity"]["expectedOutput"]; self.passes(d)
    def test_a_missing_brace_stops_every_later_rule(self):
        self.assertIn("\nHome\nProjects\nContact\n", STEPS[7]["expectedOutput"])
        d, s = self.one_step(8)
        self.edit(s, "  margin-top: 1.5em;\nnav {", "  margin-top: 1.5em;\n}\nnav {")
        self.fails(d, "Style mismatch: nav text-transform: uppercase")
        s["webChecks"] = [st("nav", "text-transform", "uppercase"), st("label", "font-weight", "700"), st("input", "box-sizing", "border-box"),
                          st("#form-note", "color", "rgb(155, 28, 28)")]
        s["expectedOutput"] = STEPS[7]["activity"]["expectedOutput"]; self.passes(d)
        d, s = self.one_step(8)  # a missing last } changes nothing
        f = next(f for f in s["files"] if f["path"] == "styles.css"); self.edit(s, "  margin-top: 1.5em;\nnav {", "  margin-top: 1.5em;\n}\nnav {")
        self.assertTrue(f["content"].endswith("}\n")); f["content"] = f["content"][:-2]
        s["webChecks"] = [st("#form-note", "font-style", "italic")]
        s["expectedOutput"] = STEPS[7]["activity"]["expectedOutput"]; self.passes(d)
    def test_both_thursday_repairs_change_the_page_text(self):
        # CodeRabbit on PR #87: a repair whose only effect is a style cannot be proven by a task's page text.
        for n in (7, 8):
            s = STEPS[n - 1]
            self.assertNotEqual(s["expectedOutput"], s["activity"]["expectedOutput"], s["id"])
    def test_every_contrast_pair_and_border_reaches_its_minimum(self):
        self.assertTrue(all(r >= 4.5 for _, _, _, r in CONTENT.CONTRAST), CONTENT.CONTRAST)
        self.assertTrue(all(r >= 3 for _, r in CONTENT.BORDER_RATIOS), CONTENT.BORDER_RATIOS)
        self.assertTrue(all(r < 3 for r in CONTENT.TRAPS.values()), CONTENT.TRAPS)
        self.assertAlmostEqual(CONTENT.ratio("#000000", "#ffffff"), 21.0, 6); self.assertAlmostEqual(CONTENT.ratio("#ffffff", "#13305c"), 13.08, 2)
        css = next(f["content"] for f in STEPS[8]["files"] if f["path"] == "styles.css")
        for colour in ("#ffffff", "#13305c", "#8a1c55", "#551a8b", "#fff3c4", "#b45309", "#555555", "#9b1c1c", "#333333"):
            self.assertIn(colour, css)  # the pairs computed are the colours Juan's finished stylesheet sets
    def test_each_nav_li_on_its_own_line_and_nothing_uses_url(self):
        for sid, f in ALL_FILES:
            self.assertNotIn("</li><li>", f["content"], (sid, f["path"]))
            self.assertIsNone(re.search(r"url\(|@font-face", f["content"]), (sid, f["path"]))
        for f in PT["starterFiles"]:
            if f["path"].endswith(".html"): self.assertIn("<nav>\n    <ul>", f["content"], f["path"])
    def test_every_value_in_quotes_ckb_094(self):
        for sid, f in ALL_FILES:
            if f["path"].endswith(".html"):
                self.assertIsNone(re.search(r'<[a-zA-Z][^>]*\s[\w-]+=[^"\s>]', f["content"]), (sid, f["path"]))
    def test_never_a_page_check_on_link_or_style_elements(self):
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertIsNone(re.search(r'(^|[\s>+~,])(link|style)(?![\w\-\]])', c["selector"]), (s["id"], c))
    def test_no_src_page_check_on_an_iframe_or_uploaded_media_ckb_086_092(self):
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertFalse(c.get("attribute") == "src", (s["id"], c))
    def test_no_broken_quote_before_an_iframe_ckb_093(self):
        for sid, f in ALL_FILES:
            for m in re.finditer(r"<iframe\b", f["content"]):
                self.assertEqual(f["content"][:m.start()].count('"') % 2, 0, (sid, f["path"]))
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(3)
        good = s["expectedOutput"]; s["expectedOutput"] = good.replace("\nHOME PROJECTS CONTACT\n", "\nHOME | PROJECTS | CONTACT\n")
        self.fails(d, "Output differs")
        s["expectedOutput"] = s["expectedOutput"].replace("\nHOME | PROJECTS | CONTACT\n", "\nHOME PROJECTS CONTACT\n"); self.assertEqual(s["expectedOutput"], good); self.passes(d)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
