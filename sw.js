/**
 * Service Worker - 离线缓存 & PWA 支持
 * 缓存策略：network-first（联网时始终拉取最新文件，离线时回退缓存）
 * —— 避免旧版代码被永久缓存导致修复无法下发
 */
const CACHE_NAME = 'workbench-v3';
const ASSETS = [
  '/personal-workbench/',
  '/personal-workbench/index.html',
  '/personal-workbench/css/style.css',
  '/personal-workbench/js/db.js',
  '/personal-workbench/js/theme.js',
  '/personal-workbench/js/app.js',
  '/personal-workbench/js/components/navbar.js',
  '/personal-workbench/js/components/doodle.js',
  '/personal-workbench/js/components/achievements.js',
  '/personal-workbench/js/components/weekly-report.js',
  '/personal-workbench/js/components/notifications.js',
  '/personal-workbench/js/modules/dashboard.js',
  '/personal-workbench/js/modules/exam.js',
  '/personal-workbench/js/modules/english.js',
  '/personal-workbench/js/modules/accounting.js',
  '/personal-workbench/js/modules/diary.js',
  '/personal-workbench/js/modules/fitness.js',
  '/personal-workbench/js/modules/politics.js',
  '/personal-workbench/js/modules/podcast.js',
  '/personal-workbench/js/modules/speech.js',
  '/personal-workbench/js/modules/tasks.js',
  '/personal-workbench/js/modules/memos.js',
  '/personal-workbench/js/modules/settings.js',
  '/personal-workbench/js/modules/garden.js',
  '/personal-workbench/manifest.json'
];

// 安装
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// 激活：删除所有旧版本缓存，确保旧代码彻底失效
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 拦截请求：联网优先（拿最新），失败再用缓存（保离线）
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 跨域请求直接走网络

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('/personal-workbench/index.html')))
  );
});

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/personal-workbench/sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}
