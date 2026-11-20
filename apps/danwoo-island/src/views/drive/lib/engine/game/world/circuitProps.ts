import * as THREE from 'three/webgpu';

import { type Parts, seededRandom } from '@views/drive/lib/engine/game/world/islandGeometry';
import type { PartName } from '@views/drive/lib/engine/game/world/islandMaterials';
import {
  collidersOf,
  lathe,
  type PropFrame,
  rebuildChild,
  scaleProfile,
} from '@views/drive/lib/engine/game/world/villageKit';

export const SIDES = [-1, 1] as const;
const CIRCUIT_OBJECT = /^refObjectsPhysicalDynamic/;
const CIRCUIT_OBSTACLE = /^refObstaclesPhysicalKinematicPositionBased/;

const STRAW_BALE_DESIGN = {
  bodyRadiusRatio: 0.97,
  bodyWidthRatio: 0.96,
  bodyDepthRatio: 0.96,
  ropeThickness: 0.06,
  ropeThicknessRatio: 0.12,
  ropeOffsets: [-0.3, 0.3],
  segments: 10,
} as const;

function strawBale(parts: Parts, frame: PropFrame): void {
  const { size, matrix, radius, height } = frame;
  const design = STRAW_BALE_DESIGN;
  if (frame.isTube) {
    const ropeThickness = Math.min(design.ropeThickness, height * design.ropeThicknessRatio);
    const bodyRadius = radius * design.bodyRadiusRatio;
    parts.prism('thatch', bodyRadius, bodyRadius, height, { matrix }, design.segments);
    for (const y of design.ropeOffsets) {
      parts.prism(
        'thatchRope',
        radius,
        radius,
        ropeThickness,
        { position: [0, height * y, 0], matrix },
        design.segments,
      );
    }
    return;
  }
  const ropeThickness = Math.min(design.ropeThickness, size.x * design.ropeThicknessRatio);
  parts.box('thatch', [size.x * design.bodyWidthRatio, size.y, size.z * design.bodyDepthRatio], { matrix });
  for (const x of design.ropeOffsets) {
    parts.box('thatchRope', [ropeThickness, size.y, size.z], { position: [size.x * x, 0, 0], matrix });
  }
}

const BIG_DOK_DESIGN = {
  profile: [
    [0, 0],
    [0.65, 0],
    [0.8, 0.1],
    [0.85, 0.18],
    [0.89, 0.22],
    [0.86, 0.25],
    [0.94, 0.32],
    [0.9, 0.35],
    [0.94, 0.42],
    [0.9, 0.45],
    [0.94, 0.52],
    [0.9, 0.55],
    [0.94, 0.62],
    [0.9, 0.65],
    [0.94, 0.72],
    [0.9, 0.8],
    [0.84, 0.92],
    [0, 0.92],
  ],
  lidTopRadiusRatio: 0.78,
  lidBottomRadiusRatio: 0.9,
  lidHeightRatio: 0.08,
  lidLevel: 0.96,
  bands: [
    { radiusRatio: 0.86, level: 0.18 },
    { radiusRatio: 0.95, level: 0.76 },
  ],
  bandHeightRatio: 0.06,
  segments: 12,
} as const;

function bigDok(parts: Parts, { radius, height, matrix }: PropFrame): void {
  const design = BIG_DOK_DESIGN;
  const bottom = -height / 2;
  lathe(parts, 'bamboo', scaleProfile(design.profile, { radius, bottom, height }), { matrix }, design.segments);
  parts.prism(
    'thatch',
    radius * design.lidTopRadiusRatio,
    radius * design.lidBottomRadiusRatio,
    height * design.lidHeightRatio,
    { position: [0, bottom + height * design.lidLevel, 0], matrix },
    design.segments,
  );
  for (const band of design.bands) {
    const bandRadius = radius * band.radiusRatio;
    parts.prism(
      'palmLeaf',
      bandRadius,
      bandRadius,
      height * design.bandHeightRatio,
      { position: [0, bottom + height * band.level, 0], matrix },
      design.segments,
    );
  }
}

const BATDAM = { rows: 3, stoneLength: 0.62, seed: 17 } as const;

function batdam(parts: Parts, container: THREE.Object3D): void {
  const random = seededRandom(BATDAM.seed);
  for (const { size, matrix } of collidersOf(container)) {
    const rowHeight = size.y / BATDAM.rows;
    const count = Math.max(2, Math.round(size.z / BATDAM.stoneLength));
    const length = size.z / count;
    for (let row = 0; row < BATDAM.rows; row += 1) {
      const y = -size.y / 2 + rowHeight * (row + 0.5);
      for (let index = 0; index < count; index += 1) {
        const z = -size.z / 2 + length * (index + 0.5) + (row % 2) * length * 0.25;
        const name: PartName = random() > 0.5 ? 'basalt' : 'basaltDark';
        const width = size.x * (0.8 + random() * 0.2);
        const height = rowHeight * (0.85 + random() * 0.2);
        const rotation = [random() * 0.2 - 0.1, random() * 0.3 - 0.15, random() * 0.2 - 0.1] as const;
        parts.box(name, [width, height, length * 0.92], {
          position: [0, y, Math.min(z, size.z / 2 - length * 0.45)],
          rotation,
          matrix,
        });
      }
    }
  }
}

function circuitFiller(parts: Parts, container: THREE.Object3D): void {
  const [frame] = collidersOf(container);
  if (!frame) return;
  const isBigTube = frame.isTube && frame.radius > 0.5;
  if (isBigTube) bigDok(parts, frame);
  else strawBale(parts, frame);
}

export function rebuildCircuitObjects(model: THREE.Object3D): void {
  for (const child of [...model.children]) {
    if (CIRCUIT_OBJECT.test(child.name)) rebuildChild(child, { build: circuitFiller });
    else if (CIRCUIT_OBSTACLE.test(child.name)) rebuildChild(child, { build: batdam });
  }
}
