export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgNoiseNode: AudioBufferSourceNode | null = null;
  private muted = false;
  private feverGainNode: GainNode | null = null;
  private feverOscNode: OscillatorNode | null = null;
  private normalGainValue = 0.3;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.normalGainValue;
    this.masterGain.connect(this.ctx.destination);
    this.startBgNoise();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.masterGain) {
      this.masterGain.gain.value = m ? 0 : this.normalGainValue;
    }
  }

  play(name: string, data?: Record<string, number>) {
    if (!this.ctx || !this.masterGain || this.muted) return;

    switch (name) {
      case 'move':           this.playTick(); break;
      case 'dash':           this.playSweep(200, 800, 0.2); break;
      case 'hit':            this.playHit(); break;
      case 'gameOver':       this.playGameOver(); break;
      case 'closeCall':      this.playSweep(600, 900, 0.1); break;
      case 'sharkWarning':   this.playWarning(); break;
      case 'lightning':
      case 'lightning_strike': this.playLightning(); break;
      case 'carrotFire':     this.playCarrotFire(); break;
      case 'enemyKill':      this.playEnemyKill(); break;
      case 'comboMilestone': this.playComboMilestone(); break;
      case 'feverStart':     this.playFeverStart(); break;
      case 'feverEnd':       this.playFeverEnd(); break;
      case 'zoneChange':     this.playZoneChange(); break;
      case 'powerUp':        this.playPowerUp(); break;
      case 'carrotPickup':   this.playCarrotPickup(); break;
    }
  }

  startFeverAudio() {
    if (!this.ctx || !this.masterGain || this.muted) return;
    // Increase master volume slightly during fever
    this.masterGain.gain.setTargetAtTime(this.normalGainValue * 1.3, this.ctx.currentTime, 0.2);

    // Subtle rhythmic low-freq pulse on a gain node
    this.feverGainNode = this.ctx.createGain();
    this.feverGainNode.gain.value = 0;
    this.feverGainNode.connect(this.masterGain);

    this.feverOscNode = this.ctx.createOscillator();
    this.feverOscNode.type = 'sine';
    this.feverOscNode.frequency.value = 40; // deep rumble
    this.feverOscNode.connect(this.feverGainNode);
    this.feverOscNode.start();

    // Pulse the gain rhythmically (4Hz = 240bpm pulse)
    const pulseOsc = this.ctx.createOscillator();
    pulseOsc.type = 'sine';
    pulseOsc.frequency.value = 4;
    const pulseGain = this.ctx.createGain();
    pulseGain.gain.value = 0.04;
    pulseOsc.connect(pulseGain);
    pulseGain.connect(this.feverGainNode.gain as unknown as AudioNode);
    pulseOsc.start();
    // Stop pulse after fever max duration (6s)
    pulseOsc.stop(this.ctx.currentTime + 6);
  }

  stopFeverAudio() {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(this.normalGainValue, this.ctx.currentTime, 0.3);
    if (this.feverOscNode) {
      try { this.feverOscNode.stop(); } catch (_) { /* already stopped */ }
      this.feverOscNode = null;
    }
    this.feverGainNode = null;
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

  private playSweep(from: number, to: number, dur: number, gainVal = 0.12) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
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

  // === New sounds ===

  private playCarrotFire() {
    // Short pluck - quick sine 600→800Hz, 0.05s, quiet
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  private playEnemyKill() {
    // Satisfying pop - sine 400→800Hz + noise burst, 0.15s
    const ctx = this.ctx!;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(oscGain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);

    // Noise burst
    const bufferSize = Math.ceil(ctx.sampleRate * 0.08);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    noise.connect(noiseGain).connect(this.masterGain!);
    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + 0.08);
  }

  private playComboMilestone() {
    // Rising arpeggio - 3 notes ascending C5, E5, G5 (523, 659, 784Hz), 0.3s total
    const ctx = this.ctx!;
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  private playFeverStart() {
    // Epic power-up - sweep 200→1200Hz with harmonics, 0.5s, louder
    const ctx = this.ctx!;
    this.playSweep(200, 1200, 0.5, 0.2);

    // Harmonic at double frequency
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(400, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.5);
    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc2.connect(gain2).connect(this.masterGain!);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.5);
  }

  private playFeverEnd() {
    // Descending sweep 800→200Hz, 0.3s
    this.playSweep(800, 200, 0.3, 0.14);
  }

  private playZoneChange() {
    // Deep bell/gong - low sine 150Hz + overtone 300Hz, 0.6s, reverb-like decay
    const ctx = this.ctx!;

    const createBell = (freq: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain).connect(this.masterGain!);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    };

    createBell(150, 0.2);
    createBell(300, 0.1);
    createBell(450, 0.05);
  }

  private playPowerUp() {
    // Magical chime - high sweep 800→1500→800Hz, 0.2s
    const ctx = this.ctx!;

    // Up sweep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.12, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc1.connect(gain1).connect(this.masterGain!);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.1);

    // Down sweep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1500, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc2.connect(gain2).connect(this.masterGain!);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.2);
  }

  private playCarrotPickup() {
    // Quick chirp - 500→700Hz, 0.06s
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain).connect(this.masterGain!);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
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
    if (this.feverOscNode) {
      try { this.feverOscNode.stop(); } catch (_) { /* already stopped */ }
    }
    this.ctx?.close();
    this.ctx = null;
  }
}
