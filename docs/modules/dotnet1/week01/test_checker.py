"""Regression checks for Resume Week 1 with the teacher's checker (adapted from Week_03/test_checker_week02.py)."""
import copy, json, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_01.codeshare.json").read_text())

class CheckerTests(unittest.TestCase):
    def run_check(self, data, execute=True):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "module.json"; p.write_text(json.dumps(data))
            return subprocess.run([sys.executable, str(HERE / "check_codeshare.py"), str(p)] + (["--run"] if execute else []),
                                  capture_output=True, text=True, timeout=180)
    def one_step(self, number):  # the module cut down to the lesson and step with this number
        d = copy.deepcopy(BASE)
        for lesson in d["lessons"]:
            for b in lesson["blocks"]:
                if b["type"] == "step" and b["number"] == number:
                    lesson["blocks"] = [b]; lesson["exitSlip"]["afterStep"] = b["id"]; d["lessons"] = [lesson]
                    return d, b
    def test_all_nine_samples_pass(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_list_marker_change_keeps_page_text_but_fails_the_page_check(self):
        d, s = self.one_step(2)
        s["files"][0]["content"] = s["files"][0]["content"].replace('<ol type="1"', '<ol type="A"')
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Attribute mismatch: ol type", r.stdout)
        s["webChecks"] = [c for c in s["webChecks"] if c.get("attribute") != "type"]  # same page text: markers are not page text
        self.assertEqual(self.run_check(d).returncode, 0)
    def test_removed_space_in_pre_changes_the_output(self):
        d, s = self.one_step(4)
        s["files"][0]["content"] = s["files"][0]["content"].replace("Monday     Chess", "Monday    Chess")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
    def test_changed_output_fails_then_restored_output_passes(self):
        d, s = self.one_step(6)
        s["expectedOutput"] += " WRONG"
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Output differs", r.stdout)
        s["expectedOutput"] = s["expectedOutput"].removesuffix(" WRONG"); self.assertEqual(self.run_check(d).returncode, 0)
    def test_repaired_comment_fails_the_broken_samples_page_check(self):
        d, s = self.one_step(7)
        s["files"][0]["content"] = s["files"][0]["content"].replace("Week 2 ->", "Week 2 -->")
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertIn("Count mismatch: p", r.stdout)
    def test_duplicate_id_rejected(self):
        d = copy.deepcopy(BASE); d["lessons"][1]["id"] = d["lessons"][0]["id"]; r = self.run_check(d, False)
        self.assertNotEqual(r.returncode, 0); self.assertIn("duplicate id", r.stdout)

if __name__ == "__main__":
    unittest.main(verbosity=2)
