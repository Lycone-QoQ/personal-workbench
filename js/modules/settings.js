/**
 * 设置页面 - 图标管理、主题自定义、数据管理、通知设置
 */
let currentSettingsTab = 'set-icons';

async function renderSettingsModule() {
  document.querySelectorAll('#settingsTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#settingsTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSettingsTab = tab.dataset.tab;
      renderSettingsTab(currentSettingsTab);
    };
  });
  renderSettingsTab(currentSettingsTab);
}

async function renderSettingsTab(tab) {
  const container = document.getElementById('settingsTabContent');
  switch(tab) {
    case 'set-icons': renderIconSettings(container); break;
    case 'set-theme': renderThemeSettings(container); break;
    case 'set-data': renderDataSettings(container); break;
    case 'set-notify': renderNotifySettings(container); break;
  }
}

// ---- 图标管理 ----
async function renderIconSettings(container) {
  const pages = [
    { key: 'dashboard', name: '首页总览', defaultIcon: '🏠' },
    { key: 'exam', name: '教资备考', defaultIcon: '📚' },
    { key: 'english', name: '英语学习', defaultIcon: '🔤' },
    { key: 'accounting', name: '日常记账', defaultIcon: '💰' },
    { key: 'diary', name: '日记随笔', defaultIcon: '📝' },
    { key: 'fitness', name: '运动饮食', defaultIcon: '💪' },
    { key: 'politics', name: '时政资讯', defaultIcon: '📰' },
    { key: 'podcast', name: '播客管理', defaultIcon: '🎙️' },
    { key: 'speech', name: '表达练习', defaultIcon: '🎤' },
    { key: 'tasks', name: '任务管理', defaultIcon: '✅' },
    { key: 'memos', name: '备忘录', defaultIcon: '💡' },
    { key: 'settings', name: '设置', defaultIcon: '⚙️' }
  ];

  const savedIcons = (await DB.get('settings', 'navIcons'))?.value;
  let iconMap = {};
  try { iconMap = JSON.parse(savedIcons || '{}'); } catch(e) {}

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <h3>导航图标管理</h3>
        <button class="btn btn-secondary btn-sm" onclick="navbar.resetIcons()">🔄 恢复默认图标</button>
      </div>
      <div class="card-body">
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px;">
          支持上传本机图片（PNG/JPG/SVG/GIF）替换导航栏图标，建议使用 24x24 像素的正方形图片。
        </p>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>功能</th><th>当前图标</th><th>操作</th></tr>
            </thead>
            <tbody>
              ${pages.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>
                    <span id="icon-preview-${p.key}" style="font-size:1.5rem;">
                      ${iconMap[p.key] ? `<img src="${iconMap[p.key]}" style="width:24px;height:24px;object-fit:contain;">` : p.defaultIcon}
                    </span>
                  </td>
                  <td>
                    <input type="file" accept="image/*" id="icon-file-${p.key}" style="display:none;" onchange="uploadNavIcon('${p.key}')">
                    <button class="btn btn-sm btn-primary" onclick="document.getElementById('icon-file-${p.key}').click()">📁 上传图片</button>
                    ${iconMap[p.key] ? `<button class="btn btn-sm btn-secondary" onclick="removeNavIcon('${p.key}')">恢复默认</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>图标上传说明</h3></div>
      <div class="card-body" style="font-size:0.9rem;color:var(--text-secondary);line-height:1.8;">
        <p>1. 点击「上传图片」选择本机图片文件</p>
        <p>2. 仅支持常见图片格式：PNG、JPG、SVG、GIF</p>
        <p>3. 推荐使用 24x24 或 48x48 像素的正方形图标</p>
        <p>4. 图标将以 Base64 方式存储在本地 IndexedDB 中</p>
        <p>5. 点击「恢复默认」可还原为系统默认 Emoji 图标</p>
        <p>6. 点击「恢复默认图标」可一键恢复全部图标</p>
      </div>
    </div>
  `;
}

async function uploadNavIcon(page) {
  const file = document.getElementById(`icon-file-${page}`).files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    // 更新图标显示
    const preview = document.getElementById(`icon-preview-${page}`);
    preview.innerHTML = `<img src="${dataUrl}" style="width:24px;height:24px;object-fit:contain;">`;

    // 更新导航栏图标
    const navEl = document.querySelector(`.nav-item[data-page="${page}"] .nav-icon`);
    if (navEl) navEl.innerHTML = `<img src="${dataUrl}" alt="">`;

    // 保存到数据库
    const saved = (await DB.get('settings', 'navIcons'))?.value;
    let map = {};
    try { map = JSON.parse(saved || '{}'); } catch(e) {}
    map[page] = dataUrl;
    await DB.put('settings', { key: 'navIcons', value: JSON.stringify(map) });
    showToast(`${page} 图标已更新`, 'success');
  };
  reader.readAsDataURL(file);
}

async function removeNavIcon(page) {
  const saved = (await DB.get('settings', 'navIcons'))?.value;
  let map = {};
  try { map = JSON.parse(saved || '{}'); } catch(e) {}
  delete map[page];
  await DB.put('settings', { key: 'navIcons', value: JSON.stringify(map) });

  const defaults = {
    dashboard: '🏠', exam: '📚', english: '🔤', accounting: '💰',
    diary: '📝', fitness: '💪', politics: '📰', podcast: '🎙️',
    speech: '🎤', tasks: '✅', memos: '💡', settings: '⚙️'
  };
  const preview = document.getElementById(`icon-preview-${page}`);
  const navEl = document.querySelector(`.nav-item[data-page="${page}"] .nav-icon`);
  if (preview) preview.textContent = defaults[page] || '📌';
  if (navEl) navEl.textContent = defaults[page] || '📌';

  showToast('图标已恢复默认', 'success');
}

// ---- 主题自定义 ----
async function renderThemeSettings(container) {
  const currentSkin = (await DB.get('settings', 'skin'))?.value || 'warm-oat';
  const cardRadius = (await DB.get('settings', 'cardRadius'))?.value || 12;
  const cardOpacity = (await DB.get('settings', 'cardOpacity'))?.value || 1;
  const fontSize = (await DB.get('settings', 'fontSize'))?.value || 0;
  const pixelOn = (await DB.get('settings', 'pixel'))?.value !== 'off';
  const bgImage = (await DB.get('settings', 'bgImage'))?.value;
  const bgOpacity = (await DB.get('settings', 'bgOpacity'))?.value || 1;

  const skinNames = {
    'warm-oat':'暖燕麦 🌾','lavender':'薰衣草 💜','sage-green':'鼠尾草绿 🌿',
    'rose':'玫瑰粉 🌸','sky-blue':'天空蓝 ☁️','peach':'蜜桃 🍑','mint':'薄荷绿 🍃'
  };

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>🌾 界面风格</h3></div>
      <div class="card-body">
        <label class="checkbox-wrap" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <input type="checkbox" id="pixelToggle" ${pixelOn ? 'checked' : ''} onchange="togglePixelStyle(this.checked)">
          <span>星露谷像素风（厚描边 / 硬阴影 / 方块化，保留原有配色）</span>
        </label>
        <p style="font-size:0.82rem;color:var(--text-muted);margin-top:8px;">关闭则回到原本的柔和治愈风格。</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>🖼️ 自定义背景图</h3></div>
      <div class="card-body">
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:12px;">从相册选择一张图片作为工作台背景，可调节透明度。</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <input type="file" accept="image/*" id="bgFileInput" style="display:none;" onchange="uploadBgImage(this)">
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('bgFileInput').click()">📁 选择相册图片</button>
          <button class="btn btn-secondary btn-sm" onclick="clearBgImage()">🗑️ 清除背景</button>
        </div>
        <div style="margin-top:14px;">
          <label style="font-size:0.85rem;color:var(--text-secondary);">背景透明度</label>
          <input type="range" id="bgOpacitySlider" min="0.1" max="1" step="0.05" value="${bgOpacity}" oninput="updateBgOpacity(this.value)" style="width:100%;max-width:400px;">
          <span style="margin-left:12px;font-weight:600;" id="bgOpacityVal">${Math.round(bgOpacity * 100)}%</span>
        </div>
        <div id="bgPreviewWrap" style="margin-top:14px;display:${bgImage ? 'block' : 'none'};">
          <span style="font-size:0.8rem;color:var(--text-muted);">当前背景：</span>
          <div style="margin-top:6px;width:100%;max-width:300px;height:90px;border:2px solid var(--border-color);background-size:cover;background-position:center;${bgImage ? `background-image:url(${bgImage})` : ''}"></div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>主题皮肤</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
          ${Object.entries(skinNames).map(([key,name]) => `
            <button class="btn ${currentSkin === key ? 'btn-primary' : 'btn-secondary'}"
              onclick="changeSkin('${key}')" style="text-align:center;padding:16px;">
              <div style="display:flex;gap:4px;justify-content:center;margin-bottom:8px;">
                ${getSkinPreviewColors(key)}
              </div>
              ${name}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>卡片圆角</h3></div>
      <div class="card-body">
        <input type="range" id="radiusSlider" min="4" max="24" value="${cardRadius}" oninput="updateRadius(this.value)" style="width:100%;max-width:400px;">
        <span style="margin-left:12px;font-weight:600;" id="radiusVal">${cardRadius}px</span>
        <div class="card" style="margin-top:12px;padding:16px;text-align:center;max-width:300px;border-radius:${cardRadius}px;">
          预览效果
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>卡片透明度</h3></div>
      <div class="card-body">
        <input type="range" id="opacitySlider" min="0.6" max="1" step="0.05" value="${cardOpacity}" oninput="updateOpacity(this.value)" style="width:100%;max-width:400px;">
        <span style="margin-left:12px;font-weight:600;" id="opacityVal">${Math.round(cardOpacity * 100)}%</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>全局字体大小</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:10px;">
          ${['小', '中', '大', '特大'].map((label, i) => `
            <button class="btn ${fontSize === i ? 'btn-primary' : 'btn-secondary'}" onclick="changeFontSize(${i})">
              ${label} <span style="font-size:${0.85 + i*0.15}rem;">Aa</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.getElementById('radiusSlider').addEventListener('input', function(){
    document.getElementById('radiusVal').textContent = this.value + 'px';
  });
  document.getElementById('opacitySlider').addEventListener('input', function(){
    document.getElementById('opacityVal').textContent = Math.round(this.value * 100) + '%';
  });
}

function getSkinPreviewColors(skin) {
  const colors = {
    'warm-oat': ['#c4a882','#e8d5c0','#f0ebe3'],
    'lavender': ['#b8a8c8','#e0d5e8','#f0ebf5'],
    'sage-green': ['#a8c8b0','#d5e8d8','#ebf5ed'],
    'rose': ['#d4a8a8','#f0d5d5','#f5ebeb'],
    'sky-blue': ['#a8c0d4','#d5e0f0','#ebf0f5'],
    'peach': ['#e0b898','#f0dcc8','#f5ede5'],
    'mint': ['#a0c8b8','#c8e8d8','#e5f5ed']
  };
  return (colors[skin] || ['#ccc','#ddd','#eee']).map(c =>
    `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${c};"></span>`
  ).join('');
}

function changeSkin(skin) {
  themeManager.applySkin(skin);
  showToast(`已切换为${themeManager.skinNames[skin]}主题`, 'success');
  renderSettingsTab('set-theme');
}

function updateRadius(val) {
  themeManager.setCardRadius(parseInt(val));
  document.getElementById('radiusVal').textContent = val + 'px';
}

function updateOpacity(val) {
  themeManager.setCardOpacity(parseFloat(val));
  document.getElementById('opacityVal').textContent = Math.round(val * 100) + '%';
}

function changeFontSize(level) {
  themeManager.setFontSize(level);
  showToast('字体大小已调整', 'success');
  renderSettingsTab('set-theme');
}

// ---- 界面风格 / 背景图 ----
function togglePixelStyle(on) {
  themeManager.togglePixelStyle(on);
  showToast(on ? '已开启星露谷像素风 🌾' : '已恢复柔和治愈风格', 'success');
}

async function uploadBgImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    themeManager.setBackgroundImage(dataUrl);
    const wrap = document.getElementById('bgPreviewWrap');
    if (wrap) {
      wrap.style.display = 'block';
      const box = wrap.querySelector('div');
      if (box) box.style.backgroundImage = `url(${dataUrl})`;
    }
    showToast('背景图已设置', 'success');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function updateBgOpacity(val) {
  themeManager.setBgOpacity(parseFloat(val));
  const v = document.getElementById('bgOpacityVal');
  if (v) v.textContent = Math.round(val * 100) + '%';
}

function clearBgImage() {
  themeManager.clearBackground();
  const wrap = document.getElementById('bgPreviewWrap');
  if (wrap) wrap.style.display = 'none';
  showToast('背景图已清除', 'success');
}

// ---- 数据管理 ----
async function renderDataSettings(container) {
  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>数据备份与恢复</h3></div>
      <div class="card-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="backupAllData()">📥 全量数据导出备份</button>
          <button class="btn btn-secondary" onclick="document.getElementById('restoreFileInput').click()">📤 备份文件导入恢复</button>
          <input type="file" accept=".json" id="restoreFileInput" style="display:none;" onchange="restoreFromFile(this)">
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>单模块导出</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${[
            'todos-待办任务','vocab-生词本','accounting-记账数据','diary_entries-日记',
            'exam_knowledge-知识点','exam_errors-错题本','exam_history-真题',
            'exam_ebbinghaus-艾宾浩斯','exam_teaching-试讲素材','politics-时政资讯',
            'podcasts-播客','speech_records-表达练习','task_plans-任务计划',
            'task_pomodoros-番茄钟','task_reviews-复盘','memos-备忘录',
            'exercise_logs-运动记录','diet_logs-饮食记录','weight_logs-体重'
          ].map(item => {
            const [store, label] = item.split('-');
            return `<button class="btn btn-secondary btn-sm" onclick="exportModule('${store}','${label}')">📋 ${label}</button>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>⚠️ 危险操作</h3></div>
      <div class="card-body">
        <button class="btn btn-danger" onclick="clearAllData()">🗑️ 一键清空所有数据</button>
        <p style="font-size:0.82rem;color:var(--danger);margin-top:8px;">
          ⚠️ 此操作将删除所有本地存储的数据，无法恢复！请先导出备份。
        </p>
      </div>
    </div>
  `;
}

async function backupAllData() {
  try {
    const backup = await DB.backupAll();
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workbench_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据备份已导出', 'success');
  } catch(e) {
    showToast('备份失败: ' + e.message, 'error');
  }
}

async function restoreFromFile(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup.data) { showToast('无效的备份文件', 'error'); return; }
      showConfirm('⚠️ 导入将覆盖现有数据，确定继续吗？', async () => {
        await DB.restoreAll(backup);
        showToast('数据已恢复！页面将刷新', 'success');
        setTimeout(() => location.reload(), 1500);
      });
    } catch(err) {
      showToast('备份文件解析失败', 'error');
    }
  };
  reader.readAsText(file);
}

async function exportModule(store, label) {
  try {
    const data = await DB.getAll(store);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label}_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${label}数据已导出 (${data.length}条)`, 'success');
  } catch(e) {
    showToast('导出失败', 'error');
  }
}

async function clearAllData() {
  showConfirm('⚠️ 确定要清空所有数据吗？此操作不可恢复！请先确认已导出备份。', async () => {
    showConfirm('再次确认：真的要删除所有数据吗？', async () => {
      try {
        const storeNames = Array.from(DB.db.objectStoreNames);
        for (const name of storeNames) {
          await DB.clear(name);
        }
        showToast('所有数据已清空，页面将刷新', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch(e) {
        showToast('清空失败', 'error');
      }
    });
  });
}

// ---- 通知设置 ----
async function renderNotifySettings(container) {
  const enabled = (await DB.get('settings', 'notifications'))?.value;
  const notifyEnabled = enabled !== 'false';

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>本地通知设置</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label class="checkbox-wrap">
            <input type="checkbox" id="notifyEnable" ${notifyEnabled ? 'checked' : ''} onchange="toggleNotifications(this.checked)">
            <span>启用本地推送通知</span>
          </label>
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-top:8px;">
          开启后将在以下情况发送浏览器通知：<br>
          • 待办任务到期提醒<br>
          • 学习打卡提醒<br>
          • 喝水提醒<br>
          • 教资考试倒计时提醒<br>
          • 备忘录定时提醒
        </p>
        <div style="margin-top:16px;">
          <button class="btn btn-primary" onclick="requestNotificationPermission()">🔔 测试通知权限</button>
          <button class="btn btn-secondary" onclick="checkNotifications()" style="margin-left:8px;">📢 模拟检查提醒</button>
        </div>
      </div>
    </div>
  `;
}

async function toggleNotifications(enabled) {
  await DB.put('settings', { key: 'notifications', value: String(enabled) });
  if (enabled) {
    await requestNotificationPermission();
  }
  showToast(enabled ? '通知已开启' : '通知已关闭', 'success');
}

// 暴露全局函数
window.uploadNavIcon = uploadNavIcon;
window.removeNavIcon = removeNavIcon;
window.changeSkin = changeSkin;
window.updateRadius = updateRadius;
window.updateOpacity = updateOpacity;
window.changeFontSize = changeFontSize;
window.backupAllData = backupAllData;
window.exportModule = exportModule;
window.clearAllData = clearAllData;
window.toggleNotifications = toggleNotifications;
window.togglePixelStyle = togglePixelStyle;
window.uploadBgImage = uploadBgImage;
window.updateBgOpacity = updateBgOpacity;
window.clearBgImage = clearBgImage;
