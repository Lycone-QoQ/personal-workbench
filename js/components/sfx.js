/**
 * 交互音效 + 视觉特效
 * 使用 Web Audio API 实时合成，无需任何音频文件、离线可用。
 * - 全局：点击任意按钮/可交互元素时播放轻柔提示音
 * - 积分花园：种树 / 浇水 / 施肥 专属音效 + 粒子特效
 */

class SfxManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true; // 默认开启，加载时从设置读取
    this.lastPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  }

  async ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) {}
    }
    return true;
  }

  // 通用单音（指数包络，柔和）
  tone(freq, dur, opts = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.sweepTo), t0 + dur);
    }
    const g = this.ctx.createGain();
    const peak = opts.gain != null ? opts.gain : 0.5;
    const atk = opts.attack != null ? opts.attack : 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  // ---------- 各类音效 ----------
  click() {
    if (!this.enabled) return;
    this.ensureCtx().then(() => {
      this.tone(720, 0.05, { type: 'triangle', gain: 0.05 });
    });
  }

  // 种树：上扬的魔法生长音 + 清脆铃音
  plant() {
    if (!this.enabled) return;
    this.ensureCtx().then(() => {
      this.tone(300, 0.30, { type: 'sine', gain: 0.12, sweepTo: 720 });
      this.tone(920, 0.55, { type: 'sine', gain: 0.05, attack: 0.14 });
    });
  }

  // 浇水：两声水滴
  water() {
    if (!this.enabled) return;
    this.ensureCtx().then(() => {
      this.tone(1180, 0.12, { type: 'sine', gain: 0.12, sweepTo: 760 });
      setTimeout(() => this.tone(1340, 0.10, { type: 'sine', gain: 0.08, sweepTo: 900 }), 95);
    });
  }

  // 施肥：上行琶音（闪光感）
  fertilize() {
    if (!this.enabled) return;
    this.ensureCtx().then(() => {
      [660, 880, 1175].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.16, { type: 'sine', gain: 0.09 }), i * 70));
    });
  }

  // 成功提示：上行三音
  success() {
    if (!this.enabled) return;
    this.ensureCtx().then(() => {
      [523, 659, 784].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.18, { type: 'triangle', gain: 0.07 }), i * 80));
    });
  }

  // 返回 / 关闭：低沉轻点
  back() {
    if (!this.enabled) return;
    this.ensureCtx().then(() => {
      this.tone(420, 0.05, { type: 'sine', gain: 0.05 });
    });
  }

  // ---------- 初始化 ----------
  init() {
    // 从设置读取开关
    if (typeof DB !== 'undefined') {
      DB.get('settings', 'sfxEnabled').then(r => {
        this.enabled = r ? r.value !== 'false' : true;
      }).catch(() => {});
    }

    // 全局点击音效（捕获阶段，确保早于元素自身 handler）
    const SEL = 'button, .btn, .nav-item, .tab, .float-btn, .garden-tree-card, ' +
                '.ambient-type, .bgm-track, .doodle-tool, .theme-toggle, ' +
                '.search-result-item, [onclick]';

    document.addEventListener('click', (e) => {
      // 记录指针位置（供特效使用）
      if (typeof e.clientX === 'number') {
        this.lastPointer = { x: e.clientX, y: e.clientY };
      }
      if (!this.enabled) return;
      // 输入框 / 文本域 / 下拉不产生点击音
      if (e.target.closest('input, textarea, select')) return;
      const el = e.target.closest(SEL);
      if (!el) return;
      const sfx = el.getAttribute('data-sfx');
      if (sfx && sfx !== 'click') return; // 该元素已有专属音效，交给具体函数处理
      this.click();
    }, true);
  }
}

// 全局单例
window.Sfx = new SfxManager();

// ---------- 视觉粒子特效 ----------
// 在某坐标处迸发一组 emoji 粒子，自动消散并移除。
function spawnParticles(x, y, emojis, count = 14, opts = {}) {
  if (!document.body) return;
  const layer = document.createElement('div');
  layer.className = 'sfx-particle-layer';
  layer.style.cssText =
    `position:fixed;left:${x}px;top:${y}px;pointer-events:none;z-index:99999;`;
  document.body.appendChild(layer);

  const spread = opts.spread || 90;
  const rise = opts.rise != null ? opts.rise : 46;
  const dur = opts.dur || 1100;
  const size = opts.size || 22;

  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.cssText =
      `position:absolute;left:0;top:0;font-size:${size}px;will-change:transform,opacity;`;
    layer.appendChild(s);

    const ang = Math.random() * Math.PI * 2;
    const dist = spread * (0.4 + Math.random() * 0.6);
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist - rise * (0.5 + Math.random());
    const d = dur * (0.8 + Math.random() * 0.4);
    const rot = (Math.random() - 0.5) * 220;

    s.animate([
      { transform: 'translate(0px,0px) scale(0.3) rotate(0deg)', opacity: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 12}px) scale(1.15) rotate(${rot * 0.4}deg)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.75) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: d, easing: 'cubic-bezier(.2,.7,.3,1)' });
  }
  setTimeout(() => layer.remove(), dur * 1.5 + 250);
}

// 在坐标处产生一圈扩散光环（种植成功的高光）
function spawnRing(x, y, color = '#9BD8A0') {
  if (!document.body) return;
  const ring = document.createElement('div');
  ring.style.cssText =
    `position:fixed;left:${x}px;top:${y}px;width:18px;height:18px;margin:-9px 0 0 -9px;` +
    `border-radius:50%;border:3px solid ${color};pointer-events:none;z-index:99998;`;
  document.body.appendChild(ring);
  ring.animate([
    { transform: 'scale(0.4)', opacity: 0.9 },
    { transform: 'scale(5.5)', opacity: 0 }
  ], { duration: 700, easing: 'ease-out' });
  setTimeout(() => ring.remove(), 760);
}

window.spawnParticles = spawnParticles;
window.spawnRing = spawnRing;

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Sfx.init());
} else {
  Sfx.init();
}
