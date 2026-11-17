import * as THREE from 'three/webgpu';

import {
  createParts,
  type MeshComponent,
  type PartName,
  type Parts,
  removeComponents,
  type Triple,
} from './islandGeometry';
import { islandModelMesh } from './islandModels';

type DecorationKind = 'erase' | 'tentLeg' | 'keep';
type Spot = readonly [number, number];

const SIDES = [-1, 1] as const;
const TENT_CANOPY = /^Cylinder0(22|37|39)$/;
const START_LIGHT_FRAME_LIFT = 0.45;

const box3 = (min: Triple, max: Triple): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max));

const CIRCUIT_DECORATION = {
  resetLetters: box3([-17.33, -0.03, 2.38], [-17.15, 0.47, 4.47]),
  courseBoard: box3([-18.9, -1.1, -3.1], [-17, 6.2, 5]),
  tires: [box3([-27.45, -1.05, -3.25], [-23.98, 0.5, 0.1]), box3([-2.35, -1.05, 10.9], [0.85, 0.5, 14.55])],
  clock: box3([-17.8, -1.05, 4.68], [-16.6, 0.6, 6.2]),
  gantry: box3([-14.6, -1.1, -18.3], [-0.1, 4, -14.6]),
  startLights: box3([-11.6, 2.2, -16.9], [-7.8, 3.6, -15.4]),
  tents: box3([-29, -1.1, -27], [-15, 2, -2]),
  dancerBases: [
    [-26.08, -16.23],
    [0, 0],
  ] satisfies readonly Spot[],
  bannerStands: [
    [-17.62, -15.69],
    [-17.48, -4.1],
  ] satisfies readonly Spot[],
  propReach: 0.8,
  groundPaintTop: -0.9,
  legMaxWidth: 0.25,
  legMinHeight: 1.5,
} as const;

function classifyDecoration({ box }: MeshComponent): DecorationKind {
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const design = CIRCUIT_DECORATION;
  const isProp = [...design.dancerBases, ...design.bannerStands].some(
    ([x, z]) => Math.hypot(center.x - x, center.z - z) < design.propReach,
  );
  const isMarking = [design.resetLetters, design.courseBoard, design.clock, ...design.tires].some((region) =>
    region.containsPoint(center),
  );
  const isGantryPaint =
    design.gantry.containsPoint(center) && !design.startLights.containsBox(box) && box.max.y > design.groundPaintTop;
  if (isProp || isMarking || isGantryPaint) return 'erase';
  const isThinPole = size.x < design.legMaxWidth && size.z < design.legMaxWidth && size.y > design.legMinHeight;
  if (design.tents.containsPoint(center) && isThinPole) return 'tentLeg';
  return 'keep';
}

const BYEOTGARI = {
  radius: 0.68,
  bottom: -1.01,
  height: 1.46,
  columns: [
    [-24.75, -0.65],
    [-26.68, -2.5],
    [-25.57, -1.66],
    [0.1, 13.81],
    [-1.57, 11.63],
    [-0.72, 12.81],
  ] satisfies readonly Spot[],
  sides: 8,
  flameSides: 5,
  baseHeightRatio: 0.11,
  baseTopRadiusRatio: 0.74,
  shaftBottomRatio: 0.08,
  shaftHeightRatio: 0.7,
  shaftTopRadiusRatio: 0.2,
  shaftBottomRadiusRatio: 0.24,
  bindingRadiusRatio: 0.26,
  bindingHeightRatio: 0.04,
  bindingLevels: [0.28, 0.58],
  bowlBottomRatio: 0.72,
  bowlHeightRatio: 0.16,
  bowlTopRadiusRatio: 0.54,
  bowlBottomRadiusRatio: 0.25,
  flameBottomRatio: 0.85,
  flameHeightRatio: 0.37,
  flameRadiusRatio: 0.32,
  innerFlameHeightRatio: 0.25,
  innerFlameRadiusRatio: 0.21,
  innerFlameOffsetRatio: 0.08,
} as const;

