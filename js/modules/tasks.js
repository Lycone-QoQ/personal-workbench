/**
 * 学习任务管理 - 任务列表、番茄钟、复盘模板
 */
let currentTasksTab = 'task-list';
let pomodoroInterval = null;
let pomodoroSeconds = 0;       // 当前显示的秒数（运行时实时计算）
let pomodoroRunning = false;
let pomodoroMode = 'countdown'; // 'countdown' | 'forward'
let pomodoroDuration = 25;     // 自定义倒计时分钟数
let pomodoroTaskName = '';     // 当前任务名称
// 精确计时：用时间戳计算实际经过秒数，避免 setInterval 漂移
let pomodoroStartTime = 0;     // Date.now() 计时起点
let pomodoroElapsedBase = 0;   // 暂停前的累计秒数（正计时=已过、倒计时=已消耗）

async function renderTasksModule() {
  document.querySelectorAll('#tasksTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#tasksTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentTasksTab = tab.dataset.tab;
      renderTasksTab(currentTasksTab);
    };
  });
  renderTasksTab(currentTasksTab);
}

async function renderTasksTab(tab) {
  const container = document.getElementById('tasksTabContent');
  switch(tab) {
    case 'task-list': renderTaskList(container); break;
    case 'task-timer': renderPomodoro(container); break;
    case 'task-stats': renderPomodoroStats(container); break;
    case 'task-review': renderTaskReview(container); break;
  }
}

