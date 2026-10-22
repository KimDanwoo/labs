'use client';

import { useFrame } from '@react-three/fiber';
import { distanceToRiver, nearestRiverX, RIVER_TRENCH_HALF_WIDTH, terrainHeightAt } from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { runnerState } from '@shared/r3f';
import { createCreatureState, habitatSeed, updateCreature } from '@shared/wildlife/behavior';
import { useRef } from 'react';
import { InstancedMesh, Object3D } from 'three';

export function Grazers() {
  const mobile = useIsCoarsePointer();
  const count = mobile ? 4 : 8;
  const fur = useRef<InstancedMesh>(null);
  const dark = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D());
  const herd = useRef(
    Array.from({ length: 8 }, (_, i) => ({
      ...createCreatureState(),
      x: -35 + Math.cos(i * 2.39996) * (5 + i),
      z: 42 + Math.sin(i * 2.39996) * (8 + i * 2),
      heading: i * 1.7,
    })),
  );
  useFrame(({ clock }, delta) => {
    if (!fur.current || !dark.current) return;
    const dt = Math.min(delta, 0.05),
      t = clock.elapsedTime,
      rider = runnerState.position;
    for (let i = 0; i < count; i++) {
      const animal = herd.current[i]!;
      if (Math.hypot(animal.x - rider.x, animal.z - rider.z) > 160) {
        const cx = Math.round(rider.x / 100),
          cz = Math.round(rider.z / 100);
        animal.x = cx * 100 + (habitatSeed(cx, cz, i + 80) - 0.5) * 160;
        animal.z = cz * 100 + (habitatSeed(cx, cz, i + 90) - 0.5) * 160;
        animal.alert = 0;
        animal.rest = 0;
      }
      if (distanceToRiver(animal.x) < RIVER_TRENCH_HALF_WIDTH + 6)
        animal.x = nearestRiverX(animal.x) - RIVER_TRENCH_HALF_WIDTH - 8;
      const y = terrainHeightAt(animal.x, animal.z);
      const distance = Math.hypot(animal.x - rider.x, y - rider.y, animal.z - rider.z);
      updateCreature(animal, distance, 12, dt);
      if (distance < 15) animal.heading = Math.atan2(animal.x - rider.x, animal.z - rider.z);
      const speed = animal.alert * 2.4;
      animal.x += Math.sin(animal.heading) * speed * dt;
      animal.z += Math.cos(animal.heading) * speed * dt;
      const grazing = (1 - animal.alert) * (0.65 + 0.35 * Math.sin(t * 0.7 + i));
      const bodyY = terrainHeightAt(animal.x, animal.z);
      const d = dummy.current;
      const part = (
        mesh: InstancedMesh,
        slot: number,
        x: number,
        py: number,
        z: number,
        sx: number,
        sy: number,
        sz: number,
      ) => {
        d.position.set(
          animal.x + x * Math.cos(animal.heading) + z * Math.sin(animal.heading),
          bodyY + py,
          animal.z - x * Math.sin(animal.heading) + z * Math.cos(animal.heading),
        );
        d.rotation.set(0, animal.heading, 0);
        d.scale.set(sx, sy, sz);
        d.updateMatrix();
        mesh.setMatrixAt(slot, d.matrix);
      };
      part(fur.current, i * 2, 0, 1.05, 0, 0.55, 0.62, 0.85);
      part(fur.current, i * 2 + 1, 0, 1.3 - grazing * 0.65, 0.8, 0.28, 0.32, 0.32);
      for (let leg = 0; leg < 4; leg++) {
        const stride = Math.sin(t * 9 + leg * Math.PI + (leg > 1 ? Math.PI : 0)) * animal.alert * 0.18;
        part(
          dark.current,
          i * 7 + leg,
          leg % 2 ? 0.32 : -0.32,
          0.35 + Math.max(0, stride),
          (leg < 2 ? 0.5 : -0.5) + stride,
          0.09,
          0.38,
          0.1,
        );
      }
      part(dark.current, i * 7 + 4, 0, 1.25 - grazing * 0.75, 1.02, 0.22, 0.18, 0.22);
      for (let ear = 0; ear < 2; ear++)
        part(dark.current, i * 7 + 5 + ear, ear ? 0.3 : -0.3, 1.45 - grazing * 0.65, 0.8, 0.19, 0.08, 0.12);
    }
    fur.current.instanceMatrix.needsUpdate = true;
    dark.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={fur} args={[undefined, undefined, count * 2]} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#d6cbb1" roughness={1} />
      </instancedMesh>
      <instancedMesh ref={dark} args={[undefined, undefined, count * 7]} frustumCulled={false} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#625b4c" roughness={1} />
      </instancedMesh>
    </group>
  );
}
