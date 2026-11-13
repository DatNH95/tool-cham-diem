// Independent local ballot: select scores only, as requested on 13.11.2026.
const editorUI={profile:null,criterion:null,mobilePanel:'scoring',showIssues:false};
const editorText=v=>escapeHtml(v??'');
function editorCurrent(){
  const category=getCategoryById(appState.selectedCategoryId),profile=getProfileById(category.id,appState.selectedProfileId),record=getOrCreateEvaluation(profile.id,category);
  if(editorUI.profile!==profile.id){editorUI.profile=profile.id;editorUI.criterion=category.criteria.find(c=>getEditorCriterionIssues(c,record).length)?.code||category.criteria[0].code;editorUI.showIssues=false;}
  const criterion=category.criteria.find(c=>c.code===editorUI.criterion)||category.criteria[0];
  return {category,profile,record,criterion,index:category.criteria.indexOf(criterion)};
}
function editorChooseCriterion(code){editorUI.criterion=code;editorUI.showIssues=false;renderAll();}
function editorMoveCriterion(offset){const {category,index}=editorCurrent();if(category.criteria[index+offset])editorChooseCriterion(category.criteria[index+offset].code);}
function editorSwitchPanel(panel){editorUI.mobilePanel=panel;renderAll();}
function editorStoreChange(){editorCurrent().record.status='draft';saveState();}
handleCriterionNoteInput=function(code,value){
  editorCurrent().record.notes[code]=value;editorStoreChange();updateEditorSummary();
};
selectCriterionScore=function(code,value){
  const {record}=editorCurrent();
  if(!Number.isInteger(value)||value<1||value>5)return;
  record.scores[code]=value;editorStoreChange();renderAll();
};
function editorCriterionFeedback(criterion,record){
  return getEditorCriterionIssues(criterion,record).filter(message=>
    !message.startsWith('Vượt trần') && (editorUI.showIssues || !message.startsWith('Chưa'))
  ).join(' · ');
}
function updateEditorSummary(){
  if(appState.currentStep!==3)return;
  const {category,record,criterion}=editorCurrent(),validation=validateScoringSubmission(category,record),ready=category.criteria.length-validation.issues.length;
  const update=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
  update('editor-ready-count',`${ready}/${category.criteria.length} tiêu chí hợp lệ`);
  update('editor-ballot-status',record.status==='completed'?'Đã hoàn tất phiếu':'Đang chấm độc lập');
  update('editor-storage-status',editorStorageState==='error'?'Chưa lưu được · Dữ liệu còn trong phiên':'Đã lưu nháp trên trình duyệt');
  const button=document.getElementById('editor-complete');if(button)button.disabled=!validation.isValid;
  const progress=document.getElementById('editor-progress');if(progress)progress.value=ready;
  for(const c of category.criteria){const chip=document.querySelector(`[data-editor-criterion="${c.code}"]`);if(chip){const valid=!getEditorCriterionIssues(c,record).length;chip.classList.toggle('is-ready',valid);chip.setAttribute('aria-label',`${c.code} · ${c.name} · ${valid?'Đủ thông tin':'Cần hoàn thiện'}`);}}
  const feedback=editorCriterionFeedback(criterion,record);
  update('editor-criterion-status',feedback);
  const status=document.getElementById('editor-criterion-status');if(status)status.hidden=!feedback;
}
function renderEditorRules(){return `<details class="editor-rules"><summary>Hướng dẫn chấm & công thức</summary><div class="editor-rules-content">
  <p><strong>Mức Xuất sắc:</strong> điểm 5 cần giải trình lý do trước khi hoàn tất phiếu.</p>
  <p><strong>Chấm độc lập:</strong> không hiển thị điểm giám khảo khác trong phiếu này.</p>
  <p><strong>Điểm cá nhân:</strong> trung bình cộng các tiêu chí ÷ 5 × 100. Chỉ hiện kết quả khi chấm đủ; các tiêu chí có vai trò ngang nhau.</p>
  <p><strong>Điểm cuối:</strong> điểm Hội đồng × %HĐ + điểm Độc giả × %ĐG. Phiếu cá nhân chưa có dữ liệu để tính điểm cuối.</p>
  <p><strong>Hiệu chỉnh:</strong> SD ≥ 1,0 là dấu hiệu cần rà soát sau khi đủ phiếu; không tự loại điểm trong công cụ này.</p></div></details>`;}