// ---- 任务列表 ----
async function renderTaskList(container) {
  const tasks = await DB.getAll('task_plans');
  const now = new Date();

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>添加任务</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>任务标题</label>
          <input type="text" class="form-input" id="taskTitle" placeholder="输入任务...">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>计划类型</label>
            <select class="form-select" id="taskPlanType">
              <option>日计划</option><option>周计划</option><option>月计划</option>
            </select>
          </div>
          <div class="form-group">
            <label>截止日期</label>
            <input type="date" class="form-input" id="taskDueDate">
          </div>
          <div class="form-group">
            <label>优先级</label>
            <select class="form-select" id="taskPriority">
              <option value="normal">普通</option><option value="high">重要</option><option value="urgent">紧急</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary" onclick="addTaskPlan()">+ 添加</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>任务列表</h3>
        <select class="form-select" id="taskPlanFilter" onchange="renderTasksTab('task-list')" style="max-width:120px;">
          <option value="all">全部</option><option value="日计划">日计划</option><option value="周计划">周计划</option><option value="月计划">月计划</option>
        </select>
      </div>
      <div class="card-body">
        <div id="taskPlansList">
          ${renderTaskItems(tasks, now)}
        </div>
      </div>
    </div>
  `;
}

function renderTaskItems(tasks, now) {
  const planFilter = document.getElementById('taskPlanFilter')?.value;

  let filtered = tasks.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  if (planFilter && planFilter !== 'all') filtered = filtered.filter(t => t.planType === planFilter);

  if (filtered.length === 0) return '<p class="empty-hint">暂无任务</p>';

  return filtered.map(t => {
    const isOverdue = t.dueDate && new Date(t.dueDate) < now && !t.completed;
    const priorityColors = { urgent: 'var(--danger)', high: 'var(--warning)', normal: 'var(--text-secondary)' };
    return `
      <div class="card" style="margin-bottom:8px;padding:12px;${isOverdue ? 'border-left:3px solid var(--danger);' : ''}">
        <div style="display:flex;align-items:center;gap:10px;">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskPlan(${t.id})" style="width:18px;height:18px;accent-color:var(--accent);">
          <div style="flex:1;">
            <span style="${t.completed ? 'text-decoration:line-through;color:var(--text-muted);' : ''}font-weight:500;">
              ${escapeHtml(t.title)}
              ${isOverdue ? '<span style="color:var(--danger);font-size:0.78rem;">⚠逾期</span>' : ''}
            </span>
            <div style="display:flex;gap:6px;margin-top:4px;">
              <span class="tag">${t.planType || '任务'}</span>
              <span class="tag" style="color:${priorityColors[t.priority]||'var(--text-secondary)'};">${t.priority==='urgent'?'🔴紧急':t.priority==='high'?'🟡重要':'⚪普通'}</span>
              ${t.dueDate ? `<span style="font-size:0.78rem;color:${isOverdue?'var(--danger)':'var(--text-muted)'};">📅 ${t.dueDate}</span>` : ''}
            </div>
            ${t.subtasks ? `<div style="margin-top:6px;">${JSON.parse(t.subtasks||'[]').map((st,i) => `
              <div style="font-size:0.82rem;color:var(--text-secondary);padding:2px 0;">
                <input type="checkbox" ${st.done?'checked':''} onchange="toggleSubtask(${t.id},${i})"> ${escapeHtml(st.text)}
              </div>
            `).join('')}</div>` : ''}
          </div>
          <div style="display:flex;gap:4px;">
            <button class="btn-icon btn-sm" onclick="addSubtask(${t.id})">➕</button>
            <button class="btn-icon btn-sm" onclick="deleteTaskPlan(${t.id})">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function addTaskPlan() {
  const title = document.getElementById('taskTitle').value;
  if (!title) { showToast('请输入任务标题', 'error'); return; }

  await DB.add('task_plans', {
    title, planType: document.getElementById('taskPlanType').value,
    dueDate: document.getElementById('taskDueDate').value,
    priority: document.getElementById('taskPriority').value,
    completed: false, subtasks: '[]',
    createdAt: new Date().toISOString()
  });

  // 同步到 todos
  if (document.getElementById('taskPlanType').value === '日计划' || document.getElementById('taskDueDate').value) {
    await DB.add('todos', {
      title, completed: false,
      dueDate: document.getElementById('taskDueDate').value,
      createdAt: new Date().toISOString()
    });
  }

  showToast('任务已添加', 'success');
  addCoins(5);
  document.getElementById('taskTitle').value = '';
  renderTasksTab('task-list');
}

async function toggleTaskPlan(id) {
  const task = await DB.get('task_plans', id);
  if (task) {
    task.completed = !task.completed;
    await DB.put('task_plans', task);
    if (task.completed) { addCoins(10); showToast('任务完成！+10金币', 'success'); }
    renderTasksTab('task-list');
  }
}

async function addSubtask(id) {
  const task = await DB.get('task_plans', id);
  if (!task) return;
  const subtasks = JSON.parse(task.subtasks || '[]');
  const text = prompt('子任务：');
  if (text) {
    subtasks.push({ text, done: false });
    task.subtasks = JSON.stringify(subtasks);
    await DB.put('task_plans', task);
    renderTasksTab('task-list');
  }
}

async function toggleSubtask(taskId, index) {
  const task = await DB.get('task_plans', taskId);
  if (!task) return;
  const subtasks = JSON.parse(task.subtasks || '[]');
  if (subtasks[index]) {
    subtasks[index].done = !subtasks[index].done;
    task.subtasks = JSON.stringify(subtasks);
    await DB.put('task_plans', task);
    renderTasksTab('task-list');
  }
}

async function deleteTaskPlan(id) {
  if (!confirm('确定删除？')) return;
  await DB.delete('task_plans', id);
  showToast('已删除', 'success');
  renderTasksTab('task-list');
}

// ---- 番茄钟 ----
async function renderPomodoro(container) {
  const pomodoros = await DB.getAll('task_pomodoros');
  const today = new Date().toISOString().split('T')[0];
  const todayPomos = pomodoros.filter(p => p.date === today && p.completed);
  const todayForward = pomodoros.filter(p => p.date === today && p.mode === 'forward' && p.completed);

  // 正计时未运行时显示 00:00；倒计时未运行时显示自定义分钟数
  let displayTime;
  if (pomodoroRunning || pomodoroSeconds > 0) {
    const min = String(Math.floor(Math.abs(pomodoroSeconds) / 60)).padStart(2, '0');
    const sec = String(Math.abs(pomodoroSeconds) % 60).padStart(2, '0');
    displayTime = `${min}:${sec}`;
  } else {
    displayTime = pomodoroMode === 'forward' ? '00:00' : `${String(pomodoroDuration).padStart(2,'0')}:00`;
  }

  const countdownPresets = [15, 25, 30, 45, 60];

  container.innerHTML = `
    <div class="card" style="text-align:center;">
      <div class="card-body" style="padding:28px 24px 32px;">

        <!-- 任务名称 -->
        <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:8px;">
          <input type="text" class="form-input pomodoro-task-input" id="pomodoroTaskInput"
            placeholder="当前任务名称（可选）" value="${escapeHtml(pomodoroTaskName)}"
            onchange="updatePomodoroTaskName(this.value)"
            style="max-width:260px;text-align:center;font-size:0.92rem;border:none;border-bottom:2px dashed var(--border-color);border-radius:0;background:transparent;padding:4px 8px;">
          ${pomodoroTaskName ? `<button class="btn-icon btn-sm" onclick="editPomodoroTaskName()" title="编辑名称" style="opacity:0.5;">✏️</button>` : ''}
        </div>

        <!-- 计时显示 -->
        <div style="font-size:5rem;margin:8px 0 4px;">${pomodoroMode === 'forward' ? '⏱️' : '🍅'}</div>
        <div style="font-size:3.4rem;font-weight:700;color:${pomodoroMode==='forward' ? 'var(--accent-dark)' : 'var(--accent-dark)'};margin:8px 0;font-variant-numeric:tabular-nums;" id="pomodoroDisplay">${displayTime}</div>
        <div style="margin:6px 0;color:var(--text-secondary);font-size:0.92rem;" id="pomodoroStatus">${pomodoroRunning ? (pomodoroMode==='forward'?'正计时中...':'专注中...') : '准备开始'}</div>

        <!-- 模式切换 -->
        <div style="display:flex;gap:6px;justify-content:center;margin:12px 0;">
          <button class="btn btn-sm ${pomodoroMode==='countdown'?'btn-primary':''}" onclick="switchPomodoroMode('countdown')"
            style="min-width:72px;${pomodoroMode==='countdown'?'':'opacity:0.5;'}">⏳ 倒计时</button>
          <button class="btn btn-sm ${pomodoroMode==='forward'?'btn-primary':''}" onclick="switchPomodoroMode('forward')"
            style="min-width:72px;${pomodoroMode==='forward'?'':'opacity:0.5;'}">⏱️ 正计时</button>
        </div>

        <!-- 倒计时自定义时长 -->
        <div id="pomodoroDurationRow" style="display:${pomodoroMode==='countdown'?'block':'none'};margin:6px 0 12px;">
          <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:6px;">自定义时长（分钟）</div>
          <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:6px;">
            ${countdownPresets.map(m => `
              <button class="btn btn-sm pomodoro-preset-btn ${pomodoroDuration===m?'btn-primary':''}"
                onclick="setPomodoroDuration(${m})" style="min-width:44px;">${m}</button>
            `).join('')}
          </div>
          <div style="display:flex;gap:6px;justify-content:center;align-items:center;">
            <input type="number" class="form-input" id="pomodoroCustomMinutes"
              value="${pomodoroDuration}" min="1" max="120"
              onchange="setPomodoroDuration(parseInt(this.value)||25)"
              style="width:70px;text-align:center;">
            <span style="font-size:0.85rem;color:var(--text-muted);">分钟</span>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="startPomodoro()" id="btnPomoStart">▶ 开始</button>
          <button class="btn btn-secondary" onclick="pausePomodoro()">⏸ 暂停</button>
          <button class="btn btn-secondary" onclick="resetPomodoro()">🔄 重置</button>
          <button class="btn btn-accent" onclick="endPomodoro()" id="btnPomoEnd" style="display:${pomodoroRunning ? 'inline-flex' : 'none'};align-items:center;gap:4px;background:var(--accent);color:#fff;">⏹ 结束计时</button>
        </div>

        <!-- 统计 -->
        <div style="margin-top:14px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <span class="tag">🍅 今日番茄: ${todayPomos.length} 个</span>
          ${todayForward.length > 0 ? `<span class="tag">⏱ 正向计时: ${todayForward.length} 次</span>` : ''}
        </div>
      </div>
    </div>

    <!-- 快速任务选择 -->
    <div class="card" style="margin-top:16px;">
      <div class="card-header"><h3>从任务列表快速启动</h3></div>
      <div class="card-body">
        <div id="pomodoroTaskList" style="max-height:160px;overflow-y:auto;">
          ${renderPomodoroTaskSelector()}
        </div>
      </div>
    </div>

    <!-- 番茄钟记录 -->
    <div class="card" style="margin-top:16px;">
      <div class="card-header"><h3>番茄钟记录</h3></div>
      <div class="card-body">
        ${pomodoros.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||'')).slice(0, 20).map(p => `
          <div class="stat-row">
            <span>${p.mode==='forward'?'⏱':'🍅'} ${p.completed ? '完成' : '未完成'} · ${p.duration||25}分钟</span>
            <span style="font-size:0.82rem;color:var(--text-muted);">${p.date} ${p.taskTitle||''}</span>
          </div>
        `).join('') || '<p class="empty-hint">还没有番茄钟记录</p>'}
      </div>
    </div>
  `;
}

async function renderPomodoroTaskSelector() {
  const tasks = await DB.getAll('task_plans');
  const pending = tasks.filter(t => !t.completed).slice(0, 10);
  if (pending.length === 0) return '<p class="empty-hint" style="font-size:0.85rem;">没有待办任务，去任务列表添加吧</p>';
  return pending.map(t => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-color);">
      <span style="font-size:0.88rem;cursor:pointer;" onclick="setPomodoroFromTask('${escapeHtml(t.title).replace(/'/g,"\\'")}')" title="点击设为当前任务">
        📋 ${escapeHtml(t.title).substring(0, 28)}${t.title.length>28?'...':''}
      </span>
      <span class="tag" style="font-size:0.72rem;">${t.planType||'任务'}</span>
    </div>
  `).join('');
}

function startPomodoro() {
  if (pomodoroRunning) return;
  pomodoroRunning = true;

  // 读取任务名称
  const taskInput = document.getElementById('pomodoroTaskInput');
  if (taskInput) pomodoroTaskName = taskInput.value.trim();

  // 初始化起始状态
  if (pomodoroMode === 'forward') {
    if (pomodoroSeconds <= 0) pomodoroSeconds = 0;
  } else {
    if (pomodoroSeconds <= 0) {
      pomodoroSeconds = pomodoroDuration * 60;
    }
  }

  // 精确计时：用 Date.now() 记录起点
  pomodoroStartTime = Date.now();
  pomodoroElapsedBase = pomodoroMode === 'forward'
    ? pomodoroSeconds    // 正计时：已过秒数作为基准
    : pomodoroDuration * 60 - pomodoroSeconds; // 倒计时：已消耗秒数作为基准

  document.getElementById('pomodoroStatus').textContent = pomodoroMode === 'forward' ? '正计时中...' : '专注中...';
  document.getElementById('btnPomoStart').textContent = '⏳ 进行中';
  document.getElementById('btnPomoStart').disabled = true;
  const endBtn = document.getElementById('btnPomoEnd');
  if (endBtn) endBtn.style.display = 'inline-flex';

  pomodoroInterval = setInterval(() => {
    // 用实际时间戳计算经过秒数（消除 setInterval 漂移）
    const elapsed = Math.floor((Date.now() - pomodoroStartTime) / 1000);

    if (pomodoroMode === 'forward') {
      pomodoroSeconds = pomodoroElapsedBase + elapsed;
    } else {
      const total = pomodoroDuration * 60;
      pomodoroSeconds = total - pomodoroElapsedBase - elapsed;
    }

    const displaySecs = pomodoroMode === 'forward' ? pomodoroSeconds : Math.max(0, pomodoroSeconds);
    const min = String(Math.floor(displaySecs / 60)).padStart(2, '0');
    const sec = String(displaySecs % 60).padStart(2, '0');
    const display = document.getElementById('pomodoroDisplay');
    if (display) display.textContent = `${min}:${sec}`;

    if (pomodoroMode === 'countdown' && pomodoroSeconds <= 0) {
      completePomodoro();
    }
  }, 200); // 200ms 刷新保证秒级精度，同时不过度消耗性能
}

function pausePomodoro() {
  if (!pomodoroRunning) return;
  // 保存本次计时段的累计秒数，确保恢复时从正确位置继续
  pomodoroElapsedBase += Math.floor((Date.now() - pomodoroStartTime) / 1000);
  pomodoroRunning = false;
  clearInterval(pomodoroInterval);
  document.getElementById('btnPomoStart').textContent = '▶ 继续';
  document.getElementById('btnPomoStart').disabled = false;
  document.getElementById('pomodoroStatus').textContent = '已暂停';
  const endBtn = document.getElementById('btnPomoEnd');
  if (endBtn) endBtn.style.display = 'none';
}

function resetPomodoro() {
  pausePomodoro();
  pomodoroElapsedBase = 0;
  pomodoroStartTime = 0;
  if (pomodoroMode === 'forward') {
    pomodoroSeconds = 0;
    document.getElementById('pomodoroDisplay').textContent = '00:00';
  } else {
    pomodoroSeconds = pomodoroDuration * 60;
    document.getElementById('pomodoroDisplay').textContent = `${String(pomodoroDuration).padStart(2,'0')}:00`;
  }
  document.getElementById('btnPomoStart').textContent = '▶ 开始';
  document.getElementById('btnPomoStart').disabled = false;
  document.getElementById('pomodoroStatus').textContent = '准备开始';
  const endBtn = document.getElementById('btnPomoEnd');
  if (endBtn) endBtn.style.display = 'none';
}

async function completePomodoro() {
  // 用时间戳计算实际经过秒数
  const actualElapsedSecs = pomodoroMode === 'forward'
    ? pomodoroSeconds
    : pomodoroElapsedBase + Math.floor((Date.now() - pomodoroStartTime) / 1000);
  const actualDuration = Math.max(1, Math.round(actualElapsedSecs / 60));

  pausePomodoro();

  await DB.add('task_pomodoros', {
    completed: true,
    duration: actualDuration,
    elapsedSeconds: actualElapsedSecs,
    mode: pomodoroMode,
    taskTitle: pomodoroTaskName,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });

  // 重置状态
  pomodoroSeconds = pomodoroMode === 'forward' ? 0 : pomodoroDuration * 60;
  document.getElementById('pomodoroDisplay').textContent = pomodoroMode === 'forward' ? '00:00' : `${String(pomodoroDuration).padStart(2,'0')}:00`;

  if (pomodoroMode === 'forward') {
    document.getElementById('pomodoroStatus').textContent = `正向计时完成！共 ${actualDuration} 分钟`;
    showToast(`⏱️ 完成！共专注 ${actualDuration} 分钟~`, 'success');
  } else {
    document.getElementById('pomodoroStatus').textContent = '番茄完成！';
    showToast(`🍅 番茄钟完成！休息5分钟吧~`, 'success');
  }
  document.getElementById('btnPomoStart').textContent = '▶ 开始';
  document.getElementById('btnPomoStart').disabled = false;
  const endBtn = document.getElementById('btnPomoEnd');
  if (endBtn) endBtn.style.display = 'none';

  addCoins(pomodoroMode === 'forward' ? Math.min(actualDuration * 1, 30) : 20);
  renderTasksTab('task-timer');
}

// ---- 手动结束计时 ----
async function endPomodoro() {
  if (!pomodoroRunning) return;

  // 用时间戳计算实际经过秒数
  const actualElapsedSecs = pomodoroMode === 'forward'
    ? pomodoroElapsedBase + Math.floor((Date.now() - pomodoroStartTime) / 1000)
    : pomodoroElapsedBase + Math.floor((Date.now() - pomodoroStartTime) / 1000);
  const elapsedMinutes = Math.max(1, Math.round(actualElapsedSecs / 60));

  pausePomodoro();

  await DB.add('task_pomodoros', {
    completed: true,
    duration: elapsedMinutes,
    elapsedSeconds: actualElapsedSecs,
    mode: pomodoroMode,
    taskTitle: pomodoroTaskName,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });

  // 重置状态
  pomodoroSeconds = pomodoroMode === 'forward' ? 0 : pomodoroDuration * 60;
  const display = document.getElementById('pomodoroDisplay');
  if (display) display.textContent = pomodoroMode === 'forward' ? '00:00' : `${String(pomodoroDuration).padStart(2,'0')}:00`;
  document.getElementById('btnPomoStart').textContent = '▶ 开始';
  document.getElementById('btnPomoStart').disabled = false;
  document.getElementById('pomodoroStatus').textContent = `⏹ 已结束 · 共 ${elapsedMinutes} 分钟`;
  const endBtn = document.getElementById('btnPomoEnd');
  if (endBtn) endBtn.style.display = 'none';

  showToast(`⏹ 计时结束！本次专注 ${elapsedMinutes} 分钟`, 'success');
  addCoins(Math.min(elapsedMinutes, 30));
  renderTasksTab('task-timer');
}

// ---- 模式切换 & 时长设置 ----
function switchPomodoroMode(mode) {
  if (pomodoroRunning) {
    showToast('请先暂停当前计时再切换模式', 'error');
    return;
  }
  pomodoroMode = mode;
  pomodoroSeconds = mode === 'forward' ? 0 : pomodoroDuration * 60;
  renderTasksTab('task-timer');
}

function setPomodoroDuration(minutes) {
  if (pomodoroRunning) {
    showToast('请先暂停再修改时长', 'error');
    return;
  }
  pomodoroDuration = Math.max(1, Math.min(120, minutes || 25));
  pomodoroSeconds = pomodoroDuration * 60;
  renderTasksTab('task-timer');
}

function updatePomodoroTaskName(name) {
  pomodoroTaskName = name;
}

function editPomodoroTaskName() {
  const input = document.getElementById('pomodoroTaskInput');
  if (input) {
    input.focus();
    input.select();
  }
}

async function setPomodoroFromTask(title) {
  pomodoroTaskName = title;
  renderTasksTab('task-timer');
}

// ---- 计时统计 ----
let statsPeriod = 'day'; // day | week | month | year

function getPeriodRange(period) {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start;
  const d = new Date(now);
  switch (period) {
    case 'day':
      start = end;
      break;
    case 'week':
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
      break;
    case 'month':
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split('T')[0];
      break;
    case 'year':
      d.setFullYear(d.getFullYear() - 1);
      start = d.toISOString().split('T')[0];
      break;
    default:
      start = end;
  }
  return { start, end };
}

const PIE_COLORS = [
  '#c4a882', '#b8d4c8', '#e8c7a0', '#a8c4d8',
  '#d4b8c4', '#c8d4b8', '#b8c4d4', '#d4c8b8',
  '#a8d4c4', '#c4a8d4', '#d4c4a8', '#a8c8d4'
];

async function renderPomodoroStats(container) {
  const { start, end } = getPeriodRange(statsPeriod);
  const records = await DB.getAll('task_pomodoros');
  const filtered = records
    .filter(r => r.completed && r.date >= start && r.date <= end)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // 按任务名称聚合（优先用精确秒数，兼容旧记录）
  const taskAgg = {};
  let totalMinutes = 0;
  for (const r of filtered) {
    const name = r.taskTitle || '未命名任务';
    if (!taskAgg[name]) taskAgg[name] = 0;
    const mins = r.elapsedSeconds ? Math.round(r.elapsedSeconds / 60) : (r.duration || 0);
    taskAgg[name] += mins;
    totalMinutes += mins;
  }
  const aggList = Object.entries(taskAgg)
    .map(([name, mins]) => ({ name, mins, pct: totalMinutes > 0 ? (mins / totalMinutes * 100) : 0 }))
    .sort((a, b) => b.mins - a.mins);

  // 时间段标签文案
  const periodLabels = { day: '今日', week: '近7天', month: '近30天', year: '近一年' };
  const periodLabel = periodLabels[statsPeriod] || '今日';

  container.innerHTML = `
    <div class="card" style="text-align:center;">
      <div class="card-header">
        <h3>计时统计</h3>
      </div>
      <div class="card-body" style="padding:20px;">
        <!-- 周期选择 -->
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:16px;">
          ${['day','week','month','year'].map(p => `
            <button class="btn btn-sm ${statsPeriod===p?'btn-primary':''}"
              onclick="switchStatsPeriod('${p}')" style="min-width:56px;">
              ${p==='day'?'日':p==='week'?'周':p==='month'?'月':'年'}
            </button>
          `).join('')}
        </div>

        <!-- 汇总卡片 -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
          <div class="card" style="padding:12px;background:var(--bg-secondary);text-align:center;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--accent);">${totalMinutes}<span style="font-size:0.85rem;">min</span></div>
            <div style="font-size:0.78rem;color:var(--text-muted);">总时长</div>
          </div>
          <div class="card" style="padding:12px;background:var(--bg-secondary);text-align:center;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--accent);">${filtered.length}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">总次数</div>
          </div>
          <div class="card" style="padding:12px;background:var(--bg-secondary);text-align:center;">
            <div style="font-size:1.6rem;font-weight:700;color:var(--accent);">${filtered.length > 0 ? Math.round(totalMinutes / filtered.length) : 0}<span style="font-size:0.85rem;">min</span></div>
            <div style="font-size:0.78rem;color:var(--text-muted);">平均每次</div>
          </div>
        </div>

        <!-- 饼图 -->
        <div style="position:relative;margin:0 auto;width:280px;height:280px;">
          <canvas id="pomoPieCanvas" width="280" height="280"></canvas>
        </div>
        ${aggList.length === 0 ? '<p class="empty-hint" style="margin-top:12px;">该时段暂无计时记录</p>' : ''}

        <!-- 图例 -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px;">
          ${aggList.map((a, i) => `
            <div style="display:flex;align-items:center;gap:4px;font-size:0.82rem;">
              <span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${PIE_COLORS[i % PIE_COLORS.length]};"></span>
              <span>${escapeHtml(a.name.substring(0, 12))}${a.name.length>12?'…':''}</span>
              <span style="color:var(--text-muted);">${a.mins}min</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 详细记录列表 -->
    <div class="card" style="margin-top:16px;">
      <div class="card-header"><h3>${periodLabel}记录</h3></div>
      <div class="card-body">
        ${filtered.length === 0 ? '<p class="empty-hint">暂无记录</p>' :
          filtered.map(r => {
            const mins = r.elapsedSeconds ? Math.round(r.elapsedSeconds / 60) : (r.duration || 0);
            return `
            <div class="stat-row">
              <span>${r.mode==='forward'?'⏱':'🍅'} ${mins}分钟</span>
              <span style="flex:1;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(r.taskTitle || '未命名')}</span>
              <span style="font-size:0.8rem;color:var(--text-muted);">${r.date}</span>
            </div>
          `}).join('')}
      </div>
    </div>
  `;

  // 绘制饼图
  if (aggList.length > 0) {
    setTimeout(() => drawPomodoroPie(aggList), 50);
  }
}

function drawPomodoroPie(aggList) {
  const canvas = document.getElementById('pomoPieCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = Math.min(cx, cy) - 16;
  const total = aggList.reduce((s, a) => s + a.mins, 0);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) {
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#999';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', cx, cy);
    return;
  }

  let startAngle = -Math.PI / 2;
  for (let i = 0; i < aggList.length; i++) {
    const sliceAngle = (aggList[i].mins / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    ctx.fillStyle = PIE_COLORS[i % PIE_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Percentage label inside slice if big enough
    if (sliceAngle > 0.35) {
      const midAngle = startAngle + sliceAngle / 2;
      const labelR = radius * 0.62;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(aggList[i].pct) + '%', lx, ly);
    }

    startAngle = endAngle;
  }

  // Center hole (donut effect)
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Center text
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#333';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(total + 'min', cx, cy - 6);
  ctx.font = '12px sans-serif';
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#999';
  ctx.fillText(aggList.length + ' 个任务', cx, cy + 14);
}

function switchStatsPeriod(period) {
  statsPeriod = period;
  renderTasksTab('task-stats');
}

// ---- 复盘模板 ----
async function renderTaskReview(container) {
  const reviews = await DB.getAll('task_reviews');
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>${new Date().toLocaleDateString('zh-CN',{weekday:'long'})} 复盘</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>今天完成了什么？</label>
          <textarea class="form-textarea" id="reviewDone" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>遇到了什么困难？</label>
          <textarea class="form-textarea" id="reviewDifficulty" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>明天的计划？</label>
          <textarea class="form-textarea" id="reviewPlan" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>给自己打分 (1-10)</label>
          <input type="range" id="reviewScore" min="1" max="10" value="7">
          <span id="reviewScoreVal">7</span>
        </div>
        <button class="btn btn-primary" onclick="saveReview()">💾 保存复盘</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>历史复盘</h3></div>
      <div class="card-body">
        ${reviews.length === 0 ? '<p class="empty-hint">还没有复盘记录</p>' : reviews.sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||'')).map(r => `
          <div class="card" style="margin-bottom:10px;padding:14px;">
            <h4>${r.date || r.createdAt?.split('T')[0]} · 评分: ${r.score}/10</h4>
            <p style="color:var(--text-secondary);font-size:0.85rem;">✅ 完成: ${escapeHtml(r.done||'').substring(0,100)}</p>
            <p style="color:var(--text-secondary);font-size:0.85rem;">💡 困难: ${escapeHtml(r.difficulty||'').substring(0,100)}</p>
            <button class="btn-icon btn-sm" onclick="deleteReview(${r.id})">🗑️</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.getElementById('reviewScore').addEventListener('input', function(){
    document.getElementById('reviewScoreVal').textContent = this.value;
  });
}

async function saveReview() {
  await DB.add('task_reviews', {
    done: document.getElementById('reviewDone').value,
    difficulty: document.getElementById('reviewDifficulty').value,
    plan: document.getElementById('reviewPlan').value,
    score: parseInt(document.getElementById('reviewScore').value),
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });
  showToast('复盘已保存', 'success');
  addCoins(10);
  renderTasksTab('task-review');
}

async function deleteReview(id) {
  if (!confirm('确定删除？')) return;
  await DB.delete('task_reviews', id);
  showToast('已删除', 'success');
  renderTasksTab('task-review');
}

window.addTaskPlan = addTaskPlan;
window.toggleTaskPlan = toggleTaskPlan;
window.addSubtask = addSubtask;
window.toggleSubtask = toggleSubtask;
window.deleteTaskPlan = deleteTaskPlan;
window.startPomodoro = startPomodoro;
window.pausePomodoro = pausePomodoro;
window.resetPomodoro = resetPomodoro;
window.endPomodoro = endPomodoro;
window.switchPomodoroMode = switchPomodoroMode;
window.setPomodoroDuration = setPomodoroDuration;
window.updatePomodoroTaskName = updatePomodoroTaskName;
window.editPomodoroTaskName = editPomodoroTaskName;
window.setPomodoroFromTask = setPomodoroFromTask;
window.switchStatsPeriod = switchStatsPeriod;
window.saveReview = saveReview;
window.deleteReview = deleteReview;
