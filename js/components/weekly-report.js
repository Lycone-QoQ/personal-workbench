/**
 * 每周周报卡片生成
 */
async function generateWeeklyReport() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0,0,0,0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23,59,59,999);

  const inRange = (d) => {
    const date = new Date(d);
    return date >= weekStart && date <= weekEnd;
  };

  // 汇总本周数据
  const [todos, pomodoros, accountingData, exerciseLogs, speechRecords, diaryEntries] = await Promise.all([
    DB.getAll('todos'),
    DB.getAll('task_pomodoros'),
    DB.getAll('accounting'),
    DB.getAll('exercise_logs'),
    DB.getAll('speech_records'),
    DB.getAll('diary_entries')
  ]);

  const weekTodos = todos.filter(t => t.createdAt && inRange(t.createdAt));
  const completedTodos = weekTodos.filter(t => t.completed);
  const weekPomodoros = pomodoros.filter(p => p.date && inRange(p.date));
  const completedPomodoros = weekPomodoros.filter(p => p.completed);
  const weekExpenses = accountingData.filter(a => a.date && inRange(a.date) && a.type === 'expense');
  const totalExpense = weekExpenses.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);

  // 生成卡片
  const modal = document.getElementById('weeklyReportContent');
  const theme = document.documentElement.getAttribute('data-theme');
  const bgColor = theme === 'dark' ? '#2d2a27' : '#ffffff';
  const textColor = theme === 'dark' ? '#e8e0d8' : '#3d3529';
  const accentColor = '#c4a882';

  modal.innerHTML = `
    <div style="background:${bgColor};color:${textColor};padding:32px;border-radius:16px;max-width:400px;margin:0 auto;font-family:system-ui,sans-serif;">
      <h2 style="text-align:center;color:${accentColor};margin-bottom:8px;">📊 本周周报</h2>
      <p style="text-align:center;font-size:0.85rem;color:var(--text-secondary);margin-bottom:20px;">
        ${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:var(--bg-secondary);padding:14px;border-radius:10px;text-align:center;">
          <div style="font-size:2rem;">📋</div>
          <div style="font-size:1.5rem;font-weight:700;">${completedTodos.length}/${weekTodos.length}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">任务完成</div>
        </div>
        <div style="background:var(--bg-secondary);padding:14px;border-radius:10px;text-align:center;">
          <div style="font-size:2rem;">🍅</div>
          <div style="font-size:1.5rem;font-weight:700;">${completedPomodoros.length}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">番茄钟完成</div>
        </div>
        <div style="background:var(--bg-secondary);padding:14px;border-radius:10px;text-align:center;">
          <div style="font-size:2rem;">💰</div>
          <div style="font-size:1.5rem;font-weight:700;">¥${totalExpense.toFixed(0)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">本周支出</div>
        </div>
        <div style="background:var(--bg-secondary);padding:14px;border-radius:10px;text-align:center;">
          <div style="font-size:2rem;">✍️</div>
          <div style="font-size:1.5rem;font-weight:700;">${diaryEntries.filter(d => inRange(d.createdAt)).length}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);">日记篇数</div>
        </div>
      </div>
      <div style="margin-top:20px;padding:14px;background:var(--bg-secondary);border-radius:10px;text-align:center;">
        <div style="font-size:0.85rem;color:var(--text-secondary);">💪 运动打卡 ${exerciseLogs.filter(e => inRange(e.date)).length} 次 | 🎤 表达练习 ${speechRecords.filter(r => inRange(r.date)).length} 次</div>
      </div>
      <div style="text-align:center;margin-top:16px;">
        <button class="btn btn-primary" onclick="saveReportAsImage()" style="margin-right:8px;">📸 保存为图片</button>
        <button class="btn btn-secondary" onclick="document.getElementById('weeklyReportModal').classList.remove('show')">关闭</button>
      </div>
    </div>
  `;

  document.getElementById('weeklyReportModal').classList.add('show');
}

async function saveReportAsImage() {
  try {
    const el = document.getElementById('weeklyReportContent').firstElementChild;
    if (!el) return;

    // 使用 Canvas 方式简单实现截图效果
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // 绘制背景
    const theme = document.documentElement.getAttribute('data-theme');
    ctx.fillStyle = theme === 'dark' ? '#2d2a27' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制标题
    ctx.fillStyle = '#c4a882';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📊 本周周报', canvas.width/2, 60);

    // 简单绘制基本数据
    ctx.fillStyle = theme === 'dark' ? '#e8e0d8' : '#3d3529';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(el.querySelector('p')?.textContent || '', canvas.width/2, 100);

    // 导出
    const link = document.createElement('a');
    link.download = `weekly_report_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('周报图片已保存', 'success');
    addCoins(10);
  } catch(e) {
    showToast('保存失败，请重试', 'error');
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnWeeklyReport').addEventListener('click', generateWeeklyReport);
  document.getElementById('weeklyReportModal').addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('show');
  });
});
