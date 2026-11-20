import { FEATHER_WING } from '@views/ride/config/featherWing';
import { shadeFeathers } from '@views/ride/lib/runner/featherSurface';
import { RUNNER_FINISH, WINGS } from '@views/ride/model/runner/constants';
import type { Ref } from 'react';
import { DoubleSide, type BufferGeometry, type Group } from 'three';

interface FeatherWingProps {
  geometry: BufferGeometry;
  trimRef: Ref<Group>;
  mirror?: boolean;
}

export function FeatherWing({ geometry, trimRef, mirror = false }: FeatherWingProps) {
  const { feather, trim, ring } = FEATHER_WING;
  return (
    <group scale={[mirror ? -1 : 1, 1, 1]}>
      <mesh castShadow receiveShadow geometry={geometry}>
        <meshPhysicalMaterial
          color={WINGS.color}
          vertexColors
          side={DoubleSide}
          roughness={feather.roughness}
          sheen={feather.sheen}
          sheenColor={RUNNER_FINISH.paleGold}
          sheenRoughness={feather.sheenRoughness}
          onBeforeCompile={shadeFeathers}
        />
      </mesh>
      <group ref={trimRef} visible={false}>
        <mesh position={trim.position} scale={trim.scale} castShadow>
          <sphereGeometry args={trim.geometry} />
          <meshPhysicalMaterial color={WINGS.color} roughness={trim.roughness} sheen={trim.sheen} />
        </mesh>
        <mesh position={ring.position} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={ring.geometry} />
          <meshStandardMaterial color={RUNNER_FINISH.gold} metalness={ring.metalness} roughness={ring.roughness} />
        </mesh>
      </group>
    </group>
  );
}
