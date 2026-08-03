/**
 * 时政资讯模块 — 半月谈风格 + 人民日报内容
 * 标签：要闻速览 / 评论解读 / 政策文件 / 每日金句 / 我的收藏
 */
let politicsTab = 'headlines';
let politicsBookmarks = new Set();

async function renderPoliticsModule() {
  // 加载收藏列表
  const bookmarks = await DB.getAll('politics_bookmarks');
  politicsBookmarks = new Set(bookmarks.map(b => b.itemId));

  // 绑定标签事件
  document.querySelectorAll('#politicsTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#politicsTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      politicsTab = tab.dataset.tab;
      renderPoliticsTab();
    };
  });

  renderPoliticsTab();
}

async function renderPoliticsTab() {
  const container = document.getElementById('politicsTabContent');
  if (!container) return;

  switch(politicsTab) {
    case 'headlines': await renderHeadlines(container); break;
    case 'comments': await renderComments(container); break;
    case 'policy': await renderPolicy(container); break;
    case 'quotes': await renderQuotes(container); break;
    case 'bookmarks': await renderBookmarksTab(container); break;
  }
}

// ---- 通用数据获取 ----
async function getPoliticsByCategory(category) {
  const all = await DB.getAll('politics');
  return all.filter(i => i.category === category).sort((a,b) =>
    (b.stars||0) - (a.stars||0) || (b.date||'').localeCompare(a.date||'')
  );
}

