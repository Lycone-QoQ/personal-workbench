/**
 * 积分花园 — 蚂蚁森林式种树/浇水/施肥/积分兑换
 * 森系 × 星星人主题
 */

// 树苗种类定义
const TREE_TYPES = [
  { id: 'oak',      name: '橡树',   icon: '🌰', matureIcon: '🌳',  cost: 50,  desc: '沉稳坚强，根深叶茂',   color: '#8B7355' },
  { id: 'sakura',   name: '樱花',   icon: '🌸', matureIcon: '🌸',  cost: 80,  desc: '温柔浪漫，花开花落',   color: '#F4B8C8' },
  { id: 'ginkgo',   name: '银杏',   icon: '🍂', matureIcon: '🍂',  cost: 60,  desc: '金色希望，千年守望',   color: '#D4A853' },
  { id: 'pine',     name: '松树',   icon: '🌲', matureIcon: '🌲',  cost: 50,  desc: '四季常青，屹立不倒',   color: '#5B8C5A' },
  { id: 'bamboo',   name: '竹子',   icon: '🎋', matureIcon: '🎋',  cost: 70,  desc: '虚心有节，节节高升',   color: '#7BAA6B' },
  { id: 'star',     name: '星星树', icon: '⭐', matureIcon: '🌟',  cost: 100, desc: '许愿之星，梦想成真',   color: '#E8C547' },
];

// 成长阶段 (5个阶段，每阶段约4小时自然生长)
const STAGE_ICONS = ['🌱', '🌿', '🪴', '🌳', '✨'];
const STAGE_NAMES = ['种子', '发芽', '小苗', '成长', '繁盛'];
const STAGE_DURATION = 4 * 60 * 60 * 1000; // 4小时每阶段 (毫秒)
const WATER_SPEED = 1 * 60 * 60 * 1000;    // 浇水加速1小时
const FERTILIZE_SPEED = 3 * 60 * 60 * 1000; // 施肥加速3小时
const WATER_COST = 5;
const FERTILIZE_COST = 10;

// 当前树苗详情弹窗引用
let gardenDetailTree = null;

