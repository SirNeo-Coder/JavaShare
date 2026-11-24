"""Three-part Week 2 with the teacher's checker: every sample, guided example and own-task answer gives its exact page text.
Run: python3 test_threepart_checker.py"""
import copy, json, subprocess, sys, tempfile, unittest
from pathlib import Path
HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "DotNet1_Week_02.threepart.codeshare.json").read_text())

def steps(module): return [b for lesson in module["lessons"] for b in lesson["blocks"] if b["type"] == "step"]

class ThreePartCheckerTests(unittest.TestCase):
    def run_check(self, data):
        with tempfile.TemporaryDirectory() as temp:
            p = Path(temp) / "module.json"; p.write_text(json.dumps(data))
            return subprocess.run([sys.executable, str(HERE / "check_codeshare.py"), str(p), "--run", "--media-root", str(HERE / "project_end")], capture_output=True, text=True, timeout=300)
    def answers(self, kind):  # each step's sample swapped for its solved page, checked against that part's expected output
        d = copy.deepcopy(BASE)
        for s in steps(d):
            folder = s["id"] if kind == "guided" else s["activity"]["id"]
            s["files"] = [{"path": "index.html", "content": (HERE / "solutions" / folder / "index.html").read_text()}]
            s["expectedOutput"] = s["activity"]["guided"]["expectedOutput"] if kind == "guided" else s["activity"]["expectedOutput"]
            s.pop("webChecks", None)  # page checks belong to the sample only
        return d
    def test_all_nine_samples_pass(self):
        r = self.run_check(BASE); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_all_nine_guided_examples_pass(self):
        r = self.run_check(self.answers("guided")); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_all_nine_own_task_answers_pass(self):
        r = self.run_check(self.answers("own")); self.assertEqual(r.returncode, 0, r.stdout + r.stderr); self.assertEqual(r.stdout.count("PASS "), 9)
    def test_a_guided_page_does_not_pass_its_own_task(self):
        d = self.answers("guided")
        for s in steps(d): s["expectedOutput"] = s["activity"]["expectedOutput"]
        r = self.run_check(d); self.assertNotEqual(r.returncode, 0); self.assertEqual(r.stdout.count("PASS "), 0, r.stdout)

if __name__ == "__main__":
    unittest.main()
