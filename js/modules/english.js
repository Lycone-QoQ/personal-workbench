/**
 * 英语学习中心 — 多邻国风格闯关学习
 * Tabs: 闯关学习 / 口语练习 / 听力训练 / 生词本 / 句型收藏
 */
let currentEnglishTab = 'eng-quest';
let currentCourseId = 'daily_life';
let currentExercise = 0;
let currentLevelId = null;
let levelExercises = [];
let levelScore = 0;
let comboCount = 0;
let xpGained = 0;
let hearts = 3;
let maxHearts = 3;
let speakingRecorder = null;
let speakingChunks = [];

async function renderEnglishModule() {
  document.querySelectorAll('#englishTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#englishTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentEnglishTab = tab.dataset.tab;
      renderEnglishTab(currentEnglishTab);
    };
  });
  renderEnglishTab(currentEnglishTab);
}

async function renderEnglishTab(tab) {
  const container = document.getElementById('englishTabContent');
  switch(tab) {
    case 'eng-quest': renderQuestMode(container); break;
    case 'eng-speak': renderSpeakMode(container); break;
    case 'eng-listen': renderListenMode(container); break;
    case 'eng-vocab': renderVocab(container); break;
    case 'eng-patterns': renderWritingPatterns(container); break;
  }
}

// ==================== 🎮 闯关学习 ====================
async function renderQuestMode(container) {
  if (currentLevelId !== null && levelExercises.length > 0) {
    renderExerciseUI(container);
    return;
  }

  const course = ENG_COURSES.find(c => c.id === currentCourseId) || ENG_COURSES[0];
  const progress = await loadCourseProgress(course.id);

  container.innerHTML = `
    <!-- 场景切换 -->
    <div class="quest-scenes" style="display:flex;gap:10px;overflow-x:auto;padding:8px 4px 16px;-webkit-overflow-scrolling:touch;">
      ${ENG_COURSES.map(c => `
        <div class="quest-scene-card ${c.id === currentCourseId ? 'scene-active' : ''}"
             onclick="switchCourse('${c.id}')"
             style="min-width:120px;padding:14px 10px;border-radius:14px;text-align:center;cursor:pointer;
                    background:${c.id === currentCourseId ? c.color : 'var(--card-bg)'};
                    color:${c.id === currentCourseId ? '#fff' : 'var(--text)'};
                    box-shadow:0 2px 8px rgba(0,0,0,0.06);transition:all 0.25s;flex-shrink:0;">
          <div style="font-size:2rem;margin-bottom:4px;">${c.icon}</div>
          <div style="font-weight:600;font-size:0.85rem;">${c.name}</div>
          <div style="font-size:0.7rem;opacity:0.8;margin-top:2px;">${c.levels.length}关</div>
        </div>
      `).join('')}
    </div>

    <!-- 课程信息 -->
    <div class="card" style="margin-bottom:16px;background:${course.color}15;border:1px solid ${course.color}30;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:2.5rem;">${course.icon}</div>
        <div style="flex:1;">
          <h3 style="color:${course.color};margin:0;">${course.name}</h3>
          <p style="color:var(--text-secondary);font-size:0.85rem;margin:4px 0 0;">${course.desc}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700;color:${course.color};">⭐ ${progress.totalStars || 0}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${progress.completedLevels || 0}/${course.levels.length}关</div>
        </div>
      </div>
    </div>

    <!-- 闯关路径 -->
    <div class="quest-path" style="position:relative;padding:10px 0 20px;">
      ${renderQuestPath(course, progress)}
    </div>

    <!-- 连击和XP提示 -->
    <div id="questStatusBar" style="display:none;text-align:center;padding:14px;background:linear-gradient(135deg,#ffd700,#ffaa00);border-radius:14px;margin-top:12px;color:#fff;font-weight:700;"></div>
  `;
}

function renderQuestPath(course, progress) {
  const completed = progress.completedLevels || 0;
  return course.levels.map((lv, i) => {
    let state = 'locked';
    let stateIcon = '🔒';
    let bgGradient = 'var(--card-bg)';
    let borderColor = 'var(--border)';

    if (i < completed) {
      state = 'completed';
      stateIcon = '✅';
      bgGradient = course.color + '25';
      borderColor = course.color;
    } else if (i === completed) {
      state = 'active';
      stateIcon = '▶️';
      bgGradient = course.color + '40';
      borderColor = course.color;
    }

    const stars = progress['lv_' + lv.id] || 0;
    const starStr = state === 'completed' ? '⭐'.repeat(Math.min(stars, 3)) : '';

    return `
      <div class="quest-level-node ${state}" onclick="${state !== 'locked' ? `startLevel('${course.id}','${lv.id}')` : ''}"
           style="display:flex;align-items:center;gap:12px;padding:14px;margin:0 0 10px 0;
                  border-radius:16px;background:${bgGradient};border:2px solid ${borderColor};
                  cursor:${state !== 'locked' ? 'pointer' : 'default'};
                  opacity:${state === 'locked' ? '0.5' : '1'};
                  transition:all 0.3s;position:relative;">
        <div class="quest-level-avatar" style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;
               background:${state === 'locked' ? 'var(--card-bg)' : course.color};color:#fff;
               font-size:1.4rem;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.15);">
          ${stateIcon}
        </div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:1rem;">第${i + 1}关 · ${lv.title}</div>
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">${lv.exercises.length}道题 · +${lv.xp} XP</div>
          ${lv.description ? `<div style="font-size:0.75rem;color:var(--accent-dark);margin-top:4px;font-style:italic;opacity:0.8;">🎬 ${escapeHtml(lv.description)}</div>` : ''}
          ${starStr ? `<div style="margin-top:4px;font-size:0.9rem;">${starStr}</div>` : ''}
        </div>
        <div style="font-size:1.5rem;flex-shrink:0;">${state === 'completed' ? '🏆' : state === 'active' ? '🎯' : '🔒'}</div>
      </div>`;
  }).join('');
}

