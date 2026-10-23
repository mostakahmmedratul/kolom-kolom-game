export class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  public volume = 0.8;
  public muted = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playFlick(powerFraction: number): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 400 + Math.min(powerFraction, 1) * 260;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      const amp = this.volume * 0.45;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio autoplay policy catch
    }
  }

  playImpact(relativeSpeed: number, hitZone: 'TIP' | 'CENTER' | 'CAP' = 'CENTER'): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const norm = Math.min(1, Math.max(0.2, relativeSpeed / 500));
      
      // Localized frequencies
      let startFreq = 860;
      let endFreq = 240;
      let oscType: OscillatorType = 'sine';

      if (hitZone === 'TIP') {
        // High-pitched metallic ballpoint nib ping
        startFreq = 1250;
        endFreq = 480;
        oscType = 'triangle';
      } else if (hitZone === 'CENTER') {
        // Deep solid resin body thud
        startFreq = 620;
        endFreq = 160;
        oscType = 'sine';
      } else if (hitZone === 'CAP') {
        // Whipping snappy cap & clip twang
        startFreq = 950;
        endFreq = 280;
        oscType = 'sawtooth';
      }

      osc.type = oscType;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.065);

      const amp = this.volume * norm * 0.65;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      // Add high-pass click noise
      const bufferSize = ctx.sampleRate * 0.04;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(amp * 0.5, now);

      osc.connect(gain);
      gain.connect(ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
      noise.start(now);
    } catch {
      // Audio autoplay policy catch
    }
  }

  playFall(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.28);

      const amp = this.volume * 0.55;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio autoplay policy catch
    }
  }

  playPoint(humanScored: boolean): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const f1 = humanScored ? 523.25 : 392.0; // C5 or G4
      const f2 = humanScored ? 659.25 : 329.6; // E5 or E4

      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const amp = this.volume * 0.4;
        gain.gain.setValueAtTime(amp, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };

      playTone(f1, now, 0.15);
      playTone(f2, now + 0.12, 0.22);
    } catch {
      // Audio autoplay policy catch
    }
  }

  playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.14;
        const dur = idx === notes.length - 1 ? 0.45 : 0.16;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        const amp = this.volume * 0.45;
        gain.gain.setValueAtTime(amp, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {
      // Audio autoplay policy catch
    }
  }
}

export const sounds = new SoundSynthesizer();
