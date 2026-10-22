'use client';

import { WingedLife } from '@entities/wildlife/ui';
import { useFrame } from '@react-three/fiber';
import { terrainHeightAt } from '@shared/config';
import { LANDMARKS } from '@shared/exploration/world';
import { useIsCoarsePointer } from '@shared/lib';
import { runnerState } from '@shared/r3f';
import { crossedArch } from '@shared/wildlife/behavior';
import { memo, useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

const silver = new Color('#dbe2c1');
const flowerColors = ['#dca9c1', '#b5a5d9', '#f4e0a8'].map((hex) => new Color(hex));

function Branch({ points, radius = 0.3, color = '#786a52' }: { points: number[][]; radius?: number; color?: string }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((p) => new Vector3(p[0], p[1], p[2]))), [points]);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 16, radius, 6, false]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function SilverLeaves() {
  const mobile = useIsCoarsePointer();
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

function ElderTree() {
  const crown = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (crown.current) crown.current.rotation.z = Math.sin(clock.elapsedTime * 0.45) * 0.012;
  });
  return (
    <>
      <Branch
        points={[
          [0, 0, 0],
          [-1.4, 4, 0.2],
          [-0.5, 9, 0],
          [2, 14, 0],
        ]}
        radius={1.5}
      />
      {Array.from({ length: 5 }, (_, i) => {
        const a = i * 1.256;
        return (
          <Branch
            key={i}
            points={[
              [0, 1, 0],
              [Math.cos(a) * 2, 0.5, Math.sin(a) * 2],
              [Math.cos(a) * 4, -0.2, Math.sin(a) * 4],
            ]}
            radius={0.45}
          />
        );
      })}
      <group ref={crown}>
        {Array.from({ length: 9 }, (_, i) => {
          const a = i * 2.39996,
            x = Math.cos(a) * (8 + (i % 3)),
            z = Math.sin(a) * (7 + (i % 4)),
            y = 13 + (i % 4);
          return (
            <group key={i}>
              <Branch
                points={[
                  [-0.5, 8 + (i % 3), 0],
                  [x * 0.45, y - 2, z * 0.4],
                  [x, y, z],
                ]}
                radius={0.35 + (i % 2) * 0.15}
              />
              <mesh position={[x, y, z]} scale={[1.6, 0.65, 1.1]} castShadow>
                <icosahedronGeometry args={[3.6, 2]} />
                <meshStandardMaterial color={i % 2 ? '#9dac88' : '#748c6a'} roughness={1} />
              </mesh>
              <mesh position={[x + 1, y + 0.9, z - 0.7]} scale={[1.5, 0.4, 1]}>
                <icosahedronGeometry args={[2.6, 1]} />
                <meshStandardMaterial color="#bcc6a3" roughness={1} />
              </mesh>
            </group>
          );
        })}
        <SilverLeaves />
      </group>
    </>
  );
}

function GardenPlanting() {
  const blooms = useRef<InstancedMesh>(null),
    stems = useRef<InstancedMesh>(null),
    leaves = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D());
  useFrame(({ clock }) => {
    if (!blooms.current || !stems.current || !leaves.current) return;
    const place = LANDMARKS[1],
      base = terrainHeightAt(place.x, place.z),
      d = dummy.current;
    for (let i = 0; i < 100; i++) {
      const patch = Math.floor(i / 20),
        a = i * 2.39996,
        spread = 0.5 + (i % 20) * 0.13;
      const x = Math.cos(patch * 1.256) * 9 + Math.cos(a) * spread;
      const z = Math.sin(patch * 1.256) * 9 + Math.sin(a) * spread;
      const ground = terrainHeightAt(place.x + x, place.z + z) - base;
      const height = 0.5 + (i % 5) * 0.12;
      d.position.set(x, ground + height * 0.5, z);
      d.rotation.set(0, a, Math.sin(clock.elapsedTime + i) * 0.06);
      d.scale.set(0.025, height, 0.025);
      d.updateMatrix();
      stems.current.setMatrixAt(i, d.matrix);
      for (let petal = 0; petal < 5; petal++) {
        const angle = petal * Math.PI * 0.4;
        d.position.set(x + Math.cos(angle) * 0.15, ground + height, z + Math.sin(angle) * 0.15);
        d.rotation.set(0.3, -angle, 0);
        d.scale.set(0.21, 0.055, 0.11);
        d.updateMatrix();
        blooms.current.setMatrixAt(i * 5 + petal, d.matrix);
        blooms.current.setColorAt(i * 5 + petal, flowerColors[patch % 3]!);
      }
      const column = Math.floor(i / 13) % 8,
        step = i % 13,
        theta = (column * Math.PI) / 4,
        vineAngle = step * 0.65;
      const columnX = Math.cos(theta) * 11,
        columnZ = Math.sin(theta) * 11;
      d.rotation.set(0, theta, column % 2 ? 0.08 : -0.04);
      d.position.set(Math.cos(vineAngle) * 0.95, (step * (2.5 + (column % 3))) / 14, Math.sin(vineAngle) * 0.95);
      d.position.applyEuler(d.rotation);
      d.position.x += columnX;
      d.position.z += columnZ;
      d.position.y += terrainHeightAt(place.x + columnX, place.z + columnZ) - base;
      d.rotation.set(0.4, vineAngle + theta, 0.5);
      d.scale.set(0.2, 0.1, 0.38);
      d.updateMatrix();
      leaves.current.setMatrixAt(i, d.matrix);
    }
    for (const mesh of [blooms.current, stems.current, leaves.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh ref={blooms} args={[undefined, undefined, 500]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={stems} args={[undefined, undefined, 100]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshStandardMaterial color="#6c8550" />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, 100]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#759267" side={DoubleSide} />
      </instancedMesh>
    </>
  );
}

function FlowerGarden() {
  return (
    <>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4,
          x = Math.cos(a) * 11,
          z = Math.sin(a) * 11,
          height = 2.5 + (i % 3);
        return (
          <group
            key={i}
            position={[
              x,
              terrainHeightAt(LANDMARKS[1].x + x, LANDMARKS[1].z + z) - terrainHeightAt(LANDMARKS[1].x, LANDMARKS[1].z),
              z,
            ]}
            rotation={[0, a, i % 2 ? 0.08 : -0.04]}
          >
            <mesh position={[0, height / 2, 0]} castShadow>
              <cylinderGeometry args={[0.75, 1, height, 7]} />
              <meshStandardMaterial color="#aaa993" roughness={1} />
            </mesh>
            <mesh position={[0.15, height, 0]} rotation={[0.08, 0.2, 0.1]} castShadow>
              <boxGeometry args={[1.9, 0.4, 1.8]} />
              <meshStandardMaterial color="#c2bba4" roughness={1} />
            </mesh>
            <Branch
              radius={0.055}
              color="#577250"
              points={Array.from({ length: 14 }, (_, j) => [
                Math.cos(j * 0.65) * 0.95,
                (j * height) / 14,
                Math.sin(j * 0.65) * 0.95,
              ])}
            />
          </group>
        );
      })}
      <GardenPlanting />
    </>
  );
}

