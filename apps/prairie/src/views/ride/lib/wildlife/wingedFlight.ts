import { RIVER_TRENCH_HALF_WIDTH } from '@views/ride/config/scene';
import {
  WINGED_DRAGONFLY_OFFSHORE,
  WINGED_SCALE,
  WINGED_WING_DISC,
  type WingedKind,
} from '@views/ride/config/wingedLife';
import {
  coastDistanceAt,
  distanceToRiver,
  nearestRiverX,
  riverWidthAt,
  terrainHeightAt,
} from '@views/ride/lib/scene/terrain';
import { colors } from '@views/ride/lib/wildlife/wingedLife';
import { habitatSeed, type CreatureState } from '@views/ride/model/wildlife/behavior';
import type { BufferGeometry, InstancedMesh, Object3D } from 'three';

export type Anchor = readonly [number, number, number];

export interface Home {
  x: number;
  y: number;
  z: number;
}

interface Point3 {
  x: number;
  y: number;
  z: number;
}

const GOLDEN_ANGLE = 2.39996;
const HABITAT_CELL = 96;
const RECYCLE_DISTANCE = 150;
const HABITAT_SPREAD = 180;

export function isOffshoreDragonfly(kind: WingedKind, anchor: Anchor | undefined, rider: Point3): boolean {
  return !anchor && kind === 'dragonfly' && coastDistanceAt(rider.x, rider.z) > WINGED_DRAGONFLY_OFFSHORE;
}

export function shapeInsectWing(geometry: BufferGeometry, kind: WingedKind): void {
  const { flatten, offsetX } = WINGED_WING_DISC;
  geometry.rotateX(-Math.PI / 2);
  geometry.scale(1, 1, kind === 'dragonfly' ? flatten.dragonfly : flatten.other);
  geometry.translate(offsetX, 0, 0);
}

export function anchorHome(home: Home, kind: WingedKind, anchor: Anchor, index: number): void {
  const a = index * GOLDEN_ANGLE;
  const spread = kind === 'bird' ? 7 + (index % 5) : 3 + (index % 9);
  home.x = anchor[0] + Math.cos(a) * spread;
  home.z = anchor[2] + Math.sin(a) * spread;
  home.y = kind === 'bird' ? anchor[1] : terrainHeightAt(home.x, home.z);
}

function needsRecycle(home: Home, rider: Point3): boolean {
  return !Number.isFinite(home.x) || Math.hypot(home.x - rider.x, home.z - rider.z) > RECYCLE_DISTANCE;
}

function recycleHome(home: Home, kind: WingedKind, rider: Point3, index: number): void {
  const cx = Math.round(rider.x / HABITAT_CELL),
    cz = Math.round(rider.z / HABITAT_CELL);
  home.x = cx * HABITAT_CELL + (habitatSeed(cx, cz, index) - 0.5) * HABITAT_SPREAD;
  home.z = cz * HABITAT_CELL + (habitatSeed(cx, cz, index + 32) - 0.5) * HABITAT_SPREAD;
  if (kind === 'dragonfly')
    home.x =
      nearestRiverX(rider.x, home.z) +
      (index % 2 ? 1 : -1) * (RIVER_TRENCH_HALF_WIDTH + 1 + (index % 4)) * riverWidthAt(home.z);
  else if (distanceToRiver(home.x, home.z) < RIVER_TRENCH_HALF_WIDTH + 5)
    home.x = nearestRiverX(home.x, home.z) - (RIVER_TRENCH_HALF_WIDTH + 12) * riverWidthAt(home.z);
  home.z -= Math.max(0, coastDistanceAt(home.x, home.z) + 30);
  home.y = terrainHeightAt(home.x, home.z);
}

export function settleHome(
  home: Home,
  state: CreatureState,
  kind: WingedKind,
  anchor: Anchor | undefined,
  rider: Point3,
  index: number,
): void {
  if (anchor) {
    anchorHome(home, kind, anchor, index);
    return;
  }
  if (!needsRecycle(home, rider)) return;
  recycleHome(home, kind, rider, index);
  state.alert = 0;
  state.rest = 0;
}

export function riderDistance(rider: Point3, home: Home): number {
  return Math.hypot(rider.x - home.x, rider.y - home.y, rider.z - home.z);
}

interface Flight {
  x: number;
  y: number;
  z: number;
  phase: number;
}

function flightAt(
  kind: WingedKind,
  anchor: Anchor | undefined,
  home: Home,
  alert: number,
  t: number,
  i: number,
): Flight {
  const isAnchoredBird = !!anchor && kind === 'bird';
  const orbit = isAnchoredBird ? 3 : 0.4 + alert * 3;
  const phase = t * (kind === 'dragonfly' ? 1.6 : 0.5) + i * 2.4;
  let y = home.y + 0.4 + alert * 5;
  if (isAnchoredBird) y = home.y + Math.sin(phase) * 1.4 + alert * 3;
  if (kind !== 'bird') y = home.y + 0.8 + Math.sin(phase * 2) * 0.35 + alert * 2.8;
  return { x: home.x + Math.cos(phase) * orbit, y, z: home.z + Math.sin(phase) * orbit, phase };
}

function flapAt(kind: WingedKind, anchor: Anchor | undefined, alert: number, t: number, i: number): number {
  const isCalmPerchedBird = kind === 'bird' && !anchor && alert < 0.05;
  return Math.sin(t * (kind === 'dragonfly' ? 65 : 18) + i) * (isCalmPerchedBird ? 0.08 : 0.9);
}

export function placeWingedLife(
  meshes: { wings: InstancedMesh; bodies: InstancedMesh },
  d: Object3D,
  options: { kind: WingedKind; anchor: Anchor | undefined; wingCount: number },
  home: Home,
  alert: number,
  t: number,
  i: number,
): void {
  const { kind, anchor, wingCount } = options;
  const { x, y, z, phase } = flightAt(kind, anchor, home, alert, t, i);
  const scale = WINGED_SCALE[kind];
  const flap = flapAt(kind, anchor, alert, t, i);
  d.position.set(x, y, z);
  d.rotation.set(0, -phase, 0);
  d.scale.set(scale * 0.14, scale * 0.16, scale * 0.7);
  d.updateMatrix();
  meshes.bodies.setMatrixAt(i, d.matrix);
  for (let wing = 0; wing < wingCount; wing++) {
    const side = wing % 2;
    const back = wing >= 2;
    d.position.set(x + Math.sin(phase) * (back ? 0.12 : 0), y, z - Math.cos(phase) * (back ? 0.12 : 0));
    d.rotation.set(0, -phase + side * Math.PI, flap * (side ? -1 : 1));
    d.scale.setScalar(scale * (back ? 0.75 : 1));
    d.updateMatrix();
    meshes.wings.setMatrixAt(i * wingCount + wing, d.matrix);
    meshes.wings.setColorAt(i * wingCount + wing, kind === 'butterfly' ? colors[i % colors.length]! : colors[3]!);
  }
}
