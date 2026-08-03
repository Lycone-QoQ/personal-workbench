/**
 * 运动&饮食记录模块
 */
let currentFitnessTab = 'fit-exercise';

async function renderFitnessModule() {
  document.querySelectorAll('#fitnessTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#fitnessTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFitnessTab = tab.dataset.tab;
      renderFitnessTab(currentFitnessTab);
    };
  });
  renderFitnessTab(currentFitnessTab);
}

async function renderFitnessTab(tab) {
  const container = document.getElementById('fitnessTabContent');
  switch(tab) {
    case 'fit-exercise': renderExercise(container); break;
    case 'fit-diet': renderDiet(container); break;
    case 'fit-water': renderWater(container); break;
    case 'fit-stats': renderFitnessStats(container); break;
  }
}

// ---- 运动打卡 ----
async function renderExercise(container) {
  const logs = await DB.getAll('exercise_logs');
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(l => l.date === today);

  // 身体部位跟练关键词预设
  const bodyParts = [
    { label:'💪 手臂', kw:'手臂跟练' },
    { label:'🦵 腿部', kw:'腿部跟练' },
    { label:'🦴 腹部', kw:'腹部训练跟练' },
    { label:'🔙 背部', kw:'背部训练跟练' },
    { label:'👤 肩部', kw:'肩部训练跟练' },
    { label:'🍑 臀部', kw:'臀部跟练' },
    { label:'🧘 全身', kw:'全身燃脂跟练' },
    { label:'❤️ 有氧', kw:'有氧运动跟练' },
    { label:'🧘‍♀️ 瑜伽', kw:'瑜伽跟练' },
    { label:'🤸 拉伸', kw:'拉伸跟练' }
  ];

  container.innerHTML = `
    <!-- 抖音跟练搜索区 -->
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <h3>🎬 抖音跟练搜索</h3>
        <span style="font-size:0.78rem;color:var(--text-muted);">搜索即跳转，找到最适合你的跟练视频</span>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          ${bodyParts.map(bp => `
            <button class="btn btn-sm" style="background:var(--bg);font-size:0.85rem;" onclick="searchDouyinWorkout('${bp.kw}')">${bp.label}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <input class="form-input" id="douyinSearchInput" placeholder="输入身体部位或运动类型，如"手臂 瘦手臂"..." style="flex:1;" onkeydown="if(event.key==='Enter')searchDouyinWorkout(document.getElementById('douyinSearchInput').value)">
          <button class="btn btn-primary" onclick="searchDouyinWorkout(document.getElementById('douyinSearchInput').value)" style="white-space:nowrap;">🔍 搜索跟练</button>
        </div>
        <p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">点击后跳转抖音网页版搜索，建议在手机上用抖音APP扫码跟练</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>运动打卡</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>运动类型</label>
            <select class="form-select" id="exerciseType">
              <option>跑步</option><option>散步</option><option>骑行</option><option>游泳</option>
              <option>瑜伽</option><option>跳绳</option><option>健身操</option><option>HIIT</option>
              <option>力量训练</option><option>其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>时长（分钟）</label>
            <input type="number" class="form-input" id="exerciseDuration" value="30" min="1">
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <input type="text" class="form-input" id="exerciseNote" placeholder="感受...">
        </div>
        <button class="btn btn-primary" onclick="addExerciseLog()">💪 打卡</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>运动记录</h3></div>
      <div class="card-body">
        <div id="exerciseLogsList">
          ${logs.length === 0 ? '<p class="empty-hint">还没有运动记录</p>' : logs.sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 30).map(l => `
            <div class="stat-row">
              <span>🏃 ${l.type} · ${l.duration}分钟</span>
              <span style="font-size:0.82rem;color:var(--text-muted);">${l.date}</span>
              <button class="btn-icon btn-sm" onclick="deleteFitnessItem('exercise_logs',${l.id})">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function searchDouyinWorkout(keyword) {
  if (!keyword || !keyword.trim()) {
    showToast('请输入搜索关键词', 'warning');
    return;
  }
  const kw = encodeURIComponent(keyword.trim() + ' 跟练');
  const url = 'https://www.douyin.com/search/' + kw + '?type=video';
  const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  let opened = null;
  try { opened = window.open(url, '_blank'); } catch (e) { opened = null; }
  if (!opened) {
    // PWA / 弹窗拦截模式下 window.open 会失败，改为应用内跳转
    window.location.href = url;
    showToast('已在应用内打开抖音搜索：「' + keyword.trim() + '跟练」', 'info');
  } else {
    showToast('正在新窗口打开抖音搜索：「' + keyword.trim() + '跟练」', 'info');
  }
}

async function addExerciseLog() {
  const type = document.getElementById('exerciseType').value;
  const duration = parseInt(document.getElementById('exerciseDuration').value) || 30;
  const note = document.getElementById('exerciseNote').value;
  const date = new Date().toISOString().split('T')[0];

  await DB.add('exercise_logs', { type, duration, note, date, createdAt: new Date().toISOString() });
  showToast('运动打卡成功！', 'success');
  addCoins(15);
  renderFitnessTab('fit-exercise');
}

// ---- 饮食记录 ----
async function renderDiet(container) {
  const logs = await DB.getAll('diet_logs');
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>三餐饮食记录</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          ${['早餐','午餐','晚餐'].map(meal => `
            <div style="text-align:center;">
              <h4>${meal}</h4>
              <textarea class="form-textarea" id="diet${meal}" placeholder="记录吃了什么..." rows="3" style="min-height:60px;"></textarea>
            </div>
          `).join('')}
        </div>
        <div class="form-group" style="margin-top:12px;">
          <label>零食/加餐</label>
          <input type="text" class="form-input" id="dietSnack" placeholder="零食记录（可选）">
        </div>
        <button class="btn btn-primary" onclick="saveDietLog()">🍽️ 保存今日饮食</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>饮食记录</h3></div>
      <div class="card-body">
        <div id="dietLogsList">
          ${logs.length === 0 ? '<p class="empty-hint">还没有饮食记录</p>' : logs.sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 14).map(l => `
            <div class="card" style="margin-bottom:8px;padding:12px;">
              <h4 style="font-size:0.9rem;">${l.date}</h4>
              ${['breakfast','lunch','dinner'].map(m => l[m] ? `<p style="font-size:0.85rem;color:var(--text-secondary);">${m==='breakfast'?'🥐':m==='lunch'?'🍱':'🍲'} ${escapeHtml(l[m])}</p>` : '').join('')}
              ${l.snack ? `<p style="font-size:0.82rem;color:var(--text-muted);">🍪 ${escapeHtml(l.snack)}</p>` : ''}
              <button class="btn-icon btn-sm" onclick="deleteFitnessItem('diet_logs',${l.id})">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

async function saveDietLog() {
  const date = new Date().toISOString().split('T')[0];
  await DB.add('diet_logs', {
    breakfast: document.getElementById('diet早餐')?.value || '',
    lunch: document.getElementById('diet午餐')?.value || '',
    dinner: document.getElementById('diet晚餐')?.value || '',
    snack: document.getElementById('dietSnack')?.value || '',
    date, createdAt: new Date().toISOString()
  });
  showToast('饮食记录已保存', 'success');
  addCoins(5);
  renderFitnessTab('fit-diet');
}

// ---- 饮水量 ----
async function renderWater(container) {
  const logs = await DB.getAll('water_logs');
  const today = new Date().toISOString().split('T')[0];
  const todayLog = logs.find(l => l.date === today);
  const todayWater = todayLog?.amount || 0;

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>今日饮水量</h3></div>
      <div class="card-body" style="text-align:center;">
        <div style="font-size:3rem;">💧</div>
        <div style="font-size:2.5rem;font-weight:700;color:var(--accent-dark);">${todayWater}</div>
        <div style="color:var(--text-secondary);">毫升 (ml)</div>
        <div class="progress-bar" style="height:10px;margin:12px 0;border-radius:5px;">
          <div class="progress-fill" style="width:${Math.min((todayWater/2000)*100,100)}%;${todayWater>=2000?'background:var(--success)':''}"></div>
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted);">目标: 2000ml / 天</p>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap;">
          ${[100,200,300,500].map(ml => `
            <button class="btn btn-secondary" onclick="addWater(${ml})">+${ml}ml</button>
          `).join('')}
          <button class="btn btn-secondary" onclick="addWaterCustom()">+自定义</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>饮水记录</h3></div>
      <div class="card-body">
        ${logs.sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 14).map(l => `
          <div class="stat-row">
            <span>💧 ${l.date}</span>
            <span style="font-weight:600;">${l.amount}ml</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function addWater(ml) {
  const today = new Date().toISOString().split('T')[0];
  const logs = await DB.getAll('water_logs');
  const todayLog = logs.find(l => l.date === today);
  if (todayLog) {
    todayLog.amount += ml;
    await DB.put('water_logs', todayLog);
  } else {
    await DB.add('water_logs', { date: today, amount: ml, createdAt: new Date().toISOString() });
  }
  showToast(`+${ml}ml 饮水记录`, 'success');
  addCoins(2);
  renderFitnessTab('fit-water');
}

async function addWaterCustom() {
  const ml = parseInt(prompt('输入饮水量（ml）：', '250'));
  if (ml && ml > 0) await addWater(ml);
}

// ---- 数据统计 ----
async function renderFitnessStats(container) {
  const [exercises, weights] = await Promise.all([
    DB.getAll('exercise_logs'),
    DB.getAll('weight_logs')
  ]);

  // 本周运动时长
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0,0,0,0);
  const weekExercises = exercises.filter(e => new Date(e.date) >= weekStart);
  const weekMinutes = weekExercises.reduce((s, e) => s + (e.duration || 0), 0);

  container.innerHTML = `
    <div class="dashboard-grid" style="margin-bottom:16px;">
      <div class="card" style="text-align:center;padding:20px;">
        <h3>本周运动</h3>
        <div style="font-size:2rem;font-weight:700;">${weekMinutes}</div>
        <div style="color:var(--text-muted);">分钟</div>
      </div>
      <div class="card" style="text-align:center;padding:20px;">
        <h3>运动次数</h3>
        <div style="font-size:2rem;font-weight:700;">${weekExercises.length}</div>
        <div style="color:var(--text-muted);">次</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>体重记录</h3><button class="btn btn-primary btn-sm" onclick="showAddWeight()">+记录</button></div>
      <div class="card-body">
        <canvas id="weightTrendChart" style="width:100%;height:200px;"></canvas>
        <div style="margin-top:12px;">
          ${weights.sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 10).map(w => `
            <div class="stat-row">
              <span>⚖️ ${w.date}</span>
              <span style="font-weight:600;">${w.weight} kg</span>
              <button class="btn-icon btn-sm" onclick="deleteFitnessItem('weight_logs',${w.id})">🗑️</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('weightTrendChart');
    if (canvas && weights.length > 0) {
      const data = weights.sort((a,b) => (a.date||'').localeCompare(b.date||''));
      drawWeightTrend(canvas, data);
    }
  }, 100);
}

function drawWeightTrend(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 600;
  const h = canvas.height = 200;
  const values = data.map(d => d.weight);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const range = max - min || 1;
  const padding = 30;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#2d2a27' : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#c4a882';
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((val, i) => {
    const x = padding + (chartW / (values.length - 1 || 1)) * i;
    const y = padding + chartH - ((val - min) / range) * chartH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    ctx.fillStyle = '#c4a882';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.stroke();
}

async function showAddWeight() {
  const weight = parseFloat(prompt('体重（kg）：'));
  if (!weight || weight <= 0) return;
  const date = prompt('日期：', new Date().toISOString().split('T')[0]);
  await DB.add('weight_logs', { weight, date: date || new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() });
  showToast('体重已记录', 'success');
  renderFitnessTab('fit-stats');
}

async function deleteFitnessItem(store, id) {
  if (!confirm('确定删除？')) return;
  await DB.delete(store, id);
  showToast('已删除', 'success');
  renderFitnessTab(currentFitnessTab);
}

window.addExerciseLog = addExerciseLog;
window.saveDietLog = saveDietLog;
window.addWater = addWater;
window.addWaterCustom = addWaterCustom;
window.showAddWeight = showAddWeight;
window.deleteFitnessItem = deleteFitnessItem;
window.searchDouyinWorkout = searchDouyinWorkout;
