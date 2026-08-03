/**
 * 表达能力练习模块
 */
let currentSpeechTab = 'sp-practice';

// 教资结构化面试题库
const STRUCTURED_QUESTIONS = [
  '如果学生上课玩手机被你发现，你会怎么处理？',
  '谈谈你对"没有教不好的学生，只有不会教的老师"这句话的理解。',
  '如果家长投诉你布置的作业太多，你该怎么办？',
  '你如何看待教师这个职业？',
  '如果两个学生在课堂上打架，你怎么办？',
  '谈谈你对素质教育的理解。',
  '如果校长批评了你的教学方法，你会怎么回应？',
  '你最喜欢的教育名言是什么？为什么？',
  '如何处理学生之间的欺凌问题？',
  '你认为一个好老师的标准是什么？',
];

// 即兴演讲题库
const IMPROMPTU_QUESTIONS = [
  '用三分钟介绍你的家乡',
  '如果时间可以倒流，你最后悔的一件事',
  '你眼中的幸福是什么',
  '谈谈人工智能对教育的影响',
  '你最敬佩的一个人',
  '对"内卷"的看法',
  '如何平衡工作与生活',
  '你最大的优点和缺点',
  '谈谈你对环保的看法',
  '你未来五年的规划',
  '如果可以改变世界一件事',
  '手机依赖症的危害',
];

async function renderSpeechModule() {
  document.querySelectorAll('#speechTabs .tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#speechTabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentSpeechTab = tab.dataset.tab;
      renderSpeechTab(currentSpeechTab);
    };
  });
  renderSpeechTab(currentSpeechTab);
}

async function renderSpeechTab(tab) {
  const container = document.getElementById('speechTabContent');
  switch(tab) {
    case 'sp-practice': renderSpeechPractice(container); break;
    case 'sp-records': renderSpeechRecords(container); break;
    case 'sp-progress': renderSpeechProgress(container); break;
  }
}

