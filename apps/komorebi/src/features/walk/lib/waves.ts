import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { lampGlowAt, lightSprite } from './nightLights';
import { characterScale } from './perspective';

/**
 * Painted wave animations, 12 cells each (4 × 3, row by row), all drawn by Codex:
 * - break: a wave rolls in, breaks against rock or wall, spreads into foam and fades;
 * - crest: an offshore swell rises, catches a little white and settles;
 * - lace: a thin wash runs up a sheltered shore and drains back, looping.
 * `contact` is where the wave meets its shore, from the bottom of its cell, so rotation pivots there.
 */
const SHEETS = {
  break: {
    url: '/art/wave-break.webp',
    frames: 11,
    fps: 8,
    width: 16,
    heightRatio: 0.5,
    opacity: 0.8,
    contact: 0.7,
    isLoop: false,
  },
  crest: {
    url: '/art/wave-crest.webp',
    frames: 11,
    fps: 3,
    width: 28,
    heightRatio: 0.24,
    opacity: 0.38,
    contact: 0.5,
    isLoop: false,
  },
  lace: {
    url: '/art/wave-lace.webp',
    frames: 12,
    fps: 0,
    width: 12,
    heightRatio: 0.28,
    opacity: 0.14,
    contact: 0.625,
    isLoop: true,
  },
} as const;
/** How far a swell rolls toward the shore over one showing, as a share of its width. */
const CREST_TRAVEL = 0.12;
type Kind = keyof typeof SHEETS;
const COLUMNS = 4;
const ROWS = 3;
/** Wave widths are given, in scene units, for where the child stands at depth 40; nearer ones are larger. */
const REFERENCE_DEPTH = 40;
/** With reduced motion each wave holds one gentle frame, faintly. */
const STILL_FRAME = 6;
const STILL_FADE = 0.4;
const RAIN_HURRY = 0.25;
const WAVE_ORDER = 1;
const SEA: Region = 'coast';

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

/** Where the sea moves, in painting percent, each wave on its own rhythm. Placed by Codex. */
const WAVES: Wave[] = [
  wave('break', [64.0, 32.2], 0.85, false, 5, [0.18, 5.5]),
  wave('break', [71.6, 20.5], 0.85, false, -7, [0.12, 7.8]),
  wave('break', [78.6, 20.7], 1.05, true, 3, [0.52, 8.4]),
  wave('break', [86.5, 20.5], 0.95, false, -2, [0.81, 7.5]),
  wave('break', [93.0, 20.9], 0.7, true, -3, [0.3, 8.8]),
  // Swells share one period, staggered so no more than two roll in at once.
  wave('crest', [58.0, 17.2], 0.8, false, 0, [0.0, 10.4]),
  wave('crest', [94.0, 15.3], 0.65, true, 0, [0.5, 10.4]),
  wave('crest', [75.0, 28.0], 1.0, false, 2, [0.25, 10.4]),
  wave('crest', [87.5, 37.0], 1.05, true, -2, [0.75, 10.4]),
  wave('lace', [69.0, 52.8], 0.8, false, 178, [0.15, 8.8]),
  wave('lace', [80.0, 53.2], 0.75, true, 178, [0.65, 9.6]),
];

type Scene = { region: Region; dt: number; darkness: number; isStill: boolean; rain: number };

function showFrame(map: THREE.Texture, frame: number, isFlipped: boolean) {
  const column = frame % COLUMNS;
  const row = Math.floor(frame / COLUMNS);
  map.repeat.set((isFlipped ? -1 : 1) / COLUMNS, 1 / ROWS);
  map.offset.set((column + (isFlipped ? 1 : 0)) / COLUMNS, (ROWS - 1 - row) / ROWS);
}

/** Which frame a wave shows `clock` seconds into its cycle, or null while it waits between waves. */
export function waveFrame({ kind, period }: Pick<Wave, 'kind' | 'period'>, clock: number) {
  const { frames, fps, isLoop } = SHEETS[kind];
  if (isLoop) return Math.floor((clock / period) * frames) % frames;
  const frame = Math.floor(clock * fps);
  return frame < frames ? frame : null;
}

