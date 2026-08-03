/**
 * 学习白噪音播放器
 * 使用 Web Audio API 实时生成白噪音 / 粉噪音 / 棕噪音，
 * 无需任何音频文件、无需联网，离线可用。
 */
class AmbientPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.source = null;
    this.buffer = null;
    this.type = 'pink';
    this.volume = 0.4;
    this.playing = false;
  }

  async ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) {}
    }
    return true;
  }

  // 生成 4 秒可循环的噪音缓冲
  generateBuffer(type) {
    const ctx = this.ctx;
    const seconds = 4;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const d = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) d[i] = Math.random() * 2 - 1;
    } else if (type === 'brown') {
      // 棕噪音：对白噪音做积分，低频更重，听感像远处的海浪/风
      let last = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    } else {
      // 粉噪音：Paul Kellet 近似算法，频谱更自然柔和，最像"雨水/微风"
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        b3 = 0.86650 * b3 + w * 0.3104856;
        b4 = 0.55000 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.0168980;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    return buffer;
  }

  async play(type) {
    const ok = await this.ensureCtx();
    if (!ok) {
      if (typeof showToast === 'function') showToast('当前浏览器不支持音频生成', 'error');
      return false;
    }
    if (type) this.type = type;
    this._stopSource();
    this.buffer = this.generateBuffer(this.type);
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.loop = true;
    this.source.connect(this.master);
    this.source.start(0);
    this.playing = true;
    return true;
  }

  _stopSource() {
    if (this.source) {
      try { this.source.stop(); } catch (e) {}
      try { this.source.disconnect(); } catch (e) {}
      this.source = null;
    }
  }

  pause() {
    this._stopSource();
    this.playing = false;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  setType(type) {
    this.type = type;
    if (this.playing) this.play(type);
  }
}
