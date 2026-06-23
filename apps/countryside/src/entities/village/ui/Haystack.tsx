import { ToonMaterial } from '@shared/r3f';
import { VILLAGE_COLORS, type HaystackPlacement } from '../model/constants';

type HaystackProps = HaystackPlacement;

export function Haystack({ position, scale }: HaystackProps) {
  return (
    <group position={[position[0], 0, position[1]]} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.1, 1.2, 1.4, 16]} />
        <ToonMaterial color={VILLAGE_COLORS.haySide} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow>
        <coneGeometry args={[1.25, 1.0, 16]} />
        <ToonMaterial color={VILLAGE_COLORS.hayTop} />
      </mesh>
    </group>
  );
}