/** How far through one showing a wave is (0–1): its whole period for a loop, its frames otherwise. */
function progressOf({ kind, period }: Pick<Wave, 'kind' | 'period'>, clock: number) {
  const { frames, fps, isLoop } = SHEETS[kind];
  if (isLoop) return clock / period;
  return THREE.MathUtils.clamp(clock / (frames / fps), 0, 1);
}

/** Fades a breaker or swell in and out over its showing; a looping wash only breathes. */
function envelopeOf(kind: Kind, progress: number) {
  if (SHEETS[kind].isLoop) return 0.65 + 0.35 * Math.sin(Math.PI * progress) ** 2;
  return THREE.MathUtils.smoothstep(progress, 0, 0.2) * (1 - THREE.MathUtils.smoothstep(progress, 0.6, 1));
}

/** The sea's waves: swells offshore, breakers on the rocks and the breakwater, a wash along the near shore. */
export function createWaves(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const waves = WAVES.map((spec) => {
    const sheet = SHEETS[spec.kind];
    const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false });
    material.rotation = THREE.MathUtils.degToRad(spec.degrees);
    const sprite = new THREE.Sprite(material);
    const width = sheet.width * spec.scale * (characterScale(spec.z) / characterScale(REFERENCE_DEPTH));
    sprite.scale.set(width, width * sheet.heightRatio, 1);
    sprite.center.set(0.5, sheet.contact);
    sprite.renderOrder = WAVE_ORDER;
    sprite.visible = false;
    scene.add(sprite);
    return { spec, sprite, material, clock: spec.phase * spec.period };
  });
  const sheets: THREE.Texture[] = [];
  let isDisposed = false;
  // Waves are a nicety: if a sheet fails to load the sea simply stays as painted there.
  (Object.keys(SHEETS) as Kind[]).forEach((kind) => {
    loader
      .loadAsync(SHEETS[kind].url)
      .then((texture) => {
        if (isDisposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        // Neighbouring cells must not bleed into each other when sampled small.
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        sheets.push(texture);
        waves
          .filter(({ spec }) => spec.kind === kind)
          .forEach(({ material }) => {
            material.map = texture.clone();
            material.needsUpdate = true;
          });
      })
      .catch(() => undefined);
  });

  return {
    update({ region, dt, darkness, isStill, rain }: Scene) {
      for (const entry of waves) {
        const { spec, sprite, material } = entry;
        const map = material.map;
        if (region !== SEA || !map) {
          sprite.visible = false;
          continue;
        }
        if (!isStill) entry.clock = (entry.clock + dt * (1 + rain * RAIN_HURRY)) % spec.period;
        const frame = isStill ? STILL_FRAME : waveFrame(spec, entry.clock);
        sprite.visible = frame !== null;
        if (frame === null) continue;
        showFrame(map, frame, spec.isFlipped);
        const progress = isStill ? STILL_FRAME / (SHEETS[spec.kind].frames - 1) : progressOf(spec, entry.clock);
        // Swells roll shoreward, square to their own crest line.
        const travel = spec.kind === 'crest' ? sprite.scale.x * CREST_TRAVEL * progress : 0;
        sprite.position.set(
          spec.x * 1.2 - 60 + Math.sin(material.rotation) * travel,
          40 - spec.z * 0.8 - Math.cos(material.rotation) * travel,
          0.5,
        );
        material.opacity = SHEETS[spec.kind].opacity * (isStill ? STILL_FADE : envelopeOf(spec.kind, progress));
        lightSprite(material.color, darkness, lampGlowAt(SEA, spec));
      }
    },
    dispose() {
      isDisposed = true;
      waves.forEach(({ sprite, material }) => {
        scene.remove(sprite);
        material.map?.dispose();
        material.dispose();
      });
      sheets.forEach((sheet) => sheet.dispose());
    },
  };
}
