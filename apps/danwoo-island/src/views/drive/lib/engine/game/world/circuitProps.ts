import * as THREE from 'three/webgpu';

import { createParts, type PartName, type Parts, seededRandom } from './islandGeometry';
import { collidersOf, lathe, type PropFrame, rebuildChild, scaleProfile } from './villageKit';

const SIDES = [-1, 1] as const;
const CIRCUIT_OBJECT = /^refObjectsPhysicalDynamic/;
const CIRCUIT_OBSTACLE = /^refObstaclesPhysicalKinematicPositionBased/;
const PODIUM = /^refPodiumPhysicalFixed/;

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
  if (frame.isTube && frame.radius > 0.5) bigDok(parts, frame);
  else strawBale(parts, frame);
}

export function rebuildCircuitObjects(model: THREE.Object3D): void {
  for (const child of [...model.children]) {
    if (CIRCUIT_OBJECT.test(child.name)) rebuildChild(child, { build: circuitFiller });
    else if (CIRCUIT_OBSTACLE.test(child.name)) rebuildChild(child, { build: batdam });
  }
}

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
