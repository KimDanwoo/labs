import { useEffect, useMemo } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import { RUNNER_FINISH } from '../model/constants/runner';

export function HeadCrown() {
  const pieces = useMemo(() => {
    const brow = new TubeGeometry(
      new CatmullRomCurve3([
        new Vector3(-0.28, 0.25, 0.25),
        new Vector3(-0.17, 0.3, 0.35),
        new Vector3(0, 0.35, 0.39),
        new Vector3(0.17, 0.3, 0.35),
        new Vector3(0.28, 0.25, 0.25),
      ]),
      32,
      0.012,
      6,
      false,
    );
    const locks = Array.from({ length: 7 }, (_, i) => {
      const side = (i - 3) / 3;
      return new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(side * 0.04, -0.12, 0.48),
          new Vector3(side * 0.13, 0.08, 0.6),
          new Vector3(side * 0.16, 0.36, 0.38),
          new Vector3(side * 0.14, 0.55 + Math.abs(side) * 0.1, 0.22),
        ]),
        24,
        0.018 - Math.abs(side) * 0.006,
        5,
        false,
      );
    });
    return { brow, locks };
  }, []);
  useEffect(
    () => () => {
      pieces.brow.dispose();
      pieces.locks.forEach((lock) => lock.dispose());
    },
    [pieces],
  );
  return (
    <group scale={0.01}>
      <mesh geometry={pieces.brow}>
        <meshStandardMaterial color={RUNNER_FINISH.gold} metalness={0.85} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.36, 0.4]} scale={[0.075, 0.1, 0.045]}>
        <octahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial
          color={RUNNER_FINISH.opal}
          metalness={0.2}
          roughness={0.12}
          clearcoat={1}
          iridescence={0.45}
        />
      </mesh>
      {pieces.locks.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshPhysicalMaterial
            color={i % 2 ? RUNNER_FINISH.maneTip : RUNNER_FINISH.maneRoot}
            roughness={0.4}
            sheen={0.8}
            sheenColor={RUNNER_FINISH.paleGold}
          />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 0.285, 0.35, 0.205]} scale={[0.012, 0.036, 0.031]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshPhysicalMaterial color={RUNNER_FINISH.iris} roughness={0.12} clearcoat={1} clearcoatRoughness={0.06} />
          </mesh>
          <mesh position={[side * 0.297, 0.35, 0.205]} scale={[0.004, 0.022, 0.019]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshPhysicalMaterial color={RUNNER_FINISH.pupil} roughness={0.08} clearcoat={1} />
          </mesh>
          <mesh position={[side * 0.302, 0.36, 0.215]} scale={[0.003, 0.007, 0.007]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color={RUNNER_FINISH.paleGold} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
