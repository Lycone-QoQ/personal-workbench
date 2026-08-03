/**
 * 首页总览模块
 * 聚合：今日待办、教资倒计时、学习数据、记账速览、每日英语短句
 */

const DAILY_QUOTES = [
  // ---- 名人名言 ----
  { en: "The best way to predict the future is to create it.", zh: "预测未来最好的方式，就是去创造它。", author: "Abraham Lincoln", analysis: "与其焦虑未知的明天，不如把今天能做的事做到极致。行动力才是最具确定性的变量。" },
  { en: "It does not matter how slowly you go as long as you do not stop.", zh: "走得慢没关系，只要不停下来。", author: "Confucius 孔子", analysis: "备考最怕的不是进度慢，而是三天打鱼两天晒网。龟兔赛跑里赢的是乌龟，不是兔子。" },
  { en: "Believe you can and you're halfway there.", zh: "相信自己能做到，你就已经成功了一半。", author: "Theodore Roosevelt", analysis: "很多时候不是能力不够，是自己先在心里给自己判了死刑。先信，再做，结果交给时间。" },
  { en: "The secret of getting ahead is getting started.", zh: "领先的秘诀就是：先开始。", author: "Mark Twain", analysis: "完美主义是拖延症的漂亮外衣。完成比完美重要 100 倍——先做一个垃圾版本，再迭代，永远好过一直在脑子里规划。" },
  { en: "Success is not final, failure is not fatal: it is the courage to continue that counts.", zh: "成功不是终点，失败也非末日：重要的是继续前行的勇气。", author: "Winston Churchill", analysis: "考过一门不算什么，挂了一门也不算什么。真正决定你能走多远的，是爬起来再战的次数。" },
  { en: "Don't watch the clock; do what it does. Keep going.", zh: "别盯着时钟看；学学它的样子——不停往前走。", author: "Sam Levenson", analysis: "番茄钟不是用来焦虑还剩多少时间的，是提醒你：你已经专注这么久了，再坚持一下。" },
  { en: "What we learn with pleasure we never forget.", zh: "愉快中学到的东西，永远不会忘。", author: "Alfred Mercier", analysis: "为什么刷短视频记不住但段子能复述？因为快乐是记忆最强的粘合剂。给学习加点趣味，效率翻倍。" },
  { en: "Small daily improvements are the key to staggering long-term results.", zh: "每天微小的进步，是巨大长期成果的钥匙。", author: "Robin Sharma", analysis: "1.01 的 365 次方是 37.78。每天只进步 1%，一年后你是现在的 37 倍。复利不只存在于金融。" },
  { en: "The beautiful thing about learning is that no one can take it away from you.", zh: "学习最美的地方在于，没人能把它从你身上夺走。", author: "B.B. King", analysis: "钱会花完、人会离开、时代会变迁——但装进脑子里的东西，永远是你的。" },
  { en: "Every moment is a fresh beginning.", zh: "每一刻，都是全新的开始。", author: "T.S. Eliot", analysis: "上午摸鱼了？没关系，下午重新开始。昨天摆烂了？没关系，今天重新开始。重置按钮永远在你手里。" },
  { en: "You miss 100% of the shots you don't take.", zh: "不投篮的命中率永远是 0%。", author: "Wayne Gretzky", analysis: "不敢报名、不敢开口说英语、不敢试讲——失败不可怕，可怕的是连失败的资格都没给自己。" },
  { en: "Whether you think you can, or you think you can't — you're right.", zh: "无论你觉得行还是不行，你都是对的。", author: "Henry Ford", analysis: "心态不是玄学。觉得自己能搞定的人会去找方法，觉得自己不行的人会去找借口。哪一个你，由你决定。" },
  { en: "The only way to do great work is to love what you do.", zh: "做出伟大成就的唯一方式，就是热爱你所做的事。", author: "Steve Jobs", analysis: "备考不一定有趣，但教书育人这件事本身值得热爱。把它当成通往讲台的必经之路，而不是不得不交的作业。" },
  { en: "In the middle of difficulty lies opportunity.", zh: "困难之中，藏着机会。", author: "Albert Einstein", analysis: "错题不是打击，是指南针。每一道做错的题都在告诉你：这里是你进步的突破口。" },
  { en: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", zh: "我们就是反复做的事。因此，卓越不是一种行为，而是一种习惯。", author: "Aristotle", analysis: "学霸不是一天练成的。每天背 10 个单词、刷 5 道题、听 1 段听力——把这些变成像刷牙一样自然的事。" },

  // ---- 互联网梗 / 有趣智慧 ----
  { en: "Not all those who wander are lost — but I definitely am.", zh: "不是所有漫游者都迷路了——但我是真的迷了。", author: "互联网梗 (仿 Tolkien)", analysis: "偶尔迷茫是正常的。人生不是 GPS 导航，每个路口都标得清清楚楚。有时候走着走着就知道方向了。" },
  { en: "I'm not procrastinating, I'm doing extensive background research.", zh: "我不是在拖延，我是在做深入调研。", author: "互联网梗", analysis: "这个梗好笑是因为我们都有共鸣。但记住：research 是手段，不是目的。调研到一定程度就该动手了。" },
  { en: "My brain has too many tabs open.", zh: "我的大脑开了太多标签页。", author: "互联网梗", analysis: "多任务切换是效率杀手。一次只做一件事，把其他「标签页」先写下来，清空大脑 RAM。" },
  { en: "Adulting is just Googling how to do stuff and pretending you know what you're doing.", zh: "成年不过就是：谷歌搜一搜怎么做，然后假装自己很在行。", author: "互联网梗", analysis: "没有人天生会做所有事。不会做饭？搜食谱。不会报税？搜教程。假装到一定程度，就真的会了。备考也一样——先模仿，再内化。" },
  { en: "I came, I saw, I forgot what I was doing.", zh: "我来了，我看见了，我忘了我要干嘛。", author: "互联网梗 (仿 Caesar)", analysis: "打开手机想查个单词，二十分钟后在看猫视频。把手机放远点，把目标写在纸上放在眼前，比什么都管用。" },
  { en: "That's a future me problem.", zh: "那是未来的我的问题。", author: "互联网梗", analysis: "这个梗好笑但危险——因为未来的你，就是从现在的你手里接过烂摊子的人。对未来的自己好一点。" },
  { en: "I'm not great at advice. Can I interest you in a sarcastic comment?", zh: "我不擅长给建议。来句阴阳怪气怎么样？", author: "互联网梗", analysis: "自嘲是一种高级幽默，但别让自嘲变成自我否定。幽默是盔甲，不是囚笼。" },
  { en: "Stressed, depressed, but well dressed.", zh: "压力大、情绪差，但穿得还行。", author: "互联网梗", analysis: "即使在最兵荒马乱的日子里，也别放弃收拾自己。外在秩序感会反向影响内心状态——不信试试化个妆再学习。" },
  { en: "It's not a bug, it's a feature.", zh: "这不是 bug，这是特性。", author: "程序员梗", analysis: "你觉得自己「注意力不集中」是缺陷？也许是你还没找到真正让你燃烧的东西。有些特质在不对的环境里是缺点，在对的土壤里是天赋。" },

  // ---- 中文智慧 ----
  { en: "The best time to plant a tree was twenty years ago. The second best time is now.", zh: "种一棵树最好的时间是十年前，其次是现在。", author: "中国谚语", analysis: "别纠结「现在开始会不会太晚了」。十年前没种树，今天种，十年后你也能乘凉。晚开始永远好过不开始。" },
  { en: "A journey of a thousand miles begins with a single step.", zh: "千里之行，始于足下。", author: "老子", analysis: "再宏伟的目标也要从翻开第一页书开始。别被目标的庞大吓到——拆成小步，每一步都算数。" },
  { en: "The person who says it cannot be done should not interrupt the person doing it.", zh: "说做不到的人，别去打扰正在做的人。", author: "中国谚语", analysis: "备考路上总有人告诉你「竞争太激烈了」「别折腾了」。捂住耳朵，盯着自己的路——你的答案不在别人嘴里。" },
  { en: "When the winds of change blow, some build walls and others build windmills.", zh: "变革之风吹来时，有人筑墙，有人造风车。", author: "中国谚语", analysis: "考试改革、政策变化——有人抱怨，有人立刻研究新大纲。做后者。变化对懒人是灾难，对勤快人是机会。" },
  { en: "Dripping water can penetrate the stone.", zh: "水滴石穿，不是水的力量，而是坚持的力量。", author: "中国谚语", analysis: "每天背 20 个单词，一年就是 7300 个。不需要天赋，不需要捷径——日复一日就是最强的武器。" },

  // ---- 趣味双语 ----
  { en: "I'm learning English because I want to understand what the GPS lady is actually saying.", zh: "我学英语是因为我想听懂导航小姐姐到底在说什么。", author: "学习梗", analysis: "学英语不只是为了考试——是为了看懂无字幕美剧、听懂英文歌、出国不用比划。把学和用连起来，动力自然来。" },
  { en: "Siri, define 'productive procrastination'.", zh: "Siri，解释一下什么叫'高效拖延'。", author: "学习梗", analysis: "把待办列得漂漂亮亮、买了全套文具然后躺着——都不叫高效。真正的productive是「这件事做完能离目标更近一步」。" }
];

async function renderDashboard() {
  await Promise.all([
    renderTodayTodos(),
    renderCountdown(),
    renderStudySummary(),
    renderAccountingBrief(),
    renderDailyQuote()
  ]);

  // 让首页卡片可点击，避免"看着像按钮点了没反应"
  const cardMap = {
    'card-todos': () => { navbar.navigate('tasks'); },
    'card-countdown': () => { navbar.navigate('exam'); renderExamTab('exam-settings'); },
    'card-study-summary': () => { navbar.navigate('tasks'); },
    'card-accounting-brief': () => { navbar.navigate('accounting'); }
  };
  Object.entries(cardMap).forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) { el.classList.add('clickable'); el.onclick = fn; }
  });
  const quoteCard = document.getElementById('card-quote');
  if (quoteCard) {
    quoteCard.classList.add('clickable');
    quoteCard.onclick = () => {
      const en = document.getElementById('dailyQuote')?.textContent || '';
      const zh = document.getElementById('dailyQuoteZh')?.textContent || '';
      const txt = (en + ' ' + zh).trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => showToast('已复制今日一句', 'success')).catch(() => {});
      } else {
        showToast(txt, 'success');
      }
    };
  }
}

