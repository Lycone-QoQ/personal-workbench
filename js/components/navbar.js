/**
 * 侧边导航管理
 */
class NavbarManager {
  constructor() {
    this.currentPage = 'dashboard';
    this.iconMap = {};
    this.init();
  }

  async init() {
    // 导航点击事件
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        this.navigate(page);
        // 移动端关闭侧边栏
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    // 移动端侧边栏切换
    this.createMobileToggle();
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      const toggle = document.getElementById('sidebarToggle');
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          e.target !== toggle && !toggle?.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });

    // 加载自定义图标
    await this.loadCustomIcons();
  }

  createMobileToggle() {
    if (!document.getElementById('sidebarToggle')) {
      const btn = document.createElement('button');
      btn.id = 'sidebarToggle';
      btn.className = 'sidebar-toggle';
      btn.textContent = '☰';
      btn.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
      });
      document.body.appendChild(btn);
    }
  }

  navigate(page) {
    // 更新导航高亮
    document.querySelectorAll('.nav-item[data-page]').forEach(n => n.classList.remove('active'));
    const target = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (target) target.classList.add('active');

    // 切换页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.add('active');
      this.currentPage = page;
      // 触发页面渲染
      this.renderPage(page);
    }
  }

  renderPage(page) {
    switch(page) {
      case 'dashboard': renderDashboard(); break;
      case 'exam': renderExamModule(); break;
      case 'english': renderEnglishModule(); break;
      case 'accounting': renderAccountingModule(); break;
      case 'diary': renderDiaryModule(); break;
      case 'fitness': renderFitnessModule(); break;
      case 'politics': renderPoliticsModule(); break;
      case 'podcast': renderPodcastModule(); break;
      case 'speech': renderSpeechModule(); break;
      case 'tasks': renderTasksModule(); break;
      case 'memos': renderMemosModule(); break;
      case 'settings': renderSettingsModule(); break;
      case 'garden': renderGardenModule(); break;
    }
  }

  async loadCustomIcons() {
    const icons = await DB.get('settings', 'navIcons');
    if (icons?.value) {
      try {
        const map = JSON.parse(icons.value);
        for (const [page, src] of Object.entries(map)) {
          const item = document.querySelector(`.nav-item[data-page="${page}"] .nav-icon`);
          if (item && src) {
            item.innerHTML = `<img src="${src}" alt="">`;
          }
        }
      } catch(e) { /* ignore */ }
    }
  }

  async resetIcons() {
    const defaults = {
      dashboard: '🏠', exam: '📚', english: '🔤', accounting: '💰',
      diary: '📝', fitness: '💪', politics: '📰', podcast: '🎙️',
      speech: '🎤', tasks: '✅', memos: '💡', garden: '🌳', settings: '⚙️'
    };
    for (const [page, icon] of Object.entries(defaults)) {
      const el = document.querySelector(`.nav-item[data-page="${page}"] .nav-icon`);
      if (el) el.textContent = icon;
    }
    await DB.put('settings', { key: 'navIcons', value: '{}' });
    showToast('图标已恢复默认', 'success');
  }
}