async function loadCourseProgress(courseId) {
  const key = 'progress_' + courseId;
  const row = await DB.get('eng_course_progress', key);
  return row || { totalStars: 0, completedLevels: 0 };
}

async function saveCourseProgress(courseId, data) {
  await DB.put('eng_course_progress', { key: 'progress_' + courseId, ...data });
}

// ==================== 开始闯关 ====================
async function startLevel(courseId, levelId) {
  const course = ENG_COURSES.find(c => c.id === courseId);
  if (!course) return;
  const level = course.levels.find(l => l.id === levelId);
  if (!level) return;

  currentCourseId = courseId;
  currentLevelId = levelId;
  levelExercises = [...level.exercises];
  currentExercise = 0;
  levelScore = 0;
  comboCount = 0;
  xpGained = 0;
  hearts = maxHearts;

  renderEnglishTab('eng-quest');
}

function renderExerciseUI(container) {
  const total = levelExercises.length;
  const idx = currentExercise;
  if (idx >= total) {
    finishLevel(container);
    return;
  }

  const ex = levelExercises[idx];
  const progressPct = Math.round((idx / total) * 100);
  const course = ENG_COURSES.find(c => c.id === currentCourseId);
  const level = course?.levels.find(l => l.id === currentLevelId);

  const questionHTML = renderChoiceExercise(ex, idx, total);

  container.innerHTML = `
    <div class="quest-exercise-container" style="max-width:560px;margin:0 auto;">
      <!-- 课程面包屑 -->
      <div style="text-align:center;margin-bottom:14px;padding:8px 14px;background:${course?.color || 'var(--accent)'}15;border-radius:10px;font-size:0.85rem;color:${course?.color || 'var(--accent-dark)'};font-weight:600;">
        ${course?.icon || '📚'} ${course?.name || ''} · ${level?.title || ''}
        ${level?.description ? `<div style="font-weight:400;font-size:0.75rem;opacity:0.7;">${escapeHtml(level.description)}</div>` : ''}
      </div>
      <!-- Top bar -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <button class="btn btn-sm" onclick="exitLevel()" style="padding:6px 12px;">✕ 退出</button>
        <span id="heartsDisplay" style="font-size:1.1rem;white-space:nowrap;letter-spacing:2px;">${'❤️'.repeat(hearts)}${'🤍'.repeat(Math.max(0, maxHearts - hearts))}</span>
        <div style="flex:1;height:8px;background:var(--card-bg);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${progressPct}%;background:var(--accent);border-radius:4px;transition:width 0.3s;"></div>
        </div>
        <span style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap;">${idx + 1}/${total}</span>
      </div>

      <!-- Combo + Score -->
      <div style="display:flex;gap:12px;margin-bottom:14px;justify-content:center;">
        <div class="combo-badge" style="padding:4px 14px;background:${comboCount >= 3 ? '#ff6b35' : 'var(--card-bg)'};color:${comboCount >= 3 ? '#fff' : 'var(--text-muted)'};border-radius:20px;font-size:0.85rem;font-weight:600;">
          🔥 ${comboCount} 连击
        </div>
        <div class="xp-badge" style="padding:4px 14px;background:var(--card-bg);color:var(--accent-dark);border-radius:20px;font-size:0.85rem;font-weight:600;">
          ⚡ +${xpGained} XP
        </div>
      </div>

      ${questionHTML}
    </div>
  `;

  // 听力选择题自动播放音频
  if (ex.audioText) {
    setTimeout(() => playListening(ex.audioText), 500);
  }
}

// ---- 选择题（统一题型，含听力选择题） ----
function renderChoiceExercise(ex, idx, total) {
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const isListen = !!ex.audioText;
  return `
    <div class="card" style="text-align:left;">
      <div class="quest-type-badge" style="display:inline-block;padding:4px 15px;background:${isListen ? '#88b4e0' : 'var(--accent)'};color:#fff;border-radius:20px;font-size:0.8rem;margin-bottom:14px;">
        ${isListen ? '🎧 听力选择题' : '📝 选择题'}
      </div>
      ${isListen ? `
        <div style="text-align:center;margin-bottom:12px;">
          <button class="btn btn-lg" onclick="playListening('${escapeAttr(ex.audioText)}')"
                  style="width:72px;height:72px;border-radius:50%;font-size:1.8rem;background:#88b4e0;color:#fff;display:inline-flex;align-items:center;justify-content:center;border:none;cursor:pointer;">
            🔊
          </button>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:6px;">点击播放音频，可反复听取</p>
        </div>
      ` : ''}
      <div class="quest-prompt" style="font-size:1.15rem;font-weight:600;margin:14px 0;color:var(--text);line-height:1.6;">
        ${escapeHtml(ex.question)}
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${ex.options.map((o, i) => `
          <button class="btn choice-option" onclick="checkChoiceAnswer(${i})"
                  style="padding:14px 16px;font-size:1rem;border:2px solid var(--border);border-radius:14px;
                         background:var(--card-bg);cursor:pointer;text-align:left;transition:all 0.2s;display:flex;gap:10px;align-items:center;">
            <span class="choice-letter" style="flex-shrink:0;width:26px;height:26px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--accent-dark);">${letters[i]}</span>
            <span style="flex:1;">${escapeHtml(o)}</span>
          </button>
        `).join('')}
      </div>
      <div id="exerciseFeedback" style="margin-top:14px;"></div>
    </div>
  `;
}

