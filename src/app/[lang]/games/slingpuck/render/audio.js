const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Procedural sound effects. The AudioContext is created lazily on `unlock()`
 * (a user gesture) and every method is a no-op until then or after dispose.
 */
export class SlingPuckAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.noise = null;
    this.muted = false;
    this.disposed = false;
  }

  unlock() {
    if (this.disposed) return;
    if (!this.context) {
      const AudioCtor = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
      if (!AudioCtor) return;
      this.context = new AudioCtor();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(this.context.destination);
      this.noise = this.createNoiseBuffer();
    }
    if (this.context.state === 'suspended') {
      this.context.resume().catch(() => {});
    }
  }

  createNoiseBuffer() {
    const length = Math.floor(this.context.sampleRate * 0.4);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  ready() {
    return Boolean(this.context && this.master) && !this.disposed;
  }

  burst({ duration, gain, frequency, type = 'sine', sweep = 0, noiseMix = 0 }) {
    if (!this.ready()) return;
    const now = this.context.currentTime;
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    envelope.connect(this.master);

    const osc = this.context.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (sweep) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + sweep), now + duration);
    }
    osc.connect(envelope);
    osc.start(now);
    osc.stop(now + duration + 0.02);

    if (noiseMix > 0 && this.noise) {
      const source = this.context.createBufferSource();
      source.buffer = this.noise;
      const filter = this.context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = frequency * 2;
      filter.Q.value = 0.8;
      const noiseGain = this.context.createGain();
      noiseGain.gain.value = noiseMix;
      source.connect(filter).connect(noiseGain).connect(envelope);
      source.start(now);
      source.stop(now + duration);
    }
  }

  launch(power = 0.6) {
    const p = clamp(power, 0, 1);
    this.burst({ duration: 0.16 + p * 0.12, gain: 0.08 + p * 0.14, frequency: 160 + p * 90, type: 'triangle', sweep: 340 + p * 380, noiseMix: 0.35 });
  }

  impact(strength = 0.5, kind = 'puck-puck') {
    const s = clamp(strength, 0.05, 1);
    const clack = kind === 'puck-wall' ? 1.4 : 1;
    this.burst({ duration: 0.05 + s * 0.09, gain: 0.05 + s * 0.25, frequency: (520 + s * 980) * clack, type: 'square', sweep: -260 * s, noiseMix: 0.7 });
    if (s > 0.35) {
      this.burst({ duration: 0.12, gain: 0.02 + s * 0.06, frequency: 180, type: 'sine', sweep: -60 });
    }
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, index) => {
      if (!this.ready()) return;
      const now = this.context.currentTime + index * 0.13;
      const envelope = this.context.createGain();
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      envelope.connect(this.master);
      const osc = this.context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = frequency;
      osc.connect(envelope);
      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.context.currentTime, 0.02);
    }
  }

  dispose() {
    this.disposed = true;
    if (this.context && this.context.state !== 'closed') {
      this.context.close().catch(() => {});
    }
    this.context = null;
    this.master = null;
    this.noise = null;
  }
}
