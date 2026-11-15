import * as THREE from 'three/webgpu';

import type { Parts } from './islandGeometry';
import { islandModelMesh } from './islandModels';
import { collidersOf, firstCollider, lathe, type PropFrame, referenceCenter } from './villageKit';

const SIDES = [-1, 1] as const;

const GAMEPAD_SIZE = new THREE.Vector3(1.62, 0.54, 1.28);

export function placeGamepad(container: THREE.Object3D): void {
  const { size, matrix } = firstCollider(container);
  const resting = matrix.clone().multiply(new THREE.Matrix4().makeTranslation(0, (GAMEPAD_SIZE.y - size.y) / 2, 0));
  container.add(islandModelMesh('gamepad', resting, GAMEPAD_SIZE));
}

const SURF_FLAG = { width: 1.2, height: 3.2, depth: 0.4, poleX: -0.5 } as const;

export function surfFlag(_parts: Parts, { size, matrix }: PropFrame, container: THREE.Object3D): void {
  const scale = size.y / SURF_FLAG.height;
  const anchored = matrix.clone().multiply(new THREE.Matrix4().makeTranslation(-SURF_FLAG.poleX * scale, 0, 0));
  const flagSize = new THREE.Vector3(SURF_FLAG.width * scale, size.y, SURF_FLAG.depth * scale);
  container.add(islandModelMesh('surfFlag', anchored, flagSize));
}

export function slateBoards(parts: Parts, container: THREE.Object3D): void {
  for (const { size, matrix } of collidersOf(container)) {
    parts.box('slate', [size.x * 0.7, size.y * 0.86, size.z * 0.9], { matrix });
    parts.box('wood', [size.x * 0.8, 0.08, size.z], { position: [0, size.y * 0.45, 0], matrix });
    parts.box('wood', [size.x * 0.8, 0.08, size.z], { position: [0, -size.y * 0.45, 0], matrix });
  }
}

const GRINDER_WHEEL = { halfWidth: 1.01, axleZ: 0.37, bottom: -0.96 } as const;

export function grinderStand(parts: Parts): void {
  const { halfWidth, axleZ, bottom } = GRINDER_WHEEL;
  for (const side of SIDES) {
    parts.box('woodDark', [0.18, -bottom, 0.22], { position: [side * (halfWidth + 0.14), bottom / 2, axleZ] });
  }
  parts.box('wood', [halfWidth * 2 + 0.6, 0.22, 1.4], { position: [0, bottom + 0.11, axleZ] });
  parts.rod('iron', 0.05, [-(halfWidth + 0.24), 0, axleZ], [halfWidth + 0.24, 0, axleZ], 8);
}

const WORK_TABLE_DESIGN = {
  topThickness: 0.12,
  topHeightRatio: 0.15,
  apronThickness: 0.14,
  apronHeightRatio: 0.18,
  apronWidthRatio: 0.9,
  apronDepthRatio: 0.92,
  legWidth: 0.12,
  legWidthRatio: 0.16,
  legInset: 0.1,
  legInsetRatio: 0.2,
} as const;

export function workTable(parts: Parts, { size, matrix }: PropFrame): number {
  const design = WORK_TABLE_DESIGN;
  const top = size.y / 2;
  const topThickness = Math.min(design.topThickness, size.y * design.topHeightRatio);
  const apronThickness = Math.min(design.apronThickness, size.y * design.apronHeightRatio);
  const legWidth = Math.min(design.legWidth, size.x * design.legWidthRatio, size.z * design.legWidthRatio);
  const insetX = Math.max(legWidth / 2, Math.min(design.legInset, size.x * design.legInsetRatio));
  const insetZ = Math.max(legWidth / 2, Math.min(design.legInset, size.z * design.legInsetRatio));

  parts.box('wood', [size.x, topThickness, size.z], { position: [0, top - topThickness / 2, 0], matrix });
  parts.box('woodDark', [size.x * design.apronWidthRatio, apronThickness, size.z * design.apronDepthRatio], {
    position: [0, top - topThickness - apronThickness / 2, 0],
    matrix,
  });
  for (const x of SIDES) {
    for (const z of SIDES) {
      parts.box('woodDark', [legWidth, size.y - topThickness, legWidth], {
        position: [x * (size.x / 2 - insetX), -topThickness / 2, z * (size.z / 2 - insetZ)],
        matrix,
      });
    }
  }
  return new THREE.Vector3().setFromMatrixPosition(matrix).y + top;
}

