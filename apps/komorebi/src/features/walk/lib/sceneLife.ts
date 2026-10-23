import type { Region } from '@shared/world/world';
import * as THREE from 'three';
import { canvasTexture } from './art';
import { FLIGHT, startFlight, stepButterfly, stepDragonfly, type Bounds, type Flight } from './flight';
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

type Colours = { wing: string; edge: string };
const BUTTERFLY_COLOURS: Colours[] = [
  { wing: '#ffd94a', edge: '#a5681f' },
  { wing: '#f8f6ee', edge: '#5f5a50' },
  { wing: '#f29b4b', edge: '#5e3216' },
  { wing: '#9cc3ea', edge: '#3f5f86' },
];
const DRAGONFLY_BODIES = ['#c4542f', '#3f6f9e', '#6f8f3a', '#b23a2a'];

function drawButterfly({ wing, edge }: Colours, c: CanvasRenderingContext2D) {
  c.fillStyle = wing;
  c.strokeStyle = edge;
  c.lineWidth = 2.5;
  c.beginPath();
  c.ellipse(21, 22, 12, 13, -0.45, 0, Math.PI * 2);
  c.ellipse(43, 22, 12, 13, 0.45, 0, Math.PI * 2);
  c.ellipse(24, 40, 8, 9, 0.5, 0, Math.PI * 2);
  c.ellipse(40, 40, 8, 9, -0.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = edge;
  c.fillRect(30, 14, 4, 30);
}

function drawDragonfly(body: string, c: CanvasRenderingContext2D) {
  c.fillStyle = '#e6f4fb70';
  c.strokeStyle = '#8fb0ba90';
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(20, 19, 12, 3.6, -0.12, 0, Math.PI * 2);
  c.ellipse(44, 19, 12, 3.6, 0.12, 0, Math.PI * 2);
  c.ellipse(21, 26, 10.5, 3.2, 0.18, 0, Math.PI * 2);
  c.ellipse(43, 26, 10.5, 3.2, -0.18, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = body;
  c.beginPath();
  c.ellipse(32, 12, 4.5, 4.5, 0, 0, Math.PI * 2);
  c.ellipse(32, 22, 3.6, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(30, 26, 4, 34);
  c.fillStyle = '#00000030';
  for (let y = 32; y < 58; y += 6) c.fillRect(30, y, 4, 1.5);
}

function drawGull(c: CanvasRenderingContext2D) {
  c.lineCap = 'round';
  for (const [style, width] of [
    ['#55606a', 9],
    ['#fbfcfa', 5],
  ] as const) {
    c.strokeStyle = style;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(4, 30);
    c.quadraticCurveTo(18, 12, 32, 28);
    c.quadraticCurveTo(46, 12, 60, 30);
    c.stroke();
  }
}

const SIZE = { butterfly: 3.2, dragonfly: 3.8, gull: 3.2 };
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
};

const between = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!;

/**
 * Small life in each painting: butterflies that wander and settle, dragonflies that hover and dart, gulls over
 * the sea and a sleeping cat. Colours, numbers and sizes vary per visit. Flyers rest at night, in rain and with
 * reduced motion, and never wake the 60 fps budget.
 */
export function createSceneLife(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const butterflyTextures = BUTTERFLY_COLOURS.map((colours) => canvasTexture(64, 64, (c) => drawButterfly(colours, c)));
  const dragonflyTextures = DRAGONFLY_BODIES.map((body) => canvasTexture(64, 64, (c) => drawDragonfly(body, c)));
  const gullTexture = canvasTexture(64, 64, drawGull);
  const sprite = (texture: THREE.Texture) => {
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const created = new THREE.Sprite(material);
    created.renderOrder = FLYER_ORDER;
    created.visible = false;
    scene.add(created);
    return { sprite: created, material };
  };

  const insects: Life[] = (Object.keys(PATCHES) as Region[]).flatMap((region) =>
    PATCHES[region].flatMap(({ kind, bounds, count }) =>
      Array.from({ length: Math.round(between(count[0], count[1])) }, () => {
        const texture = kind === INSECT.butterfly ? pick(butterflyTextures) : pick(dragonflyTextures);
        const mode = kind === INSECT.butterfly ? FLIGHT.flutter : FLIGHT.hover;
        return {
          region,
          kind,
          bounds,
          flight: startFlight(bounds, Math.random, mode),
          ...sprite(texture),
          size: SIZE[kind] * between(0.8, 1.2),
          bob: Math.random() * 10,
          lift: ALTITUDE[kind][0],
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
      ...sprite(gullTexture),
    })),
  );

  const catMaterial = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
  const cat = new THREE.Sprite(catMaterial);
  cat.renderOrder = CAT_ORDER;
  cat.visible = false;
  cat.position.set(CAT_SPOT.x * 1.2 - 60, 40 - CAT_SPOT.z * 0.8, 1);
  scene.add(cat);
  let catTexture: THREE.Texture | null = null;
  let catWidth = 0;
  let catAspect = 1;
  let isDisposed = false;
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
    const bob = isSettled ? 0 : Math.sin(elapsed * 3.1 + life.bob) * 0.5 + Math.sin(elapsed * 7.3 + life.bob) * 0.2;
    s.position.set(flight.x * 1.2 - 60, 40 - flight.z * 0.8 + life.lift + bob, 1);
    if (kind === INSECT.butterfly) {
      s.scale.set(depth * (0.2 + 0.8 * Math.abs(Math.cos(flight.wing))), depth, 1);
      material.rotation = isSettled ? 0 : Math.sin(elapsed * 2 + life.bob) * 0.25;
      return;
    }
    const screenAngle = Math.atan2(-Math.sin(flight.heading) * 0.8, Math.cos(flight.heading) * 1.2);
    material.rotation = screenAngle - Math.PI / 2;
    s.scale.set(depth * (0.88 + 0.12 * Math.abs(Math.sin(flight.wing))), depth, 1);
  }

  return {
    update({ region, dt, elapsed, darkness, isStill, isRaining }: Scene) {
      const dusk = THREE.MathUtils.smoothstep(darkness, DUSK[0], DUSK[1]);
      const isFlying = !isStill && !isRaining && dusk < 1;
      for (const life of insects) {
        life.sprite.visible = isFlying && life.region === region;
        if (!life.sprite.visible) continue;
        const step = life.kind === INSECT.butterfly ? stepButterfly : stepDragonfly;
        life.flight = step(life.flight, dt, life.bounds, Math.random);
        life.material.opacity = 1 - dusk;
        drawInsect(life, elapsed, dt);
      }
      for (const gull of gulls) {
        gull.sprite.visible = isFlying && gull.region === region;
        if (!gull.sprite.visible) continue;
        const t = elapsed * gull.rate + gull.phase;
        const x = gull.path.x + Math.sin(t) * gull.path.spread + Math.sin(t * 2.3) * gull.path.spread * 0.25;
        const z = gull.path.z + Math.sin(t * 1.7 + 1) * 3;
        const flap = 0.35 + 0.65 * Math.abs(Math.sin(elapsed * 2.2 + gull.phase));
        gull.sprite.position.set(x * 1.2 - 60, 40 - z * 0.8, 1);
        gull.sprite.scale.set(SIZE.gull, SIZE.gull * flap, 1);
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
      [...butterflyTextures, ...dragonflyTextures, gullTexture].forEach((texture) => texture.dispose());
      scene.remove(cat);
      catMaterial.dispose();
      catTexture?.dispose();
    },
  };
}
