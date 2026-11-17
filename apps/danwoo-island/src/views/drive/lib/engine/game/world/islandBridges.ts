import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

import { getGame } from '../gameContext';
import { islandModelGeometry, islandPaletteMaterial } from './islandModels';
import { BRIDGES, type BridgeSpan } from './layout/islandLayout';

const DECK = { top: 0.12, thickness: 0.3, landing: 3, segment: 2.4 } as const;
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

function bridgeGeometry(length: number): THREE.BufferGeometry {
  const count = Math.max(1, Math.round(length / DECK.segment));
  const stretch = length / (count * DECK.segment);
  const decks = Array.from({ length: count }, (_, index) => {
    const z = (index + 0.5) * DECK.segment * stretch - length / 2;
    const matrix = new THREE.Matrix4().makeTranslation(0, 0, z).scale(new THREE.Vector3(1, 1, stretch));
    return islandModelGeometry('bridgeDeck', { matrix });
  });
  const ends = [-1, 1].map((side) =>
    islandModelGeometry('bridgeEnd', { matrix: new THREE.Matrix4().makeTranslation(0, 0, (side * length) / 2) }),
  );
  const merged = mergeGeometries([...decks, ...ends]);
  if (!merged) throw new Error('다리 형상을 합치지 못했어요.');
  return merged;
}

export function placeIslandBridges(): void {
  const { objects } = getGame();
  const material = islandPaletteMaterial('bridgeDeck');
  for (const span of BRIDGES) {
    const { center, length, rotation } = spanFrame(span);
    const mesh = new THREE.Mesh(bridgeGeometry(length), material);
    mesh.name = 'islandBridge';
    objects.add(
      { model: mesh },
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
