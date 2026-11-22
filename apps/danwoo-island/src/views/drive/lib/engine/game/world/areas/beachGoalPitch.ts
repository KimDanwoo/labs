import * as THREE from 'three/webgpu';

import { GOAL, PITCH } from '@views/drive/lib/engine/game/world/areas/beachGoalRules';
import { createParts, QUARTER_TURN, type Parts, type Triple } from '@views/drive/lib/engine/game/world/islandGeometry';

const PITCH_NAME = 'beachGoalPitchPhysicalFixed';
const LINE = { width: 0.2, thickness: 0.03, lift: 0.015, circleRadius: 1.8, circleSegments: 32 } as const;
const FRAME = { radius: 0.12, sides: 6, backHeight: 2.1, collider: 0.24, netCollider: 0.1 } as const;
const NET = { radius: 0.025, sides: 4, step: 0.5 } as const;
const KERB = { radius: 0.18, sides: 5, endX: 8, gap: 0.55 } as const;

const GROUND = PITCH.groundY;
const FRONT_X = PITCH.goalLineX;
const BACK_X = PITCH.goalLineX - GOAL.depth;
const TOP = GROUND + GOAL.height;
const BACK_TOP = GROUND + FRAME.backHeight;
const SIDES = [PITCH.centerZ - GOAL.halfWidth, PITCH.centerZ + GOAL.halfWidth] as const;

function steps(from: number, to: number): number[] {
  const count = Math.max(1, Math.round(Math.abs(to - from) / NET.step));
  return Array.from({ length: count + 1 }, (_, index) => from + ((to - from) * index) / count);
}

function lineBox(parts: Parts, [minX, maxX]: readonly [number, number], [minZ, maxZ]: readonly [number, number]): void {
  const size: Triple = [Math.max(maxX - minX, LINE.width), LINE.thickness, Math.max(maxZ - minZ, LINE.width)];
  parts.box('bunting1', size, { position: [(minX + maxX) / 2, GROUND + LINE.lift, (minZ + maxZ) / 2] });
}

function pitchLines(parts: Parts): void {
  const left = PITCH.centerZ - PITCH.halfWidth;
  const right = PITCH.centerZ + PITCH.halfWidth;
  const length: readonly [number, number] = [FRONT_X, PITCH.endX];
  lineBox(parts, length, [left, left]);
  lineBox(parts, length, [right, right]);
  for (const x of [FRONT_X, PITCH.halfwayX, PITCH.endX]) lineBox(parts, [x, x], [left, right]);
  const ring = new THREE.RingGeometry(
    LINE.circleRadius - LINE.width / 2,
    LINE.circleRadius + LINE.width / 2,
    LINE.circleSegments,
  );
  parts.add('bunting1', ring, {
    rotation: [-QUARTER_TURN, 0, 0],
    position: [PITCH.halfwayX, GROUND + LINE.lift + LINE.thickness / 2, PITCH.centerZ],
  });
}

function goalFrame(parts: Parts): void {
  const rod = (from: Triple, to: Triple): void => parts.rod('bamboo', FRAME.radius, from, to, FRAME.sides);
  for (const z of SIDES) {
    rod([FRONT_X, GROUND, z], [FRONT_X, TOP, z]);
    rod([BACK_X, GROUND, z], [BACK_X, BACK_TOP, z]);
    rod([FRONT_X, TOP, z], [BACK_X, BACK_TOP, z]);
    rod([FRONT_X, GROUND, z], [BACK_X, GROUND, z]);
  }
  const [near, far] = SIDES;
  rod([FRONT_X, TOP, near], [FRONT_X, TOP, far]);
  rod([BACK_X, BACK_TOP, near], [BACK_X, BACK_TOP, far]);
  rod([BACK_X, GROUND, near], [BACK_X, GROUND, far]);
}

function roofHeight(x: number): number {
  return BACK_TOP + ((x - BACK_X) / (FRONT_X - BACK_X)) * (TOP - BACK_TOP);
}

function goalNet(parts: Parts): void {
  const strand = (from: Triple, to: Triple): void => parts.rod('bunting4', NET.radius, from, to, NET.sides);
  const [near, far] = SIDES;
  for (const z of steps(near, far)) {
    strand([BACK_X, GROUND, z], [BACK_X, BACK_TOP, z]);
    strand([BACK_X, BACK_TOP, z], [FRONT_X, TOP, z]);
  }
  for (const y of steps(GROUND, BACK_TOP)) strand([BACK_X, y, near], [BACK_X, y, far]);
  for (const x of steps(BACK_X, FRONT_X)) {
    strand([x, roofHeight(x), near], [x, roofHeight(x), far]);
    for (const z of SIDES) strand([x, GROUND, z], [x, roofHeight(x), z]);
  }
  for (const y of steps(GROUND, BACK_TOP)) {
    for (const z of SIDES) strand([BACK_X, y, z], [FRONT_X, y, z]);
  }
}

function kerbZs(): readonly number[] {
  const offset = PITCH.halfWidth + KERB.gap;
  return [PITCH.centerZ - offset, PITCH.centerZ + offset];
}

function kerbs(parts: Parts): void {
  for (const z of kerbZs()) {
    parts.rod(
      'woodDark',
      KERB.radius,
      [FRONT_X, GROUND + KERB.radius, z],
      [KERB.endX, GROUND + KERB.radius, z],
      KERB.sides,
    );
  }
}

function cuboid(name: string, size: Triple, position: Triple): THREE.Object3D {
  const collider = new THREE.Object3D();
  collider.name = `cuboid${name}`;
  collider.scale.set(...size);
  collider.position.set(...position);
  return collider;
}

function goalColliders(): THREE.Object3D[] {
  const middleX = (FRONT_X + BACK_X) / 2;
  const middleY = GROUND + GOAL.height / 2;
  const width = GOAL.halfWidth * 2;
  const { collider, netCollider } = FRAME;
  return [
    ...SIDES.map((z) => cuboid('Post', [collider, GOAL.height, collider], [FRONT_X, middleY, z])),
    ...SIDES.map((z) => cuboid('SideNet', [GOAL.depth, GOAL.height, netCollider], [middleX, middleY, z])),
    cuboid('Crossbar', [collider, collider, width], [FRONT_X, TOP, PITCH.centerZ]),
    cuboid('BackNet', [netCollider, GOAL.height, width], [BACK_X, middleY, PITCH.centerZ]),
    cuboid('Roof', [GOAL.depth, netCollider, width], [middleX, TOP, PITCH.centerZ]),
  ];
}

function kerbColliders(): THREE.Object3D[] {
  const length = KERB.endX - FRONT_X;
  const size = KERB.radius * 2;
  return kerbZs().map((z) =>
    cuboid('Kerb', [length, size, size], [(FRONT_X + KERB.endX) / 2, GROUND + KERB.radius, z]),
  );
}

export function addBeachGoalPitch(model: THREE.Object3D): void {
  const parts = createParts();
  pitchLines(parts);
  goalFrame(parts);
  goalNet(parts);
  kerbs(parts);
  const pitch = new THREE.Object3D();
  pitch.name = PITCH_NAME;
  pitch.add(parts.build(), ...goalColliders(), ...kerbColliders());
  model.add(pitch);
}
