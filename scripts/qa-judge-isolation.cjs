const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();const url=pathToFileURL(path.resolve('index.html')).href;
for(const page of [a,b])await page.goto(url);
await b.evaluate(()=>switchEditorDemoJudge('demo-judge-02'));
for(const [page,score,note]of [[a,3,'Nhận xét của A'],[b,4,'Nhận xét của B']])await page.evaluate(({score,note})=>{selectCategory('tru-cot-1');openProfileForScoring('submission-597');const cat=getCategoryById('tru-cot-1'),r=getOrCreateEvaluation('submission-597',cat);cat.criteria.forEach(c=>{r.scores[c.code]=score;r.notes[c.code]=note;});submitProfileEvaluation();},{score,note});
for(const [page,id,expected,note]of [[a,'demo-judge-01',60,'Nhận xét của A'],[b,'demo-judge-02',80,'Nhận xét của B']]){
 await page.reload();if(id!=='demo-judge-01')await page.evaluate(id=>switchEditorDemoJudge(id),id);
 const result=await page.evaluate(()=>{const r=appState.evaluations['submission-597'];return {id:r.judgeId,score:computeJudgeScore(getCategoryById('tru-cot-1'),r).score100,note:r.notes['DD-1'],status:r.status};});
 assert.deepEqual(result,{id,score:expected,note,status:'completed'});
}
await a.evaluate(()=>switchEditorDemoJudge('demo-judge-02'));assert.equal(await a.evaluate(()=>appState.evaluations['submission-597'].scores['DD-1']),4);
await a.evaluate(()=>switchEditorDemoJudge('demo-judge-01'));assert.equal(await a.evaluate(()=>appState.evaluations['submission-597'].scores['DD-1']),3);
assert.equal(await a.evaluate(()=>{const original=localStorage.setItem;localStorage.setItem=()=>{throw Error('Quota');};const ok=switchEditorDemoJudge('demo-judge-02');localStorage.setItem=original;return !ok&&getEditorJudgeId()==='demo-judge-01';}),true);
console.log('PASS: two simultaneous pages, separate ballots 60/80, notes, completion, reload, switching, failed save guard.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