function byeotgari(parts: Parts): void {
  const style = BYEOTGARI;
  const { radius, bottom, height } = style;
  const baseHeight = height * style.baseHeightRatio;
  const shaftHeight = height * style.shaftHeightRatio;
  const bowlHeight = height * style.bowlHeightRatio;
  const flameHeight = height * style.flameHeightRatio;
  const innerFlameHeight = height * style.innerFlameHeightRatio;
  const bindingRadius = radius * style.bindingRadiusRatio;

  for (const [x, z] of style.columns) {
    parts.prism(
      'sand',
      radius * style.baseTopRadiusRatio,
      radius,
      baseHeight,
      { position: [x, bottom + baseHeight / 2, z] },
      style.sides,
    );
    parts.prism(
      'bamboo',
      radius * style.shaftTopRadiusRatio,
      radius * style.shaftBottomRadiusRatio,
      shaftHeight,
      { position: [x, bottom + height * style.shaftBottomRatio + shaftHeight / 2, z] },
      style.sides,
    );
    for (const level of style.bindingLevels) {
      parts.prism(
        'thatchRope',
        bindingRadius,
        bindingRadius,
        height * style.bindingHeightRatio,
        { position: [x, bottom + height * level, z] },
        style.sides,
      );
    }
    parts.prism(
      'coconutShell',
      radius * style.bowlTopRadiusRatio,
      radius * style.bowlBottomRadiusRatio,
      bowlHeight,
      { position: [x, bottom + height * style.bowlBottomRatio + bowlHeight / 2, z] },
      style.sides,
    );
    parts.prism(
      'bunting3',
      0,
      radius * style.flameRadiusRatio,
      flameHeight,
      { position: [x, bottom + height * style.flameBottomRatio + flameHeight / 2, z] },
      style.flameSides,
    );
    parts.prism(
      'bunting2',
      0,
      radius * style.innerFlameRadiusRatio,
      innerFlameHeight,
      {
        position: [
          x + radius * style.innerFlameOffsetRatio,
          bottom + height * style.flameBottomRatio + innerFlameHeight / 2,
          z,
        ],
      },
      style.flameSides,
    );
  }
}

const HONGSALMUN = {
  postX: [-14.2, -0.5],
  z: -16.32,
  bottom: -1,
  lowerBeam: 3.72,
  upperBeam: 4.2,
  slatTop: 4.95,
  slatGap: 0.55,
  sides: 8,
  baseTopRadius: 0.32,
  baseBottomRadius: 0.36,
  baseHeight: 0.3,
  postTopRadius: 0.18,
  postBottomRadius: 0.2,
  bindingRadius: 0.205,
  bindingHeight: 0.08,
  bindingLevels: [0.55, 2.6],
  beamRadius: 0.09,
  beamOverhang: 0.5,
  beamRotation: Math.PI / 2,
  jointRadius: 0.112,
  jointWidth: 0.06,
  flagWidth: 0.34,
  flagHeight: 0.28,
  flagDepthOffset: 0.12,
  flagShades: ['bunting1', 'bunting2', 'bunting3', 'bunting4', 'bunting5'] satisfies readonly PartName[],
  flowerTopInset: 0.23,
  flowerDepthOffset: 0.23,
  flowerOrbit: 0.12,
  flowerPetalRadius: 0.095,
  flowerCenterRadius: 0.065,
  flowerDepth: 0.04,
  flowerCenterDepthOffset: 0.025,
  flowerPetals: 5,
  flowerSides: 5,
  fullTurn: Math.PI * 2,
} as const;

function pennantGeometry(): THREE.BufferGeometry {
  const style = HONGSALMUN;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [-style.flagWidth / 2, 0, 0, 0, -style.flagHeight, 0, style.flagWidth / 2, 0, 0],
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 2, 1, 0]);
  geometry.computeVertexNormals();
  return geometry;
}

function hongsalmunPosts(parts: Parts): void {
  const style = HONGSALMUN;
  const { z, bottom, slatTop } = style;
  for (const x of style.postX) {
    parts.prism(
      'sand',
      style.baseTopRadius,
      style.baseBottomRadius,
      style.baseHeight,
      { position: [x, bottom + style.baseHeight / 2, z] },
      style.sides,
    );
    parts.prism(
      'bamboo',
      style.postTopRadius,
      style.postBottomRadius,
      slatTop - bottom,
      { position: [x, (slatTop + bottom) / 2, z] },
      style.sides,
    );
    for (const level of style.bindingLevels) {
      parts.prism(
        'thatchRope',
        style.bindingRadius,
        style.bindingRadius,
        style.bindingHeight,
        { position: [x, bottom + level, z] },
        style.sides,
      );
    }
  }
}

