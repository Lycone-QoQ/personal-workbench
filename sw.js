/**
 * Service Worker - 离线缓存 & PWA 支持
 * 缓存策略：network-first（联网时始终拉取最新文件，离线时回退缓存）
 * —— 避免旧版代码被永久缓存导致修复无法下发
 *
 * 注意：所有路径使用「相对路径」，使本应用能同时兼容
 *   - CloudStudio 根目录部署（/）
 *   - GitHub Pages 子目录部署（/personal-workbench/）
 * 注册在页面侧（app.js）用 './sw.js'，scope 自动等于 sw.js 所在目录。
 */
const CACHE_NAME = 'workbench-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/db.js',
  './js/theme.js',
  './js/app.js',
  './js/data/exam_knowledge_preset.js',
  './js/components/navbar.js',
  './js/components/doodle.js',
  './js/components/achievements.js',
  './js/components/weekly-report.js',
  './js/components/notifications.js',
  './js/components/bgm.js',
  './js/components/sfx.js',
  './js/modules/dashboard.js',
  './js/modules/exam.js',
  './js/modules/english.js',
  './js/modules/accounting.js',
  './js/modules/diary.js',
  './js/modules/fitness.js',
  './js/modules/politics.js',
  './js/modules/podcast.js',
  './js/modules/speech.js',
  './js/modules/tasks.js',
  './js/modules/memos.js',
  './js/modules/settings.js',
  './js/modules/garden.js'
];

// 安装：预缓存核心资源（失败不阻塞）
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// 激活：清除旧版本缓存，接管所有页面
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
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
      .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html') || caches.match('./')))
  );
});
