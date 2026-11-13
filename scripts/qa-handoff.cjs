const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'hand-off');
let browser;
(async()=>{
  const all=fs.readdirSync(dir,{recursive:true}).filter(f=>fs.statSync(path.join(dir,f)).isFile());
  assert(all.every(f=>/\.(html|css)$/.test(f)),'Only HTML/CSS may be shipped');
  for(const file of all.filter(f=>f.endsWith('.css')))assert(!/@layer\b/.test(fs.readFileSync(path.join(dir,file),'utf8')),file);
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage(),errors=[],failed=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
  fs.mkdirSync(path.join(root,'tmp','qa-handoff'),{recursive:true});
  for(const file of all.filter(f=>f.endsWith('.html'))){
    const html=fs.readFileSync(path.join(dir,file),'utf8');
    assert(!/<script\b|\son[a-z]+=|shadowrootmode|<main\b|<template\b/i.test(html),file);
    for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g))if(!/^(?:https?:|data:|#)/.test(m[1]))assert(fs.existsSync(path.resolve(dir,m[1])),`${file}: ${m[1]}`);
    await page.goto(pathToFileURL(path.join(dir,file)).href,{waitUntil:'networkidle'});
    assert.equal(await page.locator('body.home > header.home-header').count(),1);
    assert(await page.locator('section#main #appStepContainer > *').count()>0);
    assert.equal(await page.locator('footer,div.home').count(),0);
    assert(await page.locator('#appStepContainer').innerText());
    if(file==='cham-diem.html'){
      assert.equal(await page.locator('.editor-photo-grid img').count(),4);
      await page.locator('.editor-photo-grid img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
      assert(await page.locator('.editor-photo-grid img').evaluateAll(images=>images.every(img=>img.naturalWidth>0)),'Embedded gallery pictures must decode');
      assert.equal(await page.locator('.editor-folder-link').getAttribute('target'),'_blank');
    }
    const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(ids.length,new Set(ids).size,'Unique IDs');
    for(const width of [1440,1024,768,390]){
      await page.setViewportSize({width,height:900});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file} overflow ${width}`);
      assert.equal(await page.locator('body > header.home-header').evaluate(e=>Math.round(e.getBoundingClientRect().height)),66,'Survey header 65px + border');
      if(file==='cham-diem.html'){
        if(width<1024){
          await page.locator('.editor-mobile-tabs label').filter({has:page.locator('[value=dossier]')}).click();
          assert(await page.locator('.judge-dossier').isVisible());assert(!await page.locator('.judge-scoring').isVisible());
          await page.locator('.editor-mobile-tabs label').filter({has:page.locator('[value=scoring]')}).click();
          assert(await page.locator('.judge-scoring').isVisible());assert(!await page.locator('.judge-dossier').isVisible());
        }
        const actions=await page.locator('.editor-action-bar').boundingBox();assert(actions.y>=0&&actions.y+actions.height<=901);
      }
      if(width===1440||width===390)await page.screenshot({path:path.join(root,'tmp','qa-handoff',`${file}-${width}.png`),fullPage:true});
      checks.push({file,width,status:'pass'});
    }
    const summary=page.locator('details summary').first();
    if(await summary.count()){await summary.click();assert(await summary.evaluate(e=>e.parentElement.open));}
    for(const link of await page.locator('.handoff-preview-nav a').all())assert(fs.existsSync(path.join(dir,await link.getAttribute('href'))));
    if(file==='hoan-tat.html')assert((await page.locator('.editor-result-score').innerText()).includes('80.0'));
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={status:'pass',files:all.length,checks,consoleErrors:errors,failedRequests:failed,format:'HTML/CSS only; no scripts, layers, Shadow DOM or external runtime'};
  fs.writeFileSync(path.join(root,'docs','handoff-qa.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
