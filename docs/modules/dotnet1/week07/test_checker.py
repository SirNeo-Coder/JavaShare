"""Regression checks for Resume Week 7 with the teacher's checker (adapted from Resume/Week_06/test_checker.py).
Every claim in the module's tables, practice notes, problem guide and the DLL's Predict/Debug lines that the page text or a
page check can show is run here. On-screen places (which corner, which box is on top, what wraps) were measured with real
runs in both the checker and CodeShare's page window (Verification.md); a checker cannot measure them."""
import copy, importlib.util, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_07.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
_spec = importlib.util.spec_from_file_location("content_r07", HERE.parent.parent / "revision_tools/resume_w07/content.py")
CONTENT = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(CONTENT)
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
    def same_output(self, number, old, new, checks, path="styles.css"):  # the edit changes no page text; its page checks read `checks`
        d, s = self.one_step(number); self.edit(s, old, new, path); s["webChecks"] = checks; self.passes(d)
    def output_of(self, number, old, new, path="styles.css"):  # the page text after an edit, read from the checker's failure
        d, s = self.one_step(number); self.edit(s, old, new, path); s["webChecks"] = []; s["expectedOutput"] = "?"
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0)
        return r.stdout

    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [2, 4, 5, 6, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [2, 4, 5, 6, 9])
        d, _ = self.one_step(2)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        d, _ = self.one_step(1)
        self.assertEqual(self.run_check(d, media=False).returncode, 0)  # projects.html needs no media
    def test_every_gallery_picture_has_its_media_line(self):
        s = STEPS[8]
        for name in ("science_poster", "comic_strip", "honors_certificate", "tree_planting"):
            self.assertIn("\nimages/%s.svg: image decoded" % name, s["expectedOutput"])
            self.assertTrue((HERE / ("project_end/images/%s.svg" % name)).is_file())
        self.assertIn("images/honors_certificate.svg: image decoded", STEPS[1]["activity"]["expectedOutput"])  # a task adds a picture
        self.assertNotIn("images/honors_certificate.svg", STEPS[1]["expectedOutput"])
    def test_pages_change_only_by_the_ribbon_the_gallery_and_the_picture_class(self):
        start = {f["path"]: f["content"] for f in BASE["starterFiles"]}
        allowed = {CONTENT.I2, CONTENT.I4, CONTENT.I5, CONTENT.I6, CONTENT.P1, CONTENT.C0}
        for s in STEPS:
            for f in s["files"]:
                if f["path"].endswith(".html"): self.assertIn(f["content"], allowed, (s["id"], f["path"]))
        self.assertEqual(CONTENT.C0, start["contact.html"])
        self.assertEqual(CONTENT.P1, start["projects.html"].replace("Juan Dela Cruz</h1>", 'Juan Dela Cruz <span class="ribbon">ICT strand</span></h1>'))
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
        d, s = self.one_step(1, starter=False)
        s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]
        self.fails(d, "Style mismatch: .ribbon position")
    def test_absolute_and_float_put_words_on_their_own_line(self):
        # Position table, Step 1 and Step 3 check-yourself, Tuesday practice (a), (d), Monday try table row 4, DLL Monday Predict.
        self.assertIn("\nPROJECTS OF JUAN DELA CRUZ\nICT STRAND\n", STEPS[0]["expectedOutput"])
        self.assertIn("\nScience poster: Saving water at home\nSOLO WORK\n", STEPS[2]["expectedOutput"])
        self.assertIn("\nOpen to group projects.\nSample resume for practice only.\n", STEPS[3]["activity"]["expectedOutput"])
        self.assertIn("\\nPROJECTS OF JUAN DELA CRUZ ICT STRAND\\n", self.output_of(1, "  position: absolute;\n  top: 8px;", "  position: relative;\n  top: 8px;"))
        self.assertIn("\\nScience poster: Saving water at home\\nSOLO WORK\\n", self.output_of(3, "  float: right;\n", "  position: absolute;\n"))
    def test_relative_sticky_and_static_keep_words_in_their_line(self):
        out = self.output_of(1, "  position: absolute;\n  top: 8px;", "  position: sticky;\n  top: 8px;")
        self.assertIn("\\nPROJECTS OF JUAN DELA CRUZ ICT STRAND\\n", out)
        self.assertIn("Science poster: Saving water at home SOLO WORK", STEPS[0]["expectedOutput"])
    def test_offsets_read_as_written_and_z_index_reads_even_when_static(self):
        # Offsets table and Monday practice (a)-(c): top as written, em in px, z-index on a static box read as written.
        d, s = self.one_step(1)
        s["webChecks"] = [st(".ribbon", "top", "8px"), st(".ribbon", "right", "8px"), st("h1", "font-size", "32px"), st(".ribbon", "font-size", "12px"),
                          st(".ribbon", "display", "block"), st("nav", "position", "static"), st("nav", "z-index", "auto")]
        self.passes(d)
        self.same_output(3, "  z-index: 2;", "  z-index: 5;", [st("nav", "z-index", "5"), st("nav", "top", "0px")])  # Tuesday practice (c)
        joined = STEPS[0]["expectedOutput"].replace("\nPROJECTS OF JUAN DELA CRUZ\nICT STRAND\n", "\nPROJECTS OF JUAN DELA CRUZ ICT STRAND\n")
        d, s = self.one_step(1)  # offsets table row 3: top: 1em on a relative span in the 32px h1
        self.edit(s, "  position: absolute;\n  top: 8px;\n  right: 8px;\n", "  position: relative;\n  top: 1em;\n"); self.edit(s, "  font-size: 12px;\n  color: #222222;", "  color: #222222;")
        s["webChecks"] = [st(".ribbon", "top", "32px"), st(".ribbon", "position", "relative")]; s["expectedOutput"] = joined; self.passes(d)
        d, s = self.one_step(1)  # offsets table row 4 and Monday practice (a): z-index on a static span reads as written
        self.edit(s, "  position: absolute;\n", "  position: static;\n"); self.edit(s, "  z-index: 1;\n  padding", "  z-index: 3;\n  padding")
        s["webChecks"] = [st(".ribbon", "z-index", "3"), st(".ribbon", "top", "8px")]  # read as written, no effect; s["expectedOutput"] = joined; self.passes(d)
    def test_monday_try_table_rows_change_no_page_text(self):
        self.same_output(1, "  line-height: 2;\n  position: relative;\n}", "  line-height: 2;\n}", [st("h1", "position", "static"), st(".ribbon", "position", "absolute")])
        self.same_output(1, "  top: 8px;\n  right: 8px;", "  bottom: 8px;\n  right: 8px;", [st(".ribbon", "bottom", "8px")])
        self.same_output(1, "  z-index: 1;\n  padding", "  z-index: -1;\n  padding", [st(".ribbon", "z-index", "-1")])
        self.same_output(1, "  top: 8px;\n  right: 8px;", "  top: 8px;\n  left: 8px;", [st(".ribbon", "left", "8px")])  # DLL Friday Predict
    def test_float_and_clear_change_no_page_text_on_pictures(self):
        self.same_output(4, "  margin-top: 1.5em;\n  clear: both;\n", "  margin-top: 1.5em;\n", [st("h2", "clear", "none"), st(".profile", "float", "left")])
        self.same_output(2, "  margin-top: 1.5em;\n  clear: both;\n", "  margin-top: 1.5em;\n", [st("h2", "clear", "none")])  # DLL Tuesday Predict
        self.same_output(5, "  width: 160px;\n  height: 110px;", "  width: 120px;\n  height: 110px;", [st(".gallery img", "height", "110px")])  # Wed practice (c)
        self.same_output(4, '<img class="profile"', '<img class="profile" style="float: right;"', [st(".profile", "float", "right")], "index.html")
    def test_captions_are_page_text_and_alt_is_not(self):
        self.same_output(5, 'alt="Juan\'s certificate for finishing Grade 10 with honors"', 'alt="A certificate"', [], "index.html")  # Wed practice (b)
        d, s = self.one_step(5); self.edit(s, "<figcaption>Certificate: With honors, Grade 10</figcaption>", "<figcaption>Certificate</figcaption>", "index.html")
        s["webChecks"] = []; self.fails(d, "Output differs")  # Wed practice (a)
        self.assertIn("\nCertificate: With honors, Grade 10\n", STEPS[4]["expectedOutput"])
    def test_a_tag_that_is_not_positioned_leaves_a_space(self):
        # Wednesday practice (d) and DLL Thursday Predict: New joins the picture's line and gains a space after it.
        self.assertIn("\nNew\nTree planting with the science club\n", STEPS[5]["expectedOutput"])
        self.assertIn("\\nNew \\nTree planting with the science club\\n", self.output_of(6, ".tag {\n  position: absolute;\n", ".tag {\n"))
    def test_a_missing_semicolon_skips_position_and_top(self):
        d, s = self.one_step(7)
        self.edit(s, "  position: absolute\n", "  position: absolute;\n")
        self.fails(d, "Style mismatch: .ribbon position: absolute")
        s["webChecks"] = [st(".ribbon", "position", "absolute"), st(".ribbon", "top", "8px")]
        s["expectedOutput"] = STEPS[6]["activity"]["expectedOutput"]; self.passes(d)
        self.assertIn("\nPROJECTS OF JUAN DELA CRUZ ICT STRAND\n", STEPS[6]["expectedOutput"])
    def test_a_misspelt_float_value_is_skipped(self):
        d, s = self.one_step(8)
        self.edit(s, "  float: rigth;\n", "  float: right;\n")
        self.fails(d, "Style mismatch: .badge float: right")
        s["webChecks"] = [st(".badge", "float", "right")]; s["expectedOutput"] = STEPS[7]["activity"]["expectedOutput"]; self.passes(d)
        self.same_output(8, "  float: rigth;\n", "  float: center;\n", [st(".badge", "float", "none")])  # Thursday practice (b), DLL Thursday Quick check
    def test_both_thursday_repairs_change_the_page_text(self):
        for n in (7, 8):
            s = STEPS[n - 1]
            self.assertNotEqual(s["expectedOutput"], s["activity"]["expectedOutput"], s["id"])
    def test_no_page_check_on_a_value_that_follows_the_window_or_the_zoom(self):
        # An unset side, fixed and sticky offsets, % and auto follow the window; border widths follow the zoom (CKB-097).
        for s in STEPS:
            css = next((f["content"] for f in s["files"] if f["path"] == "styles.css"), "")
            for c in s.get("webChecks", []):
                st_ = c.get("style", "")
                self.assertIsNone(re.search(r"border(-\w+)?-width|^border(-\w+)?$|outline", st_), (s["id"], c))
                if st_ in ("top", "right", "bottom", "left", "width", "height") and c["value"] != "auto":  # auto: a side not set
                    self.assertNotIn(c["selector"], ("nav",), (s["id"], c))  # never a sticky offset
                    self.assertIn("%s: %s;" % (st_, c["value"]), css, (s["id"], c))  # only a side or size set in px
            self.assertNotRegex(css, r"\d%|: auto|position: fixed", s["id"])
    def test_no_page_check_on_a_link_state_link_style_or_src(self):
        for s in STEPS:
            for c in s.get("webChecks", []):
                self.assertIsNone(re.search(r":(hover|visited|focus|active)\b", c["selector"]), (s["id"], c))
                self.assertIsNone(re.search(r'(^|[\s>+~,])(link|style)(?![\w\-\]])', c["selector"]), (s["id"], c))
                self.assertFalse(c.get("attribute") == "src", (s["id"], c))  # CKB-086, CKB-092
    def test_every_value_in_quotes_each_li_on_its_own_line_no_url(self):
        for sid, f in ALL_FILES:
            if f["path"].endswith(".html"):
                self.assertIsNone(re.search(r'<[a-zA-Z][^>]*\s[\w-]+=[^"\s>]', f["content"]), (sid, f["path"]))  # CKB-094
                for m in re.finditer(r"<iframe\b", f["content"]):
                    self.assertEqual(f["content"][:m.start()].count('"') % 2, 0, (sid, f["path"]))  # CKB-093
            self.assertNotIn("</li><li>", f["content"], (sid, f["path"]))
            self.assertIsNone(re.search(r"url\(|@font-face", f["content"]), (sid, f["path"]))
    def test_every_contrast_pair_and_border_reaches_its_minimum(self):
        self.assertTrue(all(r >= 4.5 for _, _, _, r in CONTENT.CONTRAST), CONTENT.CONTRAST)
        self.assertTrue(all(r >= 3 for _, r in CONTENT.BORDER_RATIOS), CONTENT.BORDER_RATIOS)
        self.assertAlmostEqual(CONTENT.ratio("#222222", "#fff3c4"), 14.2958, 3); self.assertAlmostEqual(CONTENT.ratio("#ffffff", "#8a1c55"), 8.83, 2)
        css = next(f["content"] for f in STEPS[8]["files"] if f["path"] == "styles.css")
        for colour in ("#222222", "#fff3c4", "#ffffff", "#8a1c55", "#555555"):
            self.assertIn(colour, css)
    def test_personal_starter_has_a_gallery_and_a_ribbon_and_names_pictures_to_add(self):
        start = {f["path"]: f["content"] for f in PT["starterFiles"]}
        self.assertIn('<span class="ribbon">Your strand</span>', start["index.html"])
        self.assertEqual(start["index.html"].count("<figcaption>"), 2)
        for word in ("position: relative;", "position: absolute;", "float: left;", "clear: both;", "z-index: 1;"):
            self.assertIn(word, start["styles.css"])
        self.assertEqual(sorted(re.findall(r'src="(images/[^"]+)"', start["index.html"])), sorted(CONTENT.STARTER_BROKEN))
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(1)
        good = s["expectedOutput"]; s["expectedOutput"] = good.replace("\nICT STRAND\n", " ICT STRAND\n")
        self.fails(d, "Output differs")
        s["expectedOutput"] = good; self.passes(d)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