// ---- 卡片渲染 ----
function renderPoliticsCard(item, idx) {
  const isBookmarked = politicsBookmarks.has(item.id);
  const starsHtml = item.stars ? '⭐'.repeat(item.stars) : '';
  const tagsHtml = (item.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const summary = item.summary ? `<p class="politics-summary">${escapeHtml(item.summary)}</p>` : '';
  const keyPointsHtml = item.keyPoints ? item.keyPoints.map(k => `<span class="politics-keyword">#${escapeHtml(k)}</span>`).join(' ') : '';

  return `
    <div class="card politics-card" id="politics-${item.id}" style="margin-bottom:14px;">
      <div class="politics-card-header">
        <div class="politics-title-row">
          ${starsHtml ? `<span class="politics-stars">${starsHtml}</span>` : ''}
          <h4 class="politics-title">${escapeHtml(item.title)}</h4>
          <span class="politics-bookmark ${isBookmarked ? 'bookmarked' : ''}" onclick="togglePoliticsBookmark(${item.id})" title="${isBookmarked ? '取消收藏' : '加入收藏'}">
            ${isBookmarked ? '⭐' : '☆'}
          </span>
        </div>
        <div class="politics-meta">
          ${tagsHtml}
          <span class="politics-source">📰 ${escapeHtml(item.source || '')}</span>
          <span class="politics-date">📅 ${item.date || ''}</span>
        </div>
      </div>
      <div class="politics-card-body" id="politics-body-${item.id}">
        ${summary}
        ${keyPointsHtml ? `<div class="politics-keywords">${keyPointsHtml}</div>` : ''}
        <div class="politics-content collapsed" id="politics-content-${item.id}">
          ${escapeHtml(item.content || '').replace(/\n/g, '<br>')}
        </div>
      </div>
      <div class="politics-card-footer">
        <button class="btn btn-sm politics-expand-btn" onclick="togglePoliticsContent(${item.id})" id="expand-btn-${item.id}">
          📖 展开全文
        </button>
        <button class="btn btn-sm politics-copy-btn" onclick="copyPoliticsContent(${item.id})" title="复制关键内容">
          📋 复制要点
        </button>
      </div>
    </div>
  `;
}

function togglePoliticsContent(id) {
  const content = document.getElementById(`politics-content-${id}`);
  const btn = document.getElementById(`expand-btn-${id}`);
  if (!content || !btn) return;
  const isCollapsed = content.classList.contains('collapsed');
  if (isCollapsed) {
    content.classList.remove('collapsed');
    content.classList.add('expanded');
    btn.innerHTML = '📕 收起';
  } else {
    content.classList.add('collapsed');
    content.classList.remove('expanded');
    btn.innerHTML = '📖 展开全文';
  }
}

async function copyPoliticsContent(id) {
  const item = await DB.get('politics', id);
  if (!item) return;
  const text = `【${item.title}】\n${item.keyPoints ? '关键词：' + item.keyPoints.join('、') + '\n' : ''}\n${item.summary || ''}\n\n${item.content || ''}\n\n——来源：${item.source} ${item.date}`;
  await navigator.clipboard.writeText(text);
  showToast('已复制到剪贴板', 'success');
}

// ---- 标签页：要闻速览 ----
async function renderHeadlines(container) {
  const items = await getPoliticsByCategory('要闻');

  container.innerHTML = `
    <div class="politics-toolbar">
      <div class="politics-toolbar-left">
        <span class="politics-count">共 ${items.length} 条要闻</span>
        <input type="text" id="politicsSearch" class="form-input" placeholder="🔍 搜索时政素材..." style="max-width:240px;" oninput="filterPoliticsList()">
      </div>
      <div class="politics-toolbar-right">
        <button class="btn btn-primary" onclick="importPoliticsPreset()">📥 一键导入预置素材</button>
        <button class="btn btn-secondary" onclick="refreshFromPeopleDaily()">🔄 刷新人日报</button>
        <button class="btn btn-secondary" onclick="showAddPoliticsModal()">+ 手动添加</button>
      </div>
    </div>
    <div id="politicsListContainer">
      ${items.length === 0 ? renderEmptyState('要闻', '涵盖国内外重大时事，如两会、中央深改委会议、一号文件等') : items.map((i, idx) => renderPoliticsCard(i, idx)).join('')}
    </div>
  `;
}

// ---- 标签页：评论解读 ----
async function renderComments(container) {
  const items = await getPoliticsByCategory('评论解读');

  container.innerHTML = `
    <div class="politics-toolbar">
      <span class="politics-count">共 ${items.length} 篇评论</span>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="politicsTab='headlines'; renderPoliticsTab();">← 返回要闻</button>
      </div>
    </div>
    <div id="politicsListContainer">
      ${items.length === 0 ? renderEmptyState('评论解读', '包括人民日报评论、半月谈评论、经济日报评论等权威深度解读') : items.map((i, idx) => renderPoliticsCard(i, idx)).join('')}
    </div>
  `;
}

// ---- 标签页：政策文件 ----
async function renderPolicy(container) {
  const items = await getPoliticsByCategory('政策文件');

  container.innerHTML = `
    <div class="politics-toolbar">
      <span class="politics-count">共 ${items.length} 份政策</span>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="politicsTab='headlines'; renderPoliticsTab();">← 返回要闻</button>
      </div>
    </div>
    <div id="politicsListContainer">
      ${items.length === 0 ? renderEmptyState('政策文件', '国务院及各部委发布的重要政策文件解读') : items.map((i, idx) => renderPoliticsCard(i, idx)).join('')}
    </div>
  `;
}

// ---- 标签页：每日金句 ----
async function renderQuotes(container) {
  const items = await getPoliticsByCategory('每日金句');

  container.innerHTML = `
    <div class="politics-toolbar">
      <span class="politics-count">共 ${items.length} 句金句</span>
      <div>
        <button class="btn btn-secondary btn-sm" onclick="politicsTab='headlines'; renderPoliticsTab();">← 返回要闻</button>
      </div>
    </div>
    <div style="margin-bottom:16px;padding:14px;background:linear-gradient(135deg, #fef9f0, #fdf2e0);border-radius:12px;border-left:4px solid var(--accent);">
      <p style="font-size:0.9rem;color:var(--text-secondary);margin:0;">
        💡 <strong>每日金句</strong> — 总书记用典、人民日报金句、申论高分素材。每日朗读3句，语感自然来。
      </p>
    </div>
    <div id="politicsListContainer">
      ${items.length === 0 ? renderEmptyState('每日金句', '人民日报经典金句、领导人用典，申论面试加分利器') : items.map((i, idx) => renderPoliticsCard(i, idx)).join('')}
    </div>
  `;
}

// ---- 标签页：我的收藏 ----
async function renderBookmarksTab(container) {
  const allItems = await DB.getAll('politics');
  const bookmarkedItems = allItems.filter(i => politicsBookmarks.has(i.id));

  container.innerHTML = `
    <div class="politics-toolbar">
      <span class="politics-count">收藏 ${bookmarkedItems.length} 条</span>
      <div>
        ${bookmarkedItems.length > 0 ? `<button class="btn btn-secondary btn-sm" onclick="exportBookmarkList()">📋 导出收藏清单</button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="politicsTab='headlines'; renderPoliticsTab();">← 返回要闻</button>
      </div>
    </div>
    <div id="politicsListContainer">
      ${bookmarkedItems.length === 0 ? `
        <div class="empty-state" style="text-align:center;padding:40px 20px;">
          <div style="font-size:3rem;margin-bottom:8px;">⭐</div>
          <h4>还没有收藏任何素材</h4>
          <p style="color:var(--text-muted);">在要闻、评论或金句中点击 ☆ 即可收藏</p>
        </div>
      ` : bookmarkedItems.map((i, idx) => renderPoliticsCard(i, idx)).join('')}
    </div>
  `;
}

// ---- 收藏切换 ----
async function togglePoliticsBookmark(itemId) {
  if (politicsBookmarks.has(itemId)) {
    politicsBookmarks.delete(itemId);
    await DB.delete('politics_bookmarks', itemId);
  } else {
    politicsBookmarks.add(itemId);
    await DB.put('politics_bookmarks', { itemId });
  }
  renderPoliticsTab();
}

// ---- 全局搜索 ----
function filterPoliticsList() {
  const query = (document.getElementById('politicsSearch')?.value || '').toLowerCase();
  document.querySelectorAll('#politicsListContainer .politics-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = query && !text.includes(query) ? 'none' : '';
  });
}

// ---- 空状态 ----
function renderEmptyState(category, description) {
  const count = PRESET_POLITICS.filter(p => p.category === category).length;
  return `
    <div class="empty-state" style="text-align:center;padding:40px 20px;background:var(--bg-card);border-radius:12px;">
      <div style="font-size:3rem;margin-bottom:10px;">📰</div>
      <h4>${category}板块还是空的</h4>
      <p style="color:var(--text-muted);margin-bottom:16px;">${description}<br>已内置 ${count} 条精编素材，一键导入即可开始学习</p>
      <button class="btn btn-primary" onclick="importPoliticsPreset()">📥 一键导入预置素材</button>
    </div>
  `;
}

// ---- 一键导入预置数据 ----
async function importPoliticsPreset() {
  const existing = await DB.count('politics');
  if (existing > 0) {
    if (!confirm(`数据库中已有 ${existing} 条素材。\n\n选择"确定"将新增所有预置素材（不会覆盖已有内容）。\n选择"取消"跳过。`)) return;
  }

  // 过滤已存在的（按标题去重）
  const allExisting = await DB.getAll('politics');
  const existingTitles = new Set(allExisting.map(i => i.title));
  const newItems = PRESET_POLITICS.filter(p => !existingTitles.has(p.title));

  if (newItems.length === 0) {
    showToast('所有预置素材已存在，无需重复导入', 'info');
    return;
  }

  const itemsToAdd = newItems.map(p => ({ ...p, createdAt: new Date().toISOString() }));
  const count = await DB.bulkAdd('politics', itemsToAdd);
  showToast(`成功导入 ${count} 条时政素材！`, 'success');
  addCoins(20);
  renderPoliticsTab();
}

// ---- 从人民日报刷新（真实联网抓取，需后端 /api/people-daily；无后端时降级本地精选） ----
async function refreshFromPeopleDaily() {
  let items = null;
  try {
    const resp = await fetch('/api/people-daily', { headers: { 'Accept': 'application/json' } });
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.ok && Array.isArray(json.items)) items = json.items;
    }
  } catch (e) { items = null; }

  if (items && items.length) {
    const existing = await DB.getAll('politics');
    const have = new Set(existing.map(i => i.title));
    const fresh = items.filter(it => !have.has(it.title)).map(it => ({
      title: it.title,
      category: it.category || '要闻速览',
      source: it.source || '人民网',
      date: it.date || new Date().toISOString().split('T')[0],
      summary: it.summary || '',
      content: it.content || '',
      tags: it.tags || ['时政'],
      stars: 0,
      keyPoints: [],
      createdAt: new Date().toISOString()
    }));
    if (fresh.length === 0) {
      showToast('人民日报内容已是最新，没有新素材', 'info');
    } else {
      await DB.bulkAdd('politics', fresh);
      showToast(`🎉 已从人民日报抓取 ${fresh.length} 条最新时政！`, 'success');
      addCoins(15);
    }
    renderPoliticsTab();
    return;
  }

  // 无后端 / 网络失败时，降级为本地精选素材（保证按钮始终可用）
  refreshFromLocalPreset();
}

async function refreshFromLocalPreset() {
  const existing = await DB.getAll('politics');
  const existingTitles = new Set(existing.map(i => i.title));
  const freshItems = PRESET_POLITICS
    .filter(p => !existingTitles.has(p.title))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 5);
  if (freshItems.length === 0) {
    showToast('人民日报内容已是最新，没有新素材需要导入', 'info');
    return;
  }
  const itemsToAdd = freshItems.map(p => ({ ...p, createdAt: new Date().toISOString(), source: p.source || '人民日报' }));
  const count = await DB.bulkAdd('politics', itemsToAdd);
  showToast(`已导入 ${count} 条本地精选时政（部署后端可真正联网抓取人民日报）`, 'info');
  addCoins(15);
  renderPoliticsTab();
}

// ---- 手动添加弹窗 ----
function showAddPoliticsModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay show';
  modal.id = 'addPoliticsModal';
  modal.innerHTML = `
    <div class="modal-content politics-modal">
      <h3>📰 添加时政素材</h3>
      <div class="form-group">
        <label>标题 *</label>
        <input type="text" id="addPoliticsTitle" class="form-input" placeholder="如：中央经济工作会议召开...">
      </div>
      <div class="form-group">
        <label>分类</label>
        <select id="addPoliticsCategory" class="form-select">
          <option value="要闻">要闻速览</option>
          <option value="评论解读">评论解读</option>
          <option value="政策文件">政策文件</option>
          <option value="每日金句">每日金句</option>
        </select>
      </div>
      <div class="form-group">
        <label>标签（逗号分隔）</label>
        <input type="text" id="addPoliticsTags" class="form-input" placeholder="政治, 经济, 改革">
      </div>
      <div class="form-group">
        <label>来源</label>
        <input type="text" id="addPoliticsSource" class="form-input" value="人民日报" placeholder="人民日报 / 半月谈 / 新华社...">
      </div>
      <div class="form-group">
        <label>日期</label>
        <input type="date" id="addPoliticsDate" class="form-input" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label>重要程度</label>
        <select id="addPoliticsStars" class="form-select">
          <option value="3">⭐⭐⭐ 非常重要</option>
          <option value="2" selected>⭐⭐ 重要</option>
          <option value="1">⭐ 一般</option>
        </select>
      </div>
      <div class="form-group">
        <label>摘要</label>
        <textarea id="addPoliticsSummary" class="form-textarea" rows="2" placeholder="一句话概括..."></textarea>
      </div>
      <div class="form-group">
        <label>完整内容</label>
        <textarea id="addPoliticsContent" class="form-textarea" rows="6" placeholder="详细内容、考点分析..."></textarea>
      </div>
      <div class="form-group">
        <label>关键词（逗号分隔）</label>
        <input type="text" id="addPoliticsKeywords" class="form-input" placeholder="乡村振兴, 粮食安全, 三农">
      </div>
      <div class="modal-actions" style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="document.getElementById('addPoliticsModal').remove()">取消</button>
        <button class="btn btn-primary" onclick="savePoliticsItem()">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

async function savePoliticsItem() {
  const title = document.getElementById('addPoliticsTitle').value.trim();
  if (!title) { showToast('请输入标题', 'warning'); return; }

  const item = {
    title,
    category: document.getElementById('addPoliticsCategory').value,
    tags: document.getElementById('addPoliticsTags').value.split(',').map(t => t.trim()).filter(Boolean),
    source: document.getElementById('addPoliticsSource').value.trim(),
    date: document.getElementById('addPoliticsDate').value,
    stars: parseInt(document.getElementById('addPoliticsStars').value),
    summary: document.getElementById('addPoliticsSummary').value.trim(),
    content: document.getElementById('addPoliticsContent').value.trim(),
    keyPoints: document.getElementById('addPoliticsKeywords').value.split(',').map(k => k.trim()).filter(Boolean),
    createdAt: new Date().toISOString()
  };

  await DB.add('politics', item);
  document.getElementById('addPoliticsModal').remove();
  showToast('时政素材已添加 ✅', 'success');
  addCoins(5);
  renderPoliticsTab();
}

// ---- 导出收藏清单 ----
async function exportBookmarkList() {
  const allItems = await DB.getAll('politics');
  const bookmarkedItems = allItems.filter(i => politicsBookmarks.has(i.id));
  if (bookmarkedItems.length === 0) { showToast('收藏列表为空', 'info'); return; }

  let content = '⭐ 我的时政收藏清单\n' + '═'.repeat(40) + '\n\n';
  const categories = { '要闻': [], '评论解读': [], '政策文件': [], '每日金句': [] };
  bookmarkedItems.forEach(i => {
    if (categories[i.category]) categories[i.category].push(i);
  });

  for (const [cat, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    content += `\n【${cat}】\n`;
    items.forEach((i, idx) => {
      content += `${idx + 1}. ${i.title}\n`;
      content += `   ${'⭐'.repeat(i.stars || 0)} | ${i.source} | ${i.date}\n`;
      content += `   摘要：${i.summary || ''}\n`;
      if (i.keyPoints?.length) content += `   关键词：${i.keyPoints.join('、')}\n`;
      content += '\n';
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `时政收藏清单_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('收藏清单已导出', 'success');
  addCoins(5);
}

// ---- 旧版函数兼容 ----
function showAddPolitics() { showAddPoliticsModal(); }
function deletePolitics(id) {
  if (!confirm('确定删除这条素材？')) return;
  DB.delete('politics', id).then(() => {
    showToast('已删除', 'success');
    renderPoliticsTab();
  });
}
function exportPolitics() {
  politicsTab = 'bookmarks';
  document.querySelectorAll('#politicsTabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelector('#politicsTabs .tab[data-tab="bookmarks"]')?.classList.add('active');
  renderBookmarksTab(document.getElementById('politicsTabContent'));
  setTimeout(() => exportBookmarkList(), 300);
}
function filterPolitics() { filterPoliticsList(); }

// ---- 窗口全局挂载 ----
window.renderPoliticsModule = renderPoliticsModule;
window.renderPoliticsTab = renderPoliticsTab;
window.importPoliticsPreset = importPoliticsPreset;
window.refreshFromPeopleDaily = refreshFromPeopleDaily;
window.showAddPoliticsModal = showAddPoliticsModal;
window.savePoliticsItem = savePoliticsItem;
window.togglePoliticsBookmark = togglePoliticsBookmark;
window.togglePoliticsContent = togglePoliticsContent;
window.copyPoliticsContent = copyPoliticsContent;
window.filterPoliticsList = filterPoliticsList;
window.exportBookmarkList = exportBookmarkList;
window.showAddPolitics = showAddPolitics;
window.deletePolitics = deletePolitics;
window.exportPolitics = exportPolitics;
window.filterPolitics = filterPolitics;
