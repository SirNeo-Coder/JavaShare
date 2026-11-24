"""Regression checks for Resume Week 5 with the teacher's checker (adapted from Resume/Week_04/test_checker.py).
Every claim in the module's tables, practice notes, problem guide and the DLL's Predict/Debug lines is run here."""
import copy, importlib.util, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_05.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
_spec = importlib.util.spec_from_file_location("content_r05", HERE.parent.parent / "revision_tools/resume_w05/content.py")
CONTENT = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(CONTENT)
NAVY, GREY, WHITE, BLACK, DARK = "rgb(19, 48, 92)", "rgb(51, 51, 51)", "rgb(255, 255, 255)", "rgb(0, 0, 0)", "rgb(34, 34, 34)"
GRAD = "linear-gradient(to right, rgb(19, 48, 92), rgb(138, 28, 85))"
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
        self.assertEqual(media, [1, 6, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 6, 9])
        d, _ = self.one_step(6)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        d, _ = self.one_step(4)
        self.assertEqual(self.run_check(d, media=False).returncode, 0)  # contact.html needs no media
    def test_week_5_changes_only_styles_css(self):
        start = {f["path"]: f["content"] for f in BASE["starterFiles"]}
        for s in STEPS:
            for f in s["files"]:
                if f["path"] != "styles.css": self.assertEqual(f["content"], start[f["path"]], (s["id"], f["path"]))
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
        d, s = self.one_step(2, starter=False)
        s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]
        self.fails(d, "Style mismatch: h1 color")
    def test_fonts_colours_and_gradients_are_not_page_text_but_the_page_check_sees_them(self):
        d, s = self.one_step(1)
        self.edit(s, "Verdana, Tahoma, sans-serif", "\"Courier New\", monospace")
        self.fails(d, 'Style mismatch: body font-family: "Courier New", monospace')
        s["webChecks"] = []; self.passes(d)  # the same page text
        d, s = self.one_step(2)
        self.edit(s, "to right, #13305c", "to bottom, #13305c")  # try table: navy at the top, maroon at the bottom
        s["webChecks"] = [st("h1", "background-image", "linear-gradient(rgb(19, 48, 92), rgb(138, 28, 85))")]; self.passes(d)
        d, s = self.one_step(2)
        self.edit(s, "linear-gradient(to right, #13305c, #8a1c55)", "radial-gradient(circle, #8a1c55, #13305c)")
        s["webChecks"] = [st("h1", "background-image", "radial-gradient(circle, rgb(138, 28, 85), rgb(19, 48, 92))")]; self.passes(d)
    def test_computed_values_named_colours_em_and_unitless_sizes(self):
        d, s = self.one_step(2)  # white, #ffffff and rgb(255, 255, 255) are one colour
        for value in ("white", "rgb(255, 255, 255)"):
            d, s = self.one_step(2); self.edit(s, "color: #ffffff;", "color: %s;" % value)
            s["webChecks"] = [st("h1", "color", WHITE)]
            with self.subTest(value=value): self.passes(d)
        d, s = self.one_step(3)  # practice: 1.5em of 16px, line-height 2 on 16px, letter-spacing 3px, no text-align
        f = next(f for f in s["files"] if f["path"] == "styles.css")
        f["content"] += "p {\n  font-size: 1.5em;\n}\nli {\n  line-height: 2;\n  letter-spacing: 3px;\n}\n"
        self.edit(s, "  text-align: center;\n", "")
        s["webChecks"] = [st("p", "font-size", "24px"), st("li", "line-height", "32px"), st("li", "letter-spacing", "3px"),
                          st("h1", "text-align", "start"), st("body", "line-height", "24px"), st("h1", "line-height", "64px")]
        self.passes(d)
        d, s = self.one_step(4)
        f = next(f for f in s["files"] if f["path"] == "styles.css")
        f["content"] += "h1 {\n  text-decoration: underline;\n}\n#form-note {\n  font-family: 'Courier New', monospace;\n}\n"
        s["webChecks"] = [st("h1", "text-decoration", "underline"), st("label", "text-decoration", "none"),
                          st("#form-note", "font-family", '"Courier New", monospace'), st("label", "font-size", "17.6px")]
        self.passes(d)
    def test_opacity_zero_and_transparent_text_stay_in_the_page_text(self):
        d, s = self.one_step(2)  # try table: opacity 0 on the h1, the name is still there
        self.edit(s, "  color: #ffffff;\n", "  color: #ffffff;\n  opacity: 0;\n")
        s["webChecks"] = [st("h1", "opacity", "0")]; self.passes(d)
        d, s = self.one_step(6)  # small print at opacity 0 or a transparent colour stays in the output
        for rule in ("  opacity: 0;\n", "  color: transparent;\n"):
            d, s = self.one_step(6); self.edit(s, "  opacity: 0.75;\n", rule)
            s["webChecks"] = []
            with self.subTest(rule=rule): self.passes(d)
    def test_text_transform_changes_page_text_capitalize_also_on_a_button_not_on_options(self):
        d, s = self.one_step(4)
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] += "label, button, option {\n  text-transform: capitalize;\n}\n"
        s["expectedOutput"] = s["expectedOutput"].replace("Your name", "Your Name").replace("Your email", "Your Email").replace("Send message", "Send Message")
        self.assertIn("School project", s["expectedOutput"]); self.passes(d)
    def test_an_invalid_gradient_or_colour_drops_only_that_declaration(self):
        # Problem guide row 1 and Thursday's practice: missing comma, "to rigth", a colour without #. Output unchanged.
        for old, new, check in [("#13305c, #8a1c55)", "#13305c #8a1c55)", st("h1", "background-image", "none")),
                                ("to right,", "to rigth,", st("h1", "background-image", "none")),
                                ("right, #13305c", "right, 13305c", st("h1", "background-image", "none")),
                                ("color: #ffffff;", "color: ffffff;", st("h1", "color", BLACK))]:
            d, s = self.one_step(3); self.edit(s, old, new)
            s["webChecks"] = [check, st("nav", "text-transform", "uppercase"), st("h1", "letter-spacing", "2px")]
            with self.subTest(new=new): self.passes(d)
    def test_a_missing_bracket_stops_every_later_rule(self):
        self.assertIn("Home | Projects | Contact", STEPS[6]["expectedOutput"])  # Step 7 sample
        d, s = self.one_step(7)
        self.edit(s, "#8a1c55;\n  text-align", "#8a1c55);\n  text-align")
        self.fails(d, "Style mismatch: h1 background-image: " + GRAD)
        s["webChecks"] = [st("nav", "text-transform", "uppercase"), st(".badge", "text-transform", "uppercase")]
        s["expectedOutput"] = STEPS[6]["activity"]["expectedOutput"]; self.passes(d)
    def test_a_missing_semicolon_after_the_colour_skips_the_capitals_too(self):
        self.assertIn("\nContact Juan\n", STEPS[7]["expectedOutput"])  # Step 8 sample
        d, s = self.one_step(8)
        self.edit(s, "  color: #ffffff\n", "  color: #ffffff;\n")
        self.fails(d, "Style mismatch: h1 color: " + WHITE)
        d, s = self.one_step(8)  # a colour without # instead: the heading is dark too, but its capitals stay, so the output cannot prove a repair
        self.edit(s, "  color: #ffffff\n", "  color: ffffff;\n")
        s["webChecks"] = [st("h1", "color", DARK), st("h1", "text-transform", "uppercase")]
        s["expectedOutput"] = STEPS[7]["activity"]["expectedOutput"]; self.passes(d)
    def test_every_contrast_pair_reaches_4_5_and_the_broken_samples_do_not(self):
        self.assertTrue(all(r >= 4.5 for _, _, _, r in CONTENT.CONTRAST), CONTENT.CONTRAST)
        self.assertTrue(all(r < 3 for r in CONTENT.BROKEN.values()), CONTENT.BROKEN)
        self.assertAlmostEqual(CONTENT.ratio("#000000", "#ffffff"), 21.0, 6); self.assertAlmostEqual(CONTENT.ratio("#777777", "#777777"), 1.0, 6)
        self.assertEqual(CONTENT.SMALL_SEEN, "#666666"); self.assertEqual(CONTENT.mix("#333333", "#ffffff", 0.6), "#adadad")  # opacity 0.75 and 0.4
        self.assertLess(CONTENT.ratio("#adadad", "#ffffff"), 4.5)
        css = next(f["content"] for f in STEPS[8]["files"] if f["path"] == "styles.css")
        for colour in ("#ffffff", "#13305c, #8a1c55", "#fff3c4, #ffe08a", "#333333", "#8a1c55", "#9b1c1c", "rgb(34, 34, 34)", "opacity: 0.75"):
            self.assertIn(colour, css)  # the pairs computed are the colours Juan's finished stylesheet sets
    def test_font_lists_end_in_a_generic_family_and_nothing_uses_url(self):
        pt = BASE["performanceTask"]
        for s in STEPS + [{"id": "pt", "files": pt["starterFiles"] + pt["exampleFiles"]}]:
            for f in s["files"]:
                self.assertIsNone(re.search(r"url\(|@font-face", f["content"]), (s["id"], f["path"]))
                for value in re.findall(r"font-family:([^;]+);", f["content"]):
                    self.assertRegex(value.strip(), r"(serif|sans-serif|monospace)$", (s["id"], f["path"]))
    def test_every_value_in_quotes_ckb_094(self):
        for s in STEPS + [{"id": "pt", "files": BASE["performanceTask"]["starterFiles"] + BASE["performanceTask"]["exampleFiles"]}]:
            for f in s["files"]:
                if f["path"].endswith(".html"):
                    self.assertIsNone(re.search(r'<[a-zA-Z][^>]*\s[\w-]+=[^"\s>]', f["content"]), (s["id"], f["path"]))
    def test_never_a_page_check_on_link_or_style_elements(self):
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertIsNone(re.search(r'(^|[\s>+~,])(link|style)(?![\w\-\]])', c["selector"]), (s["id"], c))
    def test_no_src_page_check_on_an_iframe_or_uploaded_media_ckb_086_092(self):
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertFalse(c.get("attribute") == "src", (s["id"], c))
    def test_no_broken_quote_before_an_iframe_ckb_093(self):
        for s in STEPS + [{"id": "pt", "files": BASE["performanceTask"]["starterFiles"] + BASE["performanceTask"]["exampleFiles"]}]:
            for f in s["files"]:
                for m in re.finditer(r"<iframe\b", f["content"]):
                    self.assertEqual(f["content"][:m.start()].count('"') % 2, 0, (s["id"], f["path"]))
    def test_both_thursday_repairs_change_the_page_text(self):
        # CodeRabbit on PR #87: a repair whose only effect is a style cannot be proven by a task's page text.
        for n in (7, 8):
            s = STEPS[n - 1]
            self.assertNotEqual(s["expectedOutput"], s["activity"]["expectedOutput"], s["id"])
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(3)
        good = s["expectedOutput"]; s["expectedOutput"] = good.replace("\nPROJECTS OF JUAN DELA CRUZ\n", "\nProjects of Juan Dela Cruz\n")
        self.fails(d, "Output differs")
        s["expectedOutput"] = s["expectedOutput"].replace("\nProjects of Juan Dela Cruz\n", "\nPROJECTS OF JUAN DELA CRUZ\n"); self.assertEqual(s["expectedOutput"], good); self.passes(d)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