// ---- 主渲染 ----
async function renderGardenModule() {
  const container = document.getElementById('gardenContent');
  if (!container) return;

  const trees = await DB.getAll('garden_trees');
  const coins = await getCoins();
  const totalPlanted = trees.length;
  const matureCount = trees.filter(t => calcStage(t) >= 4).length;
  const waterCount = trees.reduce((s, t) => s + (t.waterCount || 0), 0);
  const fertilizeCount = trees.reduce((s, t) => s + (t.fertilizeCount || 0), 0);

  container.innerHTML = `
    <!-- 花园顶部统计栏 -->
    <div class="garden-stats-bar">
      <div class="garden-stat-card">
        <div class="garden-stat-icon">🪙</div>
        <div class="garden-stat-num">${coins}</div>
        <div class="garden-stat-label">可用金币</div>
      </div>
      <div class="garden-stat-card">
        <div class="garden-stat-icon">🌳</div>
        <div class="garden-stat-num">${totalPlanted}</div>
        <div class="garden-stat-label">已种树苗</div>
      </div>
      <div class="garden-stat-card">
        <div class="garden-stat-icon">✨</div>
        <div class="garden-stat-num">${matureCount}</div>
        <div class="garden-stat-label">已繁盛</div>
      </div>
      <div class="garden-stat-card">
        <div class="garden-stat-icon">💧</div>
        <div class="garden-stat-num">${waterCount + fertilizeCount}</div>
        <div class="garden-stat-label">呵护次数</div>
      </div>
    </div>

    <!-- 我的花园 -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <h3>🌿 我的花园</h3>
        <span class="tag">${matureCount}/${totalPlanted} 繁盛</span>
      </div>
      <div class="card-body">
        <div id="gardenGrid" class="garden-grid">
          ${trees.length === 0 ? `
            <div class="garden-empty">
              <div style="font-size:4rem;margin-bottom:12px;">🌱</div>
              <h4>花园还是空的</h4>
              <p style="color:var(--text-muted);margin-bottom:4px;">已为你准备了新手金币 🪙，在下方树苗市场选一棵种下吧</p>
              <p style="color:var(--text-muted);font-size:0.82rem;">每棵树都需要你的浇水施肥才能茁壮成长 🌿</p>
            </div>
          ` : trees.sort((a, b) => (b.plantedAt || '').localeCompare(a.plantedAt || '')).map(t => {
            const stage = calcStage(t);
            const typeDef = TREE_TYPES.find(ty => ty.id === t.type) || TREE_TYPES[0];
            const isCustomIcon = !!t.customIcon;
            const nextStageMs = calcNextStageMs(t, stage);
            const stagePct = calcStagePct(t, stage);
            return `
              <div class="garden-tree-card" onclick="showGardenTreeDetail(${t.id})">
                <div class="garden-tree-icon ${stage >= 4 ? 'blooming' : ''} ${isCustomIcon ? 'custom-icon' : ''}">
                  ${isCustomIcon ? `<img src="${escapeHtml(t.customIcon)}" alt="" style="width:52px;height:52px;object-fit:contain;">` : getStageEmoji(typeDef, stage)}
                </div>
                <div class="garden-tree-name">${escapeHtml(t.customName || typeDef.name)}</div>
                <div class="garden-tree-stage">${STAGE_NAMES[Math.min(stage, 4)]}</div>
                <div class="garden-tree-progress">
                  <div class="garden-progress-fill" style="width:${stagePct}%;background:${typeDef.color};"></div>
                </div>
                ${stage < 4 ? `<div class="garden-tree-timer" style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">⏳ ${fmtRemaining(nextStageMs)}</div>` : ''}
                ${t.customName ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px;">"${escapeHtml(t.customName)}"</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- 树苗市场 -->
    <div class="card">
      <div class="card-header">
        <h3>🛒 树苗市场</h3>
        <span class="tag" style="font-size:0.75rem;">种树积福，金币兑换</span>
      </div>
      <div class="card-body">
        <div class="garden-shop-grid">
          ${TREE_TYPES.map(ty => {
            const affordable = coins >= ty.cost;
            return `
            <div class="garden-shop-card" style="border-top:3px solid ${ty.color};">
              <div class="garden-shop-icon">${ty.icon}</div>
              <div class="garden-shop-name">${ty.name}</div>
              <div class="garden-shop-desc">${ty.desc}</div>
              <div class="garden-shop-price">🪙 ${ty.cost}</div>
              <button class="btn btn-sm ${affordable ? 'btn-primary' : 'garden-shop-lacking'}"
                onclick="plantGardenTree('${ty.id}')">
                ${affordable ? '🌱 种下' : '🌱 金币不足'}
              </button>
            </div>
          `;}).join('')}
        </div>
        <p style="text-align:center;margin-top:10px;font-size:0.78rem;color:var(--text-muted);">
          💧 浇水 5金币/次 &nbsp;|&nbsp; 🌸 施肥 10金币/次 &nbsp;|&nbsp; 每4小时自动生长一阶段
        </p>
        <p style="text-align:center;margin-top:4px;font-size:0.74rem;color:var(--text-muted);">
          💰 金币来源：完成番茄钟 / 待办任务 / 解锁成就均可获得
        </p>
      </div>
    </div>

    <!-- 树苗详情弹窗 -->
    <div id="gardenDetailOverlay" class="garden-detail-overlay" style="display:none;" onclick="closeGardenTreeDetail(event)">
      <div class="garden-detail-card" id="gardenDetailCard" onclick="event.stopPropagation()"></div>
    </div>

    <!-- 种树命名弹窗（不依赖 window.prompt，兼容 PWA/手机） -->
    <div id="plantModal" class="garden-detail-overlay" style="display:none;" onclick="if(event.target===this)closePlantModal()">
      <div class="garden-detail-card" onclick="event.stopPropagation()" style="max-width:320px;">
        <div style="text-align:center;padding:8px 0;">
          <h3 style="margin:2px 0 4px;">🌱 种下这棵树</h3>
          <p id="plantModalInfo" style="color:var(--text-muted);font-size:0.85rem;margin-bottom:10px;"></p>
          <input id="plantNameInput" type="text" class="form-input" placeholder="给树起个名字（可选）" maxlength="20"
            style="width:100%;padding:10px;border-radius:10px;border:1px solid var(--border);margin-bottom:12px;background:var(--bg);color:var(--text);"
            onkeydown="if(event.key==='Enter')confirmPlant()">
          <div style="display:flex;gap:10px;">
            <button class="btn" onclick="closePlantModal()" style="flex:1;">取消</button>
            <button class="btn btn-primary" onclick="confirmPlant()" style="flex:1;">🌱 确认种植</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---- 计算成长阶段 ----
function calcStage(tree) {
  const plantedAt = new Date(tree.plantedAt || Date.now()).getTime();
  const now = Date.now();
  const elapsed = now - plantedAt;
  // 浇水加速
  const waterBoost = (tree.waterCount || 0) * WATER_SPEED;
  const fertilizeBoost = (tree.fertilizeCount || 0) * FERTILIZE_SPEED;
  const totalTime = elapsed + waterBoost + fertilizeBoost;
  const stage = Math.min(4, Math.floor(totalTime / STAGE_DURATION));
  return stage;
}

function calcStagePct(tree, currentStage) {
  if (currentStage >= 4) return 100;
  const plantedAt = new Date(tree.plantedAt || Date.now()).getTime();
  const elapsed = Date.now() - plantedAt;
  const waterBoost = (tree.waterCount || 0) * WATER_SPEED;
  const fertilizeBoost = (tree.fertilizeCount || 0) * FERTILIZE_SPEED;
  const totalTime = elapsed + waterBoost + fertilizeBoost;
  const stageTime = totalTime - currentStage * STAGE_DURATION;
  return Math.min(100, Math.round((stageTime / STAGE_DURATION) * 100));
}

function calcNextStageMs(tree, currentStage) {
  if (currentStage >= 4) return 0;
  const plantedAt = new Date(tree.plantedAt || Date.now()).getTime();
  const elapsed = Date.now() - plantedAt;
  const waterBoost = (tree.waterCount || 0) * WATER_SPEED;
  const fertilizeBoost = (tree.fertilizeCount || 0) * FERTILIZE_SPEED;
  const totalTime = elapsed + waterBoost + fertilizeBoost;
  const nextThreshold = (currentStage + 1) * STAGE_DURATION;
  return Math.max(0, nextThreshold - totalTime);
}

function getStageEmoji(typeDef, stage) {
  if (stage < 2) return STAGE_ICONS[stage];
  if (stage === 2) return STAGE_ICONS[2];
  if (stage >= 3) return typeDef.matureIcon;
  return typeDef.icon;
}

function fmtRemaining(ms) {
  if (ms <= 0) return '即将升级';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

// ---- 种树（不使用 window.prompt，兼容 PWA / 手机环境） ----
let pendingPlantType = null;

// 点击「种下」→ 打开命名弹窗（不阻塞、不依赖被禁用的原生 prompt）
function plantGardenTree(typeId) {
  const typeDef = TREE_TYPES.find(ty => ty.id === typeId);
  if (!typeDef) return;
  getCoins().then(coins => {
    if (coins < typeDef.cost) {
      showToast(`金币不足！需要 ${typeDef.cost} 金币`, 'error');
      return;
    }
    pendingPlantType = typeId;
    const modal = document.getElementById('plantModal');
    const input = document.getElementById('plantNameInput');
    const info = document.getElementById('plantModalInfo');
    if (info) info.innerHTML = `${typeDef.icon} <strong>${escapeHtml(typeDef.name)}</strong> &nbsp; 🪙 ${typeDef.cost}`;
    if (input) input.value = '';
    if (modal) modal.style.display = 'flex';
    if (input) setTimeout(() => input.focus(), 60);
  });
}

function closePlantModal() {
  pendingPlantType = null;
  const modal = document.getElementById('plantModal');
  if (modal) modal.style.display = 'none';
}

// 弹窗「确认种植」→ 真正写入数据库并扣金币
async function confirmPlant() {
  if (!pendingPlantType) return;
  const typeDef = TREE_TYPES.find(ty => ty.id === pendingPlantType);
  if (!typeDef) { closePlantModal(); return; }
  const input = document.getElementById('plantNameInput');
  const customName = input ? (input.value || '').trim() : '';
  const name = customName || null;

  const coins = await getCoins();
  if (coins < typeDef.cost) {
    showToast(`金币不足！需要 ${typeDef.cost} 金币`, 'error');
    closePlantModal();
    return;
  }

  await DB.add('garden_trees', {
    type: pendingPlantType,
    customName: name,
    name: name || typeDef.name,
    icon: typeDef.icon,
    customIcon: null,
    waterCount: 0,
    fertilizeCount: 0,
    plantedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });

  await DB.put('coins', { key: 'total', value: coins - typeDef.cost });
  await updateCoinDisplay();
  showToast(`🌱 ${typeDef.name}种下啦！用心呵护它成长吧~`, 'success');
  closePlantModal();
  renderGardenModule();
}

// 详情弹窗内改名（替代被禁用的 prompt）
async function saveGardenTreeName(treeId) {
  const tree = await DB.get('garden_trees', treeId);
  if (!tree) return;
  const input = document.getElementById(`renameInput_${treeId}`);
  const val = input ? (input.value || '').trim() : '';
  const defaultName = TREE_TYPES.find(t => t.id === tree.type)?.name || tree.name;
  tree.customName = val || null;
  tree.name = val || defaultName;
  await DB.put('garden_trees', tree);
  showToast('🌿 名字已保存~', 'success');
  renderGardenModule();
}

// ---- 树苗详情弹窗 ----
async function showGardenTreeDetail(treeId) {
  const tree = await DB.get('garden_trees', treeId);
  if (!tree) return;
  gardenDetailTree = tree;

  const stage = calcStage(tree);
  const typeDef = TREE_TYPES.find(ty => ty.id === tree.type) || TREE_TYPES[0];
  const stagePct = calcStagePct(tree, stage);
  const nextMs = calcNextStageMs(tree, stage);
  const isCustomIcon = !!tree.customIcon;
  const coins = await getCoins();
  const displayName = tree.customName || typeDef.name;
  const plantedDate = new Date(tree.plantedAt).toLocaleDateString('zh-CN', { year:'numeric', month:'long', day:'numeric' });

  const overlay = document.getElementById('gardenDetailOverlay');
  const card = document.getElementById('gardenDetailCard');
  if (!overlay || !card) return;

  card.innerHTML = `
    <div style="text-align:center;padding:10px 0;">
      <div class="garden-detail-icon ${stage >= 4 ? 'blooming' : ''}" style="font-size:5rem;margin-bottom:8px;">
        ${isCustomIcon ? `<img src="${escapeHtml(tree.customIcon)}" alt="" style="width:80px;height:80px;object-fit:contain;">` : getStageEmoji(typeDef, stage)}
      </div>
      <h3 style="margin:4px 0;font-size:1.3rem;">${escapeHtml(displayName)}</h3>
      <div style="color:var(--text-muted);font-size:0.85rem;">${typeDef.name} · ${STAGE_NAMES[Math.min(stage, 4)]}</div>
      <div style="color:var(--text-muted);font-size:0.78rem;">种于 ${plantedDate}</div>

      <!-- 成长进度条 -->
      <div style="margin:14px auto;max-width:280px;">
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);margin-bottom:4px;">
          ${STAGE_NAMES.map((s, i) => `<span style="color:${i<=stage?typeDef.color:'var(--text-muted)'};">${s}</span>`).join('')}
        </div>
        <div class="garden-tree-progress" style="height:8px;">
          <div class="garden-progress-fill" style="width:${stagePct}%;background:${typeDef.color};"></div>
        </div>
        ${stage < 4 ? `<div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted);">⏳ 距下一阶段：${fmtRemaining(nextMs)}</div>` : ''}
      </div>

      <!-- 呵护按钮 -->
      <div style="display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap;">
        <button class="btn btn-sm" onclick="waterGardenTree(${tree.id})" ${coins < WATER_COST ? 'disabled style="opacity:0.4;"' : ''}>
          💧 浇水 (-${WATER_COST}🪙)
        </button>
        <button class="btn btn-sm" onclick="fertilizeGardenTree(${tree.id})" ${coins < FERTILIZE_COST ? 'disabled style="opacity:0.4;"' : ''}>
          🌸 施肥 (-${FERTILIZE_COST}🪙)
        </button>
      </div>
      <div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:6px;">
        已浇水 ${tree.waterCount || 0} 次 · 已施肥 ${tree.fertilizeCount || 0} 次
      </div>

      <!-- 自定义图标 -->
      <div style="margin:8px 0;">
        <button class="btn btn-sm" onclick="uploadGardenTreeIcon(${tree.id})">
          ${isCustomIcon ? '🔄 更换图标' : '🖼️ 自定义图标'}
        </button>
        <input type="file" id="gardenTreeIconInput_${tree.id}" accept="image/*" style="display:none;"
          onchange="handleGardenTreeIconUpload(${tree.id}, this)">
        ${isCustomIcon ? `<button class="btn btn-sm" onclick="resetGardenTreeIcon(${tree.id})" style="margin-left:4px;">↩️ 恢复默认</button>` : ''}
        ${isCustomIcon ? '' : '<div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">可上传照片或苹果emoji截图</div>'}
      </div>

      <!-- 改名（替代原生 prompt，PWA 可用） -->
      <div style="margin:8px 0;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
        <input id="renameInput_${tree.id}" type="text" value="${escapeHtml(tree.customName || '')}" placeholder="给树改名" maxlength="20"
          style="padding:6px 8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);width:130px;">
        <button class="btn btn-sm" onclick="saveGardenTreeName(${tree.id})">保存</button>
      </div>

      <button class="btn btn-secondary btn-sm" onclick="closeGardenTreeDetail()" style="margin-top:4px;">关闭</button>
    </div>
  `;

  overlay.style.display = 'flex';

  // 给自定义图标上传按钮绑定事件
  setTimeout(() => {
    const uploadBtn = document.querySelector(`#gardenTreeIconInput_${tree.id}`);
    // The inline button onclick already handles the click→file dialog trigger
  }, 50);
}

