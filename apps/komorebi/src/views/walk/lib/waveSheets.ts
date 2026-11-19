import * as THREE from 'three';

export const SHEETS = {
  break: {
    url: '/art/wave-break.webp',
    frames: 11,
    fps: 8,
    width: 20,
    heightRatio: 0.5,
    opacity: 0.28,
    contact: 0.7,
    isLoop: false,
  },
  crest: {
    url: '/art/wave-crest.webp',
    frames: 11,
    fps: 3,
    width: 30,
    heightRatio: 0.3,
    opacity: 0.24,
    contact: 0.5,
    isLoop: false,
  },
  lace: {
    url: '/art/wave-lace.webp',
    frames: 12,
    fps: 0,
    width: 16,
    heightRatio: 0.32,
    opacity: 0.35,
    contact: 0.625,
    isLoop: true,
  },
} as const;
export const CREST_TRAVEL = 0.2;
type Kind = keyof typeof SHEETS;
export const COLUMNS = 4;
export const ROWS = 3;
export const STILL_FRAME = 6;
export const STILL_FADE = 0.4;
type Wave = {
  kind: Kind;
  x: number;
  z: number;
  scale: number;
  isFlipped: boolean;
  degrees: number;
  phase: number;
  period: number;
};
const wave = (
  kind: Kind,
  [x, z]: [number, number],
  scale: number,
  isFlipped: boolean,
  degrees: number,
  [phase, period]: [number, number],
): Wave => ({ kind, x, z, scale, isFlipped, degrees, phase, period });
export const WAVES: Wave[] = [
  wave('lace', [69.0, 52.8], 0.8, false, 178, [0.15, 6.4]),
  wave('lace', [80.0, 53.2], 0.75, true, 178, [0.65, 7.0]),
  wave('lace', [88.1, 50.6], 0.7, false, 209, [0.4, 6.8]),
  wave('lace', [96.0, 44.7], 0.75, true, 198, [0.9, 7.4]),
];
export function showFrame(map: THREE.Texture, frame: number, isFlipped: boolean) {
  const column = frame % COLUMNS;
  const row = Math.floor(frame / COLUMNS);
  map.repeat.set((isFlipped ? -1 : 1) / COLUMNS, 1 / ROWS);
  map.offset.set((column + (isFlipped ? 1 : 0)) / COLUMNS, (ROWS - 1 - row) / ROWS);
}

export function waveFrame({ kind, period }: Pick<Wave, 'kind' | 'period'>, clock: number) {
  const { frames, fps, isLoop } = SHEETS[kind];
  if (isLoop) return Math.floor((clock / period) * frames) % frames;
  const frame = Math.floor(clock * fps);
  return frame < frames ? frame : null;
}
export function progressOf({ kind, period }: Pick<Wave, 'kind' | 'period'>, clock: number) {
  const { frames, fps, isLoop } = SHEETS[kind];
  if (isLoop) return clock / period;
  return THREE.MathUtils.clamp(clock / (frames / fps), 0, 1);
}
export function envelopeOf(kind: Kind, progress: number) {
  if (SHEETS[kind].isLoop) return 0.65 + 0.35 * Math.sin(Math.PI * progress) ** 2;
  return THREE.MathUtils.smoothstep(progress, 0, 0.2) * (1 - THREE.MathUtils.smoothstep(progress, 0.6, 1));
}