function hongsalmunFlowers(parts: Parts): void {
  const style = HONGSALMUN;
  const flowerY = style.slatTop - style.flowerTopInset;
  const facing = [style.beamRotation, 0, 0] as const;
  for (const [postIndex, x] of style.postX.entries()) {
    const petalShade: PartName = postIndex === 0 ? 'bunting2' : 'bunting4';
    for (let petal = 0; petal < style.flowerPetals; petal += 1) {
      const angle = (style.fullTurn * petal) / style.flowerPetals;
      parts.prism(
        petalShade,
        style.flowerPetalRadius,
        style.flowerPetalRadius,
        style.flowerDepth,
        {
          position: [
            x + Math.cos(angle) * style.flowerOrbit,
            flowerY + Math.sin(angle) * style.flowerOrbit,
            style.z + style.flowerDepthOffset,
          ],
          rotation: facing,
        },
        style.flowerSides,
      );
    }
    parts.prism(
      'bunting3',
      style.flowerCenterRadius,
      style.flowerCenterRadius,
      style.flowerDepth,
      { position: [x, flowerY, style.z + style.flowerDepthOffset + style.flowerCenterDepthOffset], rotation: facing },
      style.flowerSides,
    );
  }
}

function hongsalmun(parts: Parts): void {
  const style = HONGSALMUN;
  const { z, lowerBeam, upperBeam, slatGap } = style;
  const [left, right] = style.postX;
  const width = right - left;
  const centerX = (left + right) / 2;
  const beamRotation = [0, 0, style.beamRotation] as const;

  hongsalmunPosts(parts);
  for (const y of [lowerBeam, upperBeam]) {
    parts.prism(
      'bamboo',
      style.beamRadius,
      style.beamRadius,
      width + style.beamOverhang,
      { position: [centerX, y, z], rotation: beamRotation },
      style.sides,
    );
  }
  for (let index = 0; left + slatGap * (index + 1) < right - slatGap / 2; index += 1) {
    const x = left + slatGap * (index + 1);
    parts.prism(
      'thatchRope',
      style.jointRadius,
      style.jointRadius,
      style.jointWidth,
      { position: [x, upperBeam, z], rotation: beamRotation },
      style.sides,
    );
    parts.add(style.flagShades[index % style.flagShades.length] ?? 'bunting1', pennantGeometry(), {
      position: [x, upperBeam - style.beamRadius, z + style.flagDepthOffset],
    });
  }
  hongsalmunFlowers(parts);
}

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

function dancerChest(parts: Parts): void {
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

function bannerStand(parts: Parts): void {
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

function tentPole(parts: Parts, box: THREE.Box3): void {
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
  if (!box || !canopy.parent) return;
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
    if (child instanceof THREE.Mesh && TENT_CANOPY.test(child.name)) canopies.push(child);
  });
  for (const canopy of canopies) replaceTentCanopy(canopy);
}

function startLightFrame(): THREE.Mesh {
  const center = CIRCUIT_DECORATION.startLights.getCenter(new THREE.Vector3());
  center.y += START_LIGHT_FRAME_LIFT;
  return islandModelMesh('startLightFrame', new THREE.Matrix4().makeTranslation(center));
}

export function reshapeCircuitDecoration(model: THREE.Object3D): void {
  const decoration = model.getObjectByName('Cube088');
  if (!(decoration instanceof THREE.Mesh)) return;
  const parts = createParts();
  const removed = removeComponents(decoration, (component) => classifyDecoration(component) !== 'keep');
  for (const component of removed) {
    if (classifyDecoration(component) === 'tentLeg') tentPole(parts, component.box);
  }
  byeotgari(parts);
  dancerChest(parts);
  bannerStand(parts);
  hongsalmun(parts);
  decoration.add(parts.build(), startLightFrame());
}
