// Run against a local offline production server; see docs/verification/classroom-drawer-controls.md.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const baseURL = process.env.CODESHARE_BROWSER_URL || "http://127.0.0.1:3016";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname), "use a disposable local server only");
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const output = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
assert.ok(["127.0.0.1", "localhost"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

test("workspace drawers: real offline classroom pointer and keyboard interactions", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = [];
  let classroomId;
  const password = randomUUID();
  const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));
  try {
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `drawer-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Drawer ${role}` } });
      assert.equal(error, null);
      users.push({ ...data.user, role });
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const setup = await browser.newContext({ baseURL });
    assert.equal((await setup.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await setup.request.post("/api/classes", { data: { name: "Drawer browser verification" } });
    assert.equal(created.status(), 201);
    const classroom = await created.json(); classroomId = classroom.id;
    assert.equal((await setup.request.post(`/api/classrooms/${classroomId}/modules`, { data: fixture })).status(), 201);
    await setup.close();
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);

    for (const user of users) {
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1000 }, hasTouch: true, reducedMotion: "no-preference" });
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      assert.equal((await context.request.post("/api/auth/login", { data: { email: user.email, password } })).status(), 200);
      await page.goto("/");
      if (user.role === "teacher") {
        await page.getByRole("button", { name: "Open class", exact: true }).click();
        await page.getByRole("button", { name: "Enter classroom" }).click();
      }
      await page.locator(".classroom-workspace").waitFor();
      const outside = async () => {
        await page.locator(".classroom-workspace").click({ position: { x: 1000, y: 30 } });
      };
      const settled = async (id, open) => {
        await page.waitForFunction(({ id, open }) => {
          const panel = document.getElementById(id);
          return panel?.dataset.open === String(open) && getComputedStyle(panel).visibility === (open ? "visible" : "hidden") && (!open || panel.getBoundingClientRect().width > 0) && !panel.getAnimations().length;
        }, { id, open });
      };

      const slide = async (id, action, open) => {
        await page.evaluate((id) => {
          window.drawerSamples = [];
          const start = performance.now();
          const sample = () => {
            window.drawerSamples.push(document.getElementById(id).getBoundingClientRect().x);
            if (performance.now() - start < 450) requestAnimationFrame(sample);
          }; sample();
        }, id);
        await action(); await settled(id, open);
        const xs = await page.evaluate(() => window.drawerSamples);
        assert.ok(new Set(xs.map((x) => Math.round(x))).size > 2, `${id} ${open ? "opening" : "closing"} must include intermediate positions`);
      };

      for (const id of ["classroom-modules", "classroom-projects", "classroom-chat"]) {
        await t.test(`${user.role}: ${id} opens on hover without focus theft, stays open on leave, and slides closed outside`, async () => {
          const ear = page.locator(`.workspace-rail button[aria-controls="${id}"]`);
          const panel = page.locator(`#${id}`);
          await page.getByRole("textbox", { name: "Java source code editor", exact: true }).focus();
          await slide(id, () => ear.hover(), true);
          assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Java source code editor");
          await page.mouse.move(1000, 90);
          assert.equal(await panel.getAttribute("data-open"), "true");
          await panel.click({ position: { x: 150, y: 12 } });
          assert.equal(await panel.getAttribute("data-open"), "true", "inside click must keep panel open");
          await slide(id, outside, false);
          assert.equal(await panel.getAttribute("inert"), "");
          await ear.focus(); await page.keyboard.press("Enter");
          await settled(id, true);
          await panel.getByRole("button", { name: /^Close / }).focus();
          await page.keyboard.press("Escape"); await settled(id, false);
          await ear.hover(); await settled(id, true);
          await ear.click(); await settled(id, true);
          await ear.click(); await settled(id, false);
        });
      }

      await t.test(`${user.role}: worksheet hover stays open, outside closing preserves pages, Escape restores its ear`, async () => {
        await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').hover();
        await page.locator("#classroom-modules .module-catalog-card").first().getByRole("button").first().click();
        await settled("classroom-worksheet", true);
        await outside(); await settled("classroom-worksheet", false);
        const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
        const draft = (await editor.inputValue()) + "\n// Keep this unsaved edit";
        await editor.fill(draft);
        const ear = page.getByRole("button", { name: "Module", exact: true });
        await slide("classroom-worksheet", () => ear.hover(), true);
        await page.mouse.move(1000, 90);
        assert.equal(await page.locator("#classroom-worksheet").getAttribute("data-open"), "true");
        await page.locator("#classroom-worksheet").getByRole("button", { name: "Next page →", exact: true }).click();
        const pageBefore = await page.locator("#classroom-worksheet .worksheet-paper:not([hidden])").textContent();
        await slide("classroom-worksheet", outside, false);
        await ear.hover(); await settled("classroom-worksheet", true);
        assert.equal(await page.locator("#classroom-worksheet .worksheet-paper:not([hidden])").textContent(), pageBefore);
        assert.equal(await editor.inputValue(), draft, "drawer closing must preserve main-editor edits");
        await page.locator('#classroom-worksheet button[aria-label="Close module worksheet"]').focus();
        await page.keyboard.press("Escape"); await settled("classroom-worksheet", false);
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Module");
        await page.mouse.move(1000, 90);
        await ear.hover(); await settled("classroom-worksheet", true);
        await page.locator("#classroom-worksheet").getByRole("button", { name: /All modules/ }).click();
        await settled("classroom-modules", true);
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close course modules");
        await page.keyboard.press("Escape"); await settled("classroom-modules", false);
        if (user.role === "student") {
          await page.getByRole("button", { name: "Modules", exact: true }).focus();
          await page.keyboard.press("Enter"); await settled("classroom-modules", true);
          assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Close course modules");
          await page.keyboard.press("Escape"); await settled("classroom-modules", false);
        }
      });

      await t.test(`${user.role}: one Module and one Projects ear stay separate and reachable at different screen sizes`, async () => {
        const moduleEar = page.getByRole("button", { name: "Module", exact: true });
        const projectsEar = page.locator('.workspace-rail button[aria-controls="classroom-projects"]');
        for (const [width, height, scale] of [[1500, 1000, 1.15], [942, 895, 1.15], [455, 890, 1.15], [1500, 1000, 1.5]]) {
          await page.setViewportSize({ width, height });
          await page.evaluate((scale) => document.documentElement.style.setProperty("--ui-scale", String(scale)), scale);
          assert.equal(await moduleEar.count(), 1);
          assert.equal(await page.locator('.workspace-rail.rail-left button').count(), 2);
          assert.equal(await page.locator('button.worksheet-ear').count(), 0, "a second worksheet ear must not cover Projects");
          const m = await moduleEar.boundingBox(); const p = await projectsEar.boundingBox();
          assert.ok(m && p && m.y + m.height < p.y, "Module and Projects must not overlap");
          await moduleEar.hover(); await settled("classroom-worksheet", true);
          await page.screenshot({ path: `/tmp/drawer-${user.role}-${width}-${scale}.png` });
          assert.deepEqual(await moduleEar.boundingBox(), m, "the Module ear must stay fixed when the worksheet opens");
          assert.equal(await moduleEar.getAttribute("aria-expanded"), "true");
          await projectsEar.hover(); await settled("classroom-projects", true); await settled("classroom-worksheet", false);
          const projectTitle = user.role === "teacher" ? "Students and projects" : "My projects";
          assert.equal(await page.locator('#classroom-projects .projects-heading b').textContent(), projectTitle);
          await page.locator('#classroom-projects button[aria-label="Close projects"]').click();
          await settled("classroom-projects", false);
          assert.equal(await page.locator('#classroom-worksheet').getAttribute("data-open"), "false", "closing Projects must not reopen a suspended worksheet");
        }
        await page.setViewportSize({ width: 1500, height: 1000 });
        await page.evaluate(() => document.documentElement.style.removeProperty("--ui-scale"));
        await page.mouse.move(1000, 90);
      });

      await t.test(`${user.role}: reduced motion, chat draft and pinned outside closing`, async () => {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const ear = page.locator('.workspace-rail button[aria-controls="classroom-chat"]');
        await ear.hover(); await settled("classroom-chat", true);
        assert.equal(await page.locator("#classroom-chat").evaluate((panel) => getComputedStyle(panel).transitionDuration), "0s");
        await page.locator("#classroom-chat textarea, #classroom-chat input").fill("Keep this unsent draft");
        await page.locator("#classroom-chat .drawer-pin").click();
        await outside(); await settled("classroom-chat", false);
        await ear.hover(); await settled("classroom-chat", true);
        assert.equal(await page.locator("#classroom-chat textarea, #classroom-chat input").inputValue(), "Keep this unsent draft");
        await outside(); await settled("classroom-chat", false);
      });
      await t.test(`${user.role}: touch taps toggle Module, Projects and Chat ears`, async () => {
        for (const id of ["classroom-worksheet", "classroom-projects", "classroom-chat"]) {
          const ear = page.locator(`.workspace-rail button[aria-controls="${id}"]`);
          await ear.tap(); await settled(id, true);
          await ear.tap(); await settled(id, false);
        }
      });
      await t.test(`${user.role}: offline Run code still uses laptop Java after panel interactions`, async () => {
        await page.getByRole("textbox", { name: "Java source code editor", exact: true }).fill('public class Main { public static void main(String[] args) { System.out.println("Drawer offline check"); } }');
        await page.getByRole("button", { name: /Run code/ }).click();
        await page.locator(".console pre").filter({ hasText: "Drawer offline check" }).waitFor();
      });
      await context.close();
    }
  } finally {
    await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
