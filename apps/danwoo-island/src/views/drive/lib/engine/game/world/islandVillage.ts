import * as THREE from 'three/webgpu';

import { createParts, type Parts } from './islandGeometry';
import { placeLandmarks } from './islandLandmarks';
import { islandModelMesh } from './islandModels';
import {
  boundsFrame,
  collidersOf,
  firstCollider,
  prepare,
  type PropBuilder,
  type PropFrame,
  rebuildChild,
} from './villageKit';
import { badukBoard, dotjari, tvCabinet, watermelonTray } from './villageLeisure';
import { barCounter, bench, gochujangJar, logStool, makgeolliBowl, oilBottle, soban } from './villageLounge';
import { beachBall, bowlingPin, pinwheel, stonePillar } from './villageToys';
import {
  anvil,
  bellowsBase,
  candleSticks,
  gamasot,
  grinderStand,
  hwaro,
  placeGamepad,
  slateBoards,
  surfFlag,
  waterJar,
  workTable,
} from './villageWorkshop';

type UncollidedBuilder = (parts: Parts, frame: PropFrame, container: THREE.Object3D) => void;

interface Matched<B> {
  readonly pattern: RegExp;
  readonly build: B;
}

const onFirstCollider =
  (build: (parts: Parts, frame: PropFrame) => void): PropBuilder =>
  (parts, container) =>
    build(parts, firstCollider(container));

const BUILDERS: readonly Matched<PropBuilder>[] = [
  { pattern: /^gizmoPhysicalDynamic$/, build: (_parts, container) => placeGamepad(container) },
  { pattern: /^blackBoardPhysicalDynamic/, build: slateBoards },
  { pattern: /^grinderPhysicalDynamic$/, build: grinderStand },
  {
    pattern: /^(main|side)TablePhysicalDynamic/,
    build: (parts, container) => candleSticks(parts, container, workTable(parts, firstCollider(container))),
  },
  { pattern: /^quenchPhysicalDynamic/, build: onFirstCollider(waterJar) },
  { pattern: /^refAnvilPhysicalDynamic$/, build: onFirstCollider(anvil) },
  { pattern: /^refOvenPhysicalDynamic$/, build: onFirstCollider(hwaro) },
  { pattern: /^cauldronPhysicalDynamic$/, build: gamasot },
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
  { pattern: /^refTvPhysicalDynamic$/, build: tvCabinet },
  { pattern: /^blowerPhysicalDynamic/, build: onFirstCollider(bellowsBase) },
  { pattern: /^refPinPhysicalDynamic$/, build: bowlingPin },
  { pattern: /^refBallPhysicalDynamic$/, build: onFirstCollider(beachBall) },
];

const UNCOLLIDED_BUILDERS: readonly Matched<UncollidedBuilder>[] = [
  { pattern: /^sword$/, build: surfFlag },
  { pattern: /^Cube006$/, build: badukBoard },
  { pattern: /^Cylinder$/, build: watermelonTray },
  { pattern: /^Plane005$/, build: dotjari },
  { pattern: /^refPillar$/, build: stonePillar },
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
