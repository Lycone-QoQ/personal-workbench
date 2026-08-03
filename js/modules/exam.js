/**
 * 教资备考专区 - 知识点库、每日背诵、错题本、真题、艾宾浩斯、试讲素材、考试设置
 */
let currentExamTab = 'exam-knowledge';
let koujueSearchKeyword = '';
let pendingKoujueImage = null;

async function renderExamModule() {
  // 绑定Tab事件
  document.querySelectorAll('#examTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#examTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentExamTab = tab.dataset.tab;
      renderExamTab(currentExamTab);
    };
  });

  renderExamTab(currentExamTab);
}

async function renderExamTab(tab) {
  const container = document.getElementById('examTabContent');
  switch(tab) {
    case 'exam-knowledge': renderKnowledgeBase(container); break;
    case 'exam-recite': renderDailyRecite(container); break;
    case 'exam-errors': renderErrorBook(container); break;
    case 'exam-history': renderExamHistory(container); break;
    case 'exam-ebbinghaus': renderEbbinghaus(container); break;
    case 'exam-teaching': renderTeachingMaterials(container); break;
    case 'exam-settings': renderExamSettings(container); break;
  }
}

// ---- 每日背诵（口诀轮播+打卡+关键词搜索+自建上传） ----
function matchKoujue(k, kw) {
  if (!kw) return true;
  const hay = [k.title, k.koujue, k.fullText, k.module, k.subject, k.keywords, k.tips]
    .filter(Boolean).join(' ').toLowerCase();
  return hay.includes(kw.toLowerCase());
}

// 计算今日轮换的 7 条口诀
function getTodayRotatedItems(koujueList) {
  const totalCount = koujueList.length;
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const todayItems = [];
  if (totalCount > 0) {
    const startIdx = (dayOfYear * 7) % totalCount;
    for (let i = 0; i < Math.min(7, totalCount); i++) {
      todayItems.push(koujueList[(startIdx + i) % totalCount]);
    }
  }
  return todayItems;
}

