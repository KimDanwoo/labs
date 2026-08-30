import { POND, VILLAGE_COLORS } from '@entities/village/model/constants';
import { ToonMaterial } from '@shared/r3f';

export function Pond() {
  return (
    <group position={[POND.position[0], 0, POND.position[1]]}>
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[POND.radius, 40]} />
        <ToonMaterial color={VILLAGE_COLORS.pond} />
      </mesh>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[POND.radius, POND.radius + 1.6, 40]} />
        <ToonMaterial color={VILLAGE_COLORS.pondEdge} />
      </mesh>
    </group>
  );
}
