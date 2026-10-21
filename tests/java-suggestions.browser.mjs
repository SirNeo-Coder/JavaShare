// Run against a disposable local production classroom, never a hosted service.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
const baseURL = process.env.CODESHARE_BROWSER_URL || 'http://127.0.0.1:3016';
assert.ok(['127.0.0.1','localhost'].includes(new URL(baseURL).hostname));
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || 'playwright');
const raw = execFileSync('npx',['--no-install','supabase','status','-o','env'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
const local = Object.fromEntries(raw.split('\n').map(line=>line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map(m=>[m[1],m[2]]));
assert.ok(['127.0.0.1','localhost'].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL,local.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const fixture = JSON.parse(readFileSync(new URL('./fixtures/sample-module.codeshare.json',import.meta.url),'utf8'));

test('Java suggestions: real classroom, module and personal editors', async t => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  const users=[]; let classroomId;
  const password=randomUUID();
  try {
    for (const role of ['teacher','student']) {
      const {data,error}=await admin.auth.admin.createUser({email:`suggest-${randomUUID()}@example.test`,password,email_confirm:true,user_metadata:{name:`Suggestion ${role}`}});
      assert.equal(error,null); users.push({...data.user,role});
      assert.equal((await admin.from('profiles').update({role}).eq('id',data.user.id)).error,null);
    }
    const contexts=[];
    for (const user of users) {
      const context=await browser.newContext({baseURL,viewport:{width:1500,height:1000},hasTouch:true}); contexts.push(context);
      assert.equal((await context.request.post('/api/auth/login',{data:{email:user.email,password}})).status(),200);
    }
    const created=await contexts[0].request.post('/api/classes',{data:{name:'Disposable suggestions classroom'}});
    assert.equal(created.status(),201); classroomId=(await created.json()).id;
    assert.equal((await contexts[0].request.post(`/api/classrooms/${classroomId}/modules`,{data:fixture})).status(),201);
    assert.equal((await admin.from('classroom_members').insert({classroom_id:classroomId,user_id:users[1].id})).error,null);
    const pages=[]; const errors=[];
    for (let i=0;i<users.length;i++) {
      const page=await contexts[i].newPage(); pages.push(page); page.setDefaultTimeout(7000);
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto('/');
      if (users[i].role==='teacher') { await page.getByRole('button',{name:'Open class',exact:true}).click(); await page.getByRole('button',{name:'Enter classroom'}).click(); }
      await page.locator('.classroom-workspace').waitFor();
      const editor=page.getByRole('textbox',{name:'Java source code editor',exact:true});
      const options=page.getByRole('listbox',{name:'Java code suggestions'});
      const type=async text=>{await editor.fill(''); await editor.pressSequentially(text);};
      await t.test(`${users[i].role}: typing, arrows, Enter, Escape, Tab and pointer insertion`,async()=>{
        await type('Sys'); await options.waitFor();
        assert.equal(await options.getByRole('option',{name:'System',exact:true}).getAttribute('aria-selected'),'true');
        await editor.press('ArrowDown');
        assert.equal(await options.getByRole('option',{name:'System.out.println(…)',exact:true}).getAttribute('aria-selected'),'true');
        await editor.press('Enter'); assert.equal(await editor.inputValue(),'System.out.println();');
        assert.equal(await editor.evaluate(el=>el.selectionStart),19);
        await editor.pressSequentially('"Suggestion check"');
        assert.equal(await editor.inputValue(),'System.out.println("Suggestion check");');
        await type('Sys'); await editor.press('Escape'); assert.equal(await options.count(),0);
        await editor.press('Enter'); assert.equal(await editor.inputValue(),'Sys\n');
        await type('pu'); await editor.press('Tab'); assert.equal(await editor.inputValue(),'pu    ');
        await type('System.out.'); await options.getByRole('option',{name:'System.out.print(…)',exact:true}).click();
        assert.equal(await editor.inputValue(),'System.out.print();'); assert.equal(await editor.evaluate(el=>el===document.activeElement),true);
      });
      await t.test(`${users[i].role}: names, comments, selection, composition, scrolling and blur`,async()=>{
        await editor.fill('int capacity;\nca'); await editor.press('p');
        await options.getByRole('option',{name:'capacity',exact:true}).click(); assert.equal(await editor.inputValue(),'int capacity;\ncapacity');
        await type('// Sys'); assert.equal(await options.count(),0);
        await type('"Sys'); assert.equal(await options.count(),0);
        await type('Sys'); await editor.press('Shift+ArrowLeft'); assert.equal(await options.count(),0);
        await type('Sys'); await editor.dispatchEvent('compositionstart'); assert.equal(await options.count(),0);
        await editor.dispatchEvent('compositionend');
        await type('Sys'); await editor.dispatchEvent('scroll'); await options.waitFor({state:'hidden'});
        await type('Sys'); await page.getByRole('button',{name:/Run code/}).focus(); assert.equal(await options.count(),0);
      });
      await t.test(`${users[i].role}: phone and enlarged UI keep suggestions visible and tappable`,async()=>{
        await page.setViewportSize({width:455,height:890}); await page.evaluate(()=>document.documentElement.style.setProperty('--ui-scale','1.5'));
        await type('Sys'); await options.waitFor();
        const bounds=await options.boundingBox(); assert.ok(bounds && bounds.x>=0 && bounds.x+bounds.width<=455);
        await page.screenshot({path:`/tmp/suggestions-${users[i].role}-phone.png`});
        await options.getByRole('option',{name:'System',exact:true}).tap(); assert.equal(await editor.inputValue(),'System');
        await page.setViewportSize({width:1500,height:1000}); await page.evaluate(()=>document.documentElement.style.removeProperty('--ui-scale'));
      });
      await t.test(`${users[i].role}: accepted suggestion runs with laptop Java offline`,async()=>{
        await editor.fill('public class Main { public static void main(String[] args) {\n\n} }');
        await editor.evaluate(el=>{el.focus();const at=el.value.indexOf('\n')+1;el.setSelectionRange(at,at);});
        await editor.pressSequentially('Sys'); await options.getByRole('option',{name:'System.out.println(…)',exact:true}).click();
        await editor.pressSequentially('"Suggestion offline check"'); await editor.press('Escape');
        assert.match(await editor.inputValue(), /System\.out\.println\("Suggestion offline check"\);/);
        await page.getByRole('button',{name:/Run code/}).click();
        try { await page.locator('.console pre').filter({hasText:'Suggestion offline check'}).waitFor({timeout:15000}); } catch(error) { console.log('RUN DEBUG', await editor.inputValue(), await page.locator('.console').innerText()); throw error; }
      });
    }
    const [teacher,student]=pages;
    await t.test('teacher: read-only student source stays unchanged and Tab leaves the editor (CKB-020)',async()=>{
      await teacher.reload(); await teacher.getByRole('button',{name:'Open class',exact:true}).click(); await teacher.getByRole('button',{name:'Enter classroom'}).click();
      await teacher.locator('.workspace-rail button[aria-controls="classroom-projects"]').hover();
      await teacher.locator('#classroom-projects .team-select').filter({hasText:'Suggestion student'}).click();
      await teacher.locator('.classroom-workspace').click({position:{x:1000,y:30}});
      const editor=teacher.getByRole('textbox',{name:'Java source code editor',exact:true});
      assert.equal(await editor.getAttribute('readonly'),''); const before=await editor.inputValue();
      await editor.focus(); await editor.press('S'); await editor.press('y'); assert.equal(await editor.inputValue(),before);
      assert.equal(await teacher.getByRole('listbox',{name:'Java code suggestions'}).count(),0);
      await editor.press('Tab'); assert.equal(await editor.evaluate(el=>el===document.activeElement),false);
      await editor.focus(); await editor.press('Shift+Tab'); assert.equal(await editor.evaluate(el=>el===document.activeElement),false);
    });
    await t.test('student: module and personal projects both accept suggestions without submitting',async()=>{
      const editor=student.getByRole('textbox',{name:'Java source code editor',exact:true});
      await student.locator('.workspace-rail button[aria-controls="classroom-modules"]').hover();
      await student.locator('#classroom-modules .module-catalog-card').first().getByRole('button').first().click();
      const worksheet=student.locator('#classroom-worksheet');
      await worksheet.locator('article:not([hidden])').getByRole('button',{name:'Work in code editor',exact:true}).click();
      await student.waitForFunction(()=>document.getElementById('classroom-worksheet')?.dataset.open==='false' && !document.getElementById('classroom-worksheet').getAnimations().length);
      await editor.click();
      await editor.fill(''); await editor.pressSequentially('Sys');
      await student.getByRole('option',{name:'System.out.println(…)',exact:true}).click();
      assert.equal(await editor.inputValue(),'System.out.println();');
      await Promise.all([student.waitForResponse(response=>response.request().method()==='PUT' && response.url().includes('/progress/')),student.getByRole('button',{name:'Save work',exact:true}).click()]);
      const path=`/api/classrooms/${classroomId}/modules/${fixture.id}/progress`;
      const saved=await (await contexts[1].request.get(path)).json();
      assert.equal(saved.projectFiles[0].content,'System.out.println();'); assert.deepEqual(saved.stepStates,{});
      // Only test setup: open personal work by seeding completed fixture lessons in local Supabase.
      const completed=Object.fromEntries(fixture.lessons.flatMap(lesson=>lesson.blocks).filter(block=>block.type==='step').map(step=>[step.id,'pass']));
      assert.equal((await admin.from('module_progress').update({step_states:completed}).eq('student_id',users[1].id).eq('classroom_id',classroomId).eq('module_id',fixture.id)).error,null);
      await student.locator('.workspace-rail button[aria-controls="classroom-projects"]').hover();
      await student.locator('#classroom-projects').getByRole('button',{name:'Personal performance-task project',exact:true}).click();
      await student.locator('.file-tabs[aria-label="Personal project files"]').waitFor();
      await student.locator('.classroom-workspace').click({position:{x:1000,y:30}});
      await student.waitForFunction(()=>getComputedStyle(document.getElementById('classroom-projects')).visibility==='hidden');
      await editor.fill(''); await editor.pressSequentially('ma');
      await student.getByRole('option',{name:'main',exact:true}).click();
      assert.match(await editor.inputValue(),/^public static void main/);
      await Promise.all([student.waitForResponse(response=>response.request().method()==='PUT' && response.url().includes('/progress/')),student.getByRole('button',{name:'Save work',exact:true}).click()]);
      const personal=await (await contexts[1].request.get(path)).json();
      assert.ok(personal.performanceProjectFiles.length, 'personal draft saved');
      assert.ok(personal.projectFiles.length, 'module draft preserved');
      assert.match(personal.performanceProjectFiles[0].content,/public static void main/);
      assert.equal(personal.projectFiles[0].content,'System.out.println();');
      assert.equal(personal.performanceTask.own,undefined); assert.deepEqual(personal.stepStates,completed);
      await student.screenshot({path:'/tmp/suggestions-personal.png'});
    });
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
    if(classroomId) assert.equal((await admin.from('classrooms').delete().eq('id',classroomId)).error,null);
    for(const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error,null);
  }
});
