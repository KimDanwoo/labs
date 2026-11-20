import type { Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { collidersOf, type PropFrame } from '@views/drive/lib/engine/game/world/villageKit';
import * as THREE from 'three/webgpu';

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
