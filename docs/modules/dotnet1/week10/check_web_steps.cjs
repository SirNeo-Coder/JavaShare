// Offline browser checks for HTML/CSS pages and JavaScript console steps.
const fs = require('fs'), path = require('path'), os = require('os');
const {pathToFileURL} = require('url');
const deps = process.env.CODEX_NODE_MODULES || '/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium} = require(path.join(deps, 'playwright'));
(async()=>{
 const input=JSON.parse(fs.readFileSync(0,'utf8'));
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'dotnet-web-'));
 let browser;
 function put(files){for(const f of files){
  const target=path.resolve(folder,f.path);
  if(!target.startsWith(folder+path.sep)) throw Error('Unsafe file path: '+f.path);
  fs.mkdirSync(path.dirname(target),{recursive:true}); fs.writeFileSync(target,f.content);
 }}
 const results=[];
 // Companion binaries remain outside the text-only CodeShare file format.
 if(input.mediaRoot){
  const sourceRoot=fs.realpathSync(input.mediaRoot);
  function copyMedia(src,dst){
   if(!fs.realpathSync(src).startsWith(sourceRoot+path.sep)) throw Error('Unsafe media path');
   if(fs.lstatSync(src).isSymbolicLink()) throw Error('Media symlinks are unsupported');
   if(fs.statSync(src).isDirectory()){
    fs.mkdirSync(dst,{recursive:true});
    for(const name of fs.readdirSync(src)) copyMedia(path.join(src,name),path.join(dst,name));
   }else fs.copyFileSync(src,dst);
  }
  for(const name of ['images','audio','video']){
   const src=path.join(sourceRoot,name);
   if(fs.existsSync(src)) copyMedia(src,path.join(folder,name));
  }
 }

 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || "/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome"});
  const ctx=await browser.newContext({offline:true,viewport:{width:1000,height:900}});
  await ctx.route(/^https?:/,route=>route.abort());
  put(input.starterFiles||[]);
  for(const lesson of input.lessons) for(const step of lesson.blocks){
   if(step.type!=='step') continue;
   put(step.files||[]);
   if(!['html','css','javascript'].includes(step.language)) continue;
   const p=await ctx.newPage(), consoleLines=[], errors=[];
   p.on('console',msg=>{if(['log','info','warn','error'].includes(msg.type())) consoleLines.push(msg.text());});
   p.on('pageerror',e=>errors.push(e.message));
   let output='';
   try{
    if(!step.run) throw Error('Web step needs a run file');
    const target=path.resolve(folder,step.run);
    if(!target.startsWith(folder+path.sep)) throw Error('Unsafe run path');
    if(step.language==='javascript' && !/\.html?$/i.test(step.run)){
     await p.goto('about:blank');
     await p.addScriptTag({content:fs.readFileSync(target,'utf8')});
     output=consoleLines.join('\n');
    } else {
     await p.goto(pathToFileURL(target).href);
     output='Tab title: '+await p.title()+'\nVisible page text:\n'+(await p.locator('body').innerText()).trim().replace(/\n{2,}/g,'\n');
    }
    for(const check of step.webChecks||[]){
     const loc=p.locator(check.selector);
     if(check.count!==undefined && await loc.count()!==check.count) throw Error('Count mismatch: '+check.selector);
     if(check.attribute && await loc.first().getAttribute(check.attribute)!==check.value) throw Error('Attribute mismatch: '+check.selector+' '+check.attribute);
     if(check.style){
      const val=await loc.first().evaluate((el,key)=>getComputedStyle(el).getPropertyValue(key),check.style);
      if(val!==check.value) throw Error('Style mismatch: '+check.selector+' '+check.style+': '+val);
     }
    }
    const observed=[];
    for(const el of await p.locator('img,audio,video').all()){
     const info=await el.evaluate(e=>({tag:e.tagName.toLowerCase(),src:e.getAttribute('src')}));
     const expectations=(step.mediaChecks||[]).filter(c=>c.src===info.src);
     if(expectations.length>1) throw Error('Duplicate media expectation: '+info.src);
     const broken=expectations[0]?.state==='broken';
     let loaded=false,detail='';
     if(info.tag==='img'){
      loaded=await el.evaluate(async e=>{try{await e.decode();return e.complete&&e.naturalWidth>0&&e.naturalHeight>0}catch{return false}});
      detail=loaded?'image decoded':'image failed to decode';
     }else{
      loaded=await el.evaluate(async e=>{
       if(e.readyState<2&&!e.error) await new Promise(resolve=>{
        const timer=setTimeout(done,5000);
        function done(){clearTimeout(timer);e.removeEventListener('loadeddata',done);e.removeEventListener('error',done);resolve()}
        e.addEventListener('loadeddata',done);e.addEventListener('error',done);e.load();
       });
       if(e.error||e.readyState<2||!Number.isFinite(e.duration)||e.duration<=0) return false;
       if(e.tagName==='VIDEO'&&(!e.videoWidth||!e.videoHeight)) return false;
       try{await e.play();await new Promise(r=>setTimeout(r,200));const advanced=e.currentTime>0&&!e.error;e.pause();e.currentTime=0;return advanced}catch{return false}
      });
      detail=loaded?'playback advanced':'playback failed';
     }
     observed.push(info.src+': '+detail);
     if(loaded===broken) throw Error('Media state mismatch: '+info.src+' ('+detail+')');
    }
    for(const check of step.mediaChecks||[]){
     if(!['loaded','broken'].includes(check.state)) throw Error('Unknown media expectation');
     if(!observed.some(line=>line.startsWith(check.src+': '))) throw Error('Expected media element absent: '+check.src);
    }
    if(step.includeMediaOutput&&observed.length) output+='\nMedia checks:\n'+observed.join('\n');
    if(errors.length) throw Error('Browser error: '+errors.join('\n'));
    if(input.screenshotDir){fs.mkdirSync(input.screenshotDir,{recursive:true});await p.screenshot({path:path.join(input.screenshotDir,step.id+'.png'),fullPage:true});}
    results.push({id:step.id,output,console:consoleLines,pass:output.trimEnd()===(step.expectedOutput||'').trimEnd()});
   }catch(e){results.push({id:step.id,output,pass:false,error:e.message});}
   await p.close();
  }
  process.stdout.write(JSON.stringify(results));
 }finally{if(browser) await browser.close();fs.rmSync(folder,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1)});
