import * as THREE from 'three/webgpu';

import type { Parts } from './islandGeometry';
import { collidersOf, lathe, type PropFrame, scaleProfile } from './villageKit';

const SIDES = [-1, 1] as const;

const BENCH_DESIGN = {
  seatThickness: 0.14,
  seatThicknessRatio: 0.24,
  legWidth: 0.14,
  legWidthRatio: 0.16,
  legOffsetRatio: 0.4,
  backWidthRatio: 0.45,
  backSlatHeightRatio: 0.16,
  backLevels: [-0.3, 0, 0.3],
  postWidthRatio: 0.5,
  postDepth: 0.12,
  postDepthRatio: 0.16,
} as const;

export function bench(parts: Parts, container: THREE.Object3D): void {
  const design = BENCH_DESIGN;
  const [seat, back] = collidersOf(container).sort((a, b) => b.size.x * b.size.z - a.size.x * a.size.z);
  if (!seat) return;
  const top = seat.size.y / 2;
  const seatThickness = Math.min(design.seatThickness, seat.size.y * design.seatThicknessRatio);
  const legWidth = Math.min(design.legWidth, seat.size.x * design.legWidthRatio, seat.size.z * design.legWidthRatio);

  parts.box('wood', [seat.size.x, seatThickness, seat.size.z], {
    position: [0, top - seatThickness / 2, 0],
    matrix: seat.matrix,
  });
  for (const x of SIDES) {
    for (const z of SIDES) {
      parts.box('woodDark', [legWidth, seat.size.y - seatThickness, legWidth], {
        position: [
          x * seat.size.x * design.legOffsetRatio,
          -seatThickness / 2,
          z * seat.size.z * design.legOffsetRatio,
        ],
        matrix: seat.matrix,
      });
    }
  }
  if (!back) return;

  for (const level of design.backLevels) {
    parts.box('wood', [back.size.x * design.backWidthRatio, back.size.y * design.backSlatHeightRatio, back.size.z], {
      position: [0, back.size.y * level, 0],
      matrix: back.matrix,
    });
  }
  const postDepth = Math.min(design.postDepth, back.size.z * design.postDepthRatio);
  for (const z of SIDES) {
    parts.box('woodDark', [back.size.x * design.postWidthRatio, back.size.y, postDepth], {
      position: [0, 0, (z * (back.size.z - postDepth)) / 2],
      matrix: back.matrix,
    });
  }
}

const LOG_STOOL_DESIGN = {
  radiusRatio: 0.45,
  baseRadiusRatio: 1.06,
  seatRadiusRatio: 0.92,
  seatThickness: 0.02,
  seatThicknessRatio: 0.08,
  segments: 10,
} as const;

export function logStool(parts: Parts, { size, matrix }: PropFrame): void {
  const design = LOG_STOOL_DESIGN;
  const radius = Math.min(size.x, size.z) * design.radiusRatio;
  const seatThickness = Math.min(design.seatThickness, size.y * design.seatThicknessRatio);
  parts.prism(
    'timber',
    radius,
    radius * design.baseRadiusRatio,
    size.y - seatThickness,
    { position: [0, -seatThickness / 2, 0], matrix },
    design.segments,
  );
  const seatRadius = radius * design.seatRadiusRatio;
  parts.prism(
    'sand',
    seatRadius,
    seatRadius,
    seatThickness,
    { position: [0, size.y / 2 - seatThickness / 2, 0], matrix },
    design.segments,
  );
}

const SOBAN_DESIGN = {
  topRadiusRatio: 0.96,
  undersideRadiusRatio: 0.91,
  topHeightRatio: 0.8,
  rimHeightRatio: 0.2,
  legRadius: 0.06,
  legRadiusRatio: 0.08,
  legOffsetRatio: 0.4,
  legCount: 4,
  legAngleOffset: Math.PI / 4,
  fullTurn: Math.PI * 2,
  braceWidthRatio: 0.8,
  braceDepthRatio: 0.8,
  braceThickness: 0.08,
  braceThicknessRatio: 0.12,
  topSegments: 12,
  legSegments: 8,
} as const;

