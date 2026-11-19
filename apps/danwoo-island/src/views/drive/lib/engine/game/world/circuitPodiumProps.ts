import * as THREE from 'three/webgpu';
import { SIDES } from './circuitProps';
import { type Parts, createParts } from './islandGeometry';
import type { PartName } from './islandMaterials';
import { type PropFrame, collidersOf } from './villageKit';

const PODIUM = /^refPodiumPhysicalFixed/;
const PODIUM_BACKDROP = {
  front: -1.53,
  back: -1.58,
  bottom: -1,
  top: 3.53,
  halfDepth: 3.87,
  frame: 0.12,
  postWidth: 0.24,
  postFrontOffset: -0.08,
  postExtraHeight: 0.2,
  bindingWidth: 0.245,
  bindingHeight: 0.08,
  bindingTopInset: 0.25,
  roofCenterOffset: -0.1,
  roofRise: 0.26,
  roofHalfOffset: 0.2,
  roofSlopeWidth: 0.46,
  roofThickness: 0.08,
  roofAngle: Math.PI / 7,
  roofDepthOverhang: 0.58,
  ridgeWidth: 0.16,
  ridgeHeight: 0.1,
  ridgeRise: 0.4,
  ridgeDepthOverhang: 0.64,
} as const;
const PODIUM_RANK_MARK = {
  width: 0.5,
  height: 0.08,
  gap: 0.16,
  availableHeightRatio: 0.6,
  topInset: 0.3,
  topInsetRatio: 0.3,
  widthRatio: 0.7,
  frontRecess: 0.024,
  frontRecessRatio: 0.06,
  depth: 0.02,
  depthRatio: 0.8,
  capHeight: 0.1,
  baseHeight: 0.06,
  baseHeightRatio: 0.1,
  shades: ['bunting3', 'bunting2', 'bunting4'] satisfies readonly PartName[],
} as const;
function podiumStep(parts: Parts, { size, matrix }: PropFrame, rank: number): void {
  const style = PODIUM_RANK_MARK;
  const top = size.y / 2;
  const bottom = -size.y / 2;
  const recess = Math.min(style.frontRecess, size.x * style.frontRecessRatio);
  const bodyWidth = size.x - recess;
  const bodyX = -recess / 2;
  const capHeight = Math.min(style.capHeight, size.y);
  const baseHeight = Math.min(style.baseHeight, size.y * style.baseHeightRatio);
  const gap = Math.min(style.gap, (size.y * style.availableHeightRatio) / Math.max(rank, 1));
  const markHeight = Math.min(style.height, gap / 2);
  const markWidth = Math.min(style.width, size.z * style.widthRatio);
  const markDepth = Math.min(style.depth, recess * style.depthRatio);
  const topInset = Math.min(style.topInset, size.y * style.topInsetRatio);
  const shade = style.shades[Math.max(0, Math.min(rank - 1, style.shades.length - 1))] ?? 'bunting4';

  parts.box('sand', [bodyWidth, size.y, size.z], { position: [bodyX, 0, 0], matrix });
  parts.box('bunting1', [size.x, capHeight, size.z], { position: [0, top - capHeight / 2, 0], matrix });
  parts.box('coconutShell', [bodyWidth, baseHeight, size.z], { position: [bodyX, bottom + baseHeight / 2, 0], matrix });
  for (let index = 0; index < rank; index += 1) {
    parts.box(shade, [markDepth, markHeight, markWidth], {
      position: [size.x / 2 - markDepth / 2, top - topInset - index * gap, 0],
      matrix,
    });
  }
}
function podiumBackdrop(parts: Parts): void {
  const style = PODIUM_BACKDROP;
  const { front, back, bottom, top, halfDepth, frame } = style;
  const postHeight = top - bottom + style.postExtraHeight;
  const roofCenterX = front + style.roofCenterOffset;
  const roofPanelDepth = (halfDepth * 2 + style.roofDepthOverhang) / 2;

  parts.box('bunting1', [front - back, top - bottom, halfDepth * 2], {
    position: [(front + back) / 2, (top + bottom) / 2, 0],
  });
  for (const side of SIDES) {
    const postX = front + style.postFrontOffset;
    const postZ = side * (halfDepth - frame);
    parts.box('bamboo', [style.postWidth, postHeight, frame * 2], {
      position: [postX, bottom + postHeight / 2, postZ],
    });
    parts.box('bunting3', [style.bindingWidth, style.bindingHeight, style.bindingWidth], {
      position: [postX, top - style.bindingTopInset, postZ],
    });
    for (const row of SIDES) {
      parts.box('palmLeaf', [style.roofSlopeWidth, style.roofThickness, roofPanelDepth], {
        position: [roofCenterX + side * style.roofHalfOffset, top + style.roofRise, (row * roofPanelDepth) / 2],
        rotation: [0, 0, -side * style.roofAngle],
      });
    }
  }
  parts.box('thatch', [style.ridgeWidth, style.ridgeHeight, halfDepth * 2 + style.ridgeDepthOverhang], {
    position: [roofCenterX, top + style.ridgeRise, 0],
  });
}
function isPaletteMesh(child: THREE.Object3D): boolean {
  return child instanceof THREE.Mesh && !Array.isArray(child.material) && child.material.name === 'palette';
}

export function rebuildPodium(model: THREE.Object3D): void {
  const podium = model.children.find((child) => PODIUM.test(child.name));
  if (!podium) return;
  for (const child of podium.children.filter(isPaletteMesh)) child.removeFromParent();
  const steps = collidersOf(podium)
    .filter((frame) => frame.size.x > 1)
    .sort((a, b) => b.size.y - a.size.y);
  const parts = createParts();
  for (const [index, frame] of steps.entries()) podiumStep(parts, frame, index + 1);
  podiumBackdrop(parts);
  podium.add(parts.build());
}
