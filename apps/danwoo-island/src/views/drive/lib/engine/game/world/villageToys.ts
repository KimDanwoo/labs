import * as THREE from 'three/webgpu';

import type { Parts } from '@views/drive/lib/engine/game/world/islandGeometry';
import type { PartName } from '@views/drive/lib/engine/game/world/islandMaterials';
import type { PropFrame } from '@views/drive/lib/engine/game/world/villageKit';

const BEACH_BALL_PANELS: readonly PartName[] = ['lagoon', 'bunting4', 'bunting2', 'bunting4', 'bunting3', 'bunting4'];
const BEACH_BALL = { fullTurn: Math.PI * 2, widthSegments: 4, heightSegments: 10 } as const;

export function beachBall(parts: Parts, { size }: PropFrame): void {
  const radius = size.x / 2;
  const panel = BEACH_BALL.fullTurn / BEACH_BALL_PANELS.length;
  for (const [index, shade] of BEACH_BALL_PANELS.entries()) {
    parts.add(
      shade,
      new THREE.SphereGeometry(radius, BEACH_BALL.widthSegments, BEACH_BALL.heightSegments, index * panel, panel),
    );
  }
}

const PINWHEEL = {
  radius: 0.44,
  centerY: 0.25,
  twist: 0.16,
  blades: ['bunting2', 'bunting1', 'bunting3', 'bunting5'] satisfies readonly PartName[],
  rotationStep: Math.PI / 2,
  positionItemSize: 3,
  hubRadius: 0.05,
  hubDepth: 0.08,
  hubZ: 0.04,
  hubSides: 6,
  poleRadius: 0.03,
  poleBottom: -0.65,
  poleZ: -0.03,
} as const;

function pinwheelBlade(radius: number, twist: number): THREE.BufferGeometry {
  const root = [0, 0, 0];
  const edge = [radius, 0, 0];
  const tip = [radius, radius, twist];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([...root, ...edge, ...tip, ...root, ...tip, ...edge], PINWHEEL.positionItemSize),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function pinwheel(parts: Parts): void {
  const { radius, centerY, twist, blades } = PINWHEEL;
  for (const [index, shade] of blades.entries()) {
    parts.add(shade, pinwheelBlade(radius, twist), {
      position: [0, centerY, 0],
      rotation: [0, 0, index * PINWHEEL.rotationStep],
    });
  }
  parts.prism(
    'bunting3',
    PINWHEEL.hubRadius,
    PINWHEEL.hubRadius,
    PINWHEEL.hubDepth,
    { position: [0, centerY, PINWHEEL.hubZ], rotation: [PINWHEEL.rotationStep, 0, 0] },
    PINWHEEL.hubSides,
  );
  parts.rod('bamboo', PINWHEEL.poleRadius, [0, PINWHEEL.poleBottom, PINWHEEL.poleZ], [0, centerY, PINWHEEL.poleZ]);
}
