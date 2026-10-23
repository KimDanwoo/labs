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
/** How far a swell rolls toward the shore over one showing, as a share of its width. */
const CREST_TRAVEL = 0.2;
type Kind = keyof typeof SHEETS;
const COLUMNS = 4;
const ROWS = 3;
/** Wave widths are given, in scene units, for where the child stands at depth 40; nearer ones are larger. */
const REFERENCE_DEPTH = 40;
/** With reduced motion each wave holds one gentle frame, faintly. */
const STILL_FRAME = 6;
const STILL_FADE = 0.4;
const RAIN_HURRY = 0.25;
/** Foam only catches moonlight after dark, so it fades back rather than glowing white. */
const NIGHT_DIM = 0.6;
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

/** Keep painted foam at the near shoreline; offshore water is animated by the surface shader. */
const WAVES: Wave[] = [
  wave('lace', [69.0, 52.8], 0.8, false, 178, [0.15, 6.4]),
  wave('lace', [80.0, 53.2], 0.75, true, 178, [0.65, 7.0]),
  wave('lace', [88.1, 50.6], 0.7, false, 209, [0.4, 6.8]),
  wave('lace', [96.0, 44.7], 0.75, true, 198, [0.9, 7.4]),
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
    // Blend adjacent atlas cells on the GPU instead of stepping at 3–8 fps.
    const blend = { value: 0 };
    const nextOffset = { value: new THREE.Vector2() };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.waveBlend = blend;
      shader.uniforms.waveNextOffset = nextOffset;
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform float waveBlend; uniform vec2 waveNextOffset; void main() {')
        .replace(
          '#include <map_fragment>',
          `
          #ifdef USE_MAP
            vec4 a = texture2D(map, vMapUv);
            vec4 b = texture2D(map, vMapUv + waveNextOffset);
            float alpha = mix(a.a, b.a, waveBlend);
            vec3 rgb = mix(a.rgb * a.a, b.rgb * b.a, waveBlend) / max(alpha, .00001);
            diffuseColor *= vec4(rgb, alpha);
          #endif
        `,
        );
    };
    material.customProgramCacheKey = () => 'wave-atlas-blend-v1';
    material.rotation = THREE.MathUtils.degToRad(spec.degrees);
    const sprite = new THREE.Sprite(material);
    const width = sheet.width * spec.scale * (characterScale(spec.z) / characterScale(REFERENCE_DEPTH));
    sprite.scale.set(width, width * sheet.heightRatio, 1);
    sprite.center.set(0.5, sheet.contact);
    sprite.renderOrder = WAVE_ORDER;
    sprite.visible = false;
    scene.add(sprite);
    return { spec, sprite, material, blend, nextOffset, width, clock: spec.phase * spec.period };
  });
  const sheets: THREE.Texture[] = [];
  let isDisposed = false;
  // Waves are a nicety: if a sheet fails to load the sea simply stays as painted there.
  [...new Set(WAVES.map(({ kind }) => kind))].forEach((kind) => {
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
        const sheet = SHEETS[spec.kind];
        const frameTime = sheet.isLoop ? (entry.clock / spec.period) * sheet.frames : entry.clock * sheet.fps;
        const nextFrame = sheet.isLoop ? (frame + 1) % sheet.frames : Math.min(frame + 1, sheet.frames - 1);
        entry.blend.value = isStill ? 0 : frameTime - Math.floor(frameTime);
        entry.nextOffset.value.set(
          ((nextFrame % COLUMNS) - (frame % COLUMNS)) / COLUMNS,
          (Math.floor(frame / COLUMNS) - Math.floor(nextFrame / COLUMNS)) / ROWS,
        );
        const progress = isStill ? STILL_FRAME / (SHEETS[spec.kind].frames - 1) : progressOf(spec, entry.clock);
        // Swells roll shoreward, square to their own crest line.
        const wash = Math.sin(Math.PI * progress) ** 2;
        let travel = 0;
        if (spec.kind === 'crest') travel = entry.width * CREST_TRAVEL * progress;
        if (spec.kind === 'lace') travel = entry.width * 0.045 * wash;
        sprite.scale.set(
          entry.width * (1 + (spec.kind === 'crest' ? 0.1 * progress : 0.035 * wash)),
          entry.width * sheet.heightRatio * (1 + 0.12 * wash),
          1,
        );
        sprite.position.set(
          spec.x * 1.2 - 60 + Math.sin(material.rotation) * travel,
          40 - spec.z * 0.8 - Math.cos(material.rotation) * travel,
          0.5,
        );
        material.opacity =
          SHEETS[spec.kind].opacity *
          (isStill ? STILL_FADE : envelopeOf(spec.kind, progress)) *
          (1 - darkness * NIGHT_DIM);
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
