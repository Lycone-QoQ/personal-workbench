/**
 * 备忘录&灵感速记模块
 */
let currentMemosTab = 'memo-list';

async function renderMemosModule() {
  document.querySelectorAll('#memosTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#memosTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMemosTab = tab.dataset.tab;
      renderMemosTab(currentMemosTab);
    };
  });
  renderMemosTab(currentMemosTab);
}

async function renderMemosTab(tab) {
  const container = document.getElementById('memosTabContent');
  switch(tab) {
    case 'memo-list': renderMemoList(container); break;
    case 'memo-trash': renderMemoTrash(container); break;
  }
}

async function renderMemoList(container) {
  const memos = await DB.getAll('memos');
  const tags = [...new Set(memos.map(m => m.tag).filter(Boolean))];

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>新增备忘</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>内容</label>
          <textarea class="form-textarea" id="memoContent" placeholder="记录灵感..." rows="4"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>标签</label>
            <select class="form-select" id="memoTag">
              <option value="">选择标签</option>
              <option>工作</option><option>学习</option><option>生活</option><option>灵感</option>
              <option>教资</option><option>英语</option><option>品牌</option><option>创作</option>
              <option>其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>提醒时间</label>
            <input type="datetime-local" class="form-input" id="memoReminder">
          </div>
          <div class="form-group">
            <label>手绘配图</label>
            <button class="btn btn-secondary" onclick="doodleBoard.open((dataUrl)=>{document.getElementById('memoDoodle').value=dataUrl;})" style="width:100%;">🎨 涂鸦</button>
            <input type="hidden" id="memoDoodle">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveMemo()">💾 保存备忘</button>
        <p style="margin-top:8px;font-size:0.82rem;color:var(--text-muted);">
          💡 提示：也可直接使用语音转文字功能（需要浏览器支持语音识别）
          <button class="btn btn-sm btn-secondary" onclick="startVoiceInput()" style="margin-left:8px;">🎤 语音输入</button>
        </p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>备忘录列表</h3>
        <select class="form-select" id="memoTagFilter" onchange="renderMemosTab('memo-list')" style="max-width:120px;">
          <option value="all">全部标签</option>
          ${tags.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="card-body">
        <div id="memoList">
          ${renderMemoItems(memos)}
        </div>
      </div>
    </div>
  `;

  // 检查过期提醒
  setTimeout(() => {
    memos.forEach(m => {
      if (m.reminder && !m.reminded && new Date(m.reminder) < new Date()) {
        sendLocalNotification('备忘提醒', m.content?.substring(0, 50));
        m.reminded = true;
        DB.put('memos', m);
      }
    });
  }, 2000);
}

function renderMemoItems(memos) {
  const tagFilter = document.getElementById('memoTagFilter')?.value;
  let filtered = memos.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  if (tagFilter && tagFilter !== 'all') filtered = filtered.filter(m => m.tag === tagFilter);

  if (filtered.length === 0) return '<p class="empty-hint">暂无备忘</p>';

  return filtered.map(m => `
    <div class="card" style="margin-bottom:10px;padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:start;">
        <div style="flex:1;">
          <p style="white-space:pre-wrap;">${escapeHtml(m.content || '')}</p>
          <div style="margin:8px 0;display:flex;gap:6px;flex-wrap:wrap;">
            ${m.tag ? `<span class="tag">#${m.tag}</span>` : ''}
            ${m.reminder ? `<span class="tag star-2">⏰ ${new Date(m.reminder).toLocaleString('zh-CN')}</span>` : ''}
            ${m.reminded ? '<span class="tag" style="background:var(--accent-light)">已提醒</span>' : ''}
          </div>
          ${m.doodle ? `<img src="${m.doodle}" style="max-width:150px;border-radius:8px;margin-top:6px;" onerror="this.style.display='none'">` : ''}
          <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${new Date(m.createdAt).toLocaleString('zh-CN')}</p>
        </div>
        <button class="btn-icon" onclick="moveToTrash(${m.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function saveMemo() {
  const content = document.getElementById('memoContent').value;
  if (!content.trim()) { showToast('请输入内容', 'error'); return; }

  await DB.add('memos', {
    content,
    tag: document.getElementById('memoTag').value,
    reminder: document.getElementById('memoReminder').value || null,
    doodle: document.getElementById('memoDoodle').value || null,
    reminded: false,
    createdAt: new Date().toISOString()
  });

  showToast('备忘已保存', 'success');
  addCoins(5);
  document.getElementById('memoContent').value = '';
  document.getElementById('memoReminder').value = '';
  document.getElementById('memoDoodle').value = '';
  renderMemosTab('memo-list');
}

async function moveToTrash(id) {
  const memo = await DB.get('memos', id);
  if (!memo) return;
  await DB.delete('memos', id);
  // 加入回收站，30天后自动清理
  await DB.add('memo_trash', {
    ...memo,
    originalId: id,
    trashedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });
  showToast('已移至回收站（30天后自动删除）', 'success');
  renderMemosTab('memo-list');
}

// 语音输入
function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('浏览器不支持语音识别，请使用Chrome浏览器', 'warning');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    document.getElementById('memoContent').value += text;
    showToast('语音已识别', 'success');
  };

  recognition.onerror = () => showToast('语音识别失败，请重试', 'error');
  recognition.start();
  showToast('正在聆听...', 'info');
}

// ---- 回收站 ----
async function renderMemoTrash(container) {
  const trash = await DB.getAll('memo_trash');
  const validTrash = trash.filter(t => new Date(t.expiresAt) > new Date());

  // 清理过期
  const expired = trash.filter(t => new Date(t.expiresAt) <= new Date());
  for (const item of expired) {
    await DB.delete('memo_trash', item.id);
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>🗑️ 回收站（30天内可恢复）</h3></div>
      <div class="card-body">
        ${validTrash.length === 0 ? '<p class="empty-hint">回收站为空</p>' : validTrash.map(t => `
          <div class="card" style="margin-bottom:10px;padding:14px;">
            <p style="white-space:pre-wrap;">${escapeHtml(t.content || '').substring(0, 200)}</p>
            <p style="font-size:0.78rem;color:var(--text-muted);">
              删除时间: ${new Date(t.trashedAt).toLocaleString('zh-CN')} |
              剩余: ${Math.ceil((new Date(t.expiresAt) - new Date())/(1000*60*60*24))}天
            </p>
            <button class="btn btn-sm btn-primary" onclick="restoreMemo(${t.originalId})">🔄 恢复</button>
            <button class="btn btn-sm btn-danger" onclick="permanentlyDeleteMemo(${t.id})">🗑️ 永久删除</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function restoreMemo(originalId) {
  const trashItems = await DB.getAll('memo_trash');
  const item = trashItems.find(t => t.originalId === originalId);
  if (item) {
    const { id, originalId: oi, trashedAt, expiresAt, ...memoData } = item;
    await DB.add('memos', { ...memoData, createdAt: new Date().toISOString() });
    await DB.delete('memo_trash', item.id);
    showToast('已恢复', 'success');
    renderMemosTab('memo-trash');
  }
}

async function permanentlyDeleteMemo(id) {
  if (!confirm('确定永久删除？此操作无法恢复！')) return;
  await DB.delete('memo_trash', id);
  showToast('已永久删除', 'success');
  renderMemosTab('memo-trash');
}

window.saveMemo = saveMemo;
window.moveToTrash = moveToTrash;
window.restoreMemo = restoreMemo;
window.permanentlyDeleteMemo = permanentlyDeleteMemo;
window.startVoiceInput = startVoiceInput;
