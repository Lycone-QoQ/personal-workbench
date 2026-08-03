/**
 * 麦子的工作台 —— 本地/部署后端
 * 1) 托管前端静态文件（PWA 可直接访问）
 * 2) 提供 /api/people-daily：真实抓取人民日报时政 RSS，转成结构化素材
 *
 * 运行： node server.js   （默认端口 3000，可用 PORT 环境变量覆盖）
 * 说明： 纯 PWA 无法直接跨域抓取人民日报，必须由本服务代理。
 *        未启动本服务时，前端"刷新人日报"会自动降级为本地精选素材，按钮始终可用。
 */
const express = require('express');
const https = require('https');
const { XMLParser } = require('fast-xml-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const RSS_URL = 'https://www.people.com.cn/rss/politics.xml';

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', trimValues: true });

function stripCData(v) {
  if (v == null) return '';
  if (typeof v === 'object') return '#text' in v ? String(v['#text']) : '';
  return String(v);
}
function stripHtml(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fetchRss() {
  return new Promise((resolve, reject) => {
    const req = https.get(RSS_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WorkbenchBot/1.0)' }
    }, res => {
      if (res.statusCode !== 200) { reject(new Error('RSS HTTP ' + res.statusCode)); return; }
      let buf = '';
      res.setEncoding('utf8');
      res.on('data', d => (buf += d));
      res.on('end', () => resolve(buf));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('RSS 请求超时')));
  });
}

app.get('/api/people-daily', async (req, res) => {
  try {
    const xml = await fetchRss();
    const parsed = parser.parse(xml);
    let items = parsed?.rss?.channel?.item || [];
    if (!Array.isArray(items)) items = items ? [items] : [];
    const list = items.slice(0, 20).map(it => {
      const rawDesc = stripCData(it.description) || '';
      const text = stripHtml(rawDesc);
      const pubDate = stripCData(it.pubDate) || '';
      return {
        title: stripCData(it.title),
        link: stripCData(it.link),
        date: pubDate ? pubDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        summary: text.slice(0, 140),
        content: text,
        source: '人民网',
        category: '要闻速览',
        tags: ['时政'],
        keyPoints: []
      };
    });
    res.json({ ok: true, count: list.length, items: list });
  } catch (e) {
    res.status(502).json({ ok: false, error: e.message });
  }
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`🌾 麦子的工作台 已启动 → http://localhost:${PORT}`);
  console.log(`   时政联网 API → http://localhost:${PORT}/api/people-daily`);
});

module.exports = app;
