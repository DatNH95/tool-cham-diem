// Model reference: 09.11.2026; score-only workflow requested by user on 13.11.2026.
// This is one judge's local demo ballot, never a council aggregate or final award result.
const JUDGE_MODEL = {
  version: '091126-v3', storageKey: 'vta2026_bgk_model_091126_v3',
  legacyKey: 'vta2026_bgk_clean_v2',
  anchors: [
    { score: 1, label: 'Yếu', description: 'Không thuyết phục; chủ yếu tự nhận.' },
    { score: 2, label: 'Dưới kỳ vọng', description: 'Có khoảng trống rõ; bằng chứng yếu.' },
    { score: 3, label: 'Đạt tốt', description: 'Đáp ứng kỳ vọng, không nổi bật.' },
    { score: 4, label: 'Mạnh', description: 'Vượt chuẩn ngành; còn vài điểm có thể cải thiện.' },
    { score: 5, label: 'Xuất sắc', description: 'Chuẩn mực tham chiếu ngành; kết quả vượt trội.' }
  ]
};

// OTA/review is supporting evidence, not an additional council score for lodging.
// Preserve the original HTML dataset for provenance; adapt only the active model.
for (const category of AWARD_CATEGORIES) {
  category.criteria = category.criteria.filter(c => !['KS-5', 'RS-5'].includes(c.code));
  category.criteriaCount = category.criteria.length;
  for (const profile of PROFILES_BY_CATEGORY[category.id] || []) {
    if (profile.summary.startsWith('Hồ sơ đề cử hạng mục')) {
      profile.summary = `Hồ sơ mẫu hạng mục "${category.name}" của ${profile.organization} tại ${profile.location}. Thông tin tự kê khai phục vụ đối chiếu ${category.criteria.length} tiêu chí; chưa có bộ tệp minh chứng đã xác minh.`;
    }
  }
  if (['tru-cot-5', 'tien-phong-5'].includes(category.id)) {
    category.councilWeight = .70;
    category.readerWeight = .30;
  }
}

let editorStorageState = 'idle';
let editorImportedLegacy = false;


function getEditorJudgeId(){return typeof JUDGE_PANEL_DATA!=='undefined'?JUDGE_PANEL_DATA.currentJudgeId:'demo-judge-01';}
function getEditorJudgeStorageKey(id=getEditorJudgeId()){
 if(!id||typeof id!=='string')throw Error('Missing judge identity');
 return id==='demo-judge-01'?JUDGE_MODEL.storageKey:JUDGE_MODEL.storageKey+':judge:'+encodeURIComponent(id);
}
function switchEditorDemoJudge(id){
 if(!JUDGE_PANEL_DATA.judges.some(j=>j.id===id&&j.id.startsWith('demo-')))return false;
 if(!saveState()){showToast('Không thể lưu phiếu hiện tại; chưa chuyển BGK.');return false;}
 const previous=JUDGE_PANEL_DATA.currentJudgeId,records=appState.evaluations;
 JUDGE_PANEL_DATA.currentJudgeId=id;appState.evaluations={};editorStorageState='idle';loadSavedState();
 if(editorStorageState==='error'){JUDGE_PANEL_DATA.currentJudgeId=previous;appState.evaluations=records;showToast('Không thể mở phiếu BGK.');return false;}
 if(appState.currentStep===4)appState.currentStep=2;
 renderAll();return true;
}
function createEditorEvaluation() {
  return { editionId:'travel-awards-2026',judgeId:getEditorJudgeId(), modelVersion: JUDGE_MODEL.version, criteriaQuestions: {}, scores: {}, notes: {}, evidenceTiers: {}, evidenceRefs: {}, noEvidence: {}, status: 'unscored' };
}

getOrCreateEvaluation = function (profileId, category) {
  let record = appState.evaluations[profileId];
  if(!record || typeof record!=='object' || Array.isArray(record))record=null;
  if (!record || record.modelVersion !== JUDGE_MODEL.version) {
    const old = record;
    record = createEditorEvaluation();
    if (old) {
      record.criteriaQuestions = old.criteriaQuestions || {};
      record.notes = old.notes || {};
      // The old demo automatically filled quantitative scores. Require a fresh decision.
      for (const c of category.criteria) if (!c.isQuant && Number.isInteger(old.scores?.[c.code])) record.scores[c.code] = old.scores[c.code];
      record.importedLegacy = true;
      record.status = 'draft';
    }
    appState.evaluations[profileId] = record;
  }
  for (const key of ['criteriaQuestions','scores','notes','evidenceTiers','evidenceRefs','noEvidence']) {
    if (!record[key] || typeof record[key] !== 'object' || Array.isArray(record[key])) record[key] = {};
  }
  record.editionId='travel-awards-2026';record.profileId=profileId;record.judgeId=getEditorJudgeId();
  record.judgeName=typeof JUDGE_PANEL_DATA!=='undefined'?JUDGE_PANEL_DATA.judges.find(j=>j.id===record.judgeId)?.name:record.judgeName;
  return record;
};

