import * as THREE from 'three/webgpu';

import { createParts, type Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { placeLandmarks } from '@views/drive/lib/engine/game/world/islandLandmarks';
import { type IslandModelKey, islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import { bench, logStool, soban } from '@views/drive/lib/engine/game/world/villageFurniture';
import {
  boundsFrame,
  collidersOf,
  firstCollider,
  prepare,
  type PropBuilder,
  type PropFrame,
  rebuildChild,
} from '@views/drive/lib/engine/game/world/villageKit';
import { dotjari, watermelonTray } from '@views/drive/lib/engine/game/world/villageLeisure';
import { barCounter } from '@views/drive/lib/engine/game/world/villageLounge';
import { gochujangJar, makgeolliBowl, oilBottle } from '@views/drive/lib/engine/game/world/villagePantry';
import { beachBall, bowlingPin, pinwheel } from '@views/drive/lib/engine/game/world/villageToys';
import {
  candleSticks,
  placeGamepad,
  slateBoards,
  surfFlag,
  workTable,
} from '@views/drive/lib/engine/game/world/villageWorkshop';

type UncollidedBuilder = (parts: Parts, frame: PropFrame, container: THREE.Object3D) => void;

interface Matched<B> {
  readonly pattern: RegExp;
  readonly build: B;
}

const CHARCOAL_FOOTPRINT = { x: 1.62, z: 1.52 } as const;
const CLAY_POT = { center: new THREE.Vector3(0, -0.085, 0), size: new THREE.Vector3(1.85, 0.93, 1.85) } as const;

const modelOnFirstCollider =
  (key: IslandModelKey, minimum: { x: number; z: number } = { x: 0, z: 0 }): PropBuilder =>
  (_parts, container) => {
    const { size, matrix } = firstCollider(container);
    const fitted = new THREE.Vector3(Math.max(size.x, minimum.x), size.y, Math.max(size.z, minimum.z));
    container.add(islandModelMesh(key, matrix, fitted));
  };

const clayPot: PropBuilder = (_parts, container) => {
  container.add(islandModelMesh('clayPot', new THREE.Matrix4().makeTranslation(CLAY_POT.center), CLAY_POT.size));
};

const ukuleleTable: UncollidedBuilder = (_parts, { size, matrix }, container) => {
  container.add(islandModelMesh('ukuleleTable', matrix, size));
};

const onFirstCollider =
  (build: (parts: Parts, frame: PropFrame) => void): PropBuilder =>
  (parts, container) =>
    build(parts, firstCollider(container));

const BUILDERS: readonly Matched<PropBuilder>[] = [
  { pattern: /^gizmoPhysicalDynamic$/, build: (_parts, container) => placeGamepad(container) },
  { pattern: /^blackBoardPhysicalDynamic/, build: slateBoards },
  { pattern: /^grinderPhysicalDynamic$/, build: modelOnFirstCollider('coconutCrate') },
  {
    pattern: /^(main|side)TablePhysicalDynamic/,
    build: (parts, container) => candleSticks(parts, container, workTable(parts, firstCollider(container))),
  },
  { pattern: /^quenchPhysicalDynamic/, build: modelOnFirstCollider('bambooBucket') },
  { pattern: /^refAnvilPhysicalDynamic$/, build: modelOnFirstCollider('surfboardStand') },
  { pattern: /^refOvenPhysicalDynamic$/, build: modelOnFirstCollider('firePit', CHARCOAL_FOOTPRINT) },
  { pattern: /^cauldronPhysicalDynamic$/, build: clayPot },
  { pattern: /^couchPhysicalDynamic/, build: bench },
  { pattern: /^stoolPhysicalDynamic/, build: onFirstCollider(logStool) },
  {
    pattern: /^tablePhysicalDynamic/,
    build: (parts, container) => {
      if (collidersOf(container).length > 1) soban(parts, container);
      else workTable(parts, firstCollider(container));
    },
  },
  { pattern: /^sauceKetchupPhysicalDynamic/, build: onFirstCollider(gochujangJar) },
  { pattern: /^sauceMustardPhysicalDynamic/, build: onFirstCollider(oilBottle) },
  { pattern: /^barPhysicalDynamic/, build: barCounter },
  { pattern: /^cupPhysicalDynamic/, build: onFirstCollider(makgeolliBowl) },
  {
    pattern: /^refTvPhysicalDynamic$/,
    build: (_parts, container) => container.add(islandModelMesh('portalArch', null)),
  },
  { pattern: /^blowerPhysicalDynamic/, build: modelOnFirstCollider('coconutCrate') },
  { pattern: /^refPinPhysicalDynamic$/, build: bowlingPin },
  { pattern: /^refBallPhysicalDynamic$/, build: onFirstCollider(beachBall) },
];

const UNCOLLIDED_BUILDERS: readonly Matched<UncollidedBuilder>[] = [
  { pattern: /^sword$/, build: surfFlag },
  { pattern: /^Cube006$/, build: ukuleleTable },
  { pattern: /^Cylinder$/, build: watermelonTray },
  { pattern: /^Plane005$/, build: dotjari },
  { pattern: /^refFan$/, build: pinwheel },
];

function rebuildUncollided(child: THREE.Mesh, build: UncollidedBuilder): void {
  const frame = boundsFrame(child);
  const container = prepare(child);
  const parts = createParts();
  build(parts, frame, container);
  container.add(parts.build());
}

export function rebuildVillageProps(model: THREE.Object3D): void {
  placeLandmarks(model);
  for (const child of [...model.children]) {
    const uncollided = UNCOLLIDED_BUILDERS.find(({ pattern }) => pattern.test(child.name));
    if (uncollided && child instanceof THREE.Mesh) {
      rebuildUncollided(child, uncollided.build);
      continue;
    }
    const builder = BUILDERS.find(({ pattern }) => pattern.test(child.name));
    if (builder) rebuildChild(child, builder);
  }
}

export const COCONUT_SIZE = new THREE.Vector3(0.55, 0.48, 0.5);

export function makeCoconut(cookie: THREE.Object3D | undefined): void {
  if (!(cookie instanceof THREE.Mesh)) return;
  const coconut = islandModelMesh('coconut', new THREE.Matrix4(), COCONUT_SIZE);
  cookie.geometry = coconut.geometry;
  cookie.material = coconut.material;
}
