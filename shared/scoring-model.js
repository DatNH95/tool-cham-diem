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

function createEditorEvaluation() {
  return { modelVersion: JUDGE_MODEL.version, criteriaQuestions: {}, scores: {}, notes: {}, evidenceTiers: {}, evidenceRefs: {}, noEvidence: {}, status: 'unscored' };
}

getOrCreateEvaluation = function (profileId, category) {
  let record = appState.evaluations[profileId];
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
  return record;
};

loadSavedState = function () {
  try {
    const current = localStorage.getItem(JUDGE_MODEL.storageKey);
    const raw = current || localStorage.getItem(JUDGE_MODEL.legacyKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed?.evaluations || typeof parsed.evaluations !== 'object' || Array.isArray(parsed.evaluations)) return;
    appState.evaluations = parsed.evaluations;
    editorImportedLegacy = !current;
    for (const category of AWARD_CATEGORIES) for (const p of PROFILES_BY_CATEGORY[category.id] || []) {
      if (appState.evaluations[p.id]) {
        const record = getOrCreateEvaluation(p.id, category);
        if (record.status === 'completed' && !validateScoringSubmission(category,record).isValid) record.status = 'draft';
      }
    }
    editorStorageState = 'saved';
  } catch { editorStorageState = 'error'; }
};

saveState = function () {
  try {
    localStorage.setItem(JUDGE_MODEL.storageKey, JSON.stringify({ modelVersion: JUDGE_MODEL.version, evaluations: appState.evaluations }));
    editorStorageState = 'saved';
    return true;
  } catch { editorStorageState = 'error'; return false; }
};

function getEditorCriterionIssues(c, record) {
  const issues = [];
  const score = record?.scores?.[c.code];
  if (!Number.isInteger(score) || score < 1 || score > 5) issues.push('Chưa chọn điểm');
  return issues;
}

validateScoringSubmission = function (category, record) {
  const missingScores=[], missingExcellenceNotes=[], issues=[];
  for (const c of category.criteria) {
    const item = getEditorCriterionIssues(c,record);
    if (item.length) issues.push({ code:c.code, messages:item });
    if (!Number.isInteger(record?.scores?.[c.code]) || record.scores[c.code] < 1 || record.scores[c.code] > 5) missingScores.push(c.code);
  }
  return { isValid:issues.length === 0, missingScores, missingExcellenceNotes, issues };
};

computeJudgeScore = function (category, record) {
  const scores = category.criteria.map(c=>record?.scores?.[c.code]).filter(s=>Number.isInteger(s) && s>=1 && s<=5);
  if (!scores.length) return null;
  const average = scores.reduce((a,b)=>a+b,0)/scores.length;
  const complete = scores.length === category.criteria.length;
  return { average, weightedScore:Number(average.toFixed(2)), score100:average*20, answeredCount:scores.length, totalCriteria:category.criteria.length, complete };
};

submitProfileEvaluation = function () {
  const category = getCategoryById(appState.selectedCategoryId);
  const record = getOrCreateEvaluation(appState.selectedProfileId,category);
  const validation = validateScoringSubmission(category,record);
  if (!validation.isValid) {
    editorUI.criterion = validation.issues[0].code;
    editorUI.showIssues = true;
    renderAll();
    showToast('Vui lòng chấm đủ điểm 1–5 cho tất cả tiêu chí.');
    return;
  }
  const previousStatus = record.status;
  record.status = 'completed';
  if (!saveState()) {
    record.status = previousStatus;
    updateEditorSummary();
    showToast('Chưa lưu được phiếu. Vui lòng kiểm tra quyền lưu trữ của trình duyệt.');
    return;
  }
  appState.currentStep = 4;
  renderAll();
  window.scrollTo({top:0,behavior:'smooth'});
};
