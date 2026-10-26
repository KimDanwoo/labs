'use client';

import { makeBladeGeometry } from '@entities/grass/model/constants';
import { useFrame } from '@react-three/fiber';
import { coastDistanceAt, groundHeightAt, nearestRiverX, RIVER, riverWidthAt } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { useEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three';

const CAPACITY = 96;
const CELL = 24;
const hash = (n: number) => {
  const value = Math.sin(n * 127.1) * 43758.5453;
  return value - Math.floor(value);
};

// A small, deterministic pool adds irregular shoreline landmarks without a mesh per stone/stem.
export function RiverBanks() {
  const coarse = useIsCoarsePointer();
  const rocks = useRef<InstancedMesh>(null);
  const reeds = useRef<InstancedMesh>(null);
  const cell = useRef('');
  const dummy = useMemo(() => new Object3D(), []);
  const tint = useMemo(() => new Color(), []);
  const reedGeometry = useMemo(() => makeBladeGeometry(3), []);
  useEffect(() => () => reedGeometry.dispose(), [reedGeometry]);

  useFrame(({ camera }) => {
    if (!rocks.current || !reeds.current) return;
    const center = Math.round(camera.position.z / CELL);
    const river = Math.round((nearestRiverX(camera.position.x, camera.position.z) - RIVER.firstX) / RIVER.period);
    const key = `${center}:${river}:${coarse}`;
    if (key === cell.current) return;
    cell.current = key;
    let count = 0;
    const radius = coarse ? 3 : 5;
    for (let dz = -radius; dz <= radius; dz++) {
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const seed = (center + dz) * 91.7 + river * 317 + side * 17 + i * 7.3;
          const z = (center + dz) * CELL + (hash(seed) - 0.5) * CELL;
          const bank = RIVER.halfWidth + 1.2 + hash(seed + 1) * 4.2;
          const x = nearestRiverX(RIVER.firstX + river * RIVER.period, z) + side * bank * riverWidthAt(z);
          if (coastDistanceAt(x, z) > -26) continue;
          const ground = groundHeightAt(x, z);
          const size = 0.18 + hash(seed + 2) ** 3 * 0.65;
          dummy.position.set(x, ground + size * 0.12, z);
          dummy.rotation.set(hash(seed + 3) * 0.4, hash(seed + 4) * Math.PI, 0.2);
          dummy.scale.set(size * 1.5, size * 0.65, size);
          dummy.updateMatrix();
          rocks.current.setMatrixAt(count, dummy.matrix);
          tint.set('#9c9b85').multiplyScalar(0.8 + hash(seed + 5) * 0.35);
          rocks.current.setColorAt(count, tint);
          dummy.position.set(x + side * 0.65, ground + 0.02, z + 0.5);
          dummy.rotation.set(0, seed, 0);
          dummy.scale.setScalar(1.2 + hash(seed + 6) * 1.5);
          dummy.updateMatrix();
          reeds.current.setMatrixAt(count, dummy.matrix);
          tint.set(hash(seed + 7) > 0.6 ? '#8a9360' : '#526e49');
          reeds.current.setColorAt(count, tint);
          count++;
        }
      }
    }
    for (const mesh of [rocks.current, reeds.current]) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  });

  return (
    <group>
      <instancedMesh ref={rocks} args={[undefined, undefined, CAPACITY]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={reeds} args={[reedGeometry, undefined, CAPACITY]}>
        <meshLambertMaterial side={DoubleSide} />
      </instancedMesh>
    </group>
  );
}
