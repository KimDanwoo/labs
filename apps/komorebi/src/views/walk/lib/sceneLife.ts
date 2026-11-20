import * as THREE from 'three';
import { type Region } from '../model/world/world';
import { FLIGHT, flyFor, startFlight, stepButterfly, stepDragonfly } from './flight';
import { drawInsect } from './insectPose';
import { sceneX, sceneY } from './perspective';
import {
  ALTITUDE,
  ATLAS,
  between,
  DUSK,
  type Flyer,
  GULL_PATHS,
  INSECT,
  type Life,
  PATCHES,
  SIZE,
  WINGBEAT,
} from './sceneLifeData';
import { createSleepingCat } from './sleepingCat';

const FLYER_ORDER = 3.6;

type Scene = { region: Region; dt: number; elapsed: number; darkness: number; isStill: boolean; isRaining: boolean };

type GullPath = NonNullable<(typeof GULL_PATHS)[keyof typeof GULL_PATHS]>[number];

interface Gull {
  region: string;
  path: GullPath;
  rate: number;
  phase: number;
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
}

interface Flying {
  region: Region;
  dusk: number;
  isFlying: boolean;
}

function flyInsect(life: Life, { region, dt, elapsed, dusk, isFlying }: Flying & { dt: number; elapsed: number }) {
  life.sprite.visible = isFlying && life.region === region && life.material.map !== null;
  if (!life.sprite.visible) return;
  const step = life.kind === INSECT.butterfly ? stepButterfly : stepDragonfly;
  ({ flight: life.flight, clock: life.clock } = flyFor(life.flight, life.clock, dt, step, life.bounds, Math.random));
  life.material.opacity = 1 - dusk;
  drawInsect(life, elapsed, dt);
}

function showCell(map: THREE.Texture, frame: number, frames: number) {
  map.repeat.set(1 / frames, 1);
  map.offset.set(frame / frames, 0);
}

function glideGull(gull: Gull, { region, dusk, isFlying, elapsed }: Flying & { elapsed: number }) {
  gull.sprite.visible = isFlying && gull.region === region && gull.material.map !== null;
  if (!gull.sprite.visible) return;
  const t = elapsed * gull.rate + gull.phase;
  const x = gull.path.x + Math.sin(t) * gull.path.spread + Math.sin(t * 2.3) * gull.path.spread * 0.25;
  const z = gull.path.z + Math.sin(t * 1.7 + 1) * 3;
  const beat = WINGBEAT[Math.floor((elapsed * 3 + gull.phase) * WINGBEAT.length) % WINGBEAT.length]!;
  showCell(gull.material.map!, beat, ATLAS.gull.frames);
  gull.sprite.position.set(sceneX(x), sceneY(z), 1);
  gull.sprite.scale.set(SIZE.gull * ATLAS.gull.aspect, SIZE.gull, 1);
  gull.material.opacity = 1 - dusk;
}

export function createSceneLife(scene: THREE.Scene, loader: THREE.TextureLoader) {
  const sheets: THREE.Texture[] = [];
  const cells: THREE.Texture[] = [];
  const waiting: { kind: Flyer; frame: number; material: THREE.SpriteMaterial }[] = [];
  let isDisposed = false;
  const sprite = (kind: Flyer, frame: number) => {
    const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false });
    const created = new THREE.Sprite(material);
    created.renderOrder = FLYER_ORDER;
    created.visible = false;
    scene.add(created);
    waiting.push({ kind, frame, material });
    return { sprite: created, material };
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
  const gulls: Gull[] = Object.entries(GULL_PATHS).flatMap(([region, paths]) =>
    (paths ?? []).map((path) => ({
      region,
      path,
      rate: between(0.05, 0.11),
      phase: Math.random() * 10,
      ...sprite('gull', 0),
    })),
  );

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

  const sleepingCat = createSleepingCat(scene, loader);

  return {
    update({ region, dt, elapsed, darkness, isStill, isRaining }: Scene) {
      const dusk = THREE.MathUtils.smoothstep(darkness, DUSK[0], DUSK[1]);
      const isFlying = !isStill && !isRaining && dusk < 1;
      for (const life of insects) flyInsect(life, { region, dt, elapsed, dusk, isFlying });
      for (const gull of gulls) glideGull(gull, { region, elapsed, dusk, isFlying });
      sleepingCat.update(region, elapsed, darkness, isStill);
    },
    dispose() {
      isDisposed = true;
      for (const { sprite: s, material } of [...insects, ...gulls]) {
        scene.remove(s);
        material.dispose();
      }
      [...sheets, ...cells].forEach((texture) => texture.dispose());
      sleepingCat.dispose();
    },
  };
}
