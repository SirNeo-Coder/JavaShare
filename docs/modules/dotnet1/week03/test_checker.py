"""Regression checks for Resume Week 3 with the teacher's checker (adapted from Resume/Week_02/test_checker.py)."""
import copy, json, re, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_03.codeshare.json").read_text())
STEPS = [b for l in BASE["lessons"] for b in l["blocks"] if b["type"] == "step"]

class CheckerTests(unittest.TestCase):
    def run_check(self, data, execute=True, media=True):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "module.json"; p.write_text(json.dumps(data))
            extra = (["--run"] if execute else []) + (["--media-root", str(HERE / "project_end")] if media else [])
            return subprocess.run([sys.executable, str(HERE / "check_codeshare.py"), str(p)] + extra, capture_output=True, text=True, timeout=300)
    def one_step(self, number):  # the module cut down to the lesson and step with this number
        d = copy.deepcopy(BASE)
        for lesson in d["lessons"]:
            for b in lesson["blocks"]:
                if b["type"] == "step" and b["number"] == number:
                    lesson["blocks"] = [b]; lesson["exitSlip"]["afterStep"] = b["id"]; d["lessons"] = [lesson]
                    return d, b
    def edit(self, step, old, new, path=None):
        f = next(f for f in step["files"] if f["path"] == (path or step["run"]))
        self.assertEqual(f["content"].count(old), 1, old)
        f["content"] = f["content"].replace(old, new)
    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_only_the_index_html_steps_are_media_steps(self):
        media = [s["number"] for s in STEPS if "\nMedia checks:\n" in s["expectedOutput"]]
        self.assertEqual(media, [1, 9]); self.assertEqual([s["number"] for s in STEPS if s["run"] == "index.html"], [1, 9])
        d, _ = self.one_step(1)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
        d, _ = self.one_step(2)
        self.assertEqual(self.run_check(d, media=False).returncode, 0)  # contact.html needs no media
    def test_href_is_not_page_text_but_the_page_check_sees_it(self):
        d, s = self.one_step(1)
        self.edit(s, 'href="projects.html"', 'href="Projects.html"')
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn('Count mismatch: a[href="projects.html"]', r.stdout)
        s["webChecks"] = [c for c in s["webChecks"] if c["selector"] != 'a[href="projects.html"]']
        self.assertEqual(self.run_check(d).returncode, 0)  # same page text: href is not page text
    def test_framed_page_text_is_not_page_text(self):
        d, s = self.one_step(5)
        s["files"].append({"path": "contact.html", "content": "<!doctype html><title>x</title><h1>Words only in the frame</h1>"})
        self.assertEqual(self.run_check(d).returncode, 0)
        self.edit(s, "<h2>Send me a message</h2>", "<h2>Send me a note</h2>")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
    def test_typed_values_and_placeholders_are_not_page_text_labels_are(self):
        d, s = self.one_step(2)
        self.edit(s, 'name="visitor">', 'name="visitor" value="Juan" placeholder="Type your name">')
        self.assertEqual(self.run_check(d).returncode, 0)
        self.edit(s, ">Your name</label>", ">Name</label>")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
    def test_every_option_of_a_select_is_page_text(self):
        d, s = self.one_step(6)
        s["expectedOutput"] = s["expectedOutput"].replace("Art club\n", "")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
    def test_a_missing_quote_swallows_the_heading(self):
        d, s = self.one_step(6)
        self.edit(s, 'href="contact.html">Contact', 'href="contact.html>Contact')
        s["webChecks"] = []
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
        self.assertEqual(STEPS[6]["expectedOutput"].split("\n")[2], "Home | Projects | Your name")  # Step 7 sample
    def test_an_open_textarea_hides_the_button_and_the_page_check_sees_it(self):
        d, s = self.one_step(8)
        self.edit(s, 'rows="4">\n', 'rows="4"></textarea>\n')
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Count mismatch: button", r.stdout)
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
        d, s = self.one_step(3)
        s["expectedOutput"] = s["expectedOutput"].replace("Home | Projects | Contact", "Home Projects Contact")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
        s["expectedOutput"] = s["expectedOutput"].replace("Home Projects Contact", "Home | Projects | Contact")
        self.assertEqual(self.run_check(d).returncode, 0)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
