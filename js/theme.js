/**
 * 主题系统 - 皮肤切换、深色/浅色模式、自定义调节
 */
class ThemeManager {
  constructor() {
    this.skins = ['warm-oat','lavender','sage-green','rose','sky-blue','peach','mint'];
    this.skinNames = {
      'warm-oat':'暖燕麦','lavender':'薰衣草','sage-green':'鼠尾草绿',
      'rose':'玫瑰粉','sky-blue':'天空蓝','peach':'蜜桃','mint':'薄荷绿'
    };
    this.defaultRadius = 12;
    this.defaultOpacity = 1;
    this.defaultFontSize = 0;
    this.defaultPixel = 'on';
    this.defaultBgOpacity = 1;

    this.init();
  }

  async init() {
    // Load saved theme settings
    const theme = (await DB.get('settings', 'theme'))?.value || 'light';
    const skin = (await DB.get('settings', 'skin'))?.value || 'warm-oat';
    const cardRadius = (await DB.get('settings', 'cardRadius'))?.value || this.defaultRadius;
    const cardOpacity = (await DB.get('settings', 'cardOpacity'))?.value || this.defaultOpacity;
    const fontSize = (await DB.get('settings', 'fontSize'))?.value || this.defaultFontSize;

    this.applyTheme(theme);
    this.applySkin(skin);
    this.setCardRadius(cardRadius);
    this.setCardOpacity(cardOpacity);
    this.setFontSize(fontSize);

    // 像素风开关（星露谷风格）
    const pixel = (await DB.get('settings', 'pixel'))?.value || this.defaultPixel;
    this.applyPixel(pixel);

    // 自定义背景图
    const bgImage = (await DB.get('settings', 'bgImage'))?.value;
    const bgOpacity = (await DB.get('settings', 'bgOpacity'))?.value;
    this.applyBackground(bgImage, bgOpacity === undefined ? this.defaultBgOpacity : bgOpacity);

    // Theme toggle button
    document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌓';
    DB.put('settings', { key: 'theme', value: theme });
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    this.applyTheme(current === 'dark' ? 'light' : 'dark');
    showToast(current === 'dark' ? '已切换为浅色模式 ☀️' : '已切换为深色模式 🌙', 'success');
  }

  applySkin(skin) {
    document.documentElement.setAttribute('data-skin', skin);
    DB.put('settings', { key: 'skin', value: skin });
  }

  setCardRadius(px) {
    const root = document.documentElement.style;
    root.setProperty('--radius-sm', `${px - 4}px`);
    root.setProperty('--radius-md', `${px}px`);
    root.setProperty('--radius-lg', `${px + 4}px`);
    root.setProperty('--radius-xl', `${px + 8}px`);
    DB.put('settings', { key: 'cardRadius', value: px });
  }

  setCardOpacity(val) {
    document.documentElement.style.setProperty('--card-opacity', val);
    DB.put('settings', { key: 'cardOpacity', value: val });
  }

  setFontSize(level) {
    // level: 0=小, 1=中(默认), 2=大, 3=特大
    const scales = [0.85, 1, 1.15, 1.3];
    document.documentElement.style.setProperty('--font-size-scale', scales[level] || 1);
    DB.put('settings', { key: 'fontSize', value: level });
  }

  // ---- 像素风（星露谷风格） ----
  applyPixel(val) {
    const on = val === 'on' ? 'on' : 'off';
    document.documentElement.setAttribute('data-pixel', on);
    DB.put('settings', { key: 'pixel', value: on });
  }

  togglePixelStyle(on) {
    this.applyPixel(on ? 'on' : 'off');
  }

  // ---- 自定义背景图 ----
  applyBackground(image, opacity) {
    const el = document.getElementById('app-bg');
    if (!el) return;
    el.style.backgroundImage = image ? `url(${image})` : '';
    const op = (opacity === undefined || opacity === null) ? this.defaultBgOpacity : opacity;
    document.documentElement.style.setProperty('--bg-opacity', op);
    el.style.opacity = op;
  }

  setBackgroundImage(dataUrl) {
    DB.put('settings', { key: 'bgImage', value: dataUrl });
    this.applyBackground(dataUrl, document.documentElement.style.getPropertyValue('--bg-opacity') || this.defaultBgOpacity);
  }

  setBgOpacity(v) {
    DB.put('settings', { key: 'bgOpacity', value: v });
    const el = document.getElementById('app-bg');
    if (el) el.style.opacity = v;
    document.documentElement.style.setProperty('--bg-opacity', v);
  }

  clearBackground() {
    DB.put('settings', { key: 'bgImage', value: '' });
    const el = document.getElementById('app-bg');
    if (el) el.style.backgroundImage = '';
  }
}
