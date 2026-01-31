import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'move' | 'rotate' | 'drop' | 'hardDrop' | 'hold' | 'lineClear' | 'tetris' | 'tSpin' | 'combo' | 'levelUp' | 'gameOver' | 'countdown' | 'start';

class SoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square', attack = 0.01, decay = 0.1) {
    if (!this.enabled) return;

    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  private playNoise(duration: number, filterFreq: number = 1000) {
    if (!this.enabled) return;

    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  play(sound: SoundType) {
    switch (sound) {
      case 'move':
        this.playTone(200, 0.05, 'square');
        break;

      case 'rotate':
        this.playTone(400, 0.08, 'sine');
        this.playTone(500, 0.06, 'sine');
        break;

      case 'drop':
        this.playTone(150, 0.1, 'triangle');
        break;

      case 'hardDrop':
        this.playNoise(0.15, 500);
        this.playTone(100, 0.2, 'square');
        break;

      case 'hold':
        this.playTone(300, 0.05, 'sine');
        this.playTone(450, 0.05, 'sine');
        break;

      case 'lineClear':
        this.playTone(523, 0.1, 'square');
        setTimeout(() => this.playTone(659, 0.1, 'square'), 50);
        setTimeout(() => this.playTone(784, 0.15, 'square'), 100);
        break;

      case 'tetris':
        this.playTone(523, 0.1, 'square');
        setTimeout(() => this.playTone(659, 0.1, 'square'), 80);
        setTimeout(() => this.playTone(784, 0.1, 'square'), 160);
        setTimeout(() => this.playTone(1047, 0.3, 'square'), 240);
        break;

      case 'tSpin':
        this.playTone(400, 0.1, 'sawtooth');
        setTimeout(() => this.playTone(600, 0.1, 'sawtooth'), 100);
        setTimeout(() => this.playTone(800, 0.2, 'sawtooth'), 200);
        break;

      case 'combo':
        this.playTone(600, 0.08, 'triangle');
        this.playTone(900, 0.12, 'triangle');
        break;

      case 'levelUp':
        for (let i = 0; i < 5; i++) {
          setTimeout(() => this.playTone(400 + i * 100, 0.1, 'sine'), i * 80);
        }
        break;

      case 'gameOver':
        this.playTone(400, 0.3, 'sawtooth');
        setTimeout(() => this.playTone(300, 0.3, 'sawtooth'), 200);
        setTimeout(() => this.playTone(200, 0.5, 'sawtooth'), 400);
        break;

      case 'countdown':
        this.playTone(440, 0.2, 'sine');
        break;

      case 'start':
        this.playTone(440, 0.1, 'sine');
        setTimeout(() => this.playTone(554, 0.1, 'sine'), 100);
        setTimeout(() => this.playTone(659, 0.1, 'sine'), 200);
        setTimeout(() => this.playTone(880, 0.3, 'sine'), 300);
        break;
    }
  }
}

const soundEngine = new SoundEngine();

export function useSound() {
  const lastLevel = useRef(1);
  const lastLines = useRef(0);
  const lastCombo = useRef(-1);

  const playSound = useCallback((sound: SoundType) => {
    soundEngine.play(sound);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    soundEngine.setEnabled(enabled);
  }, []);

  const setVolume = useCallback((volume: number) => {
    soundEngine.setVolume(volume);
  }, []);

  const checkGameStateChanges = useCallback((
    level: number,
    linesCleared: number,
    combo: number,
    backToBack: boolean
  ) => {
    if (level > lastLevel.current) {
      playSound('levelUp');
      lastLevel.current = level;
    }

    if (linesCleared > lastLines.current) {
      const cleared = linesCleared - lastLines.current;
      if (cleared === 4) {
        playSound('tetris');
      } else if (cleared > 0) {
        playSound('lineClear');
      }
      lastLines.current = linesCleared;
    }

    if (combo > lastCombo.current && combo > 0) {
      playSound('combo');
    }
    lastCombo.current = combo;
  }, [playSound]);

  const resetTracking = useCallback(() => {
    lastLevel.current = 1;
    lastLines.current = 0;
    lastCombo.current = -1;
  }, []);

  return {
    playSound,
    setEnabled,
    setVolume,
    checkGameStateChanges,
    resetTracking,
  };
}
