import type { Point, Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { lampGlowAt, lightSprite } from './nightLights';
import { characterScale } from './perspective';
import { passingRoute, presence, routeLength, startGait, walkOn, type Gait } from './roam';

const FRAMES = 4;
const ANIMAL = {
  cat: { url: '/art/cat-walk.webp', speed: 7, stride: 1.6, height: 4.4, aspect: 198 / 160 },
  dog: { url: '/art/dog-walk.webp', speed: 9, stride: 2, height: 5.2, aspect: 222 / 160 },
} as const;
type Animal = keyof typeof ANIMAL;

/** Seconds between visitors; the first one shows up sooner. */
const FIRST_VISIT = [5, 14] as const;
const NEXT_VISIT = [18, 45] as const;
const NIGHT_CAT_SHARE = 0.8;
const DAY_CAT_SHARE = 0.5;
const PAUSE_CHANCE = 0.35;
const PAUSE_SECONDS = 1.6;
/** Lane distance over which an animal steps out of a lane end or melts into the far one. */
const FADE_IN = 3;
const FADE_OUT = 4;
/** Seconds an animal takes to slip away once rain starts. */
const LEAVE_SECONDS = 0.8;
/** Render order around the child's sprites (4): drawn over them when nearer the viewer, under them otherwise. */
const ORDER = { front: 4.2, behind: 3.8 } as const;

type Scene = {
  region: Region;
  dt: number;
  darkness: number;
  isStill: boolean;
  isRaining: boolean;
  /** Depth of the child, so an animal in front of them draws over them and one behind draws under. */
  childZ: number;
};

const between = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

/** Now and then a cat or a dog strolls through the painting along its lanes, pausing once to look around. */
export function createRoamers(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const textures: Partial<Record<Animal, THREE.Texture>> = {};
  let isDisposed = false;
  (Object.keys(ANIMAL) as Animal[]).forEach((animal) => {
    loader
      .loadAsync(ANIMAL[animal].url)
      .then((texture) => {
        if (isDisposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        textures[animal] = texture;
      })
      .catch(() => undefined);
  });
  const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0.04);
  sprite.visible = false;
  scene.add(sprite);
  const shadowTexture = canvasTexture(64, 32, (c) => {
    const g = c.createRadialGradient(32, 16, 1, 32, 16, 30);
    g.addColorStop(0, '#17332b66');
    g.addColorStop(1, '#17332b00');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 32);
  });
  const shadowMaterial = new THREE.SpriteMaterial({ map: shadowTexture, transparent: true, depthTest: false });
  const shadow = new THREE.Sprite(shadowMaterial);
  shadow.renderOrder = 3;
  shadow.visible = false;
  scene.add(shadow);

  let wait = between(FIRST_VISIT);
  let visitor: {
    animal: Animal;
    region: Region;
    gait: Gait;
    length: number;
    pause: number;
    pauseAt: number;
    /** Seconds spent slipping away once rain has started; null while it strolls on. */
    leaving: number | null;
  } | null = null;
  let standing: (Point & { order: number }) | null = null;

  function arrive(region: Region, darkness: number) {
    const share = darkness > 0.5 ? NIGHT_CAT_SHARE : DAY_CAT_SHARE;
    const animal: Animal = Math.random() < share ? 'cat' : 'dog';
    const path = passingRoute(region, Math.random);
    const texture = textures[animal];
    if (!path || !texture) return;
    material.map = texture;
    material.needsUpdate = true;
    visitor = {
      animal,
      region,
      gait: startGait(path),
      length: routeLength(path),
      pause: 0,
      pauseAt: Math.random() < PAUSE_CHANCE ? between([10, 30]) : Infinity,
      leaving: null,
    };
  }

  function hide() {
    visitor = null;
    standing = null;
    sprite.visible = false;
    shadow.visible = false;
  }

  function draw(gait: Gait, frame: number, spec: (typeof ANIMAL)[Animal], { childZ, darkness, region }: Scene) {
    // Sprites drop a negative scale's sign, so a left-facing walk mirrors the atlas instead.
    material.map!.repeat.set((gait.isFacingLeft ? -1 : 1) / FRAMES, 1);
    material.map!.offset.set((frame + (gait.isFacingLeft ? 1 : 0)) / FRAMES, 0);
    const height = spec.height * characterScale(gait.at.z) * 1.65;
    sprite.scale.set(height * spec.aspect, height, 1);
    sprite.position.set(gait.at.x * 1.2 - 60, 40 - gait.at.z * 0.8, 2);
    sprite.renderOrder = gait.at.z > childZ ? ORDER.front : ORDER.behind;
    standing = { ...gait.at, order: sprite.renderOrder };
    lightSprite(material.color, darkness, lampGlowAt(region, gait.at));
    shadow.position.set(sprite.position.x, sprite.position.y - 0.05, 1);
    shadow.scale.set(height * spec.aspect * 0.9, height * 0.28, 1);
    sprite.visible = true;
    shadow.visible = true;
  }

  return {
    get visitor() {
      return visitor?.animal ?? '';
    },
    /** Where the visiting animal's feet are, so foreground objects can hide it like they hide the child. */
    get standing() {
      return standing;
    },
    update(now: Scene) {
      const { region, dt, darkness, isStill, isRaining } = now;
      if (visitor?.region !== region) hide();
      if (!visitor) {
        wait -= dt;
        if (wait > 0 || isStill || isRaining) return;
        wait = between(NEXT_VISIT);
        arrive(region, darkness);
        if (!visitor) return;
      }
      if (isRaining) visitor.leaving ??= 0;
      if (visitor.leaving !== null) visitor.leaving += dt;
      const spec = ANIMAL[visitor.animal];
      const isPausing = visitor.gait.walked >= visitor.pauseAt && visitor.pause < PAUSE_SECONDS;
      if (isPausing) visitor.pause += dt;
      // With reduced motion the animal simply stands where it is, and nobody new comes along.
      const strolled = isPausing || isStill ? visitor.gait : walkOn(visitor.gait, spec, dt);
      const isGone = !strolled || (visitor.leaving ?? 0) >= LEAVE_SECONDS;
      if (isGone) {
        hide();
        return;
      }
      visitor.gait = strolled;
      const frame = isPausing ? 0 : Math.floor(strolled.phase) % FRAMES;
      draw(strolled, frame, spec, now);
      const slippingAway = 1 - (visitor.leaving ?? 0) / LEAVE_SECONDS;
      const opacity = presence(strolled.walked, visitor.length, FADE_IN, FADE_OUT) * slippingAway;
      material.opacity = opacity;
      shadowMaterial.opacity = opacity * (1 - darkness * 0.6);
    },
    dispose() {
      isDisposed = true;
      scene.remove(sprite, shadow);
      material.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      Object.values(textures).forEach((texture) => texture.dispose());
    },
  };
}
