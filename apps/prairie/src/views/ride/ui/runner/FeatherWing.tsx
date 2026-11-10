import type { Ref } from 'react';
import { DoubleSide, type BufferGeometry, type Group } from 'three';
import { shadeFeathers } from '../../lib/runner/featherSurface';
import { RUNNER_FINISH, WINGS } from '../../model/runner/constants';

type FeatherWingProps = { geometry: BufferGeometry; trimRef: Ref<Group>; mirror?: boolean };

export function FeatherWing({ geometry, trimRef, mirror = false }: FeatherWingProps) {
  return (
    <group scale={[mirror ? -1 : 1, 1, 1]}>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshPhysicalMaterial
          color={WINGS.color}
          vertexColors
          side={DoubleSide}
          roughness={0.5}
          sheen={0.75}
          sheenColor={RUNNER_FINISH.paleGold}
          sheenRoughness={0.55}
          onBeforeCompile={shadeFeathers}
        />
      </mesh>
      <group ref={trimRef} visible={false}>
        <mesh position={[0.65, 0.13, -0.1]} scale={[0.8, 0.13, 0.16]} castShadow>
          <sphereGeometry args={[1, 16, 10]} />
          <meshPhysicalMaterial color={WINGS.color} roughness={0.55} sheen={0.6} />
        </mesh>
        <mesh position={[0.22, 0.13, -0.1]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.14, 0.018, 6, 20]} />
          <meshStandardMaterial color={RUNNER_FINISH.gold} metalness={0.75} roughness={0.28} />
        </mesh>
      </group>
    </group>
  );
}
