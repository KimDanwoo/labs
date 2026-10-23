import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { FLIGHT, flyFor, startFlight, stepButterfly, stepDragonfly, type Bounds, type Flight } from './flight';
import { lampGlowAt, lightSprite } from './nightLights';
import { characterScale } from './perspective';

const CAT_URL = '/art/cat-sleeping.webp';
const FLYER_ORDER = 3.6;
const CAT_ORDER = 2.5;
const CAT_SPOT = { region: 'village' as Region, x: 14.5, z: 35.5 };

const INSECT = { butterfly: 'butterfly', dragonfly: 'dragonfly' } as const;
type Insect = (typeof INSECT)[keyof typeof INSECT];

/** A patch of the painting an insect keeps to, with how many may live there. */
type Patch = { kind: Insect; bounds: Bounds; count: [number, number] };
const patch = (
  kind: Insect,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  count: [number, number],
): Patch => ({
  kind,
  bounds: { minX, maxX, minZ, maxZ },
  count,
});
const PATCHES: Record<Region, Patch[]> = {
  home: [],
  village: [
    patch(INSECT.butterfly, 4, 34, 44, 66, [2, 3]),
    patch(INSECT.butterfly, 62, 90, 52, 70, [0, 1]),
    patch(INSECT.dragonfly, 58, 84, 30, 42, [1, 2]),
  ],
  river: [patch(INSECT.dragonfly, 46, 70, 58, 88, [2, 3]), patch(INSECT.butterfly, 4, 26, 70, 92, [1, 2])],
  coast: [],
  forest: [patch(INSECT.butterfly, 24, 40, 32, 44, [1, 2]), patch(INSECT.butterfly, 72, 86, 32, 44, [1, 1])],
  school: [patch(INSECT.butterfly, 2, 18, 26, 42, [1, 2]), patch(INSECT.dragonfly, 22, 78, 40, 70, [1, 2])],
  shops: [patch(INSECT.butterfly, 26, 40, 40, 50, [1, 2])],
};
const GULL_PATHS: Partial<Record<Region, { x: number; z: number; spread: number }[]>> = {
  coast: [
    { x: 72, z: 22, spread: 18 },
    { x: 58, z: 30, spread: 14 },
    { x: 84, z: 18, spread: 10 },
  ],
};

/** Painted sprite sheets, one creature or flap pose per equal cell; `aspect` is a cell's width over its height. */
const ATLAS = {
  butterfly: { url: '/art/butterflies.webp', frames: 4, aspect: 160 / 128 },
  dragonfly: { url: '/art/dragonflies.webp', frames: 4, aspect: 160 / 128 },
  gull: { url: '/art/gull.webp', frames: 3, aspect: 256 / 128 },
} as const;
type Flyer = keyof typeof ATLAS;
/** Gull wing poses in order through one wingbeat: up, level, down, level. */
const WINGBEAT = [0, 1, 2, 1];

const SIZE = { butterfly: 2.9, dragonfly: 3.4, gull: 2.6 };
/** Height above the painted ground, in scene units, while flying and while settled. */
/** Darkness over which flyers fade out and head home, rather than vanishing all at once. */
const DUSK = [0.25, 0.55] as const;
/** How quickly an insect drops to its perch or rises off it (higher is quicker). */
const LANDING_EASE = 8;
const ALTITUDE = { butterfly: [1.6, 0.5], dragonfly: [3.4, 1.2] } satisfies Record<Insect, [number, number]>;

type Scene = { region: Region; dt: number; elapsed: number; darkness: number; isStill: boolean; isRaining: boolean };
type Life = {
  region: Region;
  kind: Insect;
  bounds: Bounds;
  flight: Flight;
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  size: number;
  bob: number;
  /** Height above the ground right now, eased toward the flying or settled height. */
  lift: number;
  /** 1 in the air, 0 on a perch, eased between so the hovering bob fades rather than snaps. */
  aloft: number;
  /** Time not yet spent on a whole flight step. */
  clock: number;
};