async function renderTodayTodos() {
  const todos = await DB.getAll('todos');
  const today = new Date().toISOString().split('T')[0];
  const todayTodos = todos.filter(t => {
    if (t.completed) return false;
    if (t.dueDate) return t.dueDate <= today;
    return true;
  }).slice(0, 8);

  const list = document.getElementById('todoList');
  const count = document.getElementById('todoCount');
  count.textContent = todayTodos.length;

  if (todayTodos.length === 0) {
    list.innerHTML = '<p class="empty-hint">暂无待办，去任务管理添加吧~</p>';
    return;
  }

  list.innerHTML = todayTodos.map(t => `
    <div class="stat-row">
      <label class="checkbox-wrap" onclick="toggleTodoQuick(${t.id})">
        <input type="checkbox" ${t.completed ? 'checked' : ''}>
        <span style="${t.completed ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">
          ${escapeHtml(t.title)}
        </span>
      </label>
      ${t.dueDate ? `<span style="font-size:0.78rem;color:${new Date(t.dueDate) < new Date() ? 'var(--danger)' : 'var(--text-muted)'}">${t.dueDate}</span>` : ''}
    </div>
  `).join('');
}

async function toggleTodoQuick(id) {
  const todo = await DB.get('todos', id);
  if (todo) {
    todo.completed = !todo.completed;
    await DB.put('todos', todo);
    if (todo.completed) {
      addCoins(10);
      showToast('待办已完成！+10金币', 'success');
    }
    renderDashboard();
  }
}

