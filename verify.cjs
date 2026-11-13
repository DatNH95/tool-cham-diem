const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const html=fs.readFileSync('index.html','utf8');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
inline.forEach(s=>new vm.Script(s));
assert.equal(crypto.createHash('sha256').update(inline.join('\n')).digest('hex'),'a3efeb78cd26d9ae1e6475a5d2b806659280f900459de7d37c5c7e1c41443f4e','Original source must remain traceable');
assert.equal(html.split('id="stepIndicatorBar"').length-1,1);
assert(!/className=|<Link|<Container|showEventSponsorship|homePrefix/.test(html));
for(const m of html.matchAll(/(?:src|href)="((?:assets|shared)\/[^"#]+)"/g))assert(fs.existsSync(m[1]),m[1]);
const storage=new Map();
const context=vm.createContext({assert,
  window:{addEventListener(){},scrollTo(){}},document:{querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},body:{classList:{toggle(){}}}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout,clearTimeout
});
inline.forEach(s=>vm.runInContext(s,context));
for(const file of ['shared/scoring-model.js','shared/editor-workspace.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
vm.runInContext(`
  const modelWeights=[.7,.6,.5,.5,.7,.4,.9,.8,.7,.5,.7,.6,.4,.3,.5];
  for(const [i,category]of AWARD_CATEGORIES.entries()){
    assert.equal(category.councilWeight,modelWeights[i]);assert(Math.abs(category.readerWeight+category.councilWeight-1)<1e-9);
    appState.selectedCategoryId=category.id;
    for(const profile of PROFILES_BY_CATEGORY[category.id]){
      appState.selectedProfileId=profile.id;appState.currentStep=3;
      const record=getOrCreateEvaluation(profile.id,category);
      assert.equal(Object.keys(record.scores).length,0,'Never autofill quantitative scores');
      assert.equal(computeJudgeScore(category,record),null);
      assert(!validateScoringSubmission(category,record).isValid);
      for(const criterion of category.criteria){
        for(const value of [1,2,3,4,5])assert(typeof criterion.levels?.[value]==='string'&&criterion.levels[value].trim(),'Every criterion needs five score descriptions');
        editorChooseCriterion(criterion.code);
        {
          const markup=renderStep3Workspace();
          assert(markup.includes('judge-dossier-title')&&markup.includes('judge-scoring-title'));
          assert(!markup.includes('undefined'));assert(markup.includes('editor-complete'));
        }
        record.scores[criterion.code]=3;
      }
      assert(validateScoringSubmission(category,record).isValid);
      assert.equal(computeJudgeScore(category,record).score100,60);
      const c=category.criteria[0];
      record.evidenceTiers[c.code]='T3'; // Preserved old metadata must not restrict scoring.
      for(const value of [1,4]){record.scores[c.code]=value;record.notes[c.code]='';assert(validateScoringSubmission(category,record).isValid,'No reason required below 5');}
      record.scores[c.code]=5;record.notes[c.code]='   ';assert(!validateScoringSubmission(category,record).isValid,'5 requires an explanation');
      record.notes[c.code]='Kết quả vượt trội';assert(validateScoringSubmission(category,record).isValid);
      for(const value of [0,6,1.5]){record.scores[c.code]=value;assert(!validateScoringSubmission(category,record).isValid,'Only integer scores 1-5');}
      record.scores[c.code]=3;
      assert(saveState());
    }
  }
  const hotel=getCategoryById('tru-cot-3');assert.equal(hotel.criteria.length,4);assert(!hotel.criteria.some(c=>c.code==='KS-5'));
  assert.equal(getCategoryById('tru-cot-4').criteria.length,4);
  const example=createEditorEvaluation();hotel.criteria.forEach((c,i)=>example.scores[c.code]=[4,5,4,3][i]);
  assert.equal(computeJudgeScore(hotel,example).score100,80,'PDF example');
  example.scores[hotel.criteria[0].code]=0;assert(!computeJudgeScore(hotel,example).complete);example.scores[hotel.criteria[0].code]=3.5;assert(!computeJudgeScore(hotel,example).complete);
  const cat=AWARD_CATEGORIES[0],pid=PROFILES_BY_CATEGORY[cat.id][0].id;
  appState.evaluations[pid]={scores:{'DD-1':4,'DD-2':5},notes:{'DD-1':'Giữ nguyên ghi chú'},status:'completed'};
  const migrated=getOrCreateEvaluation(pid,cat);assert.equal(migrated.status,'draft');assert.equal(migrated.scores['DD-1'],4);assert.equal(migrated.scores['DD-2'],undefined);assert.equal(migrated.notes['DD-1'],'Giữ nguyên ghi chú');
  appState.selectedCategoryId=cat.id;appState.selectedProfileId=pid;
  cat.criteria.forEach(c=>{migrated.scores[c.code]=3;migrated.evidenceTiers[c.code]='T3';migrated.evidenceRefs[c.code]='Tài liệu mẫu';});
  const savedSet=localStorage.setItem;localStorage.setItem=()=>{throw Error('Quota denied');};
  appState.currentStep=3;submitProfileEvaluation();assert.equal(appState.currentStep,3);assert.notEqual(migrated.status,'completed');assert.equal(editorStorageState,'error');
  localStorage.setItem=savedSet;submitProfileEvaluation();assert.equal(appState.currentStep,4);assert.equal(migrated.status,'completed');assert(renderStep4Completed().includes('Chưa gửi lên hệ thống VnExpress'));
  const snapshot=JSON.stringify(appState.evaluations);appState.evaluations={};loadSavedState();assert.equal(JSON.stringify(appState.evaluations),snapshot,'Reload preserves local ballot');
`,context);
console.log('PASS: 15 category weights; all profile/criterion views; mean conversion; PDF 80/100 example; score-only validation; legacy migration; storage failure; completion/reload.');
