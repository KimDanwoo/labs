import type { Point, Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';

/** A lit window, lantern or shop front, in painting percent; `reach` is the pool of light it throws (0–1 of width). */
type Lamp = { x: number; z: number; reach: number; flicker?: boolean };
/** Far-off lights that only twinkle, such as the town across the bay. */
type Twinkle = { x: number; z: number };

export const MAX_LAMPS = 8;

export const LAMPS: Record<Region, Lamp[]> = {
  village: [
    { x: 31, z: 30, reach: 0.07 },
    { x: 36.5, z: 30, reach: 0.06 },
    { x: 55, z: 14, reach: 0.05 },
    { x: 59, z: 14.5, reach: 0.04 },
    { x: 72, z: 16, reach: 0.035 },
  ],
  river: [
    { x: 17, z: 15, reach: 0.06 },
    { x: 85, z: 22, reach: 0.06 },
    { x: 90, z: 20, reach: 0.04 },
  ],
  coast: [{ x: 29, z: 34, reach: 0.08 }],
  forest: [
    { x: 34.5, z: 52, reach: 0.08, flicker: true },
    { x: 66.5, z: 52, reach: 0.08, flicker: true },
    { x: 50, z: 30, reach: 0.07, flicker: true },
  ],
  school: [
    { x: 51, z: 30, reach: 0.06 },
    { x: 40, z: 24, reach: 0.035 },
    { x: 66, z: 24, reach: 0.035 },
  ],
  shops: [
    { x: 22, z: 40, reach: 0.09 },
    { x: 41, z: 38, reach: 0.06 },
    { x: 88, z: 44, reach: 0.09 },
    { x: 70, z: 35, reach: 0.05 },
    { x: 36, z: 12, reach: 0.04 },
  ],
};

const TWINKLES: Partial<Record<Region, Twinkle[]>> = {
  coast: Array.from({ length: 16 }, (_, i) => ({ x: 42 + i * 3.4 + (i % 3) * 0.7, z: 12 + (i % 4) * 0.5 })),
  village: [
    { x: 80, z: 9 },
    { x: 88, z: 11 },
  ],
};

/** Uniform values for the painting shader: xy in UV (y up), z the reach. */
export function lampUniforms(region: Region) {
  const lamps = LAMPS[region].slice(0, MAX_LAMPS);
  const values = Array.from({ length: MAX_LAMPS }, (_, i) => {
    const lamp = lamps[i];
    return lamp ? new THREE.Vector3(lamp.x / 100, 1 - lamp.z / 100, lamp.reach) : new THREE.Vector3();
  });
  return { values, count: lamps.length };
}

const POOL_REACH = 2.2;
const POOL_STRENGTH = 0.85;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** How much lamplight falls at a point (0–0.9), with the same falloff the painting shader uses for its pools. */
export function lampGlowAt(region: Region, point: Point) {
  const pool = LAMPS[region]
    .slice(0, MAX_LAMPS)
    .reduce(
      (sum, lamp) =>
        sum +
        1 -
        smoothstep(0, lamp.reach * POOL_REACH, Math.hypot(((point.x - lamp.x) / 100) * 1.5, (point.z - lamp.z) / 100)),
      0,
    );
  return Math.min(0.9, pool * POOL_STRENGTH);
}

const MOONLIT = new THREE.Color(0.5, 0.58, 0.8);
const LAMPLIT = new THREE.Color(1, 0.86, 0.64);
const DAYLIT = new THREE.Color(1, 1, 1);

/** Tints a sprite standing in the painting: moonlit blue after dark, warmed back where lamplight falls on it. */
export function lightSprite(color: THREE.Color, darkness: number, glow: number) {
  color.copy(MOONLIT).lerp(LAMPLIT, glow);
  color.lerp(DAYLIT, 1 - darkness);
}

const toScene = (x: number, z: number) => new THREE.Vector3(x * 1.2 - 60, 40 - z * 0.8, 1);

/** Brightness over time: a lantern flame breathes gently, far-off lights twinkle, windows hold steady. */
const FLICKER = {
  steady: () => 1,
  flame: (t: number) => 0.97 + 0.03 * Math.sin(t * 2.6) * Math.sin(t * 1.1),
  twinkle: (t: number) => 0.82 + 0.18 * Math.sin(t * 7) * Math.sin(t * 2.3),
} satisfies Record<string, (t: number) => number>;
type Flicker = (typeof FLICKER)[keyof typeof FLICKER];

/** Warm halos over each lamp and tiny far-off twinkles, added on top of the painting only after dark. */
export function createNightLights(scene: THREE.Scene) {
  const glow = canvasTexture(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, '#fff3c4ff');
    g.addColorStop(0.25, '#ffcf7aa0');
    g.addColorStop(1, '#ff9a3c00');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  const make = (region: Region, x: number, z: number, size: number, flicker: Flicker) => {
    const material = new THREE.SpriteMaterial({
      map: glow,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(toScene(x, z));
    sprite.scale.setScalar(size);
    sprite.renderOrder = 4.8;
    sprite.visible = false;
    scene.add(sprite);
    return { region, sprite, material, size, flicker, phase: x * 1.7 + z };
  };
  const halos = (Object.keys(LAMPS) as Region[]).flatMap((region) =>
    LAMPS[region].map((lamp) =>
      make(region, lamp.x, lamp.z, lamp.reach * 60, lamp.flicker ? FLICKER.flame : FLICKER.steady),
    ),
  );
  const twinkles = (Object.keys(TWINKLES) as Region[]).flatMap((region) =>
    (TWINKLES[region] ?? []).map((t) => make(region, t.x, t.z, 1.1, FLICKER.twinkle)),
  );
  const all = [...halos, ...twinkles];
  return {
    update(region: Region, darkness: number, elapsed: number, isStill: boolean) {
      for (const light of all) {
        light.sprite.visible = darkness > 0.01 && light.region === region;
        if (!light.sprite.visible) continue;
        const wobble = isStill ? 1 : light.flicker(elapsed + light.phase);
        light.material.opacity = darkness * wobble;
      }
    },
    dispose() {
      for (const { sprite, material } of all) {
        scene.remove(sprite);
        material.dispose();
      }
      glow.dispose();
    },
  };
}
