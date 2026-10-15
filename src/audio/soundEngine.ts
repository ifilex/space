/**
 * Space Invaders: Neon Assault 90s - Procedural Web Audio Synthesizer & Dynamic Soundtrack
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.5;

  // Dynamic soundtrack state
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private step: number = 0;
  private currentBpm: number = 100;
  private tensionLevel: number = 1; // 1 to 5
  private invadersRemainingRatio: number = 1.0;

  // 4-step Classic Invader bass progression: D2, C2, Bb1, A1
  private readonly classicBassNotes = [73.42, 65.41, 58.27, 55.0]; // Hz
  // Arpeggio notes for high tension synthwave lead
  private readonly arpeggioNotes = [146.83, 174.61, 220.0, 261.63, 293.66, 349.23, 440.0, 523.25];

  constructor() {
    // Lazy initialize on first interaction to adhere to browser autoplay policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);

      // Music bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));

    if (this.ctx) {
      if (this.sfxGain) this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.sfxVolume, this.ctx.currentTime);
      if (this.musicGain) this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolumes(this.sfxVolume, this.musicVolume);
    return this.isMuted;
  }

  // --- PROCEDURAL SFX ---

  public playLaser(type: string = 'SINGLE') {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    gain.connect(this.sfxGain);
    osc.connect(gain);

    if (type === 'PLASMA_PIERCER') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'SPREAD_SHOT') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'HOMING_MISSILES') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else {
      // Classic 90s crisp laser pew
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  }

  public playAlienLaser() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.14);

    gain.connect(this.sfxGain);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playExplosion(size: 'small' | 'medium' | 'boss' = 'small') {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const duration = size === 'boss' ? 0.8 : size === 'medium' ? 0.35 : 0.18;

    // Filtered noise synthesis
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(size === 'boss' ? 600 : 900, now);
    filter.frequency.exponentialRampToValueAtTime(40, now + duration);

    const gain = this.ctx.createGain();
    const volume = size === 'boss' ? 0.7 : size === 'medium' ? 0.45 : 0.3;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + duration);

    // Sub-bass thump for punch
    if (size !== 'small') {
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(size === 'boss' ? 120 : 90, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + duration * 0.7);

      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);

      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(now);
      sub.stop(now + duration * 0.7);
    }
  }

  public playPowerUp() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [330, 440, 554, 660, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  public playShieldHit() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playEmpBlast() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  public playTimeWarp() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(200, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playAchievement() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.25);
    });
  }

  public playUfoAlert() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.08);
    osc.frequency.linearRampToValueAtTime(900, now + 0.16);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // --- DYNAMIC TENSION SOUNDTRACK ---

  public updateTension(invadersRatio: number, wave: number, isBoss: boolean = false, isTimeAttack: boolean = false) {
    this.invadersRemainingRatio = Math.max(0.05, Math.min(1.0, invadersRatio));
    
    // As invaders decrease, speed and tension increase drastically
    // Base BPM 90 -> 180 as invaders diminish
    let targetBpm = 95 + (1 - this.invadersRemainingRatio) * 85 + Math.min(20, wave * 2);
    if (isBoss) targetBpm += 25;
    if (isTimeAttack) targetBpm += 20;

    this.currentBpm = Math.min(210, Math.max(90, targetBpm));
    this.tensionLevel = isBoss ? 5 : this.invadersRemainingRatio < 0.25 ? 4 : this.invadersRemainingRatio < 0.5 ? 3 : wave > 3 ? 2 : 1;
  }

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.init();
    this.resume();
    this.isMusicPlaying = true;
    this.step = 0;
    this.scheduleNextBeat();
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private scheduleNextBeat() {
    if (!this.isMusicPlaying) return;

    this.playBeat(this.step);
    this.step = (this.step + 1) % 16;

    // Calculate delay based on dynamic BPM (16th notes or 8th notes depending on tension)
    const beatIntervalMs = (60 / this.currentBpm) * 500; // 8th notes
    this.musicInterval = window.setTimeout(() => {
      this.scheduleNextBeat();
    }, beatIntervalMs);
  }

  private playBeat(step: number) {
    if (!this.ctx || !this.musicGain || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Classic 4-note Invader descending heartbeat bass (Every 2 or 4 steps)
    if (step % 2 === 0) {
      const bassNoteIndex = Math.floor(step / 2) % 4;
      const freq = this.classicBassNotes[bassNoteIndex];

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = this.tensionLevel >= 3 ? 'sawtooth' : 'triangle';
      bassOsc.frequency.setValueAtTime(freq, now);

      const bassDuration = 0.12;
      bassGain.gain.setValueAtTime(0.35, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + bassDuration);

      bassOsc.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + bassDuration);
    }

    // 2. High tension arpeggiator when tension >= 2
    if (this.tensionLevel >= 2) {
      const arpFreq = this.arpeggioNotes[(step * 3) % this.arpeggioNotes.length];
      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();

      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(arpFreq, now);

      const arpDur = 0.08;
      arpGain.gain.setValueAtTime(0.12, now);
      arpGain.gain.exponentialRampToValueAtTime(0.001, now + arpDur);

      arpOsc.connect(arpGain);
      arpGain.connect(this.musicGain);

      arpOsc.start(now);
      arpOsc.stop(now + arpDur);
    }

    // 3. Hi-hat pulse on every offbeat
    if (step % 2 === 1 && this.tensionLevel >= 3) {
      const bufferSize = this.ctx.sampleRate * 0.03;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const hat = this.ctx.createBufferSource();
      hat.buffer = buffer;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(8000, now);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(0.1, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);

      hat.start(now);
      hat.stop(now + 0.03);
    }
  }
}

export const soundEngine = new SoundEngine();
