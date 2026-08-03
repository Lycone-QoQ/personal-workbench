/**
 * 日记随笔模块 - 富文本编辑、情绪标签、时间线、加密、导出
 */
let currentDiaryTab = 'diary-write';
let diaryLockPassword = null;

async function renderDiaryModule() {
  document.querySelectorAll('#diaryTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#diaryTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentDiaryTab = tab.dataset.tab;
      renderDiaryTab(currentDiaryTab);
    };
  });
  renderDiaryTab(currentDiaryTab);
}

async function renderDiaryTab(tab) {
  const container = document.getElementById('diaryTabContent');
  switch(tab) {
    case 'diary-write': renderDiaryWrite(container); break;
    case 'diary-list': renderDiaryTimeline(container); break;
  }
}

async function renderDiaryWrite(container) {
  const emotions = ['😊 开心', '😢 难过', '😤 生气', '😌 平静', '🥰 幸福', '😰 焦虑', '🤔 思考', '💪 励志', '🌟 感恩', '😴 疲惫'];

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>写日记</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>日期</label>
          <input type="date" class="form-input" id="diaryDate" value="${new Date().toISOString().split('T')[0]}" style="max-width:200px;">
        </div>
        <div class="form-group">
          <label>标题</label>
          <input type="text" class="form-input" id="diaryTitle" placeholder="给今天的日记起个标题吧...">
        </div>
        <div class="form-group">
          <label>情绪</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="diaryEmotions">
            ${emotions.map(e => `<span class="tag" style="cursor:pointer;" data-emotion="${e}" onclick="selectDiaryEmotion(this)">${e}</span>`).join('')}
          </div>
          <input type="hidden" id="diaryEmotionVal">
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea class="form-textarea" id="diaryContent" placeholder="今天发生了什么..." rows="10"></textarea>
        </div>
        <div class="form-group">
          <label>图片（粘贴图片URL或点击涂鸦添加手绘）</label>
          <div style="display:flex;gap:8px;">
            <input type="text" class="form-input" id="diaryImage" placeholder="图片URL（可选）" style="max-width:400px;">
            <button class="btn btn-secondary" onclick="doodleBoard.open((dataUrl) => { document.getElementById('diaryImage').value = dataUrl; })">🎨 涂鸦</button>
          </div>
        </div>
        <div class="form-group">
          <label>日记锁密码（留空不加密）</label>
          <input type="password" class="form-input" id="diaryPassword" placeholder="设置密码保护" style="max-width:250px;">
        </div>
        <button class="btn btn-primary" onclick="saveDiary()">💾 保存日记</button>
      </div>
    </div>
  `;
}

function selectDiaryEmotion(el) {
  document.querySelectorAll('#diaryEmotions .tag').forEach(t => t.classList.remove('star-2'));
  el.classList.add('star-2');
  document.getElementById('diaryEmotionVal').value = el.dataset.emotion;
}

async function saveDiary() {
  const title = document.getElementById('diaryTitle').value;
  const content = document.getElementById('diaryContent').value;
  const emotion = document.getElementById('diaryEmotionVal').value;
  const image = document.getElementById('diaryImage').value;
  const password = document.getElementById('diaryPassword').value;
  const date = document.getElementById('diaryDate').value;

  if (!title && !content) { showToast('请输入标题或内容', 'error'); return; }

  await DB.add('diary_entries', {
    title, content, emotion, image, date,
    encrypted: !!password,
    passwordHash: password ? await hashPassword(password) : '',
    createdAt: new Date().toISOString()
  });

  showToast('日记已保存', 'success');
  addCoins(10);

  // 清空表单
  document.getElementById('diaryTitle').value = '';
  document.getElementById('diaryContent').value = '';
  document.getElementById('diaryImage').value = '';
  document.getElementById('diaryPassword').value = '';
  document.getElementById('diaryEmotionVal').value = '';
  document.querySelectorAll('#diaryEmotions .tag').forEach(t => t.classList.remove('star-2'));
}

async function hashPassword(pwd) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pwd);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ---- 时间线 ----
async function renderDiaryTimeline(container) {
  const entries = await DB.getAll('diary_entries');
  const sorted = entries.sort((a,b) => (b.date||b.createdAt||'').localeCompare(a.date||a.createdAt||''));

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>日记时间线</h3>
        <button class="btn btn-secondary btn-sm" onclick="exportDiary('txt')">导出TXT</button>
        <button class="btn btn-secondary btn-sm" onclick="exportDiary('pdf')" style="margin-left:4px;">导出PDF</button>
      </div>
      <div class="card-body">
        ${sorted.length === 0 ? '<p class="empty-hint">还没有日记，开始写吧~</p>' : sorted.map((entry, i) => {
          const isEncrypted = entry.encrypted && entry.passwordHash;
          return `
            <div class="card" style="margin-bottom:12px;padding:14px;position:relative;" id="diary-${entry.id}">
              ${isEncrypted ? `
                <div class="lock-overlay" id="lock-${entry.id}">
                  <span style="font-size:2rem;">🔒</span>
                  <p>此日记已加密</p>
                  <input type="password" class="form-input" id="unlockPwd-${entry.id}" placeholder="输入密码" style="max-width:200px;">
                  <button class="btn btn-primary btn-sm" onclick="unlockDiary(${entry.id},'${entry.passwordHash}')">解锁</button>
                </div>
              ` : ''}
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;" id="diaryContent-${entry.id}">
                  <h4>${escapeHtml(entry.title || '无标题')}</h4>
                  <p style="font-size:0.82rem;color:var(--text-muted);">${entry.date || entry.createdAt?.split('T')[0]} · ${entry.emotion || '未标记'}</p>
                  ${entry.image ? `<img src="${entry.image}" style="max-width:200px;border-radius:8px;margin:8px 0;" onerror="this.style.display='none'">` : ''}
                  <p style="margin-top:6px;color:var(--text-secondary);white-space:pre-wrap;">${isEncrypted ? '🔒 已加密' : escapeHtml(entry.content || '').substring(0, 300)}</p>
                </div>
                <button class="btn-icon" onclick="deleteDiary(${entry.id})">🗑️</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function unlockDiary(id, expectedHash) {
  const pwd = document.getElementById(`unlockPwd-${id}`).value;
  const hash = await hashPassword(pwd);
  if (hash === expectedHash) {
    document.getElementById(`lock-${id}`).style.display = 'none';
    const entry = await DB.get('diary_entries', id);
    if (entry) {
      document.getElementById(`diaryContent-${id}`).innerHTML = `
        <h4>${escapeHtml(entry.title || '无标题')}</h4>
        <p style="font-size:0.82rem;color:var(--text-muted);">${entry.date || ''} · ${entry.emotion || '未标记'}</p>
        ${entry.image ? `<img src="${entry.image}" style="max-width:200px;border-radius:8px;margin:8px 0;">` : ''}
        <p style="margin-top:6px;color:var(--text-secondary);white-space:pre-wrap;">${escapeHtml(entry.content || '')}</p>
      `;
    }
    showToast('日记已解锁', 'success');
  } else {
    showToast('密码错误', 'error');
  }
}

async function deleteDiary(id) {
  if (!confirm('确定删除这篇日记？')) return;
  await DB.delete('diary_entries', id);
  showToast('日记已删除', 'success');
  renderDiaryTab('diary-list');
}

async function exportDiary(format) {
  const entries = await DB.getAll('diary_entries');
  const sorted = entries.sort((a,b) => (b.date||b.createdAt||'').localeCompare(a.date||a.createdAt||''));

  if (sorted.length === 0) { showToast('没有日记可导出', 'warning'); return; }

  let content = '';
  sorted.forEach(entry => {
    content += `【${entry.date || entry.createdAt?.split('T')[0]}】${entry.title || '无标题'}\n`;
    content += `情绪: ${entry.emotion || '未标记'}\n`;
    content += `${entry.content || ''}\n`;
    content += '---\n\n';
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diary_export_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('日记已导出', 'success');
}

window.saveDiary = saveDiary;
window.selectDiaryEmotion = selectDiaryEmotion;
window.deleteDiary = deleteDiary;
window.unlockDiary = unlockDiary;
window.exportDiary = exportDiary;
