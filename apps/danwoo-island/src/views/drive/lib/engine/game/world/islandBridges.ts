import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { createParts } from './islandGeometry';
import { BRIDGES, type BridgeSpan } from './layout/islandLayout';

const DECK = { top: 0.12, thickness: 0.3, landing: 3, plank: 0.55, gap: 0.08 } as const;
const RAIL = { radius: 0.07, height: 0.85, inset: 0.2, postEvery: 2.4 } as const;
const UP = new THREE.Vector3(0, 1, 0);

interface SpanFrame {
  readonly center: THREE.Vector3;
  readonly length: number;
  readonly rotation: THREE.Quaternion;
}

function spanFrame({ from, to }: BridgeSpan): SpanFrame {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  return {
    center: new THREE.Vector3((from[0] + to[0]) / 2, 0, (from[1] + to[1]) / 2),
    length: Math.hypot(dx, dz) + DECK.landing * 2,
    rotation: new THREE.Quaternion().setFromAxisAngle(UP, Math.atan2(dx, dz)),
  };
}

function bridgeVisual(width: number, length: number): THREE.Group {
  const parts = createParts();
  const planks = Math.floor(length / (DECK.plank + DECK.gap));
  const start = -((planks - 1) * (DECK.plank + DECK.gap)) / 2;
  for (let index = 0; index < planks; index += 1) {
    const z = start + index * (DECK.plank + DECK.gap);
    parts.box(index % 2 ? 'wood' : 'woodDark', [width, DECK.thickness, DECK.plank], {
      position: [0, DECK.top - DECK.thickness / 2, z],
    });
  }
  const railX = width / 2 - RAIL.inset;
  const half = length / 2;
  for (const side of [-1, 1]) {
    const x = side * railX;
    parts.rod('timber', RAIL.radius, [x, RAIL.height, -half], [x, RAIL.height, half]);
    for (let z = -half; z <= half; z += RAIL.postEvery)
      parts.rod('timber', RAIL.radius, [x, 0, z], [x, RAIL.height, z]);
  }
  return parts.build();
}

export function placeIslandBridges(): void {
  const { objects } = getGame();
  for (const span of BRIDGES) {
    const { center, length, rotation } = spanFrame(span);
    objects.add(
      { model: bridgeVisual(span.width, length) },
      {
        type: 'fixed',
        position: center,
        rotation,
        colliders: [
          {
            shape: 'cuboid',
            parameters: [span.width / 2, DECK.thickness / 2, length / 2],
            position: { x: 0, y: DECK.top - DECK.thickness / 2, z: 0 },
          },
        ],
      },
    );
  }
}
