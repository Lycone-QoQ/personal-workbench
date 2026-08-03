/**
 * 日常记账模块 - 收支记录、统计分析、预算管控
 */
let currentAccountingTab = 'acc-record';

async function renderAccountingModule() {
  document.querySelectorAll('#accountingTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#accountingTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentAccountingTab = tab.dataset.tab;
      renderAccountingTab(currentAccountingTab);
    };
  });
  renderAccountingTab(currentAccountingTab);
}

async function renderAccountingTab(tab) {
  const container = document.getElementById('accountingTabContent');
  switch(tab) {
    case 'acc-record': renderAccRecords(container); break;
    case 'acc-stats': renderAccStats(container); break;
    case 'acc-budget': renderAccBudget(container); break;
  }
}

// ---- 收支记录 ----
async function renderAccRecords(container) {
  const records = await DB.getAll('accounting');
  const categories = ['餐饮', '交通', '购物', '住房', '娱乐', '教育', '医疗', '服饰', '美妆', '运动', '其他', '工资', '兼职', '理财', '红包'];

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>新增记录</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>类型</label>
            <select class="form-select" id="accType">
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div class="form-group">
            <label>金额 (¥)</label>
            <input type="number" class="form-input" id="accAmount" placeholder="0.00" step="0.01" min="0">
          </div>
          <div class="form-group">
            <label>分类</label>
            <select class="form-select" id="accCategory">
              ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>日期</label>
            <input type="date" class="form-input" id="accDate" value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        <div class="form-group">
          <label>备注</label>
          <input type="text" class="form-input" id="accNote" placeholder="备注说明...">
        </div>
        <button class="btn btn-primary" onclick="addAccountingRecord()">💾 保存记录</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>收支记录列表</h3>
        <select class="form-select" id="accMonthFilter" onchange="renderAccRecords(document.getElementById('accountingTabContent'))" style="max-width:150px;">
          ${getMonthOptions()}
        </select>
      </div>
      <div class="card-body">
        <div id="accRecordsList">
          ${renderRecordsList(filterRecords(records, document.getElementById('accMonthFilter')?.value))}
        </div>
      </div>
    </div>
  `;
}

function getMonthOptions() {
  const now = new Date();
  let html = '';
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const label = `${d.getFullYear()}年${d.getMonth()+1}月`;
    const selected = i === 0 ? ' selected' : '';
    html += `<option value="${val}"${selected}>${label}</option>`;
  }
  return html;
}

function filterRecords(records, monthFilter) {
  if (!monthFilter) return records.sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0, 50);
  const [year, month] = monthFilter.split('-').map(Number);
  return records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }).sort((a,b) => (b.date||'').localeCompare(a.date||''));
}

function renderRecordsList(records) {
  if (records.length === 0) return '<p class="empty-hint">暂无记录</p>';
  return records.map(r => `
    <div class="stat-row">
      <div>
        <span>${r.type === 'income' ? '💰' : '💸'} ${escapeHtml(r.category || '')}</span>
        <span style="font-size:0.82rem;color:var(--text-muted);margin-left:8px;">${escapeHtml(r.note || '')}</span>
        <span style="font-size:0.78rem;color:var(--text-muted);margin-left:8px;">${r.date}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:600;color:${r.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
          ${r.type === 'income' ? '+' : '-'}¥${parseFloat(r.amount||0).toFixed(2)}
        </span>
        <button class="btn-icon btn-sm" onclick="deleteAccountingRecord(${r.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

async function addAccountingRecord() {
  const type = document.getElementById('accType').value;
  const amount = parseFloat(document.getElementById('accAmount').value);
  const category = document.getElementById('accCategory').value;
  const date = document.getElementById('accDate').value;
  const note = document.getElementById('accNote').value;

  if (!amount || amount <= 0) { showToast('请输入有效金额', 'error'); return; }
  if (!date) { showToast('请选择日期', 'error'); return; }

  await DB.add('accounting', {
    type, amount, category, date, note,
    createdAt: new Date().toISOString()
  });
  showToast('记录已保存', 'success');
  addCoins(3);
  renderAccountingTab('acc-record');

  // 检查预算超支
  await checkBudgetOverrun();
}

async function deleteAccountingRecord(id) {
  if (!confirm('确定删除？')) return;
  await DB.delete('accounting', id);
  showToast('已删除', 'success');
  renderAccountingTab('acc-record');
}

// ---- 统计分析 ----
async function renderAccStats(container) {
  const records = await DB.getAll('accounting');
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const [year, month] = currentMonth.split('-').map(Number);

  // 当月数据
  const monthData = records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });

  // 按分类汇总支出
  const expenseByCat = {};
  monthData.filter(r => r.type === 'expense').forEach(r => {
    expenseByCat[r.category] = (expenseByCat[r.category] || 0) + (parseFloat(r.amount) || 0);
  });

  const totalExpense = Object.values(expenseByCat).reduce((s, v) => s + v, 0);
  const totalIncome = monthData.filter(r => r.type === 'income').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  // 每日支出趋势（最近30天）
  const dailyExpense = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyExpense[key] = 0;
  }
  records.filter(r => r.type === 'expense').forEach(r => {
    if (dailyExpense[r.date] !== undefined) {
      dailyExpense[r.date] += parseFloat(r.amount) || 0;
    }
  });

  container.innerHTML = `
    <div class="dashboard-grid" style="margin-bottom:16px;">
      <div class="card" style="text-align:center;padding:20px;">
        <h3 style="color:var(--danger);">支出</h3>
        <div style="font-size:2rem;font-weight:700;">¥${totalExpense.toFixed(2)}</div>
      </div>
      <div class="card" style="text-align:center;padding:20px;">
        <h3 style="color:var(--success);">收入</h3>
        <div style="font-size:2rem;font-weight:700;">¥${totalIncome.toFixed(2)}</div>
      </div>
      <div class="card" style="text-align:center;padding:20px;">
        <h3>结余</h3>
        <div style="font-size:2rem;font-weight:700;color:${totalIncome - totalExpense >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ¥${(totalIncome - totalExpense).toFixed(2)}
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>支出分类占比</h3></div>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${Object.entries(expenseByCat).sort((a,b) => b[1]-a[1]).map(([cat, val]) => {
            const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
            return `<div style="flex:1;min-width:100px;text-align:center;">
              <div style="font-weight:600;">${cat}</div>
              <div style="font-size:0.9rem;">¥${val.toFixed(0)}</div>
              <div class="progress-bar" style="margin:4px 0;"><div class="progress-fill" style="width:${pct}%;background:var(--accent)"></div></div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${pct}%</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>近30天支出趋势</h3></div>
      <div class="card-body">
        <canvas id="expenseTrendChart" style="width:100%;height:200px;"></canvas>
      </div>
    </div>
  `;

  // 绘制简单趋势图
  setTimeout(() => {
    const canvas = document.getElementById('expenseTrendChart');
    if (!canvas) return;
    drawExpenseTrend(canvas, Object.values(dailyExpense));
  }, 100);
}

function drawExpenseTrend(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 600;
  const h = canvas.height = 200;
  const max = Math.max(...data, 1);
  const padding = 20;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  // 背景
  ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#2d2a27' : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 网格线
  ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#3d3832' : '#e0d5c5';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(w - padding, y);
    ctx.stroke();
  }

  // 数据线
  ctx.strokeStyle = '#c4a882';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = padding + (chartW / (data.length - 1)) * i;
    const y = padding + chartH - (val / max) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 数据点
  data.forEach((val, i) => {
    const x = padding + (chartW / (data.length - 1)) * i;
    const y = padding + chartH - (val / max) * chartH;
    ctx.fillStyle = '#c4a882';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ---- 预算管控 ----
async function renderAccBudget(container) {
  const budgetVal = (await DB.get('settings', 'monthlyBudget'))?.value || '0';
  const records = await DB.getAll('accounting');
  const now = new Date();
  const monthExpense = records.filter(r => {
    const d = new Date(r.date);
    return r.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const budget = parseFloat(budgetVal);
  const pct = budget > 0 ? Math.min((monthExpense / budget) * 100, 100) : 0;
  const remaining = budget - monthExpense;

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>月度预算设置</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>月度预算金额 (¥)</label>
          <input type="number" class="form-input" id="monthlyBudgetInput" value="${budgetVal}" step="100" min="0" style="max-width:300px;">
        </div>
        <button class="btn btn-primary" onclick="saveMonthlyBudget()">💾 保存预算</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>本月预算执行情况</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;text-align:center;">
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:var(--danger);">¥${monthExpense.toFixed(2)}</div>
            <div style="color:var(--text-muted);">已支出</div>
          </div>
          <div>
            <div style="font-size:1.5rem;font-weight:700;">¥${budget.toFixed(2)}</div>
            <div style="color:var(--text-muted);">总预算</div>
          </div>
          <div>
            <div style="font-size:1.5rem;font-weight:700;color:${remaining >= 0 ? 'var(--success)' : 'var(--danger)'};">
              ¥${Math.abs(remaining).toFixed(2)}
            </div>
            <div style="color:var(--text-muted);">${remaining >= 0 ? '剩余' : '超支'}</div>
          </div>
        </div>
        <div class="progress-bar" style="height:12px;margin-top:16px;border-radius:6px;">
          <div class="progress-fill ${pct >= 90 ? 'danger' : ''}" style="width:${pct}%;height:100%;"></div>
        </div>
        <p style="text-align:center;margin-top:8px;color:var(--text-muted);">${pct.toFixed(1)}% 已使用</p>
        ${pct >= 100 ? '<p style="text-align:center;color:var(--danger);font-weight:600;">⚠️ 已超支！请注意控制支出</p>' : ''}
        ${pct >= 80 && pct < 100 ? '<p style="text-align:center;color:var(--warning);">⚡ 预算即将用完，请谨慎消费</p>' : ''}
      </div>
    </div>
  `;
}

async function saveMonthlyBudget() {
  const val = document.getElementById('monthlyBudgetInput').value;
  await DB.put('settings', { key: 'monthlyBudget', value: val });
  showToast('预算已保存', 'success');
  renderAccountingTab('acc-budget');
}

async function checkBudgetOverrun() {
  const budgetVal = (await DB.get('settings', 'monthlyBudget'))?.value || '0';
  if (parseFloat(budgetVal) <= 0) return;
  const records = await DB.getAll('accounting');
  const now = new Date();
  const monthExpense = records.filter(r => {
    const d = new Date(r.date);
    return r.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const budget = parseFloat(budgetVal);
  if (monthExpense >= budget) {
    sendLocalNotification('预算提醒', '本月支出已超出预算，请注意控制！');
  } else if (monthExpense >= budget * 0.8) {
    showToast('⚠️ 本月预算已使用80%以上', 'warning');
  }
}

window.addAccountingRecord = addAccountingRecord;
window.deleteAccountingRecord = deleteAccountingRecord;
window.saveMonthlyBudget = saveMonthlyBudget;
