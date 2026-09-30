// Весь звук синтезируется WebAudio на лету — ни одного аудиофайла в билде.
// Аудио разблокируется первым касанием (политика браузеров).

export const AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  unlocked: false,
  nextBeat: 0,
  beatLen: 60 / 128, // 128 bpm
  step: 0,

  unlock() {
    if (this.unlocked) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.16;
    this.musicGain.connect(this.master);

    // буфер с шумом для хэтов и ударов
    const len = this.ctx.sampleRate * 0.5;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.nextBeat = this.ctx.currentTime + 0.1;
    this.unlocked = true;
  },

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  // короткий тон с глиссандо
  tone(freq, freqEnd, dur, type, vol, when = 0) {
    if (!this.unlocked) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },

  noise(dur, vol, hp = 3000, when = 0) {
    if (!this.unlocked) return;
    const t0 = this.ctx.currentTime + when;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  },

  // --- игровые звуки ---
  pop() { this.tone(420, 880, 0.12, 'square', 0.18); },
  gateGood() {
    this.tone(520, 520, 0.09, 'square', 0.16);
    this.tone(780, 780, 0.12, 'square', 0.16, 0.07);
  },
  gateBad() { this.tone(220, 90, 0.28, 'sawtooth', 0.22); },
  hit() { this.noise(0.09, 0.3, 1200); this.tone(160, 60, 0.12, 'triangle', 0.25); },
  lose() {
    this.tone(330, 320, 0.18, 'square', 0.2);
    this.tone(250, 240, 0.18, 'square', 0.2, 0.18);
    this.tone(180, 90, 0.4, 'sawtooth', 0.22, 0.36);
  },
  win() {
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((n, i) => this.tone(n, n, 0.22, 'square', 0.16, i * 0.09));
    this.noise(0.5, 0.2, 4000, 0.45);
  },

  // --- минималистичный фоновый луп: кик + хэт ---
  update() {
    if (!this.unlocked || !this.ctx || this.ctx.state !== 'running') return;
    const ahead = this.ctx.currentTime + 0.25;
    while (this.nextBeat < ahead) {
      const t = this.nextBeat - this.ctx.currentTime;
      const s = this.step % 4;
      if (s === 0 || s === 2) {
        // кик
        const t0 = this.ctx.currentTime + Math.max(0, t);
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t0);
        osc.frequency.exponentialRampToValueAtTime(45, t0 + 0.1);
        g.gain.setValueAtTime(0.9, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        osc.connect(g); g.connect(this.musicGain);
        osc.start(t0); osc.stop(t0 + 0.18);
      } else {
        // хэт
        const t0 = this.ctx.currentTime + Math.max(0, t);
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const f = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 7000;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.5, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
        src.connect(f); f.connect(g); g.connect(this.musicGain);
        src.start(t0); src.stop(t0 + 0.06);
      }
      this.step++;
      this.nextBeat += this.beatLen / 2;
    }
  },
};
