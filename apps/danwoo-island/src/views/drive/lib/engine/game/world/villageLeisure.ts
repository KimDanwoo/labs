import * as THREE from 'three/webgpu';

import type { Parts } from './islandGeometry';
import type { PartName } from './islandMaterials';
import { islandModelMesh } from './islandModels';
import { type PropFrame } from './villageKit';

const SIDES = [-1, 1] as const;
const PORTAL_BACK_Z = -0.45;
const CUBOID = /^cuboid/i;

const TROPICAL_PLATTER = {
  trayWidthRatio: 0.95,
  trayDepthRatio: 0.9,
  trayHeight: 0.05,
  trayHeightRatio: 0.16,
  rimWidthRatio: 0.025,
  rimHeightRatio: 0.08,
  rimDepthRatio: 0.86,
  rimSpread: 0.45,
  pineappleXRatio: -0.23,
  pineappleRadiusRatios: [0.16, 0.2, 0.45],
  pineappleHeightRatio: 0.63,
  pineappleTopRadiusRatio: 0.82,
  pineappleBottomRadiusRatio: 0.95,
  pineappleSides: 8,
  beltRadiusRatio: 0.98,
  beltHeightRatio: 0.08,
  beltCenterRatio: 0.48,
  crownHeightRatio: 0.28,
  crownRadiusLimit: 1.4,
  crownRadiusRatio: 0.4,
  crownSpreadRatio: 0.2,
  crownLiftRatio: 0.4,
  crownTilt: 0.35,
  crownSides: 4,
  mangoXRatio: 0.22,
  mangoZRatios: [-0.19, 0.19],
  mangoRadiusRatios: [0.18, 0.22],
  mangoHeightRatio: 0.26,
  mangoRoundness: 0.7,
  mangoSegments: [6, 4],
  mangoShades: ['mango', 'pineapple'] satisfies readonly PartName[],
} as const;

export function watermelonTray(parts: Parts, { size, matrix }: PropFrame): void {
  const design = TROPICAL_PLATTER;
  const bottom = -size.y / 2;
  const trayHeight = Math.min(design.trayHeight, size.y * design.trayHeightRatio);
  const trayTop = bottom + trayHeight;
  const availableHeight = size.y - trayHeight;
  const rimHeight = availableHeight * design.rimHeightRatio;

  parts.box('bamboo', [size.x * design.trayWidthRatio, trayHeight, size.z * design.trayDepthRatio], {
    position: [0, bottom + trayHeight / 2, 0],
    matrix,
  });
  for (const side of SIDES) {
    parts.box('coconutShell', [size.x * design.rimWidthRatio, rimHeight, size.z * design.rimDepthRatio], {
      position: [side * size.x * design.rimSpread, trayTop + rimHeight / 2, 0],
      matrix,
    });
  }

  const [radiusX, radiusZ, radiusY] = design.pineappleRadiusRatios;
  const radius = Math.min(size.x * radiusX, size.z * radiusZ, availableHeight * radiusY);
  const pineappleX = size.x * design.pineappleXRatio;
  const pineappleHeight = availableHeight * design.pineappleHeightRatio;
  const pineappleTop = trayTop + pineappleHeight;
  parts.prism(
    'pineapple',
    radius * design.pineappleTopRadiusRatio,
    radius * design.pineappleBottomRadiusRatio,
    pineappleHeight,
    { position: [pineappleX, trayTop + pineappleHeight / 2, 0], matrix },
    design.pineappleSides,
  );
  const beltRadius = radius * design.beltRadiusRatio;
  parts.prism(
    'bunting3',
    beltRadius,
    beltRadius,
    pineappleHeight * design.beltHeightRatio,
    { position: [pineappleX, trayTop + pineappleHeight * design.beltCenterRatio, 0], matrix },
    design.pineappleSides,
  );

  const crownHeight = Math.min(availableHeight * design.crownHeightRatio, radius * design.crownRadiusLimit);
  for (const side of SIDES) {
    parts.add('palmLeaf', new THREE.ConeGeometry(radius * design.crownRadiusRatio, crownHeight, design.crownSides), {
      position: [
        pineappleX + side * radius * design.crownSpreadRatio,
        pineappleTop + crownHeight * design.crownLiftRatio,
        0,
      ],
      rotation: [0, 0, side * design.crownTilt],
      matrix,
    });
  }

  const [mangoRadiusX, mangoRadiusZ] = design.mangoRadiusRatios;
  const mangoRadius = Math.min(size.x * mangoRadiusX, size.z * mangoRadiusZ);
  const mangoHeight = Math.min(availableHeight * design.mangoHeightRatio, mangoRadius * design.mangoRoundness);
  const [widthSegments, heightSegments] = design.mangoSegments;
  for (const [index, zRatio] of design.mangoZRatios.entries()) {
    parts.add(design.mangoShades[index] ?? 'mango', new THREE.SphereGeometry(1, widthSegments, heightSegments), {
      position: [size.x * design.mangoXRatio, trayTop + mangoHeight, size.z * zRatio],
      scale: [mangoRadius, mangoHeight, mangoRadius * design.mangoRoundness],
      matrix,
    });
  }
}

const BEACH_TOWEL = {
  widthRatio: 0.96,
  depthRatio: 0.92,
  thickness: 0.04,
  thicknessRatio: 0.5,
  stripeCount: 5,
  stripeSpread: 0.6,
  stripeDepthRatio: 0.07,
  stripeHeightRatio: 0.15,
  stripeShades: ['bunting1', 'bunting2', 'bunting3', 'bunting2', 'bunting1'] satisfies readonly PartName[],
  fringeX: [-0.36, -0.12, 0.12, 0.36],
  fringeWidthRatio: 0.035,
  fringeDepthRatio: 0.05,
  fringeHeightRatio: 0.5,
  fringeZRatio: 0.475,
} as const;

export function dotjari(parts: Parts, { size, matrix }: PropFrame): void {
  const design = BEACH_TOWEL;
  const bottom = -size.y / 2;
  const thickness = Math.min(design.thickness, size.y * design.thicknessRatio);
  const stripeHeight = thickness * design.stripeHeightRatio;

  parts.box('bunting4', [size.x * design.widthRatio, thickness, size.z * design.depthRatio], {
    position: [0, bottom + thickness / 2, 0],
    matrix,
  });
  for (const [index, shade] of design.stripeShades.entries()) {
    const z = (index / (design.stripeCount - 1) - 0.5) * size.z * design.stripeSpread;
    parts.box(shade, [size.x * design.widthRatio, stripeHeight, size.z * design.stripeDepthRatio], {
      position: [0, bottom + thickness + stripeHeight / 2, z],
      matrix,
    });
  }
  const fringeHeight = thickness * design.fringeHeightRatio;
  for (const side of SIDES) {
    for (const xRatio of design.fringeX) {
      parts.box('sand', [size.x * design.fringeWidthRatio, fringeHeight, size.z * design.fringeDepthRatio], {
        position: [size.x * xRatio, bottom + fringeHeight / 2, side * size.z * design.fringeZRatio],
        matrix,
      });
    }
  }
}

export function portalArch(_parts: Parts, container: THREE.Object3D): void {
  const rearColliders = container.children.filter(
    ({ name, position }) => CUBOID.test(name) && position.z < PORTAL_BACK_Z,
  );
  for (const collider of rearColliders) collider.removeFromParent();
  container.add(islandModelMesh('portalArch', null));
}
