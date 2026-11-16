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
for(const file of ['shared/scoring-model.js','shared/profile-media.js','shared/registration-data.js','shared/editor-workspace.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
for(const file of vm.runInContext('Object.values(PROFILES_BY_CATEGORY).flatMap(profiles=>profiles.flatMap(p=>p.gallery.map(g=>g.src)))',context))assert(fs.existsSync(file),file);
vm.runInContext(`
  assert.equal(REGISTRATION_DATA.profiles.length,21);
  assert.equal(new Set(REGISTRATION_DATA.profiles.map(p=>p.id)).size,21);
  assert.equal(PROFILES_BY_CATEGORY['tru-cot-1'][0].sourceId,'597');
  assert.equal(PROFILES_BY_CATEGORY['tru-cot-1'][0].title,'Khu di tích quốc gia đặc biệt Lam Kinh');
  assert(PROFILES_BY_CATEGORY['tru-cot-1'][0].evidenceFolderUrl.includes('1VzzthSB7RMPCKJWz4oywvnWVoJfGnwWn'));
  assert.equal(PROFILES_BY_CATEGORY['tru-cot-5'].length,0);
  assert.equal(REGISTRATION_DATA.profiles.filter(p=>!p.evidenceFolderUrl).length,4);
  assert.equal(REGISTRATION_DATA.profiles.find(p=>p.sourceId==='641').evidenceFolderUrl,'https://drive.google.com/drive/folders/1ohDG8ODbqu40ywTJcwwqMduIaeLONczZ?usp=sharing');
  assert.equal(REGISTRATION_DATA.profiles.reduce((n,p)=>n+p.gallery.length,0),33);
  for(const p of REGISTRATION_DATA.profiles){assert(!p.id.includes('ho-so-'));assert.equal(p.registrationStatus,'Chờ duyệt');assert(!('email' in p));assert(!('phone' in p));}
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
  for(const category of AWARD_CATEGORIES){
    const n=category.criteria.length;
    for(let sample=0;sample<5**n;sample++){
      let digits=sample,sum=0;const record={scores:{}};
      category.criteria.forEach(c=>{const s=digits%5+1;digits=Math.floor(digits/5);record.scores[c.code]=s;sum+=s;});
      record.scores.UNKNOWN=5;
      const result=computeJudgeScore(category,record);
      assert(result.complete);assert.equal(result.sum,sum);assert.equal(result.maxScore,5*n);
      assert(Math.abs(result.score100-sum/(5*n)*100)<1e-10);
      assert(result.score100>=20&&result.score100<=100);
    }
  }
  const multiple=getCategoryById('tru-cot-2'),members=PROFILES_BY_CATEGORY[multiple.id];
  members[0]&& (appState.evaluations[members[0].id].status='completed');
  assert.equal(getCompletionStats().truCotDone,0,'One ballot does not complete a multi-profile category');
  members.forEach(p=>appState.evaluations[p.id].status='completed');
  assert.equal(getCompletionStats().truCotDone,1,'Every ballot completes category');
  members.forEach(p=>appState.evaluations[p.id].status='draft');
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
  goToStep(3);selectCriterionScore(cat.criteria[0].code,migrated.scores[cat.criteria[0].code]);assert.equal(migrated.status,'completed','Selecting unchanged score preserves completion');
  const lastCategory=appState.selectedCategoryId,lastProfile=appState.selectedProfileId;
  appState.currentStep=1;appState.selectedCategoryId='tru-cot-4';loadSavedState();
  assert.equal(appState.currentStep,3);assert.equal(appState.selectedCategoryId,lastCategory);assert.equal(appState.selectedProfileId,lastProfile);
  const snapshot=JSON.stringify(appState.evaluations);appState.evaluations={};loadSavedState();assert.equal(JSON.stringify(appState.evaluations),snapshot,'Reload preserves local ballot');
`,context);
console.log('PASS: 15 category weights; all profile/criterion views; mean conversion; PDF 80/100 example; score-only validation; legacy migration; storage failure; completion/reload.');