function SunsetArch() {
  const floating = useRef<Group>(null),
    glyph = useRef<MeshBasicMaterial>(null),
    particles = useRef<InstancedMesh>(null);
  const dummy = useRef(new Object3D()),
    previous = useRef<Vector3 | null>(null),
    burst = useRef(-100);
  const place = LANDMARKS[2],
    ground = terrainHeightAt(place.x, place.z);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime,
      p = runnerState.position;
    if (previous.current && t - burst.current > 3 && crossedArch(previous.current, p, place.x, ground, place.z))
      burst.current = t;
    if (!previous.current) previous.current = new Vector3();
    previous.current.copy(p);
    const age = t - burst.current,
      glow = Math.max(0, 1 - age / 3);
    if (glyph.current) glyph.current.opacity = 0.15 + glow * 0.85;
    if (floating.current) {
      floating.current.position.y = Math.sin(t * 0.7) * 0.25;
      floating.current.rotation.y = Math.sin(t * 0.2) * 0.04;
    }
    if (!particles.current) return;
    particles.current.visible = age < 3;
    if (age >= 3) return;
    for (let i = 0; i < 64; i++) {
      const a = i * 2.39996,
        r = 2 + age * 1.8 + (i % 5);
      const d = dummy.current;
      d.position.set(Math.cos(a) * r, 3 + (i % 9) + age * 4, Math.sin(a) * r * 0.4);
      d.rotation.set(t, a, t * 0.7);
      d.scale.setScalar((0.05 + (i % 4) * 0.025) * glow);
      d.updateMatrix();
      particles.current.setMatrixAt(i, d.matrix);
    }
    particles.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          {Array.from({ length: 4 }, (_, i) => (
            <mesh
              key={i}
              position={[side * (7 + (i % 2) * 0.12), 1.1 + i * 2.2, 0]}
              rotation={[0.025 * i, side * 0.06, side * 0.025]}
              castShadow
            >
              <boxGeometry args={[3.1 - i * 0.12, 2.1, 3.4]} />
              <meshStandardMaterial color={i % 2 ? '#aaa18b' : '#bcb29b'} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: 11 }, (_, i) => {
        const a = ((i + 0.5) * Math.PI) / 11;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 7, 9 + Math.sin(a) * 7, ((i % 3) - 1) * 0.2]}
            rotation={[0, 0, a - Math.PI / 2 + (i % 2) * 0.035]}
            castShadow
          >
            <boxGeometry args={[2.1, 2.8, 3.2]} />
            <meshStandardMaterial color={i % 2 ? '#c4b79e' : '#a99d88'} roughness={1} />
          </mesh>
        );
      })}
      <group ref={floating}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={i}
            position={[Math.cos(i * 2.4) * (8 + (i % 3)), 15 + (i % 4), Math.sin(i * 2.4) * 2]}
            rotation={[i, i * 0.4, i]}
            castShadow
          >
            <dodecahedronGeometry args={[0.35 + (i % 3) * 0.2, 0]} />
            <meshStandardMaterial color="#b7b29b" roughness={1} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 9, -1.8]}>
        <torusGeometry args={[7, 0.055, 4, 48, Math.PI]} />
        <meshBasicMaterial
          ref={glyph}
          color="#ffe2a0"
          transparent
          opacity={0.15}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      <instancedMesh ref={particles} args={[undefined, undefined, 64]} frustumCulled={false} visible={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffe9af" blending={AdditiveBlending} transparent depthWrite={false} />
      </instancedMesh>
    </>
  );
}

export const LivingLandmarks = memo(function LivingLandmarks() {
  const tree = LANDMARKS[0],
    garden = LANDMARKS[1];
  return (
    <group>
      {LANDMARKS.map((place, index) => (
        <group key={place.id} position={[place.x, terrainHeightAt(place.x, place.z), place.z]}>
          {index === 0 && <ElderTree />}
          {index === 1 && <FlowerGarden />}
          {index === 2 && <SunsetArch />}
        </group>
      ))}
      <WingedLife kind="bird" anchor={[tree.x, terrainHeightAt(tree.x, tree.z) + 19, tree.z]} />
      <WingedLife kind="butterfly" anchor={[garden.x, terrainHeightAt(garden.x, garden.z), garden.z]} />
    </group>
  );
});