export function soban(parts: Parts, container: THREE.Object3D): void {
  const design = SOBAN_DESIGN;
  const [top, base] = collidersOf(container).sort((a, b) => a.size.y - b.size.y);
  if (!top) return;
  const radius = Math.min(top.size.x, top.size.z) / 2;
  const topHeight = top.size.y * design.topHeightRatio;
  const rimHeight = top.size.y * design.rimHeightRatio;

  parts.prism(
    'bamboo',
    radius * design.topRadiusRatio,
    radius * design.undersideRadiusRatio,
    topHeight,
    { position: [0, -top.size.y / 2 + topHeight / 2, 0], matrix: top.matrix },
    design.topSegments,
  );
  parts.prism(
    'palmLeaf',
    radius,
    radius,
    rimHeight,
    { position: [0, top.size.y / 2 - rimHeight / 2, 0], matrix: top.matrix },
    design.topSegments,
  );
  if (!base) return;

  const legRadius = Math.min(
    design.legRadius,
    base.size.x * design.legRadiusRatio,
    base.size.z * design.legRadiusRatio,
  );
  for (let index = 0; index < design.legCount; index += 1) {
    const angle = (index / design.legCount) * design.fullTurn + design.legAngleOffset;
    parts.prism(
      'bamboo',
      legRadius,
      legRadius,
      base.size.y,
      {
        position: [
          Math.cos(angle) * base.size.x * design.legOffsetRatio,
          0,
          Math.sin(angle) * base.size.z * design.legOffsetRatio,
        ],
        matrix: base.matrix,
      },
      design.legSegments,
    );
  }
  const braceThickness = Math.min(design.braceThickness, base.size.y * design.braceThicknessRatio);
  parts.box('woodDark', [base.size.x * design.braceWidthRatio, braceThickness, base.size.z * design.braceDepthRatio], {
    position: [0, -base.size.y / 2 + braceThickness / 2, 0],
    matrix: base.matrix,
  });
}

const GOCHUJANG_JAR_DESIGN = {
  profile: [
    [0, 0],
    [0.7, 0],
    [0.86, 0.12],
    [0.86, 0.6],
    [0.7, 0.7],
    [0.32, 0.79],
    [0.32, 0.9],
    [0, 0.9],
  ],
  labelRadiusRatio: 0.88,
  labelHeightRatio: 0.2,
  labelLevel: 0.36,
  capRadiusRatio: 0.36,
  capHeightRatio: 0.12,
  capLevel: 0.94,
  segments: 10,
} as const;

export function gochujangJar(parts: Parts, { radius, height, matrix }: PropFrame): void {
  const design = GOCHUJANG_JAR_DESIGN;
  const bottom = -height / 2;
  lathe(parts, 'bunting2', scaleProfile(design.profile, { radius, bottom, height }), { matrix }, design.segments);
  const labelRadius = radius * design.labelRadiusRatio;
  parts.prism(
    'mango',
    labelRadius,
    labelRadius,
    height * design.labelHeightRatio,
    { position: [0, bottom + height * design.labelLevel, 0], matrix },
    design.segments,
  );
  const capRadius = radius * design.capRadiusRatio;
  parts.prism(
    'palmLeaf',
    capRadius,
    capRadius,
    height * design.capHeightRatio,
    { position: [0, bottom + height * design.capLevel, 0], matrix },
    design.segments,
  );
}

const OIL_BOTTLE_DESIGN = {
  bodyTopRadiusRatio: 0.94,
  bodyBottomRadiusRatio: 0.96,
  bodyHeightRatio: 0.62,
  bodyLevel: 0.31,
  neckRadiusRatio: 0.3,
  shoulderHeightRatio: 0.18,
  shoulderLevel: 0.71,
  capRadiusRatio: 0.32,
  capHeightRatio: 0.16,
  capLevel: 0.88,
  labelRadiusRatio: 0.98,
  labelHeightRatio: 0.22,
  labelLevel: 0.32,
  segments: 10,
  capSegments: 8,
} as const;

export function oilBottle(parts: Parts, { radius, height, matrix }: PropFrame): void {
  const design = OIL_BOTTLE_DESIGN;
  const bottom = -height / 2;
  const at = (level: number): { position: [number, number, number]; matrix: THREE.Matrix4 } => ({
    position: [0, bottom + height * level, 0],
    matrix,
  });
  parts.prism(
    'sand',
    radius * design.bodyTopRadiusRatio,
    radius * design.bodyBottomRadiusRatio,
    height * design.bodyHeightRatio,
    at(design.bodyLevel),
    design.segments,
  );
  parts.prism(
    'sand',
    radius * design.neckRadiusRatio,
    radius * design.bodyTopRadiusRatio,
    height * design.shoulderHeightRatio,
    at(design.shoulderLevel),
    design.segments,
  );
  parts.prism(
    'coconutShell',
    radius * design.capRadiusRatio,
    radius * design.capRadiusRatio,
    height * design.capHeightRatio,
    at(design.capLevel),
    design.capSegments,
  );
  parts.prism(
    'palmLeaf',
    radius * design.labelRadiusRatio,
    radius * design.labelRadiusRatio,
    height * design.labelHeightRatio,
    at(design.labelLevel),
    design.segments,
  );
}

