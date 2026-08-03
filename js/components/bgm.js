/**
 * 背景纯音乐播放器
 * 使用 Web Audio API 实时合成几首不同风格的随机纯音乐（无需任何音频文件、离线可用）。
 * 旋律基于五声音阶 + 随机变奏，每遍都略有不同 —— 即「几首随机纯音乐」。
 */
class BgmPlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.dry = null;
    this.wet = null;
    this.delay = null;
    this.feedback = null;
    this.playing = false;
    this.currentIndex = 0;
    this.timer = null;
    this.beatCount = 0;
    this.volume = 0.4;

    // 5 首不同风格的曲目（全部用五声音阶，确保悦耳）
    this.tracks = [
      { name: '🌅 晨光钢琴', root: 60, scale: [0, 2, 4, 7, 9], wave: 'triangle', beat: 460, density: 0.82, bass: true, cutoff: 2600, wet: 0.28 },
      { name: '✨ 星空八音盒', root: 72, scale: [0, 2, 4, 7, 9], wave: 'sine', beat: 620, density: 0.55, bass: false, cutoff: 4200, wet: 0.42 },
      { name: '🌧️ 雨后轻音', root: 57, scale: [0, 3, 5, 7, 10], wave: 'triangle', beat: 520, density: 0.72, bass: true, cutoff: 1900, wet: 0.34 },
      { name: '🍃 森林风铃', root: 67, scale: [0, 2, 4, 7, 9], wave: 'sine', beat: 320, density: 0.62, bass: false, cutoff: 5200, wet: 0.38 },
      { name: '🎸 午后吉他', root: 55, scale: [0, 4, 7, 12, 16], wave: 'triangle', beat: 380, density: 0.9, bass: true, cutoff: 2300, wet: 0.3 }
    ];
  }

  async ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);

      // 干声
      this.dry = this.ctx.createGain();
      this.dry.gain.value = 0.85;
      this.dry.connect(this.master);

      // 湿声 + 延迟反馈（空间混响感）
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.3;
      this.wet.connect(this.master);
      this.delay = this.ctx.createDelay();
      this.delay.delayTime.value = 0.32;
      this.feedback = this.ctx.createGain();
      this.feedback.gain.value = 0.32;
      this.wet.connect(this.delay);
      this.delay.connect(this.feedback);
      this.feedback.connect(this.delay);
      this.delay.connect(this.wet);
    }
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) {}
    }
    return true;
  }

  midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  // 在音阶内随机取一个 midi 音
  pickNote(root, scale, allowHigh) {
    const deg = scale[Math.floor(Math.random() * scale.length)];
    let oct = 0;
    const r = Math.random();
    if (allowHigh && r > 0.7) oct = 12;
    else if (r < 0.18) oct = -12;
    return root + deg + oct;
  }

  // 播放单个音符（带柔和包络 + 低通 + 混响）
  playNote(midi, dur, wave, peak, cutoff) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = wave;
    osc.frequency.value = this.midiToFreq(midi);
    // 轻微失谐让音色更温暖
    osc.detune.value = (Math.random() - 0.5) * 6;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.012);          // attack
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);     // release

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff || 2400;

    osc.connect(g);
    g.connect(filter);
    filter.connect(this.dry);
    filter.connect(this.wet);

    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  scheduleBeat() {
    if (!this.playing || !this.ctx) return;
    const tr = this.tracks[this.currentIndex];
    this.beatCount++;

    // 主旋律
    if (Math.random() < tr.density) {
      const note = this.pickNote(tr.root, tr.scale, true);
      const dur = (tr.beat / 1000) * (1.4 + Math.random() * 1.6);
      const peak = 0.07 + Math.random() * 0.06;
      this.playNote(note, dur, tr.wave, peak, tr.cutoff);
    }
    // 偶尔叠加一个高八度点缀
    if (tr.wave === 'sine' && Math.random() < 0.25) {
      const note = this.pickNote(tr.root + 12, tr.scale, true);
      this.playNote(note, (tr.beat / 1000) * 1.2, 'sine', 0.05, tr.cutoff);
    }
    // 低音垫（每 4 拍换一次柔和根音）
    if (tr.bass && this.beatCount % 4 === 0) {
      this.playNote(tr.root - 12, (tr.beat / 1000) * 3.2, 'sine', 0.1, 900);
    }

    // 下一拍（带节奏微扰，制造随机感）
    const jitter = (Math.random() - 0.5) * 160;
    this.timer = setTimeout(() => this.scheduleBeat(), tr.beat + jitter);
  }

  async play(index) {
    const ok = await this.ensureCtx();
    if (!ok) {
      if (typeof showToast === 'function') showToast('当前浏览器不支持音频生成', 'error');
      return false;
    }
    if (typeof index === 'number') this.currentIndex = ((index % this.tracks.length) + this.tracks.length) % this.tracks.length;
    this._stopTimer();
    this.playing = true;
    this.beatCount = 0;
    this.scheduleBeat();
    return true;
  }

  pause() {
    this._stopTimer();
    this.playing = false;
  }

  _stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
    if (this.playing) this.play(this.currentIndex);
    return this.tracks[this.currentIndex].name;
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.tracks.length) % this.tracks.length;
    if (this.playing) this.play(this.currentIndex);
    return this.tracks[this.currentIndex].name;
  }

  random() {
    let i = Math.floor(Math.random() * this.tracks.length);
    if (this.tracks.length > 1 && i === this.currentIndex) i = (i + 1) % this.tracks.length;
    this.currentIndex = i;
    if (this.playing) this.play(this.currentIndex);
    return this.tracks[this.currentIndex].name;
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  getTrackName() {
    return this.tracks[this.currentIndex].name;
  }
}
