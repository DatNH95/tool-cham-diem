const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let browser;
(async()=>{
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('index.html')).href,{waitUntil:'networkidle'});
  await page.evaluate(()=>{selectCategory('tru-cot-1');proceedFromStep1();proceedFromStep2();});
  await page.locator('[data-editor-criterion="DD-5"]').click();
  await page.getByRole('button',{name:'Kiểm tra tiêu chí còn thiếu →',exact:true}).click();
  assert.equal(await page.locator('.judge-workspace').getAttribute('data-criterion'),'DD-1');
  await page.locator('[data-score="5"]').click();
  await page.reload({waitUntil:'networkidle'});
  assert(await page.locator('.judge-workspace').isVisible(),'Reload resumes ballot');
  assert.equal(await page.locator('[data-score="5"]').getAttribute('aria-pressed'),'true');
  for(const code of ['DD-2','DD-3','DD-4','DD-5']){
    await page.locator(`[data-editor-criterion="${code}"]`).click();await page.locator('[data-score="4"]').click();
  }
  assert.equal(await page.locator('#editor-total-label').innerText(),'Điểm tạm tính');
  assert(await page.locator('#editor-complete').isDisabled());
  await page.getByRole('button',{name:'Kiểm tra tiêu chí còn thiếu →',exact:true}).click();
  await page.locator('#editor-reason-input').fill('Kết quả vượt trội, có căn cứ đối chiếu.');
  assert.equal(await page.locator('#editor-total-label').innerText(),'Điểm giám khảo');
  const records=await page.evaluate(()=>REGISTRATION_DATA.profiles.map(p=>({id:p.id,category:p.categoryId,codes:getCategoryById(p.categoryId).criteria.map(c=>c.code)})));
  for(const [index,record]of records.entries()){
    await page.evaluate(r=>{selectCategory(r.category);openProfileForScoring(r.id);},record);
    let sum=0;
    for(const [i,code]of record.codes.entries()){
      const score=(index+i)%5+1;sum+=score;
      await page.locator(`[data-editor-criterion="${code}"]`).click();
      await page.locator(`[data-score="${score}"]`).click();
      if(score===5)await page.locator('#editor-reason-input').fill('Kết quả đặc biệt xuất sắc của tiêu chí.');
    }
    assert(await page.locator('#editor-complete').isEnabled());
    await page.locator('#editor-complete').click();
    assert.equal((await page.locator('.editor-result-score strong').innerText()).replace('/100',''),(sum/(5*record.codes.length)*100).toFixed(1));
    await page.getByRole('button',{name:'Quay lại danh sách hồ sơ',exact:true}).click();
    assert(await page.locator('.editor-profile-list').isVisible());
  }
  assert.deepEqual(await page.evaluate(()=>getCompletionStats()),{truCotDone:4,tienPhongDone:5});
  await page.reload({waitUntil:'networkidle'});
  assert(await page.locator('.editor-profile-list').isVisible(),'Completed ballot resumes in list');
  assert.equal(await page.evaluate(()=>Object.values(appState.evaluations).filter(r=>r.status==='completed').length),21);
  const first=records[0];
  await page.evaluate(r=>{selectCategory(r.category);openProfileForScoring(r.id);const {record,criterion}=editorCurrent();selectCriterionScore(criterion.code,record.scores[criterion.code]);},first);
  assert.equal(await page.evaluate(()=>editorCurrent().record.status),'completed');
  await page.evaluate(()=>{window.auditSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('Quota denied')};});
  const code=first.codes[0];await page.locator(`[data-editor-criterion="${code}"]`).click();
  await page.locator('[data-score="2"]').click();
  // Ensure a real change even if the old score was already 2.
  await page.locator('[data-score="3"]').click();
  await page.locator('#editor-complete').click();
  assert(await page.locator('.judge-workspace').isVisible());
  assert.notEqual(await page.evaluate(()=>editorCurrent().record.status),'completed');
  assert((await page.locator('#editor-storage-status').innerText()).includes('Chưa lưu được'));
  await page.evaluate(()=>{Storage.prototype.setItem=window.auditSetItem;});
  await page.locator('#editor-complete').click();
  assert(await page.locator('.editor-result').isVisible());
  assert.deepEqual(errors,[]);
  const report={status:'pass',profilesCompleted:21,categoryCompletion:{truCotDone:4,tienPhongDone:5},checks:['missing-criterion navigation','resume after reload','provisional score for missing excellence note','all 21 ballot calculations','completed category requires every ballot','same-score preserves completion','quota failure blocks completion','retry save'],consoleErrors:errors};
  fs.writeFileSync('docs/scoring-flow-qa.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