async function renderCountdown() {
  const examDateStr = (await DB.get('settings', 'examDate'))?.value;
  const el = document.getElementById('examCountdown');
  const dateEl = document.getElementById('examDate');

  if (!examDateStr) {
    el.textContent = '--';
    dateEl.textContent = '请先在教资备考中设置考试日期';
    return;
  }

  const examDate = new Date(examDateStr);
  const now = new Date();
  const diff = examDate - now;
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    el.textContent = '已结束';
    dateEl.textContent = `考试日期: ${examDateStr}`;
  } else {
    el.textContent = daysLeft;
    dateEl.textContent = `考试日期: ${examDateStr}`;
    if (daysLeft <= 7) el.style.color = 'var(--danger)';
    else if (daysLeft <= 30) el.style.color = 'var(--warning)';
  }

  // 每日自动更新连续打卡
  const today = new Date().toISOString().split('T')[0];
  const lastCheckin = (await DB.get('settings', 'lastCheckin'))?.value;
  if (lastCheckin !== today) {
    const streak = (await DB.get('settings', 'streak'))?.value || 0;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastCheckin === yesterdayStr) {
      await DB.put('settings', { key: 'streak', value: streak + 1 });
    } else if (lastCheckin !== today) {
      await DB.put('settings', { key: 'streak', value: 1 });
    }
    await DB.put('settings', { key: 'lastCheckin', value: today });
  }
}