// ---- 选择题答题 ----
function checkChoiceAnswer(selectedIndex) {
  const ex = levelExercises[currentExercise];
  if (!ex) return;
  const correctIndex = ex.answer;
  const buttons = document.querySelectorAll('.choice-option');
  buttons.forEach((b, i) => {
    b.disabled = true;
    b.style.cursor = 'default';
    if (i === correctIndex) {
      b.style.background = '#c8e6c9';
      b.style.borderColor = '#66bb6a';
    } else if (i === selectedIndex) {
      b.style.background = '#ffcdd2';
      b.style.borderColor = '#ef9a9a';
    }
  });
  if (selectedIndex === correctIndex) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer(ex.options[correctIndex], ex.options[selectedIndex]);
  }
}
function handleCorrectAnswer() {
  comboCount++;
  const bonus = comboCount >= 5 ? 3 : comboCount >= 3 ? 2 : 1;
  xpGained += bonus;
  levelScore++;
  addCoins(bonus);

  const feedback = document.getElementById('exerciseFeedback');
  if (feedback) {
    feedback.innerHTML = `
      <div style="padding:12px;background:#e8f5e9;border-radius:12px;color:#2e7d32;font-weight:600;animation:fadeInUp 0.3s;">
        🎉 正确！${comboCount >= 5 ? ' Amazing！' : comboCount >= 3 ? ' 太棒了！' : ''} 连击 ×${comboCount} (${bonus > 1 ? `+${bonus}` : ''})
      </div>
      <div style="margin-top:14px;display:flex;gap:10px;">
        <button class="btn btn-primary" onclick="nextExercise()" style="flex:1;padding:12px;">➡️ 下一题</button>
      </div>
    `;
  }

  // 正确也显示解析（如果有）
  const ex = levelExercises[currentExercise];
  if (ex.explanation) {
    const fb = document.getElementById('exerciseFeedback');
    if (fb) fb.innerHTML += `<div style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);">📖 解析：${escapeHtml(ex.explanation)}</div>`;
  }
}

function handleWrongAnswer(correctAnswer, userAnswer) {
  comboCount = 0;
  xpGained = Math.max(0, xpGained - 1);
  hearts = Math.max(0, hearts - 1);
  updateHeartsDisplay();

  const ex = levelExercises[currentExercise];
  const feedback = document.getElementById('exerciseFeedback');
  if (feedback) {
    const nextBtn = hearts <= 0
      ? `<div style="margin-top:14px;display:flex;gap:10px;">
           <button class="btn btn-primary" onclick="failLevel()" style="flex:1;padding:12px;">💔 心心耗尽，重新挑战</button>
         </div>`
      : `<div style="margin-top:14px;display:flex;gap:10px;">
           <button class="btn btn-primary" onclick="nextExercise()" style="flex:1;padding:12px;">➡️ 下一题</button>
         </div>`;
    feedback.innerHTML = `
      <div style="padding:12px;background:#ffebee;border-radius:12px;color:#c62828;font-weight:600;">
        ❌ 还差一点！正确答案是：<span style="background:#fff;padding:2px 8px;border-radius:4px;">${escapeHtml(correctAnswer)}</span>
      </div>
      <div style="margin-top:8px;font-size:0.85rem;color:var(--text-secondary);">
        你的答案：${escapeHtml(userAnswer)}
      </div>
      ${ex && ex.explanation ? `<div style="margin-top:10px;padding:10px;background:var(--bg);border-radius:8px;font-size:0.85rem;color:var(--text-secondary);line-height:1.6;">📖 解析：${escapeHtml(ex.explanation)}</div>` : ''}
      ${nextBtn}
    `;
  }
}

function updateHeartsDisplay() {
  const el = document.getElementById('heartsDisplay');
  if (el) el.innerHTML = '❤️'.repeat(hearts) + '🤍'.repeat(Math.max(0, maxHearts - hearts));
}

function nextExercise() {
  currentExercise++;
  if (currentExercise >= levelExercises.length) {
    finishLevel();
  } else {
    renderEnglishTab('eng-quest');
  }
}