function closeGardenTreeDetail(e) {
  if (e && e.target !== document.getElementById('gardenDetailOverlay')) return;
  const overlay = document.getElementById('gardenDetailOverlay');
  if (overlay) overlay.style.display = 'none';
  gardenDetailTree = null;
}

// ---- 浇水 ----
async function waterGardenTree(treeId) {
  const tree = await DB.get('garden_trees', treeId);
  if (!tree) return;
  const coins = await getCoins();
  if (coins < WATER_COST) { showToast('金币不足！', 'error'); return; }

  tree.waterCount = (tree.waterCount || 0) + 1;
  await DB.put('garden_trees', tree);
  await DB.put('coins', { key: 'total', value: coins - WATER_COST });
  await updateCoinDisplay();

  showToast('💧 浇水成功！生长加速中~', 'success');
  renderGardenModule();
  // 如果弹窗开着，重新渲染弹窗
  if (document.getElementById('gardenDetailOverlay')?.style.display === 'flex') {
    showGardenTreeDetail(treeId);
  }
}

// ---- 施肥 ----
async function fertilizeGardenTree(treeId) {
  const tree = await DB.get('garden_trees', treeId);
  if (!tree) return;
  const coins = await getCoins();
  if (coins < FERTILIZE_COST) { showToast('金币不足！', 'error'); return; }

  tree.fertilizeCount = (tree.fertilizeCount || 0) + 1;
  await DB.put('garden_trees', tree);
  await DB.put('coins', { key: 'total', value: coins - FERTILIZE_COST });
  await updateCoinDisplay();

  showToast('🌸 施肥成功！生长大幅加速~', 'success');
  renderGardenModule();
  if (document.getElementById('gardenDetailOverlay')?.style.display === 'flex') {
    showGardenTreeDetail(treeId);
  }
}