function renderEditorDossier(profile){
  const t=editorText;
  return `
    <section class="judge-section"><h3>Tóm tắt hồ sơ</h3><p>${t(profile.summary)}</p><dl class="judge-metrics">${profile.keyMetrics.map(m=>`<div><dt>${t(m.label)}</dt><dd>${t(m.value)}</dd></div>`).join('')}</dl></section>
    <section class="judge-section"><h3>Thành tích trong năm</h3><p>${t(profile.achievements)}</p><h3>Điểm khác biệt</h3><p>${t(profile.differentiation)}</p></section>
    <section class="judge-section"><h3>Số liệu hoạt động</h3><dl class="judge-data">${profile.operationalData.map(d=>`<div><dt>${t(d.title)}</dt><dd>${t(d.content)}</dd></div>`).join('')}</dl></section>
    <section class="judge-section"><h3>Dấu ấn nổi bật</h3><ul class="judge-highlights">${profile.highlights.map(h=>`<li>${t(h)}</li>`).join('')}</ul></section>
    <details class="judge-section" data-workspace-detail="organization"><summary>Thông tin đơn vị / cá nhân</summary><dl class="judge-data">${[['Đứng tên hồ sơ',profile.organization],['Tư cách đăng ký',profile.registerRole],['Địa điểm',profile.location],['Website',profile.website],['Fanpage',profile.fanpage],['Đơn vị đại diện',profile.representative]].map(([k,v])=>`<div><dt>${k}</dt><dd>${t(v)}</dd></div>`).join('')}</dl></details>
    <details class="judge-section" data-workspace-detail="gallery"><summary>Danh mục hình ảnh (${profile.gallery.length})</summary><ul class="judge-highlights">${profile.gallery.map(g=>`<li>${t(g.title)}</li>`).join('')}</ul><p class="judge-muted">Dữ liệu mẫu chỉ có mô tả ảnh, chưa có tệp ảnh minh chứng.</p></details>`;

}
function renderEditorBallot(category,criterion,record,index){
  const t=editorText,code=criterion.code,selected=record.scores[code];
  const anchor=JUDGE_MODEL.anchors.find(a=>a.score===selected);
  const feedback=editorCriterionFeedback(criterion,record);
  return `<div class="editor-ballot-criterion"><h3>${t(criterion.name)}</h3>
    <p class="editor-criterion-description">${t(criterion.question)}</p></div>
    <fieldset class="editor-score-field"><legend>Điểm đánh giá <span aria-hidden="true">*</span></legend>
      <div class="editor-score-options editor-rubric-options">${JUDGE_MODEL.anchors.map(a=>`<button type="button" data-score="${a.score}" aria-label="${a.score} điểm · ${a.label}" aria-describedby="editor-level-${code}-${a.score}" aria-pressed="${selected===a.score}" onclick="selectCriterionScore('${code}',${a.score})"><strong>${a.score}</strong><span class="editor-level-body"><b>${a.label}</b><span id="editor-level-${code}-${a.score}" class="editor-level-description">${t(criterion.levels?.[a.score] || a.description)}</span></span><span class="editor-level-check" aria-hidden="true">${selected===a.score?'✓':''}</span></button>`).join('')}</div></fieldset>
    ${anchor?`<div class="editor-field"><label for="editor-reason-input">${selected===5?'Giải trình vì sao đánh giá Xuất sắc <span aria-hidden="true">*</span>':'Nội dung đánh giá <small>(khuyến khích)</small>'}</label><textarea id="editor-reason-input" data-editor-field="reason" rows="3" oninput="handleCriterionNoteInput('${code}',this.value)" placeholder="${selected===5?'Nêu kết quả nổi bật và căn cứ để đánh giá 5 điểm':'Nhập nhận xét, điểm mạnh hoặc nội dung cần cải thiện'}" ${selected===5?'required':''}>${t(record.notes[code])}</textarea></div>`:''}
    <p id="editor-criterion-status" class="editor-error" aria-live="polite" ${feedback?'':'hidden'}>${t(feedback)}</p>`;
}

