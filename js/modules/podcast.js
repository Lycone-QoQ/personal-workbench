/**
 * 播客管理模块
 */
let currentPodcastTab = 'pod-list';

async function renderPodcastModule() {
  document.querySelectorAll('#podcastTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#podcastTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentPodcastTab = tab.dataset.tab;
      renderPodcastTab(currentPodcastTab);
    };
  });
  renderPodcastTab(currentPodcastTab);
}

async function renderPodcastTab(tab) {
  const container = document.getElementById('podcastTabContent');
  switch(tab) {
    case 'pod-list': renderPodcastList(container); break;
    case 'pod-stats': renderPodcastStats(container); break;
  }
}

async function renderPodcastList(container) {
  const podcasts = await DB.getAll('podcasts');
  const todo = podcasts.filter(p => !p.completed);
  const done = podcasts.filter(p => p.completed);

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#fff7e6,#ffe9b8);border-color:#f0c674;">
      <div class="card-body" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:200px;">
          <h3 style="margin:0 0 6px;">🎧 小宇宙播客</h3>
          <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;">点击自动跳转小宇宙 App，发现并收听播客节目</p>
        </div>
        <a href="https://www.xiaoyuzhoufm.com/podcast/625635587bfca4e73e990703" target="_blank" rel="noopener" class="btn btn-primary" style="white-space:nowrap;">打开小宇宙 →</a>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <h3>添加播客</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>播客名称</label>
            <input type="text" class="form-input" id="podTitle" placeholder="播客节目名称">
          </div>
          <div class="form-group">
            <label>单集标题</label>
            <input type="text" class="form-input" id="podEpisode" placeholder="单集标题">
          </div>
          <div class="form-group">
            <label>链接/平台</label>
            <input type="text" class="form-input" id="podUrl" placeholder="播客链接">
          </div>
          <div class="form-group">
            <label>时长（分钟）</label>
            <input type="number" class="form-input" id="podDuration" value="30" min="1">
          </div>
        </div>
        <button class="btn btn-primary" onclick="addPodcast()">📌 添加到清单</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <h3>📋 待收听 (${todo.length})</h3>
      </div>
      <div class="card-body">
        ${todo.length === 0 ? '<p class="empty-hint">暂无待听播客</p>' : todo.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).map(p => `
          <div class="card" style="margin-bottom:8px;padding:12px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div style="flex:1;">
                <h4>${escapeHtml(p.title)}</h4>
                <p style="font-size:0.85rem;color:var(--text-secondary);">📻 ${escapeHtml(p.episode || '')} · ${p.duration || 0}分钟</p>
                ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" style="font-size:0.82rem;margin-right:10px;">${p.url.includes('xiaoyuzhou') ? '🎧 在小宇宙打开' : '🔗 打开链接'}</a>` : ''}
                <a href="https://www.xiaoyuzhoufm.com/search?q=${encodeURIComponent(p.title)}" target="_blank" rel="noopener" style="font-size:0.82rem;">🎧 小宇宙搜索</a>
                <button class="btn btn-sm btn-primary" onclick="addPodcastNote(${p.id})" style="margin-top:8px;">✍️ 添加笔记</button>
                <button class="btn btn-sm btn-success" onclick="markPodDone(${p.id})" style="margin-top:8px;">✅ 标记已听</button>
              </div>
              <button class="btn-icon" onclick="deletePodcast(${p.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>✅ 已收听 (${done.length})</h3>
      </div>
      <div class="card-body">
        ${done.length === 0 ? '<p class="empty-hint">还没有完成收听的播客</p>' : done.sort((a,b) => (b.completedAt||'').localeCompare(a.completedAt||'')).slice(0, 20).map(p => `
          <div class="card" style="margin-bottom:8px;padding:12px;">
            <div style="display:flex;justify-content:space-between;align-items:start;">
              <div style="flex:1;">
                <h4>${escapeHtml(p.title)}</h4>
                <p style="font-size:0.85rem;color:var(--text-secondary);">📻 ${escapeHtml(p.episode || '')} · ${p.duration || 0}分钟</p>
                ${p.completedAt ? `<p style="font-size:0.78rem;color:var(--text-muted);">收听于 ${p.completedAt.split('T')[0]}</p>` : ''}
                ${p.note ? `<p style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">📝 ${escapeHtml(p.note).substring(0, 150)}</p>` : ''}
              </div>
              <button class="btn-icon" onclick="deletePodcast(${p.id})">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function addPodcast() {
  const title = document.getElementById('podTitle').value;
  const episode = document.getElementById('podEpisode').value;
  const url = document.getElementById('podUrl').value;
  const duration = parseInt(document.getElementById('podDuration').value) || 30;

  if (!title) { showToast('请输入播客名称', 'error'); return; }

  await DB.add('podcasts', {
    title, episode: episode || '', url: url || '', duration,
    completed: false, completedAt: null, note: '',
    createdAt: new Date().toISOString()
  });
  showToast('播客已添加到清单', 'success');
  addCoins(3);
  renderPodcastTab('pod-list');
}

async function markPodDone(id) {
  const podcast = await DB.get('podcasts', id);
  if (podcast) {
    podcast.completed = true;
    podcast.completedAt = new Date().toISOString();
    await DB.put('podcasts', podcast);
    showToast('已标记为已收听', 'success');
    addCoins(10);
    renderPodcastTab('pod-list');
  }
}

async function addPodcastNote(id) {
  const podcast = await DB.get('podcasts', id);
  if (!podcast) return;
  const currentNote = podcast.note || '';
  const note = prompt('添加时间戳笔记：', currentNote);
  if (note !== null) {
    podcast.note = note;
    await DB.put('podcasts', podcast);
    showToast('笔记已保存', 'success');
    renderPodcastTab('pod-list');
  }
}

async function deletePodcast(id) {
  if (!confirm('确定删除？')) return;
  await DB.delete('podcasts', id);
  showToast('已删除', 'success');
  renderPodcastTab('pod-list');
}

// ---- 收听统计 ----
async function renderPodcastStats(container) {
  const podcasts = await DB.getAll('podcasts');
  const done = podcasts.filter(p => p.completed);
  const totalMinutes = done.reduce((s, p) => s + (p.duration || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="card" style="text-align:center;padding:20px;">
        <h3>已收听</h3>
        <div style="font-size:2.5rem;font-weight:700;">${done.length}</div>
        <div style="color:var(--text-muted);">集</div>
      </div>
      <div class="card" style="text-align:center;padding:20px;">
        <h3>总收听时长</h3>
        <div style="font-size:2.5rem;font-weight:700;">${totalHours}</div>
        <div style="color:var(--text-muted);">小时</div>
      </div>
      <div class="card" style="text-align:center;padding:20px;">
        <h3>待收听</h3>
        <div style="font-size:2.5rem;font-weight:700;">${podcasts.length - done.length}</div>
        <div style="color:var(--text-muted);">集</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;">
      <div class="card-header"><h3>最近收听的播客</h3></div>
      <div class="card-body">
        ${done.sort((a,b) => (b.completedAt||'').localeCompare(a.completedAt||'')).slice(0, 10).map(p => `
          <div class="stat-row">
            <span>🎧 ${escapeHtml(p.title)} - ${escapeHtml(p.episode || '')}</span>
            <span style="font-size:0.82rem;color:var(--text-muted);">${(p.duration||0)}分钟</span>
          </div>
        `).join('') || '<p class="empty-hint">还没有收听完的播客</p>'}
      </div>
    </div>
  `;
}

window.addPodcast = addPodcast;
window.markPodDone = markPodDone;
window.addPodcastNote = addPodcastNote;
window.deletePodcast = deletePodcast;
