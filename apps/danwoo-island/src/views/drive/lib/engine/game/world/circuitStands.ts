import { CIRCUIT_DECORATION, SIDES, TENT_CANOPY } from '@views/drive/lib/engine/game/world/circuitDecorationConfig';
import type { Parts, Triple } from '@views/drive/lib/engine/game/world/islandGeometry';
import type { PartName } from '@views/drive/lib/engine/game/world/islandMaterials';
import { islandModelMesh } from '@views/drive/lib/engine/game/world/islandModels';
import * as THREE from 'three/webgpu';

const DANCER_CHEST = {
  bodySize: [1.2, 0.9, 1.2] satisfies Triple,
  bodyY: -0.5,
  lidSize: [1.3, 0.12, 1.3] satisfies Triple,
  lidY: -0.02,
  baseSize: [1.32, 0.12, 1.32] satisfies Triple,
  baseY: -0.9,
  strapSize: [1.22, 0.76, 0.06] satisfies Triple,
  strapOffset: 0.33,
  claspSize: [0.05, 0.18, 0.22] satisfies Triple,
  claspX: 0.615,
  claspY: -0.4,
} as const;
export function dancerChest(parts: Parts): void {
  const style = DANCER_CHEST;
  for (const [x, z] of CIRCUIT_DECORATION.dancerBases) {
    parts.box('coconutShell', style.bodySize, { position: [x, style.bodyY, z] });
    parts.box('bunting1', style.lidSize, { position: [x, style.lidY, z] });
    parts.box('sand', style.baseSize, { position: [x, style.baseY, z] });
    for (const side of SIDES) {
      parts.box('bunting3', style.strapSize, { position: [x, style.bodyY, z + side * style.strapOffset] });
    }
    parts.box('bunting2', style.claspSize, { position: [x + style.claspX, style.claspY, z] });
  }
}
const BANNER_STAND = {
  baseSize: [1.2, 0.2, 1.2] satisfies Triple,
  baseY: -0.9,
  collarSize: [0.5, 0.16, 0.5] satisfies Triple,
  collarY: -0.72,
  shaftTopRadius: 0.07,
  shaftBottomRadius: 0.08,
  shaftHeight: 1.35,
  shaftY: -0.14,
  crossbarRadius: 0.04,
  crossbarLength: 0.52,
  crossbarY: 0.42,
  crossbarRotation: Math.PI / 2,
  flagSize: [0.025, 0.52, 0.42] satisfies Triple,
  flagX: 0.06,
  flagY: 0.14,
  hemSize: [0.027, 0.06, 0.42] satisfies Triple,
  hemY: -0.09,
  sides: 6,
  shades: ['bunting2', 'bunting1'] satisfies readonly PartName[],
} as const;
export function bannerStand(parts: Parts): void {
  const style = BANNER_STAND;
  for (const [index, [x, z]] of CIRCUIT_DECORATION.bannerStands.entries()) {
    parts.box('sand', style.baseSize, { position: [x, style.baseY, z] });
    parts.box('bunting1', style.collarSize, { position: [x, style.collarY, z] });
    parts.prism(
      'bamboo',
      style.shaftTopRadius,
      style.shaftBottomRadius,
      style.shaftHeight,
      { position: [x, style.shaftY, z] },
      style.sides,
    );
    parts.prism(
      'bamboo',
      style.crossbarRadius,
      style.crossbarRadius,
      style.crossbarLength,
      { position: [x, style.crossbarY, z], rotation: [style.crossbarRotation, 0, 0] },
      style.sides,
    );
    parts.box(style.shades[index % style.shades.length] ?? 'bunting2', style.flagSize, {
      position: [x + style.flagX, style.flagY, z],
    });
    parts.box('bunting3', style.hemSize, { position: [x + style.flagX, style.hemY, z] });
  }
}
const TENT_POLE = {
  topRadius: 0.07,
  bottomRadius: 0.09,
  bindingRadiusRatio: 0.98,
  bindingHeight: 0.06,
  bindingHeightRatio: 0.12,
  bindingLevel: 0.6,
  sides: 6,
} as const;
export function tentPole(parts: Parts, box: THREE.Box3): void {
  const style = TENT_POLE;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const height = box.max.y - box.min.y;
  const radius = Math.min(style.bottomRadius, size.x / 2, size.z / 2);
  const topRadius = (radius * style.topRadius) / style.bottomRadius;
  const bindingRadius = radius * style.bindingRadiusRatio;
  const bindingHeight = Math.min(style.bindingHeight, height * style.bindingHeightRatio);
  parts.prism('bamboo', topRadius, radius, height, { position: [center.x, center.y, center.z] }, style.sides);
  parts.prism(
    'thatchRope',
    bindingRadius,
    bindingRadius,
    bindingHeight,
    { position: [center.x, box.min.y + height * style.bindingLevel, center.z] },
    style.sides,
  );
}
function replaceTentCanopy(canopy: THREE.Mesh): void {
  canopy.geometry.computeBoundingBox();
  const box = canopy.geometry.boundingBox;
  if (!box) return;
  if (!canopy.parent) return;
  canopy.updateMatrix();
  const matrix = canopy.matrix
    .clone()
    .multiply(new THREE.Matrix4().makeTranslation(box.getCenter(new THREE.Vector3())));
  canopy.parent.add(islandModelMesh('beachCanopy', matrix, box.getSize(new THREE.Vector3())));
  canopy.removeFromParent();
}

export function rebuildTentCanopies(model: THREE.Object3D): void {
  const canopies: THREE.Mesh[] = [];
  model.traverse((child) => {
    const isCanopy = child instanceof THREE.Mesh && TENT_CANOPY.test(child.name);
    if (isCanopy) canopies.push(child);
  });
  for (const canopy of canopies) replaceTentCanopy(canopy);
}
