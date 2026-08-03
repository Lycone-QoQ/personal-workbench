# 个人综合工作台 - 打包 APK / IPA 教程

## 方式一：PWA 打包（推荐，最简单）

PWA（Progressive Web App）可以将网页应用直接安装到手机桌面，效果接近原生 App。

### Android 打包 APK

**工具：PWA Builder (pwabuilder.com)** 或 **Bubblewrap CLI**

#### 步骤：

**A. 使用 PWA Builder 在线打包（零代码）**

1. 访问 https://www.pwabuilder.com/
2. 输入你的网站 URL（需要先部署到服务器）
3. PWA Builder 会自动检测你的 manifest.json 和 Service Worker
4. 点击 "Package for Stores" → 选择 "Android"
5. 下载生成的 APK 文件
6. 或者生成 `.aab` 格式上传到 Google Play

**B. 使用 Bubblewrap CLI 本地打包**

```bash
# 1. 安装 Node.js（已安装跳过）
# 2. 安装 Bubblewrap
npm install -g @bubblewrap/cli

# 3. 初始化项目
bubblewrap init --manifest https://你的域名/personal-workbench/manifest.json

# 4. 构建 APK
bubblewrap build
```

生成的 APK 在项目目录的 `app-release-signed.apk`。

**C. 使用 HBuilder X（国内推荐）**

1. 下载 HBuilder X: https://www.dcloud.io/hbuilderx.html
2. 新建项目 → 5+App → 选择你的 `personal-workbench` 目录
3. 在 `manifest.json`（HBuilder 的配置文件）中配置：
   - 应用名称：麦子的工作台
   - 包名：com.maizi.workbench
   - 图标配置
4. 点击「发行」→「原生App-云打包」
5. 使用公共测试证书或上传自己的证书
6. 等待云端打包完成，下载 APK

**D. 使用 Capacitor（推荐，控制力最强）**

```bash
# 1. 安装 Capacitor CLI
npm install -g @capacitor/cli @capacitor/core @capacitor/android

# 2. 初始化
cd personal-workbench
npx cap init "麦子的工作台" "com.maizi.workbench"

# 3. 添加 Android 平台
npx cap add android

# 4. 同步文件
npx cap sync

# 5. 用 Android Studio 打开
npx cap open android
```

在 Android Studio 中，点击 Build → Build Bundle(s) / APK(s) → Build APK(s)。

---

### iOS 打包 IPA

**A. 使用 PWA Builder**

1. 访问 https://www.pwabuilder.com/
2. 输入网站 URL
3. 选择 "iOS" 打包
4. 下载生成的项目文件
5. 在 Mac 上用 Xcode 打开 `.xcodeproj` 文件
6. 配置签名证书
7. Archive → Distribute App

**B. 使用 Capacitor（推荐）**

```bash
# 需要 Mac + Xcode + Apple Developer 账号

# 1. 安装 iOS 平台
npm install @capacitor/ios
npx cap add ios

# 2. 同步文件
npx cap sync

# 3. 用 Xcode 打开
npx cap open ios
```

在 Xcode 中：
1. 选择你的开发团队（Signing & Capabilities）
2. 选择目标设备
3. Product → Archive
4. Distribute App → 选择分发方式（App Store / Ad Hoc / Enterprise）

---

## 方式二：直接在手机上安装 PWA（无需打包）

### Android（Chrome 浏览器）

1. 用 Chrome 打开网站
2. 点击地址栏右侧的「安装」图标（或三点菜单 → 添加到主屏幕）
3. 确认安装

### iOS（Safari 浏览器）

1. 用 Safari 打开网站
2. 点击底部「分享」按钮
3. 选择「添加到主屏幕」
4. 命名并添加

---

## 打包注意事项

1. **图标尺寸**：确保所有尺寸的图标都已生成（72×72 到 512×512）
2. **HTTPS**：PWA 需要 HTTPS 才能正常工作（Service Worker 要求）
3. **manifest.json**：确保 `start_url` 和 `scope` 配置正确
4. **测试**：打包前先用 Chrome DevTools → Application → Manifest 检查配置

## 推荐部署方案（免费）

| 平台 | 方案 | 说明 |
|------|------|------|
| GitHub Pages | 免费 | 静态网站托管，支持 HTTPS |
| Vercel | 免费 | 自动 HTTPS，全球 CDN |
| Netlify | 免费 | 拖拽部署，自动 HTTPS |
| CloudStudio | 免费 | 腾讯云静态托管 |

### GitHub Pages 部署（推荐）

```bash
# 1. 创建 GitHub 仓库
# 2. 推送代码
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用户名/personal-workbench.git
git push -u origin main

# 3. 在 GitHub 仓库设置中启用 Pages
# Settings → Pages → Source: main branch → Save
# 访问 https://你的用户名.github.io/personal-workbench/
```

---

## 常见问题

**Q: APK 安装时提示"未知来源"？**
A: Android → 设置 → 安全 → 允许安装未知来源应用

**Q: iOS 无法安装 IPA？**
A: 需要 Apple Developer 账号（$99/年）或使用 TestFlight 分发

**Q: PWA 安装后数据还在吗？**
A: 是的，IndexedDB 数据与浏览器共享，卸载 PWA 不会删除数据（除非清除浏览器数据）
