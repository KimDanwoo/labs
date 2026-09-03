'use client';

import { WADE_SPLASH } from '@entities/runner/model/constants';
import { useFrame } from '@react-three/fiber';
import { RIVER } from '@shared/config';
import { runnerState } from '@shared/r3f';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Mesh, MeshBasicMaterial, Object3D, Vector3 } from 'three';

const WATER_Y = -RIVER.waterDrop;
const RING_Y = WATER_Y + 0.06;
const { maxDroplets, ringCount } = WADE_SPLASH;

const dummy = new Object3D();
const lookTarget = new Vector3();
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// 세기 0~1: 속도 비례, 물 밖이거나 공중이면 0.
function splashIntensity(): number {
  const speed = Math.abs(runnerState.speed);
  const isInWater = runnerState.waterDepth >= WADE_SPLASH.minDepth && runnerState.airborneHeight <= 0;
  if (!isInWater || speed < WADE_SPLASH.minSpeed) return 0;
  return Math.min(speed / WADE_SPLASH.fullSplashSpeed, 1);
}

// 물보라(속도 방향으로 늘어난 물줄기, world 공간) + 발굽에서 퍼지는 파문 링. 죽은 입자·링은 크기 0.
export function WadeSplash() {
  const dropletsRef = useRef<InstancedMesh>(null);
  const ringRefs = useRef<(Mesh | null)[]>([]);
  const emitAccumulator = useRef(0);
  const ringTimer = useRef(0);
  const nextRing = useRef(0);
  const lastLandedAt = useRef(runnerState.landedAt);

  const droplets = useMemo(
    () => ({
      position: new Float32Array(maxDroplets * 3),
      velocity: new Float32Array(maxDroplets * 3),
      life: new Float32Array(maxDroplets),
      maxLife: new Float32Array(maxDroplets),
      size: new Float32Array(maxDroplets),
    }),
    [],
  );
  const rings = useMemo(
    () => ({
      age: new Float32Array(ringCount).fill(Number.POSITIVE_INFINITY),
      materials: Array.from(
        { length: ringCount },
        () => new MeshBasicMaterial({ color: '#f4fafc', transparent: true, opacity: 0, depthWrite: false }),
      ),
    }),
    [],
  );

  useFrame((_state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const mesh = dropletsRef.current;
    if (!mesh) return;

    const intensity = splashIntensity();
    const origin = runnerState.position;
    const dirX = Math.sin(runnerState.heading);
    const dirZ = Math.cos(runnerState.heading);
    const carry = runnerState.speed * WADE_SPLASH.forwardCarry;

    emitAccumulator.current += WADE_SPLASH.emitPerSecond * intensity * delta;

    // 점프 후 물에 착지 → 한 번에 크게 터진다.
    if (runnerState.landedAt !== lastLandedAt.current) {
      lastLandedAt.current = runnerState.landedAt;
      if (runnerState.waterDepth >= WADE_SPLASH.minDepth) {
        emitAccumulator.current += WADE_SPLASH.landingBurst;
        ringTimer.current = WADE_SPLASH.ringInterval;
      }
    }
    // 물 밖에선 남은 누산기를 버린다 — 물에서 나온 뒤 잔디에서 튀는 일이 없게.
    if (runnerState.waterDepth < WADE_SPLASH.minDepth) emitAccumulator.current = 0;
    const { position, velocity, life, maxLife, size } = droplets;

    for (let i = 0; i < maxDroplets; i += 1) {
      const p = i * 3;
      const isAlive = life[i]! > 0;

      if (!isAlive && emitAccumulator.current >= 1) {
        emitAccumulator.current -= 1;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * WADE_SPLASH.spreadRadius;
        const burst = Math.max(intensity, 0.6);
        const side = Math.random() * WADE_SPLASH.sideSpeedMax * (0.4 + 0.6 * burst);
        position[p] = origin.x + Math.cos(angle) * radius;
        position[p + 1] = WATER_Y;
        position[p + 2] = origin.z + Math.sin(angle) * radius;
        velocity[p] = Math.cos(angle) * side + dirX * carry;
        velocity[p + 1] = lerp(WADE_SPLASH.upSpeedMin, WADE_SPLASH.upSpeedMax, Math.random() * burst);
        velocity[p + 2] = Math.sin(angle) * side + dirZ * carry;
        maxLife[i] = lerp(WADE_SPLASH.lifeMin, WADE_SPLASH.lifeMax, Math.random());
        life[i] = maxLife[i]!;
        size[i] = lerp(WADE_SPLASH.dropletMinSize, WADE_SPLASH.dropletMaxSize, Math.random());
      } else if (isAlive) {
        velocity[p + 1]! -= WADE_SPLASH.gravity * delta;
        position[p]! += velocity[p]! * delta;
        position[p + 1]! += velocity[p + 1]! * delta;
        position[p + 2]! += velocity[p + 2]! * delta;
        life[i]! -= delta;
        if (position[p + 1]! < WATER_Y) life[i] = 0;
      }

      if (life[i]! > 0) {
        const fade = 0.55 + 0.45 * (life[i]! / maxLife[i]!);
        const s = size[i]! * fade;
        const vx = velocity[p]!;
        const vy = velocity[p + 1]!;
        const vz = velocity[p + 2]!;
        const stretch = 1 + Math.sqrt(vx * vx + vy * vy + vz * vz) * WADE_SPLASH.stretchPerSpeed;
        dummy.position.set(position[p]!, position[p + 1]!, position[p + 2]!);
        lookTarget.set(position[p]! + vx, position[p + 1]! + vy, position[p + 2]! + vz);
        dummy.lookAt(lookTarget);
        dummy.scale.set(s, s, s * stretch);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    // 파문 링
    ringTimer.current += delta;
    const wantsRing = intensity > 0 || emitAccumulator.current >= WADE_SPLASH.landingBurst / 2;
    if (wantsRing && ringTimer.current >= WADE_SPLASH.ringInterval) {
      ringTimer.current = 0;
      const ring = ringRefs.current[nextRing.current];
      if (ring) ring.position.set(origin.x, RING_Y, origin.z);
      rings.age[nextRing.current] = 0;
      nextRing.current = (nextRing.current + 1) % ringCount;
    }
    for (let i = 0; i < ringCount; i += 1) {
      const ring = ringRefs.current[i];
      if (!ring) continue;
      rings.age[i]! += delta;
      const t = rings.age[i]! / WADE_SPLASH.ringLife;
      if (t >= 1) {
        ring.scale.setScalar(0);
        continue;
      }
      const eased = 1 - (1 - t) * (1 - t);
      ring.scale.setScalar(lerp(WADE_SPLASH.ringStartRadius, WADE_SPLASH.ringEndRadius, eased));
      rings.materials[i]!.opacity = WADE_SPLASH.ringOpacity * (1 - t) * (0.5 + 0.5 * intensity);
    }
  });

  return (
    <>
      <instancedMesh ref={dropletsRef} args={[undefined, undefined, maxDroplets]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshBasicMaterial color="#f2f9fc" transparent opacity={0.9} />
      </instancedMesh>
      {rings.materials.map((material, i) => (
        <mesh
          key={i}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0}
          material={material}
        >
          <ringGeometry args={[0.86, 1, 40]} />
        </mesh>
      ))}
    </>
  );
}
