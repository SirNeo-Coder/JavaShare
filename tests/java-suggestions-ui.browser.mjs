// Focused browser checks mount the actual shared editor with controlled prop changes.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || 'playwright');
const source = buildSync({stdin:{contents:`
import {createElement, useState} from 'react';
import {createRoot} from 'react-dom/client';
import CodeEditor from './app/CodeEditor';
function Harness() {
  const [value,setValue]=useState(''); const [language,setLanguage]=useState('java'); const [readOnly,setReadOnly]=useState(false);
  Object.assign(window,{setCode:setValue,setLanguage,setReadOnly});
  return createElement('div',{style:{display:'grid',height:'100%'},onKeyDown:event=>{if(event.ctrlKey && event.key==='Enter'){event.preventDefault();window.runRequested=true;}}},createElement(CodeEditor,{value,onChange:setValue,language,readOnly,onCursorChange:offset=>window.cursorOffset=offset}));
}
createRoot(document.getElementById('root')).render(createElement(Harness));`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic'}).outputFiles[0].text;

test('Java editor: controlled browser behavior',async t=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  try {
    const page=await browser.newPage();
    await page.setContent('<div id="root" style="height:500px;display:grid"></div><button id="outside">Outside</button>');
    await page.addStyleTag({content:readFileSync(new URL('../app/globals.css',import.meta.url),'utf8')});
    await page.addScriptTag({content:source});
    const editor=page.locator('textarea');
    const menu=page.getByRole('listbox',{name:'Java code suggestions'});
    const type=async text=>{await editor.fill('');await editor.pressSequentially(text);};
    await t.test('Java editor: a fast keystroke after pointer insertion stays inside the print parentheses',async()=>{
      await editor.fill('class Main {\n\n}');
      await editor.evaluate(el=>{el.focus();el.setSelectionRange(13,13);});
      await editor.pressSequentially('Sys'); await page.getByRole('option',{name:'System.out.println(…)',exact:true}).click();
      await editor.pressSequentially('"Fast input"');
      assert.equal(await editor.inputValue(),'class Main {\nSystem.out.println("Fast input");\n}');
      assert.equal(await page.evaluate(()=>window.cursorOffset), (await editor.inputValue()).indexOf(');'));
    });
    await t.test('Java editor: external live edits dismiss stale suggestions without accepting them',async()=>{
      await type('Sys'); await menu.waitFor();
      await page.evaluate(()=>window.setCode('int capacity;\nSys'));
      await menu.waitFor({state:'hidden'}); await editor.press('Enter');
      assert.doesNotMatch(await editor.inputValue(),/System/);
    });
    await t.test('Java editor: Java-only suggestions, read-only transitions and Tab navigation',async()=>{
      for(const language of ['html','css','javascript']) {
        await page.evaluate(language=>window.setLanguage(language),language);
        await type('Sys'); assert.equal(await menu.count(),0);
      }
      await page.evaluate(()=>window.setLanguage('java')); await type('Sys'); await menu.waitFor();
      await page.evaluate(()=>window.setReadOnly(true)); await menu.waitFor({state:'hidden'});
      const before=await editor.inputValue(); await editor.press('Enter'); assert.equal(await editor.inputValue(),before);
      await editor.press('Tab'); assert.equal(await editor.evaluate(el=>el===document.activeElement),false);
      await page.evaluate(()=>window.setReadOnly(false));
    });
    await t.test('Java editor: Ctrl+Enter keeps the existing Run code shortcut without inserting a suggestion',async()=>{
      await type('Sys'); await menu.waitFor(); await editor.press('Control+Enter');
      assert.equal(await page.evaluate(()=>window.runRequested),true); assert.equal(await editor.inputValue(),'Sys'); await menu.waitFor({state:'hidden'});
    });
    await t.test('Java editor: arrows wrap, middle-word completion and indentation preserve surrounding code',async()=>{
      await type('Sys'); await editor.press('ArrowUp');
      assert.equal(await page.getByRole('option',{name:'System.out.print(…)',exact:true}).getAttribute('aria-selected'),'true');
      await editor.press('ArrowDown'); await editor.press('Enter'); assert.equal(await editor.inputValue(),'System');
      await editor.fill('class Main { System }'); await editor.evaluate(el=>{el.focus();el.setSelectionRange(15,15);});
      await editor.press('Backspace'); await editor.press('y'); await page.getByRole('option',{name:'System',exact:true}).click();
      assert.equal(await editor.inputValue(),'class Main { System }');
      await editor.fill('first\nsecond'); await editor.press('Control+a'); await editor.press('Tab');
      assert.equal(await editor.inputValue(),'    first\n    second'); await editor.press('Shift+Tab'); assert.equal(await editor.inputValue(),'first\nsecond');
    });
  } finally {await browser.close();}
});