// ==================== 💔 心心耗尽 ====================
function failLevel() {
  const container = document.getElementById('englishTabContent');
  const finishedLevelId = currentLevelId;
  const finishedCourseId = currentCourseId;
  const course = ENG_COURSES.find(c => c.id === finishedCourseId);
  container.innerHTML = `
    <div style="max-width:420px;margin:40px auto;text-align:center;">
      <div style="font-size:4rem;margin-bottom:8px;">💔</div>
      <h2 style="color:#e53935;margin:12px 0;">心心耗尽啦</h2>
      <p style="color:var(--text-secondary);margin-bottom:6px;">别灰心，复习一下再来一次！</p>
      <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px;">完成本关可获得 ⭐ 星级与 +${course?.levels.find(l=>l.id===finishedLevelId)?.xp || 20} XP</p>
      <div style="display:flex;gap:10px;">
        <button class="btn btn-primary" onclick="startLevel('${finishedCourseId}','${finishedLevelId}')" style="flex:1;padding:12px;">🔄 再练一次</button>
        <button class="btn" onclick="renderQuestMode(document.getElementById('englishTabContent'));" style="flex:1;padding:12px;">🗺️ 返回关卡</button>
      </div>
    </div>`;
  currentExercise = 0;
  currentLevelId = null;
  levelExercises = [];
  comboCount = 0;
  xpGained = 0;
  hearts = maxHearts;
}

async function finishLevel(container) {
  if (!container) container = document.getElementById('englishTabContent');
  const course = ENG_COURSES.find(c => c.id === currentCourseId);
  const level = course?.levels.find(l => l.id === currentLevelId);
  const finishedLevelId = currentLevelId;
  const finishedCourseId = currentCourseId;
  const total = levelExercises.length;
  const pct = Math.round((levelScore / total) * 100);
  const stars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
  const earnedXP = level?.xp || 20;

  // 保存进度
  const progress = await loadCourseProgress(currentCourseId);
  const lvKey = 'lv_' + currentLevelId;
  const prevStars = progress[lvKey] || 0;
  progress[lvKey] = Math.max(prevStars, stars);
  progress.totalStars = (progress.totalStars || 0) + Math.max(0, stars - prevStars);

  // 判断是否是下一关
  const levelIndex = course.levels.findIndex(l => l.id === currentLevelId);
  if (levelIndex === (progress.completedLevels || 0)) {
    progress.completedLevels = Math.max(progress.completedLevels || 0, levelIndex + 1);
  }
  await saveCourseProgress(currentCourseId, progress);

  // 更新连续打卡
  await updateEngStreak();

  currentExercise = 0;
  currentLevelId = null;
  levelExercises = [];
  comboCount = 0;
  xpGained = 0;

  container.innerHTML = `
    <div style="max-width:500px;margin:30px auto;text-align:center;">
      <div style="font-size:4rem;margin-bottom:8px;">${stars >= 3 ? '🏆' : stars >= 2 ? '🎉' : '💪'}</div>
      <h2 style="margin:12px 0;color:${course.color};">关卡完成！</h2>
      <div style="font-size:3rem;margin:16px 0;">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <div class="card" style="padding:20px;margin:16px 0;background:${course.color}10;">
        <div style="display:flex;justify-content:space-around;font-size:0.95rem;">
          <div><div style="font-size:1.8rem;font-weight:700;color:var(--accent-dark);">${levelScore}/${total}</div>正确</div>
          <div><div style="font-size:1.8rem;font-weight:700;color:#ff9800;">${pct}%</div>正确率</div>
          <div><div style="font-size:1.8rem;font-weight:700;color:var(--accent);">+${earnedXP}</div>XP</div>
        </div>
      </div>
      ${stars === 3 ? '<div style="color:var(--accent-dark);font-weight:600;margin:8px 0;">🌟 完美通关！解锁下一关！</div>' : ''}
        <div style="display:flex;gap:10px;margin-top:16px;">
          ${levelScore < total ? `<button class="btn" onclick="startLevel('${finishedCourseId}','${finishedLevelId}')" style="flex:1;padding:12px;">🔄 再练一次</button>` : ''}
          <button class="btn btn-primary" onclick="renderQuestMode(document.getElementById('englishTabContent'));" style="flex:1;padding:12px;">🗺️ 返回关卡列表</button>
        </div>
    </div>
  `;

  // 金币和成就
  addCoins(stars * 3);
  try { checkAchievement('english_level'); } catch(e) {}
}

async function updateEngStreak() {
  const today = new Date().toISOString().split('T')[0];
  const streak = await DB.get('eng_streak', 'current') || { count: 0, lastDate: '' };
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (streak.lastDate === today) return; // already logged today

  if (streak.lastDate === yesterday) {
    streak.count += 1;
  } else {
    streak.count = 1;
  }
  streak.lastDate = today;
  await DB.put('eng_streak', { key: 'current', ...streak });
}