const CANDLE_STICKS_DESIGN = {
  minimumHeight: 0.05,
  topRadius: 0.032,
  bottomRadius: 0.038,
  shellRadius: 0.045,
  shellHeight: 0.02,
  shellHeightRatio: 0.18,
  shellProfile: [
    [0, 0],
    [0.65, 0],
    [1, 0.45],
    [0.9, 1],
    [0.7, 0.8],
    [0, 0.35],
  ],
  segments: 8,
} as const;

export function candleSticks(parts: Parts, container: THREE.Object3D, tableTop: number): void {
  const design = CANDLE_STICKS_DESIGN;
  for (const { center, bottom } of referenceCenter(container, /^refCandleFlame/)) {
    const height = Math.max(design.minimumHeight, bottom - tableTop);
    const shellHeight = Math.min(design.shellHeight, height * design.shellHeightRatio);
    parts.prism(
      'bamboo',
      design.topRadius,
      design.bottomRadius,
      height,
      { position: [center.x, tableTop + height / 2, center.z] },
      design.segments,
    );
    lathe(
      parts,
      'sand',
      design.shellProfile.map(([radius, y]) => [radius * design.shellRadius, tableTop + y * shellHeight] as const),
      { position: [center.x, 0, center.z] },
      design.segments,
    );
  }
}

const ANVIL_DESIGN = {
  stumpRadiusRatio: 0.4,
  stumpTopRatio: 0.84,
  stumpHeightRatio: 0.56,
  headWidthRatio: 0.5,
  headHeightRatio: 0.3,
  headDepthRatio: 0.62,
  headLevel: 0.71,
  hornTipWidthRatio: 0.025,
  hornTipHeightRatio: 0.04,
  hornBaseWidthRatio: 0.16,
  hornBaseHeightRatio: 0.13,
  hornLengthRatio: 0.32,
  hornLevel: 0.74,
  hornDepthRatio: 0.31,
  hornRotation: Math.PI / 2,
  stumpSegments: 10,
  hornSegments: 8,
} as const;

export function anvil(parts: Parts, { size, matrix }: PropFrame): void {
  const design = ANVIL_DESIGN;
  const bottom = -size.y / 2;
  const stumpHeight = size.y * design.stumpHeightRatio;
  const stumpRadius = Math.min(size.x, size.z) * design.stumpRadiusRatio;

  parts.prism(
    'timber',
    stumpRadius * design.stumpTopRatio,
    stumpRadius,
    stumpHeight,
    { position: [0, bottom + stumpHeight / 2, 0], matrix },
    design.stumpSegments,
  );
  parts.box('iron', [size.x * design.headWidthRatio, size.y * design.headHeightRatio, size.z * design.headDepthRatio], {
    position: [0, bottom + size.y * design.headLevel, 0],
    matrix,
  });
  parts.prism(
    'iron',
    Math.min(size.x * design.hornTipWidthRatio, size.y * design.hornTipHeightRatio),
    Math.min(size.x * design.hornBaseWidthRatio, size.y * design.hornBaseHeightRatio),
    size.z * design.hornLengthRatio,
    {
      position: [0, bottom + size.y * design.hornLevel, size.z * design.hornDepthRatio],
      rotation: [design.hornRotation, 0, 0],
      matrix,
    },
    design.hornSegments,
  );
}

const ISLAND_BELLOWS = {
  bodyWidthRatio: 0.92,
  bodyDepthRatio: 0.92,
  bodyHeight: 0.2,
  runnerWidth: 0.14,
  runnerWidthRatio: 0.16,
  runnerHeight: 0.08,
  runnerHeightRatio: 0.3,
  runnerDepthRatio: 0.96,
  runnerSpread: 0.36,
  bodyLiftRatio: 0.75,
} as const;

export function bellowsBase(parts: Parts, { size, matrix }: PropFrame): void {
  const design = ISLAND_BELLOWS;
  const bottom = -size.y / 2;
  const runnerHeight = Math.min(design.runnerHeight, size.y * design.runnerHeightRatio);
  const bodyLift = runnerHeight * design.bodyLiftRatio;
  const bodyHeight = Math.min(design.bodyHeight, size.y - bodyLift);

  parts.box('coconutShell', [size.x * design.bodyWidthRatio, bodyHeight, size.z * design.bodyDepthRatio], {
    position: [0, bottom + bodyLift + bodyHeight / 2, 0],
    matrix,
  });
  for (const side of SIDES) {
    parts.box(
      'bamboo',
      [Math.min(design.runnerWidth, size.x * design.runnerWidthRatio), runnerHeight, size.z * design.runnerDepthRatio],
      { position: [side * size.x * design.runnerSpread, bottom + runnerHeight / 2, 0], matrix },
    );
  }
}
