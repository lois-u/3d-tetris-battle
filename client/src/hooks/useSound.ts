import { useCallback, useRef, useEffect } from 'react';

type SoundType = 'move' | 'rotate' | 'drop' | 'hardDrop' | 'hold' | 'lineClear' | 'tetris' | 'tSpin' | 'combo' | 'levelUp' | 'gameOver' | 'countdown' | 'start';

// Note frequencies for 8-bit music generation
const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61,
  'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23,
  'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46,
  'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'REST': 0,
};

interface Note {
  pitch: string;
  duration: number; // in beats (1 = quarter note)
}

interface BGMTrack {
  name: string;
  tempo: number; // BPM
  melody: Note[];
  bass: Note[];
}

// Korobeiniki (Type A) - Classic Tetris Theme - Refined
const KOROBEINIKI: BGMTrack = {
  name: 'Korobeiniki',
  tempo: 144,
  melody: [
    { pitch: 'E5', duration: 1 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'D5', duration: 1 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 },
    { pitch: 'A4', duration: 1 }, { pitch: 'A4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'E5', duration: 1 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'B4', duration: 1.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'D5', duration: 1 }, { pitch: 'E5', duration: 1 },
    { pitch: 'C5', duration: 1 }, { pitch: 'A4', duration: 1 },
    { pitch: 'A4', duration: 2 },
    { pitch: 'REST', duration: 0.5 }, { pitch: 'D5', duration: 1 }, { pitch: 'F5', duration: 0.5 },
    { pitch: 'A5', duration: 1 }, { pitch: 'G5', duration: 0.5 }, { pitch: 'F5', duration: 0.5 },
    { pitch: 'E5', duration: 1.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'E5', duration: 1 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'B4', duration: 1 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'D5', duration: 1 }, { pitch: 'E5', duration: 1 },
    { pitch: 'C5', duration: 1 }, { pitch: 'A4', duration: 1 },
    { pitch: 'A4', duration: 2 },
  ],
  bass: [
    { pitch: 'E3', duration: 0.5 }, { pitch: 'E4', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E4', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'E4', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E4', duration: 0.5 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'G#3', duration: 0.5 }, { pitch: 'G#3', duration: 0.5 }, { pitch: 'G#3', duration: 0.5 }, { pitch: 'G#3', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'A3', duration: 1 }, { pitch: 'REST', duration: 1 },
    { pitch: 'D3', duration: 0.5 }, { pitch: 'D4', duration: 0.5 }, { pitch: 'D3', duration: 0.5 }, { pitch: 'D4', duration: 0.5 },
    { pitch: 'D3', duration: 0.5 }, { pitch: 'D4', duration: 0.5 }, { pitch: 'D3', duration: 0.5 }, { pitch: 'D4', duration: 0.5 },
    { pitch: 'C4', duration: 0.5 }, { pitch: 'C4', duration: 0.5 }, { pitch: 'C4', duration: 0.5 }, { pitch: 'C4', duration: 0.5 },
    { pitch: 'C4', duration: 0.5 }, { pitch: 'C4', duration: 0.5 }, { pitch: 'C4', duration: 0.5 }, { pitch: 'C4', duration: 0.5 },
    { pitch: 'G#3', duration: 0.5 }, { pitch: 'G#3', duration: 0.5 }, { pitch: 'G#3', duration: 0.5 }, { pitch: 'G#3', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'A3', duration: 1 }, { pitch: 'REST', duration: 1 },
  ],
};

// Cyberpunk Rush - Modern, energetic (Tetris 99 inspired)
const CYBERPUNK_RUSH: BGMTrack = {
  name: 'Cyberpunk Rush',
  tempo: 150,
  melody: [
    { pitch: 'E5', duration: 0.25 }, { pitch: 'E5', duration: 0.25 }, { pitch: 'REST', duration: 0.25 }, { pitch: 'E5', duration: 0.25 },
    { pitch: 'REST', duration: 0.25 }, { pitch: 'C5', duration: 0.25 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'G5', duration: 0.5 }, { pitch: 'REST', duration: 0.5 }, { pitch: 'G4', duration: 0.5 }, { pitch: 'REST', duration: 0.5 },
    { pitch: 'C5', duration: 0.5 }, { pitch: 'REST', duration: 0.25 }, { pitch: 'G4', duration: 0.5 }, { pitch: 'REST', duration: 0.25 },
    { pitch: 'E4', duration: 0.5 }, { pitch: 'REST', duration: 0.5 },
    { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'A#4', duration: 0.25 }, { pitch: 'A4', duration: 0.75 },
    { pitch: 'G4', duration: 0.5 }, { pitch: 'E5', duration: 0.5 }, { pitch: 'G5', duration: 0.5 }, { pitch: 'A5', duration: 0.5 },
    { pitch: 'F5', duration: 0.5 }, { pitch: 'G5', duration: 0.25 }, { pitch: 'REST', duration: 0.25 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'B4', duration: 1 },
    { pitch: 'C5', duration: 0.5 }, { pitch: 'REST', duration: 0.25 }, { pitch: 'G4', duration: 0.5 }, { pitch: 'REST', duration: 0.25 },
    { pitch: 'E4', duration: 0.5 }, { pitch: 'REST', duration: 0.5 },
    { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'A#4', duration: 0.25 }, { pitch: 'A4', duration: 0.75 },
    { pitch: 'G4', duration: 0.5 }, { pitch: 'E5', duration: 0.5 }, { pitch: 'G5', duration: 0.5 }, { pitch: 'A5', duration: 0.5 },
    { pitch: 'F5', duration: 0.5 }, { pitch: 'G5', duration: 0.25 }, { pitch: 'REST', duration: 0.25 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'B4', duration: 1 },
  ],
  bass: [
    { pitch: 'C3', duration: 0.25 }, { pitch: 'C3', duration: 0.25 }, { pitch: 'C4', duration: 0.25 }, { pitch: 'C3', duration: 0.25 },
    { pitch: 'C3', duration: 0.25 }, { pitch: 'C4', duration: 0.25 }, { pitch: 'C3', duration: 0.5 },
    { pitch: 'G3', duration: 0.5 }, { pitch: 'G3', duration: 0.25 }, { pitch: 'G4', duration: 0.25 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'C4', duration: 0.25 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.25 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'F3', duration: 0.5 }, { pitch: 'F3', duration: 0.5 }, { pitch: 'F3', duration: 0.25 }, { pitch: 'F3', duration: 0.75 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 },
    { pitch: 'D3', duration: 0.5 }, { pitch: 'D3', duration: 0.25 }, { pitch: 'D4', duration: 0.25 }, { pitch: 'D3', duration: 0.5 },
    { pitch: 'G3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'G3', duration: 1 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'C4', duration: 0.25 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.25 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'F3', duration: 0.5 }, { pitch: 'F3', duration: 0.5 }, { pitch: 'F3', duration: 0.25 }, { pitch: 'F3', duration: 0.75 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 },
    { pitch: 'D3', duration: 0.5 }, { pitch: 'D3', duration: 0.25 }, { pitch: 'D4', duration: 0.25 }, { pitch: 'D3', duration: 0.5 },
    { pitch: 'G3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'G3', duration: 1 },
  ],
};

// Neon Cascade - Ambient, flowing (Tetris Effect inspired)
const NEON_CASCADE: BGMTrack = {
  name: 'Neon Cascade',
  tempo: 110,
  melody: [
    { pitch: 'E4', duration: 1 }, { pitch: 'G4', duration: 1 }, { pitch: 'A4', duration: 1 }, { pitch: 'B4', duration: 1 },
    { pitch: 'E5', duration: 2 }, { pitch: 'D5', duration: 1 }, { pitch: 'B4', duration: 1 },
    { pitch: 'A4', duration: 1.5 }, { pitch: 'G4', duration: 0.5 }, { pitch: 'E4', duration: 1 }, { pitch: 'G4', duration: 1 },
    { pitch: 'A4', duration: 2 }, { pitch: 'REST', duration: 2 },
    { pitch: 'B4', duration: 1 }, { pitch: 'C5', duration: 1 }, { pitch: 'D5', duration: 1 }, { pitch: 'E5', duration: 1 },
    { pitch: 'G5', duration: 2 }, { pitch: 'E5', duration: 1 }, { pitch: 'D5', duration: 1 },
    { pitch: 'C5', duration: 1.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'A4', duration: 1 }, { pitch: 'G4', duration: 1 },
    { pitch: 'E4', duration: 2 }, { pitch: 'REST', duration: 2 },
  ],
  bass: [
    { pitch: 'E3', duration: 2 }, { pitch: 'E3', duration: 2 },
    { pitch: 'C3', duration: 2 }, { pitch: 'G3', duration: 2 },
    { pitch: 'A3', duration: 2 }, { pitch: 'E3', duration: 2 },
    { pitch: 'A3', duration: 2 }, { pitch: 'A3', duration: 2 },
    { pitch: 'G3', duration: 2 }, { pitch: 'G3', duration: 2 },
    { pitch: 'C3', duration: 2 }, { pitch: 'G3', duration: 2 },
    { pitch: 'A3', duration: 2 }, { pitch: 'D3', duration: 2 },
    { pitch: 'E3', duration: 2 }, { pitch: 'E3', duration: 2 },
  ],
};

// Pixel Storm - Fast, aggressive
const PIXEL_STORM: BGMTrack = {
  name: 'Pixel Storm',
  tempo: 170,
  melody: [
    { pitch: 'A4', duration: 0.25 }, { pitch: 'A4', duration: 0.25 }, { pitch: 'A4', duration: 0.25 }, { pitch: 'A4', duration: 0.25 },
    { pitch: 'G4', duration: 0.25 }, { pitch: 'G4', duration: 0.25 }, { pitch: 'A4', duration: 0.5 },
    { pitch: 'A4', duration: 0.25 }, { pitch: 'A4', duration: 0.25 }, { pitch: 'A4', duration: 0.25 }, { pitch: 'A4', duration: 0.25 },
    { pitch: 'B4', duration: 0.25 }, { pitch: 'C5', duration: 0.25 }, { pitch: 'B4', duration: 0.5 },
    { pitch: 'A4', duration: 0.5 }, { pitch: 'G4', duration: 0.5 }, { pitch: 'E4', duration: 0.5 }, { pitch: 'G4', duration: 0.5 },
    { pitch: 'A4', duration: 1 }, { pitch: 'REST', duration: 0.5 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'D5', duration: 0.25 }, { pitch: 'D5', duration: 0.25 }, { pitch: 'D5', duration: 0.25 }, { pitch: 'D5', duration: 0.25 },
    { pitch: 'C5', duration: 0.25 }, { pitch: 'C5', duration: 0.25 }, { pitch: 'D5', duration: 0.5 },
    { pitch: 'E5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 },
    { pitch: 'A4', duration: 1 }, { pitch: 'REST', duration: 1 },
  ],
  bass: [
    { pitch: 'A3', duration: 0.25 }, { pitch: 'A3', duration: 0.25 }, { pitch: 'A3', duration: 0.25 }, { pitch: 'E3', duration: 0.25 },
    { pitch: 'A3', duration: 0.25 }, { pitch: 'E3', duration: 0.25 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'A3', duration: 0.25 }, { pitch: 'A3', duration: 0.25 }, { pitch: 'A3', duration: 0.25 }, { pitch: 'E3', duration: 0.25 },
    { pitch: 'G3', duration: 0.25 }, { pitch: 'G3', duration: 0.25 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'F3', duration: 0.5 }, { pitch: 'F3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'A3', duration: 1 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'D3', duration: 0.25 }, { pitch: 'D3', duration: 0.25 }, { pitch: 'D3', duration: 0.25 }, { pitch: 'A3', duration: 0.25 },
    { pitch: 'D3', duration: 0.25 }, { pitch: 'A3', duration: 0.25 }, { pitch: 'D3', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'A3', duration: 1 }, { pitch: 'A3', duration: 1 },
  ],
};

// Digital Dreams - Melodic, uplifting
const DIGITAL_DREAMS: BGMTrack = {
  name: 'Digital Dreams',
  tempo: 130,
  melody: [
    { pitch: 'G4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'D5', duration: 0.5 },
    { pitch: 'E5', duration: 1 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 },
    { pitch: 'G4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'D5', duration: 0.5 },
    { pitch: 'C5', duration: 1 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 },
    { pitch: 'G4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'D5', duration: 0.5 },
    { pitch: 'E5', duration: 1 }, { pitch: 'G5', duration: 0.5 }, { pitch: 'F#5', duration: 0.5 },
    { pitch: 'E5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 },
    { pitch: 'G4', duration: 2 },
    { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'F#5', duration: 1 }, { pitch: 'E5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 },
    { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'D5', duration: 1 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 },
    { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 },
    { pitch: 'E5', duration: 1 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'B4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 }, { pitch: 'G4', duration: 0.5 }, { pitch: 'F#4', duration: 0.5 },
    { pitch: 'G4', duration: 2 },
  ],
  bass: [
    { pitch: 'G3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'G3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'C3', duration: 1 }, { pitch: 'G3', duration: 1 },
    { pitch: 'C3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'G3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'E3', duration: 1 }, { pitch: 'B3', duration: 1 },
    { pitch: 'C3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'G3', duration: 2 },
    { pitch: 'B3', duration: 1 }, { pitch: 'F#3', duration: 1 },
    { pitch: 'B3', duration: 1 }, { pitch: 'F#3', duration: 1 },
    { pitch: 'G3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'G3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'A3', duration: 1 }, { pitch: 'E3', duration: 1 },
    { pitch: 'C3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'G3', duration: 1 }, { pitch: 'D3', duration: 1 },
    { pitch: 'G3', duration: 2 },
  ],
};

// Retro Wave - Synthwave inspired
const RETRO_WAVE: BGMTrack = {
  name: 'Retro Wave',
  tempo: 118,
  melody: [
    { pitch: 'A4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'E5', duration: 1 },
    { pitch: 'E5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'C5', duration: 1 },
    { pitch: 'A4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'E5', duration: 1 },
    { pitch: 'G5', duration: 0.5 }, { pitch: 'F5', duration: 0.5 }, { pitch: 'E5', duration: 1 },
    { pitch: 'D5', duration: 0.5 }, { pitch: 'E5', duration: 0.5 }, { pitch: 'F5', duration: 0.5 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'D5', duration: 1 }, { pitch: 'C5', duration: 1 },
    { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'E5', duration: 0.5 },
    { pitch: 'A4', duration: 2 },
    { pitch: 'A4', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 1 },
    { pitch: 'C5', duration: 0.5 }, { pitch: 'D5', duration: 0.5 }, { pitch: 'E5', duration: 1 },
    { pitch: 'E5', duration: 0.5 }, { pitch: 'F5', duration: 0.5 }, { pitch: 'G5', duration: 1 },
    { pitch: 'G5', duration: 0.5 }, { pitch: 'F5', duration: 0.5 }, { pitch: 'E5', duration: 1 },
    { pitch: 'D5', duration: 0.5 }, { pitch: 'C5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'C5', duration: 0.5 },
    { pitch: 'D5', duration: 1 }, { pitch: 'E5', duration: 1 },
    { pitch: 'C5', duration: 0.5 }, { pitch: 'B4', duration: 0.5 }, { pitch: 'A4', duration: 0.5 }, { pitch: 'G4', duration: 0.5 },
    { pitch: 'A4', duration: 2 },
  ],
  bass: [
    { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'D3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'D3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 },
    { pitch: 'G3', duration: 0.5 }, { pitch: 'D3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 },
    { pitch: 'A3', duration: 1 }, { pitch: 'A3', duration: 1 },
    { pitch: 'A3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 },
    { pitch: 'D3', duration: 0.5 }, { pitch: 'A3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 }, { pitch: 'D3', duration: 0.5 },
    { pitch: 'G3', duration: 0.5 }, { pitch: 'D3', duration: 0.5 }, { pitch: 'C3', duration: 0.5 }, { pitch: 'G3', duration: 0.5 },
    { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 }, { pitch: 'E3', duration: 0.5 }, { pitch: 'B3', duration: 0.5 },
    { pitch: 'A3', duration: 1 }, { pitch: 'A3', duration: 1 },
  ],
};

const BGM_TRACKS: BGMTrack[] = [KOROBEINIKI, CYBERPUNK_RUSH, NEON_CASCADE, PIXEL_STORM, DIGITAL_DREAMS, RETRO_WAVE];

class BGMEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentTrack: BGMTrack | null = null;
  private scheduledNotes: number[] = [];
  private loopTimeout: ReturnType<typeof setTimeout> | null = null;
  private volume: number = 0.15;
  private enabled: boolean = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  private playNote(frequency: number, startTime: number, duration: number, type: OscillatorType = 'square') {
    if (frequency === 0) return;

    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    // 8-bit style envelope
    const attackTime = 0.01;
    const releaseTime = 0.05;
    const sustainLevel = 0.7;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime);
    gain.gain.setValueAtTime(sustainLevel, startTime + duration - releaseTime);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private scheduleTrack(track: BGMTrack, startTime: number): number {
    const ctx = this.getContext();
    const beatDuration = 60 / track.tempo;
    let melodyTime = startTime;
    let bassTime = startTime;

    for (const note of track.melody) {
      const freq = NOTE_FREQUENCIES[note.pitch] || 0;
      const duration = note.duration * beatDuration;
      this.playNote(freq, melodyTime, duration * 0.9, 'square');
      melodyTime += duration;
    }

    for (const note of track.bass) {
      const freq = NOTE_FREQUENCIES[note.pitch] || 0;
      const duration = note.duration * beatDuration;
      this.playNote(freq, bassTime, duration * 0.9, 'triangle');
      bassTime += duration;
    }

    return Math.max(melodyTime, bassTime) - startTime;
  }

  playRandom() {
    if (!this.enabled) return;
    const randomIndex = Math.floor(Math.random() * BGM_TRACKS.length);
    this.play(BGM_TRACKS[randomIndex]);
  }

  play(track?: BGMTrack) {
    if (!this.enabled) return;
    
    this.stop();
    
    const selectedTrack = track || BGM_TRACKS[Math.floor(Math.random() * BGM_TRACKS.length)];
    this.currentTrack = selectedTrack;
    this.isPlaying = true;

    const ctx = this.getContext();
    const startTime = ctx.currentTime + 0.1;
    
    const loop = () => {
      if (!this.isPlaying || !this.currentTrack) return;
      
      const ctx = this.getContext();
      const duration = this.scheduleTrack(this.currentTrack, ctx.currentTime + 0.1);
      
      this.loopTimeout = setTimeout(loop, duration * 1000 - 100);
    };

    loop();
  }

  stop() {
    this.isPlaying = false;
    this.currentTrack = null;
    
    if (this.loopTimeout) {
      clearTimeout(this.loopTimeout);
      this.loopTimeout = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentTrackName(): string | null {
    return this.currentTrack?.name || null;
  }
}

const bgmEngine = new BGMEngine();

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

  const playBGM = useCallback(() => {
    bgmEngine.playRandom();
  }, []);

  const stopBGM = useCallback(() => {
    bgmEngine.stop();
  }, []);

  const setBGMEnabled = useCallback((enabled: boolean) => {
    bgmEngine.setEnabled(enabled);
    if (!enabled) {
      bgmEngine.stop();
    }
  }, []);

  const setBGMVolume = useCallback((volume: number) => {
    bgmEngine.setVolume(volume);
  }, []);

  const isBGMPlaying = useCallback(() => {
    return bgmEngine.isCurrentlyPlaying();
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
    playBGM,
    stopBGM,
    setBGMEnabled,
    setBGMVolume,
    isBGMPlaying,
  };
}
