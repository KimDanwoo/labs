import * as THREE from 'three/webgpu';

import type { Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import {
  collidersOf,
  firstCollider,
  lathe,
  type PropFrame,
  referenceCenter,
} from '@views/drive/lib/engine/game/world/villageKit';

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
