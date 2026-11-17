// Adapter contract: populated by authenticated editor APIs; empty in this static prototype.
// Do not derive other judges' submitted states from the current browser's local ballot.
const JUDGE_PANEL_DATA={currentJudgeId:'demo-judge-01',judges:[
  'Nguyễn Minh Anh','Trần Hoàng Nam','Lê Thu Hà','Phạm Quốc Huy','Hoàng Ngọc Linh',
  'Vũ Đức Thành','Đặng Thanh Mai','Bùi Anh Tuấn','Đỗ Phương Thảo','Ngô Minh Quân',
  'Dương Hải Yến','Lý Quang Minh','Đinh Khánh Chi'
].map((name,index)=>({id:`demo-judge-${String(index+1).padStart(2,'0')}`,name})),ballotsByProfile:{}};
// Tab-local preview identity; integration must supply identity from authenticated editor.
try{const id=sessionStorage.getItem('vta2026_demo_judge');if(JUDGE_PANEL_DATA.judges.some(j=>j.id===id))JUDGE_PANEL_DATA.currentJudgeId=id;}catch{}
function renderJudgePanel(profile){
  const t=escapeHtml,judges=JUDGE_PANEL_DATA.judges;
  const demo=judges.length===13&&judges.every(j=>j.id?.startsWith('demo-'));
  // Authorized mock states for preview only. Never submit them as actual judge ballots.
  const mock=demo?judges.map((j,i)=>({judgeId:j.id,status:i>=1&&i<=5?'submitted':i===6?'in_progress':'not_started'})):[];
  if(demo){const own=mock.find(b=>b.judgeId===JUDGE_PANEL_DATA.currentJudgeId);const record=appState.evaluations[profile.id];if(own)own.status=record?.status==='completed'?'submitted':Object.keys(record?.scores||{}).length?'in_progress':'not_started';}
  if(demo)for(const entry of mock){try{
    const record=entry.judgeId===getEditorJudgeId()?appState.evaluations[profile.id]:JSON.parse(localStorage.getItem(getEditorJudgeStorageKey(entry.judgeId))||'null')?.evaluations?.[profile.id];
    if(record)entry.status=record.status==='completed'?'submitted':Object.keys(record.scores||{}).length?'in_progress':'not_started';
  }catch{}}
  const ballots=JUDGE_PANEL_DATA.ballotsByProfile[profile.id]||mock;
  const loaded=demo||Array.isArray(JUDGE_PANEL_DATA.ballotsByProfile[profile.id]);
  const roster=Array.from({length:13},(_,i)=>judges[i]||{id:null,name:`BGK ${String(i+1).padStart(2,'0')}`});
  const submitted=judges.filter(j=>ballots.some(b=>b.judgeId===j.id&&b.status==='submitted')).length;
  return `<section class="judge-council" aria-labelledby="judge-council-title"><div class="judge-council-heading"><div><h2 id="judge-council-title">Hội đồng chấm hồ sơ</h2><p>${t(profile.code)} · Phiếu riêng cho từng BGK</p></div><span class="judge-council-count">${loaded&&judges.length===13?`${submitted}/13 đã chấm`:'13 tài khoản · Chưa đồng bộ'}</span></div><details class="judge-council-details" data-workspace-detail="council"><summary>Xem danh sách & trạng thái 13 BGK</summary><ul class="judge-council-roster">${roster.map(j=>{
    const ballot=j.id?ballots.find(b=>b.judgeId===j.id):null;
    const status=ballot?.status==='submitted'?'Đã chấm':ballot?.status==='not_started'?'Chưa chấm':ballot?.status==='in_progress'?'Đang chấm':'Chưa đồng bộ';
    const own=j.id&&j.id===JUDGE_PANEL_DATA.currentJudgeId;
    return `<li class="${own?'is-current-judge':''}"><span class="judge-council-avatar" aria-hidden="true">${t((j.name||'?').trim().split(/\s+/).slice(-2).map(p=>p[0]).join('').toUpperCase())}</span><div><strong>${t(j.name)}${own?'<small>Bạn</small>':''}</strong><span class="judge-council-state ${ballot?.status==='submitted'?'is-submitted':''}">${status}</span></div></li>`;
  }).join('')}</ul><p class="judge-council-note">${judges.length?'Chỉ hiển thị tiến độ; điểm và giải trình của từng BGK được giữ riêng.':'Chờ danh sách tên BGK và dữ liệu trạng thái từ hệ thống editor.'}</p></details><div class="judge-council-owner"><span>Người chấm phiếu này</span><strong>${t(judges.find(j=>j.id===JUDGE_PANEL_DATA.currentJudgeId)?.name||'Chưa kết nối tài khoản BGK')}</strong>${demo?`<label>Chuyển BGK thử nghiệm <select aria-label="Chuyển BGK thử nghiệm" onchange="switchEditorDemoJudge(this.value)">${judges.map(j=>`<option value="${t(j.id)}" ${j.id===getEditorJudgeId()?'selected':''}>${t(j.name)}</option>`).join('')}</select></label>`:''}</div></section>`;
}
