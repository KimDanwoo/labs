import type { SoundName } from '@views/gostop/model/types/playback';

export interface SoundFilter {
  type: BiquadFilterType;
  frequency: number;
}

export interface SoundVoice {
  wave: OscillatorType | 'noise';
  frequency: number;
  endFrequency?: number;
  startAt: number;
  duration: number;
  gain: number;
  filter?: SoundFilter;
}

export const MASTER_GAIN = 0.55;
export const ATTACK_SECONDS = 0.006;
export const SILENT_GAIN = 0.0001;
export const NOISE_SECONDS = 1;
export const VOICE_TAIL_SECONDS = 0.05;

const THOCK: readonly SoundVoice[] = [
  { wave: 'noise', frequency: 0, startAt: 0, duration: 0.07, gain: 0.55, filter: { type: 'lowpass', frequency: 1400 } },
  { wave: 'sine', frequency: 190, endFrequency: 70, startAt: 0, duration: 0.11, gain: 0.7 },
];

const NOTE = {
  c5: 523.25,
  e5: 659.25,
  g5: 783.99,
  a5: 880,
  c6: 1046.5,
  g4: 392,
  e4: 329.63,
  c4: 261.63,
  a4: 440,
} as const;

export const SOUND_RECIPES: Record<SoundName, readonly SoundVoice[]> = {
  deal: [0, 0.06, 0.12, 0.18, 0.24, 0.3].map((startAt) => ({
    wave: 'noise',
    frequency: 0,
    startAt,
    duration: 0.035,
    gain: 0.22,
    filter: { type: 'highpass', frequency: 2600 },
  })),
  place: THOCK,
  flip: [
    {
      wave: 'noise',
      frequency: 0,
      startAt: 0,
      duration: 0.04,
      gain: 0.3,
      filter: { type: 'highpass', frequency: 3200 },
    },
    { wave: 'triangle', frequency: 900, endFrequency: 1500, startAt: 0, duration: 0.06, gain: 0.08 },
  ],
  match: [
    { wave: 'triangle', frequency: NOTE.e5, startAt: 0, duration: 0.09, gain: 0.16 },
    { wave: 'triangle', frequency: NOTE.a5, startAt: 0.06, duration: 0.12, gain: 0.16 },
  ],
  capture: [
    {
      wave: 'noise',
      frequency: 0,
      startAt: 0,
      duration: 0.16,
      gain: 0.18,
      filter: { type: 'bandpass', frequency: 1800 },
    },
    { wave: 'sine', frequency: 480, endFrequency: 820, startAt: 0.02, duration: 0.14, gain: 0.14 },
  ],
  steal: [
    { wave: 'square', frequency: 260, endFrequency: 640, startAt: 0, duration: 0.12, gain: 0.06 },
    { wave: 'triangle', frequency: NOTE.g5, startAt: 0.1, duration: 0.1, gain: 0.12 },
  ],
  cutIn: [
    ...THOCK,
    {
      wave: 'sawtooth',
      frequency: NOTE.c5,
      startAt: 0.02,
      duration: 0.28,
      gain: 0.07,
      filter: { type: 'lowpass', frequency: 2400 },
    },
    { wave: 'triangle', frequency: NOTE.e5, startAt: 0.02, duration: 0.3, gain: 0.14 },
    { wave: 'triangle', frequency: NOTE.g5, startAt: 0.02, duration: 0.32, gain: 0.12 },
  ],
  go: [NOTE.c5, NOTE.e5, NOTE.g5, NOTE.c6].map((frequency, index) => ({
    wave: 'triangle',
    frequency,
    startAt: index * 0.07,
    duration: 0.18,
    gain: 0.16,
  })),
  stop: [
    { wave: 'triangle', frequency: NOTE.g5, startAt: 0, duration: 0.14, gain: 0.16 },
    { wave: 'triangle', frequency: NOTE.c5, startAt: 0.12, duration: 0.3, gain: 0.18 },
  ],
  win: [NOTE.c5, NOTE.e5, NOTE.g5, NOTE.c6, NOTE.e5, NOTE.c6].map((frequency, index) => ({
    wave: 'triangle',
    frequency,
    startAt: index * 0.09,
    duration: 0.26,
    gain: 0.15,
  })),
  lose: [NOTE.g4, NOTE.e4, NOTE.c4].map((frequency, index) => ({
    wave: 'sine',
    frequency,
    endFrequency: frequency * 0.97,
    startAt: index * 0.16,
    duration: 0.3,
    gain: 0.2,
  })),
  draw: [
    { wave: 'sine', frequency: NOTE.a4, startAt: 0, duration: 0.14, gain: 0.16 },
    { wave: 'sine', frequency: NOTE.a4, startAt: 0.18, duration: 0.2, gain: 0.14 },
  ],
};
