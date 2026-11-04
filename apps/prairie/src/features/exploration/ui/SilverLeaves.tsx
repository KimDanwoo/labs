'use client';

import { useFrame } from '@react-three/fiber';
import { LANDMARKS } from '@shared/exploration/world';
import { runnerState, useLowDetail } from '@shared/r3f';

import { useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three';

const silver = new Color('#dbe2c1');
export function SilverLeaves() {
  const mobile = useLowDetail();
  const count = mobile ? 28 : 64;
  const leaves = useRef<InstancedMesh>(null);
  const driftTime = useRef(0);
  const dummy = useRef(new Object3D());
  useFrame(({ clock }, delta) => {
    if (!leaves.current) return;
    const tree = LANDMARKS[0],
      rider = runnerState.position;
    const nearby = Math.max(0, 1 - Math.hypot(rider.x - tree.x, rider.z - tree.z) / 24);
    driftTime.current += Math.min(delta, 0.05) * (0.08 + nearby * 0.12);
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const phase = (driftTime.current + i * 0.618) % 1;
      const a = i * 2.39996 + phase * 0.8;
      const d = dummy.current;
      d.position.set(Math.cos(a) * (4 + (i % 6)) + phase * 2, 15 - phase * 14, Math.sin(a) * (4 + (i % 7)));
      d.rotation.set(t + i, i, Math.sin(t * 1.3 + i));
      d.scale.set(0.15, 0.32, 0.12);
      d.updateMatrix();
      leaves.current.setMatrixAt(i, d.matrix);
      leaves.current.setColorAt(i, silver);
    }
    leaves.current.instanceMatrix.needsUpdate = true;
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={leaves} args={[undefined, undefined, count]} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.7} side={DoubleSide} />
    </instancedMesh>
  );
}
