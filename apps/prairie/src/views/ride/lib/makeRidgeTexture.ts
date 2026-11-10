import { DataTexture, LinearFilter, RGBAFormat } from 'three';

type Ridge = { cells: number; seed: number; ampY: number };
const TEXTURE_WIDTH = 1024;
const SLOPE_STEP = 0.004;

function hash(n: number) {
  const value = Math.sin(n * 127.1) * 43758.5453;
  return value - Math.floor(value);
}
function periodicNoise(u: number, cells: number) {
  const x = u * cells;
  const i = Math.floor(x);
  const f = x - i;
  const t = f * f * (3 - 2 * f);
  const wrap = (value: number) => ((value % cells) + cells) % cells;
  return hash(wrap(i)) * (1 - t) + hash(wrap(i + 1)) * t;
}
function ridgeHeight(u: number, cells: number) {
  let sum = 0,
    amplitude = 1,
    norm = 0;
  for (let octave = 0; octave < 4; octave++) {
    sum += (1 - Math.abs(2 * periodicNoise(u, cells) - 1)) * amplitude;
    norm += amplitude;
    amplitude *= 0.46;
    cells *= 2;
  }
  return (sum / norm) ** 1.5;
}

/** One row per ridge: height + precomputed slope lighting. Only 12 KiB for the full horizon. */
export function makeRidgeTexture(ridges: readonly Ridge[]) {
  const pixels = new Uint8Array(TEXTURE_WIDTH * ridges.length * 4);
  for (const [row, ridge] of ridges.entries()) {
    for (let x = 0; x < TEXTURE_WIDTH; x++) {
      const u = x / (TEXTURE_WIDTH - 1) + ridge.seed;
      const slope =
        ((ridgeHeight(u + SLOPE_STEP, ridge.cells) - ridgeHeight(u - SLOPE_STEP, ridge.cells)) * ridge.ampY) / 12;
      const light = Math.min(1, Math.max(-1, slope)) * 0.5 + 0.5;
      pixels.set(
        [Math.round(ridgeHeight(u, ridge.cells) * 255), Math.round(light * 255), 0, 255],
        (row * TEXTURE_WIDTH + x) * 4,
      );
    }
  }
  const texture = new DataTexture(pixels, TEXTURE_WIDTH, ridges.length, RGBAFormat);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}
