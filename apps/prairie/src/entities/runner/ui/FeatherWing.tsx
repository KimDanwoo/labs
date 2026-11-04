import { RUNNER_FINISH, WINGS } from '@entities/runner/model/constants';
import { shadeFeathers } from '@entities/runner/model/services';
import { DoubleSide, type BufferGeometry } from 'three';

export function FeatherWing({ geometry, mirror = false }: { geometry: BufferGeometry; mirror?: boolean }) {
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
      <mesh position={[0.65, 0.13, -0.1]} scale={[0.8, 0.13, 0.16]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <meshPhysicalMaterial color={WINGS.color} roughness={0.55} sheen={0.6} />
      </mesh>
      <mesh position={[0.22, 0.13, -0.1]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.14, 0.018, 6, 20]} />
        <meshStandardMaterial color={RUNNER_FINISH.gold} metalness={0.75} roughness={0.28} />
      </mesh>
    </group>
  );
}
