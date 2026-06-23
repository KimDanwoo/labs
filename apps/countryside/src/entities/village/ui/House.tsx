import { ToonMaterial } from '@shared/r3f';
import { VILLAGE_COLORS, type HousePlacement } from '../model/constants';

type HouseProps = HousePlacement;

// 벽(박스) + 4각 피라미드 지붕 + 문/창/굴뚝. 문은 로컬 +Z(정면, 길 쪽)에 둔다.
export function House({ position, rotationY, wall, roof, scale }: HouseProps) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 2.6, 3.2]} />
        <ToonMaterial color={wall} />
      </mesh>

      <mesh position={[0, 3.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[3.1, 1.8, 4]} />
        <ToonMaterial color={roof} />
      </mesh>

      <mesh position={[1.1, 3.7, 0.4]} castShadow>
        <boxGeometry args={[0.5, 1.2, 0.5]} />
        <ToonMaterial color={VILLAGE_COLORS.chimney} />
      </mesh>

      <mesh position={[0, 0.85, 1.61]}>
        <boxGeometry args={[0.9, 1.7, 0.06]} />
        <ToonMaterial color={VILLAGE_COLORS.door} />
      </mesh>

      <mesh position={[-1.2, 1.5, 1.61]}>
        <boxGeometry args={[0.8, 0.8, 0.06]} />
        <ToonMaterial color={VILLAGE_COLORS.window} emissive={VILLAGE_COLORS.window} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[1.2, 1.5, 1.61]}>
        <boxGeometry args={[0.8, 0.8, 0.06]} />
        <ToonMaterial color={VILLAGE_COLORS.window} emissive={VILLAGE_COLORS.window} emissiveIntensity={0.2} />
      </mesh>
    </group>
  );
}