// ---- 实用工具 ----
function similarity(a, b) {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  const editDistance = levenshtein(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
      else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function playListening(text) {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.85;
    u.pitch = 1;
    speechSynthesis.speak(u);
  }
}

function exitLevel() {
  if (currentExercise > 0 && !confirm('退出会丢失当前进度，确定吗？')) return;
  currentExercise = 0;
  currentLevelId = null;
  levelExercises = [];
  comboCount = 0;
  xpGained = 0;
  renderEnglishTab('eng-quest');
}

function switchCourse(courseId) {
  currentCourseId = courseId;
  currentExercise = 0;
  currentLevelId = null;
  levelExercises = [];
  renderEnglishTab('eng-quest');
}

// ==================== 🎤 口语练习 ====================
async function renderSpeakMode(container) {
  const logs = await DB.getAll('speaking_logs');
  const streak = await DB.get('eng_streak', 'current') || { count: 0 };

  // 口语话题库
  const topics = [
    { title: '自我介绍', prompt: '用英语介绍你自己：姓名、家乡、爱好、职业/学习状态。', hint: 'My name is... I come from... I enjoy...' },
    { title: '日常习惯', prompt: '描述你典型的一天：几点起床、做什么、怎么度过一天。', hint: 'I usually get up at... Then I... In the evening...' },
    { title: '旅行经历', prompt: '分享一次难忘的旅行：去了哪里、做了什么、为什么难忘。', hint: 'I went to... The most memorable part was...' },
    { title: '最喜欢的书/电影', prompt: '介绍你最喜欢的一本书或电影：内容、为什么喜欢、推荐理由。', hint: 'My favorite book/movie is... because...' },
    { title: '未来计划', prompt: '聊聊你未来一年的计划：学习、工作、生活目标。', hint: 'In the next year, I plan to...' },
    { title: '观点表达', prompt: 'Do you think social media is good or bad? Why?', hint: 'I think social media is... On one hand... On the other hand...' },
    { title: '描述一个地方', prompt: 'Describe a place you love visiting. What does it look like? Why do you love it?', hint: 'It is a... located in... The atmosphere is...' },
    { title: '一次难忘的对话', prompt: 'Describe a memorable conversation you had. Who was it with and what did you talk about?', hint: 'I had a conversation with... We talked about...' }
  ];

  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  container.innerHTML = `
    <!-- 连击统计 -->
    <div class="card" style="margin-bottom:14px;background:linear-gradient(135deg,#e8a0bf20,#f5d0e0);text-align:center;">
      <div style="font-size:0.85rem;color:var(--text-muted);">🔥 学习连续打卡</div>
      <div style="font-size:2.5rem;font-weight:700;color:#e8a0bf;">${streak.count} 天</div>
      <div style="font-size:0.8rem;color:var(--text-muted);">打卡记录：${logs.length} 次</div>
    </div>

    <!-- 今日话题 -->
    <div class="card" style="margin-bottom:14px;border-left:4px solid #e8a0bf;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h3>🎯 今日口语话题</h3>
        <button class="btn btn-sm" onclick="renderSpeakMode(document.getElementById('englishTabContent'))">🔄 换一个</button>
      </div>
      <div class="card-body">
        <h4 style="color:var(--accent-dark);">${escapeHtml(randomTopic.title)}</h4>
        <p style="color:var(--text-secondary);font-size:1rem;line-height:1.6;margin:10px 0;">${escapeHtml(randomTopic.prompt)}</p>
        <p style="font-size:0.85rem;color:var(--text-muted);">💡 ${escapeHtml(randomTopic.hint)}</p>

        <!-- 录音控制 -->
        <div style="margin-top:14px;display:flex;gap:10px;align-items:center;">
          <button class="btn btn-primary" id="speakTopicRecordBtn" onclick="toggleTopicRecording()" style="flex:1;padding:12px;">
            🎙️ 开始录音练习
          </button>
        </div>
        <div id="topicSpeakingStatus" style="margin-top:10px;font-size:0.9rem;color:var(--text-muted);min-height:24px;"></div>

        <!-- 手动打卡 -->
        <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;">
          <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">完成练习后打卡：</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <select id="speakDuration" class="form-select" style="flex:1;min-width:100px;">
              <option value="5">5分钟</option><option value="10">10分钟</option>
              <option value="15" selected>15分钟</option><option value="20">20分钟</option><option value="30">30分钟</option>
            </select>
            <select id="speakRating" class="form-select" style="flex:1;min-width:80px;">
              <option value="1">⭐ 需改进</option><option value="2">⭐⭐ 加油</option><option value="3" selected>⭐⭐⭐ 不错</option><option value="4">⭐⭐⭐⭐ 很好</option><option value="5">⭐⭐⭐⭐⭐ 完美</option>
            </select>
            <button class="btn btn-primary" onclick="checkInSpeaking('${escapeAttr(randomTopic.title)}')" style="white-space:nowrap;">✅ 打卡</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="card">
      <div class="card-header"><h3>📋 口语练习记录</h3></div>
      <div class="card-body">
        ${logs.length === 0 ? '<p class="empty-hint">还没有打卡记录，今天开始练习吧~</p>' :
          logs.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).slice(0, 20).map(l => `
            <div class="stat-row">
              <span>🎤 ${escapeHtml(l.topic || '口语练习')}</span>
              <span>${l.duration || 0}分钟</span>
              <span>${'⭐'.repeat(l.rating || 0)}</span>
              <span style="font-size:0.8rem;color:var(--text-muted);">${(l.date || l.createdAt||'').substring(0, 10)}</span>
              <button class="btn-icon btn-sm" onclick="deleteEnglishItem('speaking_logs',${l.id})">🗑️</button>
            </div>
          `).join('')}
      </div>
    </div>
  `;

  // Reset recording state
  speakingRecorder = null;
  speakingChunks = [];
}

async function checkInSpeaking(topic) {
  const duration = parseInt(document.getElementById('speakDuration')?.value || '15');
  const rating = parseInt(document.getElementById('speakRating')?.value || '3');
  await DB.add('speaking_logs', {
    topic, duration, rating,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });
  await updateEngStreak();
  addCoins(10);
  showToast('🎉 口语打卡成功！+10金币', 'success');
  try { checkAchievement('english_speaking'); } catch(e) {}
  renderEnglishTab('eng-speak');
}

// ---- 录音功能 ----
let topicRecording = false;
let topicRecorder = null;
let topicChunks = [];

async function toggleTopicRecording() {
  const btn = document.getElementById('speakTopicRecordBtn');
  const status = document.getElementById('topicSpeakingStatus');

  if (!topicRecording) {
    // Start
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      topicRecorder = new MediaRecorder(stream);
      topicChunks = [];

      topicRecorder.ondataavailable = e => topicChunks.push(e.data);
      topicRecorder.onstop = () => {
        status.innerHTML = '✅ 录音完成！现在可以打卡记录。';
        btn.innerHTML = '🎙️ 重新录音';
      };

      topicRecorder.start();
      topicRecording = true;
      btn.innerHTML = '⏹️ 停止录音';
      btn.style.background = '#e53935';
      btn.style.color = '#fff';
      status.innerHTML = '🔴 正在录音中...请大声朗读话题内容';
    } catch(e) {
      status.innerHTML = '⚠️ 无法访问麦克风，请在浏览器设置中允许麦克风权限。<br>你也可以直接练习口语，完成后手动打卡。';
    }
  } else {
    // Stop
    topicRecorder.stop();
    topicRecorder.stream.getTracks().forEach(t => t.stop());
    topicRecording = false;
    btn.innerHTML = '🎙️ 重新录音';
    btn.style.background = '';
    btn.style.color = '';
  }
}

