import * as THREE from 'three/webgpu';

import type { PartName, Parts, Triple } from './islandGeometry';
import { collidersOf, type PropFrame } from './villageKit';

const SIDES = [-1, 1] as const;

const TV_BODY = { halfWidth: 0.97, bottom: -1.15, top: 0.84, back: -0.5, front: 0.33 } as const;
const TV_SCREEN = { halfWidth: 0.71, bottom: -0.68, top: 0.55 } as const;
const TV_ISLAND = {
  rearHeightLimit: 1.5,
  rearScale: [0.8, 0.9, 0.95],
  frameOffset: 0.04,
  barWidth: 0.1,
  barDepth: 0.08,
  grilleSize: [1.2, 0.24, 0.03] satisfies Triple,
  grillePosition: [-0.12, -0.93],
  grilleOffset: 0.015,
  slatSize: [1.16, 0.025, 0.035] satisfies Triple,
  slatRows: [-0.85, -0.93, -1.01],
  slatOffset: 0.02,
  knobRadius: 0.06,
  knobDepth: 0.06,
  knobPosition: [0.79, -0.8],
  knobOffset: 0.03,
  knobSides: 8,
  roofOverhang: 0.12,
  roofHeight: 0.06,
  ribHeight: 0.02,
  ribCount: 6,
  ribWidthRatio: 0.045,
  ribDepthRatio: 0.96,
  ribSpread: 0.84,
  frontRotation: Math.PI / 2,
} as const;

export function tvCabinet(parts: Parts, container: THREE.Object3D): void {
  const { halfWidth, bottom, top, back, front } = TV_BODY;
  const design = TV_ISLAND;
  const depth = front - back;
  const centerZ = (front + back) / 2;

  parts.box('cabinetWood', [halfWidth * 2, top - bottom, depth], { position: [0, (top + bottom) / 2, centerZ] });

  const rear = collidersOf(container).find((frame) => frame.size.y < design.rearHeightLimit);
  if (rear) {
    const [scaleX, scaleY, scaleZ] = design.rearScale;
    parts.box('coconutShell', [rear.size.x * scaleX, rear.size.y * scaleY, rear.size.z * scaleZ], {
      matrix: rear.matrix,
    });
  }

  const frameZ = front + design.frameOffset;
  const bar = design.barWidth;
  const screenHeight = TV_SCREEN.top - TV_SCREEN.bottom;
  for (const y of [TV_SCREEN.top + bar / 2, TV_SCREEN.bottom - bar / 2]) {
    parts.box('bamboo', [TV_SCREEN.halfWidth * 2 + bar * 2, bar, design.barDepth], { position: [0, y, frameZ] });
  }
  for (const side of SIDES) {
    parts.box('bamboo', [bar, screenHeight, design.barDepth], {
      position: [side * (TV_SCREEN.halfWidth + bar / 2), (TV_SCREEN.top + TV_SCREEN.bottom) / 2, frameZ],
    });
  }

  const [grilleX, grilleY] = design.grillePosition;
  parts.box('bunting1', design.grilleSize, { position: [grilleX, grilleY, front + design.grilleOffset] });
  for (const y of design.slatRows) {
    parts.box('bamboo', design.slatSize, { position: [grilleX, y, front + design.slatOffset] });
  }

  const [knobX, knobY] = design.knobPosition;
  parts.prism(
    'bunting2',
    design.knobRadius,
    design.knobRadius,
    design.knobDepth,
    { position: [knobX, knobY, front + design.knobOffset], rotation: [design.frontRotation, 0, 0] },
    design.knobSides,
  );

  const roofWidth = halfWidth * 2 + design.roofOverhang;
  const roofDepth = depth + design.roofOverhang;
  parts.box('thatch', [roofWidth, design.roofHeight, roofDepth], {
    position: [0, top + design.roofHeight / 2, centerZ],
  });
  for (let index = 0; index < design.ribCount; index += 1) {
    const x = (index / (design.ribCount - 1) - 0.5) * roofWidth * design.ribSpread;
    parts.box('bamboo', [roofWidth * design.ribWidthRatio, design.ribHeight, roofDepth * design.ribDepthRatio], {
      position: [x, top + design.roofHeight + design.ribHeight / 2, centerZ],
    });
  }
}

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
