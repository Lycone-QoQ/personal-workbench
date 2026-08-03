/**
 * 学习金币激励体系 + 成就徽章系统
 */

// 金币管理
async function getCoins() {
  const c = await DB.get('coins', 'total');
  return c?.value || 0;
}

// 新用户启动金：首次使用且尚未产生金币记录时，发放一笔初始金币，确保能种下第一棵树
async function ensureStartCoins() {
  const c = await DB.get('coins', 'total');
  const v = c?.value;
  if (v === undefined || v === null || (typeof v === 'number' && isNaN(v))) {
    await DB.put('coins', { key: 'total', value: 120 });
  }
}

async function addCoins(amount) {
  const current = await getCoins();
  const total = current + amount;
  await DB.put('coins', { key: 'total', value: total });
  updateCoinDisplay();
  if (amount > 0) showToast(`+${amount} 金币 💰`, 'success');
  checkAchievements();
}

async function updateCoinDisplay() {
  let el = document.getElementById('coinDisplay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'coinDisplay';
    el.className = 'coin-display';
    el.innerHTML = '🪙 <span id="coinCount">0</span>';
    el.addEventListener('click', (e) => {
      // 点击整条非按钮区域跳转花园
      if (!e.target.closest('#btnGardenStar')) {
        if (typeof navbar !== 'undefined' && navbar) navbar.navigate('garden');
      }
    });
    el.style.cursor = 'pointer';
    document.body.appendChild(el);
  }
  const coins = await getCoins();
  el.querySelector('#coinCount').textContent = coins;
  // 保证star按钮在最右侧
  if (!el.querySelector('#btnGardenStar')) {
    const btn = document.createElement('span');
    btn.id = 'btnGardenStar';
    btn.className = 'garden-star-btn';
    btn.innerHTML = '⭐';
    btn.title = '积分花园';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof navbar !== 'undefined' && navbar) navbar.navigate('garden');
    });
    el.appendChild(btn);
  }
}

// 成就定义
const ACHIEVEMENTS = [
  { id: 'first_todo', name: '初次规划', desc: '完成第一个待办', icon: '📋', condition: async () => (await DB.getAll('todos')).some(t => t.completed) },
  { id: 'streak_7', name: '连续7天', desc: '连续打卡7天', icon: '🔥', condition: async () => (await getStreak()) >= 7 },
  { id: 'streak_30', name: '月度冠军', desc: '连续打卡30天', icon: '👑', condition: async () => (await getStreak()) >= 30 },
  { id: 'vocab_100', name: '单词达人', desc: '生词本达到100个单词', icon: '📖', condition: async () => (await DB.count('vocab')) >= 100 },
  { id: 'diary_10', name: '日记作家', desc: '写了10篇日记', icon: '✍️', condition: async () => (await DB.count('diary_entries')) >= 10 },
  { id: 'pomodoro_10', name: '专注者', desc: '完成10个番茄钟', icon: '🍅', condition: async () => (await DB.getAll('task_pomodoros')).filter(p => p.completed).length >= 10 },
  { id: 'speech_20', name: '演说家', desc: '完成20次表达练习', icon: '🎙️', condition: async () => (await DB.count('speech_records')) >= 20 },
  { id: 'coins_500', name: '小富翁', desc: '积累500金币', icon: '💰', condition: async () => (await getCoins()) >= 500 },
  { id: 'accounting_month', name: '记账能手', desc: '本月记账满30笔', icon: '📊', condition: async () => {
    const records = await DB.getAll('accounting');
    const now = new Date();
    const thisMonth = records.filter(r => new Date(r.date).getMonth() === now.getMonth() && new Date(r.date).getFullYear() === now.getFullYear());
    return thisMonth.length >= 30;
  }},
  { id: 'exercise_7', name: '运动一周', desc: '本周运动打卡7次', icon: '💪', condition: async () => (await DB.count('exercise_logs')) >= 7 },
];

async function getStreak() {
  const val = await DB.get('settings', 'streak');
  return val?.value || 0;
}

async function checkAchievements() {
  for (const ach of ACHIEVEMENTS) {
    const unlocked = await DB.get('achievements', ach.id);
    if (!unlocked || !unlocked.unlockedAt) {
      try {
        if (await ach.condition()) {
          await DB.put('achievements', {
            id: ach.id,
            name: ach.name,
            icon: ach.icon,
            unlockedAt: new Date().toISOString()
          });
          showToast(`🏆 解锁成就: ${ach.name}!`, 'success');
          addCoins(50); // 解锁成就奖励金币
        }
      } catch(e) { /* skip */ }
    }
  }
}

async function renderAchievements() {
  const grid = document.getElementById('achievementGrid');
  if (!grid) return;

  let html = '';
  for (const ach of ACHIEVEMENTS) {
    const unlocked = await DB.get('achievements', ach.id);
    const isUnlocked = unlocked && unlocked.unlockedAt;
    html += `
      <div class="achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${ach.icon}</div>
        <div class="badge-name">${ach.name}</div>
        <div style="font-size:0.7rem;color:var(--text-muted)">${isUnlocked ? '已解锁' : ach.desc}</div>
      </div>`;
  }
  grid.innerHTML = html;

  document.getElementById('btnAchievement').addEventListener('click', () => {
    renderAchievements();
    document.getElementById('achievementModal').classList.add('show');
  });
  document.getElementById('closeAchievement').addEventListener('click', () => {
    document.getElementById('achievementModal').classList.remove('show');
  });
}