async function toggleSpeakingRecord() {
  const btn = document.getElementById('speakRecordBtn');
  const status = document.getElementById('speakingStatus');

  if (!speakingRecorder || speakingRecorder.state === 'inactive') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      speakingRecorder = new MediaRecorder(stream);
      speakingChunks = [];
      speakingRecorder.ondataavailable = e => speakingChunks.push(e.data);
      speakingRecorder.onstop = () => {
        status.innerHTML = '✅ 录音完成！';
        if (btn) btn.innerHTML = '🎙️ 重新录音';
      };
      speakingRecorder.start();
      if (btn) { btn.innerHTML = '⏹️ 停止'; btn.style.background = '#e53935'; btn.style.color = '#fff'; }
      status.innerHTML = '🔴 正在录音...';
    } catch(e) {
      status.innerHTML = '⚠️ 无法访问麦克风，请允许麦克风权限后刷新页面。';
    }
  } else {
    speakingRecorder.stop();
    speakingRecorder.stream.getTracks().forEach(t => t.stop());
    if (btn) { btn.innerHTML = '🎙️ 重新录音'; btn.style.background = ''; btn.style.color = ''; }
  }
}

// ==================== 🎧 听力训练 ====================
async function renderListenMode(container) {
  // 听力练习题
  const listenExs = [
    { type: 'dictation', prompt: '听写练习：听句子，写下你听到的内容。', audioText: 'The weather is beautiful today, so I decided to go for a walk in the park.', answer: 'The weather is beautiful today so I decided to go for a walk in the park', hint: '注意 be going to 和 go for a walk 的连读' },
    { type: 'dictation', prompt: '听写练习：', audioText: 'She has been studying English for three years and can now speak fluently.', answer: 'She has been studying English for three years and can now speak fluently', hint: '注意现在完成进行时 has been studying' },
    { type: 'choice', prompt: '听对话，选择正确答案：', audioText: 'Man: Are you free this weekend? Woman: I have a meeting on Saturday morning, but Sunday is fine.', question: 'When is the woman free?', answer: 'Sunday', options: ['Saturday morning', 'Sunday', 'Both days'] },
    { type: 'choice', prompt: '听短文，选择正确答案：', audioText: 'The library will be closed for renovation from June 1st to June 15th. During this period, students can use the online database or visit the city library instead.', question: 'How long will the library be closed?', answer: '15 days', options: ['1 day', '15 days', '1 month'] },
    { type: 'dictation', prompt: '听写练习（中级）：', audioText: 'Although the project faced numerous challenges, the team managed to complete it ahead of schedule.', answer: 'Although the project faced numerous challenges the team managed to complete it ahead of schedule', hint: 'ahead of schedule = 提前完成' },
    { type: 'choice', prompt: '听名人演讲片段：', audioText: 'The only way to do great work is to love what you do. If you haven\'t found it yet, keep looking. Don\'t settle.', question: 'What is the main message?', answer: 'Love your work and keep searching', options: ['Love your work and keep searching', 'Work hard every day', 'Money is most important'] },
  ];

  container.innerHTML = `
    <div class="card" style="margin-bottom:14px;text-align:center;background:linear-gradient(135deg,#88b4e020,#c8ddf0);">
      <h3 style="color:#5b8cbd;">🎧 听力训练</h3>
      <p style="color:var(--text-secondary);font-size:0.9rem;">共 ${listenExs.length} 道练习。听音频→答题→查看解析。可反复播放。</p>
    </div>

    <div id="listenExerciseArea">
      ${listenExs.map((ex, i) => {
        if (ex.type === 'dictation') {
          return `
            <div class="card" style="margin-bottom:12px;" id="listenCard${i}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:600;">📝 听写 ${i + 1}</span>
                <button class="btn btn-sm" onclick="playListening('${escapeAttr(ex.audioText)}')" style="background:#5b8cbd;color:#fff;">🔊 播放音频</button>
              </div>
              <p style="color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(ex.prompt)}</p>
              ${ex.hint ? `<p style="font-size:0.82rem;color:var(--text-muted);">💡 提示：${escapeHtml(ex.hint)}</p>` : ''}
              <textarea class="form-input" id="listenInput${i}" placeholder="输入你听到的内容..." style="width:100%;min-height:60px;margin:10px 0;"></textarea>
              <div style="display:flex;gap:8px;">
                <button class="btn btn-sm" onclick="checkDictation(${i},'${escapeAttr(ex.answer)}')">✅ 检查</button>
                <button class="btn btn-sm" onclick="showListenAnswer(${i},'${escapeAttr(ex.answer)}')">👁️ 显示答案</button>
              </div>
              <div id="listenFeedback${i}" style="margin-top:8px;"></div>
            </div>`;
        } else {
          return `
            <div class="card" style="margin-bottom:12px;" id="listenCard${i}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:600;">📻 听力理解 ${i + 1}</span>
                <button class="btn btn-sm" onclick="playListening('${escapeAttr(ex.audioText)}')" style="background:#5b8cbd;color:#fff;">🔊 播放音频</button>
              </div>
              <p style="color:var(--text-secondary);margin-bottom:8px;">${escapeHtml(ex.prompt)}</p>
              <p style="font-weight:600;">${escapeHtml(ex.question || '')}</p>
              <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
                ${ex.options.map(o => `
                  <button class="btn listen-choice-btn" onclick="checkListenAnswer(${i},'${escapeAttr(o)}','${escapeAttr(ex.answer)}')"
                          style="text-align:left;padding:10px;border:2px solid var(--border);border-radius:10px;background:var(--card-bg);">
                    ${escapeHtml(o)}
                  </button>
                `).join('')}
              </div>
              <div id="listenFeedback${i}" style="margin-top:8px;"></div>
            </div>`;
        }
      }).join('')}
    </div>
  `;
}

