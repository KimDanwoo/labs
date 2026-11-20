import { canvasTexture } from '@views/walk/lib/art';
import { lampGlowAt, lightSprite } from '@views/walk/lib/nightLights';
import { CHILD_SIZE, characterScale, sceneX, sceneY } from '@views/walk/lib/perspective';
import { passingRoute, presence, routeLength, startGait, walkOn, type Gait } from '@views/walk/lib/roam';
import { isIndoors, type Point, type Region } from '@views/walk/model/world/world';
import * as THREE from 'three';

const FRAMES = 4;
const ANIMAL = {
  cat: { url: '/art/cat-walk.webp', speed: 11, stride: 2.2, height: 3.6, aspect: 198 / 160 },
  dog: { url: '/art/dog-walk.webp', speed: 13, stride: 2.6, height: 4.6, aspect: 222 / 160 },
} as const;
type Animal = keyof typeof ANIMAL;

const FIRST_VISIT = [3, 8] as const;
const NEXT_VISIT = [10, 25] as const;
const NIGHT_CAT_SHARE = 0.8;
const DAY_CAT_SHARE = 0.5;
const PAUSE_CHANCE = 0.35;
const PAUSE_SECONDS = 1.6;
const FADE_IN = 3;
const FADE_OUT = 4;
const LEAVE_SECONDS = 0.8;
/** Render order around the child's sprites (4): drawn over them when nearer the viewer, under them otherwise. */
const ORDER = { front: 4.2, behind: 3.8 } as const;

type Scene = {
  region: Region;
  dt: number;
  darkness: number;
  isStill: boolean;
  isRaining: boolean;
  childZ: number;
};

const between = ([min, max]: readonly [number, number]) => min + Math.random() * (max - min);

interface Visitor {
  animal: Animal;
  region: Region;
  gait: Gait;
  length: number;
  pause: number;
  pauseAt: number;
  frame: number;
  opacity: number;
  leaving: { from: number; seconds: number } | null;
}

function trackLeaving(visitor: Visitor, isRaining: boolean, dt: number) {
  if (isRaining) visitor.leaving ??= { from: visitor.opacity, seconds: 0 };
  if (visitor.leaving) visitor.leaving.seconds += dt;
}

function isPausingNow(visitor: Visitor, isStill: boolean) {
  return !isStill && visitor.gait.walked >= visitor.pauseAt && visitor.pause < PAUSE_SECONDS;
}

function hasLeft(visitor: Visitor, strolled: Gait | null) {
  return !strolled || (visitor.leaving?.seconds ?? 0) >= LEAVE_SECONDS;
}

function requestAnimalTexture(
  loader: THREE.TextureLoader,
  animal: Animal,
  textures: Partial<Record<Animal, THREE.Texture>>,
  isDisposed: () => boolean,
) {
  loader
    .loadAsync(ANIMAL[animal].url)
    .then((texture) => {
      if (isDisposed()) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      textures[animal] = texture;
    })
    .catch(() => undefined);
}

function loadAnimalTextures(
  loader: THREE.TextureLoader,
  textures: Partial<Record<Animal, THREE.Texture>>,
  isDisposed: () => boolean,
) {
  (Object.keys(ANIMAL) as Animal[]).forEach((animal) => requestAnimalTexture(loader, animal, textures, isDisposed));
}

function createShadow(scene: THREE.Scene) {
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
  return { shadowTexture, shadowMaterial, shadow };
}

export function createRoamers(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const textures: Partial<Record<Animal, THREE.Texture>> = {};
  let isDisposed = false;
  loadAnimalTextures(loader, textures, () => isDisposed);
  const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0.04);
  sprite.visible = false;
  scene.add(sprite);
  const { shadowTexture, shadowMaterial, shadow } = createShadow(scene);

  let wait = between(FIRST_VISIT);
  let visitor: Visitor | null = null;
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
      frame: 0,
      opacity: 0,
      leaving: null,
    };
  }

  function fadeFor({ length, leaving }: Visitor, gait: Gait) {
    const along = presence(gait.walked, length, FADE_IN, FADE_OUT);
    if (!leaving) return along;
    return Math.min(along, leaving.from * (1 - leaving.seconds / LEAVE_SECONDS));
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
    const height = spec.height * characterScale(gait.at.z) * CHILD_SIZE;
    sprite.scale.set(height * spec.aspect, height, 1);
    sprite.position.set(sceneX(gait.at.x), sceneY(gait.at.z), 2);
    sprite.renderOrder = gait.at.z > childZ ? ORDER.front : ORDER.behind;
    standing = { ...gait.at, order: sprite.renderOrder };
    lightSprite(material.color, darkness, lampGlowAt(region, gait.at));
    shadow.position.set(sprite.position.x, sprite.position.y - 0.05, 1);
    shadow.scale.set(height * spec.aspect * 0.9, height * 0.28, 1);
    sprite.visible = true;
    shadow.visible = true;
  }

  function admit({ region, dt, darkness, isStill, isRaining }: Scene) {
    if (visitor?.region !== region) hide();
    if (visitor) return visitor;
    wait -= dt;
    if (wait > 0 || isStill || isRaining) return null;
    wait = between(NEXT_VISIT);
    arrive(region, darkness);
    return visitor as Visitor | null;
  }

  function advance(active: Visitor, now: Scene) {
    const { dt, darkness, isStill, isRaining } = now;
    trackLeaving(active, isRaining, dt);
    const spec = ANIMAL[active.animal];
    const isPausing = isPausingNow(active, isStill);
    if (isPausing) active.pause += dt;
    const strolled = isPausing || isStill ? active.gait : walkOn(active.gait, spec, dt);
    if (!strolled || hasLeft(active, strolled)) {
      hide();
      return;
    }
    active.gait = strolled;
    if (!isStill) active.frame = isPausing ? 0 : Math.floor(strolled.phase) % FRAMES;
    draw(strolled, active.frame, spec, now);
    active.opacity = fadeFor(active, strolled);
    material.opacity = active.opacity;
    shadowMaterial.opacity = active.opacity * (1 - darkness * 0.6);
  }

  return {
    get visitor() {
      return visitor?.animal ?? '';
    },
    get standing() {
      return standing;
    },
    update(now: Scene) {
      if (isIndoors(now.region)) {
        hide();
        return;
      }
      const active = admit(now);
      if (active) advance(active, now);
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
