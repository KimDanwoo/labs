import * as THREE from 'three/webgpu';

import type { Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { collidersOf, type PropFrame } from '@views/drive/lib/engine/game/world/villageKit';

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