async function renderStudySummary() {
  const pomodoros = await DB.getAll('task_pomodoros');
  const today = new Date().toISOString().split('T')[0];
  const todayPomos = pomodoros.filter(p => p.date === today && p.completed);
  const todayMinutes = todayPomos.length * 25;

  // 本周
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  weekStart.setHours(0,0,0,0);
  const weekPomos = pomodoros.filter(p => {
    const d = new Date(p.date);
    return d >= weekStart && p.completed;
  });
  const weekHours = (weekPomos.length * 25 / 60).toFixed(1);

  const streak = (await DB.get('settings', 'streak'))?.value || 0;

  document.getElementById('statToday').textContent = `${todayMinutes} 分钟`;
  document.getElementById('statWeek').textContent = `${weekHours} 小时`;
  document.getElementById('statStreak').textContent = `${streak} 天`;
}

async function renderAccountingBrief() {
  const records = await DB.getAll('accounting');
  const now = new Date();
  const thisMonth = records.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalExpense = thisMonth.filter(r => r.type === 'expense').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const totalIncome = thisMonth.filter(r => r.type === 'income').reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const budget = parseFloat((await DB.get('settings', 'monthlyBudget'))?.value || '0');

  document.getElementById('briefExpense').textContent = `¥${totalExpense.toFixed(2)}`;
  document.getElementById('briefIncome').textContent = `¥${totalIncome.toFixed(2)}`;
  document.getElementById('briefBudget').textContent = `¥${budget.toFixed(2)}`;

  const progressBar = document.getElementById('budgetProgress');
  if (budget > 0) {
    const pct = Math.min((totalExpense / budget) * 100, 100);
    progressBar.style.width = `${pct}%`;
    if (pct >= 90) progressBar.classList.add('danger');
    else progressBar.classList.remove('danger');
  } else {
    progressBar.style.width = '0%';
  }
}

async function renderDailyQuote() {
  const savedQuote = await DB.get('settings', 'dailyQuote');
  const today = new Date().toISOString().split('T')[0];

  let quote;
  if (savedQuote && savedQuote.value && savedQuote.value.date === today) {
    quote = savedQuote.value;
  } else {
    // 按日期确定性轮换：每天固定一条，不用随机保证31天不重复
    const dayIndex = Math.abs(hashCode(today)) % DAILY_QUOTES.length;
    quote = { ...DAILY_QUOTES[dayIndex], date: today };
    await DB.put('settings', { key: 'dailyQuote', value: quote });
  }

  document.getElementById('dailyQuote').textContent = `"${quote.en}"`;
  document.getElementById('dailyQuoteZh').textContent = quote.zh;
  document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
  document.getElementById('dailyQuoteAnalysis').innerHTML = `<span style="font-size:0.82rem;color:var(--text-muted);">💡 ${escapeHtml(quote.analysis || '')}</span>`;
}

// 简单的字符串哈希
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// 暴露全局函数供 HTML onclick 使用
window.toggleTodoQuick = toggleTodoQuick;
