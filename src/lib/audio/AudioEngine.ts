export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pearlPitch = 400;
  private pearlResetTimer = 0;
  private bgNoiseNode: AudioBufferSourceNode | null = null;
  private muted = false;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
    this.startBgNoise();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain) {
      this.masterGain.gain.value = m ? 0 : 0.3;
    }
  }

  play(name: string, data?: Record<string, number>) {
    if (!this.ctx || !this.masterGain || this.muted) return;

    switch (name) {
      case 'move': this.playTick(); break;
      case 'pearl': this.playPearl(data?.combo || 0); break;
      case 'dash': this.playSweep(200, 800, 0.2); break;
      case 'hit': this.playHit(); break;
      case 'gameOver': this.playGameOver(); break;
      case 'closeCall': this.playSweep(600, 900, 0.1); break;
      case 'lightning': this.playLightning(); break;
      case 'shield': this.playSweep(400, 600, 0.15); break;
      case 'shieldBreak': this.playShieldBreak(); break;
      case 'magnet': this.playSweep(300, 500, 0.2); break;
      case 'heal': this.plasSweepDown(800, 400, 0.2); break;
      case 'itemPickup': this.playSweep(500, 700, 0.1); break;
      case 'sharkWarning': this.playWarning(); break;
    }
  }

  private playTick() {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }

  private playPearl(combo: number) {
    // Reset pitch if gap > 0.5s
    const now = Date.now();
    if (now - this.pearlResetTimer > 500) {
      this.pearlPitch = 400;
    }
    this.pearlResetTimer = now;

    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = this.pearlPitch;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);

    // Pitch rises with consecutive collection
    this.pearlPitch = Math.min(1200, this.pearlPitch + 30);
  }

  private playSweep(from: number, to: number, dur: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  }

  private plasSweepDown(from: number, to: number, dur: number) {
    this.playSweep(from, to, dur);
  }

  private playHit() {
    const ctx = this.ctx!;
    // Noise burst
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // Low thump
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(gain).connect(this.masterGain!);
    osc.connect(gain);
    noise.start(ctx.currentTime);
    osc.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  }

  private playGameOver() {
    const ctx = this.ctx!;
    const notes = [600, 500, 400, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  private playLightning() {
    const ctx = this.ctx!;
    // White noise burst
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    noise.connect(gain).connect(this.masterGain!);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.3);

    // High pitch sweep
    this.playSweep(2000, 400, 0.3);
  }

  private playShieldBreak() {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  private playWarning() {
    const ctx = this.ctx!;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = 800;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.08);
    }
  }

  private startBgNoise() {
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    this.bgNoiseNode = ctx.createBufferSource();
    this.bgNoiseNode.buffer = buffer;
    this.bgNoiseNode.loop = true;

    // Heavy lowpass filter to sound like water
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 1;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    this.bgNoiseNode.connect(filter).connect(gain).connect(this.masterGain!);
    this.bgNoiseNode.start();
  }

  destroy() {
    this.bgNoiseNode?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