async function renderSpeechPractice(container) {
  const records = await DB.getAll('speech_records');
  const today = new Date().toISOString().split('T')[0];
  const todayCount = records.filter(r => r.date === today).length;

  container.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header"><h3>随机练习题库</h3></div>
      <div class="card-body" style="text-align:center;">
        <div style="margin-bottom:12px;">
          <select class="form-select" id="speechType" style="max-width:250px;display:inline-block;">
            <option value="structured">教资结构化面试</option>
            <option value="impromptu">即兴演讲</option>
          </select>
        </div>
        <div id="speechQuestion" style="padding:24px;background:var(--bg-secondary);border-radius:var(--radius-md);margin-bottom:16px;font-size:1.1rem;min-height:80px;display:flex;align-items:center;justify-content:center;">
          点击"随机出题"开始练习
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="getRandomQuestion()">🎲 随机出题</button>
          <button class="btn btn-success" onclick="startSpeechTimer()">⏱️ 开始计时</button>
          <button class="btn btn-secondary" onclick="stopSpeechTimer()">⏹️ 停止</button>
        </div>
        <div id="speechTimer" style="font-size:2rem;font-weight:700;margin:12px 0;color:var(--accent-dark);">00:00</div>
        <p style="font-size:0.82rem;color:var(--text-muted);">今日已练习: ${todayCount} 次</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>练习记录</h3></div>
      <div class="card-body">
        <div class="form-group">
          <label>练习评价</label>
          <textarea class="form-textarea" id="speechNote" placeholder="记录你的练习要点、逐字稿..." rows="4"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div class="form-group">
            <label>流利度 (1-5)</label>
            <input type="range" id="scoreFluency" min="1" max="5" value="3">
            <span id="scoreFluencyVal">3</span>
          </div>
          <div class="form-group">
            <label>内容质量 (1-5)</label>
            <input type="range" id="scoreContent" min="1" max="5" value="3">
            <span id="scoreContentVal">3</span>
          </div>
          <div class="form-group">
            <label>表达自信 (1-5)</label>
            <input type="range" id="scoreConfidence" min="1" max="5" value="3">
            <span id="scoreConfidenceVal">3</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveSpeechRecord()">💾 保存练习记录</button>
      </div>
    </div>
  `;

  document.getElementById('scoreFluency').addEventListener('input',function(){document.getElementById('scoreFluencyVal').textContent=this.value;});
  document.getElementById('scoreContent').addEventListener('input',function(){document.getElementById('scoreContentVal').textContent=this.value;});
  document.getElementById('scoreConfidence').addEventListener('input',function(){document.getElementById('scoreConfidenceVal').textContent=this.value;});

  window._speechTimerInterval = null;
  window._speechSeconds = 0;
}

function getRandomQuestion() {
  const type = document.getElementById('speechType')?.value || 'structured';
  const pool = type === 'structured' ? STRUCTURED_QUESTIONS : IMPROMPTU_QUESTIONS;
  const q = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById('speechQuestion').textContent = q;
  window._currentSpeechQuestion = q;
  showToast('已随机出题', 'success');
}

function startSpeechTimer() {
  if (window._speechTimerInterval) return;
  window._speechSeconds = 0;
  window._speechTimerInterval = setInterval(() => {
    window._speechSeconds++;
    const min = String(Math.floor(window._speechSeconds / 60)).padStart(2, '0');
    const sec = String(window._speechSeconds % 60).padStart(2, '0');
    document.getElementById('speechTimer').textContent = `${min}:${sec}`;
  }, 1000);
}

function stopSpeechTimer() {
  if (window._speechTimerInterval) {
    clearInterval(window._speechTimerInterval);
    window._speechTimerInterval = null;
  }
}

async function saveSpeechRecord() {
  const question = window._currentSpeechQuestion || '未出题';
  const note = document.getElementById('speechNote').value;
  const fluency = parseInt(document.getElementById('scoreFluency').value);
  const content = parseInt(document.getElementById('scoreContent').value);
  const confidence = parseInt(document.getElementById('scoreConfidence').value);
  const totalScore = fluency + content + confidence;
  const duration = Math.floor(window._speechSeconds / 60);

  stopSpeechTimer();

  await DB.add('speech_records', {
    title: question.substring(0, 50),
    question, note: note || '',
    fluency, content, confidence, totalScore, duration,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  });

  showToast('练习记录已保存！', 'success');
  addCoins(15);

  document.getElementById('speechNote').value = '';
  document.getElementById('speechTimer').textContent = '00:00';
  window._speechSeconds = 0;
  renderSpeechTab('sp-records');
}

async function renderSpeechRecords(container) {
  const records = await DB.getAll('speech_records');

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>练习记录</h3></div>
      <div class="card-body">
        ${records.length === 0 ? '<p class="empty-hint">暂无练习记录</p>' : records.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).map(r => `
          <div class="card" style="margin-bottom:10px;padding:14px;">
            <h4>${escapeHtml(r.title || '练习')}</h4>
            <p style="font-size:0.82rem;color:var(--text-muted);">${r.date} · ${r.duration || 0}分钟</p>
            <div style="margin:6px 0;">
              <span class="tag">流利度: ${r.fluency}/5</span>
              <span class="tag">内容: ${r.content}/5</span>
              <span class="tag">自信: ${r.confidence}/5</span>
            </div>
            <p style="font-size:0.85rem;color:var(--text-secondary);">总分: ${r.totalScore}/15</p>
            ${r.note ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px;">📝 ${escapeHtml(r.note).substring(0, 200)}</p>` : ''}
            <button class="btn-icon btn-sm" onclick="deleteSpeechRecord(${r.id})">🗑️</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function renderSpeechProgress(container) {
  const records = await DB.getAll('speech_records');
  const sorted = records.sort((a,b) => (a.createdAt||'').localeCompare(b.createdAt||''));

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><h3>进步趋势</h3></div>
      <div class="card-body">
        <canvas id="speechProgressChart" style="width:100%;height:300px;"></canvas>
        <div style="margin-top:16px;">
          ${sorted.length === 0 ? '<p class="empty-hint">还没有练习记录</p>' : `
            <div class="dashboard-grid">
              <div class="card" style="text-align:center;padding:16px;">
                <h4>总练习次数</h4>
                <div style="font-size:2rem;font-weight:700;">${sorted.length}</div>
              </div>
              <div class="card" style="text-align:center;padding:16px;">
                <h4>平均总分</h4>
                <div style="font-size:2rem;font-weight:700;">${(sorted.reduce((s,r)=>s+r.totalScore,0)/sorted.length).toFixed(1)}</div>
              </div>
              <div class="card" style="text-align:center;padding:16px;">
                <h4>最高分</h4>
                <div style="font-size:2rem;font-weight:700;">${Math.max(...sorted.map(r=>r.totalScore))}</div>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const canvas = document.getElementById('speechProgressChart');
    if (canvas && sorted.length > 1) {
      drawSpeechProgress(canvas, sorted);
    }
  }, 100);
}

function drawSpeechProgress(canvas, data) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 600;
  const h = canvas.height = 300;
  const padding = 30;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#2d2a27' : '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // 画三条线：流利度、内容、自信
  const drawLine = (values, color, label) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((val, i) => {
      const x = padding + (chartW / (values.length - 1)) * i;
      const y = padding + chartH - ((val - 0.5) / 5) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    // 标签
    ctx.fillStyle = color;
    ctx.font = '12px system-ui';
    ctx.fillText(label, w - 80, padding + chartH - ((values[values.length-1] - 0.2) / 5) * chartH);
  };

  drawLine(data.map(d => d.fluency), '#c4a882', '流利度');
  drawLine(data.map(d => d.content), '#8fbc8f', '内容');
  drawLine(data.map(d => d.confidence), '#8fadc4', '自信');
}

async function deleteSpeechRecord(id) {
  if (!confirm('确定删除？')) return;
  await DB.delete('speech_records', id);
  showToast('已删除', 'success');
  renderSpeechTab('sp-records');
}

window.getRandomQuestion = getRandomQuestion;
window.startSpeechTimer = startSpeechTimer;
window.stopSpeechTimer = stopSpeechTimer;
window.saveSpeechRecord = saveSpeechRecord;
window.deleteSpeechRecord = deleteSpeechRecord;
