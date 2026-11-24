"""Regression checks for Resume Week 2 with the teacher's checker (adapted from Resume/Week_01/test_checker.py)."""
import copy, json, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_02.codeshare.json").read_text())

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
    def edit(self, step, old, new):
        code = step["files"][0]["content"]; self.assertEqual(code.count(old), 1, old)
        step["files"][0]["content"] = code.replace(old, new)
    def test_all_nine_samples_pass_with_juans_media(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_without_the_media_files_a_media_step_fails(self):
        d, _ = self.one_step(1)
        r = self.run_check(d, media=False); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.svg", r.stdout)
    def test_a_wrong_file_name_not_listed_as_broken_fails(self):
        d, s = self.one_step(1)
        self.edit(s, "images/juan_profile.svg", "images/juan_profile.png")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Media state mismatch: images/juan_profile.png", r.stdout)
    def test_repairing_a_file_listed_as_broken_fails_ckb_084(self):
        d, s = self.one_step(7)
        self.edit(s, "images/Juan_Profile.svg", "images/juan_profile.svg")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Attribute mismatch: img src", r.stdout)
        s["webChecks"] = [c for c in s["webChecks"] if c["selector"] != "img"]
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Expected media element absent: images/Juan_Profile.svg", r.stdout)
    def test_colspan_change_keeps_page_text_but_fails_the_page_check(self):
        d, s = self.one_step(5)
        self.edit(s, 'colspan="3"', 'colspan="1"')
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Attribute mismatch: td[colspan] colspan", r.stdout)
        s["webChecks"] = [c for c in s["webChecks"] if c.get("attribute") != "colspan"]  # same page text: spans are not page text
        self.assertEqual(self.run_check(d).returncode, 0)
    def test_row_without_td_moves_its_words_out_of_the_table(self):
        d, s = self.one_step(2)
        self.edit(s, "        <td>Junior high</td>\n", "        Junior high\n")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(6)
        s["expectedOutput"] = s["expectedOutput"].replace("Computer\tTyping documents\tGood", "Computer Typing documents Good")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
        s["expectedOutput"] = s["expectedOutput"].replace("Computer Typing documents Good", "Computer\tTyping documents\tGood")
        self.assertEqual(self.run_check(d).returncode, 0)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