function checkDictation(idx, correctAnswer) {
  const input = document.getElementById('listenInput' + idx);
  const feedback = document.getElementById('listenFeedback' + idx);
  if (!input || !feedback) return;
  const val = input.value.trim().toLowerCase().replace(/[.,!?]/g, '');
  const correct = correctAnswer.toLowerCase().replace(/[.,!?]/g, '');
  const sim = similarity(val, correct);

  if (sim > 0.8) {
    feedback.innerHTML = '<div style="color:#2e7d32;font-weight:600;">✅ 非常好！正确率很高。</div>';
    addCoins(3);
  } else if (sim > 0.5) {
    feedback.innerHTML = `<div style="color:#f57c00;font-weight:600;">⚠️ 部分正确，正确答案：${escapeHtml(correctAnswer)}</div>`;
    addCoins(1);
  } else {
    feedback.innerHTML = `<div style="color:#c62828;font-weight:600;">❌ 需要多练习。正确答案：${escapeHtml(correctAnswer)}</div>`;
  }
}

function showListenAnswer(idx, answer) {
  const feedback = document.getElementById('listenFeedback' + idx);
  if (feedback) feedback.innerHTML = `<div style="color:#5b8cbd;font-weight:600;">📖 答案：${escapeHtml(answer)}</div>`;
}

function checkListenAnswer(idx, userAnswer, correctAnswer) {
  const feedback = document.getElementById('listenFeedback' + idx);
  if (!feedback) return;
  const card = document.getElementById('listenCard' + idx);

  if (userAnswer === correctAnswer) {
    feedback.innerHTML = '<div style="color:#2e7d32;font-weight:600;">✅ 正确！</div>';
    addCoins(5);
    if (card) card.querySelectorAll('.listen-choice-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent.trim() === correctAnswer) b.style.background = '#c8e6c9';
    });
  } else {
    feedback.innerHTML = `<div style="color:#c62828;font-weight:600;">❌ 正确答案是：${escapeHtml(correctAnswer)}</div>`;
    addCoins(1);
    if (card) card.querySelectorAll('.listen-choice-btn').forEach(b => {
      b.disabled = true;
      if (b.textContent.trim() === correctAnswer) b.style.background = '#c8e6c9';
      if (b.textContent.trim() === userAnswer) b.style.background = '#ffcdd2';
    });
  }
}

