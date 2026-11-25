"""Three-part Week 3 with the teacher's checker: every sample, guided example and own-task answer gives its exact page text.
The checker builds the student's folder step by step, so each step runs with the other pages left by the previous steps
(in the answer runs: the previous steps' guided or own-task pages), as in CodeShare, where a step loads only its own pages.
Run: python3 test_threepart_checker.py"""
import copy, json, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_03.threepart.codeshare.json").read_text())

def steps(module): return [b for lesson in module["lessons"] for b in lesson["blocks"] if b["type"] == "step"]

class ThreePartCheckerTests(unittest.TestCase):
    def run_check(self, data):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "module.json"; p.write_text(json.dumps(data))
            return subprocess.run([sys.executable, str(HERE / "check_codeshare.py"), str(p), "--run", "--media-root", str(HERE / "project_end")], capture_output=True, text=True, timeout=300)
    def answers(self, kind, only_run_page=False):  # each step's run page swapped for its solved page, checked against that part's expected output
        d = copy.deepcopy(BASE)
        for s in steps(d):
            folder = s["id"] if kind == "guided" else s["activity"]["id"]
            solved = {"path": s["run"], "content": (HERE / "solutions" / folder / s["run"]).read_text()}
            s["files"] = [solved] if only_run_page else [solved if f["path"] == s["run"] else f for f in s["files"]]
            s["expectedOutput"] = s["activity"]["guided"]["expectedOutput"] if kind == "guided" else s["activity"]["expectedOutput"]
            s.pop("webChecks", None)  # page checks belong to the sample only
        return d
    def test_all_nine_samples_pass(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_all_nine_guided_examples_pass(self):
        r = self.run_check(self.answers("guided")); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_all_nine_own_task_answers_pass(self):
        r = self.run_check(self.answers("own")); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_own_answers_pass_with_the_other_pages_from_the_previous_own_tasks(self):
        # Only the run page is put each time; every other page is whatever the previous steps' own-task answers left
        # (Step 5's frame shows Step 4's own contact.html; Step 9's projects and contact pages are Steps 5 and 8's).
        r = self.run_check(self.answers("own", only_run_page=True)); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_a_guided_page_does_not_pass_its_own_task(self):
        d = self.answers("guided")
        for s in steps(d): s["expectedOutput"] = s["activity"]["expectedOutput"]
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertEqual(r.stdout.count("PASS "), 0, r.stdout)

if __name__ == "__main__":
    unittest.main()
