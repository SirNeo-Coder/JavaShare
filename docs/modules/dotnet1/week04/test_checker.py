"""Regression checks for Resume Week 4 with the teacher's checker (adapted from Resume/Week_03/test_checker.py)."""
import copy, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_04.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]
NAVY, GREY, GREEN, BLACK = "rgb(19, 48, 92)", "rgb(51, 51, 51)", "rgb(46, 125, 50)", "rgb(0, 0, 0)"
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
    def edit(self, step, old, new, path=None):
        f = next(f for f in step["files"] if f["path"] == (path or step["run"]))
        self.assertEqual(f["content"].count(old), 1, old)
        f["content"] = f["content"].replace(old, new)
    def passes(self, d):
        r = self.run_check(d); self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [1, 3, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 3, 9])
        d, _ = self.one_step(1)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        d, _ = self.one_step(2)
        self.assertEqual(self.run_check(d, media=False).returncode, 0)  # contact.html needs no media
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
        d, s = self.one_step(5, starter=False)
        s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Style mismatch: .badge background-color", r.stdout)
    def test_colours_are_not_page_text_but_the_page_check_sees_them(self):
        d, s = self.one_step(1)
        self.edit(s, "color: #13305c;", "color: #2e7d32;")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Style mismatch: h1 color: " + GREEN, r.stdout)
        s["webChecks"] = []; self.passes(d)  # the same page text
    def test_a_deleted_colon_loses_that_declaration_only(self):
        d, s = self.one_step(1)
        self.edit(s, "color: #13305c;", "color #13305c;")
        s["webChecks"] = [st("h1", "color", BLACK), st("h2", "color", "rgb(138, 28, 85)")]; self.passes(d)
        d, s = self.one_step(6)
        self.edit(s, "bold;\n  text-transform: uppercase", "bold;\n  text-transform uppercase", "styles.css")
        s["expectedOutput"] = s["expectedOutput"].replace("HOME | PROJECTS | CONTACT", "Home | Projects | Contact")
        s["webChecks"] = [st("nav", "font-weight", "700"), st("nav", "text-transform", "none")]; self.passes(d)
    def test_text_transform_and_display_none_change_page_text(self):
        d, s = self.one_step(3)
        self.edit(s, "      text-transform: uppercase;\n", "")
        s["webChecks"] = []
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
        d, s = self.one_step(2)
        self.edit(s, 'font-weight: bold;">', 'font-weight: bold; display: none;">')
        s["expectedOutput"] = s["expectedOutput"].replace("This form is a prototype: it sends nowhere.\n", "")
        s["webChecks"] = []; self.passes(d)
    def test_button_text_transform_is_page_text_option_text_is_not(self):
        d, s = self.one_step(6)
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] += "option, button {\n  text-transform: uppercase;\n}\n"
        s["expectedOutput"] = s["expectedOutput"].replace("Send message", "SEND MESSAGE"); self.passes(d)
    def test_inline_beats_internal_and_a_later_rule_wins(self):
        d, s = self.one_step(3)
        self.edit(s, "  </style>", "    h2 {\n      color: #13305c;\n    }\n  </style>")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Style mismatch: h2 color: " + NAVY, r.stdout)
        s["webChecks"] = [st("h2", "color", NAVY), st("h2[style]", "color", GREEN)]; self.passes(d)
        d, s = self.one_step(4)  # a style element after the link line is later, so it wins; before the link line it loses
        page = '  <style>\n    h1 {\n      color: #2e7d32;\n    }\n  </style>\n'
        self.edit(s, '<link rel="stylesheet" href="styles.css">\n', '<link rel="stylesheet" href="styles.css">\n' + page)
        s["webChecks"] = [st("h1", "color", GREEN)]; self.passes(d)
        d, s = self.one_step(4)
        self.edit(s, '  <link rel="stylesheet" href="styles.css">\n', page + '  <link rel="stylesheet" href="styles.css">\n')
        s["webChecks"] = [st("h1", "color", NAVY)]; self.passes(d)
    def test_id_beats_class_and_class_beats_element(self):
        d, s = self.one_step(6)
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] += ".note {\n  color: #2e7d32;\n}\n"
        self.edit(s, '<p id="form-note">', '<p id="form-note" class="note">')
        self.edit(s, "    <p>\n      <label for=\"visitor\">", "    <p class=\"note\">\n      <label for=\"visitor\">")
        s["webChecks"] = [st("#form-note", "color", "rgb(155, 28, 28)"), st("form p", "color", GREEN)]; self.passes(d)
    def test_a_missing_semicolon_skips_two_declarations(self):
        self.assertEqual(STEPS[6]["expectedOutput"].split("\n")[2], "Home | Projects | Contact")  # Step 7 sample
        d, s = self.one_step(7)
        self.edit(s, "bold\n  text-transform", "bold;\n  text-transform", "styles.css")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Style mismatch: nav font-weight: 700", r.stdout)
    def test_a_missing_brace_stops_every_later_rule(self):
        d, s = self.one_step(6)
        self.edit(s, "#8a1c55;\n}\n", "#8a1c55;\n\n", "styles.css")
        s["expectedOutput"] = s["expectedOutput"].replace("HOME | PROJECTS | CONTACT", "Home | Projects | Contact")
        s["webChecks"] = [st("#form-note", "color", BLACK), st("h1", "color", NAVY)]; self.passes(d)
        d, s = self.one_step(6)  # the last closing brace missing changes nothing
        f = next(f for f in s["files"] if f["path"] == "styles.css"); f["content"] = f["content"].rstrip("\n}")
        self.passes(d)
    def test_misspelt_or_capitalised_class_or_id_matches_nothing(self):
        self.assertIn("group work", STEPS[7]["expectedOutput"])  # Step 8 sample: bagde
        d, s = self.one_step(8)
        self.edit(s, 'class="bagde"', 'class="Badge"')
        self.passes(d)  # a capital letter matches nothing either
        d, s = self.one_step(5)
        self.edit(s, ".badge {", ".Badge {", "styles.css")
        s["expectedOutput"] = s["expectedOutput"].replace("SOLO WORK", "solo work").replace("GROUP WORK", "group work")
        s["webChecks"] = [st(".badge", "text-transform", "none")]; self.passes(d)
        d, s = self.one_step(6)
        self.edit(s, "#form-note {", "#from-note {", "styles.css")
        s["webChecks"] = [st("#form-note", "color", GREY), st("#form-note", "font-weight", "400")]; self.passes(d)
    def test_a_wrong_or_missing_stylesheet_leaves_the_page_plain_with_no_error(self):
        for wrong in ('href="style.css"', 'href="Styles.css"', None):
            d, s = self.one_step(4)
            if wrong: self.edit(s, 'href="styles.css"', wrong)
            else: s["files"] = [f for f in s["files"] if f["path"] != "styles.css"]; d["starterFiles"] = []
            s["expectedOutput"] = s["expectedOutput"].replace("HOME | PROJECTS | CONTACT", "Home | Projects | Contact")
            s["webChecks"] = [st("h1", "color", BLACK), st("body", "font-family", '"Times New Roman"')]
            with self.subTest(wrong=wrong): self.passes(d)
    def test_every_value_in_quotes_ckb_094(self):
        # CodeShare inlines a link line only when its href is in quotes (CKB-094); a browser accepts both.
        for s in STEPS + [{"id": "pt", "files": BASE["performanceTask"]["starterFiles"] + BASE["performanceTask"]["exampleFiles"]}]:
            for f in s["files"]:
                if f["path"].endswith(".html"):
                    self.assertIsNone(re.search(r'<[a-zA-Z][^>]*\s[\w-]+=[^"\s>]', f["content"]), (s["id"], f["path"]))
    def test_never_a_page_check_on_link_or_style_elements(self):
        # CodeShare turns the link line into a style element, so their counts differ from the teacher's checker.
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
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(5)
        s["expectedOutput"] = s["expectedOutput"].replace("GROUP WORK", "group work")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
        s["expectedOutput"] = s["expectedOutput"].replace("group work", "GROUP WORK"); self.passes(d)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
