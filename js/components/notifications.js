/**
 * Toast 通知 & 本地推送
 */

function showToast(msg, type = 'info', duration = 2500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showConfirm(msg, onConfirm) {
  if (confirm(msg)) { onConfirm(); }
}

// 本地通知权限请求
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('当前环境不支持系统通知（iOS PWA 下系统通知受限），已用应用内提示替代', 'warning');
    return;
  }
  try {
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted') showToast('🔔 通知已授权，将按时提醒', 'success');
      else if (result === 'denied') showToast('通知权限被拒绝，可在系统/浏览器设置中开启', 'error');
      else showToast('通知权限未变更（部分环境如 iOS PWA 不支持弹窗授权）', 'warning');
    } else if (Notification.permission === 'granted') {
      showToast('🔔 通知已授权', 'success');
    } else {
      showToast('通知权限已被拒绝，请在系统/浏览器设置中开启', 'error');
    }
  } catch (e) {
    showToast('当前环境无法请求通知权限（iOS PWA 限制），已用应用内提示', 'warning');
  }
}

function sendLocalNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/assets/icons/icon-192.png' }); }
    catch (e) { /* iOS 不支持 Notification 构造器，忽略，走应用内 toast */ }
  }
  showToast(`${title}: ${body}`, 'info');
}

// 检查通知设置并发送提醒
async function checkNotifications() {
  const enabled = (await DB.get('settings', 'notifications'))?.value;
  if (!enabled || enabled === 'false') return;

  const examDate = (await DB.get('settings', 'examDate'))?.value;
  if (examDate) {
    const daysLeft = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 30) {
      sendLocalNotification('教资考试提醒', `距离考试还有 ${daysLeft} 天，加油备考！`);
    }
  }

  // 检查逾期待办
  const todos = await DB.getAll('todos');
  const now = new Date();
  const overdue = todos.filter(t => t.dueDate && new Date(t.dueDate) < now && !t.completed);
  if (overdue.length > 0) {
    sendLocalNotification('待办提醒', `你有 ${overdue.length} 个逾期任务未完成`);
  }
}

// 定时检查（每6小时）
setInterval(checkNotifications, 6 * 60 * 60 * 1000);
document.addEventListener('DOMContentLoaded', () => {
  requestNotificationPermission();
  setTimeout(checkNotifications, 5000); // 启动5秒后检查
});