// 单条口诀卡片（支持图片 + 链接）
function renderKoujueCard(item, todayDoneIds) {
  const done = todayDoneIds ? todayDoneIds.has(item.id) : false;
  return `
    <div class="card recite-card ${done ? 'recite-done' : ''}" style="margin-bottom:12px;padding:16px;${done ? 'opacity:0.65;border-left:3px solid var(--success);' : 'border-left:3px solid var(--accent);'}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
            <span class="tag" style="font-size:0.75rem;">${item.subject || ''}</span>
            <span class="tag" style="font-size:0.75rem;background:var(--bg);">${item.module || ''}</span>
            <strong>${escapeHtml(item.title)}</strong>
          </div>
          ${item.koujue ? `<div class="koujue-box" style="background:var(--bg);padding:12px;border-radius:8px;margin-bottom:8px;font-size:1.15rem;font-weight:600;color:var(--accent);text-align:center;letter-spacing:1px;">${escapeHtml(item.koujue)}</div>` : ''}
          ${item.image ? `<div style="margin-bottom:10px;"><img src="${escapeHtml(item.image)}" class="koujue-img" alt="口诀图片" onerror="this.style.display='none'"></div>` : ''}
          ${item.fullText ? `<p style="color:var(--text-secondary);font-size:0.9rem;line-height:1.6;margin-bottom:4px;">${escapeHtml(item.fullText)}</p>` : ''}
          ${item.tips ? `<p style="color:var(--text-muted);font-size:0.8rem;">💡 ${escapeHtml(item.tips)}</p>` : ''}
          ${item.keywords ? `<p style="color:var(--text-muted);font-size:0.75rem;margin-top:4px;">🏷️ ${escapeHtml(item.keywords)}</p>` : ''}
          ${item.link ? `<p style="margin-top:6px;"><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener" class="koujue-link">🔗 查看来源</a></p>` : ''}
        </div>
        <button class="btn btn-sm ${done ? '' : 'btn-primary'}" onclick="toggleReciteDone(${item.id})" style="white-space:nowrap;margin-left:12px;">
          ${done ? '✅ 已背' : '📝 打卡'}
        </button>
      </div>
    </div>
  `;
}

async function renderDailyRecite(container) {
  const koujueList = await DB.getAll('exam_koujue');
  const totalCount = koujueList.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecites = await DB.getAll('exam_revite_log');
  const todayDone = todayRecites.filter(r => r.date === todayStr);
  const todayDoneIds = new Set(todayDone.map(r => r.koujueId));

  const searching = koujueSearchKeyword.trim().length > 0;
  const subjectFilter = (document.getElementById('koujueSubject')?.value) || 'all';
  const todayItems = getTodayRotatedItems(koujueList);

  let displayItems;
  if (searching) {
    displayItems = koujueList.filter(k => matchKoujue(k, koujueSearchKeyword));
  } else {
    displayItems = todayItems.filter(k => subjectFilter === 'all' || k.subject === subjectFilter);
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📖 口诀背诵库</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <span class="tag" style="font-size:0.8rem;">共 ${totalCount} 条口诀</span>
          ${searching ? `<span class="tag star-2">搜索到 ${displayItems.length} 条</span>` : `<span class="tag star-2" id="todayReciteProgress">今日 ${todayDone.length}/7</span>`}
        </div>
      </div>
      <div class="card-body">
        <!-- 搜索 + 添加 -->
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
          <input class="form-input" id="koujueSearch" placeholder="🔍 搜索关键词：如 素质教育 / 学生观 / 教学原则…"
            value="${escapeHtml(koujueSearchKeyword)}" oninput="refreshKoujueList()" style="flex:1;min-width:180px;">
          <button class="btn btn-primary btn-sm" onclick="openAddKoujueDialog()">➕ 添加口诀</button>
          ${totalCount === 0 ? '' : `
            <select class="form-select" id="koujueSubject" onchange="refreshKoujueList()" style="max-width:120px;">
              <option value="all">全部科目</option>
              <option value="科一">科一</option>
              <option value="科二">科二</option>
            </select>
            <button class="btn btn-sm" onclick="importPresetKoujue()">🔄 重新导入</button>
          `}
        </div>

        <p id="koujueListHint" style="font-size:0.85rem;color:var(--text-muted);margin-bottom:10px;">
          ${searching ? `关键词「${escapeHtml(koujueSearchKeyword)}」共匹配到 ${displayItems.length} 条口诀` : (totalCount === 0 ? '' : `今日轮换 ${todayItems.length} 条，每日自动切换`)}
        </p>

        ${totalCount === 0 ? `
          <div class="empty-state" style="text-align:center;padding:30px 20px;background:var(--card-bg);border-radius:12px;margin-bottom:16px;">
            <div style="font-size:3rem;margin-bottom:8px;">📖</div>
            <h4 style="margin-bottom:6px;">口诀库还是空的</h4>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">已内置 ${PRESET_KOUJUE.length} 条教资核心口诀（科一+科二），一键导入开始每日背诵；也可点击右上角「➕ 添加口诀」上传自己的图片或链接</p>
            <div style="display:flex;gap:8px;justify-content:center;">
              <button class="btn btn-primary" onclick="importPresetKoujue()">📥 一键导入口诀库</button>
              <button class="btn" style="background:var(--bg);" onclick="openAddKoujueDialog()">➕ 自建口诀</button>
            </div>
          </div>
        ` : `
          <div id="todayReciteList">
            ${displayItems.length === 0 ? (searching ? '<p class="empty-hint">没有找到匹配的口诀，换个关键词试试～</p>' : '<p class="empty-hint">今日无背诵内容</p>') : displayItems.map(item => renderKoujueCard(item, todayDoneIds)).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

// 实时搜索/筛选（不重建输入框，保留焦点）
async function refreshKoujueList() {
  const kw = document.getElementById('koujueSearch')?.value || '';
  koujueSearchKeyword = kw;
  const list = document.getElementById('todayReciteList');
  if (!list) return;
  const koujueList = await DB.getAll('exam_koujue');
  const subjectFilter = document.getElementById('koujueSubject')?.value || 'all';
  const todayItems = getTodayRotatedItems(koujueList);
  let displayItems;
  if (kw.trim()) {
    displayItems = koujueList.filter(k => matchKoujue(k, kw));
  } else {
    displayItems = todayItems.filter(k => subjectFilter === 'all' || k.subject === subjectFilter);
  }
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecites = await DB.getAll('exam_revite_log');
  const todayDoneIds = new Set(todayRecites.filter(r => r.date === todayStr).map(r => r.koujueId));

  list.innerHTML = displayItems.length === 0
    ? (kw.trim() ? '<p class="empty-hint">没有找到匹配的口诀，换个关键词试试～</p>' : (koujueList.length === 0 ? '' : '<p class="empty-hint">今日无背诵内容</p>'))
    : displayItems.map(item => renderKoujueCard(item, todayDoneIds)).join('');

  const hint = document.getElementById('koujueListHint');
  if (hint) hint.innerHTML = kw.trim()
    ? `关键词「${escapeHtml(kw)}」共匹配到 ${displayItems.length} 条口诀`
    : (koujueList.length === 0 ? '' : `今日轮换 ${displayItems.length} 条，每日自动切换`);
}

// ---- 添加口诀（支持上传图片 / 外部链接 / 关键词） ----
async function openAddKoujueDialog() {
  const container = document.getElementById('examTabContent');
  pendingKoujueImage = null;
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>➕ 添加教资口诀</h3>
        <button class="btn-icon" onclick="renderExamTab('exam-recite')">✕</button>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label>科目</label>
          <select id="kSubject" class="form-input">
            <option value="科一">科一</option>
            <option value="科二">科二</option>
            <option value="英语">英语</option>
          </select>
        </div>
        <div class="form-group">
          <label>模块 / 分类标签</label>
          <input id="kModule" class="form-input" placeholder="如：职业理念-学生观">
        </div>
        <div class="form-group">
          <label>标题 *</label>
          <input id="kTitle" class="form-input" placeholder="口诀主题">
        </div>
        <div class="form-group">
          <label>口诀（简短顺口溜）</label>
          <input id="kKoujue" class="form-input" placeholder="如：两独一发">
        </div>
        <div class="form-group">
          <label>详细内容 / 展开说明</label>
          <textarea id="kFull" class="form-input" rows="3" placeholder="完整表述或解析"></textarea>
        </div>
        <div class="form-group">
          <label>💡 提示 / 记忆法</label>
          <input id="kTips" class="form-input" placeholder="如：材料分析题必考">
        </div>
        <div class="form-group">
          <label>🏷️ 关键词（逗号分隔，便于搜索）</label>
          <input id="kKeywords" class="form-input" placeholder="如：学生观,以人为本,材料题">
        </div>
        <div class="form-group">
          <label>🖼️ 上传口诀图片（可从小红书等保存后上传，本地保存）</label>
          <input type="file" id="kImage" accept="image/*" onchange="handleKoujueImageUpload(this)">
          <div id="kImagePreview" style="margin-top:8px;"></div>
        </div>
        <div class="form-group">
          <label>🔗 外部链接（来源 / 参考网址）</label>
          <input id="kLink" class="form-input" placeholder="https://...">
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-primary" onclick="saveKoujueFromDialog()">💾 保存口诀</button>
          <button class="btn" style="background:var(--bg);" onclick="renderExamTab('exam-recite')">取消</button>
        </div>
      </div>
    </div>
  `;
}

function handleKoujueImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    pendingKoujueImage = e.target.result;
    const prev = document.getElementById('kImagePreview');
    if (prev) prev.innerHTML = `<img src="${pendingKoujueImage}" style="max-width:200px;max-height:200px;border-radius:8px;display:block;">`;
  };
  reader.readAsDataURL(file);
}

async function saveKoujueFromDialog() {
  const title = document.getElementById('kTitle')?.value?.trim();
  if (!title) { showToast('请填写标题', 'error'); return; }
  const subject = document.getElementById('kSubject')?.value || '科一';
  const module = document.getElementById('kModule')?.value?.trim() || '';
  const koujue = document.getElementById('kKoujue')?.value?.trim() || '';
  const fullText = document.getElementById('kFull')?.value?.trim() || '';
  const tips = document.getElementById('kTips')?.value?.trim() || '';
  const keywords = document.getElementById('kKeywords')?.value?.trim() || '';
  const link = document.getElementById('kLink')?.value?.trim() || '';

  await DB.add('exam_koujue', {
    subject, module, title, koujue, fullText, tips,
    keywords, link,
    image: pendingKoujueImage || null,
    createdAt: new Date().toISOString()
  });
  pendingKoujueImage = null;
  showToast('口诀已保存到本地 💾', 'success');
  addCoins(5);
  renderExamTab('exam-recite');
}

async function toggleReciteDone(koujueId) {
  const todayStr = new Date().toISOString().split('T')[0];
  const existing = await DB.getAll('exam_revite_log');
  const found = existing.find(r => r.koujueId === koujueId && r.date === todayStr);
  if (found) {
    await DB.delete('exam_revite_log', found.id);
    showToast('已取消打卡', 'info');
  } else {
    await DB.add('exam_revite_log', { koujueId, date: todayStr, createdAt: new Date().toISOString() });
    showToast('背诵打卡成功！+10金币', 'success');
    addCoins(10);
  }
  renderExamTab('exam-recite');
}

async function importPresetKoujue() {
  const existing = await DB.getAll('exam_koujue');
  if (existing.length > 0) {
    if (!confirm('口诀库已有 ' + existing.length + ' 条。追加导入不会删除已有数据，确定继续？')) return;
  }
  await DB.bulkAdd('exam_koujue', PRESET_KOUJUE);
  showToast('成功导入 ' + PRESET_KOUJUE.length + ' 条口诀！', 'success');
  addCoins(20);
  renderExamTab('exam-recite');
}

// ---- 知识点库（刷题模式） ----
let quizState = {
  questions: [],
  currentIndex: 0,
  answers: {},        // { questionId: 'A'|'B'|'C'|'D' }
  mode: 'all',        // 'all' | '科一' | '科二' | '英语' | 'random'
  randomOrder: false,
  started: false,
  completed: false
};

async function renderKnowledgeBase(container) {
  const quizzes = await DB.getAll('exam_quiz');
  const totalCount = quizzes.length;
  const ke1 = quizzes.filter(q => q.category === '科一').length;
  const ke2 = quizzes.filter(q => q.category === '科二').length;
  const eng = quizzes.filter(q => q.category === '英语').length;

  // 获取历史刷题统计
  const progress = await DB.get('quiz_progress', 'overall') || { totalDone: 0, totalCorrect: 0 };
  const accuracy = progress.totalDone > 0 ? ((progress.totalCorrect / progress.totalDone) * 100).toFixed(1) : '0';

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📝 知识点刷题</h3>
        <div style="display:flex;gap:6px;">
          <span class="tag" style="font-size:0.8rem;">题库 ${totalCount} 题</span>
          <span class="tag star-1">科一 ${ke1}</span>
          <span class="tag star-2">科二 ${ke2}</span>
          <span class="tag star-3">英语 ${eng}</span>
        </div>
      </div>
      <div class="card-body">
        ${totalCount === 0 ? `
          <div class="empty-state" style="text-align:center;padding:30px 20px;background:var(--card-bg);border-radius:12px;margin-bottom:16px;">
            <div style="font-size:3rem;margin-bottom:8px;">📝</div>
            <h4 style="margin-bottom:6px;">题库还是空的</h4>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">已内置 ${PRESET_QUIZ.length} 道仿真选择题，覆盖科一/科二/英语学科，一键导入开始刷题</p>
            <button class="btn btn-primary" onclick="importPresetQuiz()">📥 一键导入题库</button>
          </div>
        ` : `
          ${quizState.started && !quizState.completed ? renderQuizActive() : quizState.completed ? renderQuizResult() : renderQuizHome(totalCount, accuracy, ke1, ke2, eng)}
        `}
      </div>
    </div>
  `;
}

function renderQuizHome(totalCount, accuracy, ke1, ke2, eng) {
  return `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:4rem;margin-bottom:12px;">📝</div>
      <h3 style="margin-bottom:4px;">知识点刷题</h3>
      <p style="color:var(--text-muted);margin-bottom:20px;">粉笔模式 · 错题自动收录 · 详细解析</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:20px;">
        <div class="card" style="padding:16px 24px;text-align:center;min-width:90px;">
          <div style="font-size:1.5rem;font-weight:700;color:var(--accent);">${totalCount}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">总题数</div>
        </div>
        <div class="card" style="padding:16px 24px;text-align:center;min-width:90px;">
          <div style="font-size:1.5rem;font-weight:700;color:var(--success);">${accuracy}%</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">历史正确率</div>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-size:0.9rem;color:var(--text-secondary);display:block;margin-bottom:8px;">选择刷题范围</label>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="startQuiz('all',false)" style="min-width:100px;">📚 全部刷题</button>
          <button class="btn" style="background:var(--bg);min-width:80px;" onclick="startQuiz('科一',false)">科一</button>
          <button class="btn" style="background:var(--bg);min-width:80px;" onclick="startQuiz('科二',false)">科二</button>
          <button class="btn" style="background:var(--bg);min-width:80px;" onclick="startQuiz('英语',false)">英语</button>
          <button class="btn" style="background:var(--bg);min-width:100px;" onclick="startQuiz('all',true)">🎲 随机刷题</button>
        </div>
      </div>
      <div style="margin-top:20px;display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-sm" style="background:var(--bg);" onclick="showImportKnowledgeDialog()">📥 JSON导入</button>
        <button class="btn btn-sm" style="background:var(--bg);" onclick="importPresetQuiz()">🔄 重新导入题库</button>
      </div>
    </div>
  `;
}

function renderQuizActive() {
  const q = quizState.questions[quizState.currentIndex];
  if (!q) return '<p>题目加载中...</p>';
  const answered = quizState.answers[q.id] !== undefined;
  const userAnswer = quizState.answers[q.id];
  const isCorrect = userAnswer === q.answer;
  const total = quizState.questions.length;
  const current = quizState.currentIndex + 1;
  const answeredCount = Object.keys(quizState.answers).length;
  const correctCount = Object.values(quizState.answers).filter((ans,i) => {
    const qid = Object.keys(quizState.answers)[i];
    const question = quizState.questions.find(qq => qq.id == qid);
    return question && ans === question.answer;
  }).length;

  const optionsHtml = ['A','B','C','D'].map(letter => {
    let btnClass = 'btn quiz-option';
    if (!answered) {
      btnClass += '';
    } else if (letter === q.answer) {
      btnClass += ' quiz-correct';
    } else if (letter === userAnswer && letter !== q.answer) {
      btnClass += ' quiz-wrong';
    } else {
      btnClass += ' quiz-disabled';
    }
    return `<button class="${btnClass}" onclick="answerQuiz(${q.id},'${letter}')" ${answered ? 'disabled' : ''}>${q.options[['A','B','C','D'].indexOf(letter)]}</button>`;
  }).join('');

  return `
    <style>
      .quiz-option { display:block; width:100%; text-align:left; padding:12px 16px; margin-bottom:8px; border:2px solid var(--border); border-radius:10px; background:var(--card-bg); cursor:pointer; transition:all 0.2s; font-size:0.95rem; line-height:1.5; }
      .quiz-option:hover:not(:disabled) { border-color:var(--accent); background:var(--bg); }
      .quiz-correct { border-color:var(--success) !important; background:#e8f5e9 !important; color:var(--success) !important; }
      .quiz-wrong { border-color:var(--danger) !important; background:#fce4ec !important; color:var(--danger) !important; }
      .quiz-disabled { opacity:0.45; cursor:not-allowed; }
      .quiz-progress-bar { height:6px; background:var(--border); border-radius:3px; margin:8px 0 16px; overflow:hidden; }
      .quiz-progress-fill { height:100%; background:var(--accent); border-radius:3px; transition:width 0.3s; }
    </style>
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
        <span class="tag" style="font-size:0.85rem;">${q.category} · ${q.module || ''}</span>
        <span style="font-size:0.85rem;color:var(--text-muted);">${current} / ${total}</span>
      </div>
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill" style="width:${(current/total)*100}%;"></div>
      </div>
      <div style="display:flex;gap:12px;font-size:0.8rem;color:var(--text-muted);">
        <span>✅ ${correctCount}</span><span>❌ ${answeredCount - correctCount}</span><span>⏳ ${total - answeredCount}</span>
      </div>
    </div>
    <div class="card" style="padding:20px;margin-bottom:16px;background:var(--bg);">
      <h4 style="font-size:1.05rem;line-height:1.7;margin-bottom:20px;">${current}. ${escapeHtml(q.stem)}</h4>
      <div>${optionsHtml}</div>
    </div>
    ${answered ? `
      <div class="card" style="padding:16px;border-left:4px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'};margin-bottom:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:1.2rem;">${isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}</span>
        </div>
        <div style="padding:12px;background:var(--card-bg);border-radius:8px;font-size:0.9rem;line-height:1.7;">
          <strong style="color:var(--accent);">💡 解析：</strong>${escapeHtml(q.explanation)}
        </div>
        ${!isCorrect ? `
          <div style="margin-top:8px;font-size:0.82rem;color:var(--text-muted);">
            📌 已自动收录到错题本
          </div>
        ` : ''}
      </div>
    ` : ''}
    <div style="display:flex;gap:8px;justify-content:space-between;">
      <button class="btn" style="background:var(--bg);" onclick="prevQuiz()" ${current <= 1 ? 'disabled' : ''}>◀ 上一题</button>
      ${current >= total ? `
        <button class="btn btn-primary" onclick="finishQuiz()">📊 查看结果</button>
      ` : `
        <button class="btn btn-primary" onclick="nextQuiz()">下一题 ▶</button>
      `}
      <button class="btn" style="background:var(--bg);" onclick="exitQuiz()">退出刷题</button>
    </div>
  `;
}

function renderQuizResult() {
  const total = quizState.questions.length;
  const answeredCount = Object.keys(quizState.answers).length;
  const correctCount = Object.values(quizState.answers).filter((ans, i) => {
    const qid = Object.keys(quizState.answers)[i];
    const q = quizState.questions.find(qq => qq.id == qid);
    return q && ans === q.answer;
  }).length;
  const wrongCount = answeredCount - correctCount;
  const accuracy = answeredCount > 0 ? ((correctCount / answeredCount) * 100).toFixed(1) : 0;
  const wrongQuestions = quizState.questions.filter(q => quizState.answers[q.id] !== undefined && quizState.answers[q.id] !== q.answer);

  return `
    <div style="text-align:center;padding:20px 0;">
      <div style="font-size:4rem;margin-bottom:12px;">${accuracy >= 80 ? '🎉' : accuracy >= 60 ? '💪' : '📚'}</div>
      <h3 style="margin-bottom:8px;">刷题完成！</h3>
      <div style="display:flex;gap:12px;justify-content:center;margin:20px 0;">
        <div class="card" style="padding:16px 20px;text-align:center;">
          <div style="font-size:2rem;font-weight:700;color:var(--accent);">${total}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">总题数</div>
        </div>
        <div class="card" style="padding:16px 20px;text-align:center;">
          <div style="font-size:2rem;font-weight:700;color:var(--success);">${correctCount}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">正确</div>
        </div>
        <div class="card" style="padding:16px 20px;text-align:center;">
          <div style="font-size:2rem;font-weight:700;color:var(--danger);">${wrongCount}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">错误</div>
        </div>
        <div class="card" style="padding:16px 20px;text-align:center;">
          <div style="font-size:2rem;font-weight:700;color:${accuracy >= 60 ? 'var(--success)' : 'var(--danger)'};">${accuracy}%</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">正确率</div>
        </div>
      </div>
      ${wrongCount > 0 ? `
        <div class="card" style="padding:16px;margin-bottom:16px;text-align:left;">
          <h4 style="margin-bottom:12px;">📋 错题回顾（${wrongCount}题已自动收录到错题本）</h4>
          ${wrongQuestions.map(wq => `
            <div style="padding:10px;margin-bottom:8px;background:var(--bg);border-radius:8px;border-left:3px solid var(--danger);">
              <p style="font-weight:600;margin-bottom:4px;">${escapeHtml(wq.stem)}</p>
              <p style="font-size:0.85rem;">你的答案: <span style="color:var(--danger);">${quizState.answers[wq.id] || '未作答'}</span> → 正确答案: <span style="color:var(--success);">${wq.answer}</span></p>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">${escapeHtml(wq.explanation).substring(0, 100)}...</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <div style="display:flex;gap:8px;justify-content:center;">
        <button class="btn btn-primary" onclick="retryWrongQuiz()">🔄 重做错题（${wrongCount}题）</button>
        <button class="btn" style="background:var(--bg);" onclick="resetQuiz()">重新开始</button>
      </div>
    </div>
  `;
}

async function startQuiz(category, random) {
  let questions = await DB.getAll('exam_quiz');
  if (category !== 'all') {
    questions = questions.filter(q => q.category === category);
  }
  if (questions.length === 0) {
    showToast('该分类暂无题目，请先导入题库', 'warning');
    return;
  }
  if (random) {
    questions = shuffleArray([...questions]);
  }
  quizState = {
    questions,
    currentIndex: 0,
    answers: {},
    mode: category,
    randomOrder: random,
    started: true,
    completed: false
  };
  renderExamTab('exam-knowledge');
  // 滚动到顶部
  document.getElementById('examTabContent')?.scrollIntoView({ behavior:'smooth' });
}

async function answerQuiz(questionId, userAnswer) {
  quizState.answers[questionId] = userAnswer;
  const q = quizState.questions.find(qq => qq.id == questionId);
  if (!q) return;

  // 更新进度统计
  const progress = await DB.get('quiz_progress', 'overall') || { totalDone: 0, totalCorrect: 0 };
  progress.totalDone += 1;
  if (userAnswer === q.answer) {
    progress.totalCorrect += 1;
    addCoins(3);
    showToast('✅ 回答正确！+3金币', 'success');
  } else {
    // 错题自动收录
    await DB.add('exam_errors', {
      question: q.stem,
      wrongAnswer: userAnswer,
      correctAnswer: q.answer,
      subject: q.category,
      explanation: q.explanation,
      note: `来源：刷题 - ${q.module || ''}`,
      createdAt: new Date().toISOString()
    });
    addCoins(1);
    showToast('❌ 已自动收录错题本', 'info');
  }
  await DB.put('quiz_progress', { key: 'overall', ...progress });
  renderExamTab('exam-knowledge');
}

function nextQuiz() {
  if (quizState.currentIndex < quizState.questions.length - 1) {
    quizState.currentIndex++;
    renderExamTab('exam-knowledge');
  }
}

function prevQuiz() {
  if (quizState.currentIndex > 0) {
    quizState.currentIndex--;
    renderExamTab('exam-knowledge');
  }
}

async function finishQuiz() {
  quizState.completed = true;
  addCoins(10);
  showToast('🎉 一轮刷题完成！+10金币', 'success');
  renderExamTab('exam-knowledge');
}

function exitQuiz() {
  if (Object.keys(quizState.answers).length > 0 && !quizState.completed) {
    if (!confirm('确定退出？已作答的进度将保留，完成后可查看结果。')) return;
  }
  quizState.completed = true;
  renderExamTab('exam-knowledge');
}

function resetQuiz() {
  quizState = { questions: [], currentIndex: 0, answers: {}, mode: 'all', randomOrder: false, started: false, completed: false };
  renderExamTab('exam-knowledge');
}

async function retryWrongQuiz() {
  const wrongQuestions = quizState.questions.filter(q => quizState.answers[q.id] !== undefined && quizState.answers[q.id] !== q.answer);
  if (wrongQuestions.length === 0) {
    showToast('没有错题可重做', 'info');
    return;
  }
  quizState = {
    questions: shuffleArray([...wrongQuestions]),
    currentIndex: 0,
    answers: {},
    mode: 'retry',
    randomOrder: true,
    started: true,
    completed: false
  };
  renderExamTab('exam-knowledge');
}

async function importPresetQuiz() {
  const existing = await DB.getAll('exam_quiz');
  if (existing.length > 0) {
    if (!confirm('题库已有 ' + existing.length + ' 题。追加导入不会删除已有数据，确定继续？')) return;
  }
  await DB.bulkAdd('exam_quiz', PRESET_QUIZ);
  showToast('成功导入 ' + PRESET_QUIZ.length + ' 道题目！', 'success');
  addCoins(20);
  resetQuiz();
  renderExamTab('exam-knowledge');
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---- 错题本 ----
async function renderErrorBook(container) {
  const errors = await DB.getAll('exam_errors');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>错题本</h3>
        <button class="btn btn-primary btn-sm" onclick="showAddError()">+ 添加错题</button>
      </div>
      <div class="card-body">
        <div id="errorList">
          ${errors.length === 0 ? '<p class="empty-hint">暂无错题记录</p>' : errors.map(e => `
            <div class="card" style="margin-bottom:10px;padding:14px;">
              <div style="display:flex;justify-content:space-between;">
                <div style="flex:1;">
                  <h4>📝 ${escapeHtml(e.question || '')}</h4>
                  <p style="color:var(--danger);margin:4px 0;">❌ 错误答案: ${escapeHtml(e.wrongAnswer || '')}</p>
                  <p style="color:var(--success);">✅ 正确答案: ${escapeHtml(e.correctAnswer || '')}</p>
                  <p style="color:var(--text-muted);font-size:0.85rem;">${escapeHtml(e.note || '')}</p>
                  <span class="tag">${e.subject || ''}</span>
                </div>
                <button class="btn-icon" onclick="deleteExamItem('exam_errors',${e.id})">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function showAddError() {
  const question = prompt('题目：');
  if (!question) return;
  const wrongAnswer = prompt('错误答案：', '');
  const correctAnswer = prompt('正确答案：', '');
  const subject = prompt('科目（科一/科二/英语）：', '科一');
  const note = prompt('备注：', '');
  await DB.add('exam_errors', {
    question, wrongAnswer, correctAnswer, subject: subject || '科一', note,
    createdAt: new Date().toISOString()
  });
  showToast('错题已记录', 'success');
  addCoins(5);
  renderExamTab('exam-errors');
}

// ---- 历年真题 ----
async function renderExamHistory(container) {
  const history = await DB.getAll('exam_history');
  const totalCount = history.length;
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>历年真题记录</h3>
        <div style="display:flex;gap:6px;align-items:center;">
          <span class="tag" style="font-size:0.8rem;">${totalCount} 套真题</span>
          <button class="btn btn-sm" onclick="showAddHistory()">+ 手动添加</button>
          <button class="btn btn-sm" onclick="importPresetHistory()">📥 导入预置真题</button>
        </div>
      </div>
      <div class="card-body">
        ${totalCount === 0 ? `
          <div class="empty-state" style="text-align:center;padding:20px;background:var(--card-bg);border-radius:12px;margin-bottom:12px;">
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:10px;">已内置 ${PRESET_EXAM_HISTORY.length} 套近年真题（2024-2025），含选择题+辨析+简答+材料分析</p>
            <button class="btn btn-primary" onclick="importPresetHistory()">📥 一键导入真题</button>
          </div>
        ` : ''}
        <div id="historyList">
          ${totalCount === 0 ? '<p class="empty-hint">暂无真题记录</p>' : history.map(h => `
            <details class="card" style="margin-bottom:10px;padding:14px;">
              <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <h4 style="display:inline;">${escapeHtml(h.year)}年${h.period || ''}半年 · ${escapeHtml(h.subject || '')}</h4>
                  ${h.score ? `<span style="margin-left:8px;">得分: <strong>${h.score}</strong>/${h.totalScore || 100}</span>` : '<span style="margin-left:8px;color:var(--text-muted);font-size:0.85rem;">未刷</span>'}
                </div>
                <button class="btn-icon" onclick="event.preventDefault();deleteExamItem('exam_history',${h.id})" style="margin-left:auto;">🗑️</button>
              </summary>
              <div style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;white-space:pre-wrap;font-size:0.88rem;line-height:1.7;max-height:400px;overflow-y:auto;">
                ${escapeHtml(h.questions || h.note || '暂无详情')}
              </div>
              <div style="margin-top:8px;display:flex;gap:6px;">
                <button class="btn btn-sm" onclick="updateHistoryScore(${h.id})">✏️ 登记分数</button>
              </div>
            </details>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function importPresetHistory() {
  const existing = await DB.getAll('exam_history');
  if (existing.length > 0) {
    if (!confirm('已有 ' + existing.length + ' 套真题。追加导入不会删除已有数据，确定继续？')) return;
  }
  await DB.bulkAdd('exam_history', PRESET_EXAM_HISTORY);
  showToast('成功导入 ' + PRESET_EXAM_HISTORY.length + ' 套真题！', 'success');
  addCoins(20);
  renderExamTab('exam-history');
}

async function updateHistoryScore(id) {
  const item = await DB.get('exam_history', id);
  if (!item) return;
  const score = parseFloat(prompt('请输入得分：', item.score || '0'));
  if (isNaN(score)) return;
  item.score = score;
  await DB.put('exam_history', item);
  showToast('分数已更新', 'success');
  addCoins(5);
  renderExamTab('exam-history');
}

async function showAddHistory() {
  const year = prompt('年份（如2024）：', '2024');
  if (!year) return;
  const period = prompt('上下半年（上/下）：', '上');
  const subject = prompt('科目：', '科一');
  const score = parseFloat(prompt('得分：', '0')) || 0;
  const totalScore = parseFloat(prompt('满分：', '100')) || 100;
  const note = prompt('备注：', '');
  await DB.add('exam_history', {
    year, period, subject, score, totalScore, note,
    createdAt: new Date().toISOString()
  });
  showToast('真题记录已添加', 'success');
  addCoins(5);
  renderExamTab('exam-history');
}

// ---- 艾宾浩斯背诵打卡 ----
async function renderEbbinghaus(container) {
  const items = await DB.getAll('exam_ebbinghaus');
  const intervals = [1, 2, 4, 7, 15, 30]; // 艾宾浩斯复习间隔（天）

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>艾宾浩斯背诵打卡</h3>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="showAddEbbinghaus()">+ 添加背诵内容</button>
          <button class="btn btn-sm" onclick="showImportEbbinghausDialog()">📥 JSON导入</button>
        </div>
      </div>
      <div class="card-body">
        <div id="ebbinghausList">
          ${items.length === 0 ? '<p class="empty-hint">暂无背诵计划</p>' : items.map(item => {
            const startDate = new Date(item.startDate);
            const now = new Date();
            const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
            const reviews = intervals.map(d => {
              const reviewDate = new Date(startDate);
              reviewDate.setDate(startDate.getDate() + d);
              const isToday = reviewDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
              const isPast = reviewDate < now;
              const done = item.reviewedDays?.includes(d) || false;
              return { day: d, date: reviewDate, isToday, isPast, done };
            });

            const todayReviews = reviews.filter(r => r.isToday && !r.done);
            const allDone = reviews.filter(r => r.isPast || r.done).every(r => r.done);

            return `
              <div class="card" style="margin-bottom:10px;padding:14px;${todayReviews.length > 0 ? 'border-left:3px solid var(--accent);' : ''}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div style="flex:1;">
                    <h4>${escapeHtml(item.title)} ${item.source !== 'manual' ? '<span class="tag" style="cursor:default;background:var(--bg-secondary);color:var(--text-secondary);">🔒 固定导入</span>' : ''}</h4>
                    <p style="font-size:0.82rem;color:var(--text-muted);">开始日期: ${item.startDate}</p>
                    ${item.content ? `<p style="margin-top:6px;color:var(--text-secondary);font-size:0.88rem;line-height:1.6;">${escapeHtml(item.content)}</p>` : ''}
                    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
                      ${reviews.map(r => `
                        <span class="tag ${r.done ? '' : r.isToday ? 'star-2' : r.isPast ? 'star-1' : ''}" style="cursor:pointer;" onclick="toggleEbbinghausReview(${item.id},${r.day})" title="第${r.day}天复习 | ${r.date.toISOString().split('T')[0]}">
                          Day${r.day} ${r.done ? '✅' : r.isToday ? '🔔' : '⏳'}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                  ${item.source !== 'manual'
                    ? '<span class="btn-icon" title="固定导入的 JSON 内容不可删除" style="opacity:.45;cursor:not-allowed;">🔒</span>'
                    : `<button class="btn-icon" onclick="deleteExamItem('exam_ebbinghaus',${item.id})">🗑️</button>`}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

async function showAddEbbinghaus() {
  const container = document.getElementById('examTabContent');
  const today = new Date().toISOString().split('T')[0];
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>➕ 添加背诵内容</h3>
        <button class="btn-icon" onclick="renderExamTab('exam-ebbinghaus')">✕</button>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label>背诵内容标题 *</label>
          <input id="ebTitle" class="form-input" placeholder="如：教育观（素质教育的内涵）">
        </div>
        <div class="form-group">
          <label>开始日期</label>
          <input type="date" id="ebStart" class="form-input" value="${today}">
        </div>
        <div class="form-group">
          <label>知识点内容 / 笔记（可选）</label>
          <textarea id="ebContent" class="form-input" rows="4" placeholder="详细内容、口诀、解析…"></textarea>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-primary" onclick="saveEbbinghausFromDialog()">💾 保存</button>
          <button class="btn" style="background:var(--bg);" onclick="renderExamTab('exam-ebbinghaus')">取消</button>
        </div>
      </div>
    </div>
  `;
}

async function saveEbbinghausFromDialog() {
  const title = document.getElementById('ebTitle')?.value?.trim();
  if (!title) { showToast('请填写标题', 'error'); return; }
  const startDate = document.getElementById('ebStart')?.value || new Date().toISOString().split('T')[0];
  const content = document.getElementById('ebContent')?.value?.trim() || '';
  await DB.add('exam_ebbinghaus', {
    title, startDate, content,
    reviewedDays: [],
    source: 'manual',
    createdAt: new Date().toISOString()
  });
  showToast('背诵计划已添加', 'success');
  addCoins(5);
  renderExamTab('exam-ebbinghaus');
}

async function toggleEbbinghausReview(itemId, day) {
  const item = await DB.get('exam_ebbinghaus', itemId);
  if (!item) return;
  const reviewedDays = item.reviewedDays || [];
  if (reviewedDays.includes(day)) {
    item.reviewedDays = reviewedDays.filter(d => d !== day);
  } else {
    item.reviewedDays = [...reviewedDays, day];
    addCoins(10);
    showToast(`Day${day} 复习打卡完成！+10金币`, 'success');
  }
  await DB.put('exam_ebbinghaus', item);
  renderExamTab('exam-ebbinghaus');
}

// ---- 艾宾浩斯 JSON 批量导入知识点 ----
async function showImportEbbinghausDialog() {
  const container = document.getElementById('examTabContent');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📥 JSON 导入背诵知识点</h3>
        <button class="btn-icon" onclick="renderExamTab('exam-ebbinghaus')">✕</button>
      </div>
      <div class="card-body">
        <p style="color:var(--text-secondary);margin-bottom:12px;">
          粘贴 JSON 格式的背诵知识点（可批量导入多条，自动生成 Day1/2/4/7/15/30 复习计划）：
        </p>
        <details style="margin-bottom:12px;">
          <summary style="cursor:pointer;color:var(--accent);font-size:0.9rem;">📋 查看 JSON 格式说明</summary>
          <pre style="background:var(--bg);padding:12px;border-radius:8px;margin-top:8px;font-size:0.8rem;overflow-x:auto;">[
  {
    "title": "背诵内容标题（必填）",
    "startDate": "2026-08-03",
    "content": "可选的知识点内容/笔记"
  }
]</pre>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
            startDate 可省略（默认今天）；content 可省略；可一次导入多条
          </p>
        </details>
        <textarea id="importEbbinghausJson" class="form-input" rows="12" placeholder='粘贴 JSON 数据...' style="font-family:monospace;font-size:0.85rem;width:100%;"></textarea>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="executeImportEbbinghaus()">确认导入</button>
          <button class="btn btn-sm" style="background:var(--bg);" onclick="renderExamTab('exam-ebbinghaus')">取消</button>
          <button class="btn btn-sm" style="background:var(--bg);margin-left:auto;" onclick="fillEbbinghausDemo()">填入示例数据</button>
        </div>
        <div id="importEbbinghausResult" style="margin-top:8px;"></div>
      </div>
    </div>
  `;
}

function fillEbbinghausDemo() {
  const textarea = document.getElementById('importEbbinghausJson');
  if (!textarea) return;
  const today = new Date().toISOString().split('T')[0];
  const demo = [
    { title: '教育观（素质教育的内涵）', startDate: today, content: '提高国民素质为根本宗旨；面向全体学生；促进学生全面发展；促进个性发展；以培养创新精神和实践能力为重点。' },
    { title: '学生观（以人为本）', content: '两独一发：学生是发展的人、独特的人、具有独立意义的人。' },
    { title: '教师观（新课改）', content: '教师是课程的开发者、学生学习的引导者与合作者、教育教学的研究者、社区型开放教师。' }
  ];
  textarea.value = JSON.stringify(demo, null, 2);
}

async function executeImportEbbinghaus() {
  const text = document.getElementById('importEbbinghausJson')?.value?.trim();
  const resultDiv = document.getElementById('importEbbinghausResult');
  if (!text) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">请输入 JSON 数据</p>';
    return;
  }
  let data;
  try {
    data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('数据必须是数组格式');
  } catch (e) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">JSON 格式错误：' + e.message + '</p>';
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const validItems = [];
  const errors = [];
  data.forEach((item, i) => {
    if (!item.title) { errors.push('第' + (i + 1) + '条缺少标题'); return; }
    validItems.push({
      title: item.title,
      startDate: item.startDate || today,
      content: item.content || '',
      reviewedDays: [],
      source: 'import',
      createdAt: new Date().toISOString()
    });
  });
  if (validItems.length === 0) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">没有有效数据可导入。错误：' + errors.join('；') + '</p>';
    return;
  }
  try {
    // 按标题去重合并：已存在的导入项标记 source=import（锁定保护），只新增不存在的
    const existing = await DB.getAll('exam_ebbinghaus');
    const existingByTitle = new Map(existing.map(e => [e.title, e]));
    const toAdd = [];
    let lockedCount = 0;
    for (const v of validItems) {
      const match = existingByTitle.get(v.title);
      if (match) {
        if (match.source !== 'import') {
          match.source = 'import';
          await DB.put('exam_ebbinghaus', match);
        }
        lockedCount++;
      } else {
        toAdd.push(v);
      }
    }
    let addedCount = 0;
    if (toAdd.length > 0) addedCount = await DB.bulkAdd('exam_ebbinghaus', toAdd);
    let msg = '新增 ' + addedCount + ' 条、锁定已有 ' + lockedCount + ' 条固定导入内容（不可删除）。';
    if (errors.length > 0) msg += '（' + errors.join('；') + '）';
    showToast(msg, 'success');
    if (addedCount > 0) addCoins(Math.min(addedCount * 2, 30));
    setTimeout(() => renderExamTab('exam-ebbinghaus'), 500);
  } catch (e) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">导入失败：' + e.message + '</p>';
  }
}

// ---- 试讲素材 ----
async function renderTeachingMaterials(container) {
  const materials = await DB.getAll('exam_teaching');
  const lessonTypes = ['听说课', '阅读课', '写作课', '语法课', '词汇课', '语音课'];

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>全课型试讲素材</h3>
        <button class="btn btn-primary btn-sm" onclick="showAddTeaching()">+ 添加素材</button>
      </div>
      <div class="card-body">
        <div style="margin-bottom:12px;">
          <select class="form-select" id="teachingFilter" onchange="renderTeachingMaterials(document.getElementById('examTabContent'))" style="max-width:200px;">
            <option value="all">全部课型</option>
            ${lessonTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div id="teachingList">
          ${materials.length === 0 ? '<p class="empty-hint">暂无试讲素材</p>' : materials.filter(m => {
            const f = document.getElementById('teachingFilter')?.value;
            return !f || f === 'all' || m.lessonType === f;
          }).map(m => `
            <div class="card" style="margin-bottom:10px;padding:14px;">
              <div style="display:flex;justify-content:space-between;">
                <div style="flex:1;">
                  <h4>${escapeHtml(m.title)}</h4>
                  <span class="tag">${m.lessonType || ''}</span>
                  <span class="tag">${m.grade || ''}</span>
                  <p style="margin-top:6px;color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(m.content || '').substring(0, 300)}</p>
                </div>
                <button class="btn-icon" onclick="deleteExamItem('exam_teaching',${m.id})">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function showAddTeaching() {
  const title = prompt('素材标题：');
  if (!title) return;
  const lessonType = prompt('课型（听说课/阅读课/写作课/语法课/词汇课/语音课）：', '阅读课');
  const grade = prompt('年级（如：初中一年级）：', '初中');
  const content = prompt('内容：', '');
  await DB.add('exam_teaching', {
    title, lessonType: lessonType || '阅读课', grade: grade || '初中', content: content || '',
    createdAt: new Date().toISOString()
  });
  showToast('试讲素材已添加', 'success');
  addCoins(5);
  renderExamTab('exam-teaching');
}

// ---- 考试设置 ----
async function renderExamSettings(container) {
  const examDate = (await DB.get('settings', 'examDate'))?.value || '';
  const examTarget = (await DB.get('settings', 'examTarget'))?.value || '';

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>考试设置</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>考试日期</label>
          <input type="date" class="form-input" id="setExamDate" value="${examDate}">
        </div>
        <div class="form-group">
          <label>目标分数</label>
          <input type="text" class="form-input" id="setExamTarget" value="${examTarget}" placeholder="如：科一90分">
        </div>
        <button class="btn btn-primary" onclick="saveExamSettings()">保存设置</button>
      </div>
    </div>
  `;
}

async function saveExamSettings() {
  const date = document.getElementById('setExamDate').value;
  const target = document.getElementById('setExamTarget').value;
  await DB.put('settings', { key: 'examDate', value: date });
  await DB.put('settings', { key: 'examTarget', value: target });
  showToast('考试设置已保存', 'success');
  renderDashboard(); // 刷新首页倒计时
}

// 通用删除
async function deleteExamItem(store, id) {
  if (store === 'exam_ebbinghaus') {
    const item = await DB.get('exam_ebbinghaus', id);
    // 固定导入内容（JSON导入）与未明确标记手动添加的内容均不可删除，防止误删固定资料
    if (item && item.source !== 'manual') {
      showToast('固定导入的 JSON 内容不可删除', 'warning');
      return;
    }
  }
  if (!confirm('确定删除？')) return;
  await DB.delete(store, id);
  showToast('已删除', 'success');
  renderExamTab(currentExamTab);
}

// ---- 知识点导入 ----
async function importPresetKnowledge() {
  const existing = await DB.getAll('exam_knowledge');
  if (existing.length > 0) {
    if (!confirm('知识点库已有 ' + existing.length + ' 条数据。\n\n"确定" = 追加导入（不删除已有数据）\n"取消" = 放弃导入')) return;
  }

  const count = await DB.bulkAdd('exam_knowledge', PRESET_KNOWLEDGE);
  showToast('成功导入 ' + count + ' 条预置知识点！', 'success');
  addCoins(20);
  renderExamTab('exam-knowledge');
}

async function showImportKnowledgeDialog() {
  const container = document.getElementById('examTabContent');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📥 批量导入知识点</h3>
        <button class="btn-icon" onclick="renderExamTab('exam-knowledge')">✕</button>
      </div>
      <div class="card-body">
        <p style="color:var(--text-secondary);margin-bottom:12px;">
          粘贴 JSON 格式的知识点数据（支持从粉笔APP截图OCR后整理或从其他来源导出）：
        </p>
        
        <details style="margin-bottom:12px;">
          <summary style="cursor:pointer;color:var(--accent);font-size:0.9rem;">📋 查看 JSON 格式说明</summary>
          <pre style="background:var(--bg);padding:12px;border-radius:8px;margin-top:8px;font-size:0.8rem;overflow-x:auto;">[
  {
    "title": "知识点标题",
    "category": "科一",
    "content": "知识点详细内容...\\n支持换行"
  },
  {
    "title": "另一个知识点",
    "category": "科二",
    "content": "内容..."
  }
]</pre>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
            category 填：科一 / 科二 / 英语（三选一）
          </p>
        </details>

        <textarea id="importJsonText" class="form-input" rows="12" placeholder='粘贴 JSON 数据...' style="font-family:monospace;font-size:0.85rem;width:100%;"></textarea>
        
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="btn btn-primary" onclick="executeImportKnowledge()">确认导入</button>
          <button class="btn btn-sm" style="background:var(--bg);" onclick="renderExamTab('exam-knowledge')">取消</button>
          <button class="btn btn-sm" style="background:var(--bg);margin-left:auto;" onclick="fillDemoJson()">填入示例数据</button>
        </div>
        <div id="importResult" style="margin-top:8px;"></div>
      </div>
    </div>
  `;
}

function fillDemoJson() {
  const textarea = document.getElementById('importJsonText');
  if (!textarea) return;
  const demo = [
    { title: '示例：德育原则之疏导原则', category: '科二', content: '疏导原则是指进行德育要循循善诱，以理服人，从提高学生认识入手，调动学生的主动性，使他们积极向上。\n\n基本要求：\n1. 讲明道理，疏导思想\n2. 因势利导，循循善诱\n3. 以表扬激励为主，坚持正面教育' },
    { title: '示例：阅读课PWP教学模式', category: '英语', content: 'PWP模式是阅读教学最常用的模式：\n\nPre-reading（读前）：激活背景知识、预测内容、扫清词汇障碍\nWhile-reading（读中）：泛读(skimming)获取主旨+精读(scanning)获取细节\nPost-reading（读后）：复述、讨论、角色扮演、写作拓展' }
  ];
  textarea.value = JSON.stringify(demo, null, 2);
}

async function executeImportKnowledge() {
  const text = document.getElementById('importJsonText')?.value?.trim();
  const resultDiv = document.getElementById('importResult');
  
  if (!text) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">请输入 JSON 数据</p>';
    return;
  }

  let data;
  try {
    data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('数据必须是数组格式');
  } catch (e) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">JSON 格式错误：' + e.message + '</p>';
    return;
  }

  // 验证并格式化数据
  const validItems = [];
  const errors = [];

  data.forEach((item, i) => {
    if (!item.title) { errors.push('第' + (i+1) + '条缺少标题'); return; }
    const category = item.category;
    if (!['科一', '科二', '英语'].includes(category)) {
      errors.push('第' + (i+1) + '条分类无效（应填：科一/科二/英语），已自动归为"科一"');
      item.category = '科一';
    }
    validItems.push({
      title: item.title,
      category: category || '科一',
      content: item.content || '',
      createdAt: new Date().toISOString()
    });
  });

  if (validItems.length === 0) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">没有有效数据可导入。错误：' + errors.join('；') + '</p>';
    return;
  }

  try {
    const count = await DB.bulkAdd('exam_knowledge', validItems);
    const msg = '成功导入 ' + count + ' 条知识点！';
    if (errors.length > 0) msg += '（' + errors.join('；') + '）';
    showToast(msg, 'success');
    addCoins(Math.min(count * 2, 30));
    setTimeout(() => renderExamTab('exam-knowledge'), 500);
  } catch (e) {
    if (resultDiv) resultDiv.innerHTML = '<p style="color:var(--danger);">导入失败：' + e.message + '</p>';
  }
}

// 暴露全局函数
window.showAddError = showAddError;
window.showAddHistory = showAddHistory;
window.showAddEbbinghaus = showAddEbbinghaus;
window.saveEbbinghausFromDialog = saveEbbinghausFromDialog;
window.showImportEbbinghausDialog = showImportEbbinghausDialog;
window.executeImportEbbinghaus = executeImportEbbinghaus;
window.fillEbbinghausDemo = fillEbbinghausDemo;
window.saveExamSettings = saveExamSettings;
window.deleteExamItem = deleteExamItem;
window.toggleEbbinghausReview = toggleEbbinghausReview;
window.importPresetKnowledge = importPresetKnowledge;
window.showImportKnowledgeDialog = showImportKnowledgeDialog;
window.executeImportKnowledge = executeImportKnowledge;
window.fillDemoJson = fillDemoJson;
window.importPresetKoujue = importPresetKoujue;
window.toggleReciteDone = toggleReciteDone;
window.refreshKoujueList = refreshKoujueList;
window.openAddKoujueDialog = openAddKoujueDialog;
window.handleKoujueImageUpload = handleKoujueImageUpload;
window.saveKoujueFromDialog = saveKoujueFromDialog;
window.importPresetHistory = importPresetHistory;
window.updateHistoryScore = updateHistoryScore;
// 刷题模式
window.startQuiz = startQuiz;
window.answerQuiz = answerQuiz;
window.nextQuiz = nextQuiz;
window.prevQuiz = prevQuiz;
window.finishQuiz = finishQuiz;
window.exitQuiz = exitQuiz;
window.resetQuiz = resetQuiz;
window.retryWrongQuiz = retryWrongQuiz;
window.importPresetQuiz = importPresetQuiz;
