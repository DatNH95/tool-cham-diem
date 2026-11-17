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
  assert.equal(await page.locator('footer').count(),0);
  await page.evaluate(()=>{selectCategory('tru-cot-3');proceedFromStep1();proceedFromStep2();});
  await page.locator('.judge-workspace').waitFor();
  await page.locator('.judge-council-details summary').click();
  assert.equal(await page.locator('.judge-council-roster li').count(),13);
  assert.equal(await page.locator('.judge-council-count').innerText(),'5/13 đã chấm');
  await page.locator('.judge-council').screenshot({path:path.join(out,'judge-roster.png')});
  const originalJudgeData=await page.evaluate(()=>JSON.parse(JSON.stringify(JUDGE_PANEL_DATA)));
  await page.evaluate(()=>{
    JUDGE_PANEL_DATA.currentJudgeId='test-1';
    JUDGE_PANEL_DATA.judges=Array.from({length:13},(_,i)=>({id:'test-'+(i+1),name:'Tài khoản kiểm thử '+(i+1)}));
    JUDGE_PANEL_DATA.ballotsByProfile[appState.selectedProfileId]=JUDGE_PANEL_DATA.judges.map((j,i)=>({judgeId:j.id,status:i<3?'submitted':'not_started'}));
    renderAll();
  });
  assert.equal(await page.locator('.judge-council-count').innerText(),'3/13 đã chấm');
  assert.equal(await page.locator('.is-current-judge').count(),1);
  await page.evaluate(data=>{Object.assign(JUDGE_PANEL_DATA,data);renderAll();},originalJudgeData);
  const toolUrl=page.url();
  await page.locator('.home-header-logo').click();
  assert.equal(page.url(),toolUrl);
  assert.equal(await page.evaluate(()=>appState.currentStep),1,'Logo returns to step 1');
  await page.evaluate(()=>{proceedFromStep1();proceedFromStep2();});
  const folder=page.getByRole('link',{name:'Mở thư mục minh chứng',exact:true});
  assert.equal(await folder.getAttribute('href'),'https://drive.google.com/drive/u/0/folders/13HJYqnAp4ginUFjvtvVuYjv5Vy03mdHc');
  assert.equal(await folder.getAttribute('target'),'_blank');
  assert.equal(await page.locator('.editor-photo-grid img').count(),0,'No demo photos for a real profile without photos');
  await page.screenshot({path:path.join(out,'desktop-empty.png'),fullPage:true});
  assert.equal(await page.locator('.editor-criterion-nav button').count(),4);
  assert.equal(await page.locator('.editor-level-description').count(),5);
  assert(await page.locator('.editor-criterion-description').isVisible());
  assert.equal(await page.locator('.judge-scoring input,.judge-scoring select,.judge-scoring textarea').count(),0);
  for(const score of [1,5])assert(await page.locator('[data-score="'+score+'"]').isEnabled());
  await page.locator('[data-score="1"]').click();
  assert(await page.locator('#editor-reason-input').isVisible());
  assert.equal(await page.locator('#editor-reason-input').getAttribute('required'),null);
  await page.locator('#editor-reason-input').fill('Nội dung đánh giá bổ sung.');
  assert((await page.locator('#editor-ready-count').innerText()).startsWith('1/4'));
  assert(await page.locator('#editor-complete').isDisabled());
  await page.evaluate(()=>{const {record,criterion}=editorCurrent();record.evidenceTiers[criterion.code]='T3';});
  await page.locator('#editor-reason-input').fill('');
  await page.locator('[data-score="5"]').click();
  assert(await page.locator('#editor-reason-input').isVisible());
  assert((await page.locator('#editor-ready-count').innerText()).startsWith('0/4'));
  await page.locator('#editor-reason-input').fill('Kết quả vượt trội so với kỳ vọng.');
  await page.locator('[data-score="4"]').click();
  assert(await page.locator('#editor-reason-input').isVisible());
  assert.equal(await page.locator('#editor-reason-input').getAttribute('required'),null);
  await page.locator('[data-score="5"]').click();
  assert.equal(await page.locator('#editor-reason-input').inputValue(),'Kết quả vượt trội so với kỳ vọng.');
  await page.locator('[data-score="4"]').click();
  for(const score of [5,4,3]){
    await page.locator('.editor-criterion-controls').getByRole('button',{name:'Tiếp theo →',exact:true}).click();
    await page.locator('[data-score="'+score+'"]').click();
    if(score===5)await page.locator('#editor-reason-input').fill('Đổi mới nổi bật và có kết quả rõ ràng.');
    else assert.equal(await page.locator('#editor-reason-input').getAttribute('required'),null);
  }
  assert(await page.locator('#editor-complete').isEnabled());
  await page.screenshot({path:path.join(out,'desktop-ready.png'),fullPage:true});
  await page.screenshot({path:path.join(out,'desktop-viewport.png')});
  await page.locator('#editor-complete').click();
  assert((await page.locator('.editor-result-score strong').innerText()).includes('80.0'));
  assert.equal(await page.getByRole('button',{name:/Hồ sơ chưa chấm tiếp theo/}).count(),0);
  await page.getByRole('button',{name:'Quay lại danh sách hồ sơ',exact:true}).click();
  assert(await page.locator('.editor-profile-list').isVisible());
  assert.equal(await page.locator('footer').count(),0);
  await page.locator('.editor-profile-cards article').first().getByRole('button',{name:'Xem lại phiếu →',exact:true}).click();
  await page.reload({waitUntil:'networkidle'});
  await page.evaluate(()=>{selectCategory('tru-cot-3');proceedFromStep1();proceedFromStep2();});
  assert.equal(await page.locator('[data-score="4"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-editor-criterion="KS-2"]').click();
  assert.equal(await page.locator('#editor-reason-input').inputValue(),'Đổi mới nổi bật và có kết quả rõ ràng.');
  await page.locator('[data-editor-criterion="KS-1"]').click();
  assert.equal(await page.locator('.judge-dossier .editor-tabs').count(),0);
  assert.equal(await page.locator('.judge-dossier .editor-criterion-nav').count(),0);
  await page.locator('[data-workspace-scroll="dossier"]').evaluate(e=>e.scrollTop=200);
  await page.locator('[data-score="2"]').click();
  assert(await page.locator('[data-workspace-scroll="dossier"]').evaluate(e=>e.scrollTop)>100,'Preserve dossier scroll');
  await page.locator('.editor-criterion-controls').getByRole('button',{name:'Tiếp theo →',exact:true}).click();
  assert(await page.locator('[data-workspace-scroll="dossier"]').evaluate(e=>e.scrollTop)>100,'Changing criterion must preserve dossier position');
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
  const categoryChecks=await page.evaluate(()=>AWARD_CATEGORIES.filter(c=>PROFILES_BY_CATEGORY[c.id].length).map(c=>({id:c.id,codes:c.criteria.map(k=>k.code)})));
  for(const category of categoryChecks){
    await page.evaluate(id=>{selectCategory(id);proceedFromStep2();},category.id);
    for(const code of category.codes){await page.locator(`[data-editor-criterion="${code}"]`).click();assert.equal(await page.locator('.editor-score-options button').count(),5);}
  }
  await page.evaluate(()=>{selectCategory('tru-cot-1');proceedFromStep2();});
  await page.getByRole('button',{name:'Đọc hồ sơ & minh chứng',exact:true}).click();
  assert((await page.locator('.judge-heading h1').innerText()).includes('Lam Kinh'));
  assert((await page.locator('.editor-folder-link').getAttribute('href')).includes('1VzzthSB7RMPCKJWz4oywvnWVoJfGnwWn'));
  await page.locator('.judge-dossier').screenshot({path:path.join(out,'lam-kinh-real-profile.png')});
  const records=await page.evaluate(()=>REGISTRATION_DATA.profiles.map(p=>({id:p.id,category:p.categoryId,folder:p.evidenceFolderUrl,photos:p.gallery.length})));
  for(const record of records){
    await page.evaluate(r=>{selectCategory(r.category);openProfileForScoring(r.id);},record);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Imported profile overflows: ${record.id}`);
    if(record.folder)assert.equal(await page.locator('.editor-folder-link').getAttribute('href'),record.folder);
    else assert.equal(await page.locator('.editor-folder-link').count(),0,'Never substitute a shared folder');
    assert.equal(await page.locator('.editor-photo-grid img').count(),record.photos);
    if(record.photos){
      await page.locator('.editor-photo-grid img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
      assert(await page.locator('.editor-photo-grid img').evaluateAll(images=>images.every(img=>img.naturalWidth>0)));
    }
  }
  await page.evaluate(()=>{selectCategory('tru-cot-5');goToStep(3);});
  assert(await page.getByText('Chưa có hồ sơ trong file dữ liệu.',{exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  assert.deepEqual(failed,[],'All imported images must be available');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({status:'pass',viewports:[1440,1024,768,390],categoryDefinitions:15,categoriesWithRegistrations:categoryChecks.length,profiles:records.length,photos:records.reduce((n,p)=>n+p.photos,0),errors,failedRequests:failed},null,2));
  console.log(JSON.stringify({status:'pass',viewports:[1440,1024,768,390],categoriesWithRegistrations:categoryChecks.length,profiles:records.length,photos:records.reduce((n,p)=>n+p.photos,0),failedRequests:failed,screenshots:out}));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
