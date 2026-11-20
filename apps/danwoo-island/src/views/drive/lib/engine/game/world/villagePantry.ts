import type { Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import { type PropFrame, lathe, scaleProfile } from '@views/drive/lib/engine/game/world/villageKit';
import * as THREE from 'three/webgpu';

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
