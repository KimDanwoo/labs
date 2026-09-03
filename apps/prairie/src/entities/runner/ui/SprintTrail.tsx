'use client';

import { SPRINT_TRAIL } from '@entities/runner/model/constants';
import { useFrame } from '@react-three/fiber';
import { runnerState } from '@shared/r3f';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, InstancedMesh, Object3D } from 'three';

const { maxMotes } = SPRINT_TRAIL;
const dummy = new Object3D();
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 질주(Shift)·비행 중 발굽 근처에서 금빛 잔광이 튀어 뒤로 흘러간다. world 공간, 죽은 입자는 크기 0.
export function SprintTrail() {
  const meshRef = useRef<InstancedMesh>(null);
  const emitAccumulator = useRef(0);

  const motes = useMemo(
    () => ({
      position: new Float32Array(maxMotes * 3),
      velocity: new Float32Array(maxMotes * 3),
      life: new Float32Array(maxMotes),
      maxLife: new Float32Array(maxMotes),
      size: new Float32Array(maxMotes),
    }),
    [],
  );

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const mesh = meshRef.current;
    if (!mesh) return;

    const speed = runnerState.speed;
    const isFlying = runnerState.airborneHeight > SPRINT_TRAIL.flyingHeight;
    const isEmitting = isFlying || (runnerState.isSprinting && Math.abs(speed) > SPRINT_TRAIL.minSpeed);
    if (isEmitting) emitAccumulator.current += SPRINT_TRAIL.emitPerSecond * delta;

    const origin = runnerState.position;
    const backX = -Math.sin(runnerState.heading) * speed * SPRINT_TRAIL.backwardCarry;
    const backZ = -Math.cos(runnerState.heading) * speed * SPRINT_TRAIL.backwardCarry;
    const { position, velocity, life, maxLife, size } = motes;

    for (let i = 0; i < maxMotes; i += 1) {
      const p = i * 3;
      const isAlive = life[i]! > 0;

      if (!isAlive && emitAccumulator.current >= 1) {
        emitAccumulator.current -= 1;
        position[p] = origin.x + (Math.random() - 0.5) * 1.2;
        position[p + 1] = origin.y + SPRINT_TRAIL.spawnHeight + Math.random() * 0.4;
        position[p + 2] = origin.z + (Math.random() - 0.5) * 1.2;
        velocity[p] = backX + (Math.random() - 0.5) * SPRINT_TRAIL.jitter;
        velocity[p + 1] = SPRINT_TRAIL.rise * (0.5 + Math.random());
        velocity[p + 2] = backZ + (Math.random() - 0.5) * SPRINT_TRAIL.jitter;
        maxLife[i] = lerp(SPRINT_TRAIL.lifeMin, SPRINT_TRAIL.lifeMax, Math.random());
        life[i] = maxLife[i]!;
        size[i] = lerp(SPRINT_TRAIL.sizeMin, SPRINT_TRAIL.sizeMax, Math.random());
      } else if (isAlive) {
        position[p]! += velocity[p]! * delta;
        position[p + 1]! += velocity[p + 1]! * delta;
        position[p + 2]! += velocity[p + 2]! * delta;
        life[i]! -= delta;
      }

      const t = life[i]! > 0 ? life[i]! / maxLife[i]! : 0;
      dummy.position.set(position[p]!, position[p + 1]!, position[p + 2]!);
      dummy.scale.setScalar(size[i]! * t);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, maxMotes]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 4]} />
      <meshBasicMaterial color={SPRINT_TRAIL.color} transparent blending={AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  );
}
