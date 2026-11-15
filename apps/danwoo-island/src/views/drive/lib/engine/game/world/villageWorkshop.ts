import * as THREE from 'three/webgpu';

import type { Parts, Triple } from './islandGeometry';
import { islandModelMesh } from './islandModels';
import { collidersOf, firstCollider, lathe, type PropFrame, referenceCenter, scaleProfile } from './villageKit';

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

const WATER_JAR_DESIGN = {
  profile: [
    [0, 0],
    [0.76, 0],
    [0.92, 0.12],
    [0.96, 0.28],
    [0.96, 0.78],
    [0.87, 1],
    [0.77, 1],
    [0.83, 0.84],
    [0, 0.84],
  ],
  waterRadiusRatio: 0.82,
  waterHeightRatio: 0.88,
  waterThicknessRatio: 0.02,
  hoopRadiusRatio: 0.98,
  hoopThicknessRatio: 0.065,
  hoopLevels: [0.25, 0.72],
  segments: 12,
} as const;

export function waterJar(parts: Parts, { size, matrix }: PropFrame): void {
  const design = WATER_JAR_DESIGN;
  const bottom = -size.y / 2;
  const height = size.y;
  const radius = Math.min(size.x, size.z) / 2;

  lathe(parts, 'wood', scaleProfile(design.profile, { radius, bottom, height }), { matrix }, design.segments);
  const waterRadius = radius * design.waterRadiusRatio;
  parts.prism(
    'lagoon',
    waterRadius,
    waterRadius,
    height * design.waterThicknessRatio,
    { position: [0, bottom + height * design.waterHeightRatio, 0], matrix },
    design.segments,
  );
  const hoopRadius = radius * design.hoopRadiusRatio;
  for (const level of design.hoopLevels) {
    parts.prism(
      'woodDark',
      hoopRadius,
      hoopRadius,
      height * design.hoopThicknessRatio,
      { position: [0, bottom + height * level, 0], matrix },
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

const CHARCOAL_FOOTPRINT = { x: 1.62, z: 1.52 } as const;

const HWARO_DESIGN = {
  top: 0.38,
  foundationHeightRatio: 0.3,
  sideThickness: 0.16,
  endThickness: 0.14,
  capThickness: 0.06,
  capDepth: 0.18,
  charcoalHeightRatio: 0.06,
  charcoalLevel: 0.32,
  emberWidthRatio: 0.64,
  emberDepthRatio: 0.64,
  emberHeightRatio: 0.02,
  emberLevel: 0.36,
  grillThickness: 0.035,
  grillDepth: 0.045,
  grillOffsets: [-0.32, -0.16, 0, 0.16, 0.32],
} as const;

export function hwaro(parts: Parts, frame: PropFrame): void {
  const { matrix } = frame;
  const design = HWARO_DESIGN;
  const size = {
    x: Math.max(frame.size.x, CHARCOAL_FOOTPRINT.x),
    y: frame.size.y,
    z: Math.max(frame.size.z, CHARCOAL_FOOTPRINT.z),
  };
  const bottom = -size.y / 2;
  const top = design.top;
  const height = top - bottom;
  const innerWidth = size.x - design.sideThickness * 2;
  const innerDepth = size.z - design.endThickness * 2;
  const capThickness = Math.min(design.capThickness, height);
  const grillThickness = Math.min(design.grillThickness, height);

  parts.box('stoneDark', [size.x, height * design.foundationHeightRatio, size.z], {
    position: [0, bottom + (height * design.foundationHeightRatio) / 2, 0],
    matrix,
  });
  for (const side of SIDES) {
    parts.box('stone', [design.sideThickness, height, size.z], {
      position: [(side * (size.x - design.sideThickness)) / 2, bottom + height / 2, 0],
      matrix,
    });
    parts.box('stone', [size.x, height, design.endThickness], {
      position: [0, bottom + height / 2, (side * (size.z - design.endThickness)) / 2],
      matrix,
    });
    parts.box('sand', [size.x, capThickness, design.capDepth], {
      position: [0, top - capThickness / 2, (side * (size.z - design.capDepth)) / 2],
      matrix,
    });
  }
  parts.box('basaltDark', [innerWidth, height * design.charcoalHeightRatio, innerDepth], {
    position: [0, bottom + height * design.charcoalLevel, 0],
    matrix,
  });
  parts.box(
    'bunting2',
    [innerWidth * design.emberWidthRatio, height * design.emberHeightRatio, innerDepth * design.emberDepthRatio],
    { position: [0, bottom + height * design.emberLevel, 0], matrix },
  );
  for (const offset of design.grillOffsets) {
    parts.box('iron', [innerWidth, grillThickness, design.grillDepth], {
      position: [0, top - grillThickness / 2, innerDepth * offset],
      matrix,
    });
  }
}

const GAMASOT_DESIGN = {
  profile: [
    [0, -0.55],
    [0.34, -0.55],
    [0.62, -0.4],
    [0.86, -0.13],
    [0.92, 0.19],
    [0.87, 0.34],
    [0.79, 0.34],
    [0.77, 0.17],
    [0.62, -0.12],
    [0, -0.24],
  ],
  rimProfile: [
    [0.79, 0.31],
    [0.87, 0.31],
    [0.89, 0.35],
    [0.86, 0.38],
    [0.78, 0.38],
    [0.79, 0.31],
  ],
  waterRadius: 0.78,
  waterThickness: 0.035,
  waterLevel: 0.205,
  handleSize: [0.16, 0.09, 0.22] satisfies Triple,
  handleOffset: 0.89,
  handleLevel: 0.15,
  segments: 14,
} as const;

export function gamasot(parts: Parts): void {
  const design = GAMASOT_DESIGN;
  lathe(parts, 'sand', design.profile, {}, design.segments);
  lathe(parts, 'bunting3', design.rimProfile, {}, design.segments);
  parts.prism(
    'lagoon',
    design.waterRadius,
    design.waterRadius,
    design.waterThickness,
    { position: [0, design.waterLevel, 0] },
    design.segments,
  );
  for (const side of SIDES) {
    parts.box('bunting4', design.handleSize, { position: [side * design.handleOffset, design.handleLevel, 0] });
  }
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