const BAR_COUNTER_DESIGN = {
  capThickness: 0.08,
  capThicknessRatio: 0.12,
  tubeBodyRadiusRatio: 0.95,
  tubeBandRadiusRatio: 0.98,
  tubeBandHeightRatio: 0.06,
  tubeBandLevel: -0.18,
  bodyWidthRatio: 0.96,
  bodyDepthRatio: 0.96,
  slatCount: 4,
  slatWidthRatio: 0.025,
  slatHeightRatio: 0.75,
  slatDepthRatio: 0.04,
  slatFrontRatio: 0.48,
  accentWidthRatio: 0.6,
  accentHeightRatio: 0.12,
  accentDepthRatio: 0.02,
  accentLevel: 0.26,
  accentFrontRatio: 0.49,
  segments: 14,
} as const;

function barPillar(parts: Parts, { radius, height, matrix }: PropFrame): void {
  const design = BAR_COUNTER_DESIGN;
  const capThickness = Math.min(design.capThickness, height * design.capThicknessRatio);
  const bodyRadius = radius * design.tubeBodyRadiusRatio;
  const bandRadius = radius * design.tubeBandRadiusRatio;
  parts.prism(
    'bamboo',
    bodyRadius,
    bodyRadius,
    height - capThickness,
    { position: [0, -capThickness / 2, 0], matrix },
    design.segments,
  );
  parts.prism(
    'woodDark',
    radius,
    radius,
    capThickness,
    { position: [0, height / 2 - capThickness / 2, 0], matrix },
    design.segments,
  );
  parts.prism(
    'bunting1',
    bandRadius,
    bandRadius,
    height * design.tubeBandHeightRatio,
    { position: [0, height * design.tubeBandLevel, 0], matrix },
    design.segments,
  );
}

function barBlock(parts: Parts, { size, matrix }: PropFrame): void {
  const design = BAR_COUNTER_DESIGN;
  const capThickness = Math.min(design.capThickness, size.y * design.capThicknessRatio);
  parts.box('cabinetWood', [size.x * design.bodyWidthRatio, size.y - capThickness, size.z * design.bodyDepthRatio], {
    position: [0, -capThickness / 2, 0],
    matrix,
  });
  parts.box('woodDark', [size.x, capThickness, size.z], { position: [0, size.y / 2 - capThickness / 2, 0], matrix });
  for (let index = 1; index <= design.slatCount; index += 1) {
    parts.box(
      'bamboo',
      [size.x * design.slatWidthRatio, size.y * design.slatHeightRatio, size.z * design.slatDepthRatio],
      {
        position: [-size.x / 2 + (index * size.x) / (design.slatCount + 1), 0, size.z * design.slatFrontRatio],
        matrix,
      },
    );
  }
  parts.box(
    'bunting1',
    [size.x * design.accentWidthRatio, size.y * design.accentHeightRatio, size.z * design.accentDepthRatio],
    { position: [0, size.y * design.accentLevel, size.z * design.accentFrontRatio], matrix },
  );
}

export function barCounter(parts: Parts, container: THREE.Object3D): void {
  for (const frame of collidersOf(container)) {
    if (frame.isTube) barPillar(parts, frame);
    else barBlock(parts, frame);
  }
}

const MAKGEOLLI_BOWL_DESIGN = {
  profile: [
    [0, 0],
    [0.42, 0],
    [0.78, 0.14],
    [0.96, 0.44],
    [0.88, 0.72],
    [0.78, 0.72],
    [0.7, 0.28],
    [0, 0.24],
  ],
  drinkRadiusRatio: 0.79,
  drinkThicknessRatio: 0.025,
  drinkLevel: 0.64,
  strawRadiusRatio: 0.045,
  strawHeightRatio: 0.025,
  strawPoints: [
    [-0.2, 0.42, 0],
    [0.14, 0.91, 0],
    [0.42, 0.96, 0],
  ],
  segments: 12,
  strawSegments: 6,
} as const;

const UP = new THREE.Vector3(0, 1, 0);

export function makgeolliBowl(parts: Parts, { radius, height, matrix }: PropFrame): void {
  const design = MAKGEOLLI_BOWL_DESIGN;
  const bottom = -height / 2;
  lathe(parts, 'coconutShell', scaleProfile(design.profile, { radius, bottom, height }), { matrix }, design.segments);
  const drinkRadius = radius * design.drinkRadiusRatio;
  parts.prism(
    'bunting4',
    drinkRadius,
    drinkRadius,
    height * design.drinkThicknessRatio,
    { position: [0, bottom + height * design.drinkLevel, 0], matrix },
    design.segments,
  );

  const strawRadius = Math.min(radius * design.strawRadiusRatio, height * design.strawHeightRatio);
  const points = design.strawPoints.map(([x, y, z]) => new THREE.Vector3(radius * x, bottom + height * y, radius * z));
  for (const [index, to] of points.entries()) {
    const from = points[index - 1];
    if (!from) continue;
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const rotation = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize()),
    );
    parts.prism(
      'bunting1',
      strawRadius,
      strawRadius,
      length,
      { position: [midpoint.x, midpoint.y, midpoint.z], rotation: [rotation.x, rotation.y, rotation.z], matrix },
      design.strawSegments,
    );
  }
}
