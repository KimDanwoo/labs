import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { lampGlowAt, lightSprite } from './nightLights';
import { characterScale } from './perspective';

/** One painted wave per sheet cell (4 × 3, row by row): it rolls in, breaks, spreads into foam and fades. */
const SHEET = { url: '/art/wave-break.webp', columns: 4, rows: 3, frames: 11 };
const FRAMES_PER_SECOND = 8;
const PLAY_SECONDS = SHEET.frames / FRAMES_PER_SECOND;
/** Width of a wave, in scene units, where the child stands at depth 40; nearer ones are larger. */
const WIDTH = 16;
const REFERENCE_DEPTH = 40;
/** Where in its cell the wave meets the shore, from the bottom, so rotation pivots on the shoreline. */
const CONTACT = 0.7;
const OPACITY = 0.95;
/** With reduced motion each wave holds one gentle, spread-out frame. */
const STILL_FRAME = 7;
const STILL_OPACITY = 0.35;
const RAIN_HURRY = 0.25;
const WAVE_ORDER = 1;
const SEA: Region = 'coast';

type Wave = { x: number; z: number; scale: number; isFlipped: boolean; degrees: number; phase: number; period: number };
const wave = (
  x: number,
  z: number,
  scale: number,
  isFlipped: boolean,
  degrees: number,
  phase: number,
  period: number,
) => ({ x, z, scale, isFlipped, degrees, phase, period }) satisfies Wave;

/** Where waves break along the coast, in painting percent, each on its own rhythm. Placed by Codex. */
const WAVES: Wave[] = [
  wave(58.4, 37.9, 0.7, false, 15, 0.68, 6.5),
  wave(64.0, 32.2, 0.85, false, 5, 0.18, 5.5),
  wave(71.6, 20.5, 0.9, false, -7, 0.12, 7.8),
  wave(78.6, 20.7, 1.15, true, 3, 0.52, 8.4),
  wave(86.5, 20.5, 1.0, false, -2, 0.81, 7.5),
  wave(93.0, 20.9, 0.75, true, -3, 0.3, 8.8),
];

type Scene = { region: Region; dt: number; darkness: number; isStill: boolean; rain: number };

function showFrame(map: THREE.Texture, frame: number, isFlipped: boolean) {
  const column = frame % SHEET.columns;
  const row = Math.floor(frame / SHEET.columns);
  map.repeat.set((isFlipped ? -1 : 1) / SHEET.columns, 1 / SHEET.rows);
  map.offset.set((column + (isFlipped ? 1 : 0)) / SHEET.columns, (SHEET.rows - 1 - row) / SHEET.rows);
}

/** Painted waves rolling in and breaking against the breakwater, the tetrapods and the island rocks. */
export function createWaves(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const waves = WAVES.map((spec) => {
    const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false });
    material.rotation = THREE.MathUtils.degToRad(spec.degrees);
    const sprite = new THREE.Sprite(material);
    const width = WIDTH * spec.scale * (characterScale(spec.z) / characterScale(REFERENCE_DEPTH));
    sprite.scale.set(width, width / 2, 1);
    sprite.center.set(0.5, CONTACT);
    sprite.position.set(spec.x * 1.2 - 60, 40 - spec.z * 0.8, 0.5);
    sprite.renderOrder = WAVE_ORDER;
    sprite.visible = false;
    scene.add(sprite);
    return { spec, sprite, material, clock: spec.phase * spec.period };
  });
  let sheet: THREE.Texture | null = null;
  let isDisposed = false;
  // Waves are a nicety: if the sheet fails to load the sea simply stays as painted.
  loader
    .loadAsync(SHEET.url)
    .then((texture) => {
      if (isDisposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      sheet = texture;
      waves.forEach(({ material }) => {
        material.map = texture.clone();
        material.needsUpdate = true;
      });
    })
    .catch(() => undefined);

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
        const isBreaking = entry.clock < PLAY_SECONDS;
        sprite.visible = isStill || isBreaking;
        if (!sprite.visible) continue;
        showFrame(map, isStill ? STILL_FRAME : Math.floor(entry.clock * FRAMES_PER_SECOND), spec.isFlipped);
        material.opacity = isStill ? STILL_OPACITY : OPACITY;
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
      sheet?.dispose();
    },
  };
}
