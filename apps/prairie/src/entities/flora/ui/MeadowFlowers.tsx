'use client';

import { makeFlowerGeometry } from '@entities/flora/model/services';
import { useFrame } from '@react-three/fiber';
import { distanceToRiver, RIVER_TRENCH_HALF_WIDTH, terrainHeightAt } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';

const COLORS = ['#f7eac2', '#ead2a2', '#b9add9', '#e2d8f2'].map((hex) => new Color(hex));
const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};
const TILE = 16;

// 셀마다 작은 야생화 군락. 두 번의 draw call로 그리고 강 골에는 심지 않는다.
export function MeadowFlowers() {
  const coarse = useIsCoarsePointer();
  const radius = coarse ? 2 : 3;
  const perCell = coarse ? 18 : 36;
  const capacity = (radius * 2 + 1) ** 2 * perCell;
  const stems = useRef<InstancedMesh>(null);
  const flowers = useRef<InstancedMesh>(null);
  const center = useRef({ x: NaN, z: NaN, capacity: 0 });
  const geometry = useMemo(() => makeFlowerGeometry(), []);
  const dummyRef = useRef(new Object3D());
  useFrame(({ camera }) => {
    const dummy = dummyRef.current;
    const stem = stems.current,
      flower = flowers.current;
    if (!stem || !flower) return;
    const cx = Math.floor(camera.position.x / TILE),
      cz = Math.floor(camera.position.z / TILE);
    if (cx === center.current.x && cz === center.current.z && capacity === center.current.capacity) return;
    center.current = { x: cx, z: cz, capacity };
    let count = 0;
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dz = -radius; dz <= radius; dz += 1) {
        const seed = (cx + dx) * 73.13 + (cz + dz) * 37.71;
        const patchX = (cx + dx + hash(seed)) * TILE;
        const patchZ = (cz + dz + hash(seed + 3)) * TILE;
        for (let i = 0; i < perCell; i += 1) {
          const angle = hash(seed + i * 2.7) * Math.PI * 2;
          const spread = Math.sqrt(hash(seed + i * 4.1 + 9)) * 4.5;
          const x = patchX + Math.cos(angle) * spread,
            z = patchZ + Math.sin(angle) * spread;
          if (distanceToRiver(x) < RIVER_TRENCH_HALF_WIDTH + 5) continue;
          const y = terrainHeightAt(x, z);
          const height = 0.55 + hash(seed + i * 1.1) * 0.5;
          dummy.position.set(x, y, z);
          dummy.rotation.set(0, angle, 0);
          dummy.scale.set(1, height, 1);
          dummy.updateMatrix();
          stem.setMatrixAt(count, dummy.matrix);
          dummy.position.y += height;
          dummy.rotation.set(0.12, angle, 0.16);
          dummy.scale.setScalar(0.75 + hash(seed + i * 5.3) * 0.65);
          dummy.updateMatrix();
          flower.setMatrixAt(count, dummy.matrix);
          flower.setColorAt(count, COLORS[Math.floor(hash(seed + i * 6.1) * COLORS.length)]!);
          count += 1;
        }
      }
    }
    for (const mesh of [stem, flower]) {
      mesh.count = count;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  });
  return (
    <group>
      <instancedMesh ref={stems} args={[undefined, undefined, capacity]}>
        <cylinderGeometry args={[0.008, 0.012, 1, 4]} onUpdate={(g) => g.translate(0, 0.5, 0)} />
        <meshLambertMaterial color="#526b38" />
      </instancedMesh>
      <instancedMesh ref={flowers} args={[geometry, undefined, capacity]}>
        <meshLambertMaterial />
      </instancedMesh>
    </group>
  );
}
