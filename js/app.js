/**
 * 应用主入口 - 麦子的工作台 V1.0
 */
let themeManager, navbar, doodleBoard, ambientPlayer, bgmPlayer;

document.addEventListener('DOMContentLoaded', async () => {
  // Service Worker 更新后自动刷新，确保新版本代码真正生效（避免旧缓存残留）
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  // 等待数据库初始化
  await DB.ready;

  // 初始化主题
  themeManager = new ThemeManager();

  // 初始化导航
  navbar = new NavbarManager();

  // 初始化涂鸦画板
  doodleBoard = new DoodleBoard();

  // 初始化金币显示（新用户发放启动金，确保能种下第一棵树）
  await ensureStartCoins();
  await updateCoinDisplay();

  // 初始化成就
  await renderAchievements();

  // 浮动工具栏按钮
  document.getElementById('btnAchievement').addEventListener('click', async () => {
    await renderAchievements();
    document.getElementById('achievementModal').classList.add('show');
  });
  document.getElementById('btnGarden').addEventListener('click', () => navbar.navigate('garden'));

  // 全局搜索按钮
  initGlobalSearch();

  // 学习白噪音播放器
  initAmbient();

  // 回到顶部按钮
  document.getElementById('btnBackTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 关闭弹窗（点击遮罩）
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('show');
    });
  });

  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('searchModal').classList.add('show');
      document.getElementById('globalSearchInput').focus();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.show').forEach(m => m.classList.remove('show'));
    }
  });

  // 加载首页
  navbar.navigate('dashboard');

  console.log('🌾 麦子的工作台 V1.0 启动完成');
  console.log('💡 提示: 按 Ctrl+K 打开全局搜索');
});

// 全局搜索
function initGlobalSearch() {
  document.getElementById('btnSearch').addEventListener('click', () => {
    document.getElementById('searchModal').classList.add('show');
    document.getElementById('globalSearchInput').focus();
  });

  document.getElementById('closeSearch').addEventListener('click', () => {
    document.getElementById('searchModal').classList.remove('show');
  });

  let searchTimeout;
  document.getElementById('globalSearchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(e.target.value), 300);
  });
}

