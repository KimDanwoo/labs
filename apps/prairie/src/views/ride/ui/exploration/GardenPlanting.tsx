'use client';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Object3D } from 'three';
import { terrainHeightAt } from '../../config/scene';
import { LANDMARKS } from '../../model/exploration/world';

const flowerColors = ['#dca9c1', '#b5a5d9', '#f4e0a8'].map((hex) => new Color(hex));
export function GardenPlanting() {
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