loadSavedState = function () {
  try {
    const current = localStorage.getItem(getEditorJudgeStorageKey());
    const raw = current || (getEditorJudgeId()==='demo-judge-01'?localStorage.getItem(JUDGE_MODEL.legacyKey):null);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed?.evaluations || typeof parsed.evaluations !== 'object' || Array.isArray(parsed.evaluations)) return;
    if(parsed.judgeId&&parsed.judgeId!==getEditorJudgeId())throw Error('Ballot owner mismatch');
    appState.evaluations=Object.fromEntries(Object.entries(parsed.evaluations).filter(([,r])=>!r?.judgeId||r.judgeId===getEditorJudgeId()));
    editorImportedLegacy = !current;
    for (const category of AWARD_CATEGORIES) for (const p of PROFILES_BY_CATEGORY[category.id] || []) {
      if (appState.evaluations[p.id]) {
        const record = getOrCreateEvaluation(p.id, category);
        if (record.status === 'completed' && !validateScoringSubmission(category,record).isValid) record.status = 'draft';
      }
    }
    editorStorageState = 'saved';
    const navigation=parsed.navigation;
    if(navigation&&getCategoryById(navigation.categoryId).id===navigation.categoryId){
      const profiles=PROFILES_BY_CATEGORY[navigation.categoryId]||[];
      if([1,2,3].includes(navigation.step)){
        appState.selectedCategoryId=navigation.categoryId;
        appState.selectedProfileId=profiles.find(p=>p.id===navigation.profileId)?.id||profiles[0]?.id||null;
        appState.currentStep=profiles.length?navigation.step:Math.min(navigation.step,2);
      }
    }
  } catch { editorStorageState = 'error'; }
};

saveState = function () {
  try {
    const navigation={step:appState.currentStep===4?2:appState.currentStep,categoryId:appState.selectedCategoryId,profileId:appState.selectedProfileId};
    localStorage.setItem(getEditorJudgeStorageKey(), JSON.stringify({editionId:'travel-awards-2026',judgeId:getEditorJudgeId(), modelVersion: JUDGE_MODEL.version, evaluations: appState.evaluations,navigation }));
    editorStorageState = 'saved';
    return true;
  } catch { editorStorageState = 'error'; return false; }
};

function getEditorCriterionIssues(c, record) {
  const issues = [];
  const score = record?.scores?.[c.code];
  if (!Number.isInteger(score) || score < 1 || score > 5) issues.push('Chưa chọn điểm');
  if (score === 5 && String(record?.notes?.[c.code] || '').trim().length < 3) issues.push('Cần giải trình lý do đánh giá Xuất sắc');
  return issues;
}

validateScoringSubmission = function (category, record) {
  const missingScores=[], missingExcellenceNotes=[], issues=[];
  for (const c of category.criteria) {
    const item = getEditorCriterionIssues(c,record);
    if (item.length) issues.push({ code:c.code, messages:item });
    if (!Number.isInteger(record?.scores?.[c.code]) || record.scores[c.code] < 1 || record.scores[c.code] > 5) missingScores.push(c.code);
    if (record?.scores?.[c.code] === 5 && String(record?.notes?.[c.code] || '').trim().length < 3) missingExcellenceNotes.push(c.code);
  }
  return { isValid:issues.length === 0, missingScores, missingExcellenceNotes, issues };
};

computeJudgeScore = function (category, record) {
  const scores = category.criteria.map(c=>record?.scores?.[c.code]).filter(s=>Number.isInteger(s) && s>=1 && s<=5);
  if (!scores.length) return null;
  const average = scores.reduce((a,b)=>a+b,0)/scores.length;
  const complete = scores.length === category.criteria.length;
  const sum=scores.reduce((a,b)=>a+b,0),maxScore=category.criteria.length*5;
  return { sum,maxScore,average, weightedScore:Number(average.toFixed(2)), score100:sum*100/(scores.length*5), answeredCount:scores.length, totalCriteria:category.criteria.length, complete };
};

function isEditorBallotCompleted(category,profileId){
  const record=appState.evaluations[profileId];
  return record?.status==='completed'&&validateScoringSubmission(category,record).isValid;
}
getCompletionStats=function(){
  const done=group=>AWARD_CATEGORIES.filter(c=>c.group===group).filter(c=>{
    const profiles=PROFILES_BY_CATEGORY[c.id]||[];
    return profiles.length>0&&profiles.every(p=>isEditorBallotCompleted(c,p.id));
  }).length;
  return {truCotDone:done('tru-cot'),tienPhongDone:done('tien-phong')};
};

submitProfileEvaluation = function () {
  const category = getCategoryById(appState.selectedCategoryId);
  const record = getOrCreateEvaluation(appState.selectedProfileId,category);
  const validation = validateScoringSubmission(category,record);
  if (!validation.isValid) {
    editorUI.criterion = validation.issues[0].code;
    editorUI.showIssues = true;
    renderAll();
    showToast('Vui lòng chấm đủ tiêu chí và giải trình các mức 5 — Xuất sắc.');
    return;
  }
  const previousStatus = record.status;
  const previousJudge={id:record.judgeId,name:record.judgeName};
  const currentJudge=typeof JUDGE_PANEL_DATA==='undefined'?null:JUDGE_PANEL_DATA.judges.find(j=>j.id===JUDGE_PANEL_DATA.currentJudgeId);
  if(currentJudge){record.judgeId=currentJudge.id;record.judgeName=currentJudge.name;}
  const previousStep=appState.currentStep;
  record.status = 'completed';
  appState.currentStep=4;
  if (!saveState()) {
    record.status = previousStatus;
    if(previousJudge.id===undefined)delete record.judgeId;else record.judgeId=previousJudge.id;
    if(previousJudge.name===undefined)delete record.judgeName;else record.judgeName=previousJudge.name;
    appState.currentStep=previousStep;
    updateEditorSummary();
    showToast('Chưa lưu được phiếu. Vui lòng kiểm tra quyền lưu trữ của trình duyệt.');
    return;
  }
  renderAll();
  window.scrollTo({top:0,behavior:'smooth'});
};