async function performSearch(query) {
  const results = document.getElementById('searchResults');
  if (!query.trim()) {
    results.innerHTML = '<p class="empty-hint">输入关键词开始搜索...</p>';
    return;
  }

  const q = query.toLowerCase();
  const items = [];

  // 搜索各个模块
  const searches = [
    { store: 'todos', field: 'title', label: '📋 待办', route: 'tasks' },
    { store: 'vocab', field: 'word', label: '📖 生词', route: 'english' },
    { store: 'diary_entries', field: 'content', label: '📝 日记', route: 'diary' },
    { store: 'memos', field: 'content', label: '💡 备忘录', route: 'memos' },
    { store: 'exam_knowledge', field: 'title', label: '📚 知识点', route: 'exam', alsoSearch: 'content' },
    { store: 'exam_koujue', field: 'title', label: '📖 口诀', route: 'exam', alsoSearch: 'koujue' },
    { store: 'accounting', field: 'note', label: '💰 记账', route: 'accounting' },
    { store: 'politics', field: 'title', label: '📰 时政', route: 'politics' },
    { store: 'podcasts', field: 'title', label: '🎙️ 播客', route: 'podcast' },
    { store: 'speech_records', field: 'title', label: '🎤 表达', route: 'speech' },
    { store: 'task_plans', field: 'title', label: '✅ 任务', route: 'tasks' },
  ];

  for (const s of searches) {
    try {
      const data = await DB.getAll(s.store);
      for (const item of data) {
        let matchText = (item[s.field] || '').toLowerCase();
        let matched = matchText.includes(q);
        // Also search secondary field if specified
        if (!matched && s.alsoSearch) {
          const secText = (item[s.alsoSearch] || '').toLowerCase();
          matched = secText.includes(q);
          if (matched) matchText = secText;
        }
        if (matched) {
          items.push({
            label: s.label,
            text: (item[s.field] || '').substring(0, 80),
            route: s.route
          });
        }
      }
    } catch(e) { /* skip */ }
  }

  if (items.length === 0) {
    results.innerHTML = '<p class="empty-hint">未找到相关结果</p>';
  } else {
    results.innerHTML = items.slice(0, 20).map((item, i) => `
      <div class="search-result-item" data-route="${item.route}">
        <span style="margin-right:8px;">${item.label}</span> ${escapeHtml(item.text)}
      </div>
    `).join('');

    results.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        const route = el.dataset.route;
        document.getElementById('searchModal').classList.remove('show');
        navbar.navigate(route);
      });
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- 学习白噪音播放器初始化 ----
function initAmbient() {
  ambientPlayer = new AmbientPlayer();
  bgmPlayer = new BgmPlayer();
  const panel = document.getElementById('ambientPanel');
  const btn = document.getElementById('btnAmbient');
  const toggle = document.getElementById('ambientToggle');
  const vol = document.getElementById('ambientVolume');
  const closeBtn = document.getElementById('ambientClose');
  if (!panel || !btn || !toggle || !vol || !closeBtn) return;

  btn.addEventListener('click', () => panel.classList.toggle('show'));
  closeBtn.addEventListener('click', () => panel.classList.remove('show'));

  // ---------- 纯音乐 ----------
  const bgmTracks = document.getElementById('bgmTracks');
  const bgmToggle = document.getElementById('bgmToggle');
  const bgmPrev = document.getElementById('bgmPrev');
  const bgmNext = document.getElementById('bgmNext');
  const bgmRandom = document.getElementById('bgmRandom');
  const bgmNow = document.getElementById('bgmNow');

  function updateBgmUI() {
    if (!bgmTracks) return;
    bgmTracks.querySelectorAll('.bgm-track').forEach(x =>
      x.classList.toggle('active', parseInt(x.dataset.index, 10) === bgmPlayer.currentIndex && bgmPlayer.playing));
    if (bgmToggle) bgmToggle.textContent = bgmPlayer.playing ? '⏸ 暂停' : '▶️ 播放';
    if (bgmNow) bgmNow.textContent = bgmPlayer.playing ? bgmPlayer.getTrackName() : '未播放 · 点击曲目开始';
  }

  function stopBgm() {
    if (bgmPlayer.playing) { bgmPlayer.pause(); }
  }
  function stopNoise() {
    if (ambientPlayer.playing) {
      ambientPlayer.pause();
      toggle.textContent = '▶️ 播放';
    }
  }

  // 渲染曲目按钮
  if (bgmTracks) {
    bgmPlayer.tracks.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'bgm-track';
      b.dataset.index = i;
      b.textContent = t.name;
      b.addEventListener('click', async () => {
        stopNoise();
        const ok = await bgmPlayer.play(i);
        if (ok) btn.textContent = '🎶';
        DB.put('settings', { key: 'bgmTrack', value: i });
        updateBgmUI();
      });
      bgmTracks.appendChild(b);
    });
  }

  const startBgm = async () => {
    stopNoise();
    const ok = await bgmPlayer.play();
    if (ok) btn.textContent = '🎶';
    updateBgmUI();
  };

  if (bgmToggle) bgmToggle.addEventListener('click', async () => {
    if (bgmPlayer.playing) { bgmPlayer.pause(); btn.textContent = '🎵'; }
    else { await startBgm(); }
  });
  if (bgmPrev) bgmPrev.addEventListener('click', async () => {
    const name = bgmPlayer.prev();
    if (!bgmPlayer.playing) await startBgm();
    updateBgmUI();
  });
  if (bgmNext) bgmNext.addEventListener('click', async () => {
    bgmPlayer.next();
    if (!bgmPlayer.playing) await startBgm();
    updateBgmUI();
  });
  if (bgmRandom) bgmRandom.addEventListener('click', async () => {
    bgmPlayer.random();
    if (!bgmPlayer.playing) await startBgm();
    updateBgmUI();
  });

  DB.get('settings', 'bgmTrack').then(r => {
    if (r && typeof r.value === 'number') bgmPlayer.currentIndex = r.value;
    updateBgmUI();
  });

  // ---------- 白噪音 ----------
  // 读取已保存偏好
  const applySaved = (type, volume) => {
    if (type) {
      ambientPlayer.type = type;
      panel.querySelectorAll('.ambient-type').forEach(x =>
        x.classList.toggle('active', x.dataset.noise === type));
    }
    if (volume != null) {
      ambientPlayer.volume = parseFloat(volume);
      bgmPlayer.setVolume(parseFloat(volume));
      vol.value = ambientPlayer.volume;
    }
  };
  DB.get('settings', 'ambientType').then(r => applySaved(r && r.value, null));
  DB.get('settings', 'ambientVolume').then(r => applySaved(null, r ? r.value : null));

  // 噪音类型切换
  panel.querySelectorAll('.ambient-type').forEach(b => {
    b.addEventListener('click', () => {
      panel.querySelectorAll('.ambient-type').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const t = b.dataset.noise;
      ambientPlayer.setType(t);
      DB.put('settings', { key: 'ambientType', value: t });
    });
  });

  // 播放 / 暂停（与纯音乐互斥）
  toggle.addEventListener('click', async () => {
    if (ambientPlayer.playing) {
      ambientPlayer.pause();
      toggle.textContent = '▶️ 播放';
      btn.textContent = '🎵';
      return;
    }
    stopBgm();
    updateBgmUI();
    const ok = await ambientPlayer.play();
    if (ok) {
      toggle.textContent = '⏸ 暂停';
      btn.textContent = '🎶';
    }
  });

  // 音量（纯音乐 / 白噪音共用）
  vol.addEventListener('input', () => {
    ambientPlayer.setVolume(parseFloat(vol.value));
    bgmPlayer.setVolume(parseFloat(vol.value));
    DB.put('settings', { key: 'ambientVolume', value: vol.value });
  });
}
