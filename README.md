# 🌾 麦子的工作台 · Personal Workbench

一个**本地优先**的 PWA 个人工作台，零后端、零账号，所有数据 100% 保存在你的设备（IndexedDB）里。
界面支持**星露谷像素风**（厚描边 / 硬阴影 / 方块化，保留原有治愈系配色），可自定义相册背景图，并内置**学习白噪音**（Web Audio 实时生成，离线可用）。

## ✨ 功能模块

| 模块 | 说明 |
| --- | --- |
| 🏠 首页总览 | 今日待办 / 考试倒计时 / 学习数据 / 记账速览 / 每日一句 |
| 📚 教资备考 | 知识点库、每日背诵（艾宾浩斯打卡）、错题本、历年真题、试讲素材 |
| 🔤 英语学习 | 多邻国式闯关（三颗心 / 连击 / 解析）、口语、听力、生词本 |
| 💰 日常记账 | 收支记录、统计分析、预算管控 |
| 📝 日记随笔 | 写日记 + 时间线 |
| 💪 运动饮食 | 运动打卡、饮食记录、饮水量、数据统计 |
| 📰 时政资讯 | 半月谈风格时政素材，支持一键导入 / 人民日报抓取（需后端）|
| 🎙️ 播客管理 | 播客清单 + 收听统计 |
| 🎤 表达练习 | 练习题库 / 记录 / 进步趋势 |
| ✅ 任务管理 | 任务列表、番茄钟、计时统计、复盘模板 |
| 💡 备忘录 | 全部备忘 + 回收站 |
| 🌳 积分花园 | 用金币种树（页面内弹窗，PWA/iOS 友好）|

## 🎨 界面与个性

- **星露谷像素风**：设置 → 主题自定义 → 「🌾 界面风格」开关，一键切换厚描边像素风与柔和治愈风（配色不变）。
- **自定义背景图**：设置 → 主题自定义 → 「🖼️ 自定义背景图」，从相册选图作应用背景，可拖透明度滑块。
- **学习白噪音**：右下角 🎵 浮动按钮，提供白噪音 / 粉噪音 / 棕噪音三种，音量可调，偏好自动保存。
- **7 套治愈系皮肤** + 深浅色模式、卡片圆角 / 透明度、全局字号。

## 🛠 技术栈

- 纯前端：原生 JavaScript（无框架、无构建步骤）
- 存储：IndexedDB（本地优先，隐私安全）
- PWA：manifest + Service Worker（network-first，更新自动生效）
- 白噪音：Web Audio API 实时合成

## 🚀 本地运行

```bash
# 方式一：用任意静态服务器（推荐，Service Worker 需要 http 协议）
npm start            # 等价于 npx serve . ，默认 http://localhost:3000

# 方式二：Python
python -m http.server 8080
```

> 注意：直接双击 `index.html`（file://）会因 Service Worker 限制无法使用 PWA 能力，请用静态服务器访问。

## 📦 部署到 GitHub Pages

1. 在 GitHub 新建一个仓库（如 `personal-workbench`）。
2. 推送本目录内容到仓库：
   ```bash
   git init
   git add -A
   git commit -m "🌾 麦子的工作台 PWA"
   git branch -M main
   git remote add origin https://github.com/Lycone-QoQ/personal-workbench.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages**，Source 选择 `main` 分支根目录，保存。
4. 等待 1-2 分钟，访问 `https://Lycone-QoQ.github.io/personal-workbench/` 即可。

> 纯静态部署下，「刷新人日报」会自动降级为本地精选素材（按钮始终可用）；实时抓取人民日报需部署可选后端（见下）。

## 🔌 可选后端（实时抓取人民日报）

`server.js` 是一个**可选**的 Node 服务，用于真实抓取人民日报时政 RSS（纯 PWA 无法跨域直连）。
需安装依赖后运行：

```bash
npm install            # 安装 express / fast-xml-parser（可选依赖）
npm run serve:backend  # 默认 http://localhost:3000 ，提供 /api/people-daily
```

前端已做优雅降级：未启动后端时，时政刷新自动使用本地精选素材。

## 🔒 隐私

所有数据仅存储在你本机浏览器（IndexedDB），不上传任何服务器。可在「设置 → 数据管理」中导出 / 导入备份。
