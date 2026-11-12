const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=path.resolve(__dirname,'..'),out=path.join(base,'tmp','qa');
fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),reason:r.failure()?.errorText}));
  await page.goto(require('node:url').pathToFileURL(path.join(base,'index.html')).href,{waitUntil:'networkidle'});
  await page.evaluate(()=>{selectCategory('tru-cot-3');proceedFromStep1();proceedFromStep2();});
  await page.locator('.judge-workspace').waitFor();
  await page.screenshot({path:path.join(out,'desktop-empty.png'),fullPage:true});
  assert.equal(await page.locator('.editor-criterion-nav button').count(),4);
  assert(await page.locator('[data-score="5"]').isDisabled());
  await page.locator('#editor-tier-input').selectOption('T3');
  assert(await page.locator('[data-score="4"]').isDisabled());
  await page.locator('#editor-reference-input').fill('Hồ sơ tự kê khai, trang 2');
  await page.locator('[data-score="1"]').click();
  assert((await page.locator('#editor-criterion-status').innerText()).includes('Cần giải trình'));
  await page.locator('#editor-reason-input').fill('Chưa có chứng cứ xác minh kết quả.');
  assert((await page.locator('#editor-ready-count').innerText()).startsWith('1/4'));
  await page.locator('#editor-tier-input').selectOption('T1');
  await page.locator('[data-score="5"]').click();
  await page.locator('#editor-tier-input').selectOption('T3');
  assert((await page.locator('[role="alert"]').innerText()).includes('vượt trần'));
  await page.locator('[data-score="3"]').click();
  await page.locator('.editor-criterion-controls').getByRole('button',{name:'Tiếp theo →',exact:true}).click();
  assert.equal(await page.locator('#editor-reference-input').inputValue(),'');
  for(let i=1;i<4;i++){
    await page.locator('#editor-tier-input').selectOption('T2');
    await page.locator('#editor-reference-input').fill('Case study minh họa, trang 3');
    await page.locator('[data-score="4"]').click();
    if(i<3)await page.locator('.editor-criterion-controls').getByRole('button',{name:'Tiếp theo →',exact:true}).click();
  }
  assert(await page.locator('#editor-complete').isEnabled());
  await page.screenshot({path:path.join(out,'desktop-ready.png'),fullPage:true});
  await page.screenshot({path:path.join(out,'desktop-viewport.png')});
  await page.locator('#editor-complete').click();
  assert((await page.locator('.editor-result-score strong').innerText()).includes('75.0'));
  await page.getByRole('button',{name:'Xem lại phiếu',exact:true}).click();
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>{selectCategory('tru-cot-3');proceedFromStep1();proceedFromStep2();});
  assert.equal(await page.locator('#editor-tier-input').inputValue(),'T3');
  await page.locator('.editor-tabs').getByRole('button',{name:'Toàn bộ hồ sơ',exact:true}).click();
  await page.locator('[data-workspace-scroll="dossier"]').evaluate(e=>e.scrollTop=200);
  await page.locator('[data-score="2"]').click();
  assert(await page.locator('[data-workspace-scroll="dossier"]').evaluate(e=>e.scrollTop)>100,'Preserve dossier scroll');
  for(const width of [1440,1024,768,390]){
    await page.setViewportSize({width,height:900});
    const dimensions=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
    assert(dimensions.width<=dimensions.viewport+1,`Overflow at ${width}: ${dimensions.width}`);
    const actions=await page.locator('.editor-action-bar').evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,height:innerHeight}));
    assert(actions.top>=0&&actions.bottom<=actions.height+1,`Action bar outside viewport at ${width}`);
    await page.screenshot({path:path.join(out,`workspace-${width}.png`),fullPage:true});
  }
  await page.getByRole('button',{name:'Đọc hồ sơ & minh chứng',exact:true}).click();
  assert(await page.locator('.judge-dossier').isVisible());assert(!(await page.locator('.judge-scoring').isVisible()));
  await page.getByRole('button',{name:'Phiếu chấm',exact:true}).click();
  assert(await page.locator('.judge-scoring').isVisible());
  // The complete 15-category path must work with every criterion in the real DOM.
  const categoryChecks=await page.evaluate(()=>AWARD_CATEGORIES.map(c=>({id:c.id,codes:c.criteria.map(k=>k.code)})));
  for(const category of categoryChecks){
    await page.evaluate(id=>{selectCategory(id);proceedFromStep2();},category.id);
    for(const code of category.codes){await page.locator(`[data-editor-criterion="${code}"]`).click();assert(await page.locator('#editor-tier-input').isVisible());}
  }
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[],'All runtime assets must be local and available');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({status:'pass',viewports:[1440,1024,768,390],categories:15,errors,failedRequests:failed},null,2));
  console.log(JSON.stringify({status:'pass',viewports:[1440,1024,768,390],categories:15,failedRequests:failed,screenshots:out}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