const between = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * Small life in each painting: butterflies that wander and settle, dragonflies that hover and dart, gulls over
 * the sea and a sleeping cat. Colours, numbers and sizes vary per visit. Flyers rest at night, in rain and with
 * reduced motion, and never wake the 60 fps budget.
 */
export function createSceneLife(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const sheets: THREE.Texture[] = [];
  const cells: THREE.Texture[] = [];
  const waiting: { kind: Flyer; frame: number; material: THREE.SpriteMaterial }[] = [];
  let isDisposed = false;
  /** A sprite showing one cell of its sheet; it stays hidden until the sheet has loaded. */
  const sprite = (kind: Flyer, frame: number) => {
    const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
    const created = new THREE.Sprite(material);
    created.renderOrder = FLYER_ORDER;
    created.visible = false;
    scene.add(created);
    waiting.push({ kind, frame, material });
    return { sprite: created, material };
  };
  const showCell = (map: THREE.Texture, frame: number, frames: number) => {
    map.repeat.set(1 / frames, 1);
    map.offset.set(frame / frames, 0);
  };

  const insects: Life[] = (Object.keys(PATCHES) as Region[]).flatMap((region) =>
    PATCHES[region].flatMap(({ kind, bounds, count }) =>
      Array.from({ length: Math.round(between(count[0], count[1])) }, () => {
        const mode = kind === INSECT.butterfly ? FLIGHT.flutter : FLIGHT.hover;
        return {
          region,
          kind,
          bounds,
          flight: startFlight(bounds, Math.random, mode),
          ...sprite(kind, Math.floor(Math.random() * ATLAS[kind].frames)),
          size: SIZE[kind] * between(0.8, 1.2),
          bob: Math.random() * 10,
          lift: ALTITUDE[kind][0],
          aloft: 1,
          clock: 0,
        };
      }),
    ),
  );
  const gulls = Object.entries(GULL_PATHS).flatMap(([region, paths]) =>
    (paths ?? []).map((path) => ({
      region,
      path,
      rate: between(0.05, 0.11),
      phase: Math.random() * 10,
      ...sprite('gull', 0),
    })),
  );

  // Creatures are a nicety: if a sheet fails to load the walk simply goes on without them.
  (Object.keys(ATLAS) as Flyer[]).forEach((kind) => {
    loader
      .loadAsync(ATLAS[kind].url)
      .then((sheet) => {
        if (isDisposed) {
          sheet.dispose();
          return;
        }
        sheet.colorSpace = THREE.SRGBColorSpace;
        sheets.push(sheet);
        for (const { frame, material } of waiting.filter((entry) => entry.kind === kind)) {
          const cell = sheet.clone();
          showCell(cell, frame, ATLAS[kind].frames);
          cells.push(cell);
          material.map = cell;
          material.needsUpdate = true;
        }
      })
      .catch(() => undefined);
  });

  const catMaterial = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const cat = new THREE.Sprite(catMaterial);
  cat.renderOrder = CAT_ORDER;
  cat.visible = false;
  cat.position.set(CAT_SPOT.x * 1.2 - 60, 40 - CAT_SPOT.z * 0.8, 1);
  scene.add(cat);
  let catTexture: THREE.Texture | null = null;
  let catWidth = 0;
  let catAspect = 1;
  // The cat is a nicety: if its picture fails to load the walk simply goes on without it.
  loader
    .loadAsync(CAT_URL)
    .then((texture) => {
      if (isDisposed) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      catTexture = texture;
      catMaterial.map = texture;
      catMaterial.needsUpdate = true;
      const { width, height } = texture.image as HTMLImageElement;
      catAspect = height / width;
      catWidth = 4.6 * characterScale(CAT_SPOT.z) * 2.2;
    })
    .catch(() => undefined);

  function drawInsect(life: Life, elapsed: number, dt: number) {
    const { flight, kind, sprite: s, material, size } = life;
    const isSettled = flight.mode === FLIGHT.rest;
    const depth = characterScale(flight.z) * 2.4 * size;
    const [flying, settled] = ALTITUDE[kind];
    life.lift = THREE.MathUtils.damp(life.lift, isSettled ? settled : flying, LANDING_EASE, dt);
    life.aloft = THREE.MathUtils.damp(life.aloft, isSettled ? 0 : 1, LANDING_EASE, dt);
    const bob = life.aloft * (Math.sin(elapsed * 3.1 + life.bob) * 0.5 + Math.sin(elapsed * 7.3 + life.bob) * 0.2);
    s.position.set(flight.x * 1.2 - 60, 40 - flight.z * 0.8 + life.lift + bob, 1);
    if (kind === INSECT.butterfly) {
      s.scale.set(depth * ATLAS.butterfly.aspect * (0.2 + 0.8 * Math.abs(Math.cos(flight.wing))), depth, 1);
      material.rotation = isSettled ? 0 : Math.sin(elapsed * 2 + life.bob) * 0.25;
      return;
    }
    const screenAngle = Math.atan2(-Math.sin(flight.heading) * 0.8, Math.cos(flight.heading) * 1.2);
    material.rotation = screenAngle - Math.PI / 2;
    s.scale.set(depth * ATLAS.dragonfly.aspect * (0.88 + 0.12 * Math.abs(Math.sin(flight.wing))), depth, 1);
  }

  return {
    update({ region, dt, elapsed, darkness, isStill, isRaining }: Scene) {
      const dusk = THREE.MathUtils.smoothstep(darkness, DUSK[0], DUSK[1]);
      const isFlying = !isStill && !isRaining && dusk < 1;
      for (const life of insects) {
        life.sprite.visible = isFlying && life.region === region && life.material.map !== null;
        if (!life.sprite.visible) continue;
        const step = life.kind === INSECT.butterfly ? stepButterfly : stepDragonfly;
        ({ flight: life.flight, clock: life.clock } = flyFor(
          life.flight,
          life.clock,
          dt,
          step,
          life.bounds,
          Math.random,
        ));
        life.material.opacity = 1 - dusk;
        drawInsect(life, elapsed, dt);
      }
      for (const gull of gulls) {
        gull.sprite.visible = isFlying && gull.region === region && gull.material.map !== null;
        if (!gull.sprite.visible) continue;
        const t = elapsed * gull.rate + gull.phase;
        const x = gull.path.x + Math.sin(t) * gull.path.spread + Math.sin(t * 2.3) * gull.path.spread * 0.25;
        const z = gull.path.z + Math.sin(t * 1.7 + 1) * 3;
        const beat = WINGBEAT[Math.floor((elapsed * 3 + gull.phase) * WINGBEAT.length) % WINGBEAT.length]!;
        showCell(gull.material.map!, beat, ATLAS.gull.frames);
        gull.sprite.position.set(x * 1.2 - 60, 40 - z * 0.8, 1);
        gull.sprite.scale.set(SIZE.gull * ATLAS.gull.aspect, SIZE.gull, 1);
        gull.material.opacity = 1 - dusk;
      }
      cat.visible = catTexture !== null && region === CAT_SPOT.region;
      if (!cat.visible) return;
      const breath = isStill ? 0 : Math.sin(elapsed * 1.6) * 0.025;
      cat.scale.set(catWidth, catWidth * catAspect * (1 + breath), 1);
      lightSprite(catMaterial.color, darkness, lampGlowAt(CAT_SPOT.region, CAT_SPOT));
    },
    dispose() {
      isDisposed = true;
      for (const { sprite: s, material } of [...insects, ...gulls]) {
        scene.remove(s);
        material.dispose();
      }
      [...sheets, ...cells].forEach((texture) => texture.dispose());
      scene.remove(cat);
      catMaterial.dispose();
      catTexture?.dispose();
    },
  };
}