// ==================== 📖 生词本（保留原有功能） ====================
async function renderVocab(container) {
  const words = await DB.getAll('vocab');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>生词本 (${words.length}个单词)</h3>
        <button class="btn btn-primary btn-sm" onclick="showAddVocab()">+ 添加生词</button>
      </div>
      <div class="card-body">
        <input class="form-input" placeholder="搜索单词..." id="vocabSearch" oninput="filterVocab()" style="margin-bottom:12px;max-width:300px;">
        <div id="vocabList">
          ${words.length === 0 ? '<p class="empty-hint">暂无生词，开始积累吧~</p>' : words.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).map(w => `
            <div class="card" style="margin-bottom:10px;padding:14px;">
              <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                  <h4 style="font-size:1.2rem;color:var(--accent-dark);">${escapeHtml(w.word)} <small style="color:var(--text-muted);font-weight:400;">/${escapeHtml(w.phonetic || '')}/</small></h4>
                  <p style="margin-top:4px;"><strong>释义：</strong>${escapeHtml(w.meaning || '')}</p>
                  ${w.example ? `<p style="color:var(--text-secondary);font-size:0.9rem;font-style:italic;">例句：${escapeHtml(w.example)}</p>` : ''}
                  ${w.exampleCn ? `<p style="color:var(--text-muted);font-size:0.85rem;">翻译：${escapeHtml(w.exampleCn)}</p>` : ''}
                </div>
                <div style="display:flex;gap:4px;">
                  <button class="btn-icon btn-sm" onclick="speakWord('${escapeHtml(w.word)}')" title="发音">🔊</button>
                  <button class="btn-icon btn-sm" onclick="deleteVocab(${w.id})" title="删除">🗑️</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function showAddVocab() {
  const word = prompt('单词：');
  if (!word) return;
  const phonetic = prompt('音标（如 /ˈeksəmpəl/）：', '');
  const meaning = prompt('中文释义：', '');
  const example = prompt('英文例句：', '');
  const exampleCn = prompt('例句翻译：', '');
  await DB.add('vocab', {
    word, phonetic, meaning, example, exampleCn,
    createdAt: new Date().toISOString()
  });
  showToast('生词已添加', 'success');
  addCoins(5);
  renderEnglishTab('eng-vocab');
}

async function filterVocab() {
  const search = (document.getElementById('vocabSearch')?.value || '').toLowerCase();
  const words = await DB.getAll('vocab');
  const filtered = search ? words.filter(w => w.word.toLowerCase().includes(search) || (w.meaning||'').includes(search) || (w.example||'').toLowerCase().includes(search)) : words;
  const list = document.getElementById('vocabList');
  if (list) list.innerHTML = filtered.length === 0 ? '<p class="empty-hint">无匹配结果</p>' : filtered.map(w => `
    <div class="card" style="margin-bottom:10px;padding:14px;">
      <h4 style="font-size:1.2rem;color:var(--accent-dark);">${escapeHtml(w.word)} <small style="color:var(--text-muted);">/${escapeHtml(w.phonetic || '')}/</small></h4>
      <p>释义：${escapeHtml(w.meaning || '')}</p>
      ${w.example ? `<p style="color:var(--text-secondary);font-style:italic;">${escapeHtml(w.example)}</p>` : ''}
    </div>
  `).join('');
}

function speakWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  } else {
    showToast('您的浏览器不支持语音合成', 'warning');
  }
}

async function deleteVocab(id) {
  if (!confirm('确定删除？')) return;
  await DB.delete('vocab', id);
  showToast('已删除', 'success');
  renderEnglishTab('eng-vocab');
}

// ==================== ✍️ 句型收藏（保留原有功能） ====================
async function renderWritingPatterns(container) {
  const patterns = await DB.getAll('writing_patterns');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>写作句型素材收藏</h3>
        <button class="btn btn-primary btn-sm" onclick="showAddWritingPattern()">+ 收藏句型</button>
      </div>
      <div class="card-body">
        <div id="writingPatternsList">
          ${patterns.length === 0 ? '<p class="empty-hint">暂无句型收藏</p>' : patterns.map(p => `
            <div class="card" style="margin-bottom:10px;padding:14px;">
              <div style="display:flex;justify-content:space-between;">
                <div style="flex:1;">
                  <p style="font-size:1.05rem;color:var(--accent-dark);">${escapeHtml(p.pattern || '')}</p>
                  <p style="color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(p.meaning || '')}</p>
                  ${p.example ? `<p style="color:var(--text-muted);font-size:0.85rem;font-style:italic;">${escapeHtml(p.example)}</p>` : ''}
                  <span class="tag">${p.category || '通用'}</span>
                </div>
                <button class="btn-icon" onclick="deleteEnglishItem('writing_patterns',${p.id})">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function showAddWritingPattern() {
  const pattern = prompt('句型模板：', '');
  if (!pattern) return;
  const meaning = prompt('中文释义：', '');
  const example = prompt('例句：', '');
  const category = prompt('分类（如：议论文/书信/记叙文）：', '通用');
  await DB.add('writing_patterns', {
    pattern, meaning: meaning || '', example: example || '', category: category || '通用',
    createdAt: new Date().toISOString()
  });
  showToast('句型已收藏', 'success');
  addCoins(5);
  renderEnglishTab('eng-patterns');
}

async function deleteEnglishItem(store, id) {
  if (!confirm('确定删除？')) return;
  await DB.delete(store, id);
  showToast('已删除', 'success');
  renderEnglishTab(currentEnglishTab);
}

// ---- 辅助函数 ----
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/`/g, '\\`').replace(/\n/g, '\\n');
}

// ---- 全局导出 ----
window.renderEnglishModule = renderEnglishModule;
window.renderEnglishTab = renderEnglishTab;
window.startLevel = startLevel;
window.exitLevel = exitLevel;
window.switchCourse = switchCourse;
window.checkChoiceAnswer = checkChoiceAnswer;
window.nextExercise = nextExercise;
window.playListening = playListening;
window.checkInSpeaking = checkInSpeaking;
window.toggleTopicRecording = toggleTopicRecording;
window.toggleSpeakingRecord = toggleSpeakingRecord;
window.checkDictation = checkDictation;
window.showListenAnswer = showListenAnswer;
window.checkListenAnswer = checkListenAnswer;
window.showAddVocab = showAddVocab;
window.showAddWritingPattern = showAddWritingPattern;
window.deleteVocab = deleteVocab;
window.deleteEnglishItem = deleteEnglishItem;
window.filterVocab = filterVocab;
window.speakWord = speakWord;
window.renderQuestMode = renderQuestMode;
window.renderSpeakMode = renderSpeakMode;
window.failLevel = failLevel;
window.updateHeartsDisplay = updateHeartsDisplay;