renderStep3Workspace=function(){
  const {category,profile,record,criterion,index}=editorCurrent(),t=editorText,profiles=PROFILES_BY_CATEGORY[category.id]||[],score=computeJudgeScore(category,record),validation=validateScoringSubmission(category,record),ready=category.criteria.length-validation.issues.length;
  return `<section class="judge-workspace" aria-label="Không gian đánh giá hồ sơ" data-profile="${t(profile.id)}" data-criterion="${criterion.code}">
    <div class="judge-toolbar"><button type="button" onclick="goToStep(2)" class="judge-back">‹ Danh sách hồ sơ</button><label class="judge-switch">Chuyển hồ sơ<select aria-label="Chuyển hồ sơ trong hạng mục" onchange="switchProfileInStep3(this.value)">${profiles.map(p=>`<option value="${t(p.id)}" ${p.id===profile.id?'selected':''}>${t(p.code)} · ${t(p.title)}${appState.evaluations[p.id]?.status==='completed'?' · Đã chấm':''}</option>`).join('')}</select></label></div>
    <header class="judge-heading"><div><p class="judge-eyebrow">${t(profile.code)} · ${t(category.name)}</p><h1>${t(profile.title)}</h1><p>${t(profile.organization)}</p></div><span id="editor-ballot-status" class="judge-status">${record.status==='completed'?'Đã hoàn tất phiếu':'Đang chấm độc lập'}</span></header>
    <div class="editor-model-bar"><p><strong>Phiếu cá nhân · Vòng chung khảo</strong><span>Dữ liệu mẫu; chưa xác minh minh chứng hoặc kết nối editor VnExpress.</span></p><span>Hội đồng ${Math.round(category.councilWeight*100)}% <i>·</i> Độc giả ${Math.round(category.readerWeight*100)}%</span></div>
    ${record.importedLegacy?'<p class="editor-import-note">Đã giữ lại điểm nhập tay từ bản cũ. Vui lòng kiểm tra lại trước khi hoàn tất; bản lưu cũ vẫn được giữ nguyên.</p>':''}
    ${renderEditorRules()}

    <div class="editor-mobile-tabs" role="group" aria-label="Chuyển vùng làm việc"><button type="button" aria-pressed="${editorUI.mobilePanel==='scoring'}" onclick="editorSwitchPanel('scoring')">Phiếu chấm</button><button type="button" aria-pressed="${editorUI.mobilePanel==='dossier'}" onclick="editorSwitchPanel('dossier')">Đọc hồ sơ & minh chứng</button></div>
    <div class="judge-columns" data-mobile-panel="${editorUI.mobilePanel}"><section class="judge-dossier judge-panel" aria-labelledby="judge-dossier-title"><div class="judge-panel-title"><h2 id="judge-dossier-title">Hồ sơ & minh chứng</h2></div><div class="judge-scroll" data-workspace-scroll="dossier">${renderEditorDossier(profile)}</div></section>
    <section class="judge-scoring judge-panel" aria-labelledby="judge-scoring-title"><div class="judge-panel-title"><div><h2 id="judge-scoring-title">Chấm điểm theo tiêu chí</h2></div><div class="judge-total"><span>Điểm giám khảo</span><strong>${score?.complete?score.score100.toFixed(1):'—'}<small>/100</small></strong>${score?.complete?`<span>TB ${score.average.toFixed(2)}/5</span>`:""}</div></div><nav class="editor-criterion-nav" aria-label="Các tiêu chí đánh giá">${category.criteria.map((c,i)=>`<button type="button" data-editor-criterion="${c.code}" class="${c.code===criterion.code?'is-active ':''}${!getEditorCriterionIssues(c,record).length?'is-ready':''}" ${c.code===criterion.code?'aria-current="step"':''} aria-label="${c.code} · ${t(c.name)} · ${!getEditorCriterionIssues(c,record).length?'Đủ thông tin':'Cần hoàn thiện'}" onclick="editorChooseCriterion('${c.code}')">${c.code}<i aria-hidden="true"></i></button>`).join('')}</nav><div class="judge-scroll" data-workspace-scroll="scoring">${renderEditorBallot(category,criterion,record,index)}</div><div class="editor-criterion-controls"><button type="button" onclick="editorMoveCriterion(-1)" ${index===0?'disabled':''}>← Trước</button><button type="button" onclick="editorMoveCriterion(1)" ${index===category.criteria.length-1?'disabled':''}>Tiếp theo →</button></div></section></div>
    <div class="editor-action-bar"><div class="editor-action-progress"><label id="editor-ready-count" for="editor-progress">${ready}/${category.criteria.length} tiêu chí hợp lệ</label><progress id="editor-progress" value="${ready}" max="${category.criteria.length}"></progress><span id="editor-storage-status" role="status">${editorStorageState==='error'?'Chưa lưu được · Dữ liệu còn trong phiên':editorStorageState==='saved'?'Đã lưu nháp trên trình duyệt':'Bản demo · Lưu nháp trên trình duyệt'}</span></div><div class="editor-actions"><button type="button" class="editor-secondary" onclick="saveEditorDraft()">Lưu nháp</button><button type="button" id="editor-complete" class="editor-primary" onclick="submitProfileEvaluation()" ${validation.isValid?'':'disabled'}>Hoàn tất phiếu chấm</button></div></div></section>`;
};
function saveEditorDraft(){showToast(saveState()?'Đã lưu phiếu trên trình duyệt này; chưa gửi lên hệ thống.':'Không thể lưu nháp. Vui lòng kiểm tra quyền lưu trữ trình duyệt.');updateEditorSummary();}
renderStep4Completed=function(){
  const {category,profile,record}=editorCurrent(),score=computeJudgeScore(category,record),t=editorText;
  if(!score?.complete||!validateScoringSubmission(category,record).isValid||record.status!=='completed')return `<section class="editor-result"><h1>Phiếu chưa hoàn tất</h1><p>Cần chấm đủ điểm các tiêu chí trước khi hoàn tất.</p><button class="editor-primary" onclick="goToStep(3)">Trở lại phiếu chấm</button></section>`;
  return `<section class="editor-result"><span class="editor-result-check" aria-hidden="true">✓</span><p class="judge-eyebrow">Phiếu cá nhân · ${t(category.name)}</p><h1>Đã hoàn tất phiếu chấm</h1><p>${t(profile.title)}</p><p class="editor-local-notice">Đã lưu trên trình duyệt này. Chưa gửi lên hệ thống VnExpress.</p><div class="editor-result-score"><span>Điểm giám khảo quy đổi</span><strong>${score.score100.toFixed(1)}<small>/100</small></strong><p>Trung bình ${score.average.toFixed(2)}/5 × 20 · ${category.criteria.length} tiêu chí</p></div><p class="editor-result-context">Điểm Hội đồng và điểm cuối của giải chờ tổng hợp các phiếu, dữ liệu độc giả và điều kiện hợp lệ. Đây là kết quả của một giám khảo.</p><details class="editor-result-details"><summary>Xem lại điểm từng tiêu chí</summary>${category.criteria.map(c=>`<article><div><strong>${t(c.code)} · ${t(c.name)}</strong><span>${record.scores[c.code]}/5</span></div>${record.notes[c.code]?.trim()?`<p><strong>${record.scores[c.code]===5?"Giải trình Xuất sắc":"Nội dung đánh giá"}:</strong> ${t(record.notes[c.code])}</p>`:""}</article>`).join('')}</details><div class="editor-result-actions"><button type="button" class="editor-secondary" onclick="goToStep(3)">Xem lại phiếu</button><button type="button" class="editor-primary" onclick="goToStep(2)">Quay lại danh sách hồ sơ</button></div></section>`;
};
renderStep2Profiles=function(){
  const category=getCategoryById(appState.selectedCategoryId),profiles=PROFILES_BY_CATEGORY[category.id]||[],t=editorText;
  const completed=profiles.filter(p=>appState.evaluations[p.id]?.status==='completed').length;
  return `<section class="editor-profile-list"><div class="editor-profile-list-heading"><div><p class="judge-eyebrow">${t(category.groupLabel)} · Danh sách hồ sơ</p><h1>${t(category.name)}</h1><p>Chọn hồ sơ để đối chiếu minh chứng và chấm độc lập.</p></div><span class="judge-status">${completed}/${profiles.length} phiếu hoàn tất</span></div><div class="editor-profile-cards">${profiles.map(p=>{
    const record=appState.evaluations[p.id],score=computeJudgeScore(category,record),done=record?.status==='completed';
    return `<article><div><p class="judge-eyebrow">${t(p.code)}</p><h2>${t(p.title)}</h2><p>${t(p.organization)}</p></div><div><span class="editor-profile-state">${done?`${score.score100.toFixed(1)}/100 · Đã hoàn tất`:record?'Đang chấm · Bản nháp':'Chưa chấm'}</span><button type="button" class="${done?'editor-secondary':'editor-primary'}" onclick="openProfileForScoring('${p.id}')">${done?'Xem lại phiếu':'Mở phiếu chấm'} →</button></div></article>`;
  }).join('')}</div><div class="editor-profile-list-footer"><button type="button" class="editor-secondary" onclick="goToStep(1)">‹ Chọn hạng mục khác</button><span>Dữ liệu mẫu · Phiếu lưu trên trình duyệt này</span></div></section>`;
};
const renderEditorBase=renderAll;
renderAll=function(){
  const current=document.querySelector('.judge-workspace'),sameProfile=appState.currentStep===3&&current?.dataset.profile===appState.selectedProfileId,sameCriterion=sameProfile&&current?.dataset.criterion===editorUI.criterion;
  const scrolls=sameProfile?[...document.querySelectorAll('[data-workspace-scroll]')].filter(e=>sameCriterion||e.dataset.workspaceScroll==='dossier').map(e=>[e.dataset.workspaceScroll,e.scrollTop]):[],details=sameProfile?[...document.querySelectorAll('[data-workspace-detail]')].filter(e=>sameCriterion||e.closest('.judge-dossier')).map(e=>[e.dataset.workspaceDetail,e.open]):[];
  const active=sameCriterion?document.activeElement:null,field=active?.dataset?.editorField,action=active?.getAttribute('onclick');
  renderEditorBase();document.body.classList.toggle('editor-evaluation',appState.currentStep===3);
  for(const [key,open]of details){const e=document.querySelector(`[data-workspace-detail="${key}"]`);if(e)e.open=open;}
  for(const [key,top]of scrolls){const e=document.querySelector(`[data-workspace-scroll="${key}"]`);if(e)e.scrollTop=top;}
  const target=field?document.querySelector(`[data-editor-field="${field}"]`):action?[...document.querySelectorAll('button[onclick]')].find(e=>e.getAttribute('onclick')===action):null;target?.focus({preventScroll:true});
};
