'use client';

import { useFrame } from '@react-three/fiber';
import {
  coastDistanceAt,
  distanceToRiver,
  nearestRiverX,
  RIVER_TRENCH_HALF_WIDTH,
  riverWidthAt,
  terrainHeightAt,
} from '@shared/config';
import { useIsCoarsePointer } from '@shared/lib';
import { runnerState } from '@shared/r3f';
import { createCreatureState, habitatSeed, updateCreature } from '@shared/wildlife/behavior';
import { useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three';

type Kind = 'bird' | 'butterfly' | 'dragonfly';
const colors = ['#ebc57c', '#adbbec', '#e6a9bc', '#f4e5b8'].map((color) => new Color(color));
const wingPositions = new Float32Array([0, 0, 0, 1, 0, -0.22, 0.65, 0, 0.36]);

// Fixed instance budgets; open-world habitats recycle only beyond the near field.
export function WingedLife({ kind, anchor }: { kind: Kind; anchor?: readonly [number, number, number] }) {
  const mobile = useIsCoarsePointer();
  const count = mobile ? 10 : 22;
  const wingCount = kind === 'bird' ? 2 : 4;
  const wings = useRef<InstancedMesh>(null);
  const bodies = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D());
  const states = useRef(Array.from({ length: 22 }, createCreatureState));
  const homes = useRef(Array.from({ length: 22 }, () => ({ x: NaN, y: 0, z: 0 })));
  useFrame(({ clock }, delta) => {
    if (!wings.current || !bodies.current) return;
    const t = clock.elapsedTime;
    const rider = runnerState.position;
    const offshore = !anchor && kind === 'dragonfly' && coastDistanceAt(rider.x, rider.z) > 80;
    wings.current.visible = bodies.current.visible = !offshore;
    if (offshore) return;
    for (let i = 0; i < count; i++) {
      const home = homes.current[i]!;
      if (anchor) {
        const a = i * 2.39996;
        const spread = kind === 'bird' ? 7 + (i % 5) : 3 + (i % 9);
        home.x = anchor[0] + Math.cos(a) * spread;
        home.z = anchor[2] + Math.sin(a) * spread;
        home.y = kind === 'bird' ? anchor[1] : terrainHeightAt(home.x, home.z);
      } else if (!Number.isFinite(home.x) || Math.hypot(home.x - rider.x, home.z - rider.z) > 150) {
        const cx = Math.round(rider.x / 96),
          cz = Math.round(rider.z / 96);
        home.x = cx * 96 + (habitatSeed(cx, cz, i) - 0.5) * 180;
        home.z = cz * 96 + (habitatSeed(cx, cz, i + 32) - 0.5) * 180;
        if (kind === 'dragonfly')
          home.x =
            nearestRiverX(rider.x, home.z) +
            (i % 2 ? 1 : -1) * (RIVER_TRENCH_HALF_WIDTH + 1 + (i % 4)) * riverWidthAt(home.z);
        else if (distanceToRiver(home.x, home.z) < RIVER_TRENCH_HALF_WIDTH + 5)
          home.x = nearestRiverX(home.x, home.z) - (RIVER_TRENCH_HALF_WIDTH + 12) * riverWidthAt(home.z);
        home.z -= Math.max(0, coastDistanceAt(home.x, home.z) + 30);
        home.y = terrainHeightAt(home.x, home.z);
        states.current[i]!.alert = 0;
        states.current[i]!.rest = 0;
      }
      const state = states.current[i]!;
      updateCreature(
        state,
        Math.hypot(rider.x - home.x, rider.y - home.y, rider.z - home.z),
        kind === 'bird' ? 16 : 9,
        delta,
      );
      const alert = state.alert;
      const orbit = anchor && kind === 'bird' ? 3 : 0.4 + alert * 3;
      const phase = t * (kind === 'dragonfly' ? 1.6 : 0.5) + i * 2.4;
      const x = home.x + Math.cos(phase) * orbit;
      const z = home.z + Math.sin(phase) * orbit;
      let y = home.y + 0.4 + alert * 5;
      if (anchor && kind === 'bird') y = home.y + Math.sin(phase) * 1.4 + alert * 3;
      if (kind !== 'bird') y = home.y + 0.8 + Math.sin(phase * 2) * 0.35 + alert * 2.8;
      const scale = kind === 'bird' ? 0.65 : 0.24;
      const flap =
        Math.sin(t * (kind === 'dragonfly' ? 65 : 18) + i) * (kind === 'bird' && !anchor && alert < 0.05 ? 0.08 : 0.9);
      const d = dummy.current;
      d.position.set(x, y, z);
      d.rotation.set(0, -phase, 0);
      d.scale.set(scale * 0.14, scale * 0.16, scale * 0.7);
      d.updateMatrix();
      bodies.current.setMatrixAt(i, d.matrix);
      for (let wing = 0; wing < wingCount; wing++) {
        const side = wing % 2;
        const back = wing >= 2;
        d.position.set(x + Math.sin(phase) * (back ? 0.12 : 0), y, z - Math.cos(phase) * (back ? 0.12 : 0));
        d.rotation.set(0, -phase + side * Math.PI, flap * (side ? -1 : 1));
        d.scale.setScalar(scale * (back ? 0.75 : 1));
        d.updateMatrix();
        wings.current.setMatrixAt(i * wingCount + wing, d.matrix);
        wings.current.setColorAt(i * wingCount + wing, kind === 'butterfly' ? colors[i % colors.length]! : colors[3]!);
      }
    }
    wings.current.instanceMatrix.needsUpdate = true;
    bodies.current.instanceMatrix.needsUpdate = true;
    if (wings.current.instanceColor) wings.current.instanceColor.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={wings} args={[undefined, undefined, count * wingCount]} frustumCulled={false}>
        {kind === 'bird' && (
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[wingPositions, 3]} />
          </bufferGeometry>
        )}
        {kind !== 'bird' && (
          <circleGeometry
            args={[0.5, 12]}
            onUpdate={(g) => {
              g.rotateX(-Math.PI / 2);
              g.scale(1, 1, kind === 'dragonfly' ? 0.22 : 0.85);
              g.translate(0.45, 0, 0);
            }}
          />
        )}
        <meshBasicMaterial side={DoubleSide} transparent opacity={kind === 'dragonfly' ? 0.65 : 1} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshLambertMaterial color={kind === 'dragonfly' ? '#558f94' : '#635c50'} />
      </instancedMesh>
    </group>
  );
}