// ---- 自定义图标上传 ----
function uploadGardenTreeIcon(treeId) {
  const input = document.getElementById(`gardenTreeIconInput_${treeId}`);
  if (input) input.click();
}

async function handleGardenTreeIconUpload(treeId, input) {
  const file = input.files[0];
  if (!file) return;

  // 读取为 base64
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    const tree = await DB.get('garden_trees', treeId);
    if (!tree) return;
    tree.customIcon = base64;
    await DB.put('garden_trees', tree);
    showToast('🖼️ 图标已更新！', 'success');
    renderGardenModule();
    if (document.getElementById('gardenDetailOverlay')?.style.display === 'flex') {
      showGardenTreeDetail(treeId);
    }
  };
  reader.readAsDataURL(file);
}

async function resetGardenTreeIcon(treeId) {
  const tree = await DB.get('garden_trees', treeId);
  if (!tree) return;
  tree.customIcon = null;
  await DB.put('garden_trees', tree);
  showToast('图标已恢复默认', 'success');
  renderGardenModule();
  if (document.getElementById('gardenDetailOverlay')?.style.display === 'flex') {
    showGardenTreeDetail(treeId);
  }
}

// ---- 导出全局函数 ----
window.renderGardenModule = renderGardenModule;
window.plantGardenTree = plantGardenTree;
window.confirmPlant = confirmPlant;
window.closePlantModal = closePlantModal;
window.saveGardenTreeName = saveGardenTreeName;
window.showGardenTreeDetail = showGardenTreeDetail;
window.closeGardenTreeDetail = closeGardenTreeDetail;
window.waterGardenTree = waterGardenTree;
window.fertilizeGardenTree = fertilizeGardenTree;
window.uploadGardenTreeIcon = uploadGardenTreeIcon;
window.handleGardenTreeIconUpload = handleGardenTreeIconUpload;
window.resetGardenTreeIcon = resetGardenTreeIcon;
