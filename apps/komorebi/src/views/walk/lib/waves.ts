import { lampGlowAt, lightSprite } from '@views/walk/lib/nightLights';
import { characterScale, sceneX, sceneY } from '@views/walk/lib/perspective';
import {
  COLUMNS,
  CREST_TRAVEL,
  ROWS,
  SHEETS,
  STILL_FADE,
  STILL_FRAME,
  WAVES,
  envelopeOf,
  progressOf,
  showFrame,
  waveFrame,
} from '@views/walk/lib/waveSheets';
import { type Region, REGION } from '@views/walk/model/world/world';
import * as THREE from 'three';
const REFERENCE_DEPTH = 40;
const RAIN_HURRY = 0.25;
const NIGHT_DIM = 0.6;
const WAVE_ORDER = 1;
const SEA: Region = REGION.coast;

type Scene = { region: Region; dt: number; darkness: number; isStill: boolean; rain: number };

type WaveType = ReturnType<typeof createWave>;

function createWave(scene: THREE.Scene, spec: (typeof WAVES)[number]) {
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
}

function updateUniforms(entry: WaveType, frame: number, isStill: boolean) {
  const { spec } = entry;
  const sheet = SHEETS[spec.kind];
  const frameTime = sheet.isLoop ? (entry.clock / spec.period) * sheet.frames : entry.clock * sheet.fps;
  const nextFrame = sheet.isLoop ? (frame + 1) % sheet.frames : Math.min(frame + 1, sheet.frames - 1);
  entry.blend.value = isStill ? 0 : frameTime - Math.floor(frameTime);
  entry.nextOffset.value.set(
    ((nextFrame % COLUMNS) - (frame % COLUMNS)) / COLUMNS,
    (Math.floor(frame / COLUMNS) - Math.floor(nextFrame / COLUMNS)) / ROWS,
  );
}

function placeWave(entry: WaveType, progress: number) {
  const { spec, sprite, material } = entry;
  const sheet = SHEETS[spec.kind];
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
    sceneX(spec.x) + Math.sin(material.rotation) * travel,
    sceneY(spec.z) - Math.cos(material.rotation) * travel,
    0.5,
  );
}

function updateWave(entry: WaveType, { region, dt, darkness, isStill, rain }: Scene) {
  const { spec, sprite, material } = entry;
  const map = material.map;
  if (region !== SEA || !map) {
    sprite.visible = false;
    return;
  }
  if (!isStill) entry.clock = (entry.clock + dt * (1 + rain * RAIN_HURRY)) % spec.period;
  const frame = isStill ? STILL_FRAME : waveFrame(spec, entry.clock);
  sprite.visible = frame !== null;
  if (frame === null) return;
  showFrame(map, frame, spec.isFlipped);
  updateUniforms(entry, frame, isStill);
  const progress = isStill ? STILL_FRAME / (SHEETS[spec.kind].frames - 1) : progressOf(spec, entry.clock);
  placeWave(entry, progress);
  material.opacity =
    SHEETS[spec.kind].opacity * (isStill ? STILL_FADE : envelopeOf(spec.kind, progress)) * (1 - darkness * NIGHT_DIM);
  lightSprite(material.color, darkness, lampGlowAt(SEA, spec));
}

export function createWaves(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const waves = WAVES.map((spec) => createWave(scene, spec));
  const sheets: THREE.Texture[] = [];
  let isDisposed = false;
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
      for (const entry of waves) updateWave(entry, { region, dt, darkness, isStill, rain });
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
