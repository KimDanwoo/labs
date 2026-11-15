import * as THREE from 'three/webgpu';

import type { PartName, Parts } from './islandGeometry';
import { lathe, type Profile, type PropFrame } from './villageKit';

const PIN_PROFILE: Profile = [
  [0, 0.02],
  [0.3, 0.02],
  [0.46, 0.55],
  [0.48, 0.85],
  [0.36, 1.45],
  [0.22, 1.85],
  [0.24, 2.2],
  [0.3, 2.5],
  [0.24, 2.8],
  [0, 2.92],
];

interface PinBand {
  readonly shade: PartName;
  readonly topRadius: number;
  readonly bottomRadius: number;
  readonly height: number;
  readonly y: number;
}

const ISLAND_PIN = {
  segments: 10,
  bands: [
    { shade: 'bunting2', topRadius: 0.24, bottomRadius: 0.245, height: 0.12, y: 1.95 },
    { shade: 'bunting1', topRadius: 0.242, bottomRadius: 0.24, height: 0.08, y: 2.08 },
  ] satisfies readonly PinBand[],
} as const;

export function bowlingPin(parts: Parts): void {
  lathe(parts, 'bunting4', PIN_PROFILE, {}, ISLAND_PIN.segments);
  for (const band of ISLAND_PIN.bands) {
    parts.prism(
      band.shade,
      band.topRadius,
      band.bottomRadius,
      band.height,
      { position: [0, band.y, 0] },
      ISLAND_PIN.segments,
    );
  }
}

const BEACH_BALL_PANELS: readonly PartName[] = ['bunting2', 'bunting4', 'bunting1', 'bunting4', 'bunting3', 'bunting4'];
const BEACH_BALL = { fullTurn: Math.PI * 2, widthSegments: 3, heightSegments: 8 } as const;

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
